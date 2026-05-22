import pool from '../plugins/db.js';
import { getSwissRounds } from '../tournament-engine/swiss.js';

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
            // getStandingsRows and fixtures logic moved here or kept as shared helpers
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
                fixtures: fixturesResult.rows
                // standings calculation would follow
            });
        }
        return groups;
    }
};

export default TournamentService;