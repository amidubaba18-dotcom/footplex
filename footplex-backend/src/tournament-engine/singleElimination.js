function generateSingleElimination(teams) {
    const matches = []

    const nextPowerOf2 = Math.pow(
        2,
        Math.ceil(Math.log2(teams.length))
    )

    const byes = nextPowerOf2 - teams.length

    // Add null teams for BYEs
    const bracketTeams = [
        ...teams,
        ...Array(byes).fill({ id: null })
    ]

    let totalRounds = Math.log2(nextPowerOf2)
    let teamsInRound = bracketTeams

    for (let round = 1; round <= totalRounds; round++) {
        const roundMatches = []

        for (let i = 0; i < teamsInRound.length; i += 2) {
            const home = teamsInRound[i]
            const away = teamsInRound[i + 1]

            roundMatches.push({
                round_number: round,
                match_number: i / 2 + 1,
                home_team_id: round === 1 ? home?.id : null,
                away_team_id: round === 1 ? away?.id : null,
                match_type: 'knockout',
                is_placeholder: round !== 1
            })
        }

        matches.push(...roundMatches)

        // Next round only needs placeholder slots
        teamsInRound = new Array(roundMatches.length).fill(null)
    }

    return matches
}