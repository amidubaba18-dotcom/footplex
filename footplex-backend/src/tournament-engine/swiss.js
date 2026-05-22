export function getSwissRounds(teamCount) {
    return Math.max(1, Math.ceil(Math.log2(Math.max(2, teamCount))))
}

function buildMatchHistory(existingMatches) {
    const opponents = new Map()
    const byes = new Set()

    for (const match of existingMatches) {
        const home = match.home_team_id
        const away = match.away_team_id

        if (home != null && away == null) {
            byes.add(home)
            continue
        }

        if (away != null && home == null) {
            byes.add(away)
            continue
        }

        if (home == null || away == null) {
            continue
        }

        if (!opponents.has(home)) opponents.set(home, new Set())
        if (!opponents.has(away)) opponents.set(away, new Set())

        opponents.get(home).add(away)
        opponents.get(away).add(home)
    }

    return { opponents, byes }
}

function sortByStandings(teams) {
    return [...teams].sort((a, b) => {
        if ((b.points || 0) !== (a.points || 0)) {
            return (b.points || 0) - (a.points || 0)
        }

        return a.id - b.id
    })
}

function chooseByeIndex(teams, byes) {
    for (let i = teams.length - 1; i >= 0; i--) {
        if (!byes.has(teams[i].id)) {
            return i
        }
    }

    return teams.length - 1
}

function findOpponentIndex(team, pool, opponents) {
    const seen = opponents.get(team.id) || new Set()

    for (let i = 0; i < pool.length; i++) {
        if (!seen.has(pool[i].id)) {
            return i
        }
    }

    return 0
}

export function generateSwissRound(teams, existingMatches = [], roundNumber = 1) {
    if (!teams || teams.length < 2) return []

    const matches = []

    if (roundNumber === 1) {
        const midpoint = Math.floor(teams.length / 2)
        const firstHalf = teams.slice(0, midpoint)
        const secondHalf = teams.slice(midpoint)

        for (let i = 0; i < firstHalf.length; i++) {
            matches.push({
                round_number: roundNumber,
                match_number: i + 1,
                home_team_id: firstHalf[i]?.id ?? null,
                away_team_id: secondHalf[i]?.id ?? null,
                match_type: 'swiss'
            })
        }

        if (secondHalf.length > firstHalf.length) {
            const byeTeam = secondHalf[secondHalf.length - 1]
            matches.push({
                round_number: roundNumber,
                match_number: matches.length + 1,
                home_team_id: byeTeam.id,
                away_team_id: null,
                match_type: 'swiss',
                auto_winner: byeTeam.id
            })
        }

        return matches
    }

    const { opponents, byes } = buildMatchHistory(existingMatches)
    const pool = sortByStandings(teams)
    let matchNumber = 1

    if (pool.length % 2 === 1) {
        const byeIndex = chooseByeIndex(pool, byes)
        const [byeTeam] = pool.splice(byeIndex, 1)

        matches.push({
            round_number: roundNumber,
            match_number: matchNumber++,
            home_team_id: byeTeam.id,
            away_team_id: null,
            match_type: 'swiss',
            auto_winner: byeTeam.id
        })
    }

    while (pool.length > 0) {
        const team = pool.shift()
        const opponentIndex = findOpponentIndex(team, pool, opponents)
        const [opponent] = pool.splice(opponentIndex, 1)

        matches.push({
            round_number: roundNumber,
            match_number: matchNumber++,
            home_team_id: team.id,
            away_team_id: opponent.id,
            match_type: 'swiss'
        })
    }

    return matches
}

export default generateSwissRound
