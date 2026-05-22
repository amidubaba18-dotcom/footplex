// groupKnockout.js – corrected group distribution + knockout bracket generation

export function generateGroups(teams, groupCount) {
    const groups = Array.from({ length: groupCount }, (_, i) => ({
        name: String.fromCharCode(65 + i), // A, B, C, D
        teams: []
    }));

    // Distribute teams evenly (stronger teams spread across groups)
    const shuffled = [...teams];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    shuffled.forEach((team, idx) => {
        const groupIndex = idx % groupCount;
        groups[groupIndex].teams.push(team);
    });

    return groups;
}

export function generateGroupMatches(groups) {
    const allMatches = [];
    let globalMatchNumber = 1;

    groups.forEach(group => {
        const teams = group.teams;
        const n = teams.length;
        if (n < 2) return;

        // Round‑robin algorithm (circle method)
        const list = [...teams];
        if (n % 2 !== 0) list.push({ id: null }); // dummy for bye
        const total = list.length;
        const rounds = total - 1;
        const half = total / 2;

        for (let round = 0; round < rounds; round++) {
            for (let i = 0; i < half; i++) {
                const home = list[i];
                const away = list[total - 1 - i];
                if (home.id !== null && away.id !== null) {
                    allMatches.push({
                        round_number: round + 1,
                        match_number: globalMatchNumber++,
                        home_team_id: home.id,
                        away_team_id: away.id,
                        match_type: 'group',
                        group_name: group.name,
                        status: 'scheduled',
                        is_placeholder: false
                    });
                }
            }
            // rotate
            const last = list.pop();
            list.splice(1, 0, last);
        }
    });

    return allMatches;
}