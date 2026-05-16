// Group stage + knockout
// Teams split into groups, top N from each group advance

export function generateGroups(teams, groupCount) {
    const groups = Array.from({ length: groupCount }, (_, i) => ({
        name: String.fromCharCode(65 + i), // A, B, C, D
        teams: []
    }))

    // Distribute teams into groups (snake draft for balance)
    teams.forEach((team, i) => {
        const groupIndex = i % groupCount
        groups[groupIndex].teams.push(team)
    })

    return groups
}

export function generateGroupMatches(groups) {
    const allMatches = []

    groups.forEach((group, groupIndex) => {
        const teams = group.teams
        const n = teams.length
        const list = n % 2 !== 0 ? [...teams, { id: null }] : [...teams]
        const total = list.length
        const rounds = total - 1
        const half = total / 2

        for (let round = 0; round < rounds; round++) {
            for (let i = 0; i < half; i++) {
                const home = list[i]
                const away = list[total - 1 - i]
                if (home.id !== null && away.id !== null) {
                    allMatches.push({
                        round_number: round + 1,
                        home_team_id: home.id,
                        away_team_id: away.id,
                        match_type: 'group',
                        group_name: group.name
                    })
                }
            }
            const last = list.splice(total - 1, 1)[0]
            list.splice(1, 0, last)
        }
    })

    return allMatches
}