import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'

export default function ManageTournament() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [tournament, setTournament] = useState(null)
    const [teams, setTeams] = useState([])
    const [fixtures, setFixtures] = useState([])
    const [standings, setStandings] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('teams')
    const [newTeam, setNewTeam] = useState({ name: '', contact_name: '', contact_email: '' })
    const [addingTeam, setAddingTeam] = useState(false)
    const [showAddTeam, setShowAddTeam] = useState(false)

    useEffect(() => {
        loadData()
    }, [id])

    async function loadData() {
        try {
            const [tRes, teamsRes, fixturesRes, standingsRes] = await Promise.all([
                api.get(`/api/tournaments/${id}`),
                api.get(`/api/tournaments/${id}/teams`),
                api.get(`/api/tournaments/${id}/fixtures`),
                api.get(`/api/tournaments/${id}/standings`)
            ])

            setTournament(tRes.data.tournament)
            setTeams(teamsRes.data.teams || [])
            setFixtures(fixturesRes.data.fixtures || [])
            setStandings(standingsRes.data.standings || [])
        } catch (err) {
            console.error('Load error:', err)
        } finally {
            setLoading(false)
        }
    }

    async function handleAddTeam(e) {
        e.preventDefault()
        if (!newTeam.name) return alert('Team name required')

        setAddingTeam(true)
        try {
            const res = await api.post(`/api/tournaments/${id}/teams`, newTeam)
            setTeams([...teams, res.data.team])
            setNewTeam({ name: '', contact_name: '', contact_email: '' })
            setShowAddTeam(false)
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to add team')
        } finally {
            setAddingTeam(false)
        }
    }

    async function handleGenerateFixtures() {
        try {
            await api.post(`/api/tournaments/${id}/generate`)
            await loadData()
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to generate fixtures')
        }
    }

    async function handleScoreSubmit(matchId, homeScore, awayScore) {
        try {
            await api.patch(`/api/tournaments/${id}/matches/${matchId}/score`, {
                home_score: homeScore,
                away_score: awayScore
            })
            await loadData()
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to submit score')
        }
    }

    async function handleDeleteTournament() {
        if (!window.confirm('Delete this tournament permanently?')) return

        try {
            await api.delete(`/api/tournaments/${id}`)
            navigate('/dashboard')
        } catch (err) {
            alert(err.response?.data?.error || 'Delete failed')
        }
    }

    if (loading) return <div className="p-8 text-center">Loading...</div>
    if (!tournament) return <div className="p-8 text-center">Tournament not found</div>

    const confirmed = (teams || []).filter(t => t.status === 'confirmed')
    const pending = (teams || []).filter(t => t.status === 'pending')
    const groupMatches = (fixtures || []).filter(f => f.group_name)
    const knockoutMatches = (fixtures || []).filter(f => !f.group_name)

    return (
        <div className="max-w-6xl mx-auto px-6 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{tournament.name}</h1>
                    <p className="text-gray-500 text-sm mt-1 capitalize">{tournament.format.replace(/_/g, ' ')}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate(`/t/${tournament.slug}`)}
                        className="text-sm bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200"
                    >
                        👁 View Public
                    </button>
                    <button
                        onClick={handleDeleteTournament}
                        className="text-sm bg-red-100 text-red-600 px-3 py-2 rounded-lg hover:bg-red-200"
                    >
                        🗑 Delete
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200">
                {['teams', 'fixtures', 'standings', 'bracket'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 font-medium text-sm capitalize transition-colors ${activeTab === tab
                                ? 'text-brand-500 border-b-2 border-brand-500'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* TEAMS TAB */}
            {activeTab === 'teams' && (
                <div className="space-y-6">
                    {confirmed.length < tournament.max_teams && (
                        <button
                            onClick={() => setShowAddTeam(!showAddTeam)}
                            className="btn-primary text-sm"
                        >
                            ➕ Add Team
                        </button>
                    )}

                    {showAddTeam && (
                        <form onSubmit={handleAddTeam} className="card space-y-3">
                            {confirmed.length >= tournament.max_teams && (
                                <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm rounded-lg">
                                    ⚠️ Tournament full ({confirmed.length}/{tournament.max_teams})
                                </div>
                            )}
                            <input required placeholder="Team name" value={newTeam.name} onChange={e => setNewTeam(n => ({ ...n, name: e.target.value }))} className="input" />
                            <input placeholder="Contact (optional)" value={newTeam.contact_name} onChange={e => setNewTeam(n => ({ ...n, contact_name: e.target.value }))} className="input" />
                            <input placeholder="Email (optional)" value={newTeam.contact_email} onChange={e => setNewTeam(n => ({ ...n, contact_email: e.target.value }))} className="input" />
                            <button type="submit" disabled={addingTeam} className="btn-primary w-full disabled:opacity-40">
                                {addingTeam ? 'Adding...' : 'Add Team'}
                            </button>
                        </form>
                    )}

                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Confirmed ({confirmed.length}/{tournament.max_teams})</p>
                        <div className="space-y-2">
                            {confirmed.map(t => (
                                <div key={t.id} className="card p-4 flex items-center justify-between">
                                    <span className="font-medium">{t.name}</span>
                                    <span className="text-xs text-gray-400">{t.contact_email || 'No contact'}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {pending.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Pending ({pending.length})</p>
                            <div className="space-y-2">
                                {pending.map(t => (
                                    <div key={t.id} className="card bg-yellow-50 border-yellow-200 p-4 flex items-center justify-between">
                                        <span>{t.name}</span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => api.patch(`/api/tournaments/${id}/teams/${t.id}`, { action: 'approve' }).then(() => loadData())}
                                                className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded hover:bg-green-200"
                                            >
                                                ✓
                                            </button>
                                            <button
                                                onClick={() => api.patch(`/api/tournaments/${id}/teams/${t.id}`, { action: 'reject' }).then(() => loadData())}
                                                className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200"
                                            >
                                                ✗
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {confirmed.length >= 2 && !fixtures.length && (
                        <button onClick={handleGenerateFixtures} className="btn-primary w-full">
                            🎯 Generate Fixtures
                        </button>
                    )}
                </div>
            )}

            {/* FIXTURES TAB */}
            {activeTab === 'fixtures' && (
                <div className="space-y-4">
                    {(!fixtures || fixtures.length === 0) ? (
                        <div className="card p-8 text-center text-gray-400">No fixtures yet</div>
                    ) : (
                        (fixtures || []).map(match => (
                            <div key={match.id} className="card p-4">
                                <div className="grid grid-cols-3 gap-4 items-center">
                                    <div className="text-right">
                                        <p className="font-semibold">{match.home_team_name || 'TBD'}</p>
                                    </div>
                                    <div className="text-center">
                                        {match.status === 'completed' ? (
                                            <p className="text-lg font-bold">{match.home_score} - {match.away_score}</p>
                                        ) : (
                                            <div className="flex gap-1 justify-center">
                                                <input type="number" min="0" placeholder="0" className="input w-12 text-center" onChange={e => window.homeScore = e.target.value} />
                                                <span>-</span>
                                                <input type="number" min="0" placeholder="0" className="input w-12 text-center" onChange={e => window.awayScore = e.target.value} />
                                                <button
                                                    onClick={() => handleScoreSubmit(match.id, parseInt(window.homeScore || 0), parseInt(window.awayScore || 0))}
                                                    className="text-xs bg-brand-500 text-white px-2 py-1 rounded"
                                                >
                                                    Save
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold">{match.away_team_name || 'TBD'}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* STANDINGS TAB */}
            {activeTab === 'standings' && (
                <div className="card overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-2 text-left">Team</th>
                                <th className="px-4 py-2 text-center">P</th>
                                <th className="px-4 py-2 text-center">W</th>
                                <th className="px-4 py-2 text-center">Pts</th>
                                <th className="px-4 py-2 text-center">GD</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(standings || []).map((team, i) => (
                                <tr key={team.id} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-2 font-medium">{i + 1}. {team.name}</td>
                                    <td className="px-4 py-2 text-center text-gray-500">-</td>
                                    <td className="px-4 py-2 text-center text-gray-500">-</td>
                                    <td className="px-4 py-2 text-center font-bold">{team.points}</td>
                                    <td className="px-4 py-2 text-center text-gray-500">{team.goal_difference}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* BRACKET TAB */}
            {activeTab === 'bracket' && (
                <div className="card p-8 text-center text-gray-400">
                    Bracket view for {tournament.format}
                </div>
            )}
        </div>
    )
}