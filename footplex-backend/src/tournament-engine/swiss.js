function generateSwiss(teams) {
    const matches = []
    const numRounds = Math.ceil(Math.log2(teams.length))

    for (let round = 1; round <= numRounds; round++) {
        const teamList = [...teams]
        let matchNum = 1

        // Pair teams sequentially (in real Swiss, would pair by points)
        for (let i = 0; i < teamList.length; i += 2) {
            matches.push({
                home_team_id: teamList[i]?.id || null,
                away_team_id: teamList[i + 1]?.id || null,
                round_number: round,
                match_number: matchNum++,
                match_type: 'swiss',
                is_placeholder: !teamList[i + 1],
                status: 'scheduled'
            })
        }
    }

    return matches
}