import Fastify from 'fastify'
import cors from '@fastify/cors'
import { Pool } from 'pg'
import jwt from '@fastify/jwt'
import bcrypt from 'bcrypt'

const app = Fastify()
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
})

pool.on('error', err => console.error('Pool error:', err.message))

// Plugins
await app.register(cors, { origin: '*', credentials: true, methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'] })
await app.register(jwt, { secret: process.env.JWT_SECRET })

// Middleware
const authenticate = async (request, reply) => {
    try {
        await request.jwtVerify()
    } catch (err) {
        reply.status(401).send({ error: 'Unauthorized' })
    }
}

// Health check
app.get('/health', async () => ({ status: 'ok' }))

// ========== AUTH ROUTES ==========
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

app.get('/api/auth/me', { preHandler: authenticate }, async (request) => {
    const res = await pool.query('SELECT id,email,full_name,role FROM users WHERE id=$1', [request.user.id])
    return { user: res.rows[0] }
})

// ========== TOURNAMENT ROUTES ==========
app.post('/api/tournaments', { preHandler: authenticate }, async (request, reply) => {
    const { name, tournament_type, format, max_teams, description } = request.body
    const slug = name.toLowerCase().replace(/\s+/g, '-')

    const res = await pool.query(
        `INSERT INTO tournaments (organizer_id, name, slug, tournament_type, format, status, max_teams, description)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [request.user.id, name, slug, tournament_type, format, 'registration', max_teams, description]
    )
    return { tournament: res.rows[0] }
})

app.get('/api/tournaments/my', { preHandler: authenticate }, async (request) => {
    const res = await pool.query('SELECT * FROM tournaments WHERE organizer_id=$1 ORDER BY created_at DESC', [request.user.id])
    return { tournaments: res.rows }
})

app.get('/api/tournaments', async (request) => {
    const res = await pool.query(
        "SELECT * FROM tournaments WHERE status IN ('registration','active') ORDER BY created_at DESC LIMIT 20"
    )
    return { tournaments: res.rows }
})

app.get('/api/tournaments/:slug', async (request) => {
    const res = await pool.query('SELECT * FROM tournaments WHERE slug=$1', [request.params.slug])
    if (res.rows.length === 0) return reply.status(404).send({ error: 'Not found' })
    return { tournament: res.rows[0] }
})

app.patch('/api/tournaments/:id/status', { preHandler: authenticate }, async (request, reply) => {
    const { status } = request.body
    const id = parseInt(request.params.id)

    const check = await pool.query('SELECT * FROM tournaments WHERE id=$1 AND organizer_id=$2', [id, request.user.id])
    if (check.rows.length === 0) return reply.status(403).send({ error: 'Not authorized' })

    const res = await pool.query('UPDATE tournaments SET status=$1 WHERE id=$2 RETURNING *', [status, id])
    return { tournament: res.rows[0] }
})

app.delete('/api/tournaments/:id', { preHandler: authenticate }, async (request, reply) => {
    const id = parseInt(request.params.id)

    const check = await pool.query('SELECT * FROM tournaments WHERE id=$1 AND organizer_id=$2', [id, request.user.id])
    if (check.rows.length === 0) return reply.status(403).send({ error: 'Not authorized' })

    await pool.query('DELETE FROM tournaments WHERE id=$1', [id])
    return { message: 'Deleted' }
})

// ========== TEAM ROUTES ==========
app.post('/api/tournaments/:id/teams', async (request, reply) => {
    const { name, contact_name, contact_email } = request.body
    const tournament_id = parseInt(request.params.id)

    if (!name?.trim()) return reply.status(400).send({ error: 'Team name required' })

    const result = await pool.query(
        `INSERT INTO teams (tournament_id, name, contact_name, contact_email, status)
         VALUES ($1,$2,$3,$4,'confirmed') RETURNING *`,
        [tournament_id, name.trim(), contact_name?.trim() || null, contact_email?.trim() || null]
    )

    return { team: result.rows[0] }
})

app.post('/api/tournaments/:id/teams/request', async (request, reply) => {
    const { name, contact_name, contact_email } = request.body
    const tournament_id = parseInt(request.params.id)

    if (!name?.trim()) return reply.status(400).send({ error: 'Team name required' })

    const tournament = await pool.query('SELECT * FROM tournaments WHERE id=$1', [tournament_id])
    if (tournament.rows.length === 0) return reply.status(404).send({ error: 'Tournament not found' })

    const t = tournament.rows[0]
    if (t.status === 'draft') return reply.status(400).send({ error: 'Tournament not open yet' })

    const existingTeams = await pool.query(
        'SELECT COUNT(*) as cnt FROM teams WHERE tournament_id=$1 AND status IN ($2,$3)',
        [tournament_id, 'confirmed', 'pending']
    )
    if (parseInt(existingTeams.rows[0].cnt) >= t.max_teams) {
        return reply.status(400).send({ error: 'Tournament is full' })
    }

    const result = await pool.query(
        `INSERT INTO teams (tournament_id, name, contact_name, contact_email, status)
         VALUES ($1,$2,$3,$4,'pending') RETURNING *`,
        [tournament_id, name.trim(), contact_name?.trim() || null, contact_email?.trim() || null]
    )

    return { team: result.rows[0], message: 'Team request submitted!' }
})

app.get('/api/tournaments/:id/teams', async (request, reply) => {
    const tournament_id = parseInt(request.params.id)
    const result = await pool.query(
        'SELECT * FROM teams WHERE tournament_id=$1 ORDER BY created_at',
        [tournament_id]
    )
    return { teams: result.rows }
})

app.patch('/api/tournaments/:id/teams/:teamId', { preHandler: authenticate }, async (request, reply) => {
    const { action } = request.body
    const tournament_id = parseInt(request.params.id)
    const team_id = parseInt(request.params.teamId)

    const result = await pool.query(
        'UPDATE teams SET status=$1 WHERE id=$2 AND tournament_id=$3 RETURNING *',
        [action === 'approve' ? 'confirmed' : 'rejected', team_id, tournament_id]
    )

    return { team: result.rows[0] }
})

// ========== FIXTURES ROUTES ==========
app.post('/api/tournaments/:id/generate', { preHandler: authenticate }, async (request, reply) => {
    const tournament_id = parseInt(request.params.id)
    console.log('🔵 Generating for tournament:', tournament_id)

    const tournament = await pool.query('SELECT * FROM tournaments WHERE id=$1 AND organizer_id=$2', [tournament_id, request.user.id])
    if (tournament.rows.length === 0) return reply.status(403).send({ error: 'Not authorized' })

    const t = tournament.rows[0]
    console.log('📋 Tournament format:', t.format)

    const teamsRes = await pool.query('SELECT id FROM teams WHERE tournament_id=$1 AND status=$2', [tournament_id, 'confirmed'])
    const teams = teamsRes.rows
    console.log('👥 Found teams:', teams.length)

    if (teams.length < 2) return reply.status(400).send({ error: 'Need at least 2 teams' })

    let matchesData = []

    if (t.format === 'round_robin') {
        matchesData = generateRoundRobin(teams)
    } else if (t.format === 'single_elimination') {
        matchesData = generateSingleElimination(teams)
    } else if (t.format === 'double_elim' || t.format === 'double_elimination') {
        matchesData = generateDoubleElimination(teams)
    } else if (t.format === 'group_knockout') {
        matchesData = generateGroupKnockout(teams)
    } else if (t.format === 'swiss') {
        matchesData = generateSwiss(teams)
    }

    console.log('🎯 Generated matches:', matchesData.length)
    console.log('First match:', matchesData[0])

    // Delete existing matches first
    await pool.query('DELETE FROM matches WHERE tournament_id=$1', [tournament_id])

    // Insert new matches with error handling
    let insertedCount = 0
    for (const match of matchesData) {
        try {
            await pool.query(
                `INSERT INTO matches (tournament_id, home_team_id, away_team_id, round_number, status, match_type, match_number, is_placeholder)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
                [tournament_id, match.home_team_id, match.away_team_id, match.round_number, 'scheduled', match.match_type || 'group', match.match_number, match.is_placeholder || false]
            )
            insertedCount++
        } catch (err) {
            console.error('❌ Insert error:', err.message, 'Match:', match)
            throw err
        }
    }

    console.log('✅ Inserted matches:', insertedCount)

    await pool.query('UPDATE tournaments SET status=$1 WHERE id=$2', ['active', tournament_id])
    return { message: 'Fixtures generated', count: insertedCount }
})

app.get('/api/tournaments/:id/fixtures', async (request, reply) => {
    const tournament_id = parseInt(request.params.id)

    const result = await pool.query(
        `SELECT m.*, 
          ht.name as home_team_name, 
          at.name as away_team_name
         FROM matches m
         LEFT JOIN teams ht ON m.home_team_id = ht.id
         LEFT JOIN teams at ON m.away_team_id = at.id
         WHERE m.tournament_id=$1
         ORDER BY m.round_number, m.match_number`,
        [tournament_id]
    )

    return { fixtures: result.rows }
})

app.patch('/api/tournaments/:id/matches/:matchId/score', async (request, reply) => {
    const { home_score, away_score } = request.body
    const match_id = parseInt(request.params.matchId)

    // Validate scores are numbers
    if (home_score === undefined || away_score === undefined ||
        isNaN(home_score) || isNaN(away_score)) {
        return reply.status(400).send({ error: 'Both scores must be valid numbers' })
    }

    const match = await pool.query('SELECT * FROM matches WHERE id=$1', [match_id])
    if (match.rows.length === 0) return reply.status(404).send({ error: 'Match not found' })

    const winner_team_id = home_score > away_score ? match.rows[0].home_team_id : match.rows[0].away_team_id

    await pool.query(
        'UPDATE matches SET home_score=$1, away_score=$2, status=$3, winner_team_id=$4 WHERE id=$5',
        [home_score, away_score, 'completed', winner_team_id, match_id]
    )

    return { message: 'Score recorded' }
})

app.get('/api/tournaments/:id/standings', async (request, reply) => {
    const tournament_id = parseInt(request.params.id)

    const result = await pool.query(
        `WITH results AS (
          SELECT home_team_id AS team_id, home_score AS gf, away_score AS ga,
            CASE WHEN home_score>away_score THEN 3 WHEN home_score=away_score THEN 1 ELSE 0 END AS pts
          FROM matches WHERE tournament_id=$1 AND status='completed'
          UNION ALL
          SELECT away_team_id, away_score, home_score,
            CASE WHEN away_score>home_score THEN 3 WHEN away_score=home_score THEN 1 ELSE 0 END
          FROM matches WHERE tournament_id=$1 AND status='completed'
        )
        SELECT t.id, t.name, COALESCE(SUM(r.pts),0) AS points,
          COALESCE(SUM(r.gf),0)-COALESCE(SUM(r.ga),0) AS goal_difference,
          COALESCE(SUM(r.gf),0) AS goals_for
        FROM teams t LEFT JOIN results r ON r.team_id=t.id
        WHERE t.tournament_id=$1
        GROUP BY t.id, t.name
        ORDER BY points DESC, goal_difference DESC, goals_for DESC`,
        [tournament_id]
    )

    return { standings: result.rows }
})

// ========== BRACKET GENERATORS ==========
function generateRoundRobin(teams) {
    const matches = []
    let matchNum = 1

    for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
            matches.push({
                home_team_id: teams[i].id,
                away_team_id: teams[j].id,
                round_number: 1,
                match_number: matchNum++,
                match_type: 'group'
            })
        }
    }

    return matches
}

function generateSingleElimination(teams) {
    const matches = []
    let round = 1
    let currentTeams = [...teams]

    while (currentTeams.length > 1) {
        for (let i = 0; i < currentTeams.length; i += 2) {
            matches.push({
                home_team_id: currentTeams[i]?.id || null,
                away_team_id: currentTeams[i + 1]?.id || null,
                round_number: round,
                match_number: Math.floor(i / 2) + 1,
                match_type: 'knockout',
                is_placeholder: !currentTeams[i + 1]
            })
        }
        currentTeams = currentTeams.slice(0, Math.ceil(currentTeams.length / 2))
        round++
    }

    return matches
}

function generateDoubleElimination(teams) {
    const matches = []
    let round = 1
    let currentTeams = [...teams]

    // Winners bracket
    while (currentTeams.length > 1) {
        for (let i = 0; i < currentTeams.length; i += 2) {
            matches.push({
                home_team_id: currentTeams[i]?.id || null,
                away_team_id: currentTeams[i + 1]?.id || null,
                round_number: round,
                match_number: Math.floor(i / 2) + 1,
                match_type: 'winners',
                is_placeholder: !currentTeams[i + 1]
            })
        }
        currentTeams = currentTeams.slice(0, Math.ceil(currentTeams.length / 2))
        round++
    }

    // Grand final
    matches.push({
        home_team_id: null,
        away_team_id: null,
        round_number: round + 1,
        match_number: 1,
        match_type: 'grand_final',
        is_placeholder: true
    })

    return matches
}

function generateSwiss(teams) {
    const matches = []
    const rounds = Math.ceil(Math.log2(teams.length))

    for (let r = 1; r <= rounds; r++) {
        for (let i = 0; i < teams.length; i += 2) {
            matches.push({
                home_team_id: teams[i]?.id || null,
                away_team_id: teams[i + 1]?.id || null,
                round_number: r,
                match_number: Math.floor(i / 2) + 1,
                match_type: 'swiss'
            })
        }
    }

    return matches
}

function generateGroupKnockout(teams) {
    const matches = []
    let round = 1
    let matchNum = 1

    // Group stage - simple round robin within groups
    const groupSize = Math.ceil(teams.length / 2)
    for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
            matches.push({
                home_team_id: teams[i].id,
                away_team_id: teams[j].id,
                round_number: round,
                match_number: matchNum++,
                match_type: 'group',
                group_name: Math.ceil((i + 1) / groupSize) === Math.ceil((j + 1) / groupSize) ? 'A' : 'B'
            })
        }
    }

    // Knockout stage placeholder
    matches.push({
        home_team_id: null,
        away_team_id: null,
        round_number: round + 1,
        match_number: 1,
        match_type: 'knockout',
        is_placeholder: true
    })

    return matches
}


app.get('/api/tournaments/:id/messages', async (request, reply) => {
    const tournament_id = parseInt(request.params.id)
    const result = await pool.query(
        'SELECT * FROM messages WHERE tournament_id=$1 ORDER BY created_at DESC LIMIT 50',
        [tournament_id]
    )
    return { messages: result.rows }
})

app.post('/api/tournaments/:id/messages', async (request, reply) => {
    const { sender_name, content } = request.body
    const tournament_id = parseInt(request.params.id)

    if (!sender_name?.trim() || !content?.trim()) {
        return reply.status(400).send({ error: 'Name and message required' })
    }

    const result = await pool.query(
        'INSERT INTO messages (tournament_id, sender_name, content) VALUES ($1,$2,$3) RETURNING *',
        [tournament_id, sender_name.trim(), content.trim()]
    )

    return { message: result.rows[0] }
})

app.get('/api/tournaments/:id/groups', async (request, reply) => {
    const tournament_id = parseInt(request.params.id)

    // Get all teams grouped by their group assignment
    const result = await pool.query(
        `SELECT 
            COALESCE(m.group_name, 'A') as group_name,
            t.id,
            t.name,
            COUNT(CASE WHEN m.status = 'completed' THEN 1 END) as played,
            SUM(CASE WHEN m.status = 'completed' AND m.winner_team_id = t.id THEN 1 ELSE 0 END) as won,
            SUM(CASE WHEN m.status = 'completed' AND m.home_score = m.away_score AND (m.home_team_id = t.id OR m.away_team_id = t.id) THEN 1 ELSE 0 END) as drawn,
            SUM(CASE WHEN m.status = 'completed' AND m.winner_team_id != t.id AND (m.home_team_id = t.id OR m.away_team_id = t.id) THEN 1 ELSE 0 END) as lost,
            COALESCE(SUM(CASE WHEN m.home_team_id = t.id THEN m.home_score ELSE m.away_score END), 0) - 
            COALESCE(SUM(CASE WHEN m.home_team_id = t.id THEN m.away_score ELSE m.home_score END), 0) as goal_difference,
            SUM(CASE WHEN m.status = 'completed' AND m.winner_team_id = t.id THEN 3 ELSE 0 END) +
            SUM(CASE WHEN m.status = 'completed' AND m.home_score = m.away_score AND (m.home_team_id = t.id OR m.away_team_id = t.id) THEN 1 ELSE 0 END) as points
         FROM teams t
         LEFT JOIN matches m ON (m.home_team_id = t.id OR m.away_team_id = t.id) AND m.tournament_id = $1
         WHERE t.tournament_id = $1
         GROUP BY group_name, t.id, t.name
         ORDER BY group_name, points DESC, goal_difference DESC`,
        [tournament_id]
    )

    // Group by group_name
    const grouped = {}
    result.rows.forEach(team => {
        if (!grouped[team.group_name]) {
            grouped[team.group_name] = {
                name: team.group_name,
                standings: []
            }
        }
        grouped[team.group_name].standings.push(team)
    })

    const groups = Object.values(grouped)
    return { groups }
})
// Error handler
app.setErrorHandler((error, request, reply) => {
    console.error(error)
    reply.status(error.statusCode || 500).send({ error: error.message })
})

// Start
const PORT = process.env.PORT || 3000
app.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
    if (err) {
        console.error('❌ Server failed:', err.message)
        process.exit(1)
    }
    console.log(`✅ FootPlex backend running on port ${PORT}`)
})

export default app