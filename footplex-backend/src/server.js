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
await app.register(cors, { origin: true, credentials: true, methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'] })
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
    if (res.rows.length === 0) return { error: 'Not found' }
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