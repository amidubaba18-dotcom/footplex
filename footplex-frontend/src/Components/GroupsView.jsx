// src/components/GroupsView.jsx
import { useEffect, useState } from 'react';

export default function GroupsView({ tournamentId }) {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadGroups();
    }, [tournamentId]);

    async function loadGroups() {
        setLoading(true);
        const { data, error } = await supabase
            .from('groups_view') // You need to create a view or fetch raw data
            .select('*')
            .eq('tournament_id', tournamentId);
        if (error) {
            // Fallback: fetch from matches and teams manually (simplified)
            await fetchGroupsManually();
        } else {
            setGroups(data);
        }
        setLoading(false);
    }

    async function fetchGroupsManually() {
        // Get all group names from matches
        const { data: matches } = await supabase
            .from('matches')
            .select('group_name, home_team_id, away_team_id, home_score, away_score, status, winner_team_id')
            .eq('tournament_id', tournamentId)
            .not('group_name', 'is', null);

        const groupNames = [...new Set(matches.map(m => m.group_name))].sort();
        const groupsData = [];

        for (const groupName of groupNames) {
            // Get teams that belong to this group
            const groupMatches = matches.filter(m => m.group_name === groupName);
            const teamIds = new Set();
            groupMatches.forEach(m => {
                if (m.home_team_id) teamIds.add(m.home_team_id);
                if (m.away_team_id) teamIds.add(m.away_team_id);
            });
            const { data: teams } = await supabase
                .from('teams')
                .select('id, name')
                .in('id', [...teamIds]);

            // Calculate standings
            const standings = teams.map(team => {
                let played = 0, won = 0, drawn = 0, lost = 0, gf = 0, ga = 0;
                groupMatches.forEach(m => {
                    if (m.home_team_id === team.id) {
                        played++;
                        gf += m.home_score || 0;
                        ga += m.away_score || 0;
                        if (m.status === 'completed') {
                            if (m.home_score > m.away_score) won++;
                            else if (m.home_score === m.away_score) drawn++;
                            else lost++;
                        }
                    } else if (m.away_team_id === team.id) {
                        played++;
                        gf += m.away_score || 0;
                        ga += m.home_score || 0;
                        if (m.status === 'completed') {
                            if (m.away_score > m.home_score) won++;
                            else if (m.away_score === m.home_score) drawn++;
                            else lost++;
                        }
                    }
                });
                const points = won * 3 + drawn;
                const gd = gf - ga;
                return { ...team, played, won, drawn, lost, gf, ga, gd, points };
            });
            standings.sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);

            groupsData.push({ name: groupName, standings, fixtures: groupMatches });
        }
        setGroups(groupsData);
    }

    if (loading) return <div className="p-8 text-center">Loading groups...</div>;
    if (groups.length === 0) return <div className="p-8 text-center text-gray-500">No groups found.</div>;

    return (
        <div className="space-y-8">
            {groups.map(group => (
                <div key={group.name} className="border rounded-xl overflow-hidden">
                    <div className="bg-gray-100 px-4 py-2 font-bold">Group {group.name}</div>
                    <div className="p-4">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-2">Team</th>
                                    <th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th>
                                </tr>
                            </thead>
                            <tbody>
                                {group.standings.map(team => (
                                    <tr key={team.id} className="border-b">
                                        <td className="py-1">{team.name}</td>
                                        <td className="text-center">{team.played}</td>
                                        <td className="text-center">{team.won}</td>
                                        <td className="text-center">{team.drawn}</td>
                                        <td className="text-center">{team.lost}</td>
                                        <td className="text-center">{team.gf}</td>
                                        <td className="text-center">{team.ga}</td>
                                        <td className="text-center">{team.gd}</td>
                                        <td className="text-center font-bold">{team.points}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="mt-4">
                            <h4 className="font-medium text-sm">Fixtures</h4>
                            <div className="grid gap-1 mt-1">
                                {group.fixtures.map(m => (
                                    <div key={m.id} className="text-xs flex justify-between border-b py-1">
                                        <span>{m.home_team_name || 'TBD'} vs {m.away_team_name || 'TBD'}</span>
                                        <span>{m.status === 'completed' ? `${m.home_score} - ${m.away_score}` : 'pending'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}