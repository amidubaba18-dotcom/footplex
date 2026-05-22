export function nextPowerOfTwo(teamCount) {
    return Math.max(2, 2 ** Math.ceil(Math.log2(Math.max(2, teamCount))))
}

export function buildSeedOrder(size) {
    let order = [1, 2]

    while (order.length < size) {
        const nextSize = order.length * 2
        const nextOrder = []

        for (const seed of order) {
            nextOrder.push(seed)
            nextOrder.push(nextSize + 1 - seed)
        }

        order = nextOrder
    }

    return order
}

export function seedBracketSlots(teams) {
    const size = nextPowerOfTwo(teams.length)
    const order = buildSeedOrder(size)

    return order.map(seed => teams[seed - 1] || null)
}

export function generateSingleElimination(
    teams,
    {
        startingRound = 1,
        matchType = 'knockout'
    } = {}
) {
    if (!teams || teams.length < 2) return []

    const matches = []
    const slots = seedBracketSlots(teams)
    const totalRounds = Math.log2(slots.length)

    let entrants = slots

    for (let roundOffset = 0; roundOffset < totalRounds; roundOffset++) {
        const roundNumber = startingRound + roundOffset
        const nextEntrants = []

        for (let i = 0; i < entrants.length; i += 2) {
            const home = roundOffset === 0 ? entrants[i] : null
            const away = roundOffset === 0 ? entrants[i + 1] : null
            const autoWinner =
                home?.id != null && away?.id == null
                    ? home.id
                    : away?.id != null && home?.id == null
                        ? away.id
                        : null

            matches.push({
                round_number: roundNumber,
                match_number: i / 2 + 1,
                home_team_id: home?.id ?? null,
                away_team_id: away?.id ?? null,
                match_type: matchType,
                is_placeholder: roundOffset !== 0,
                auto_winner: autoWinner
            })

            nextEntrants.push(null)
        }

        entrants = nextEntrants
    }

    return matches
}

export default generateSingleElimination
