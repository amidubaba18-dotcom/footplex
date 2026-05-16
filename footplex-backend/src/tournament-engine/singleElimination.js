// Single elimination — losers are out, winners advance
// Requires power of 2 teams (4, 8, 16, 32)
// If not power of 2, top seeds get byes

export function generateSingleElimination(teams) {
    const matches = []
    const n = teams.length
    const size = Math.pow(2, Math.ceil(Math.log2(n)))
    const padded = [...teams]
    while (padded.length < size) padded.push(null)

    let matchCounter = 1
    let round = 1
    let currentSize = size

    const round1 = []
    for (let i = 0; i < size; i += 2) {
        const home = padded[i]
        const away = padded[i + 1]
        const matchNum = matchCounter++

        if (home && away) {
            round1.push({
                round_number: round,
                home_team_id: home.id,
                away_team_id: away.id,
                match_type: 'elimination',
                match_number: matchNum,
                is_placeholder: false
            })
        } else if (home && !away) {
            round1.push({
                round_number: round,
                home_team_id: home.id,
                away_team_id: null,
                match_type: 'bye',
                match_number: matchNum,
                auto_winner: home.id,
                is_placeholder: false
            })
        }
    }
    matches.push(...round1)

    currentSize = size / 2
    round++
    matchCounter = 1

    while (currentSize >= 1) {
        const matchesInRound = currentSize / 2
        if (matchesInRound < 1) break

        for (let i = 0; i < matchesInRound; i++) {
            let matchType = 'elimination'
            if (currentSize === 2) matchType = 'final'
            else if (currentSize === 4) matchType = 'semi_final'
            else if (currentSize === 8) matchType = 'quarter_final'

            matches.push({
                round_number: round,
                home_team_id: null,
                away_team_id: null,
                match_type: matchType,
                match_number: i + 1,
                is_placeholder: true
            })
        }

        currentSize = currentSize / 2
        round++
        matchCounter = 1
    }

    return matches
}

export function getRoundName(totalTeams, roundNumber) {
    const totalRounds = Math.ceil(Math.log2(totalTeams))
    const roundsFromEnd = totalRounds - roundNumber + 1
    if (roundsFromEnd === 1) return 'Final'
    if (roundsFromEnd === 2) return 'Semi-Finals'
    if (roundsFromEnd === 3) return 'Quarter-Finals'
    if (roundsFromEnd === 4) return 'Round of 16'
    if (roundsFromEnd === 5) return 'Round of 32'
    return `Round ${roundNumber}`
}