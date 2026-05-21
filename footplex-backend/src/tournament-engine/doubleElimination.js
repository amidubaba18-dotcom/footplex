function generateDoubleElimination(teams) {
    if (!teams || teams.length === 0) return []

    const matches = []
    let round = 1
    let teamsToProcess = teams.map(t => ({ ...t })) // Copy array

    // Winners bracket - standard single elimination
    while (teamsToProcess.length > 1) {
        for (let i = 0; i < teamsToProcess.length; i += 2) {
            const home = teamsToProcess[i]
            const away = teamsToProcess[i + 1]

            matches.push({
                home_team_id: home?.id || null,
                away_team_id: away?.id || null,
                round_number: round,
                match_number: Math.floor(i / 2) + 1,
                match_type: 'winners',
                is_placeholder: !away,
                status: 'scheduled'
            })
        }

        // Keep only first team from each pair (simulating winners advance)
        const nextRound = []
        for (let i = 0; i < teamsToProcess.length; i += 2) {
            if (teamsToProcess[i]) nextRound.push(teamsToProcess[i])
        }

        teamsToProcess = nextRound
        round++
    }

    // Final match placeholder
    matches.push({
        home_team_id: null,
        away_team_id: null,
        round_number: round + 1,
        match_number: 1,
        match_type: 'grand_final',
        is_placeholder: true,
        status: 'scheduled'
    })

    return matches
}