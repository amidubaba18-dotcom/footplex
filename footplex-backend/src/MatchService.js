import pool from '../plugins/db.js';

export const MatchService = {
    isKnockout(matchType) {
        const types = new Set(['knockout', 'winners', 'losers', 'grand_final', 'grand_final_reset']);
        return types.has(matchType);
    },

    calculateAggregate(m1, m2) {
        const scoreA = (m1.home_score || 0) + (m2.away_score || 0);
        const scoreB = (m1.away_score || 0) + (m2.home_score || 0);

        if (scoreA > scoreB) return m1.home_team_id;
        if (scoreB > scoreA) return m1.away_team_id;

        // Tie-breaker 1: Away Goals
        if (m2.away_score > m1.away_score) return m1.home_team_id;
        if (m1.away_score > m2.away_score) return m1.away_team_id;

        return null; // Still tied, needs penalties
    },

    async getByTypeAndRound(tournamentId, matchType, roundNumber) {
        const result = await pool.query(
            `SELECT * FROM matches 
             WHERE tournament_id=$1 AND match_type=$2 AND round_number=$3 AND group_name IS NULL 
             ORDER BY match_number, id`,
            [tournamentId, matchType, roundNumber]
        );
        return result.rows;
    },

    async fillSlot(matchId, teamId, preferredSlot = null, db = pool) {
        if (!matchId || !teamId) return;

        const matchRes = await db.query('SELECT * FROM matches WHERE id=$1', [matchId]);
        const match = matchRes.rows[0];
        if (!match || match.home_team_id === teamId || match.away_team_id === teamId) return;

        const field = preferredSlot ? `${preferredSlot}_team_id` :
            (!match.home_team_id ? 'home_team_id' : 'away_team_id');

        await db.query(
            `UPDATE matches SET ${field}=$1, is_placeholder=false WHERE id=$2`,
            [teamId, matchId]
        );
    },

    async advanceWinner(tournamentId, match, winnerId, db = pool) {
        const nextRound = match.round_number + 1;
        const nextMatches = await this.getByTypeAndRound(tournamentId, match.match_type, nextRound);

        if (nextMatches.length === 0) return false;

        const currentRoundCountRes = await db.query(
            "SELECT COUNT(*) FROM matches WHERE tournament_id=$1 AND match_type=$2 AND round_number=$3 AND group_name IS NULL",
            [tournamentId, match.match_type, match.round_number]
        );
        const currentCount = parseInt(currentRoundCountRes.rows[0].count, 10);

        const targetMatchNumber = nextMatches.length === currentCount ?
            match.match_number : Math.ceil(match.match_number / 2);

        const targetMatch = nextMatches.find(m => m.match_number === targetMatchNumber);
        const preferredSlot = nextMatches.length === currentCount ? null :
            (match.match_number % 2 === 1 ? 'home' : 'away');

        if (targetMatch) {
            await this.fillSlot(targetMatch.id, winnerId, preferredSlot, db);
            return true;
        }
        return false;
    },

    async resetMatch(matchId, tournamentId, db = pool) {
        await db.query(
            `UPDATE matches 
             SET home_score = NULL, away_score = NULL, 
                 home_penalty_score = NULL, away_penalty_score = NULL,
                 status = 'scheduled', winner_team_id = NULL, played_at = NULL 
             WHERE id = $1 AND tournament_id = $2`,
            [matchId, tournamentId]
        );
    }
};

export default MatchService;