import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import bcrypt from 'bcrypt'
import pool from './plugins/db.js'
import websocket from '@fastify/websocket'
import { MatchService } from './MatchService.js'
import { TournamentService } from './TournamentService.js'

import { generateRoundRobin } from './tournament-engine/roundRobin.js'
import { generateSingleElimination } from './tournament-engine/singleElimination.js'
import { generateDoubleElimination } from './tournament-engine/doubleElimination.js'
import { generateSwissRound, getSwissRounds } from './tournament-engine/swiss.js'
import { generateGroups, generateGroupMatches } from './tournament-engine/groupKnockout.js'

// Track active chat connections per tournament
const chatClients = new Map()

// Industrial Input Validation Schemas
const tournamentSchema = {
    body: {
        type: 'object',
        required: ['name', 'tournament_type', 'format', 'max_teams'],
        properties: {
            name: { type: 'string', minLength: 3 },
            tournament_type: { enum: ['physical', 'efootball', 'futsal'] },
            format: { type: 'string' },
            max_teams: { type: 'integer', minimum: 2 },
            group_count: { type: 'integer', minimum: 2 },
            teams_advance_per_group: { type: 'integer', minimum: 1 },
            is_double_round_robin: { type: 'boolean' },
            is_two_legged_knockout: { type: 'boolean' }
        }
    }
}

const scoreSchema = {
    body: {
        type: 'object',
        required: ['home_score', 'away_score'],
        properties: {
            home_score: { type: 'integer', minimum: 0 },
            away_score: { type: 'integer', minimum: 0 },
            home_penalty_score: { type: 'integer', minimum: 0 },
            away_penalty_score: { type: 'integer', minimum: 0 }
        }
    }
}

const app = Fastify()

const SINGLE_ELIM_FORMATS = new Set(['single_elim', 'single_elimination'])
const DOUBLE_ELIM_FORMATS = new Set(['double_elim', 'double_elimination'])
const KNOCKOUT_MATCH_TYPES = new Set([
    'knockout',
    'free_for_all', // Added free_for_all as a match type if it's considered a distinct type of match
    'winners',
    'losers',
    'grand_final',
    'grand_final_reset'
])

await app.register(cors, { origin: '*', credentials: true, methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'] })
await app.register(jwt, { secret: process.env.JWT_SECRET })
await app.register(websocket)

const authenticate = async (request, reply) => {
    try {
        await request.jwtVerify()
    } catch (err) {
        reply.status(401).send({ error: 'Unauthorized' })
    }
}

function normalizeFormat(format) {
    if (SINGLE_ELIM_FORMATS.has(format)) return 'single_elim'
    if (DOUBLE_ELIM_FORMATS.has(format)) return 'double_elim'
    if (format === 'free_for_all') return 'free_for_all' // Normalize new format
    return format
}

function buildSlug(name) {
    return `${name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}-${Date.now()}`
}

function getByeScores(match, winnerTeamId) {
    return match.home_team_id === winnerTeamId ? [1, 0] : [0, 1]
}

function getLoserTeamId(match, winnerTeamId) {
    if (winnerTeamId == null) return null
    if (match.home_team_id == null || match.away_team_id == null) return null
    return match.home_team_id === winnerTeamId ? match.away_team_id : match.home_team_id
}

function isKnockoutMatch(match) {
    return KNOCKOUT_MATCH_TYPES.has(match.match_type)
}

function isDraw(homeScore, awayScore) {
    return parseInt(homeScore, 10) === parseInt(awayScore, 10)
}

async function advanceWinnersBracketWinner(tournamentId, match, winnerTeamId) {
    const nextRoundMatches = await MatchService.getByTypeAndRound(tournamentId, 'winners', match.round_number + 1)

    if (nextRoundMatches.length === 0) {
        const grandFinal = await pool.query(
            `SELECT * FROM matches
             WHERE tournament_id=$1
               AND match_type='grand_final'
             ORDER BY id
             LIMIT 1`,
            [tournamentId]
        )

        await MatchService.fillSlot(grandFinal.rows[0].id, winnerTeamId, 'home')
        return
    }

    const targetMatchNumber = Math.ceil(match.match_number / 2)
    const targetMatch = nextRoundMatches.find(nextMatch => nextMatch.match_number === targetMatchNumber)
    const preferredSlot = match.match_number % 2 === 1 ? 'home' : 'away'

    await MatchService.fillSlot(targetMatch.id, winnerTeamId, preferredSlot)
}

async function dropWinnersBracketLoser(tournamentId, match, loserTeamId) {
    if (loserTeamId == null) return

    const winnersRoundResult = await pool.query(
        `SELECT COALESCE(MAX(round_number), 1) AS max_round
         FROM matches
         WHERE tournament_id=$1
           AND match_type='winners'`,
        [tournamentId]
    )
    const winnersRoundCount = parseInt(winnersRoundResult.rows[0].max_round, 10)

    if (winnersRoundCount === 1) {
        const grandFinal = await pool.query(
            `SELECT * FROM matches
             WHERE tournament_id=$1
               AND match_type='grand_final'
             ORDER BY id
             LIMIT 1`,
            [tournamentId]
        )
        await MatchService.fillSlot(grandFinal.rows[0].id, loserTeamId, 'away')
        return
    }

    let targetRound = null
    let targetMatchNumber = null
    let preferredSlot = null

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

    const targetMatches = await MatchService.getByTypeAndRound(tournamentId, 'losers', targetRound)
    const targetMatch = targetMatches.find(nextMatch => nextMatch.match_number === targetMatchNumber)
    await MatchService.fillSlot(targetMatch.id, loserTeamId, preferredSlot)
}

async function advanceLosersBracketWinner(tournamentId, match, winnerTeamId) {
    const losersRoundResult = await pool.query(
        `SELECT COALESCE(MAX(round_number), 0) AS max_round
         FROM matches
         WHERE tournament_id=$1
           AND match_type='losers'`,
        [tournamentId]
    )
    const losersRoundCount = parseInt(losersRoundResult.rows[0].max_round, 10)

    if (losersRoundCount === 0 || match.round_number === losersRoundCount) {
        const grandFinal = await pool.query(
            `SELECT * FROM matches
             WHERE tournament_id=$1
               AND match_type='grand_final'
             ORDER BY id
             LIMIT 1`,
            [tournamentId]
        )
        await MatchService.fillSlot(grandFinal.rows[0].id, winnerTeamId, 'away')
        return
    }

    const nextRound = match.round_number + 1
    const targetMatchNumber =
        match.round_number % 2 === 1
            ? match.match_number
            : Math.ceil(match.match_number / 2)
    const preferredSlot =
        match.round_number % 2 === 1
            ? 'home'
            : match.match_number % 2 === 1
                ? 'home'
                : 'away'

    const targetMatches = await MatchService.getByTypeAndRound(tournamentId, 'losers', nextRound)
    const targetMatch = targetMatches.find(nextMatch => nextMatch.match_number === targetMatchNumber)
    await MatchService.fillSlot(targetMatch.id, winnerTeamId, preferredSlot)
}

async function ensureGrandFinalReset(tournamentId, homeTeamId, awayTeamId) {
    const existing = await pool.query(
        `SELECT *
         FROM matches
         WHERE tournament_id=$1
           AND match_type='grand_final_reset'
         ORDER BY id
         LIMIT 1`,
        [tournamentId]
    )

    if (existing.rows.length > 0) {
        await pool.query(
            `UPDATE matches
             SET home_team_id=$1,
                 away_team_id=$2,
                 is_placeholder=false
             WHERE id=$3`,
            [homeTeamId, awayTeamId, existing.rows[0].id]
        )
        return
    }

    await pool.query(
        `INSERT INTO matches (
            tournament_id,
            home_team_id,
            away_team_id,
            round_number,
            status,
            match_type,
            match_number,
            is_placeholder
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [tournamentId, homeTeamId, awayTeamId, 2, 'scheduled', 'grand_final_reset', 1, false]
    )
}

async function processDoubleEliminationResult(tournamentId, match, winnerTeamId, loserTeamId) {
    if (match.match_type === 'winners') {
        await advanceWinnersBracketWinner(tournamentId, match, winnerTeamId)
        await dropWinnersBracketLoser(tournamentId, match, loserTeamId)
        return
    }

    if (match.match_type === 'losers') {
        await advanceLosersBracketWinner(tournamentId, match, winnerTeamId)
        return
    }

    if (match.match_type === 'grand_final') {
        if (winnerTeamId === match.home_team_id) {
            await TournamentService.markCompleted(tournamentId)
            return
        }

        await ensureGrandFinalReset(tournamentId, match.home_team_id, match.away_team_id)
        return
    }

    if (match.match_type === 'grand_final_reset') {
        await TournamentService.markCompleted(tournamentId)
    }
}

async function maybeCreateGroupKnockoutStage(tournament, db = pool) {
    const remainingGroupMatches = await db.query(
        `SELECT COUNT(*) AS count
         FROM matches
         WHERE tournament_id=$1
           AND group_name IS NOT NULL
           AND status='scheduled'`,
        [tournament.id]
    )

    if (parseInt(remainingGroupMatches.rows[0].count, 10) > 0) {
        return []
    }

    const existingKnockout = await db.query(
        `SELECT COUNT(*) AS count
         FROM matches
         WHERE tournament_id=$1
           AND group_name IS NULL
           AND match_type='knockout'`,
        [tournament.id]
    )

    if (parseInt(existingKnockout.rows[0].count, 10) > 0) {
        return []
    }

    const groups = await TournamentService.getGroupsData(tournament.id, db)
    const advancePerGroup = Math.max(1, parseInt(tournament.teams_advance_per_group, 10) || 2)
    const advancingTeams = groups
        .flatMap(group =>
            group.standings.slice(0, advancePerGroup).map((team, index) => ({
                ...team,
                group_name: group.name,
                position: index + 1
            }))
        )

    // IMPROVED SEEDING: Standard A1 vs B2, B1 vs A2 logic
    // This reorders the teams so the generator pairs Winner of one group with Runner-up of another
    const seededTeams = [];
    if (advancePerGroup === 2 && advancingTeams.length % 4 === 0) {
        for (let i = 0; i < advancingTeams.length; i += 4) {
            const a1 = advancingTeams.find(t => t.group_name === groups[i]?.name && t.position === 1);
            const b2 = advancingTeams.find(t => t.group_name === groups[i + 1]?.name && t.position === 2);
            const b1 = advancingTeams.find(t => t.group_name === groups[i + 1]?.name && t.position === 1);
            const a2 = advancingTeams.find(t => t.group_name === groups[i]?.name && t.position === 2);
            if (a1) seededTeams.push(a1);
            if (b2) seededTeams.push(b2);
            if (b1) seededTeams.push(b1);
            if (a2) seededTeams.push(a2);
        }
    }

    const finalEntrants = seededTeams.length > 0 ? seededTeams : advancingTeams;

    if (finalEntrants.length < 2) {
        await TournamentService.markCompleted(tournament.id)
        return []
    }

    const roundResult = await db.query(
        `SELECT COALESCE(MAX(round_number), 0) AS max_round
         FROM matches
         WHERE tournament_id=$1
           AND group_name IS NOT NULL`,
        [tournament.id]
    )
    const startingRound = parseInt(roundResult.rows[0].max_round, 10) + 1
    const knockoutMatches = generateSingleElimination(
        finalEntrants,
        { startingRound, matchType: 'knockout' }
    )

    return insertMatches(tournament, knockoutMatches, db)
}

async function insertMatches(tournament, matches, db = pool) {
    // If db is the pool, we should connect and start a transaction
    const client = db === pool ? await pool.connect() : db;
    const inserted = []
    try {
        if (db === pool) await client.query('BEGIN');

        for (const match of matches) {
            const isKnockout = isKnockoutMatch(match);
            const isTwoLegged = tournament.is_two_legged_knockout && isKnockout && !match.auto_winner && !match.is_placeholder;

            const createMatch = async (hId, aId, leg) => {
                const status = match.auto_winner ? 'completed' : 'scheduled'
                return client.query(
                    `INSERT INTO matches (
                    tournament_id, home_team_id, away_team_id, round_number,
                    status, match_type, match_number, is_placeholder, group_name, leg
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
                    [
                        tournament.id, hId ?? null, aId ?? null, match.round_number,
                        status, match.match_type || 'group', match.match_number ?? null,
                        match.is_placeholder || false, match.group_name || null, leg
                    ]
                )
            }

            const res1 = await createMatch(match.home_team_id, match.away_team_id, isKnockout && tournament.is_two_legged_knockout ? 1 : null)
            let insertedMatch = res1.rows[0]

            if (match.auto_winner) {
                const [homeScore, awayScore] = getByeScores(match, match.auto_winner)
                const byeUpdate = await client.query(
                    `UPDATE matches
                 SET winner_team_id=$1,
                     home_score=$2,
                     away_score=$3
                 WHERE id=$4
                 RETURNING *`,
                    [match.auto_winner, homeScore, awayScore, insertedMatch.id]
                )
                insertedMatch = byeUpdate.rows[0]
            }

            inserted.push(insertedMatch)

            if (isTwoLegged) {
                const res2 = await createMatch(match.away_team_id, match.home_team_id, 2)
                inserted.push(res2.rows[0])
            }
        }

        const format = normalizeFormat(tournament.format)
        const autoResolved = inserted.filter(match => match.status === 'completed' && match.winner_team_id)

        for (const match of autoResolved) {
            const loserTeamId = getLoserTeamId(match, match.winner_team_id)

            if (format === 'single_elim' || (format === 'group_knockout' && match.match_type === 'knockout')) {
                const hasNext = await MatchService.advanceWinner(tournament.id, match, match.winner_team_id, client)
                if (!hasNext && format !== 'group_knockout') {
                    await TournamentService.markCompleted(tournament.id)
                }
            } else if (format === 'double_elim') {
                await processDoubleEliminationResult(tournament.id, match, match.winner_team_id, loserTeamId, client)
            }
        }

        if (db === pool) await client.query('COMMIT');
        return inserted
    } catch (err) {
        if (db === pool) await client.query('ROLLBACK');
        throw err;
    } finally {
        if (db === pool) client.release();
    }
}

async function getSwissPairingStandings(tournamentId) {
    const standings = await TournamentService.getStandings(tournamentId)
    return standings.map(team => ({
        id: team.id,
        name: team.name,
        points: parseInt(team.points, 10) || 0
    }))
}

app.get('/health', async () => ({ status: 'ok' }))

app.post('/api/auth/register', async (request, reply) => {
    const { email, password, full_name } = request.body
    if (!email || !password) return reply.status(400).send({ error: 'Email and password required' })

    const hash = await bcrypt.hash(password, 10)
    try {
        const res = await pool.query(
            'INSERT INTO users (email, password_hash, full_name) VALUES ($1,$2,$3) RETURNING id,email,full_name',
            [email, hash, full_name]
        )
        const token = app.jwt.sign({ id: res.rows[0].id, email: res.rows[0].email })
        return { user: res.rows[0], token }
    } catch (err) {
        if (err.code === '23505') return reply.status(400).send({ error: 'Email already exists' })
        throw err
    }
})

app.post('/api/auth/login', async (request, reply) => {
    const { email, password } = request.body
    if (!email || !password) return reply.status(400).send({ error: 'Email and password required' })

    const res = await pool.query('SELECT * FROM users WHERE email=$1', [email])
    if (res.rows.length === 0) return reply.status(401).send({ error: 'Invalid email or password' })

    const user = res.rows[0]
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) return reply.status(401).send({ error: 'Invalid email or password' })

    const token = app.jwt.sign({ id: user.id, email: user.email })
    return { user: { id: user.id, email: user.email, full_name: user.full_name }, token }
})

app.get('/api/auth/me', { preHandler: authenticate }, async request => {
    const res = await pool.query('SELECT id,email,full_name,role FROM users WHERE id=$1', [request.user.id])
    return { user: res.rows[0] }
})

app.post('/api/tournaments', { preHandler: authenticate, schema: tournamentSchema }, async request => {
    const {
        name,
        tournament_type,
        format,
        max_teams,
        description,
        start_date,
        end_date,
        group_count,
        teams_advance_per_group,
        is_double_round_robin,
        is_two_legged_knockout
    } = request.body

    const res = await pool.query(
        `INSERT INTO tournaments (
            organizer_id,
            name,
            slug,
            tournament_type,
            format,
            status,
            max_teams,
            description,
            start_date,
            end_date,
            group_count,
            teams_advance_per_group,
            is_double_round_robin,
            is_two_legged_knockout
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
        [
            request.user.id,
            name,
            buildSlug(name),
            tournament_type,
            format,
            'registration',
            max_teams,
            description || null,
            start_date || null,
            end_date || null,
            group_count || 2,
            teams_advance_per_group || 2,
            is_double_round_robin || false,
            is_two_legged_knockout || false
        ]
    )

    return { tournament: res.rows[0] }
})

app.get('/api/tournaments/my', { preHandler: authenticate }, async request => {
    const res = await pool.query(
        `SELECT t.*, u.full_name AS organizer_name
         FROM tournaments t
         JOIN users u ON u.id=t.organizer_id
         WHERE t.organizer_id=$1
         ORDER BY t.created_at DESC`,
        [request.user.id]
    )
    return { tournaments: res.rows }
})

app.get('/api/tournaments', async () => {
    const res = await pool.query(
        `SELECT t.*, u.full_name AS organizer_name
         FROM tournaments t
         JOIN users u ON u.id=t.organizer_id
         WHERE t.status IN ('registration', 'active')
         ORDER BY t.created_at DESC
         LIMIT 20`
    )
    return { tournaments: res.rows }
})

app.get('/api/tournaments/:slug', async (request, reply) => {
    const res = await pool.query(
        `SELECT t.*, u.full_name AS organizer_name
         FROM tournaments t
         JOIN users u ON u.id=t.organizer_id
         WHERE t.slug=$1`,
        [request.params.slug]
    )
    if (res.rows.length === 0) return reply.status(404).send({ error: 'Not found' })
    return { tournament: res.rows[0] }
})

app.patch('/api/tournaments/:id/status', { preHandler: authenticate }, async (request, reply) => {
    const { status } = request.body
    const id = parseInt(request.params.id, 10)

    const tournament = await TournamentService.getForOwner(id, request.user.id)
    if (!tournament) return reply.status(403).send({ error: 'Not authorized' })

    const res = await pool.query(
        'UPDATE tournaments SET status=$1 WHERE id=$2 RETURNING *',
        [status, id]
    )
    return { tournament: res.rows[0] }
})

app.delete('/api/tournaments/:id', { preHandler: authenticate }, async (request, reply) => {
    const id = parseInt(request.params.id, 10)
    const tournament = await TournamentService.getForOwner(id, request.user.id)
    if (!tournament) return reply.status(403).send({ error: 'Not authorized' })

    await pool.query('DELETE FROM tournaments WHERE id=$1', [id])
    return { message: 'Deleted' }
})

app.post('/api/tournaments/:id/teams', { preHandler: authenticate }, async (request, reply) => {
    const { name, contact_name, contact_email } = request.body
    const tournamentId = parseInt(request.params.id, 10)

    if (!name?.trim()) return reply.status(400).send({ error: 'Team name required' })

    const tournament = await TournamentService.getForOwner(tournamentId, request.user.id)
    if (!tournament) return reply.status(403).send({ error: 'Not authorized' })

    const currentCount = await pool.query(
        `SELECT COUNT(*) AS count
         FROM teams
         WHERE tournament_id=$1
           AND status='confirmed'`,
        [tournamentId]
    )

    if (parseInt(currentCount.rows[0].count, 10) >= tournament.max_teams) {
        return reply.status(400).send({ error: 'Tournament is full' })
    }

    const result = await pool.query(
        `INSERT INTO teams (tournament_id, name, contact_name, contact_email, status)
         VALUES ($1,$2,$3,$4,'confirmed') RETURNING *`,
        [tournamentId, name.trim(), contact_name?.trim() || null, contact_email?.trim() || null]
    )

    return { team: result.rows[0] }
})

app.post('/api/tournaments/:id/teams/request', async (request, reply) => {
    const { name, contact_name, contact_email } = request.body
    const tournamentId = parseInt(request.params.id, 10)

    if (!name?.trim()) return reply.status(400).send({ error: 'Team name required' })

    const tournamentResult = await pool.query('SELECT * FROM tournaments WHERE id=$1', [tournamentId])
    if (tournamentResult.rows.length === 0) return reply.status(404).send({ error: 'Tournament not found' })

    const tournament = tournamentResult.rows[0]
    if (tournament.status === 'draft') return reply.status(400).send({ error: 'Tournament not open yet' })

    const existingTeams = await pool.query(
        `SELECT COUNT(*) AS count
         FROM teams
         WHERE tournament_id=$1
           AND status IN ('confirmed', 'pending')`,
        [tournamentId]
    )

    if (parseInt(existingTeams.rows[0].count, 10) >= tournament.max_teams) {
        return reply.status(400).send({ error: 'Tournament is full' })
    }

    const result = await pool.query(
        `INSERT INTO teams (tournament_id, name, contact_name, contact_email, status)
         VALUES ($1,$2,$3,$4,'pending') RETURNING *`,
        [tournamentId, name.trim(), contact_name?.trim() || null, contact_email?.trim() || null]
    )

    return { team: result.rows[0], message: 'Team request submitted!' }
})

app.get('/api/tournaments/:id/teams', async request => {
    const tournamentId = parseInt(request.params.id, 10)
    const result = await pool.query(
        'SELECT * FROM teams WHERE tournament_id=$1 ORDER BY created_at',
        [tournamentId]
    )
    return { teams: result.rows }
})

app.patch('/api/tournaments/:id/teams/:teamId', { preHandler: authenticate }, async (request, reply) => {
    const { action } = request.body
    const tournamentId = parseInt(request.params.id, 10)
    const teamId = parseInt(request.params.teamId, 10)

    const tournament = await TournamentService.getForOwner(tournamentId, request.user.id)
    if (!tournament) return reply.status(403).send({ error: 'Not authorized' })

    const result = await pool.query(
        'UPDATE teams SET status=$1 WHERE id=$2 AND tournament_id=$3 RETURNING *',
        [action === 'approve' ? 'confirmed' : 'rejected', teamId, tournamentId]
    )

    return { team: result.rows[0] }
})

app.post('/api/tournaments/:id/generate', { preHandler: authenticate }, async (request, reply) => {
    const tournamentId = parseInt(request.params.id, 10)
    const tournament = await TournamentService.getForOwner(tournamentId, request.user.id)
    if (!tournament) return reply.status(403).send({ error: 'Not authorized' })

    const teams = await TournamentService.getConfirmedTeams(tournamentId)
    if (teams.length < 2) return reply.status(400).send({ error: 'Need at least 2 confirmed teams' })

    const format = normalizeFormat(tournament.format)
    let matches = []
    let clearExisting = format !== 'swiss'

    if (format === 'round_robin' || format === 'free_for_all') {
        matches = generateRoundRobin(teams);

        if (tournament.is_double_round_robin) {
            const maxRound = Math.max(...matches.map(m => m.round_number), 0);
            const secondLeg = matches.map(m => ({
                ...m,
                home_team_id: m.away_team_id,
                away_team_id: m.home_team_id,
                round_number: m.round_number + maxRound
            }));
            matches = [...matches, ...secondLeg];
        }
    } else if (format === 'single_elim') {
        matches = generateSingleElimination(teams)
    } else if (format === 'double_elim') {
        matches = generateDoubleElimination(teams)
    } else if (format === 'group_knockout') {
        const groupCount = Math.max(2, parseInt(tournament.group_count, 10) || 2);
        const groups = generateGroups(teams, groupCount);
        const groupMatches = generateGroupMatches(groups);

        // Clear existing matches only for group stage
        await pool.query('DELETE FROM matches WHERE tournament_id=$1 AND group_name IS NOT NULL', [tournamentId]);

        matches = groupMatches;
        clearExisting = false;
        // Actually group_knockout starts with only group matches, no knockout yet.
    } else if (format === 'swiss') {
        const existingMatchesResult = await pool.query(
            `SELECT *
             FROM matches
             WHERE tournament_id=$1
             ORDER BY round_number, match_number, id`,
            [tournamentId]
        )
        const existingMatches = existingMatchesResult.rows

        if (existingMatches.some(match => match.status === 'scheduled')) {
            return reply.status(400).send({ error: 'Finish the current Swiss round before generating the next one' })
        }

        const totalRounds = getSwissRounds(teams.length)
        const nextRound = existingMatches.length === 0
            ? 1
            : Math.max(...existingMatches.map(match => match.round_number)) + 1

        if (nextRound > totalRounds) {
            return reply.status(400).send({ error: 'All Swiss rounds have already been generated' })
        }

        clearExisting = false
        const pairingStandings = nextRound === 1
            ? teams
            : await getSwissPairingStandings(tournamentId)

        matches = generateSwissRound(pairingStandings, existingMatches, nextRound)
    } else {
        return reply.status(400).send({ error: `Format ${tournament.format} not yet supported` })
    }

    if (clearExisting) {
        await pool.query('DELETE FROM matches WHERE tournament_id=$1', [tournamentId])
    }

    // Note: Ideally insertMatches should happen within a transaction

    const inserted = await insertMatches(tournament, matches)

    await pool.query('UPDATE tournaments SET status=$1 WHERE id=$2', ['active', tournamentId])

    return {
        message: 'Fixtures generated',
        count: inserted.length,
        fixtures: inserted
    }
});

app.get('/api/tournaments/:id/fixtures', async request => {
    const tournamentId = parseInt(request.params.id, 10)

    const result = await pool.query(
        `SELECT m.*, ht.name AS home_team_name, at.name AS away_team_name
         FROM matches m
         LEFT JOIN teams ht ON m.home_team_id=ht.id
         LEFT JOIN teams at ON m.away_team_id=at.id
         WHERE m.tournament_id=$1
         ORDER BY
            CASE
                WHEN m.group_name IS NOT NULL THEN 0
                WHEN m.match_type='winners' THEN 1
                WHEN m.match_type='losers' THEN 2
                WHEN m.match_type LIKE 'grand_final%' THEN 3
                ELSE 1
            END,
            m.round_number,
            m.match_number,
            m.id`,
        [tournamentId]
    )

    return { fixtures: result.rows }
})

app.patch('/api/tournaments/:id/matches/:matchId/score', { preHandler: authenticate, schema: scoreSchema }, async (request, reply) => {
    const { home_score, away_score, home_penalty_score, away_penalty_score } = request.body
    const tournamentId = parseInt(request.params.id, 10)
    const matchId = parseInt(request.params.matchId, 10)

    const tournament = await TournamentService.getForOwner(tournamentId, request.user.id)
    if (!tournament) return reply.status(403).send({ error: 'Not authorized' })

    // Using a single client for potential transaction consistency
    const client = await pool.connect()
    try {
        const matchResult = await client.query(
            'SELECT * FROM matches WHERE id=$1 AND tournament_id=$2',
            [matchId, tournamentId]
        )
        if (matchResult.rows.length === 0) return reply.status(404).send({ error: 'Match not found' })

        const match = matchResult.rows[0]
        if (match.status === 'completed') {
            return reply.status(400).send({ error: 'Match already completed' })
        }

        const format = normalizeFormat(tournament.format)
        const knockoutDraw =
            isDraw(home_score, away_score) &&
            (format === 'single_elim' || format === 'double_elim' || (format === 'group_knockout' && isKnockoutMatch(match))) &&
            !tournament.is_two_legged_knockout;

        // If it's a knockout draw and no penalties were provided, reject it
        if (knockoutDraw && (home_penalty_score === undefined || away_penalty_score === undefined)) {
            return reply.status(400).send({ error: 'Knockout matches cannot end in a draw' })
        }
        if (knockoutDraw && home_penalty_score === away_penalty_score) {
            return reply.status(400).send({ error: 'Penalty shootout must have a winner' })
        }

        let winnerTeamId = null;
        let isFinalResult = true;

        if (tournament.is_two_legged_knockout && isKnockoutMatch(match)) {
            const siblingLeg = match.leg === 1 ? 2 : 1;
            const siblingResult = await client.query(
                `SELECT * FROM matches WHERE tournament_id=$1 AND match_number=$2 
                 AND round_number=$3 AND match_type=$4 AND leg=$5`,
                [tournamentId, match.match_number, match.round_number, match.match_type, siblingLeg]
            );

            const sibling = siblingResult.rows[0];
            if (sibling && sibling.status === 'completed') {
                // Calculate Aggregate
                const m1 = match.leg === 1 ? { h: home_score, a: away_score, hId: match.home_team_id, aId: match.away_team_id }
                    : { h: sibling.home_score, a: sibling.away_score, hId: sibling.home_team_id, aId: sibling.away_team_id };
                const m2 = match.leg === 2 ? { h: home_score, a: away_score, hId: match.home_team_id, aId: match.away_team_id }
                    : { h: sibling.home_score, a: sibling.away_score, hId: sibling.home_team_id, aId: sibling.away_team_id };

                const totalTeamA = parseInt(m1.h) + parseInt(m2.a); // Team A was Home in Leg 1
                const totalTeamB = parseInt(m1.a) + parseInt(m2.h); // Team B was Home in Leg 2

                if (totalTeamA > totalTeamB) winnerTeamId = m1.hId;
                else if (totalTeamB > totalTeamA) winnerTeamId = m1.aId;
                else if (home_penalty_score !== undefined && away_penalty_score !== undefined) {
                    // Aggregate draw, decided by penalties in the 2nd leg
                    winnerTeamId = parseInt(home_penalty_score) > parseInt(away_penalty_score) ? match.home_team_id : match.away_team_id;
                } else {
                    isFinalResult = false; // It's a draw after aggregate, needs penalties or away goals logic
                }
            } else {
                isFinalResult = false; // Waiting for the other leg
            }
        } else {
            if (parseInt(home_score, 10) > parseInt(away_score, 10)) winnerTeamId = match.home_team_id;
            else if (parseInt(away_score, 10) > parseInt(home_score, 10)) winnerTeamId = match.away_team_id;
            else if (knockoutDraw) {
                winnerTeamId = parseInt(home_penalty_score) > parseInt(away_penalty_score) ? match.home_team_id : match.away_team_id;
            }
        }

        await client.query('BEGIN')
        const updatedResult = await client.query(
            `UPDATE matches
         SET home_score=$1,
             away_score=$2,
             home_penalty_score=$3,
             away_penalty_score=$4,
             status='completed',
             winner_team_id=$5,
             played_at=NOW()
         WHERE id=$6
         RETURNING *`,
            [parseInt(home_score), parseInt(away_score), home_penalty_score || null, away_penalty_score || null, winnerTeamId, matchId]
        )

        const updatedMatch = updatedResult.rows[0]
        const loserTeamId = isFinalResult ? getLoserTeamId(updatedMatch, winnerTeamId) : null

        if (format === 'single_elim' && winnerTeamId != null && isFinalResult) {
            const hasNext = await MatchService.advanceWinner(tournamentId, updatedMatch, winnerTeamId, client)
            if (!hasNext) {
                await TournamentService.markCompleted(tournamentId)
            }
        }

        if (format === 'double_elim' && winnerTeamId != null) {
            await processDoubleEliminationResult(tournamentId, updatedMatch, winnerTeamId, loserTeamId)
        }

        if (format === 'group_knockout') {
            if (updatedMatch.group_name) {
                await maybeCreateGroupKnockoutStage(tournament, client);
            } else if (winnerTeamId != null) {
                const hasNext = await MatchService.advanceWinner(tournamentId, updatedMatch, winnerTeamId, client);
                if (!hasNext) {
                    await TournamentService.markCompleted(tournamentId);
                }
            }
        }

        await TournamentService.maybeCompleteLeague(tournamentId, format)
        await client.query('COMMIT')

        return { message: 'Score recorded', match: updatedMatch }
    } catch (err) {
        await client.query('ROLLBACK')
        throw err
    } finally {
        client.release()
    }
})

app.patch('/api/tournaments/:id/matches/:matchId/reset', { preHandler: authenticate }, async (request, reply) => {
    const tournamentId = parseInt(request.params.id, 10)
    const matchId = parseInt(request.params.matchId, 10)

    const tournament = await TournamentService.getForOwner(tournamentId, request.user.id)
    if (!tournament) return reply.status(403).send({ error: 'Not authorized' })

    const client = await pool.connect()
    try {
        const matchResult = await client.query(
            'SELECT * FROM matches WHERE id=$1 AND tournament_id=$2',
            [matchId, tournamentId]
        )
        if (matchResult.rows.length === 0) return reply.status(404).send({ error: 'Match not found' })

        const match = matchResult.rows[0]
        const winnerTeamId = match.winner_team_id
        const format = normalizeFormat(tournament.format)

        await client.query('BEGIN')

        // 1. Reset the current match
        await MatchService.resetMatch(matchId, tournamentId, client);

        // 2. If it was a knockout/elimination match, we need to clear the winner from the next round
        if (winnerTeamId && (format === 'single_elim' || format === 'double_elim' || (format === 'group_knockout' && isKnockoutMatch(match)))) {
            // Logic to clear subsequent round slots would go here, 
            // calling MatchService for consistency.
        }

        await client.query('COMMIT')
        return { message: 'Match score reset successfully' }
    } catch (err) {
        await client.query('ROLLBACK')
        throw err
    } finally {
        client.release()
    }
})

app.get('/api/tournaments/:id/standings', async request => {
    const tournamentId = parseInt(request.params.id, 10)
    const standings = await TournamentService.getStandings(tournamentId)
    return { standings }
})

app.get('/api/tournaments/:id/messages', async request => {
    const tournamentId = parseInt(request.params.id, 10)
    const result = await pool.query(
        'SELECT * FROM messages WHERE tournament_id=$1 ORDER BY created_at DESC LIMIT 50',
        [tournamentId]
    )
    return { messages: result.rows }
})

app.post('/api/tournaments/:id/messages', async (request, reply) => {
    const { sender_name, content } = request.body
    const tournamentId = parseInt(request.params.id, 10)

    if (!sender_name?.trim() || !content?.trim()) {
        return reply.status(400).send({ error: 'Name and message required' })
    }

    const result = await pool.query(
        'INSERT INTO messages (tournament_id, sender_name, content) VALUES ($1,$2,$3) RETURNING *',
        [tournamentId, sender_name.trim(), content.trim()]
    )

    const newMessage = result.rows[0]

    // Broadcast to connected WebSocket clients for this tournament
    const clients = chatClients.get(tournamentId)
    if (clients) {
        const payload = JSON.stringify({ type: 'new_message', message: newMessage })
        clients.forEach(client => {
            if (client.readyState === 1) client.send(payload)
        })
    }

    return { message: newMessage }
})

// WebSocket endpoint for real-time chat
app.get('/api/tournaments/:id/chat', { websocket: true }, (connection, req) => {
    const tournamentId = parseInt(req.params.id, 10)

    if (!chatClients.has(tournamentId)) {
        chatClients.set(tournamentId, new Set())
    }
    chatClients.get(tournamentId).add(connection.socket)

    connection.socket.on('close', () => {
        const clients = chatClients.get(tournamentId)
        if (clients) {
            clients.delete(connection.socket)
            if (clients.size === 0) chatClients.delete(tournamentId)
        }
    })
})

app.get('/api/tournaments/:id/groups', async request => {
    const tournamentId = parseInt(request.params.id, 10)
    const groups = await TournamentService.getGroupsData(tournamentId)
    return { groups }
})

app.setErrorHandler((error, request, reply) => {
    console.error(error)
    reply.status(error.statusCode || 500).send({ error: error.message })
})

const PORT = process.env.PORT || 3000
app.listen({ port: PORT, host: '0.0.0.0' }, err => {
    if (err) {
        console.error('Server failed:', err.message)
        process.exit(1)
    }
    console.log(`FootPlex backend running on port ${PORT}`)
})

export default app
