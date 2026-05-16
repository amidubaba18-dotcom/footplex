import pool from '../plugins/db.js'
import { authenticate } from '../plugins/authenticate.js'

export default async function teamRoutes(app) {

    // POST /api/tournaments/:id/teams
    app.post('/:id/teams', { preHandler: authenticate }, async (request, reply) => {
        const { name, contact_name, contact_email } = request.body
        const tournament_id = parseInt(request.params.id)

        if (!name) return reply.status(400).send({ error: 'Team name is required' })

        const tournament = await pool.query(
            'SELECT * FROM tournaments WHERE id = $1', [tournament_id]
        )
        if (tournament.rows.length === 0) {
            return reply.status(404).send({ error: 'Tournament not found' })
        }

        const t = tournament.rows[0]
        const isOrganizer = t.organizer_id === request.user.id
        const status = isOrganizer ? 'confirmed' : 'pending'

        const result = await pool.query(
            `INSERT INTO teams (tournament_id, name, contact_name, contact_email, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [tournament_id, name, contact_name || null, contact_email || null, status]
        )

        return reply.status(201).send({ team: result.rows[0] })
    })


    // GET /api/tournaments/:id/teams
    app.get('/:id/teams', async (request, reply) => {
        const result = await pool.query(
            'SELECT * FROM teams WHERE tournament_id = $1 ORDER BY created_at ASC',
            [parseInt(request.params.id)]
        )
        return reply.send({ teams: result.rows })
    })


    // PATCH /api/tournaments/:id/teams/:teamId
    app.patch('/:id/teams/:teamId', { preHandler: authenticate }, async (request, reply) => {
        const { status } = request.body
        const tournament_id = parseInt(request.params.id)
        const team_id = parseInt(request.params.teamId)

        if (!['confirmed', 'disqualified'].includes(status)) {
            return reply.status(400).send({ error: 'Status must be confirmed or disqualified' })
        }

        const tournament = await pool.query(
            'SELECT * FROM tournaments WHERE id = $1 AND organizer_id = $2',
            [tournament_id, request.user.id]
        )
        if (tournament.rows.length === 0) {
            return reply.status(403).send({ error: 'Not authorized' })
        }

        const result = await pool.query(
            'UPDATE teams SET status = $1 WHERE id = $2 AND tournament_id = $3 RETURNING *',
            [status, team_id, tournament_id]
        )
        return reply.send({ team: result.rows[0] })
    })

}