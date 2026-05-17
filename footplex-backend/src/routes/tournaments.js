import pool from '../plugins/db.js'
import { authenticate } from '../plugins/authenticate.js'

function generateRoundRobin(teams) {
    const matches = []
    const list = teams.length % 2 !== 0 ? [...teams, { id: null }] : [...teams]
    const total = list.length
    const rounds = total - 1
    const half = total / 2
    for (let round = 0; round < rounds; round++) {
        for (let i = 0; i < half; i++) {
            const home = list[i]
            const away = list[total - 1 - i]
            if (home.id !== null && away.id !== null) {
                matches.push({ round_number: round + 1, home_team_id: home.id, away_team_id: away.id })
            }
        }
        const last = list.splice(total - 1, 1)[0]
        list.splice(1, 0, last)
    }
    return matches
}

export default async function tournamentRoutes(app) {

    // ── CREATE TOURNAMENT ──────────────────────────────
    app.post('/', { preHandler: authenticate }, async (request, reply) => {
        const { name, tournament_type, format, max_teams, description, start_date, end_date, group_count, teams_advance_per_group } = request.body
        if (!name || !tournament_type || !format) {
            return reply.status(400).send({ error: 'name, tournament_type and format are required' })
        }
        const slug = name.toLowerCase().trim()
            .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') + '-' + Date.now()
        const result = await pool.query(
            `INSERT INTO tournaments 
      (organizer_id,name,slug,tournament_type,format,max_teams,description,
       start_date,end_date,group_count,teams_advance_per_group)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
            [request.user.id, name, slug, tournament_type, format, max_teams || 8, description || null, start_date || null, end_date || null, group_count || 2, teams_advance_per_group || 2]
        )
        return reply.status(201).send({ tournament: result.rows[0] })
    })

    // ── GET MY TOURNAMENTS ─────────────────────────────
    app.get('/my', { preHandler: authenticate }, async (request, reply) => {
        const result = await pool.query(
            'SELECT * FROM tournaments WHERE organizer_id=$1 ORDER BY created_at DESC',
            [request.user.id]
        )
        return reply.send({ tournaments: result.rows })
    })

    // ── GET PUBLIC TOURNAMENTS ─────────────────────────
    app.get('/', async (request, reply) => {
        const result = await pool.query(
            `SELECT t.*, u.full_name as organizer_name
       FROM tournaments t JOIN users u ON u.id=t.organizer_id
       WHERE t.status IN ('registration','active')
       ORDER BY t.created_at DESC LIMIT 20`
        )
        return reply.send({ tournaments: result.rows })
    })

    // ── UPDATE STATUS ──────────────────────────────────
    app.patch('/:id/status', { preHandler: authenticate }, async (request, reply) => {
        const { status } = request.body
        const allowed = ['draft', 'registration', 'active', 'completed']
        if (!allowed.includes(status)) return reply.status(400).send({ error: 'Invalid status' })
        const check = await pool.query(
            'SELECT * FROM tournaments WHERE id=$1 AND organizer_id=$2',
            [parseInt(request.params.id), request.user.id]
        )
        if (check.rows.length === 0) return reply.status(403).send({ error: 'Not authorized' })
        const result = await pool.query(
            'UPDATE tournaments SET status=$1 WHERE id=$2 RETURNING *',
            [status, parseInt(request.params.id)]
        )
        return reply.send({ tournament: result.rows[0] })
    })

    // ── ADD TEAM ───────────────────────────────────────
    app.post('/:id/teams', { preHandler: authenticate }, async (request, reply) => {
        const { name, contact_name, contact_email } = request.body
        const tournament_id = parseInt(request.params.id)
        if (!name) return reply.status(400).send({ error: 'Team name is required' })
        const tournament = await pool.query('SELECT * FROM tournaments WHERE id=$1', [tournament_id])
        if (tournament.rows.length === 0) return reply.status(404).send({ error: 'Tournament not found' })
        const t = tournament.rows[0]
        const status = t.organizer_id === request.user.id ? 'confirmed' : 'pending'
        const result = await pool.query(
            `INSERT INTO teams (tournament_id,name,contact_name,contact_email,status)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
            [tournament_id, name, contact_name || null, contact_email || null, status]
        )
        return reply.status(201).send({ team: result.rows[0] })
    })

    // ── GET TEAMS ──────────────────────────────────────
    app.get('/:id/teams', async (request, reply) => {
        const result = await pool.query(
            'SELECT * FROM teams WHERE tournament_id=$1 ORDER BY created_at ASC',
            [parseInt(request.params.id)]
        )
        return reply.send({ teams: result.rows })
    })

    // ── UPDATE TEAM STATUS ─────────────────────────────
    app.patch('/:id/teams/:teamId', { preHandler: authenticate }, async (request, reply) => {
        const { status } = request.body
        const tournament_id = parseInt(request.params.id)
        const team_id = parseInt(request.params.teamId)
        if (!['confirmed', 'disqualified'].includes(status)) {
            return reply.status(400).send({ error: 'Invalid status' })
        }
        const check = await pool.query(
            'SELECT * FROM tournaments WHERE id=$1 AND organizer_id=$2',
            [tournament_id, request.user.id]
        )
        if (check.rows.length === 0) return reply.status(403).send({ error: 'Not authorized' })
        const result = await pool.query(
            'UPDATE teams SET status=$1 WHERE id=$2 AND tournament_id=$3 RETURNING *',
            [status, team_id, tournament_id]
        )
        return reply.send({ team: result.rows[0] })
    })

    // ── GENERATE FIXTURES ──────────────────────────────
    app.post('/:id/generate', { preHandler: authenticate }, async (request, reply) => {
        const tournament_id = parseInt(request.params.id)
        const { swiss_round } = request.body || {}

        const tResult = await pool.query(
            'SELECT * FROM tournaments WHERE id=$1 AND organizer_id=$2',
            [tournament_id, request.user.id]
        )
        if (tResult.rows.length === 0) {
            return reply.status(403).send({ error: 'Not authorized' })
        }

        const tournament = tResult.rows[0]

        const teamsResult = await pool.query(
            'SELECT * FROM teams WHERE tournament_id=$1 AND status=$2 ORDER BY id ASC',
            [tournament_id, 'confirmed']
        )

        const teams = teamsResult.rows
        if (teams.length < 2) {
            return reply.status(400).send({ error: 'Need at least 2 confirmed teams' })
        }

        let fixtures = []
        const format = tournament.format

        if (format === 'round_robin') {
            const { generateRoundRobin } = await import('../tournament-engine/roundRobin.js')
            await pool.query('DELETE FROM matches WHERE tournament_id=$1', [tournament_id])
            fixtures = generateRoundRobin(teams)

        } else if (format === 'single_elim') {
            const { generateSingleElimination } = await import('../tournament-engine/singleElimination.js')
            await pool.query('DELETE FROM matches WHERE tournament_id=$1', [tournament_id])
            fixtures = generateSingleElimination(teams)

        } else if (format === 'swiss') {
            const { generateSwissRound, getSwissRounds } = await import('../tournament-engine/swiss.js')
            const existingMatches = await pool.query(
                'SELECT * FROM matches WHERE tournament_id=$1', [tournament_id]
            )
            const nextRound = swiss_round || (Math.max(0, ...existingMatches.rows.map(m => m.round_number)) + 1)

            // For Swiss we get current standings to pair by points
            const standingsResult = await pool.query(
                `WITH results AS (
        SELECT home_team_id AS team_id,
          CASE WHEN home_score>away_score THEN 3 WHEN home_score=away_score THEN 1 ELSE 0 END AS pts
        FROM matches WHERE tournament_id=$1 AND status='completed'
        UNION ALL
        SELECT away_team_id,
          CASE WHEN away_score>home_score THEN 3 WHEN away_score=home_score THEN 1 ELSE 0 END
        FROM matches WHERE tournament_id=$1 AND status='completed'
      )
      SELECT t.id, t.name, COALESCE(SUM(r.pts),0) AS points
      FROM teams t LEFT JOIN results r ON r.team_id=t.id
      WHERE t.tournament_id=$1 AND t.status='confirmed'
      GROUP BY t.id, t.name`,
                [tournament_id]
            )

            fixtures = generateSwissRound(standingsResult.rows, existingMatches.rows, nextRound)

        } else if (format === 'group_knockout') {
            await pool.query('DELETE FROM matches WHERE tournament_id=$1', [tournament_id])

            const groupCount = tournament.group_count || 2
            const teamsPerGroup = Math.floor(teams.length / groupCount)

            const groups = Array.from({ length: groupCount }, (_, i) => ({
                name: String.fromCharCode(65 + i),
                teams: []
            }))

            teams.forEach((team, i) => {
                groups[i % groupCount].teams.push(team)
            })

            for (const group of groups) {
                const groupTeams = group.teams
                const list = groupTeams.length % 2 !== 0
                    ? [...groupTeams, { id: null }]
                    : [...groupTeams]
                const total = list.length
                const rounds = total - 1
                const half = total / 2

                for (let round = 0; round < rounds; round++) {
                    for (let i = 0; i < half; i++) {
                        const home = list[i]
                        const away = list[total - 1 - i]
                        if (home.id !== null && away.id !== null) {
                            fixtures.push({
                                round_number: round + 1,
                                home_team_id: home.id,
                                away_team_id: away.id,
                                match_type: 'group',
                                group_name: group.name,
                                is_placeholder: false
                            })
                        }
                    }
                    const last = list.splice(total - 1, 1)[0]
                    list.splice(1, 0, last)
                }
            }

        } else {
            return reply.status(400).send({ error: `Format ${format} not yet supported` })
        }

        // Insert all fixtures
        const inserted = []
        for (const f of fixtures) {
            if (f.is_placeholder) {
                const r = await pool.query(
                    `INSERT INTO matches 
          (tournament_id, home_team_id, away_team_id, round_number, status, match_type, match_number, group_name, is_placeholder)
         VALUES ($1,$2,$3,$4,'scheduled',$5,$6,$7,$8) RETURNING *`,
                    [tournament_id, f.home_team_id, f.away_team_id, f.round_number,
                        f.match_type || 'elimination', f.match_number || null,
                        f.group_name || null, true]
                )
                inserted.push(r.rows[0])
            } else {
                const r = await pool.query(
                    `INSERT INTO matches 
          (tournament_id, home_team_id, away_team_id, round_number, status, match_type, match_number, group_name)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
                    [tournament_id, f.home_team_id || null, f.away_team_id || null,
                        f.round_number, f.auto_winner ? 'completed' : 'scheduled',
                        f.match_type || 'group', f.match_number || null, f.group_name || null]
                )
                // Auto-advance bye winners
                if (f.auto_winner) {
                    await pool.query(
                        'UPDATE matches SET winner_team_id=$1, home_score=1, away_score=0 WHERE id=$2',
                        [f.auto_winner, r.rows[0].id]
                    )
                }
                inserted.push(r.rows[0])
            }
        }

        await pool.query('UPDATE tournaments SET status=$1 WHERE id=$2', ['active', tournament_id])

        return reply.send({
            message: `Generated ${inserted.length} matches`,
            format: tournament.format,
            rounds: fixtures.length > 0 ? Math.max(...fixtures.map(f => f.round_number)) : 0,
            matches: inserted
        })
    })

    // ── GET FIXTURES ───────────────────────────────────
    app.get('/:id/fixtures', async (request, reply) => {
        const result = await pool.query(
            `SELECT m.*, ht.name as home_team_name, at.name as away_team_name
       FROM matches m
       LEFT JOIN teams ht ON ht.id=m.home_team_id
       LEFT JOIN teams at ON at.id=m.away_team_id
       WHERE m.tournament_id=$1 ORDER BY m.round_number, m.id`,
            [parseInt(request.params.id)]
        )
        return reply.send({ matches: result.rows })
    })

    // ── GET GROUPS ─────────────────────────────────────
    app.get('/:id/groups', async (request, reply) => {
        const tournament_id = parseInt(request.params.id)

        const groupsResult = await pool.query(
            `SELECT DISTINCT group_name FROM matches 
       WHERE tournament_id=$1 AND group_name IS NOT NULL
       ORDER BY group_name`,
            [tournament_id]
        )

        const groups = []

        for (const row of groupsResult.rows) {
            const groupName = row.group_name

            const standingsResult = await pool.query(
                `WITH results AS (
          SELECT home_team_id AS team_id, home_score AS gf, away_score AS ga,
            CASE WHEN home_score>away_score THEN 3 WHEN home_score=away_score THEN 1 ELSE 0 END AS pts,
            (home_score>away_score)::int AS won,
            (home_score=away_score)::int AS drawn,
            (home_score<away_score)::int AS lost
          FROM matches WHERE tournament_id=$1 AND group_name=$2 AND status='completed'
          UNION ALL
          SELECT away_team_id, away_score, home_score,
            CASE WHEN away_score>home_score THEN 3 WHEN away_score=home_score THEN 1 ELSE 0 END,
            (away_score>home_score)::int,
            (away_score=home_score)::int,
            (away_score<home_score)::int
          FROM matches WHERE tournament_id=$1 AND group_name=$2 AND status='completed'
        )
        SELECT t.id, t.name,
          COUNT(r.team_id) AS played,
          COALESCE(SUM(r.won),0) AS won,
          COALESCE(SUM(r.drawn),0) AS drawn,
          COALESCE(SUM(r.lost),0) AS lost,
          COALESCE(SUM(r.gf),0) AS goals_for,
          COALESCE(SUM(r.ga),0) AS goals_against,
          COALESCE(SUM(r.gf),0)-COALESCE(SUM(r.ga),0) AS goal_difference,
          COALESCE(SUM(r.pts),0) AS points
        FROM teams t
        LEFT JOIN results r ON r.team_id=t.id
        WHERE t.tournament_id=$1 AND t.status='confirmed'
        AND t.id IN (
          SELECT DISTINCT home_team_id FROM matches WHERE tournament_id=$1 AND group_name=$2
          UNION
          SELECT DISTINCT away_team_id FROM matches WHERE tournament_id=$1 AND group_name=$2
        )
        GROUP BY t.id, t.name
        ORDER BY points DESC, goal_difference DESC, goals_for DESC`,
                [tournament_id, groupName]
            )

            const fixturesResult = await pool.query(
                `SELECT m.*, ht.name as home_team_name, at.name as away_team_name
         FROM matches m
         JOIN teams ht ON ht.id=m.home_team_id
         JOIN teams at ON at.id=m.away_team_id
         WHERE m.tournament_id=$1 AND m.group_name=$2
         ORDER BY m.round_number, m.id`,
                [tournament_id, groupName]
            )

            groups.push({
                name: groupName,
                standings: standingsResult.rows,
                fixtures: fixturesResult.rows
            })
        }

        return reply.send({ groups })
    })

    // ── SUBMIT SCORE ───────────────────────────────────
    app.patch('/:id/matches/:matchId/score', { preHandler: authenticate }, async (request, reply) => {
        const tournament_id = parseInt(request.params.id)
        const match_id = parseInt(request.params.matchId)
        const { home_score, away_score } = request.body

        if (home_score === undefined || away_score === undefined) {
            return reply.status(400).send({ error: 'Both scores required' })
        }

        const tCheck = await pool.query(
            'SELECT * FROM tournaments WHERE id=$1 AND organizer_id=$2',
            [tournament_id, request.user.id]
        )
        if (tCheck.rows.length === 0) return reply.status(403).send({ error: 'Not authorized' })

        const matchData = await pool.query(
            'SELECT * FROM matches WHERE id=$1 AND tournament_id=$2',
            [match_id, tournament_id]
        )
        if (matchData.rows.length === 0) return reply.status(404).send({ error: 'Match not found' })

        const match = matchData.rows[0]
        let winner_team_id = null
        if (parseInt(home_score) > parseInt(away_score)) {
            winner_team_id = match.home_team_id
        } else if (parseInt(away_score) > parseInt(home_score)) {
            winner_team_id = match.away_team_id
        } else if (tCheck.rows[0].format === 'single_elim') {
            return reply.status(400).send({ error: 'Single elimination cannot have draws — scores must be different' })
        }

        const result = await pool.query(
            `UPDATE matches SET home_score=$1, away_score=$2, status='completed', winner_team_id=$3, played_at=NOW()
       WHERE id=$4 AND tournament_id=$5 RETURNING *`,
            [home_score, away_score, winner_team_id, match_id, tournament_id]
        )

        const tournament = tCheck.rows[0]

        if (tournament.format === 'single_elim') {
            const currentRound = match.round_number
            const matchNumber = match.match_number || 1
            const nextMatchNumber = Math.ceil(matchNumber / 2)
            const nextRound = currentRound + 1

            const nextMatch = await pool.query(
                `SELECT * FROM matches 
       WHERE tournament_id=$1 AND round_number=$2 AND match_number=$3`,
                [tournament_id, nextRound, nextMatchNumber]
            )

            if (nextMatch.rows.length > 0) {
                const nm = nextMatch.rows[0]
                if (!nm.home_team_id) {
                    await pool.query(
                        'UPDATE matches SET home_team_id=$1 WHERE id=$2',
                        [winner_team_id, nm.id]
                    )
                } else if (!nm.away_team_id) {
                    await pool.query(
                        'UPDATE matches SET away_team_id=$1 WHERE id=$2',
                        [winner_team_id, nm.id]
                    )
                }
            }

            const remaining = await pool.query(
                `SELECT COUNT(*) FROM matches 
       WHERE tournament_id=$1 AND status='scheduled' AND is_placeholder=false`,
                [tournament_id]
            )
            if (parseInt(remaining.rows[0].count) === 0) {
                await pool.query(
                    'UPDATE tournaments SET status=$1 WHERE id=$2',
                    ['completed', tournament_id]
                )
            }
        }

        // For group_knockout — auto-generate knockout when group stage is complete
        if (tournament.format === 'group_knockout') {
            const groupStageComplete = await pool.query(
                `SELECT COUNT(*) as remaining FROM matches 
             WHERE tournament_id=$1 AND group_name IS NOT NULL AND status='scheduled'`,
                [tournament_id]
            )

            if (parseInt(groupStageComplete.rows[0].remaining) === 0) {
                // Group stage is done — generate knockout
                const groupCount = tournament.group_count || 2
                const advancePerGroup = tournament.teams_advance_per_group || 2

                const groupsResult = await pool.query(
                    `SELECT DISTINCT group_name FROM matches 
               WHERE tournament_id=$1 AND group_name IS NOT NULL
               ORDER BY group_name`,
                    [tournament_id]
                )

                const advancingTeams = []

                for (const groupRow of groupsResult.rows) {
                    const groupName = groupRow.group_name

                    const standingsResult = await pool.query(
                        `WITH results AS (
                  SELECT home_team_id AS team_id, home_score AS gf, away_score AS ga,
                    CASE WHEN home_score>away_score THEN 3 WHEN home_score=away_score THEN 1 ELSE 0 END AS pts
                  FROM matches WHERE tournament_id=$1 AND group_name=$2 AND status='completed'
                  UNION ALL
                  SELECT away_team_id, away_score, home_score,
                    CASE WHEN away_score>home_score THEN 3 WHEN away_score=home_score THEN 1 ELSE 0 END
                  FROM matches WHERE tournament_id=$1 AND group_name=$2 AND status='completed'
                )
                SELECT t.id, t.name, COALESCE(SUM(r.pts),0) AS points,
                  COALESCE(SUM(r.gf),0)-COALESCE(SUM(r.ga),0) AS goal_difference,
                  COALESCE(SUM(r.gf),0) AS goals_for
                FROM teams t LEFT JOIN results r ON r.team_id=t.id
                WHERE t.tournament_id=$1 AND t.status='confirmed'
                AND t.id IN (
                  SELECT DISTINCT home_team_id FROM matches WHERE tournament_id=$1 AND group_name=$2
                  UNION
                  SELECT DISTINCT away_team_id FROM matches WHERE tournament_id=$1 AND group_name=$2
                )
                GROUP BY t.id, t.name
                ORDER BY points DESC, goal_difference DESC, goals_for DESC
                LIMIT $3`,
                        [tournament_id, groupName, advancePerGroup]
                    )

                    standingsResult.rows.forEach((team, idx) => {
                        advancingTeams.push({
                            team_id: team.id,
                            group_name: groupName,
                            position: idx + 1
                        })
                    })
                }

                const groupRoundMaxResult = await pool.query(
                    'SELECT MAX(round_number) AS max_round FROM matches WHERE tournament_id=$1 AND group_name IS NOT NULL',
                    [tournament_id]
                )
                const groupRoundMax = parseInt(groupRoundMaxResult.rows[0].max_round) || 0

                const existingKnockout = await pool.query(
                    `SELECT COUNT(*) as cnt FROM matches 
                 WHERE tournament_id=$1 AND group_name IS NULL AND round_number > $2`,
                    [tournament_id, groupRoundMax]
                )

                if (parseInt(existingKnockout.rows[0].cnt) > 0) {
                    console.log('Knockout stage already generated, skipping')
                    return reply.send({ match: result.rows[0] })
                }

                const knockoutMatches = []

                if (groupCount === 2 && advancePerGroup === 2) {
                    const semiFinalRound = groupRoundMax + 1
                    const finalRound = groupRoundMax + 2

                    const a1 = advancingTeams.find(t => t.group_name === 'A' && t.position === 1)
                    const a2 = advancingTeams.find(t => t.group_name === 'A' && t.position === 2)
                    const b1 = advancingTeams.find(t => t.group_name === 'B' && t.position === 1)
                    const b2 = advancingTeams.find(t => t.group_name === 'B' && t.position === 2)

                    if (a1 && b2) {
                        knockoutMatches.push({ home_team_id: a1.team_id, away_team_id: b2.team_id, round_number: semiFinalRound, match_number: 1, match_type: 'semi_final' })
                    }
                    if (b1 && a2) {
                        knockoutMatches.push({ home_team_id: b1.team_id, away_team_id: a2.team_id, round_number: semiFinalRound, match_number: 2, match_type: 'semi_final' })
                    }
                    knockoutMatches.push({ home_team_id: null, away_team_id: null, round_number: finalRound, match_number: 1, match_type: 'final', is_placeholder: true })

                } else if (groupCount === 4 && advancePerGroup === 1) {
                    const semiFinalRound = groupRoundMax + 1
                    const finalRound = groupRoundMax + 2

                    const teams = advancingTeams.sort((a, b) => {
                        const groupOrder = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 }
                        return groupOrder[a.group_name] - groupOrder[b.group_name]
                    })

                    if (teams.length >= 4) {
                        knockoutMatches.push(
                            { home_team_id: teams[0].team_id, away_team_id: teams[2].team_id, round_number: semiFinalRound, match_number: 1, match_type: 'semi_final' },
                            { home_team_id: teams[1].team_id, away_team_id: teams[3].team_id, round_number: semiFinalRound, match_number: 2, match_type: 'semi_final' }
                        )
                        knockoutMatches.push({ home_team_id: null, away_team_id: null, round_number: finalRound, match_number: 1, match_type: 'final', is_placeholder: true })
                    }

                } else if (groupCount === 4 && advancePerGroup === 2) {
                    const quarterFinalRound = groupRoundMax + 1
                    const semiFinalRound = groupRoundMax + 2
                    const finalRound = groupRoundMax + 3

                    const a1 = advancingTeams.find(t => t.group_name === 'A' && t.position === 1)
                    const a2 = advancingTeams.find(t => t.group_name === 'A' && t.position === 2)
                    const b1 = advancingTeams.find(t => t.group_name === 'B' && t.position === 1)
                    const b2 = advancingTeams.find(t => t.group_name === 'B' && t.position === 2)
                    const c1 = advancingTeams.find(t => t.group_name === 'C' && t.position === 1)
                    const c2 = advancingTeams.find(t => t.group_name === 'C' && t.position === 2)
                    const d1 = advancingTeams.find(t => t.group_name === 'D' && t.position === 1)
                    const d2 = advancingTeams.find(t => t.group_name === 'D' && t.position === 2)

                    if (a1 && b2 && c1 && d2 && b1 && a2 && d1 && c2) {
                        knockoutMatches.push(
                            { home_team_id: a1.team_id, away_team_id: b2.team_id, round_number: quarterFinalRound, match_number: 1, match_type: 'quarter_final' },
                            { home_team_id: c1.team_id, away_team_id: d2.team_id, round_number: quarterFinalRound, match_number: 2, match_type: 'quarter_final' },
                            { home_team_id: b1.team_id, away_team_id: a2.team_id, round_number: quarterFinalRound, match_number: 3, match_type: 'quarter_final' },
                            { home_team_id: d1.team_id, away_team_id: c2.team_id, round_number: quarterFinalRound, match_number: 4, match_type: 'quarter_final' }
                        )
                        knockoutMatches.push(
                            { home_team_id: null, away_team_id: null, round_number: semiFinalRound, match_number: 1, match_type: 'semi_final', is_placeholder: true },
                            { home_team_id: null, away_team_id: null, round_number: semiFinalRound, match_number: 2, match_type: 'semi_final', is_placeholder: true }
                        )
                        knockoutMatches.push({ home_team_id: null, away_team_id: null, round_number: finalRound, match_number: 1, match_type: 'final', is_placeholder: true })
                    }
                }

                for (const match of knockoutMatches) {
                    await pool.query(
                        `INSERT INTO matches (tournament_id, home_team_id, away_team_id, round_number, status, match_type, match_number, is_placeholder)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
                        [tournament_id, match.home_team_id, match.away_team_id, match.round_number, 'scheduled', match.match_type, match.match_number, match.is_placeholder || false]
                    )
                }
            }
        }

        return reply.send({ match: result.rows[0] })
    })

    // ── GET STANDINGS ──────────────────────────────────
    app.get('/:id/standings', async (request, reply) => {
        const result = await pool.query(
            `WITH results AS (
        SELECT home_team_id AS team_id, home_score AS gf, away_score AS ga,
          CASE WHEN home_score>away_score THEN 3 WHEN home_score=away_score THEN 1 ELSE 0 END AS pts,
          (home_score>away_score)::int AS won, (home_score=away_score)::int AS drawn, (home_score<away_score)::int AS lost
        FROM matches WHERE tournament_id=$1 AND status='completed'
        UNION ALL
        SELECT away_team_id, away_score, home_score,
          CASE WHEN away_score>home_score THEN 3 WHEN away_score=home_score THEN 1 ELSE 0 END,
          (away_score>home_score)::int, (away_score=home_score)::int, (away_score<home_score)::int
        FROM matches WHERE tournament_id=$1 AND status='completed'
      )
      SELECT t.id, t.name,
        COUNT(r.team_id) AS played, SUM(r.won) AS won, SUM(r.drawn) AS drawn, SUM(r.lost) AS lost,
        SUM(r.gf) AS goals_for, SUM(r.ga) AS goals_against,
        SUM(r.gf)-SUM(r.ga) AS goal_difference, SUM(r.pts) AS points
      FROM teams t LEFT JOIN results r ON r.team_id=t.id
      WHERE t.tournament_id=$1 AND t.status='confirmed'
      GROUP BY t.id, t.name
      ORDER BY points DESC, goal_difference DESC, goals_for DESC`,
            [parseInt(request.params.id)]
        )
        return reply.send({ standings: result.rows })
    })

    // ── GET MESSAGES ───────────────────────────────────
    app.get('/:id/messages', async (request, reply) => {
        const result = await pool.query(
            'SELECT * FROM messages WHERE tournament_id=$1 ORDER BY created_at ASC LIMIT 100',
            [parseInt(request.params.id)]
        )
        return reply.send({ messages: result.rows })
    })

    // ── SEND MESSAGE ───────────────────────────────────
    app.post('/:id/messages', async (request, reply) => {
        const { sender_name, content } = request.body
        const tournament_id = parseInt(request.params.id)
        if (!sender_name?.trim() || !content?.trim()) {
            return reply.status(400).send({ error: 'Name and message required' })
        }
        const result = await pool.query(
            'INSERT INTO messages (tournament_id,sender_name,content) VALUES ($1,$2,$3) RETURNING *',
            [tournament_id, sender_name.trim(), content.trim()]
        )
        return reply.status(201).send({ message: result.rows[0] })
    })


    // POST /:id/teams/request — public team request (no auth required)
app.post('/:id/teams/request', async (request, reply) => {
  const { name, contact_name, contact_email } = request.body
  const tournament_id = parseInt(request.params.id)

  if (!name?.trim()) return reply.status(400).send({ error: 'Team name is required' })

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

  return reply.status(201).send({ 
    team: result.rows[0],
    message: 'Team request submitted! Organizer will review and approve.'
  })
})

    // ── GET ONE TOURNAMENT BY SLUG — must be LAST ──────
    app.get('/:slug', async (request, reply) => {
        const result = await pool.query(
            `SELECT t.*, u.full_name as organizer_name
       FROM tournaments t JOIN users u ON u.id=t.organizer_id
       WHERE t.slug=$1`,
            [request.params.slug]
        )
        if (result.rows.length === 0) return reply.status(404).send({ error: 'Tournament not found' })
        return reply.send({ tournament: result.rows[0] })
    })




}

app.delete('/:id', { preHandler: authenticate }, async (request, reply) => {
  const tournament_id = parseInt(request.params.id)

  const check = await pool.query(
    'SELECT * FROM tournaments WHERE id=$1 AND organizer_id=$2',
    [tournament_id, request.user.id]
  )

  if (check.rows.length === 0) return reply.status(403).send({ error: 'Not authorized' })

  await pool.query('DELETE FROM tournaments WHERE id=$1', [tournament_id])
  return reply.send({ message: 'Tournament deleted' })
})