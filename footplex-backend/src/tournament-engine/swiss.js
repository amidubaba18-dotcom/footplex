// Swiss system — everyone plays every round
// Paired by current standing — no eliminations
// Best for 8-32 teams, fixed number of rounds

export function generateSwissRound(teams, existingMatches, roundNumber) {
    // Sort teams by points (or randomly for round 1)
    const sorted = [...teams]

    if (roundNumber === 1) {
        // Random pairing for first round
        for (let i = sorted.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
                ;[sorted[i], sorted[j]] = [sorted[j], sorted[i]]
        }
    } else {
        // Sort by points descending
        sorted.sort((a, b) => (b.points || 0) - (a.points || 0))
    }

    const matches = []
    const paired = new Set()

    for (let i = 0; i < sorted.length; i++) {
        if (paired.has(sorted[i].id)) continue

        for (let j = i + 1; j < sorted.length; j++) {
            if (paired.has(sorted[j].id)) continue

            // Check they haven't played before
            const alreadyPlayed = existingMatches.some(m =>
                (m.home_team_id === sorted[i].id && m.away_team_id === sorted[j].id) ||
                (m.home_team_id === sorted[j].id && m.away_team_id === sorted[i].id)
            )

            if (!alreadyPlayed) {
                matches.push({
                    round_number: roundNumber,
                    home_team_id: sorted[i].id,
                    away_team_id: sorted[j].id,
                    match_type: 'swiss'
                })
                paired.add(sorted[i].id)
                paired.add(sorted[j].id)
                break
            }
        }
    }

    return matches
}

export function getSwissRounds(teamCount) {
    // Standard Swiss rounds formula
    return Math.ceil(Math.log2(teamCount)) + 1
}