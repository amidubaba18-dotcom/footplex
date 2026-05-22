import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import SharedBracketView from '../Components/BracketView'
import GroupsView from '../Components/GroupsView'
import { getFixtureLabel, getPublicTournamentTabs } from '../lib/tournamentFormat'

function MatchCard({ match, isFinal }) {
    const homeWon = match.winner_team_id === match.home_team_id
    const awayWon = match.winner_team_id === match.away_team_id
    const isDone = match.status === 'completed'
    const isTBD = !match.home_team_name && !match.away_team_name

    return (
        <div className={`w-52 rounded-xl overflow-hidden border shadow-sm ${isFinal ? 'border-brand-200' : 'border-gray-200'}`}>
            <div className={`flex items-center justify-between px-3 py-2.5 border-b ${homeWon ? 'bg-brand-50 border-brand-100' : 'border-gray-100'}`}>
                <span className={`text-sm truncate flex-1 ${isTBD ? 'text-gray-300 italic' : homeWon ? 'font-bold text-brand-600' : isDone ? 'text-gray-400' : 'font-medium text-gray-900'}`}>
                    {match.home_team_name || 'TBD'}
                </span>
                <div className="flex items-center gap-1 ml-2">
                    {isDone && (
                        <span className={`text-sm font-bold w-5 text-right ${homeWon ? 'text-brand-600' : 'text-gray-400'}`}>
                            {match.home_score}
                        </span>
                    )}
                    {homeWon && <span className="text-brand-500 text-xs">✓</span>}
                </div>
            </div>

            <div className={`flex items-center justify-between px-3 py-2.5 ${awayWon ? 'bg-brand-50' : 'bg-white'}`}>
                <span className={`text-sm truncate flex-1 ${isTBD ? 'text-gray-300 italic' : awayWon ? 'font-bold text-brand-600' : isDone ? 'text-gray-400' : 'font-medium text-gray-900'}`}>
                    {match.away_team_name || 'TBD'}
                </span>
                <div className="flex items-center gap-1 ml-2">
                    {isDone && (
                        <span className={`text-sm font-bold w-5 text-right ${awayWon ? 'text-brand-600' : 'text-gray-400'}`}>
                            {match.away_score}
                        </span>
                    )}
                    {awayWon && <span className="text-brand-500 text-xs">✓</span>}
                </div>
            </div>
        </div>
    )
}

function BracketView({ fixtures, tournament }) {
    if (tournament.format === 'round_robin' || tournament.format === 'swiss') {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">
                Bracket view not available for {tournament.format.replace(/_/g, ' ')} — see Fixtures tab.
            </div>
        )
    }

    if (fixtures.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
                No fixtures generated yet
            </div>
        )
    }

    // For group_knockout, only show knockout stage (no group_name)
    const displayFixtures = tournament.format === 'group_knockout'
        ? fixtures.filter(f => !f.group_name)
        : fixtures

    if (displayFixtures.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
                Group stage in progress — knockout bracket will appear after all group matches are completed
            </div>
        )
    }

    const rounds = [...new Set(displayFixtures.map(f => f.round_number))].sort((a, b) => a - b)
    const totalRounds = rounds.length

    function getRoundName(roundNum) {
        const fromEnd = totalRounds - roundNum + 1
        if (fromEnd === 1) return '🏆 Final'
        if (fromEnd === 2) return 'Semi-Finals'
        if (fromEnd === 3) return 'Quarter-Finals'
        if (fromEnd === 4) return 'Round of 16'
        if (fromEnd === 5) return 'Round of 32'
        return `Round ${roundNum}`
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                    <p className="text-sm font-semibold text-gray-900">Tournament Bracket</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                        {displayFixtures.filter(f => f.status === 'completed').length} of {displayFixtures.length} matches completed
                    </p>
                </div>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full capitalize">
                    {tournament.format.replace(/_/g, ' ')}
                </span>
            </div>

            <div className="overflow-x-auto p-6">
                <div className="flex gap-8 min-w-max items-start">
                    {rounds.map((round, roundIdx) => {
                        const roundMatches = displayFixtures.filter(f => f.round_number === round)
                        const isFinal = getRoundName(round) === '🏆 Final'

                        return (
                            <div key={round} className="flex flex-col gap-2">
                                <div className={`text-center mb-3 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${isFinal
                                    ? 'bg-yellow-400 text-yellow-900'
                                    : 'bg-gray-100 text-gray-500'
                                    }`}>
                                    {getRoundName(round)}
                                </div>

                                <div className="flex flex-col gap-6 justify-around" style={{
                                    minHeight: `${Math.max(roundMatches.length, 1) * 90}px`
                                }}>
                                    {roundMatches.map(match => {
                                        const homeWon = match.winner_team_id === match.home_team_id
                                        const awayWon = match.winner_team_id === match.away_team_id
                                        const isDone = match.status === 'completed'
                                        const isTBD = !match.home_team_name && !match.away_team_name

                                        return (
                                            <div key={match.id} className={`w-52 rounded-xl overflow-hidden border shadow-sm ${isFinal ? 'border-yellow-200' : 'border-gray-200'
                                                }`}>
                                                <div className={`flex items-center justify-between px-3 py-2.5 border-b ${homeWon ? 'bg-brand-50 border-brand-100' : 'border-gray-100'
                                                    }`}>
                                                    <span className={`text-sm truncate flex-1 ${isTBD ? 'text-gray-300 italic' :
                                                        homeWon ? 'font-bold text-brand-600' :
                                                            isDone ? 'text-gray-400' : 'font-medium text-gray-900'
                                                        }`}>
                                                        {match.home_team_name || 'TBD'}
                                                    </span>
                                                    <div className="flex items-center gap-1 ml-2">
                                                        {isDone && (
                                                            <span className={`text-sm font-bold w-5 text-right ${homeWon ? 'text-brand-600' : 'text-gray-400'
                                                                }`}>
                                                                {match.home_score}
                                                            </span>
                                                        )}
                                                        {homeWon && <span className="text-brand-500 text-xs">✓</span>}
                                                    </div>
                                                </div>

                                                <div className={`flex items-center justify-between px-3 py-2.5 ${awayWon ? 'bg-brand-50' : 'bg-white'
                                                    }`}>
                                                    <span className={`text-sm truncate flex-1 ${isTBD ? 'text-gray-300 italic' :
                                                        awayWon ? 'font-bold text-brand-600' :
                                                            isDone ? 'text-gray-400' : 'font-medium text-gray-900'
                                                        }`}>
                                                        {match.away_team_name || 'TBD'}
                                                    </span>
                                                    <div className="flex items-center gap-1 ml-2">
                                                        {isDone && (
                                                            <span className={`text-sm font-bold w-5 text-right ${awayWon ? 'text-brand-600' : 'text-gray-400'
                                                                }`}>
                                                                {match.away_score}
                                                            </span>
                                                        )}
                                                        {awayWon && <span className="text-brand-500 text-xs">✓</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

const BRACKET_FORMATS = new Set([
    'single_elim',
    'single_elimination',
    'double_elim',
    'double_elimination',
    'group_knockout'
])

const STANDINGS_FORMATS = new Set([
    'round_robin',
    'swiss',
    'free_for_all', // Free for all will also display standings
    'group_knockout'
])

const getTabs = (format) => {
    const tabs = []

    if (STANDINGS_FORMATS.has(format)) {
        tabs.push('standings')
    }

    tabs.push('fixtures')

    if (BRACKET_FORMATS.has(format)) {
        tabs.push('bracket')
    }

    tabs.push('teams', 'chat', 'info')
    return tabs
}

export default function TournamentPage() {
    const { slug } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const [tournament, setTournament] = useState(null)
    const [standings, setStandings] = useState([])
    const [fixtures, setFixtures] = useState([])
    const [groups, setGroups] = useState([])
    const [teams, setTeams] = useState([])
    const [messages, setMessages] = useState([])
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState('standings')
    const [chatInput, setChatInput] = useState('')
    const [chatName, setChatName] = useState(localStorage.getItem('chat_name') || '')
    const [nameSet, setNameSet] = useState(!!localStorage.getItem('chat_name'))
    const [sending, setSending] = useState(false)
    const bottomRef = useRef(null)
    const tournamentId = useRef(null)
    const [showRequestForm, setShowRequestForm] = useState(false)
    const [requestForm, setRequestForm] = useState({ name: '', contact_name: '', contact_email: '' })
    const [requestLoading, setRequestLoading] = useState(false)

    useEffect(() => {
        api.get(`/api/tournaments/${slug}`)
            .then(res => {
                const t = res.data.tournament
                setTournament(t)
                tournamentId.current = t.id
                return Promise.all([
                    api.get(`/api/tournaments/${t.id}/standings`),
                    api.get(`/api/tournaments/${t.id}/fixtures`),
                    api.get(`/api/tournaments/${t.id}/teams`),
                    api.get(`/api/tournaments/${t.id}/messages`),
                    t.format === 'group_knockout'
                        ? api.get(`/api/tournaments/${t.id}/groups`)
                        : Promise.resolve({ data: { groups: [] } })
                ])
            })
            .then(([s, f, tm, m, g]) => {
                setStandings(s.data.standings || [])
                setFixtures(f.data.fixtures || [])  // ← FIXED: was .matches
                setTeams(tm.data.teams || [])
                setMessages(m.data.messages || [])
                setGroups(g.data.groups || [])
            })
            .catch(err => {
                console.error('Load error:', err)
                setLoading(false)
            })
            .finally(() => setLoading(false))
    }, [slug])

    useEffect(() => {
        if (tab !== 'chat' || !tournamentId.current) return
        const interval = setInterval(() => {
            api.get(`/api/tournaments/${tournamentId.current}/messages`)
                .then(res => setMessages(res.data.messages))
                .catch(console.error)
        }, 4000)
        return () => clearInterval(interval)
    }, [tab])

    useEffect(() => {
        if (tab === 'chat') bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, tab])

    useEffect(() => {
        if (!tournament) return
        const availableTabs = getPublicTournamentTabs(tournament.format)
        if (!availableTabs.includes(tab)) {
            setTab(availableTabs[0])
        }
    }, [tournament, tab])

    async function sendMessage(e) {
        e.preventDefault()
        if (!chatInput.trim() || !chatName.trim()) return
        setSending(true)
        try {
            const res = await api.post(`/api/tournaments/${tournamentId.current}/messages`, {
                sender_name: chatName,
                content: chatInput
            })
            setMessages(prev => [...prev, res.data.message])
            setChatInput('')
        } catch (err) { console.error(err) }
        finally { setSending(false) }
    }

    function saveName(e) {
        e.preventDefault()
        if (!chatName.trim()) return
        localStorage.setItem('chat_name', chatName)
        setNameSet(true)
    }

    async function handleRequestTeam(e) {
        e.preventDefault()
        setRequestLoading(true)
        try {
            const res = await api.post(`/api/tournaments/${tournament.id}/teams/request`, {
                name: requestForm.name,
                contact_name: requestForm.contact_name,
                contact_email: requestForm.contact_email
            })
            alert('✅ Request submitted! Organizer will review shortly.')
            setRequestForm({ name: '', contact_name: '', contact_email: '' })
            setShowRequestForm(false)
        } catch (err) {
            alert(err.response?.data?.error || 'Request failed')
        } finally {
            setRequestLoading(false)
        }
    }

    const isOrganizer = user && tournament && user.id === tournament.organizer_id
    const confirmedTeams = teams.filter(t => t.status === 'confirmed')

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <p className="text-sm text-gray-400">Loading...</p>
        </div>
    )

    if (!tournament) return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
            <p className="font-medium text-gray-700">Tournament not found</p>
            <button onClick={() => navigate('/dashboard')} className="btn-primary">← Back</button>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50">

            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-gray-600 text-sm">←</button>
                    <div>
                        <h1 className="font-bold text-gray-900">{tournament.name}</h1>
                        <p className="text-xs text-gray-500 capitalize">
                            {tournament.tournament_type} · {tournament.format.replace(/_/g, ' ')} · {tournament.status}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${tournament.status === 'active' ? 'bg-green-100 text-green-700' :
                        tournament.status === 'registration' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-600'
                        }`}>
                        {tournament.status}
                    </span>
                    {isOrganizer ? (
                        <button onClick={() => navigate(`/manage/${tournament.id}`)} className="btn-primary text-xs py-1.5 px-3">
                            ⚙ Manage
                        </button>
                    ) : tournament.status === 'registration' && (
                        <button onClick={() => setShowRequestForm(!showRequestForm)} className="btn-primary text-xs py-1.5 px-3">
                            📋 Request to Join
                        </button>
                    )}
                </div>
            </div>

            {/* Request to Join Form */}
            {showRequestForm && !isOrganizer && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl border border-gray-200 max-w-md w-full mx-4 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Register Your Team</h2>
                        <form onSubmit={handleRequestTeam} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Team Name *</label>
                                <input
                                    type="text" required
                                    value={requestForm.name}
                                    onChange={e => setRequestForm(f => ({ ...f, name: e.target.value }))}
                                    className="input"
                                    placeholder="Your team name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                                <input
                                    type="text"
                                    value={requestForm.contact_name}
                                    onChange={e => setRequestForm(f => ({ ...f, contact_name: e.target.value }))}
                                    className="input"
                                    placeholder="Your name (optional)"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                                <input
                                    type="email"
                                    value={requestForm.contact_email}
                                    onChange={e => setRequestForm(f => ({ ...f, contact_email: e.target.value }))}
                                    className="input"
                                    placeholder="your@email.com (optional)"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowRequestForm(false)}
                                    className="btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={requestLoading || !requestForm.name.trim()}
                                    className="btn-primary flex-1 disabled:opacity-40"
                                >
                                    {requestLoading ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="bg-white border-b border-gray-200 overflow-x-auto">
                <div className="flex px-6 min-w-max">
                    {getPublicTournamentTabs(tournament?.format).map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`py-3 px-4 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}>
                            {t}
                            {t === 'chat' && messages.length > 0 && (
                                <span className="ml-1.5 bg-brand-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                                    {messages.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-6">

                {/* STANDINGS */}
                {tab === 'standings' && (
                    <div>
                        {tournament.format === 'group_knockout' && groups.length > 0 ? (
                            <div className="space-y-6">
                                {groups.map(group => (
                                    <div key={group.name} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                                            <h3 className="font-bold text-gray-900">Group {group.name}</h3>
                                        </div>
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 border-b border-gray-100">
                                                <tr>
                                                    {['#', 'Team', 'P', 'W', 'D', 'L', 'GD', 'AG', 'Pts'].map((h, i) => (
                                                        <th key={h} className={`py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide ${i === 1 ? 'text-left' : 'text-center'}`}>
                                                            {h}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {group.standings.map((team, i) => {
                                                    const advances = i < (tournament.teams_advance_per_group || 2)
                                                    return (
                                                        <tr key={team.id} className={advances ? 'bg-green-50/50' : ''}>
                                                            <td className="py-3 px-4 text-center text-gray-400 font-medium">{i + 1}</td>
                                                            <td className="py-3 px-4 font-semibold text-gray-900">
                                                                {team.name}
                                                                {advances && <span className="ml-2 text-xs text-green-600 font-normal">advances</span>}
                                                            </td>
                                                            <td className="py-3 px-4 text-center text-gray-500">{team.played || 0}</td>
                                                            <td className="py-3 px-4 text-center text-gray-500">{team.won || 0}</td>
                                                            <td className="py-3 px-4 text-center text-gray-500">{team.drawn || 0}</td>
                                                            <td className="py-3 px-4 text-center text-gray-500">{team.lost || 0}</td>
                                                            <td className="py-3 px-4 text-center text-gray-500">{team.goal_difference || 0}</td>
                                                            <td className="py-3 px-4 text-center text-gray-400 italic">{team.goals_away || 0}</td>
                                                            <td className="py-3 px-4 text-center font-bold text-gray-900">{team.points || 0}</td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                {standings.length === 0 ? (
                                    <div className="p-12 text-center text-gray-400 text-sm">No standings yet</div>
                                ) : (
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                {['#', 'Team', 'P', 'W', 'D', 'L', 'GD', 'AG', 'Pts'].map((h, i) => (
                                                    <th key={h} className={`py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide ${i === 1 ? 'text-left' : 'text-center'}`}>
                                                        {h}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {standings.map((team, i) => (
                                                <tr key={team.id} className={i < 2 ? 'bg-green-50/50' : ''}>
                                                    <td className="py-3 px-4 text-center text-gray-400 font-medium">{i + 1}</td>
                                                    <td className="py-3 px-4 font-semibold text-gray-900">{team.name}</td>
                                                    <td className="py-3 px-4 text-center text-gray-500">{team.played || 0}</td>
                                                    <td className="py-3 px-4 text-center text-gray-500">{team.won || 0}</td>
                                                    <td className="py-3 px-4 text-center text-gray-500">{team.drawn || 0}</td>
                                                    <td className="py-3 px-4 text-center text-gray-500">{team.lost || 0}</td>
                                                    <td className="py-3 px-4 text-center text-gray-500">{team.goal_difference || 0}</td>
                                                    <td className="py-3 px-4 text-center text-gray-400 italic">{team.goals_away || 0}</td>
                                                    <td className="py-3 px-4 text-center font-bold text-gray-900">{team.points || 0}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* FIXTURES */}
                {tab === 'fixtures' && (
                    <div className="space-y-6">
                        {tournament.format === 'group_knockout' ? (
                            <div>
                                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                                    <div>
                                        <h3 className="font-bold text-gray-900">Group Stage</h3>
                                        <p className="text-xs text-gray-500">
                                            {fixtures.filter(f => f.group_name && f.status === 'completed').length} of {fixtures.filter(f => f.group_name).length} matches completed
                                        </p>
                                    </div>
                                </div>

                                {/* Group stage by group */}
                                {groups.map(group => (
                                    <div key={group.name} className="mb-6">
                                        <p className="text-sm font-bold text-gray-700 mb-3">Group {group.name}</p>
                                        <div className="space-y-2">
                                            {group.fixtures.map(match => (
                                                <div key={match.id} className="card flex items-center justify-between gap-3">
                                                    <span className="font-medium text-sm flex-1">{match.home_team_name}</span>
                                                    <div className="text-center px-4">
                                                        {match.status === 'completed' ? (
                                                            <span className="font-bold">{match.home_score} – {match.away_score}</span>
                                                        ) : (
                                                            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">vs</span>
                                                        )}
                                                    </div>
                                                    <span className="font-medium text-sm flex-1 text-right">{match.away_team_name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                {/* Knockout stage */}
                                {fixtures.filter(f => !f.group_name).length > 0 && (
                                    <div className="mt-8 pt-8 border-t border-gray-200">
                                        <h3 className="font-bold text-gray-900 mb-4">Knockout Stage</h3>
                                        {[...new Set(fixtures.filter(f => !f.group_name).map(f => f.round_number))].sort((a, b) => a - b).map(round => (
                                            <div key={round}>
                                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                                                    {round === Math.max(...fixtures.filter(f => !f.group_name).map(f => f.round_number)) ? '🏆 Final' : 'Semi-Finals'}
                                                </p>
                                                <div className="space-y-2 mb-4">
                                                    {fixtures.filter(f => !f.group_name && f.round_number === round).map(match => (
                                                        <div key={match.id} className="card flex items-center justify-between gap-3">
                                                            <span className="font-medium text-sm flex-1">{match.home_team_name || 'TBD'}</span>
                                                            <div className="text-center px-4">
                                                                {match.status === 'completed' ? (
                                                                    <span className="font-bold">{match.home_score} – {match.away_score}</span>
                                                                ) : (
                                                                    <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">vs</span>
                                                                )}
                                                            </div>
                                                            <span className="font-medium text-sm flex-1 text-right">{match.away_team_name || 'TBD'}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            // Regular fixtures for other formats
                            <div className="space-y-4">
                                {[...new Set(fixtures.map(f => f.round_number))].sort((a, b) => a - b).map(round => (
                                    <div key={round}>
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{getFixtureLabel(fixtures.find(f => f.round_number === round))}</p>
                                        <div className="space-y-2">
                                            {fixtures.filter(f => f.round_number === round).map(match => (
                                                <div key={match.id} className="card flex items-center justify-between gap-3">
                                                    <span className="font-medium text-sm flex-1">{match.home_team_name}</span>
                                                    <div className="text-center px-4">
                                                        {match.status === 'completed' ? (
                                                            <span className="font-bold">{match.home_score} – {match.away_score}</span>
                                                        ) : (
                                                            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">vs</span>
                                                        )}
                                                    </div>
                                                    <span className="font-medium text-sm flex-1 text-right">{match.away_team_name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {tab === 'bracket' && (
                    <SharedBracketView fixtures={fixtures} tournament={tournament} />
                )}

                {/* TEAMS */}
                {tab === 'teams' && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm text-gray-500">{confirmedTeams.length} of {tournament.max_teams} teams confirmed</p>
                            <div className="h-2 w-32 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-brand-500 rounded-full" style={{ width: `${(confirmedTeams.length / tournament.max_teams) * 100}%` }} />
                            </div>
                        </div>
                        {confirmedTeams.length === 0 ? (
                            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
                                No confirmed teams yet
                            </div>
                        ) : (
                            confirmedTeams.map((team, i) => (
                                <div key={team.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-sm">
                                        {i + 1}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900 text-sm">{team.name}</p>
                                        {team.contact_name && <p className="text-xs text-gray-400">{team.contact_name}</p>}
                                    </div>
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Confirmed</span>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* CHAT */}
                {tab === 'chat' && (
                    <div className="bg-white rounded-xl border border-gray-200 flex flex-col h-[60vh]">
                        {!nameSet && (
                            <div className="p-4 border-b border-gray-100">
                                <p className="text-sm font-medium text-gray-700 mb-2">Enter your name to chat</p>
                                <form onSubmit={saveName} className="flex gap-2">
                                    <input value={chatName} onChange={e => setChatName(e.target.value)}
                                        placeholder="Your name..." className="input flex-1" />
                                    <button type="submit" className="btn-primary">Join</button>
                                </form>
                            </div>
                        )}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {messages.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-sm text-gray-400">
                                    No messages yet
                                </div>
                            ) : (
                                messages.map(msg => {
                                    const isMe = msg.sender_name === chatName
                                    return (
                                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                            <span className="text-xs text-gray-400 mb-1 px-1">{isMe ? 'You' : msg.sender_name}</span>
                                            <div className={`px-3 py-2 rounded-xl text-sm max-w-[75%] ${isMe ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'
                                                }`}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                            <div ref={bottomRef} />
                        </div>
                        {nameSet && (
                            <form onSubmit={sendMessage} className="p-3 border-t border-gray-100 flex gap-2">
                                <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                                    placeholder="Type a message..." disabled={sending} className="input flex-1" />
                                <button type="submit" disabled={sending || !chatInput.trim()} className="btn-primary px-4">
                                    {sending ? '...' : '→'}
                                </button>
                            </form>
                        )}
                    </div>
                )}

                {/* INFO */}
                {tab === 'info' && (
                    <div className="space-y-4">
                        <div className="bg-white rounded-xl border border-gray-200 p-5">
                            <h3 className="font-semibold text-gray-900 mb-4">Tournament Details</h3>
                            <div className="space-y-3">
                                {[
                                    { label: 'Name', value: tournament.name },
                                    { label: 'Type', value: tournament.tournament_type },
                                    { label: 'Format', value: tournament.format.replace(/_/g, ' ') },
                                    { label: 'Status', value: tournament.status },
                                    { label: 'Max Teams', value: tournament.max_teams },
                                    { label: 'Organizer', value: tournament.organizer_name },
                                    { label: 'Start Date', value: tournament.start_date ? new Date(tournament.start_date).toLocaleDateString() : 'TBD' },
                                    { label: 'End Date', value: tournament.end_date ? new Date(tournament.end_date).toLocaleDateString() : 'TBD' },
                                ].map(item => (
                                    <div key={item.label} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                                        <span className="text-sm text-gray-500">{item.label}</span>
                                        <span className="text-sm font-medium text-gray-900 capitalize">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {tournament.description && (
                            <div className="bg-white rounded-xl border border-gray-200 p-5">
                                <h3 className="font-semibold text-gray-900 mb-2">About</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">{tournament.description}</p>
                            </div>
                        )}

                        <div className="bg-white rounded-xl border border-gray-200 p-5">
                            <h3 className="font-semibold text-gray-900 mb-3">Share</h3>
                            <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                                <span className="text-xs text-gray-400 flex-1 truncate">{window.location.href}</span>
                                <button
                                    onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Copied!') }}
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
