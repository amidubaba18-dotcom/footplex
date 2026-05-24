import pool from './plugins/db.js'

// ─── INPUT VALIDATION HELPERS ────────────────────────────────────────────────
function assertPositiveInteger(val, name) {
    const n = parseInt(val, 10)
    if (!Number.isFinite(n) || n <= 0 || String(n) !== String(val)) {
        throw new Error(`${name} must be a positive integer`)
    }
    return n
}

function assertNonNegativeInteger(val, name) {
    const n = parseInt(val, 10)
    if (!Number.isFinite(n) || n < 0 || String(n) !== String(val)) {
        throw new Error(`${name} must be a non-negative integer`)
    }
    return n
}

function assertValidMatchType(val, name) {
    const valid = new Set(['knockout', 'winners', 'losers', 'grand_final', 'grand_final_reset', 'group'])
    if (!valid.has(val)) {
        throw new Error(`${name} must be a valid match type`)
    }
    return val
}

// ─── WHITELISTED COLUMN MAP FOR fillSlot ────────────────────────────────────
const SLOT_COLUMNS = {
    home: 'home_team_id',
    away: 'away_team_id'
}

export const MatchService = {
    isKnockout(matchType) {
        const types = new Set(['knockout', 'winners', 'losers', 'grand_final', 'grand_final_reset'])
        return types.has(matchType)
    },

    calculateAggregate(m1, m2) {
        const scoreA = (m1.home_score || 0) + (m2.away_score || 0)
        const scoreB = (m1.away_score || 0) + (m2.home_score || 0)

        if (scoreA > scoreB) return m1.home_team_id
        if (scoreB > scoreA) return m1.away_team_id

        // Tie-breaker 1: Away Goals
        if (m2.away_score > m1.away_score) return m1.home_team_id
        if (m1.away_score > m2.away_score) return m1.away_team_id

        return null // Still tied, needs penalties
    },

    async getByTypeAndRound(tournamentId, matchType, roundNumber) {
        const tid = assertPositiveInteger(tournamentId, 'tournamentId')
        const mType = assertValidMatchType(matchType, 'matchType')
        const rNum = assertNonNegativeInteger(roundNumber, 'roundNumber')

        const result = await pool.query(
            `SELECT * FROM matches
             WHERE tournament_id=$1 AND match_type=$2 AND round_number=$3 AND group_name IS NULL
             ORDER BY match_number, id`,
            [tid, mType, rNum]
        )
        return result.rows
    },

    async fillSlot(matchId, teamId, preferredSlot = null, db = pool) {
        const mid = assertPositiveInteger(matchId, 'matchId')
        const tid = assertPositiveInteger(teamId, 'teamId')

        const matchRes = await db.query('SELECT * FROM matches WHERE id=$1', [mid])
        const match = matchRes.rows[0]
        if (!match || match.home_team_id === tid || match.away_team_id === tid) return

        // ─── SECURITY FIX: Whitelist column names instead of string interpolation ───
        let field
        if (preferredSlot && SLOT_COLUMNS[preferredSlot]) {
            field = SLOT_COLUMNS[preferredSlot]
        } else if (!match.home_team_id) {
            field = 'home_team_id'
        } else {
            field = 'away_team_id'
        }

        await db.query(
            `UPDATE matches SET ${field}=$1, is_placeholder=false WHERE id=$2`,
            [tid, mid]
        )
    },

    async advanceWinner(tournamentId, match, winnerId, db = pool) {
        const tid = assertPositiveInteger(tournamentId, 'tournamentId')
        const wid = assertPositiveInteger(winnerId, 'winnerId')
        const nextRound = match.round_number + 1

        const nextMatches = await this.getByTypeAndRound(tid, match.match_type, nextRound)
        if (nextMatches.length === 0) return false

        const currentRoundCountRes = await db.query(
            "SELECT COUNT(*) FROM matches WHERE tournament_id=$1 AND match_type=$2 AND round_number=$3 AND group_name IS NULL",
            [tid, match.match_type, match.round_number]
        )
        const currentCount = parseInt(currentRoundCountRes.rows[0].count, 10)

        const targetMatchNumber = nextMatches.length === currentCount ?
            match.match_number : Math.ceil(match.match_number / 2)

        const targetMatch = nextMatches.find(m => m.match_number === targetMatchNumber)
        const preferredSlot = nextMatches.length === currentCount ? null :
            (match.match_number % 2 === 1 ? 'home' : 'away')

        if (targetMatch) {
            await this.fillSlot(targetMatch.id, wid, preferredSlot, db)
            return true
        }
        return false
    },

    async rollbackAdvancement(tournamentId, match, winnerId, db = pool) {
        const tid = assertPositiveInteger(tournamentId, 'tournamentId')
        const wid = assertPositiveInteger(winnerId, 'winnerId')
        const nextRound = match.round_number + 1

        const nextMatches = await this.getByTypeAndRound(tid, match.match_type, nextRound)
        if (nextMatches.length === 0) return

        const currentRoundCountRes = await db.query(
            "SELECT COUNT(*) FROM matches WHERE tournament_id=$1 AND match_type=$2 AND round_number=$3 AND group_name IS NULL",
            [tid, match.match_type, match.round_number]
        )
        const currentCount = parseInt(currentRoundCountRes.rows[0].count, 10)

        const targetMatchNumber = nextMatches.length === currentCount ?
            match.match_number : Math.ceil(match.match_number / 2)

        const targetMatch = nextMatches.find(m => m.match_number === targetMatchNumber)

        if (targetMatch && targetMatch.status === 'scheduled') {
            if (targetMatch.home_team_id === wid) {
                await db.query('UPDATE matches SET home_team_id = NULL, is_placeholder = true WHERE id = $1', [targetMatch.id])
            } else if (targetMatch.away_team_id === wid) {
                await db.query('UPDATE matches SET away_team_id = NULL, is_placeholder = true WHERE id = $1', [targetMatch.id])
            }
        }
    },

    async advanceWinnersBracket(tournamentId, match, winnerTeamId, db = pool) {
        const tid = assertPositiveInteger(tournamentId, 'tournamentId')
        const wid = assertPositiveInteger(winnerTeamId, 'winnerTeamId')
        const nextRoundMatches = await this.getByTypeAndRound(tid, 'winners', match.round_number + 1)

        if (nextRoundMatches.length === 0) {
            const grandFinal = await db.query(
                "SELECT id FROM matches WHERE tournament_id=$1 AND match_type='grand_final' LIMIT 1",
                [tid]
            )
            if (grandFinal.rows[0]) {
                await this.fillSlot(grandFinal.rows[0].id, wid, 'home', db)
            }
            return
        }

        const targetMatchNumber = Math.ceil(match.match_number / 2)
        const targetMatch = nextRoundMatches.find(m => m.match_number === targetMatchNumber)
        const preferredSlot = match.match_number % 2 === 1 ? 'home' : 'away'

        if (targetMatch) {
            await this.fillSlot(targetMatch.id, wid, preferredSlot, db)
        }
    },

    async dropWinnersBracketLoser(tournamentId, match, loserTeamId, db = pool) {
        if (loserTeamId == null) return
        const tid = assertPositiveInteger(tournamentId, 'tournamentId')
        const lid = assertPositiveInteger(loserTeamId, 'loserTeamId')

        const winnersRoundResult = await db.query(
            "SELECT COALESCE(MAX(round_number), 1) AS max_round FROM matches WHERE tournament_id=$1 AND match_type='winners'",
            [tid]
        )
        const winnersRoundCount = parseInt(winnersRoundResult.rows[0].max_round, 10)

        if (winnersRoundCount === 1) {
            const grandFinal = await db.query(
                "SELECT id FROM matches WHERE tournament_id=$1 AND match_type='grand_final' LIMIT 1",
                [tid]
            )
            if (grandFinal.rows[0]) {
                await this.fillSlot(grandFinal.rows[0].id, lid, 'away', db)
            }
            return
        }

        let targetRound, targetMatchNumber, preferredSlot

        if (match.round_number === 1) {
            targetRound = 1
            targetMatchNumber = Math.ceil(match.match_number / 2)
            preferredSlot = match.match_number % 2 === 1 ? 'home' : 'away'
        } else if (match.round_number < winnersRoundCount) {
            targetRound = (match.round_number * 2) - 2
            targetMatchNumber = match.match_number
            preferredSlot = 'away'
        } else {
            targetRound = (winnersRoundCount * 2) - 2
            targetMatchNumber = 1
            preferredSlot = 'away'
        }

        const targetMatches = await this.getByTypeAndRound(tid, 'losers', targetRound)
        const targetMatch = targetMatches.find(m => m.match_number === targetMatchNumber)
        if (targetMatch) {
            await this.fillSlot(targetMatch.id, lid, preferredSlot, db)
        }
    },

    async advanceLosersBracket(tournamentId, match, winnerTeamId, db = pool) {
        const tid = assertPositiveInteger(tournamentId, 'tournamentId')
        const wid = assertPositiveInteger(winnerTeamId, 'winnerTeamId')
        const losersRoundResult = await db.query(
            "SELECT COALESCE(MAX(round_number), 0) AS max_round FROM matches WHERE tournament_id=$1 AND match_type='losers'",
            [tid]
        )
        const losersRoundCount = parseInt(losersRoundResult.rows[0].max_round, 10)

        if (losersRoundCount === 0 || match.round_number === losersRoundCount) {
            const grandFinal = await db.query(
                "SELECT id FROM matches WHERE tournament_id=$1 AND match_type='grand_final' LIMIT 1",
                [tid]
            )
            if (grandFinal.rows[0]) {
                await this.fillSlot(grandFinal.rows[0].id, wid, 'away', db)
            }
            return
        }

        const nextRound = match.round_number + 1
        const targetMatchNumber = match.round_number % 2 === 1 ? match.match_number : Math.ceil(match.match_number / 2)
        const preferredSlot = match.round_number % 2 === 1 ? 'home' : (match.match_number % 2 === 1 ? 'home' : 'away')

        const targetMatches = await this.getByTypeAndRound(tid, 'losers', nextRound)
        const targetMatch = targetMatches.find(m => m.match_number === targetMatchNumber)
        if (targetMatch) {
            await this.fillSlot(targetMatch.id, wid, preferredSlot, db)
        }
    },

    async ensureGrandFinalReset(tournamentId, homeTeamId, awayTeamId, db = pool) {
        const tid = assertPositiveInteger(tournamentId, 'tournamentId')
        const hid = assertPositiveInteger(homeTeamId, 'homeTeamId')
        const aid = assertPositiveInteger(awayTeamId, 'awayTeamId')

        const existing = await db.query(
            "SELECT id FROM matches WHERE tournament_id=$1 AND match_type='grand_final_reset' LIMIT 1",
            [tid]
        )

        if (existing.rows.length > 0) {
            await db.query(
                "UPDATE matches SET home_team_id=$1, away_team_id=$2, is_placeholder=false WHERE id=$3",
                [hid, aid, existing.rows[0].id]
            )
            return
        }

        await db.query(
            `INSERT INTO matches (tournament_id, home_team_id, away_team_id, round_number, status, match_type, match_number, is_placeholder)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [tid, hid, aid, 2, 'scheduled', 'grand_final_reset', 1, false]
        )
    },

    async processDoubleEliminationResult(tournamentId, match, winnerTeamId, loserTeamId, db = pool) {
        const tid = assertPositiveInteger(tournamentId, 'tournamentId')

        if (match.match_type === 'winners') {
            await this.advanceWinnersBracket(tid, match, winnerTeamId, db)
            await this.dropWinnersBracketLoser(tid, match, loserTeamId, db)
            return
        }

        if (match.match_type === 'losers') {
            await this.advanceLosersBracket(tid, match, winnerTeamId, db)
            return
        }

        if (match.match_type === 'grand_final') {
            const { TournamentService } = await import('./TournamentService.js')
            if (winnerTeamId === match.home_team_id) {
                await TournamentService.markCompleted(tid)
                return
            }

            await this.ensureGrandFinalReset(tid, match.home_team_id, match.away_team_id, db)
            return
        }

        if (match.match_type === 'grand_final_reset') {
            const { TournamentService } = await import('./TournamentService.js')
            await TournamentService.markCompleted(tid)
        }
    },

    async resetMatch(matchId, tournamentId, db = pool) {
        const mid = assertPositiveInteger(matchId, 'matchId')
        const tid = assertPositiveInteger(tournamentId, 'tournamentId')
        await db.query(
            `UPDATE matches
             SET home_score = NULL, away_score = NULL,
                 home_penalty_score = NULL, away_penalty_score = NULL,
                 status = 'scheduled', winner_team_id = NULL, played_at = NULL
             WHERE id = $1 AND tournament_id = $2`,
            [mid, tid]
        )
    }
}

export default MatchService