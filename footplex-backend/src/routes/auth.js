import bcrypt from 'bcrypt'
import pool from '../plugins/db.js'
import { authenticate } from '../plugins/authenticate.js'

export default async function authRoutes(app) {

    // POST /api/auth/register
    app.post('/register', async (request, reply) => {
        const { email, password, full_name } = request.body

        if (!email || !password || !full_name) {
            return reply.status(400).send({ error: 'All fields are required' })
        }

        const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email])
        if (exists.rows.length > 0) {
            return reply.status(400).send({ error: 'Email already registered' })
        }

        const password_hash = await bcrypt.hash(password, 10)

        const result = await pool.query(
            `INSERT INTO users (email, password_hash, full_name)
       VALUES ($1, $2, $3) RETURNING id, email, full_name, role`,
            [email, password_hash, full_name]
        )

        const user = result.rows[0]
        const token = app.jwt.sign(
            { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
            { expiresIn: '7d' }
        )

        return reply.status(201).send({ token, user })
    })


    // POST /api/auth/login
    app.post('/login', async (request, reply) => {
        const { email, password } = request.body

        if (!email || !password) {
            return reply.status(400).send({ error: 'Email and password are required' })
        }

        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])
        if (result.rows.length === 0) {
            return reply.status(401).send({ error: 'Invalid credentials' })
        }

        const user = result.rows[0]
        const valid = await bcrypt.compare(password, user.password_hash)
        if (!valid) {
            return reply.status(401).send({ error: 'Invalid credentials' })
        }

        const token = app.jwt.sign(
            { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
            { expiresIn: '7d' }
        )

        return reply.send({
            token,
            user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role }
        })
    })


    // GET /api/auth/me
    app.get('/me', { preHandler: authenticate }, async (request, reply) => {
        return reply.send({ user: request.user })
    })


}


app.delete('/me', { preHandler: authenticate }, async (request, reply) => {
    await pool.query('DELETE FROM users WHERE id=$1', [request.user.id])
    return reply.send({ message: 'Account deleted' })
})