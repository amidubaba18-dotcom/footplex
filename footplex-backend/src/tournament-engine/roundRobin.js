function generateRoundRobin(teams) {
    const matches = []

    // Add BYE if odd number of teams
    const list =
        teams.length % 2 === 0
            ? [...teams]
            : [...teams, { id: null }]

    const totalTeams = list.length
    const totalRounds = totalTeams - 1
    const matchesPerRound = totalTeams / 2

    for (let round = 0; round < totalRounds; round++) {

        for (let i = 0; i < matchesPerRound; i++) {
            const home = list[i]
            const away = list[totalTeams - 1 - i]

            // Skip BYE matches
            if (home.id && away.id) {
                matches.push({
                    round_number: round + 1,
                    home_team_id: home.id,
                    away_team_id: away.id,
                    match_type: 'group'
                })
            }
        }

        // Rotate teams except first one
        const fixed = list[0]
        const rotating = list.slice(1)

        rotating.unshift(rotating.pop())

        list.splice(0, list.length, fixed, ...rotating)
    }

    return matches
}