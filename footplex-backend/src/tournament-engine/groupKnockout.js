// Group stage + knockout
// Teams split into groups, top N from each group advance

export function generateGroups(teams, groupCount) {
    const groups = Array.from({ length: groupCount }, (_, i) => ({
        name: String.fromCharCode(65 + i), // A, B, C, D
        teams: []
    }))

    // Distribute teams into groups
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

// NEW: Generates the empty placeholder bracket for the knockout stage
export function generateKnockoutBracket(groupCount, teamsAdvancePerGroup) {
    const totalKnockoutTeams = groupCount * teamsAdvancePerGroup;
    const knockoutMatches = [];

    // Ensure the number of advancing teams creates a valid bracket (2, 4, 8, 16, etc.)
    if ((totalKnockoutTeams & (totalKnockoutTeams - 1)) !== 0 || totalKnockoutTeams < 2) {
        throw new Error("Total advancing teams must be a power of 2 (e.g., 4, 8, 16)");
    }

    let teamsInRound = totalKnockoutTeams;
    let roundNumber = 1;

    // Generate matches from Quarter-Finals (or whatever round) down to the Final
    while (teamsInRound > 1) {
        const matchesInRound = teamsInRound / 2;
        let roundLabel = '';

        if (matchesInRound === 1) roundLabel = 'Final';
        else if (matchesInRound === 2) roundLabel = 'Semi-Final';
        else if (matchesInRound === 4) roundLabel = 'Quarter-Final';
        else roundLabel = `Round of ${teamsInRound}`;

        for (let i = 0; i < matchesInRound; i++) {
            knockoutMatches.push({
                round_number: roundNumber,
                round_label: roundLabel,
                match_type: 'knockout',
                home_team_id: null,       // To be determined by group results/previous round
                away_team_id: null,       // To be determined by group results/previous round
                is_placeholder: true,
                match_number: i + 1,
                group_name: null
            });
        }

        teamsInRound = matchesInRound;
        roundNumber++;
    }

    return knockoutMatches;
}

// NEW: Master function to generate the entire tournament structure at once
export function generateFullTournament(teams, groupCount, teamsAdvancePerGroup) {
    // 1. Create the groups
    const groups = generateGroups(teams, groupCount);

    // 2. Generate the group stage matches
    const groupMatches = generateGroupMatches(groups);

    // 3. Generate the knockout stage bracket
    const knockoutMatches = generateKnockoutBracket(groupCount, teamsAdvancePerGroup);

    // 4. Return everything so your backend can insert it into the database
    return {
        groups,
        allMatches: [...groupMatches, ...knockoutMatches]
    };
}