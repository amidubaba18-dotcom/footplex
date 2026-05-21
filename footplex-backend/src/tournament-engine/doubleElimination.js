export function generateDoubleElimination(teams) {
    if (teams.length < 2) return { matches: [], error: 'Need at least 2 teams' }

    const matches = []
    let matchId = 1
    let round = 1

    // WINNERS BRACKET (Single elimination)
    const winnersMatches = generateBracket(teams, 'winners', matchId, round)
    matches.push(...winnersMatches.matches)
    matchId = winnersMatches.nextId
    round = winnersMatches.nextRound

    // LOSERS BRACKET (Single elimination from losers)
    // This is complex, so we'll create losers matches as teams lose
    // For now, create placeholder structure

    // GRAND FINAL
    matches.push({
        home_team_id: null,
        away_team_id: null,
        round_number: round + 1,
        match_number: 1,
        match_type: 'grand_final',
        is_placeholder: true,
        status: 'scheduled'
    })

    return { matches, format: 'double_elimination' }
}

function generateBracket(teams, bracket_type, startId, startRound) {
    const matches = []
    let matchId = startId
    let round = startRound
    let currentRound = teams.map((t, i) => ({ team_id: t.id, seed: i + 1 }))

    while (currentRound.length > 1) {
        const roundMatches = []
        for (let i = 0; i < currentRound.length; i += 2) {
            const home = currentRound[i]
            const away = currentRound[i + 1]

            roundMatches.push({
                home_team_id: home.team_id,
                away_team_id: away?.team_id || null,
                round_number: round,
                match_number: Math.floor(i / 2) + 1,
                match_type: bracket_type,
                is_placeholder: !away,
                status: 'scheduled'
            })

            matchId++
        }

        matches.push(...roundMatches)
        currentRound = roundMatches
            .filter(m => m.home_team_id)
            .map((m, i) => ({ team_id: null, seed: i + 1, match_id: m.match_id }))
        round++
    }

    return { matches, nextId: matchId, nextRound: round }
}