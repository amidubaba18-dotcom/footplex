function generateDoubleElimination(teams) {
    const matches = []
    let round = 1
    let currentTeams = [...teams]

    // Winners Bracket (single elimination)
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
        // Only keep every other team for next round (simulating winners advancing)
        const nextRound = []
        for (let i = 0; i < currentTeams.length; i += 2) {
            if (currentTeams[i]) nextRound.push(currentTeams[i])
        }
        currentTeams = nextRound
        round++
    }

    // Grand Final placeholder
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