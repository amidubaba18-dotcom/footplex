import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import tournamentRoutes from './routes/tournaments.js'
import { authenticate } from './plugins/authenticate.js'

dotenv.config()

const app = Fastify({ logger: false })

await app.register(cors, {
    origin: [
        'http://localhost:5173',
        'https://footplex-abc123.netlify.app'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS']
})
await app.register(jwt, { secret: process.env.JWT_SECRET })

app.register(authRoutes, { prefix: '/api/auth' })
app.register(tournamentRoutes, { prefix: '/api/tournaments' })

app.get('/health', async () => ({ status: 'ok' }))

app.get('/api/me', { preHandler: authenticate }, async (request, reply) => {
    return reply.send({ user: request.user })
})

// Global error handler — catches all unhandled errors in routes
app.setErrorHandler((error, request, reply) => {
    console.error('Route error:', error.message)
    reply.status(error.statusCode || 500).send({
        error: error.message || 'Internal server error'
    })
})

// Prevent process from crashing on unhandled errors
process.on('unhandledRejection', (err) => {
    console.error('Unhandled rejection:', err.message)
})

process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err.message)
})

const PORT = process.env.PORT || 3000
try {
    await app.listen({ port: PORT, host: '0.0.0.0' })
    console.log(`✅ FootPlex backend running on port ${PORT}`)
} catch (err) {
    console.error(err)
    process.exit(1)
}

// Keep-alive ping for Render free tier
if (process.env.NODE_ENV === 'production') {
    setInterval(async () => {
        try {
            await fetch(`https://footplex-backend.onrender.com/health`)
        } catch (err) {
            console.log('Keep-alive ping failed')
        }
    }, 600000) // Every 10 minutes
}