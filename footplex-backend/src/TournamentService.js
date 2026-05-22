import pool from './plugins/db.js'; // Corrected path for clarity and consistency
import { getSwissRounds } from './tournament-engine/swiss.js';
import { MatchService } from './MatchService.js'; // Import MatchService to pass to getGroupsData's standings

export const TournamentService = {
    async getForOwner(tournamentId, userId) {
        const result = await pool.query(
            'SELECT * FROM tournaments WHERE id=$1 AND organizer_id=$2',
            [tournamentId, userId]
        );
        return result.rows[0] || null;
    },

    async getConfirmedTeams(tournamentId) {
        const result = await pool.query(
            'SELECT * FROM teams WHERE tournament_id=$1 AND status=$2 ORDER BY id ASC',
            [tournamentId, 'confirmed']
        );
        return result.rows;
    },

    async markCompleted(tournamentId) {
        await pool.query(
            'UPDATE tournaments SET status=$1 WHERE id=$2',
            ['completed', tournamentId]
        );
    },

    async maybeCompleteLeague(tournamentId, format) {
        if (!['round_robin', 'swiss'].includes(format)) return;

        const pendingResult = await pool.query(
            "SELECT COUNT(*) AS count FROM matches WHERE tournament_id=$1 AND status='scheduled'",
            [tournamentId]
        );

        if (parseInt(pendingResult.rows[0].count, 10) > 0) return;

        if (format === 'swiss') {
            const teams = await this.getConfirmedTeams(tournamentId);
            const maxRounds = getSwissRounds(teams.length);
            const roundsResult = await pool.query(
                'SELECT COALESCE(MAX(round_number), 0) AS max_round FROM matches WHERE tournament_id=$1',
                [tournamentId]
            );
            if (parseInt(roundsResult.rows[0].max_round, 10) < maxRounds) return;
        }

        await this.markCompleted(tournamentId);
    },

    async getGroupsData(tournamentId, db = pool) {
        const groupsResult = await db.query(
            'SELECT DISTINCT group_name FROM matches WHERE tournament_id=$1 AND group_name IS NOT NULL ORDER BY group_name',
            [tournamentId]
        );

        const groups = [];
        for (const row of groupsResult.rows) {
            const groupName = row.group_name;
            // When getting group data, we also want group standings
            const standings = await this.getStandings(tournamentId, groupName, db);
            const fixturesResult = await db.query(
                `SELECT m.*, ht.name AS home_team_name, at.name AS away_team_name
                 FROM matches m
                 LEFT JOIN teams ht ON ht.id=m.home_team_id
                 LEFT JOIN teams at ON at.id=m.away_team_id
                 WHERE m.tournament_id=$1 AND m.group_name=$2
                 ORDER BY m.round_number, m.match_number`,
                [tournamentId, groupName]
            );

            groups.push({
                name: groupName,
                standings: standings, // Include standings here
                fixtures: fixturesResult.rows
            });
        }
        return groups;
    },

    async getStandings(tournamentId, groupName = null, db = pool) {
        const result = await db.query(
            `WITH scoped_matches AS (
                SELECT * FROM matches
                WHERE tournament_id=$1
                  AND ($2::text IS NULL OR group_name=$2)
                  AND ($2::text IS NOT NULL OR group_name IS NULL OR match_type != 'group')
            ),
            results AS (
                SELECT home_team_id AS team_id, home_score AS gf, away_score AS ga, 0 AS g_away,
                    CASE WHEN home_score>away_score THEN 3 WHEN home_score=away_score THEN 1 ELSE 0 END AS pts,
                    (home_score>away_score)::int AS won, (home_score=away_score)::int AS drawn, (home_score<away_score)::int AS lost
                FROM scoped_matches WHERE status='completed'
                UNION ALL
                SELECT away_team_id, away_score, home_score, away_score AS g_away,
                    CASE WHEN away_score>home_score THEN 3 WHEN away_score=home_score THEN 1 ELSE 0 END,
                    (away_score>home_score)::int, (away_score=home_score)::int, (away_score<home_score)::int
                FROM scoped_matches WHERE status='completed'
            )
            SELECT t.id, t.name,
                COUNT(r.team_id) AS played,
                COALESCE(SUM(r.won),0) AS won,
                COALESCE(SUM(r.drawn),0) AS drawn,
                COALESCE(SUM(r.lost),0) AS lost,
                COALESCE(SUM(r.gf),0) AS goals_for,
                COALESCE(SUM(r.ga),0) AS goals_against,
                COALESCE(SUM(r.g_away),0) AS goals_away,
                COALESCE(SUM(r.gf),0)-COALESCE(SUM(r.ga),0) AS goal_difference,
                COALESCE(SUM(r.pts),0) AS points
            FROM teams t
            LEFT JOIN results r ON r.team_id=t.id
            WHERE t.tournament_id=$1 AND t.status='confirmed'
              AND ($2::text IS NULL OR t.id IN (
                    SELECT DISTINCT home_team_id FROM scoped_matches WHERE home_team_id IS NOT NULL
                    UNION
                    SELECT DISTINCT away_team_id FROM scoped_matches WHERE away_team_id IS NOT NULL
              ))
            GROUP BY t.id, t.name
            ORDER BY points DESC, goal_difference DESC, goals_for DESC, goals_away DESC, name ASC`,
            [tournamentId, groupName]
        );
        return result.rows;
    }
};

export default TournamentService;