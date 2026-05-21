
import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import bcrypt from 'bcrypt'
import { Pool } from 'pg'

const app = Fastify({ logger: true })

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false
})

pool.on('error', err => {
    console.error('Postgres Pool Error:', err.message)
})

// ================== PLUGINS ==================
await app.register(cors, {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
})

await app.register(jwt, {
    secret: process.env.JWT_SECRET
})

// ================== AUTH MIDDLEWARE ==================
const authenticate = async (request, reply) => {
    try {
        await request.jwtVerify()
    } catch (err) {
        return reply.status(401).send({ error: 'Unauthorized' })
    }
}

// ================== HELPERS ==================
function createSlug(name) {
    return (
        name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-') +
        '-' +
        Date.now()
    )
}

function chunkArray(arr, size) {
    const result = []
    for (let i = 0; i < arr.length; i += size) {
        result.push(arr.slice(i, i + size))
    }
    return result
}

// ================== HEALTH ==================
app.get('/health', async () => {
    return { status: 'ok' }
})

// ================== AUTH ==================
app.post('/api/auth/register', async (request, reply) => {
    const { email, password, full_name } = request.body

    if (!email || !password) {
        return reply.status(400).send({
            error: 'Email and password required'
        })
    }

    try {
        const hash = await bcrypt.hash(password, 10)

        const result = await pool.query(
            `INSERT INTO users (email, password_hash, full_name)
             VALUES ($1,$2,$3)
             RETURNING id,email,full_name`,
            [email, hash, full_name || null]
        )

        const user = result.rows[0]

        const token = app.jwt.sign({
            id: user.id,
            email: user.email
        })

        return { user, token }
    } catch (err) {
        if (err.code === '23505') {
            return reply.status(400).send({
                error: 'Email already exists'
            })
        }

        throw err
    }
})

app.post('/api/auth/login', async (request, reply) => {
    const { email, password } = request.body

    if (!email || !password) {
        return reply.status(400).send({
            error: 'Email and password required'
        })
    }

    const result = await pool.query(
        'SELECT * FROM users WHERE email=$1',
        [email]
    )

    if (result.rows.length === 0) {
        return reply.status(401).send({
            error: 'Invalid credentials'
        })
    }

    const user = result.rows[0]

    const valid = await bcrypt.compare(
        password,
        user.password_hash
    )

    if (!valid) {
        return reply.status(401).send({
            error: 'Invalid credentials'
        })
    }

    const token = app.jwt.sign({
        id: user.id,
        email: user.email
    })

    return {
        user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role
        },
        token
    }
})

app.get(
    '/api/auth/me',
    { preHandler: authenticate },
    async request => {
        const result = await pool.query(
            `SELECT id,email,full_name,role
             FROM users
             WHERE id=$1`,
            [request.user.id]
        )

        return {
            user: result.rows[0]
        }
    }
)

// ================== TOURNAMENTS ==================
app.post(
    '/api/tournaments',
    { preHandler: authenticate },
    async (request, reply) => {
        const {
            name,
            tournament_type,
            format,
            max_teams,
            description
        } = request.body

        if (!name || !format) {
            return reply.status(400).send({
                error: 'Name and format required'
            })
        }

        const slug = createSlug(name)

        const result = await pool.query(
            `INSERT INTO tournaments
            (
                organizer_id,
                name,
                slug,
                tournament_type,
                format,
                status,
                max_teams,
                description
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
            RETURNING *`,
            [
                request.user.id,
                name,
                slug,
                tournament_type || 'football',
                format,
                'registration',
                max_teams || 16,
                description || null
            ]
        )

        return {
            tournament: result.rows[0]
        }
    }
)

app.get('/api/tournaments', async () => {
    const result = await pool.query(
        `SELECT *
         FROM tournaments
         WHERE status IN ('registration','active')
         ORDER BY created_at DESC`
    )

    return {
        tournaments: result.rows
    }
})

app.get('/api/tournaments/my', {
    preHandler: authenticate
}, async request => {
    const result = await pool.query(
        `SELECT *
         FROM tournaments
         WHERE organizer_id=$1
         ORDER BY created_at DESC`,
        [request.user.id]
    )

    return {
        tournaments: result.rows
    }
})

app.get('/api/tournaments/:slug', async (request, reply) => {
    const result = await pool.query(
        'SELECT * FROM tournaments WHERE slug=$1',
        [request.params.slug]
    )

    if (result.rows.length === 0) {
        return reply.status(404).send({
            error: 'Tournament not found'
        })
    }

    return {
        tournament: result.rows[0]
    }
})

// ================== TEAMS ==================
app.post('/api/tournaments/:id/teams/request', async (request, reply) => {
    const tournament_id = Number(request.params.id)

    const {
        name,
        contact_name,
        contact_email
    } = request.body

    if (!name?.trim()) {
        return reply.status(400).send({
            error: 'Team name required'
        })
    }

    const tournament = await pool.query(
        'SELECT * FROM tournaments WHERE id=$1',
        [tournament_id]
    )

    if (tournament.rows.length === 0) {
        return reply.status(404).send({
            error: 'Tournament not found'
        })
    }

    const existing = await pool.query(
        `SELECT COUNT(*) as count
         FROM teams
         WHERE tournament_id=$1
         AND status IN ('confirmed','pending')`,
        [tournament_id]
    )

    if (
        Number(existing.rows[0].count) >=
        tournament.rows[0].max_teams
    ) {
        return reply.status(400).send({
            error: 'Tournament is full'
        })
    }

    const result = await pool.query(
        `INSERT INTO teams
        (
            tournament_id,
            name,
            contact_name,
            contact_email,
            status
        )
        VALUES ($1,$2,$3,$4,$5)
        RETURNING *`,
        [
            tournament_id,
            name.trim(),
            contact_name || null,
            contact_email || null,
            'pending'
        ]
    )

    return {
        team: result.rows[0]
    }
})

app.get('/api/tournaments/:id/teams', async request => {
    const tournament_id = Number(request.params.id)

    const result = await pool.query(
        `SELECT *
         FROM teams
         WHERE tournament_id=$1
         ORDER BY created_at ASC`,
        [tournament_id]
    )

    return {
        teams: result.rows
    }
})

// ================== FIXTURE GENERATORS ==================
function generateRoundRobin(teams) {
    const matches = []

    const list =
        teams.length % 2 === 0
            ? [...teams]
            : [...teams, { id: null }]

    const totalTeams = list.length
    const totalRounds = totalTeams - 1
    const matchesPerRound = totalTeams / 2

    for (let round = 0; round < totalRounds; round++) {
        for (let i = 0; i < matchesPerRound; i++) {
            const home = list[i]
            const away = list[totalTeams - 1 - i]

            if (home.id && away.id) {
                matches.push({
                    home_team_id:
                        round % 2 === 0
                            ? home.id
                            : away.id,

                    away_team_id:
                        round % 2 === 0
                            ? away.id
                            : home.id,

                    round_number: round + 1,
                    match_number: i + 1,
                    match_type: 'group',
                    is_placeholder: false
                })
            }
        }

        const fixed = list[0]
        const rotating = list.slice(1)

        rotating.unshift(rotating.pop())

        list.splice(0, list.length, fixed, ...rotating)
    }

    return matches
}

function generateSingleElimination(teams) {
    const matches = []

    const nextPowerOf2 = Math.pow(
        2,
        Math.ceil(Math.log2(teams.length))
    )

    const byes = nextPowerOf2 - teams.length

    const bracketTeams = [
        ...teams,
        ...Array(byes).fill({ id: null })
    ]

    let totalRounds = Math.log2(nextPowerOf2)
    let currentRoundTeams = bracketTeams

    for (let round = 1; round <= totalRounds; round++) {
        const roundMatches = []

        for (let i = 0; i < currentRoundTeams.length; i += 2) {
            const home = currentRoundTeams[i]
            const away = currentRoundTeams[i + 1]

            roundMatches.push({
                round_number: round,
                match_number: i / 2 + 1,
                home_team_id:
                    round === 1 ? home?.id : null,
                away_team_id:
                    round === 1 ? away?.id : null,
                match_type: 'knockout',
                is_placeholder: round !== 1
            })
        }

        matches.push(...roundMatches)

        currentRoundTeams =
            new Array(roundMatches.length).fill(null)
    }

    return matches
}

function generateGroupKnockout(teams) {
    const matches = []

    const groups = chunkArray(teams, Math.ceil(teams.length / 2))

    groups.forEach((group, groupIndex) => {
        const groupName = String.fromCharCode(65 + groupIndex)

        for (let i = 0; i < group.length; i++) {
            for (let j = i + 1; j < group.length; j++) {
                matches.push({
                    home_team_id: group[i].id,
                    away_team_id: group[j].id,
                    round_number: 1,
                    match_number: matches.length + 1,
                    match_type: 'group',
                    group_name: groupName,
                    is_placeholder: false
                })
            }
        }
    })

    matches.push({
        home_team_id: null,
        away_team_id: null,
        round_number: 2,
        match_number: 1,
        match_type: 'knockout',
        is_placeholder: true
    })

    return matches
}

// ================== GENERATE FIXTURES ==================
app.post(
    '/api/tournaments/:id/generate',
    { preHandler: authenticate },
    async (request, reply) => {
        const tournament_id = Number(request.params.id)

        const tournament = await pool.query(
            `SELECT *
             FROM tournaments
             WHERE id=$1
             AND organizer_id=$2`,
            [tournament_id, request.user.id]
        )

        if (tournament.rows.length === 0) {
            return reply.status(403).send({
                error: 'Not authorized'
            })
        }

        const teamsRes = await pool.query(
            `SELECT id,name
             FROM teams
             WHERE tournament_id=$1
             AND status='confirmed'`,
            [tournament_id]
        )

        const teams = teamsRes.rows

        if (teams.length < 2) {
            return reply.status(400).send({
                error: 'Need at least 2 teams'
            })
        }

        let matches = []

        const format = tournament.rows[0].format

        if (format === 'round_robin') {
            matches = generateRoundRobin(teams)
        }

        else if (format === 'single_elimination') {
            matches = generateSingleElimination(teams)
        }

        else if (format === 'group_knockout') {
            matches = generateGroupKnockout(teams)
        }

        else {
            return reply.status(400).send({
                error: 'Unsupported format'
            })
        }

        const client = await pool.connect()

        try {
            await client.query('BEGIN')

            await client.query(
                'DELETE FROM matches WHERE tournament_id=$1',
                [tournament_id]
            )

            for (const match of matches) {
                await client.query(
                    `INSERT INTO matches
                    (
                        tournament_id,
                        home_team_id,
                        away_team_id,
                        round_number,
                        match_number,
                        match_type,
                        status,
                        is_placeholder,
                        group_name
                    )
                    VALUES
                    ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
                    [
                        tournament_id,
                        match.home_team_id,
                        match.away_team_id,
                        match.round_number,
                        match.match_number,
                        match.match_type,
                        'scheduled',
                        match.is_placeholder || false,
                        match.group_name || null
                    ]
                )
            }

            await client.query(
                `UPDATE tournaments
                 SET status='active'
                 WHERE id=$1`,
                [tournament_id]
            )

            await client.query('COMMIT')

            return {
                message: 'Fixtures generated successfully',
                count: matches.length
            }
        } catch (err) {
            await client.query('ROLLBACK')
            throw err
        } finally {
            client.release()
        }
    }
)

// ================== FIXTURES ==================
app.get('/api/tournaments/:id/fixtures', async request => {
    const tournament_id = Number(request.params.id)

    const result = await pool.query(
        `SELECT
            m.*,
            ht.name as home_team_name,
            at.name as away_team_name
         FROM matches m
         LEFT JOIN teams ht ON ht.id = m.home_team_id
         LEFT JOIN teams at ON at.id = m.away_team_id
         WHERE m.tournament_id=$1
         ORDER BY m.round_number,m.match_number`,
        [tournament_id]
    )

    return {
        fixtures: result.rows
    }
})

// ================== UPDATE SCORE ==================
app.patch(
    '/api/tournaments/:id/matches/:matchId/score',
    { preHandler: authenticate },
    async (request, reply) => {
        const { home_score, away_score } = request.body

        const tournament_id = Number(request.params.id)
        const match_id = Number(request.params.matchId)

        if (
            home_score === undefined ||
            away_score === undefined ||
            isNaN(home_score) ||
            isNaN(away_score) ||
            home_score < 0 ||
            away_score < 0
        ) {
            return reply.status(400).send({
                error: 'Invalid scores'
            })
        }

        const tournament = await pool.query(
            `SELECT *
             FROM tournaments
             WHERE id=$1
             AND organizer_id=$2`,
            [tournament_id, request.user.id]
        )

        if (tournament.rows.length === 0) {
            return reply.status(403).send({
                error: 'Not authorized'
            })
        }

        const match = await pool.query(
            'SELECT * FROM matches WHERE id=$1',
            [match_id]
        )

        if (match.rows.length === 0) {
            return reply.status(404).send({
                error: 'Match not found'
            })
        }

        let winner_team_id = null

        if (home_score > away_score) {
            winner_team_id = match.rows[0].home_team_id
        }

        else if (away_score > home_score) {
            winner_team_id = match.rows[0].away_team_id
        }

        await pool.query(
            `UPDATE matches
             SET
                home_score=$1,
                away_score=$2,
                winner_team_id=$3,
                status='completed'
             WHERE id=$4`,
            [
                home_score,
                away_score,
                winner_team_id,
                match_id
            ]
        )

        return {
            message: 'Score updated'
        }
    }
)

// ================== STANDINGS ==================
app.get('/api/tournaments/:id/standings', async request => {
    const tournament_id = Number(request.params.id)

    const result = await pool.query(
        `WITH results AS (
            SELECT
                home_team_id AS team_id,
                home_score AS goals_for,
                away_score AS goals_against,
                CASE
                    WHEN home_score > away_score THEN 3
                    WHEN home_score = away_score THEN 1
                    ELSE 0
                END AS points
            FROM matches
            WHERE tournament_id=$1
            AND status='completed'

            UNION ALL

            SELECT
                away_team_id,
                away_score,
                home_score,
                CASE
                    WHEN away_score > home_score THEN 3
                    WHEN away_score = home_score THEN 1
                    ELSE 0
                END
            FROM matches
            WHERE tournament_id=$1
            AND status='completed'
        )

        SELECT
            t.id,
            t.name,
            COALESCE(SUM(r.points),0) AS points,
            COALESCE(SUM(r.goals_for),0) AS goals_for,
            COALESCE(SUM(r.goals_against),0) AS goals_against,
            COALESCE(SUM(r.goals_for),0) -
            COALESCE(SUM(r.goals_against),0) AS goal_difference

        FROM teams t
        LEFT JOIN results r ON r.team_id=t.id

        WHERE t.tournament_id=$1

        GROUP BY t.id,t.name

        ORDER BY
            points DESC,
            goal_difference DESC,
            goals_for DESC`,
        [tournament_id]
    )

    return {
        standings: result.rows
    }
})

// ================== ERROR HANDLER ==================
app.setErrorHandler((error, request, reply) => {
    console.error(error)

    reply.status(error.statusCode || 500).send({
        error: error.message || 'Internal Server Error'
    })
})

// ================== START ==================
const PORT = process.env.PORT || 3000

app.listen(
    {
        port: PORT,
        host: '0.0.0.0'
    },
    (err, address) => {
        if (err) {
            console.error('Server Failed:', err)
            process.exit(1)
        }

        console.log(`Server running on ${address}`)
    }
)

export default app
    ```

