import { seedBracketSlots } from './singleElimination.js'

function isPowerOfTwo(num) {
    return (num & (num - 1)) === 0
}

export function getLosersRoundCounts(bracketSize) {
    if (!isPowerOfTwo(bracketSize) || bracketSize < 4) {
        return []
    }

    const winnersRounds = Math.log2(bracketSize)
    const rounds = []

    // First losers round
    rounds.push(bracketSize / 4)

    // Middle losers rounds
    for (let winnersRound = 2; winnersRound < winnersRounds; winnersRound++) {
        rounds.push(bracketSize / (2 ** winnersRound))
        rounds.push(bracketSize / (2 ** (winnersRound + 1)))
    }

    // Losers final
    rounds.push(1)

    return rounds
}

function createMatch({
    round,
    matchNumber,
    type,
    home = null,
    away = null,
    placeholder = true,
    autoWinner = null
}) {
    return {
        round_number: round,
        match_number: matchNumber,
        match_type: type,

        home_team_id: home?.id ?? null,
        away_team_id: away?.id ?? null,

        is_placeholder: placeholder,
        auto_winner: autoWinner
    }
}

export function generateDoubleElimination(teams) {
    if (!Array.isArray(teams) || teams.length < 2) {
        return []
    }

    const slots = seedBracketSlots(teams)
    const bracketSize = slots.length

    if (!isPowerOfTwo(bracketSize)) {
        throw new Error('Bracket size must be a power of 2')
    }

    const matches = []

    // -----------------------------
    // WINNERS BRACKET
    // -----------------------------
    let entrants = [...slots]
    const winnersRounds = Math.log2(bracketSize)

    for (let round = 1; round <= winnersRounds; round++) {
        const nextRoundEntrants = []

        for (let i = 0; i < entrants.length; i += 2) {
            const home = round === 1 ? entrants[i] : null
            const away = round === 1 ? entrants[i + 1] : null

            let autoWinner = null

            if (home?.id && !away?.id) {
                autoWinner = home.id
            } else if (away?.id && !home?.id) {
                autoWinner = away.id
            }

            matches.push(
                createMatch({
                    round,
                    matchNumber: i / 2 + 1,
                    type: 'winners',
                    home,
                    away,
                    placeholder: round !== 1,
                    autoWinner
                })
            )

            nextRoundEntrants.push(null)
        }

        entrants = nextRoundEntrants
    }

    // -----------------------------
    // LOSERS BRACKET
    // -----------------------------
    const losersRounds = getLosersRoundCounts(bracketSize)

    losersRounds.forEach((matchCount, index) => {
        const round = index + 1

        for (let matchNumber = 1; matchNumber <= matchCount; matchNumber++) {
            matches.push(
                createMatch({
                    round,
                    matchNumber,
                    type: 'losers'
                })
            )
        }
    })

    // -----------------------------
    // GRAND FINAL
    // -----------------------------
    matches.push(
        createMatch({
            round: 1,
            matchNumber: 1,
            type: 'grand_final'
        })
    )

    return matches
}

export default generateDoubleElimination