import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import BracketView from '../Components/BracketView'
import { getFixtureLabel, getManageTournamentTabs } from '../lib/tournamentFormat'
const BRACKET_FORMATS = new Set([
    'single_elim',
    'single_elimination',
    'double_elim',
    'double_elimination',
    'group_knockout'
])

const getTabs = (format) => {
    const tabs = ['teams', 'fixtures']

    if (format === 'free_for_all') tabs.push('standings') // Free for all will also display standings

    if (BRACKET_FORMATS.has(format)) {
        tabs.push('bracket')
    }

    tabs.push('scores', 'settings')
    return tabs
}

export default function ManageTournament() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [tournament, setTournament] = useState(null)
    const [teams, setTeams] = useState([])
    const [fixtures, setFixtures] = useState([])
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState('teams')
    const [scores, setScores] = useState({})
    const [submitting, setSubmitting] = useState(null)
    const [generating, setGenerating] = useState(false)
    const [showAddTeam, setShowAddTeam] = useState(false)
    const [newTeam, setNewTeam] = useState({ name: '', contact_name: '', contact_email: '' })
    const [addingTeam, setAddingTeam] = useState(false)

    async function loadData() {
        try {
            const [teamsRes, fixturesRes] = await Promise.all([
                api.get(`/api/tournaments/${id}/teams`),
                api.get(`/api/tournaments/${id}/fixtures`),
            ])
            setTeams(teamsRes.data.teams || [])
            setFixtures(fixturesRes.data.fixtures || [])
        } catch (err) {
            console.error('Load error:', err)
        }
    }

    useEffect(() => {
        api.get('/api/tournaments/my')
            .then(res => setTournament(res.data.tournaments.find(t => t.id === parseInt(id))))
        loadData().finally(() => setLoading(false))
    }, [id])

    useEffect(() => {
        if (!tournament) return
        const availableTabs = getManageTournamentTabs(tournament.format)
        if (!availableTabs.includes(tab)) {
            setTab(availableTabs[0])
        }
    }, [tournament, tab])

    async function handleAddTeam(e) {
        e.preventDefault()
        setAddingTeam(true)
        try {
            await api.post(`/api/tournaments/${id}/teams`, newTeam)
            setNewTeam({ name: '', contact_name: '', contact_email: '' })
            setShowAddTeam(false)
            await loadData()
        } catch (err) { alert(err.response?.data?.error || 'Failed') }
        finally { setAddingTeam(false) }
    }

    async function handleTeamStatus(teamId, status) {
        try {
            await api.patch(`/api/tournaments/${id}/teams/${teamId}`, { action: status === 'confirmed' ? 'approve' : 'reject' })
            await loadData()
        } catch (err) { alert('Failed') }
    }

    async function handleGenerate() {
        if (!confirm('Generate fixtures? This will delete existing ones.')) return
        setGenerating(true)
        try {
            const res = await api.post(`/api/tournaments/${id}/generate`, {})
            alert(`Generated ${res.data.count} matches!`)
            await loadData()
            setTab('fixtures')
        } catch (err) { alert(err.response?.data?.error || 'Failed') }
        finally { setGenerating(false) }
    }

    async function handleScore(matchId) {
        const s = scores[matchId]
        if (s?.home === undefined || s?.away === undefined || s?.home === '' || s?.away === '') {
            alert('Enter both scores')
            return
        }
        setSubmitting(matchId)
        try {
            await api.patch(`/api/tournaments/${id}/matches/${matchId}/score`, {
                home_score: parseInt(s.home),
                away_score: parseInt(s.away),
                home_penalty_score: s.pHome ? parseInt(s.pHome) : undefined,
                away_penalty_score: s.pAway ? parseInt(s.pAway) : undefined
            })
            await loadData()
            setScores(prev => { const c = { ...prev }; delete c[matchId]; return c })
        } catch (err) { alert(err.response?.data?.error || 'Failed') }
        finally { setSubmitting(null) }
    }

    async function handleResetMatch(matchId) {
        if (!confirm('Reset this match score? This will clear the result and might affect progression.')) return
        try {
            await api.patch(`/api/tournaments/${id}/matches/${matchId}/reset`)
            await loadData()
        } catch (err) { alert(err.response?.data?.error || 'Failed to reset') }
    }

    async function handleStatusChange(status) {
        try {
            await api.patch(`/api/tournaments/${id}/status`, { status })
            const res = await api.get('/api/tournaments/my')
            setTournament(res.data.tournaments.find(t => t.id === parseInt(id)))
        } catch (err) { alert('Failed') }
    }

    const confirmed = (teams || []).filter(t => t.status === 'confirmed')
    const pending = (teams || []).filter(t => t.status === 'pending')
    const scheduled = (fixtures || []).filter(f => f.status === 'scheduled')
    const completed = (fixtures || []).filter(f => f.status === 'completed')

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <p className="text-sm text-gray-400">Loading...</p>
        </div>
    )

    if (!tournament) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <p className="text-sm text-gray-400">Tournament not found</p>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50">

            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-gray-600 text-sm">←</button>
                        <div>
                            <h1 className="font-bold text-gray-900">{tournament?.name || 'Manage Tournament'}</h1>
                            <p className="text-xs text-gray-500 capitalize">
                                {tournament?.tournament_type} · {tournament?.format?.replace(/_/g, ' ')}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate(`/t/${tournament?.slug}`)}
                            className="btn-secondary text-xs py-1.5 px-3"
                        >
                            Public View ↗
                        </button>
                        <button
                            onClick={() => {
                                if (window.confirm('Delete this tournament permanently?')) {
                                    api.delete(`/api/tournaments/${id}`)
                                        .then(() => navigate('/dashboard'))
                                        .catch(err => alert(err.response?.data?.error || 'Delete failed'))
                                }
                            }}
                            className="text-xs bg-red-100 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-200 transition-colors"
                        >
                            🗑 Delete
                        </button>
                    </div>
                </div>

                {/* Status flow */}
                <div className="flex items-center gap-2">
                    {['draft', 'registration', 'active', 'completed'].map((s, i, arr) => {
                        const cur = tournament?.status
                        const isActive = cur === s
                        const isPast = arr.indexOf(cur) > i
                        return (
                            <div key={s} className="flex items-center gap-2">
                                <button
                                    onClick={() => !isActive && !isPast && handleStatusChange(s)}
                                    disabled={isActive || isPast}
                                    className={`text-xs px-3 py-1.5 rounded-full font-medium capitalize transition-colors ${isActive ? 'bg-gray-900 text-white' :
                                        isPast ? 'bg-green-100 text-green-700 cursor-default' :
                                            'bg-gray-100 text-gray-500 hover:bg-gray-200 cursor-pointer'
                                        }`}
                                >
                                    {isPast ? '✓ ' : ''}{s}
                                </button>
                                {i < arr.length - 1 && <span className="text-gray-300 text-xs">→</span>}
                            </div>
                        )
                    })}
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                    {tournament?.status === 'draft' && 'Set to Registration to make this tournament public.'}
                    {tournament?.status === 'registration' && 'Tournament is open. Teams can register.'}
                    {tournament?.status === 'active' && 'Tournament is live. Submit scores in the Scores tab.'}
                    {tournament?.status === 'completed' && 'Tournament is finished.'}
                </p>
            </div>

            {/* Stats */}
            <div className="bg-white border-b border-gray-200 px-6 py-3 flex gap-8">
                {[
                    { label: 'Teams', value: confirmed.length },
                    { label: 'Pending', value: pending.length },
                    { label: 'Matches', value: fixtures.length },
                    { label: 'Completed', value: completed.length },
                ].map(s => (
                    <div key={s.label}>
                        <p className="text-lg font-bold text-gray-900">{s.value}</p>
                        <p className="text-xs text-gray-400">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="bg-white border-b border-gray-200 overflow-x-auto">
                <div className="flex px-6 min-w-max">
                    {getManageTournamentTabs(tournament?.format).map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`py-3 px-4 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}>
                            {t}
                            {t === 'teams' && pending.length > 0 && (
                                <span className="ml-1.5 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pending.length}</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-6">

                {/* TEAMS TAB */}
                {tab === 'teams' && (
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <button onClick={() => setShowAddTeam(!showAddTeam)} className="btn-primary text-sm">
                                {showAddTeam ? 'Cancel' : '+ Add Team'}
                            </button>
                            <button
                                onClick={handleGenerate}
                                disabled={generating || confirmed.length < 2}
                                className="btn-secondary text-sm disabled:opacity-40"
                            >
                                {generating ? 'Generating...' : tournament?.format === 'swiss' && fixtures.length > 0 ? 'Generate Next Round' : '⚡ Generate Fixtures'}
                            </button>
                        </div>

                        {confirmed.length < 2 && (
                            <p className="text-xs text-gray-400">Need at least 2 confirmed teams to generate fixtures</p>
                        )}

                        {showAddTeam && (
                            <form onSubmit={handleAddTeam} className="card space-y-3">
                                <h3 className="font-semibold text-gray-900 text-sm">Add New Team</h3>
                                {confirmed.length >= tournament?.max_teams && (
                                    <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm rounded-lg">
                                        ⚠️ Tournament is full ({confirmed.length}/{tournament?.max_teams} teams)
                                    </div>
                                )}
                                {[
                                    { key: 'name', placeholder: 'Team name *', required: true },
                                    { key: 'contact_name', placeholder: 'Contact person (optional)' },
                                    { key: 'contact_email', placeholder: 'Contact email (optional)' },
                                ].map(f => (
                                    <input key={f.key} required={f.required} placeholder={f.placeholder}
                                        value={newTeam[f.key]}
                                        onChange={e => setNewTeam(n => ({ ...n, [f.key]: e.target.value }))}
                                        className="input" />
                                ))}
                                <button
                                    type="submit"
                                    disabled={addingTeam || confirmed.length >= tournament?.max_teams}
                                    className="btn-primary w-full justify-center flex disabled:opacity-40"
                                >
                                    {addingTeam ? 'Adding...' : confirmed.length >= tournament?.max_teams ? 'Tournament Full' : 'Add Team'}
                                </button>
                            </form>
                        )}

                        {pending.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Pending Approval</p>
                                <div className="space-y-2">
                                    {pending.map(team => (
                                        <div key={team.id} className="card flex items-center justify-between gap-3 bg-yellow-50 border-yellow-200">
                                            <div>
                                                <p className="font-medium text-sm text-gray-900">{team.name}</p>
                                                {team.contact_name && <p className="text-xs text-gray-500">{team.contact_name}</p>}
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleTeamStatus(team.id, 'confirmed')}
                                                    className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-lg font-medium">
                                                    Approve
                                                </button>
                                                <button onClick={() => handleTeamStatus(team.id, 'rejected')}
                                                    className="text-xs bg-red-100 text-red-600 px-3 py-1.5 rounded-lg font-medium">
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                                Confirmed Teams ({confirmed.length}/{tournament?.max_teams})
                            </p>
                            {confirmed.length === 0 ? (
                                <div className="card text-center text-sm text-gray-400 py-8">No confirmed teams yet</div>
                            ) : (
                                <div className="space-y-2">
                                    {confirmed.map((team, i) => (
                                        <div key={team.id} className="card flex items-center gap-3">
                                            <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                                                {i + 1}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-sm text-gray-900">{team.name}</p>
                                                {team.contact_name && <p className="text-xs text-gray-400">{team.contact_name}</p>}
                                            </div>
                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Confirmed</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* FIXTURES TAB */}
                {tab === 'fixtures' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500">{completed.length}/{fixtures.length} matches completed</p>
                            <button onClick={handleGenerate} disabled={generating}
                                className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40">
                                {generating ? 'Generating...' : tournament?.format === 'swiss' ? 'Generate Next Round' : '↺ Regenerate'}
                            </button>
                        </div>

                        {fixtures.length === 0 ? (
                            <div className="card text-center text-sm text-gray-400 py-12">
                                No fixtures yet. Add teams and click Generate Fixtures.
                            </div>
                        ) : (
                            (() => {
                                const sections = []
                                const byKey = new Map()

                                fixtures.forEach(match => {
                                    const key = `${match.group_name || 'main'}-${match.match_type}-${match.round_number}`
                                    if (!byKey.has(key)) {
                                        const section = {
                                            key,
                                            label: getFixtureLabel(match),
                                            matches: []
                                        }
                                        byKey.set(key, section)
                                        sections.push(section)
                                    }
                                    byKey.get(key).matches.push(match)
                                })

                                return sections.map(section => (
                                    <div key={section.key}>
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                                            {section.label}
                                        </p>
                                        <div className="space-y-2">
                                            {section.matches.map(match => (
                                                <div key={match.id} className="card">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <span className={`font-medium text-sm flex-1 ${match.winner_team_id === match.home_team_id ? 'text-brand-500 font-bold' : 'text-gray-900'
                                                            }`}>
                                                            {match.home_team_name || 'TBD'}
                                                        </span>
                                                        <div className="text-center px-4">
                                                            {match.status === 'completed' ? (
                                                                <span className="font-bold text-gray-900">
                                                                    {match.home_score} – {match.away_score}
                                                                </span>
                                                            ) : match.is_placeholder ? (
                                                                <span className="text-xs text-gray-300 bg-gray-50 px-3 py-1 rounded-full">TBD</span>
                                                            ) : (
                                                                <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">vs</span>
                                                            )}
                                                        </div>
                                                        <span className={`font-medium text-sm flex-1 text-right ${match.winner_team_id === match.away_team_id ? 'text-brand-500 font-bold' : 'text-gray-900'
                                                            }`}>
                                                            {match.away_team_name || 'TBD'}
                                                        </span>
                                                    </div>
                                                    {match.status === 'completed' && (
                                                        <button
                                                            onClick={() => handleResetMatch(match.id)}
                                                            className="mt-2 text-[10px] text-gray-400 hover:text-red-500 uppercase tracking-widest font-semibold transition-colors"
                                                        >
                                                            Reset Score
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            })()
                        )}
                    </div>
                )}

                {tab === 'bracket' && (
                    <SharedBracketView fixtures={fixtures || []} tournament={tournament} />
                )}

                {/* SCORES TAB */}
                {tab === 'scores' && (
                    <div className="space-y-3">
                        {scheduled.length === 0 ? (
                            <div className="card text-center text-sm text-gray-400 py-12">
                                {fixtures.length === 0 ? 'Generate fixtures first.' : '🎉 All matches scored!'}
                            </div>
                        ) : (
                            scheduled.map(match => (
                                <div key={match.id} className="card">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{getFixtureLabel(match)}</p>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900 mb-1.5">{match.home_team_name}</p>
                                            <input type="number" min="0" max="30" placeholder="0"
                                                value={scores[match.id]?.home ?? ''}
                                                onChange={e => setScores(p => ({ ...p, [match.id]: { ...p[match.id], home: e.target.value } }))}
                                                className="input text-center text-lg font-bold"
                                            />
                                        </div>
                                        <span className="text-gray-300 font-bold mt-6">–</span>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900 mb-1.5 text-right">{match.away_team_name}</p>
                                            <input type="number" min="0" max="30" placeholder="0"
                                                value={scores[match.id]?.away ?? ''}
                                                onChange={e => setScores(p => ({ ...p, [match.id]: { ...p[match.id], away: e.target.value } }))}
                                                className="input text-center text-lg font-bold"
                                            />
                                        </div>
                                    </div>

                                    {scores[match.id]?.home === scores[match.id]?.away && scores[match.id]?.home !== '' && (
                                        <div className="mt-4 p-3 bg-brand-50 rounded-lg border border-brand-100">
                                            <p className="text-[10px] font-bold text-brand-600 uppercase mb-2">Penalty Shootout Required</p>
                                            <div className="flex items-center gap-3">
                                                <input type="number" placeholder="P"
                                                    value={scores[match.id]?.pHome ?? ''}
                                                    onChange={e => setScores(p => ({ ...p, [match.id]: { ...p[match.id], pHome: e.target.value } }))}
                                                    className="input flex-1 text-center text-sm" />
                                                <span className="text-brand-300">pk</span>
                                                <input type="number" placeholder="P"
                                                    value={scores[match.id]?.pAway ?? ''}
                                                    onChange={e => setScores(p => ({ ...p, [match.id]: { ...p[match.id], pAway: e.target.value } }))}
                                                    className="input flex-1 text-center text-sm" />
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => handleScore(match.id)}
                                        disabled={
                                            submitting === match.id ||
                                            scores[match.id]?.home === undefined ||
                                            scores[match.id]?.away === undefined ||
                                            scores[match.id]?.home === '' ||
                                            scores[match.id]?.away === ''
                                        }
                                        className="btn-primary w-full justify-center flex mt-3 disabled:opacity-40"
                                    >
                                        {submitting === match.id ? 'Saving...' : 'Submit Score'}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* SETTINGS TAB */}
                {tab === 'settings' && (
                    <div className="space-y-4">
                        <div className="card">
                            <h3 className="font-semibold text-gray-900 mb-4">Tournament Info</h3>
                            <div className="space-y-3">
                                {[
                                    { label: 'Name', value: tournament?.name },
                                    { label: 'Type', value: tournament?.tournament_type },
                                    { label: 'Format', value: tournament?.format?.replace(/_/g, ' ') },
                                    { label: 'Max Teams', value: tournament?.max_teams },
                                    { label: 'Status', value: tournament?.status },
                                ].map(item => (
                                    <div key={item.label} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                                        <span className="text-sm text-gray-500">{item.label}</span>
                                        <span className="text-sm font-medium text-gray-900 capitalize">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="card">
                            <h3 className="font-semibold text-gray-900 mb-3">Share Tournament</h3>
                            <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                                <span className="text-xs text-gray-400 flex-1 truncate">
                                    {window.location.origin}/t/{tournament?.slug}
                                </span>
                                <button
                                    onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/t/${tournament?.slug}`); alert('Copied!') }}
                                    className="btn-secondary text-xs py-1.5 px-3"
                                >
                                    Copy
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}
