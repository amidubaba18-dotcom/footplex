import { seedBracketSlots } from './singleElimination.js'

export function getLosersRoundCounts(bracketSize) {
    const winnersRounds = Math.log2(bracketSize)

    if (winnersRounds <= 1) {
        return []
    }

    const counts = [bracketSize / 4]

    for (let winnersRound = 2; winnersRound < winnersRounds; winnersRound++) {
        counts.push(bracketSize / (2 ** winnersRound))
        counts.push(bracketSize / (2 ** (winnersRound + 1)))
    }

    counts.push(1)
    return counts
}

export function generateDoubleElimination(teams) {
    if (!teams || teams.length < 2) return []

    const matches = []
    const slots = seedBracketSlots(teams)
    const winnersRounds = Math.log2(slots.length)

    let entrants = slots

    for (let round = 1; round <= winnersRounds; round++) {
        const nextEntrants = []

        for (let i = 0; i < entrants.length; i += 2) {
            const home = round === 1 ? entrants[i] : null
            const away = round === 1 ? entrants[i + 1] : null
            const autoWinner =
                home?.id != null && away?.id == null
                    ? home.id
                    : away?.id != null && home?.id == null
                        ? away.id
                        : null

            matches.push({
                round_number: round,
                match_number: i / 2 + 1,
                home_team_id: home?.id ?? null,
                away_team_id: away?.id ?? null,
                match_type: 'winners',
                is_placeholder: round !== 1,
                auto_winner: autoWinner
            })

            nextEntrants.push(null)
        }

        entrants = nextEntrants
    }

    const losersRoundCounts = getLosersRoundCounts(slots.length)

    losersRoundCounts.forEach((matchCount, roundIndex) => {
        for (let matchNumber = 1; matchNumber <= matchCount; matchNumber++) {
            matches.push({
                round_number: roundIndex + 1,
                match_number: matchNumber,
                home_team_id: null,
                away_team_id: null,
                match_type: 'losers',
                is_placeholder: true
            })
        }
    })

    matches.push({
        round_number: 1,
        match_number: 1,
        home_team_id: null,
        away_team_id: null,
        match_type: 'grand_final',
        is_placeholder: true
    })

    return matches
}

export default generateDoubleElimination
