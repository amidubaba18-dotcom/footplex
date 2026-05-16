import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

const { Pool } = pg

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 3,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
})

pool.connect()
    .then(client => {
        console.log('✅ Database connected')
        client.release()
    })
    .catch(err => {
        console.error('❌ Database error:', err.message)
    })

pool.on('error', (err) => {
    console.error('❌ Pool error:', err.message)
})

export default pool