// src/components/GroupsView.jsx
import { useEffect, useState } from 'react';
import api from '../lib/api';
import Avatar from './Avatar';

export default function GroupsView({ tournamentId }) {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadGroups();
    }, [tournamentId]);

    async function loadGroups() {
        setLoading(true);
        try {
            const res = await api.get(`/api/tournaments/${tournamentId}/groups`);
            setGroups(res.data.groups || []);
        } catch (err) {
            console.error('Failed to load groups:', err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <div className="p-8 text-center">Loading groups...</div>;
    if (!groups || groups.length === 0) return <div className="p-8 text-center text-gray-500">No groups found.</div>;

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
                                        <td className="py-1">
                                            <div className="flex items-center gap-2">
                                                <Avatar src={team.logo_url} name={team.name} size="w-5 h-5" text_size="text-[10px]" />
                                                <span>{team.name}</span>
                                            </div>
                                        </td>
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