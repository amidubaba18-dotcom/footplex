export function generateRoundRobin(teams) {
    const matches = []
    const list = teams.length % 2 !== 0 ? [...teams, { id: null }] : [...teams]
    const total = list.length
    const rounds = total - 1
    const half = total / 2

    for (let round = 0; round < rounds; round++) {
        for (let i = 0; i < half; i++) {
            const home = list[i]
            const away = list[total - 1 - i]
            if (home.id !== null && away.id !== null) {
                matches.push({
                    round_number: round + 1,
                    home_team_id: home.id,
                    away_team_id: away.id,
                    match_type: 'group'
                })
            }
        }
        const last = list.splice(total - 1, 1)[0]
        list.splice(1, 0, last)
    }
    return matches
}