import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import Avatar from '../Components/Avatar'
import { getFixtureLabel, getPublicTournamentTabs } from '../lib/tournamentFormat'

const BRACKET_FORMATS = new Set([
    'single_elim', 'single_elimination',
    'double_elim', 'double_elimination',
    'group_knockout'
])

// ── SVG Icons ───────────────────────────────────────────
const Icons = {
    info: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
        </svg>
    ),
    standings: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
    ),
    fixtures: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
            <line x1="16" x2="16" y1="2" y2="6" />
            <line x1="8" x2="8" y1="2" y2="6" />
            <line x1="3" x2="21" y1="10" y2="10" />
            <path d="m9 16 2 2 4-4" />
        </svg>
    ),
    teams: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    bracket: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h6" />
            <path d="M15 6h6" />
            <path d="M6 3v6" />
            <path d="M18 3v6" />
            <path d="M9 18h6" />
            <path d="M12 15v6" />
            <path d="M3 18h3v-3H3v6" />
            <path d="M18 18h3v-3h-3v6" />
        </svg>
    ),
    settings: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    ),
    trophy: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
    ),
    share: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
            <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
        </svg>
    ),
    calendar: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
            <line x1="16" x2="16" y1="2" y2="6" />
            <line x1="8" x2="8" y1="2" y2="6" />
            <line x1="3" x2="21" y1="10" y2="10" />
        </svg>
    ),
    users: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    check: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
        </svg>
    ),
    x: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
        </svg>
    ),
    arrowLeft: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
        </svg>
    ),
    image: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
    ),
    edit: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        </svg>
    ),
    trash: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        </svg>
    ),
    plus: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    ),
    copy: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
        </svg>
    ),
    link: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
    ),
    refresh: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 16h5v5" />
        </svg>
    ),
    bell: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
    ),
    clock: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    ),
    mapPin: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
        </svg>
    ),
    shield: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
    ),
    target: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
        </svg>
    ),
    award: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="7" />
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
        </svg>
    ),
    chevronRight: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
        </svg>
    ),
    sparkles: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        </svg>
    ),
    camera: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
        </svg>
    ),
}

// ── Tab Configuration ───────────────────────────────────
const TAB_CONFIG = {
    info:      { label: 'Overview',  icon: Icons.info,      color: 'text-sky-600',     bg: 'bg-sky-50' },
    standings: { label: 'Standings', icon: Icons.standings, color: 'text-amber-600',   bg: 'bg-amber-50' },
    fixtures:  { label: 'Fixtures',  icon: Icons.fixtures,  color: 'text-emerald-600', bg: 'bg-emerald-50' },
    bracket:   { label: 'Bracket',   icon: Icons.bracket,   color: 'text-violet-600',  bg: 'bg-violet-50' },
    teams:     { label: 'Teams',     icon: Icons.teams,     color: 'text-indigo-600',  bg: 'bg-indigo-50' },
    media:     { label: 'Media',     icon: Icons.camera,    color: 'text-pink-600',    bg: 'bg-pink-50' },
    settings:  { label: 'Settings',  icon: Icons.settings,  color: 'text-slate-600',   bg: 'bg-slate-50' },
}

export default function TournamentPage() {
    const { slug } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()

    // ── Data States ─────────────────────────────────────
    const [tournament, setTournament] = useState(null)
    const [seasons, setSeasons] = useState([])
    const [standings, setStandings] = useState([])
    const [fixtures, setFixtures] = useState([])
    const [groups, setGroups] = useState([])
    const [teams, setTeams] = useState([])
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState('info')

    // ── Enrich standings with team logos ──────────────────
    const teamLogoMap = useMemo(() => {
        const map = new Map()
        teams.forEach(t => {
            map.set(String(t.id), t.logo_url)
            if (t.team_id) map.set(String(t.team_id), t.logo_url)
        })
        return map
    }, [teams])

    const standingsRows = useMemo(() => {
        return standings.map(row => ({
            ...row,
            logo_url: row.logo_url || teamLogoMap.get(String(row.team_id)) || teamLogoMap.get(String(row.id)) || null
        }))
    }, [standings, teamLogoMap])

    const groupRows = useMemo(() => {
        return groups.map(g => ({
            ...g,
            standings: (g.standings || []).map(row => ({
                ...row,
                logo_url: row.logo_url || teamLogoMap.get(String(row.team_id)) || teamLogoMap.get(String(row.id)) || null
            }))
        }))
    }, [groups, teamLogoMap])

    // ── Public Request States ───────────────────────────
    const [showRequestForm, setShowRequestForm] = useState(false)
    const [requestForm, setRequestForm] = useState({ name: '', contact_name: '', contact_email: '' })
    const [requestLoading, setRequestLoading] = useState(false)

    // ── Match Action Modal ──────────────────────────────
    const [selectedMatch, setSelectedMatch] = useState(null)

    // ── Organizer Management States ─────────────────────
    const [scores, setScores] = useState({})
    const [submitting, setSubmitting] = useState(null)
    const [generating, setGenerating] = useState(false)
    const [showAddTeam, setShowAddTeam] = useState(false)
    const [newTeam, setNewTeam] = useState({ name: '', contact_name: '', contact_email: '', avatar: null })
    const [editingTeam, setEditingTeam] = useState(null)
    const [newTeamAvatarPreview, setNewTeamAvatarPreview] = useState(null)
    const [addingTeam, setAddingTeam] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState({})
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deleteInput, setDeleteInput] = useState('')
    const bannerInputRef = useRef(null)
    const teamAvatarInputRef = useRef(null)

    // ── Toast System ────────────────────────────────────
    const [toasts, setToasts] = useState([])
    const addToast = (msg) => {
        const id = Date.now()
        setToasts(prev => [...prev, { id, msg }])
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
    }

    const isOrganizer = user && tournament && user.id === tournament.organizer_id
    const confirmedTeams = teams.filter(t => t.status === 'confirmed')
    const pendingTeams = teams.filter(t => t.status === 'pending')

    // ── Data Loading ────────────────────────────────────
    async function loadData(tournamentId) {
        if (!tournamentId) return
        try {
            const [s, f, tm, g] = await Promise.all([
                api.get(`/api/tournaments/${tournamentId}/standings`),
                api.get(`/api/tournaments/${tournamentId}/fixtures`),
                api.get(`/api/tournaments/${tournamentId}/teams`),
                tournament?.format === 'group_knockout'
                    ? api.get(`/api/tournaments/${tournamentId}/groups`)
                    : Promise.resolve({ data: { groups: [] } })
            ])
            setStandings(s.data.standings || [])
            setFixtures(f.data.fixtures || [])
            setTeams(tm.data.teams || [])
            setGroups(g.data.groups || [])
        } catch (err) {
            console.error('Data load error:', err)
        }
    }

    useEffect(() => {
        setLoading(true)
        api.get(`/api/tournaments/${slug}`)
            .then(async res => {
                if (!res.data.tournament) throw new Error('Not found')
                const t = res.data.tournament
                setTournament(t)
                setSeasons(res.data.seasons || [])
                if (user?.id === t.organizer_id) {
                    setEditForm({
                        name: t.name,
                        description: t.description || '',
                        tournament_type: t.tournament_type,
                        format: t.format,
                        max_teams: t.max_teams,
                        start_date: t.start_date?.split('T')[0] || '',
                        end_date: t.end_date?.split('T')[0] || '',
                        group_count: t.group_count,
                        teams_advance_per_group: t.teams_advance_per_group,
                        is_double_round_robin: t.is_double_round_robin,
                        is_two_legged_knockout: t.is_two_legged_knockout,
                        penalties_enabled: t.penalties_enabled
                    })
                }
                await loadData(t.id)
            })
            .catch(err => { console.error('Load error:', err); setLoading(false) })
            .finally(() => setLoading(false))
    }, [slug, user])

    // ── WebSocket (teams only, no chat) ─────────────────
    useEffect(() => {
        if (!tournament?.id) return
        const baseURL = api.defaults.baseURL || window.location.origin
        const wsURL = baseURL.replace(/^http/, 'ws') + `/api/tournaments/${tournament.id}/chat`
        const socket = new WebSocket(wsURL)
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data)
            if (data.type === 'new_team_request') {
                setTeams(prev => [...prev, data.team])
                if (isOrganizer) addToast(`New request: ${data.team.name}`)
            }
        }
        return () => socket.close()
    }, [tournament?.id, isOrganizer])

    useEffect(() => {
        if (!tournament) return
        const available = getTabs(tournament.format)
        if (!available.includes(tab)) setTab(available[0])
    }, [tournament, tab])

    function getTabs(format) {
        let tabs = ['info', 'standings', 'fixtures', 'teams', 'media']
        if (BRACKET_FORMATS.has(format)) tabs.splice(3, 0, 'bracket')
        if (isOrganizer) {
            tabs = tabs.filter(t => t !== 'info')
            tabs.push('settings')
        }
        return tabs
    }

    // ── Handlers ────────────────────────────────────────
    async function handleRequestTeam(e) {
        e.preventDefault()
        setRequestLoading(true)
        try {
            await api.post(`/api/tournaments/${tournament.id}/teams/request`, requestForm)
            addToast('Request submitted!')
            setRequestForm({ name: '', contact_name: '', contact_email: '' })
            setShowRequestForm(false)
        } catch (err) { alert(err.response?.data?.error || 'Request failed') }
        finally { setRequestLoading(false) }
    }

    async function handleGenerate() {
        if (!isOrganizer) return
        setGenerating(true)
        try {
            const res = await api.post(`/api/tournaments/${tournament.id}/generate`)
            await loadData(tournament.id)
            addToast(`Generated ${res.data.count} matches!`)
        } catch (err) { alert(err.response?.data?.error || 'Failed to generate') }
        finally { setGenerating(false) }
    }

    async function handleScore(matchId) {
        if (!isOrganizer) return
        const s = scores[matchId]
        if (!s || s.home === '' || s.away === '') { alert('Enter both scores'); return }
        setSubmitting(matchId)
        try {
            const payload = { home_score: parseInt(s.home, 10), away_score: parseInt(s.away, 10) }
            if (s.pHome !== undefined && s.pAway !== undefined) {
                payload.home_penalty_score = parseInt(s.pHome, 10)
                payload.away_penalty_score = parseInt(s.pAway, 10)
            }
            await api.patch(`/api/tournaments/${tournament.id}/matches/${matchId}/score`, payload)
            await loadData(tournament.id)
            setScores(prev => { const next = { ...prev }; delete next[matchId]; return next })
            addToast('Score saved!')
        } catch (err) { alert(err.response?.data?.error || 'Failed') }
        finally { setSubmitting(null) }
    }

    async function handleResetMatch(matchId) {
        if (!isOrganizer || !confirm('Reset this match?')) return
        try {
            await api.patch(`/api/tournaments/${tournament.id}/matches/${matchId}/reset`)
            await loadData(tournament.id)
            addToast('Match reset')
        } catch (err) { alert(err.response?.data?.error || 'Reset failed') }
    }

    async function handleRemoveMatch(matchId) {
        if (!isOrganizer || !confirm('Remove this match permanently?')) return
        try {
            await api.delete(`/api/tournaments/${tournament.id}/matches/${matchId}`)
            await loadData(tournament.id)
            addToast('Match removed')
        } catch (err) { alert(err.response?.data?.error || 'Remove failed') }
    }

    function handleTeamAvatarSelect(e) {
        const file = e.target.files?.[0]
        if (!file) return
        setNewTeam(prev => ({ ...prev, avatar: file }))
        const reader = new FileReader()
        reader.onloadend = () => setNewTeamAvatarPreview(reader.result)
        reader.readAsDataURL(file)
    }

    function clearTeamAvatar() {
        setNewTeam(prev => ({ ...prev, avatar: null }))
        setNewTeamAvatarPreview(null)
        if (teamAvatarInputRef.current) teamAvatarInputRef.current.value = ''
    }

    async function handleSaveTeam(e) {
        e.preventDefault()
        if (!isOrganizer || !newTeam.name.trim()) return
        setAddingTeam(true)
        try {
            let teamId
            if (editingTeam) {
                await api.put(`/api/tournaments/${tournament.id}/teams/${editingTeam.id}`, {
                    name: newTeam.name.trim(),
                    contact_name: newTeam.contact_name || '',
                    contact_email: newTeam.contact_email || ''
                })
                teamId = editingTeam.id
            } else {
                const res = await api.post(`/api/tournaments/${tournament.id}/teams`, {
                    name: newTeam.name.trim(),
                    contact_name: newTeam.contact_name || '',
                    contact_email: newTeam.contact_email || ''
                })
                teamId = res.data.team?.id
            }

            if (teamId && newTeam.avatar) {
                const formData = new FormData()
                formData.append('file', newTeam.avatar)
                await api.post(`/api/tournaments/${tournament.id}/teams/${teamId}/logo`, formData, { headers: { 'Content-Type': undefined } })
            }

            setNewTeam({ name: '', contact_name: '', contact_email: '', avatar: null })
            setNewTeamAvatarPreview(null)
            setShowAddTeam(false)
            setEditingTeam(null)
            await loadData(tournament.id)
            addToast(editingTeam ? 'Team updated!' : 'Team added!')
        } catch (err) { alert(err.response?.data?.error || 'Failed') }
        finally { setAddingTeam(false) }
    }

    async function handleDeleteTeam(teamId) {
        if (!isOrganizer || !confirm('Remove this team from the tournament?')) return
        try {
            await api.delete(`/api/tournaments/${tournament.id}/teams/${teamId}`)
            await loadData(tournament.id)
            addToast('Team removed')
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to remove team')
        }
    }

    async function handleTeamStatus(teamId, action) {
        if (!isOrganizer) return
        try {
            await api.patch(`/api/tournaments/${tournament.id}/teams/${teamId}`, { action })
            await loadData(tournament.id)
            addToast(action === 'approve' ? 'Approved!' : 'Rejected')
        } catch (err) { alert(err.response?.data?.error || 'Failed') }
    }

    async function handleStatusChange(newStatus) {
        if (!isOrganizer) return
        try {
            await api.patch(`/api/tournaments/${tournament.id}/status`, { status: newStatus })
            setTournament(prev => ({ ...prev, status: newStatus }))
            addToast(`Status: ${newStatus}`)
        } catch (err) { alert(err.response?.data?.error || 'Failed') }
    }

    async function handleRollover() {
        if (!isOrganizer) return
        const seasonName = prompt('New season name:', 'Season 2')
        if (!seasonName) return
        try {
            const res = await api.post(`/api/tournaments/${tournament.id}/rollover`, { season_name: seasonName, carry_teams: true })
            navigate(`/t/${res.data.tournament.slug}`)
        } catch (err) { alert(err.response?.data?.error || 'Rollover failed') }
    }

    async function handleUpdateTournament(e) {
        e.preventDefault()
        if (!isOrganizer) return
        try {
            const res = await api.patch(`/api/tournaments/${tournament.id}`, editForm)
            setTournament(res.data.tournament)
            setIsEditing(false)
            addToast('Tournament updated!')
        } catch (err) { alert(err.response?.data?.error || 'Update failed') }
    }

    async function handleBannerUpload(e) {
        if (!isOrganizer) return
        const file = e.target.files?.[0]
        if (!file) return
        const formData = new FormData()
        formData.append('file', file)
        try {
            const res = await api.post(`/api/tournaments/${tournament.id}/banner`, formData, { headers: { 'Content-Type': undefined } })
            setTournament(prev => ({ ...prev, banner_url: res.data.banner_url }))
            addToast('Banner updated!')
        } catch (err) { alert(err.response?.data?.error || 'Upload failed') }
    }

    async function handleDeleteTournament() {
        if (!isOrganizer || deleteInput !== tournament.name) { alert('Type the exact name to confirm'); return }
        try {
            await api.delete(`/api/tournaments/${tournament.id}`)
            navigate('/dashboard')
        } catch (err) { alert(err.response?.data?.error || 'Delete failed') }
    }

    function startEditing() {
        setEditForm({
            name: tournament.name, description: tournament.description || '',
            tournament_type: tournament.tournament_type, format: tournament.format,
            max_teams: tournament.max_teams,
            start_date: tournament.start_date?.split('T')[0] || '',
            end_date: tournament.end_date?.split('T')[0] || '',
            group_count: tournament.group_count,
            teams_advance_per_group: tournament.teams_advance_per_group,
            is_double_round_robin: tournament.is_double_round_robin,
            is_two_legged_knockout: tournament.is_two_legged_knockout,
            penalties_enabled: tournament.penalties_enabled
        })
        setIsEditing(true)
    }

    // ── Status badge helper ─────────────────────────────
    const statusStyle = {
        active: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
        registration: 'bg-sky-50 text-sky-700 border-sky-200/60',
        draft: 'bg-[#f5debe]/60 text-[#7a6040] border-[#e8d9b4]',
        completed: 'bg-slate-100 text-slate-500 border-slate-200',
    }
    const statusLabel = {
        active: 'Live',
        registration: 'Open',
        draft: 'Draft',
        completed: 'Finished',
    }

    // ── Render: Loading / Not Found ─────────────────────
    if (loading) return (
        <div className="min-h-screen bg-gradient-to-b from-[#f5debe]/30 to-[#fefcf2] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-[#dc574b]/30 border-t-[#dc574b] animate-spin" />
                <p className="text-sm text-[#6b6357] font-medium tracking-wide">Loading tournament…</p>
            </div>
        </div>
    )

    if (!tournament) return (
        <div className="min-h-screen bg-gradient-to-b from-[#f5debe]/30 to-[#fefcf2] flex flex-col items-center justify-center gap-5">
            <p className="font-semibold text-[#1a1612] text-lg">Tournament not found</p>
            <button onClick={() => navigate('/dashboard')}
                className="px-5 py-2 bg-[#1a1612] text-[#fefcf2] rounded-lg text-sm font-semibold hover:bg-[#2d2520] transition-colors">
                ← Back to Dashboard
            </button>
        </div>
    )

    const availableTabs = getTabs(tournament.format)

    // ── Render: Main ────────────────────────────────────
    return (
        <div className="min-h-screen relative bg-gradient-to-b from-[#f5debe]/30 to-[#fefcf2] pb-20 md:pb-0">

            {/* ── Banner ── */}
            {tournament.banner_url && (
                <div className="w-full h-48 sm:h-56 md:h-72 relative overflow-hidden group">
                    <img src={tournament.banner_url} alt={tournament.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1a1612]/80 via-[#1a1612]/20 to-transparent" />
                    {isOrganizer && (
                        <button
                            onClick={() => bannerInputRef.current?.click()}
                            className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-[#1a1612] text-xs px-3 py-1.5 rounded-lg font-semibold tracking-wide opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg flex items-center gap-1.5"
                        >
                            <Icons.image className="w-3.5 h-3.5" /> Change
                        </button>
                    )}
                    <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
                </div>
            )}

            {/* ── Header ── */}
            <div className={`bg-[#fefcf2]/90 backdrop-blur-md border-b border-[#ede8de] px-4 sm:px-6 py-4 sm:py-5 sticky top-0 z-30 ${!tournament.banner_url ? 'shadow-sm' : ''}`}>
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-[#6b6357] hover:text-[#1a1612] hover:bg-[#f5debe]/50 transition-colors"
                            >
                                <Icons.arrowLeft className="w-5 h-5" />
                            </button>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1 className="font-bold text-[#1a1612] text-lg sm:text-xl leading-tight tracking-tight truncate">
                                        {tournament.name}
                                    </h1>
                                    {seasons.length > 1 && (
                                        <div className="relative">
                                            <select
                                                className="appearance-none bg-[#f5debe]/50 border border-[#e8d9b4] py-0.5 pl-2.5 pr-6 rounded-md text-xs font-bold uppercase tracking-widest text-[#7a6040] cursor-pointer hover:bg-[#f5debe] transition-colors"
                                                value={tournament.slug}
                                                onChange={e => navigate(`/t/${e.target.value}`)}
                                            >
                                                {seasons.map(s => (
                                                    <option key={s.slug} value={s.slug}>
                                                        {s.season_name || new Date(s.created_at).getFullYear()} {s.status === 'completed' ? '· Done' : ''}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] text-[#7a6040]">▾</div>
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-[#6b6357] capitalize mt-0.5 tracking-wide flex items-center gap-1.5 flex-wrap">
                                    {tournament.season_name && (
                                        <span className="text-[#dc574b] font-bold">{tournament.season_name}</span>
                                    )}
                                    <span className="w-1 h-1 rounded-full bg-[#c8bfb0]" />
                                    <span>{tournament.tournament_type}</span>
                                    <span className="w-1 h-1 rounded-full bg-[#c8bfb0]" />
                                    <span>{tournament.format.replace(/_/g, ' ')}</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full capitalize tracking-wide border ${statusStyle[tournament.status] || statusStyle.draft}`}>
                                {statusLabel[tournament.status] || tournament.status}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Match Action Modal ── */}
            {selectedMatch && isOrganizer && (
                <MatchActionModal
                    match={selectedMatch}
                    onClose={() => setSelectedMatch(null)}
                    onScore={async (matchId) => {
                        await handleScore(matchId)
                        setSelectedMatch(null)
                    }}
                    onReset={async (matchId) => {
                        await handleResetMatch(matchId)
                        setSelectedMatch(null)
                    }}
                    onRemove={async (matchId) => {
                        await handleRemoveMatch(matchId)
                        setSelectedMatch(null)
                    }}
                    scores={scores}
                    setScores={setScores}
                    submitting={submitting}
                />
            )}

            {/* ── Request Modal ── */}
            {showRequestForm && !isOrganizer && (
                <div className="fixed inset-0 bg-[#1a1612]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#fefcf2] rounded-2xl border border-[#ede8de] max-w-md w-full p-6 sm:p-7 shadow-2xl">
                        <h2 className="text-xl font-bold text-[#1a1612] mb-1">Register Your Team</h2>
                        <p className="text-sm text-[#6b6357] mb-6">Fill in your details to request a spot.</p>
                        <form onSubmit={handleRequestTeam} className="space-y-4">
                            {[
                                { label: 'Team Name', key: 'name', type: 'text', required: true, placeholder: 'Your team name' },
                                { label: 'Contact Person', key: 'contact_name', type: 'text', placeholder: 'Optional' },
                                { label: 'Contact Email', key: 'contact_email', type: 'email', placeholder: 'Optional' },
                            ].map(field => (
                                <div key={field.key}>
                                    <label className="block text-xs font-bold text-[#6b6357] uppercase tracking-widest mb-1.5">
                                        {field.label}{field.required && <span className="text-[#dc574b] ml-0.5">*</span>}
                                    </label>
                                    <input
                                        type={field.type} required={field.required}
                                        value={requestForm[field.key]}
                                        onChange={e => setRequestForm(f => ({ ...f, [field.key]: e.target.value }))}
                                        placeholder={field.placeholder}
                                        className="w-full px-3.5 py-2.5 bg-white border border-[#e8e2d6] rounded-xl text-sm text-[#1a1612] placeholder:text-[#c0b8ae] focus:outline-none focus:border-[#dc574b] focus:ring-2 focus:ring-[#dc574b]/10 transition-all"
                                    />
                                </div>
                            ))}
                            <div className="flex gap-3 pt-1">
                                <button type="button" onClick={() => setShowRequestForm(false)}
                                    className="flex-1 py-2.5 text-sm font-semibold text-[#6b6357] bg-[#f5debe]/50 border border-[#e8d9b4] rounded-xl hover:bg-[#f5debe] transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={requestLoading || !requestForm.name.trim()}
                                    className="flex-1 py-2.5 text-sm font-bold text-white bg-[#dc574b] rounded-xl hover:bg-[#c44a3f] transition-colors disabled:opacity-40 shadow-sm">
                                    {requestLoading ? 'Submitting…' : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Delete Modal ── */}
            {showDeleteConfirm && isOrganizer && (
                <div className="fixed inset-0 bg-[#1a1612]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#fefcf2] rounded-2xl shadow-2xl border border-[#ede8de] max-w-md w-full p-6 sm:p-7">
                        <h2 className="text-xl font-bold text-red-600 mb-1">Delete Tournament?</h2>
                        <p className="text-sm text-[#6b6357] mb-5">
                            This action is permanent. Type <strong className="text-[#1a1612]">"{tournament.name}"</strong> to confirm.
                        </p>
                        <input value={deleteInput} onChange={e => setDeleteInput(e.target.value)}
                            placeholder={tournament.name}
                            className="w-full px-3.5 py-2.5 bg-white border border-[#e8e2d6] rounded-xl text-sm text-[#1a1612] placeholder:text-[#c0b8ae] focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all mb-4" />
                        <div className="flex gap-3">
                            <button onClick={() => { setShowDeleteConfirm(false); setDeleteInput('') }}
                                className="flex-1 py-2.5 text-sm font-semibold text-[#6b6357] bg-[#f5debe]/50 border border-[#e8d9b4] rounded-xl hover:bg-[#f5debe] transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleDeleteTournament} disabled={deleteInput !== tournament.name}
                                className="flex-1 py-2.5 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-30">
                                Delete Permanently
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Edit Modal ── */}
            {isEditing && isOrganizer && (
                <div className="fixed inset-0 bg-[#1a1612]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#fefcf2] rounded-2xl shadow-2xl border border-[#ede8de] max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7">
                        <h2 className="text-xl font-bold text-[#1a1612] mb-6">Edit Tournament</h2>
                        <form onSubmit={handleUpdateTournament} className="space-y-5">
                            <div>
                                <label className="block text-[10px] font-bold text-[#9b8e80] uppercase tracking-[0.12em] mb-1.5">Name</label>
                                <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-white border border-[#e8e2d6] rounded-xl text-sm text-[#1a1612] focus:outline-none focus:border-[#dc574b] focus:ring-2 focus:ring-[#dc574b]/10 transition-all" required />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-[#9b8e80] uppercase tracking-[0.12em] mb-1.5">Description</label>
                                <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-white border border-[#e8e2d6] rounded-xl text-sm text-[#1a1612] focus:outline-none focus:border-[#dc574b] focus:ring-2 focus:ring-[#dc574b]/10 transition-all resize-none" rows={3} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-[#9b8e80] uppercase tracking-[0.12em] mb-1.5">Type</label>
                                    <select value={editForm.tournament_type} onChange={e => setEditForm({ ...editForm, tournament_type: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-white border border-[#e8e2d6] rounded-xl text-sm text-[#1a1612] focus:outline-none focus:border-[#dc574b] transition-all">
                                        <option value="physical">⚽ Physical</option>
                                        <option value="efootball">🎮 eFootball</option>
                                        <option value="futsal">🏃 Futsal</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-[#9b8e80] uppercase tracking-[0.12em] mb-1.5">Max Teams</label>
                                    <input type="number" value={editForm.max_teams} onChange={e => setEditForm({ ...editForm, max_teams: parseInt(e.target.value) })}
                                        className="w-full px-3.5 py-2.5 bg-white border border-[#e8e2d6] rounded-xl text-sm text-[#1a1612] focus:outline-none focus:border-[#dc574b] transition-all" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {['start_date', 'end_date'].map(key => (
                                    <div key={key}>
                                        <label className="block text-[10px] font-bold text-[#9b8e80] uppercase tracking-[0.12em] mb-1.5">
                                            {key === 'start_date' ? 'Start Date' : 'End Date'}
                                        </label>
                                        <input type="date" value={editForm[key]} onChange={e => setEditForm({ ...editForm, [key]: e.target.value })}
                                            className="w-full px-3.5 py-2.5 bg-white border border-[#e8e2d6] rounded-xl text-sm text-[#1a1612] focus:outline-none focus:border-[#dc574b] transition-all" />
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 bg-[#f5debe]/30 rounded-xl border border-[#e8d9b4] space-y-3">
                                {[
                                    { key: 'is_double_round_robin', label: 'Double Round Robin' },
                                    { key: 'penalties_enabled', label: 'Penalties Enabled' },
                                    { key: 'is_two_legged_knockout', label: 'Two-Legged Knockout' }
                                ].map(opt => (
                                    <label key={opt.key} className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" id={opt.key} checked={editForm[opt.key]}
                                            onChange={e => setEditForm({ ...editForm, [opt.key]: e.target.checked })}
                                            className="w-4 h-4 rounded border-[#c8bfb0] text-[#dc574b] focus:ring-[#dc574b]/20" />
                                        <span className="text-sm text-[#1a1612] font-medium">{opt.label}</span>
                                    </label>
                                ))}
                            </div>
                            {editForm.format === 'group_knockout' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-[#9b8e80] uppercase tracking-[0.12em] mb-1.5">Groups</label>
                                        <input type="number" value={editForm.group_count} onChange={e => setEditForm({ ...editForm, group_count: parseInt(e.target.value) })}
                                            className="w-full px-3.5 py-2.5 bg-white border border-[#e8e2d6] rounded-xl text-sm text-[#1a1612] focus:outline-none focus:border-[#dc574b] transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-[#9b8e80] uppercase tracking-[0.12em] mb-1.5">Advance Per Group</label>
                                        <input type="number" value={editForm.teams_advance_per_group} onChange={e => setEditForm({ ...editForm, teams_advance_per_group: parseInt(e.target.value) })}
                                            className="w-full px-3.5 py-2.5 bg-white border border-[#e8e2d6] rounded-xl text-sm text-[#1a1612] focus:outline-none focus:border-[#dc574b] transition-all" />
                                    </div>
                                </div>
                            )}
                            <div className="flex gap-3 pt-1">
                                <button type="button" onClick={() => setIsEditing(false)}
                                    className="flex-1 py-2.5 text-sm font-semibold text-[#6b6357] bg-[#f5debe]/50 border border-[#e8d9b4] rounded-xl hover:bg-[#f5debe] transition-colors">
                                    Cancel
                                </button>
                                <button type="submit"
                                    className="flex-1 py-2.5 text-sm font-bold text-white bg-[#dc574b] rounded-xl hover:bg-[#c44a3f] transition-colors shadow-sm">
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Tabs ── */}
            <div className="bg-[#fefcf2]/80 backdrop-blur-sm border-b border-[#ede8de] sticky top-[env(safe-area-inset-top)] z-20">
                <div className="max-w-4xl mx-auto overflow-hidden">
                    <div className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory px-2 sm:px-6 gap-1">
                        {availableTabs.map(t => {
                            const config = TAB_CONFIG[t]
                            const Icon = config.icon
                            const isActive = tab === t
                            const pendingCount = t === 'teams' && isOrganizer && pendingTeams.length > 0 ? pendingTeams.length : 0

                            return (
                                <button
                                    key={t}
                                    onClick={() => setTab(t)}
                                    className={`group/tab relative snap-start flex-shrink-0 flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-2 py-3.5 sm:py-3.5 px-3 sm:px-4 transition-all duration-200 outline-none select-none touch-manipulation min-w-[64px] ${isActive
                                        ? 'text-[#dc574b]'
                                        : 'text-[#9b8e80] hover:text-[#1a1612]'
                                        }`}
                                >
                                    {isActive && (
                                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 sm:w-12 h-0.5 bg-[#dc574b] rounded-full" />
                                    )}
                                    <div className={`relative p-1.5 rounded-xl transition-colors ${isActive ? 'bg-[#dc574b]/10' : ''}`}>
                                        <Icon className={`w-5 h-5 sm:w-[18px] sm:h-[18px] ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                                        {pendingCount > 0 && (
                                            <span className="absolute -top-0.5 -right-0.5 bg-[#dc574b] text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold border-2 border-[#fefcf2]">
                                                {pendingCount}
                                            </span>
                                        )}
                                    </div>
                                    <span className={`hidden sm:inline text-xs font-bold uppercase tracking-[0.08em] ${isActive ? 'text-[#dc574b]' : ''}`}>
                                        {config.label}
                                    </span>

                                    {/* Mobile Tooltip */}
                                    <div className="sm:hidden absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1.5 bg-[#1a1612] text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover/tab:opacity-100 group-active/tab:opacity-100 pointer-events-none transition-all duration-200 shadow-xl z-50 whitespace-nowrap">
                                        {config.label}
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1a1612] rotate-45" />
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* ── Content ── */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

                {/* INFO */}
                {tab === 'info' && !isOrganizer && (
                    <div className="space-y-5 sm:space-y-6">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                            {[
                                { icon: Icons.users, label: 'Teams', value: `${confirmedTeams.length}/${tournament.max_teams}`, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
                                { icon: Icons.fixtures, label: 'Matches', value: fixtures.length, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
                                { icon: Icons.calendar, label: 'Status', value: statusLabel[tournament.status] || tournament.status, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100' },
                                { icon: Icons.trophy, label: 'Format', value: tournament.format.replace(/_/g, ' '), color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
                            ].map((stat, i) => {
                                const StatIcon = stat.icon
                                return (
                                    <div key={i} className={`bg-white/90 backdrop-blur-sm rounded-2xl border ${stat.border} p-4 sm:p-5 shadow-sm flex flex-col items-center sm:items-start gap-2`}>
                                        <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center`}>
                                            <StatIcon className={`w-4 h-4 ${stat.color}`} />
                                        </div>
                                        <div className="text-center sm:text-left">
                                            <p className="text-[10px] sm:text-xs font-bold text-[#9b8e80] uppercase tracking-wider">{stat.label}</p>
                                            <p className={`text-sm sm:text-base font-bold capitalize mt-0.5 ${stat.color}`}>{stat.value}</p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-[#ede8de] overflow-hidden shadow-sm">
                            <div className="px-5 sm:px-6 py-4 border-b border-[#f0ebe3] flex items-center gap-2">
                                <Icons.info className="w-4 h-4 text-[#dc574b]" />
                                <h3 className="font-bold text-[#1a1612] text-sm sm:text-base tracking-wide">Tournament Details</h3>
                            </div>
                            <div className="p-5 sm:p-6">
                                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                                    {[
                                        { icon: Icons.shield, label: 'Type', value: tournament.tournament_type },
                                        { icon: Icons.target, label: 'Format', value: tournament.format.replace(/_/g, ' ') },
                                        { icon: Icons.users, label: 'Organizer', value: tournament.organizer_name },
                                        { icon: Icons.calendar, label: 'Start Date', value: tournament.start_date ? new Date(tournament.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'TBD' },
                                        { icon: Icons.clock, label: 'End Date', value: tournament.end_date ? new Date(tournament.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'TBD' },
                                        { icon: Icons.award, label: 'Max Teams', value: tournament.max_teams },
                                    ].map((item, i) => {
                                        const ItemIcon = item.icon
                                        return (
                                            <div key={i} className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-[#f5debe]/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <ItemIcon className="w-4 h-4 text-[#7a6040]" />
                                                </div>
                                                <div>
                                                    <dt className="text-[11px] font-bold text-[#9b8e80] uppercase tracking-wider">{item.label}</dt>
                                                    <dd className="text-sm font-semibold text-[#1a1612] capitalize mt-0.5">{item.value}</dd>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </dl>
                                {(tournament.is_double_round_robin || tournament.penalties_enabled || tournament.is_two_legged_knockout) && (
                                    <div className="mt-5 pt-4 border-t border-[#f0ebe3] flex flex-wrap gap-2">
                                        {tournament.is_double_round_robin && (
                                            <span className="text-[10px] font-bold bg-[#f5debe]/60 text-[#7a6040] border border-[#e8d9b4] px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                                                <Icons.refresh className="w-3 h-3" /> Double RR
                                            </span>
                                        )}
                                        {tournament.penalties_enabled && (
                                            <span className="text-[10px] font-bold bg-[#f5debe]/60 text-[#7a6040] border border-[#e8d9b4] px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                                                <Icons.target className="w-3 h-3" /> Penalties
                                            </span>
                                        )}
                                        {tournament.is_two_legged_knockout && (
                                            <span className="text-[10px] font-bold bg-[#f5debe]/60 text-[#7a6040] border border-[#e8d9b4] px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                                                <Icons.calendar className="w-3 h-3" /> Two-Legged
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {seasons.filter(s => s.status === 'completed').length > 0 && (
                            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-[#ede8de] overflow-hidden shadow-sm">
                                <div className="px-5 sm:px-6 py-4 border-b border-[#f0ebe3] flex items-center gap-2">
                                    <Icons.trophy className="w-4 h-4 text-amber-500" />
                                    <h3 className="font-bold text-[#1a1612] text-sm sm:text-base tracking-wide">Hall of Fame</h3>
                                </div>
                                <div className="divide-y divide-[#f0ebe3]">
                                    {seasons.filter(s => s.status === 'completed').map((s, i) => (
                                        <div key={s.slug} className="px-5 sm:px-6 py-4 flex items-center justify-between gap-3 hover:bg-[#f5debe]/10 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-xs font-bold text-amber-600">{i + 1}</span>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-[#dc574b] uppercase tracking-[0.12em]">{s.season_name}</p>
                                                    <p className="text-sm font-semibold text-[#1a1612] mt-0.5">{s.winner_name || 'No Winner'}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => navigate(`/t/${s.slug}`)}
                                                className="flex-shrink-0 text-[10px] font-bold text-[#9b8e80] hover:text-[#dc574b] uppercase tracking-widest transition-colors flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-[#f5debe]/30">
                                                View <Icons.chevronRight className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {tournament.description && (
                            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-[#ede8de] p-5 sm:p-6 shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    <Icons.sparkles className="w-4 h-4 text-[#dc574b]" />
                                    <h3 className="font-bold text-[#1a1612] text-sm sm:text-base">About</h3>
                                </div>
                                <p className="text-sm text-[#6b6357] leading-relaxed">{tournament.description}</p>
                            </div>
                        )}

                        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-[#ede8de] p-5 sm:p-6 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <Icons.share className="w-4 h-4 text-[#dc574b]" />
                                <h3 className="font-bold text-[#1a1612] text-sm sm:text-base">Share Tournament</h3>
                            </div>
                            <div className="flex items-center gap-2 bg-[#f5debe]/30 border border-[#e8d9b4] rounded-xl p-3">
                                <Icons.link className="w-4 h-4 text-[#9b8e80] flex-shrink-0" />
                                <span className="text-xs text-[#9b8e80] flex-1 truncate font-mono">{window.location.href}</span>
                                <button onClick={() => { navigator.clipboard.writeText(window.location.href); addToast('Link copied!') }}
                                    className="px-3 py-1.5 text-xs font-bold text-[#7a6040] bg-[#f5debe] border border-[#e8d9b4] rounded-lg hover:bg-[#efd5a8] transition-colors flex-shrink-0 flex items-center gap-1">
                                    <Icons.copy className="w-3 h-3" /> Copy
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* STANDINGS */}
                {tab === 'standings' && (
                    <div>
                        {tournament.format === 'group_knockout' && groupRows.length > 0 ? (
                            <div className="space-y-5 sm:space-y-6">
                                {groupRows.map(group => (
                                    <div key={group.name} className="bg-white/90 backdrop-blur-sm rounded-2xl border border-[#ede8de] overflow-hidden shadow-sm">
                                        <div className="px-4 sm:px-5 py-3.5 bg-[#f5debe]/30 border-b border-[#ede8de] flex justify-between items-center">
                                            <h3 className="font-bold text-[#1a1612] tracking-wide text-sm sm:text-base flex items-center gap-2">
                                                <Icons.target className="w-4 h-4 text-[#dc574b]" />
                                                Group {group.name}
                                            </h3>
                                            <span className="text-xs text-[#9b8e80] font-medium">{group.fixtures?.length || 0} matches</span>
                                        </div>
                                        <div className="overflow-x-auto no-scrollbar">
                                            <StandingsTable rows={group.standings} advanceCount={tournament.teams_advance_per_group || 2} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-[#ede8de] overflow-hidden shadow-sm">
                                {standingsRows.length === 0 ? (
                                    <EmptyState message="No standings yet" icon={Icons.standings} />
                                ) : (
                                    <div className="overflow-x-auto no-scrollbar">
                                        <StandingsTable rows={standingsRows} advanceCount={2} />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* FIXTURES */}
                {tab === 'fixtures' && (
                    <div className="space-y-5 sm:space-y-6">
                        {isOrganizer && (
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-[#9b8e80] font-medium">
                                    {isOrganizer ? 'Tap any match to manage scores' : ''}
                                </p>
                                <button onClick={handleGenerate} disabled={generating || confirmedTeams.length < 2}
                                    className="px-4 py-2.5 text-xs font-bold text-[#6b6357] bg-[#f5debe]/50 border border-[#e8d9b4] rounded-xl hover:bg-[#f5debe] transition-colors disabled:opacity-40 tracking-wide uppercase flex items-center gap-2 shadow-sm">
                                    <Icons.refresh className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
                                    {generating ? 'Generating…' : fixtures.length > 0 ? 'Regenerate' : 'Generate Fixtures'}
                                </button>
                            </div>
                        )}

                        {tournament.format === 'group_knockout' ? (
                            <div>
                                <div className="flex items-center justify-between mb-4 sm:mb-5 pb-4 sm:pb-5 border-b border-[#ede8de]">
                                    <div className="flex items-center gap-2">
                                        <Icons.fixtures className="w-5 h-5 text-emerald-600" />
                                        <div>
                                            <h3 className="font-bold text-[#1a1612] text-base sm:text-lg">Group Stage</h3>
                                            <p className="text-xs text-[#9b8e80] mt-0.5 font-medium">
                                                {fixtures.filter(f => f.group_name && f.status === 'completed').length} of {fixtures.filter(f => f.group_name).length} completed
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                {groupRows.map(group => (
                                    <div key={group.name} className="mb-6 sm:mb-7">
                                        <p className="text-xs font-bold text-[#9b8e80] uppercase tracking-[0.12em] mb-3 flex items-center gap-1.5">
                                            <Icons.target className="w-3.5 h-3.5" /> Group {group.name}
                                        </p>
                                        <div className="space-y-2.5">
                                            {group.fixtures?.map(match => (
                                                <MatchCard
                                                    key={match.id}
                                                    match={match}
                                                    isOrganizer={isOrganizer}
                                                    onClick={isOrganizer ? () => setSelectedMatch(match) : undefined}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {fixtures.filter(f => !f.group_name).length > 0 && (
                                    <div className="mt-8 pt-8 border-t border-[#ede8de]">
                                        <div className="flex items-center gap-2 mb-5">
                                            <Icons.trophy className="w-5 h-5 text-[#dc574b]" />
                                            <h3 className="font-bold text-[#1a1612] text-base sm:text-lg">Knockout Stage</h3>
                                        </div>
                                        {[...new Set(fixtures.filter(f => !f.group_name).map(f => f.round_number))].sort((a, b) => a - b).map(round => (
                                            <div key={round} className="mb-6">
                                                <p className="text-[10px] font-bold text-[#9b8e80] uppercase tracking-[0.14em] mb-3 flex items-center gap-1.5">
                                                    <Icons.award className="w-3.5 h-3.5" />
                                                    {getFixtureLabel(fixtures.find(f => !f.group_name && f.round_number === round))}
                                                </p>
                                                <div className="space-y-2.5">
                                                    {fixtures.filter(f => !f.group_name && f.round_number === round).map(match => (
                                                        <MatchCard
                                                            key={match.id}
                                                            match={match}
                                                            isOrganizer={isOrganizer}
                                                            showWinner
                                                            onClick={isOrganizer ? () => setSelectedMatch(match) : undefined}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-5 sm:space-y-6">
                                {fixtures.length === 0 ? (
                                    <EmptyState message={isOrganizer ? 'Add teams and click Generate Fixtures.' : 'No fixtures yet.'} icon={Icons.fixtures} />
                                ) : (
                                    [...new Set(fixtures.map(f => f.round_number))].sort((a, b) => a - b).map(round => (
                                        <div key={round}>
                                            <p className="text-[10px] font-bold text-[#9b8e80] uppercase tracking-[0.14em] mb-3 flex items-center gap-1.5">
                                                <Icons.award className="w-3.5 h-3.5" />
                                                {getFixtureLabel(fixtures.find(f => f.round_number === round))}
                                            </p>
                                            <div className="space-y-2.5">
                                                {fixtures.filter(f => f.round_number === round).map(match => (
                                                    <MatchCard
                                                        key={match.id}
                                                        match={match}
                                                        isOrganizer={isOrganizer}
                                                        showWinner
                                                        onClick={isOrganizer ? () => setSelectedMatch(match) : undefined}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* BRACKET */}
                {tab === 'bracket' && (
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-[#ede8de] p-4 sm:p-6 shadow-sm">
                        <BracketTab fixtures={fixtures} tournament={tournament} />
                    </div>
                )}

                {/* MEDIA */}
                {tab === 'media' && (
                    <div className="space-y-6">
                        <MediaTab tournament={tournament} isOrganizer={isOrganizer} />
                    </div>
                )}

                {/* TEAMS */}
                {tab === 'teams' && (
                    <div className="space-y-4">
                        {isOrganizer && (
                            <div className="flex gap-2 mb-2">
                                <button onClick={() => { setEditingTeam(null); setShowAddTeam(!showAddTeam); setNewTeam({ name: '', contact_name: '', contact_email: '', avatar: null }); setNewTeamAvatarPreview(null); }}
                                    className="px-4 py-2.5 text-xs font-bold text-white bg-[#1a1612] rounded-xl hover:bg-[#2d2520] transition-colors tracking-wide uppercase shadow-sm flex items-center gap-1.5">
                                    {showAddTeam ? <Icons.x className="w-3.5 h-3.5" /> : <Icons.plus className="w-3.5 h-3.5" />}
                                    {showAddTeam ? 'Cancel' : 'Add Team'}
                                </button>
                            </div>
                        )}

                        {isOrganizer && showAddTeam && (
                            <form onSubmit={handleSaveTeam}
                                className="bg-white/90 backdrop-blur-sm rounded-2xl border border-[#dc574b]/15 p-5 sm:p-6 space-y-4 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-[#1a1612] text-sm sm:text-base flex items-center gap-2">
                                        {editingTeam ? <Icons.edit className="w-4 h-4 text-[#dc574b]" /> : <Icons.plus className="w-4 h-4 text-[#dc574b]" />}
                                        {editingTeam ? 'Replace / Edit Team' : 'Add Team'}
                                    </h3>
                                    {tournament.status === 'active' && !editingTeam && (
                                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-100 uppercase animate-pulse">
                                            Note: Regenerate fixtures after adding
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-4">
                                    <div onClick={() => teamAvatarInputRef.current?.click()}
                                        className="relative w-16 h-16 rounded-xl border-2 border-dashed border-[#e8d9b4] hover:border-[#dc574b] hover:bg-[#dc574b]/5 cursor-pointer transition-all flex items-center justify-center overflow-hidden group flex-shrink-0">
                                        {newTeamAvatarPreview ? (
                                            <>
                                                <img src={newTeamAvatarPreview} alt="" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="text-white text-xs font-bold">Change</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center">
                                                <Icons.image className="w-5 h-5 text-[#9b8e80] mx-auto" />
                                                <p className="text-[9px] font-bold text-[#9b8e80] uppercase tracking-widest mt-0.5">Logo</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-semibold text-[#6b6357] mb-0.5">Team Logo</p>
                                        <p className="text-[10px] text-[#9b8e80]">Optional. Click to upload.</p>
                                        {newTeamAvatarPreview && (
                                            <button type="button" onClick={(e) => { e.stopPropagation(); clearTeamAvatar() }}
                                                className="mt-1.5 text-[10px] text-red-500 font-bold hover:text-red-600 flex items-center gap-1">
                                                <Icons.trash className="w-3 h-3" /> Remove
                                            </button>
                                        )}
                                    </div>
                                    <input ref={teamAvatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleTeamAvatarSelect} />
                                </div>
                                <input required placeholder="Team name" value={newTeam.name}
                                    onChange={e => setNewTeam({ ...newTeam, name: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-white border border-[#e8e2d6] rounded-xl text-sm text-[#1a1612] placeholder:text-[#c0b8ae] focus:outline-none focus:border-[#dc574b] focus:ring-2 focus:ring-[#dc574b]/10 transition-all" />
                                <div className="grid grid-cols-2 gap-3">
                                    <input placeholder="Contact Name" value={newTeam.contact_name} onChange={e => setNewTeam({ ...newTeam, contact_name: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-[#e8e2d6] rounded-xl text-xs" />
                                    <input placeholder="Contact Email" value={newTeam.contact_email} onChange={e => setNewTeam({ ...newTeam, contact_email: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-[#e8e2d6] rounded-xl text-xs" />
                                </div>
                                <button type="submit" disabled={addingTeam}
                                    className="w-full py-2.5 text-sm font-bold text-white bg-[#dc574b] rounded-xl hover:bg-[#c44a3f] transition-colors disabled:opacity-40 shadow-sm flex items-center justify-center gap-2">
                                    <Icons.check className="w-4 h-4" />
                                    {addingTeam ? 'Saving…' : editingTeam ? 'Update Team' : 'Confirm Team'}
                                </button>
                            </form>
                        )}

                        {isOrganizer && pendingTeams.length > 0 && (
                            <div className="mb-2">
                                <p className="text-[10px] font-bold text-[#dc574b] uppercase tracking-[0.14em] mb-3 flex items-center gap-1.5">
                                    <Icons.bell className="w-3.5 h-3.5" /> Pending Requests ({pendingTeams.length})
                                </p>
                                <div className="space-y-2.5">
                                    {pendingTeams.map(t => (
                                        <div key={t.id}
                                            className="bg-white/90 rounded-xl border border-[#ede8de] p-4 flex items-center justify-between gap-3 shadow-sm">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <Avatar src={t.logo_url} name={t.name} size="w-9 h-9" rounded="rounded-lg" />
                                                <span className="font-semibold text-sm text-[#1a1612] truncate">{t.name}</span>
                                            </div>
                                            <div className="flex gap-2 flex-shrink-0">
                                                <button onClick={() => handleTeamStatus(t.id, 'approve')}
                                                    className="bg-emerald-600 text-white text-[10px] px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-700 transition-colors tracking-wide uppercase flex items-center gap-1">
                                                    <Icons.check className="w-3 h-3" /> Approve
                                                </button>
                                                <button onClick={() => handleTeamStatus(t.id, 'reject')}
                                                    className="bg-white text-red-600 border border-red-200 text-[10px] px-3 py-1.5 rounded-lg font-bold hover:bg-red-50 transition-colors tracking-wide uppercase flex items-center gap-1">
                                                    <Icons.x className="w-3 h-3" /> Reject
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between py-2">
                            <p className="text-sm text-[#6b6357] font-medium">
                                <span className="font-bold text-[#1a1612]">{confirmedTeams.length}</span> of <span className="font-bold text-[#1a1612]">{tournament.max_teams}</span> teams
                            </p>
                            <div className="h-2 w-28 sm:w-36 bg-[#f5debe]/80 rounded-full overflow-hidden border border-[#e8d9b4]">
                                <div className="h-full bg-[#dc574b] rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min((confirmedTeams.length / tournament.max_teams) * 100, 100)}%` }} />
                            </div>
                        </div>

                        {confirmedTeams.length === 0 ? (
                            <EmptyState message="No confirmed teams yet" icon={Icons.teams} />
                        ) : (
                            <div className="space-y-2.5">
                                {confirmedTeams.map((team, i) => (
                                    <div key={team.id} className="bg-white/90 backdrop-blur-sm rounded-xl border border-[#ede8de] p-4 flex items-center gap-3 shadow-sm hover:border-[#ddd6c8] transition-colors">
                                        <div className="w-10 h-10 rounded-xl bg-[#f5debe]/70 flex items-center justify-center font-bold text-[#7a6040] border border-[#e8d9b4] flex-shrink-0 text-sm overflow-hidden">
                                            {team.logo_url ? (
                                                <img src={team.logo_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                i + 1
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-[#1a1612] text-sm truncate">{team.name}</p>
                                            {team.contact_name && <p className="text-xs text-[#9b8e80]">{team.contact_name}</p>}
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {isOrganizer && (
                                                <button onClick={() => {
                                                    setEditingTeam(team);
                                                    setShowAddTeam(true);
                                                    setNewTeam({ name: team.name, contact_name: team.contact_name || '', contact_email: team.contact_email || '' });
                                                    setNewTeamAvatarPreview(team.logo_url);
                                                }}
                                                    className="p-1.5 text-[#9b8e80] hover:text-[#1a1612] hover:bg-[#f5debe]/50 rounded-lg transition-colors" title="Edit / Replace">
                                                    <Icons.edit className="w-4 h-4" />
                                                </button>
                                            )}
                                            {isOrganizer && tournament.status === 'registration' && (
                                                <button onClick={() => handleDeleteTeam(team.id)}
                                                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Remove">
                                                    <Icons.trash className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* SETTINGS (Organizer Only) */}
                {tab === 'settings' && isOrganizer && (
                    <div className="space-y-5 sm:space-y-6">
                        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-[#ede8de] p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-[10px] font-bold text-[#9b8e80] uppercase tracking-[0.15em]">Tournament Lifecycle</p>
                                <span className="text-[10px] text-[#9b8e80] font-medium">
                                    {confirmedTeams.length}/{tournament.max_teams} teams · {fixtures.length} matches
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2">
                                {['draft', 'registration', 'active', 'completed'].map((s, i, arr) => {
                                    const cur = tournament.status
                                    const isActive = cur === s
                                    const isPast = arr.indexOf(cur) > i
                                    return (
                                        <div key={s} className="flex items-center gap-1.5 flex-shrink-0">
                                            <button
                                                onClick={() => !isActive && !isPast && handleStatusChange(s)}
                                                disabled={isActive || isPast}
                                                className={`text-[10px] px-3 py-1.5 rounded-full font-bold uppercase tracking-wide transition-all flex items-center gap-1 ${isActive ? 'bg-[#1a1612] text-[#fefcf2] shadow-sm' :
                                                    isPast ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 cursor-default' :
                                                        'bg-[#f5debe]/50 text-[#9b8e80] border border-[#e8d9b4] hover:bg-[#f5debe]'
                                                    }`}
                                            >
                                                {isPast && <Icons.check className="w-3 h-3" />}
                                                {s}
                                            </button>
                                            {i < arr.length - 1 && (
                                                <Icons.chevronRight className="w-3 h-3 text-[#c8bfb0]" />
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                            {[
                                { icon: Icons.users, label: 'Teams', value: `${confirmedTeams.length}/${tournament.max_teams}`, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
                                { icon: Icons.fixtures, label: 'Matches', value: fixtures.length, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
                                { icon: Icons.calendar, label: 'Status', value: statusLabel[tournament.status] || tournament.status, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100' },
                                { icon: Icons.trophy, label: 'Format', value: tournament.format.replace(/_/g, ' '), color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
                            ].map((stat, i) => {
                                const StatIcon = stat.icon
                                return (
                                    <div key={i} className={`bg-white/90 backdrop-blur-sm rounded-2xl border ${stat.border} p-4 sm:p-5 shadow-sm flex flex-col items-center sm:items-start gap-2`}>
                                        <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center`}>
                                            <StatIcon className={`w-4 h-4 ${stat.color}`} />
                                        </div>
                                        <div className="text-center sm:text-left">
                                            <p className="text-[10px] sm:text-xs font-bold text-[#9b8e80] uppercase tracking-wider">{stat.label}</p>
                                            <p className={`text-sm sm:text-base font-bold capitalize mt-0.5 ${stat.color}`}>{stat.value}</p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-[#ede8de] overflow-hidden shadow-sm">
                            <div className="px-5 sm:px-6 py-4 border-b border-[#f0ebe3] flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Icons.info className="w-4 h-4 text-[#dc574b]" />
                                    <h3 className="font-bold text-[#1a1612] text-sm sm:text-base tracking-wide">Overview & Configuration</h3>
                                </div>
                            </div>
                            <div className="p-5 sm:p-6">
                                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 mb-6">
                                    {[
                                        { icon: Icons.shield, label: 'Type', value: tournament.tournament_type },
                                        { icon: Icons.target, label: 'Format', value: tournament.format.replace(/_/g, ' ') },
                                        { icon: Icons.calendar, label: 'Start Date', value: tournament.start_date ? new Date(tournament.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'TBD' },
                                        { icon: Icons.clock, label: 'End Date', value: tournament.end_date ? new Date(tournament.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'TBD' },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-[#f5debe]/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <item.icon className="w-4 h-4 text-[#7a6040]" />
                                            </div>
                                            <div>
                                                <dt className="text-[11px] font-bold text-[#9b8e80] uppercase tracking-wider">{item.label}</dt>
                                                <dd className="text-sm font-semibold text-[#1a1612] capitalize mt-0.5">{item.value}</dd>
                                            </div>
                                        </div>
                                    ))}
                                </dl>

                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-[10px] font-bold text-[#9b8e80] uppercase tracking-wider mb-3">Management Actions</p>
                                    <div className="flex flex-wrap gap-2">
                                        <button onClick={startEditing}
                                            className="flex-1 min-w-[120px] px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                                            <Icons.edit className="w-3.5 h-3.5" /> Edit Details
                                        </button>
                                        {tournament.status === 'completed' && (
                                            <button onClick={handleRollover}
                                                className="flex-1 min-w-[120px] px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                                                <Icons.refresh className="w-3.5 h-3.5" /> Rollover / New Season
                                            </button>
                                        )}
                                        <button onClick={() => setShowDeleteConfirm(true)}
                                            className="flex-1 min-w-[120px] px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2">
                                            <Icons.trash className="w-3.5 h-3.5" /> Delete Tournament
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-[#ede8de] overflow-hidden shadow-sm">
                            <div className="px-5 sm:px-6 py-4 border-b border-[#f0ebe3]">
                                <h3 className="font-bold text-[#1a1612] text-sm sm:text-base flex items-center gap-2">
                                    <Icons.image className="w-4 h-4 text-[#dc574b]" /> Tournament Banner
                                </h3>
                            </div>
                            <div className="p-5 sm:p-6 space-y-3">
                                <p className="text-xs text-[#9b8e80] mb-2">Change the visual identity of your tournament. Recommended 1200×400.</p>
                                {tournament.banner_url ? (
                                    <div className="relative w-full h-36 sm:h-44 rounded-xl overflow-hidden border border-[#ede8de] group">
                                        <img src={tournament.banner_url} alt="Banner" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-[#1a1612]/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => bannerInputRef.current?.click()}
                                                className="bg-[#fefcf2] text-[#1a1612] px-4 py-2 rounded-lg text-xs font-bold shadow-lg hover:bg-white transition-colors flex items-center gap-1.5">
                                                <Icons.image className="w-3.5 h-3.5" /> Change Image
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button onClick={() => bannerInputRef.current?.click()}
                                        className="w-full h-36 sm:h-44 border-2 border-dashed border-[#e8d9b4] rounded-xl flex flex-col items-center justify-center gap-2 hover:border-[#dc574b] hover:bg-[#dc574b]/5 transition-all">
                                        <Icons.image className="w-8 h-8 text-[#9b8e80]" />
                                        <span className="text-[10px] font-bold text-[#9b8e80] uppercase tracking-widest">Upload Banner</span>
                                    </button>
                                )}
                                <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
                            </div>
                        </div>

                        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-[#ede8de] overflow-hidden shadow-sm">
                            <div className="px-5 sm:px-6 py-4 border-b border-[#f0ebe3]">
                                <h3 className="font-bold text-[#1a1612] text-sm sm:text-base flex items-center gap-2">
                                    <Icons.share className="w-4 h-4 text-[#dc574b]" /> Share Link
                                </h3>
                            </div>
                            <div className="p-5 sm:p-6">
                                <div className="flex items-center gap-2 bg-[#f5debe]/30 border border-[#e8d9b4] rounded-xl p-3">
                                    <Icons.link className="w-4 h-4 text-[#9b8e80] flex-shrink-0" />
                                    <span className="text-xs text-[#9b8e80] flex-1 truncate font-mono">{window.location.origin}/t/{tournament.slug}</span>
                                    <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/t/${tournament.slug}`); addToast('Link copied!') }}
                                        className="px-3 py-1.5 text-xs font-bold text-[#7a6040] bg-[#f5debe] border border-[#e8d9b4] rounded-lg hover:bg-[#efd5a8] transition-colors flex-shrink-0 flex items-center gap-1">
                                        <Icons.copy className="w-3 h-3" /> Copy
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* ── Toasts ── */}
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
                {toasts.map(t => (
                    <div key={t.id}
                        className="pointer-events-auto bg-[#1a1612] text-[#fefcf2] px-4 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-white/10 min-w-[260px] max-w-[90vw]"
                        style={{ animation: 'slideInToast 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
                        <div className="w-7 h-7 rounded-full bg-[#dc574b] flex items-center justify-center text-xs flex-shrink-0">
                            <Icons.bell className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[9px] font-bold text-[#dc574b] uppercase tracking-[0.15em] mb-0.5">Notification</p>
                            <p className="text-sm font-medium truncate">{t.msg}</p>
                        </div>
                        <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
                            className="text-[#6b6357] hover:text-[#fefcf2] transition-colors flex-shrink-0">
                            <Icons.x className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
            </div>

            <style>{`
                @keyframes slideInToast {
                    from { transform: translateX(calc(100% + 20px)); opacity: 0; }
                    to   { transform: translateX(0); opacity: 1; }
                }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    )
}

// ── Sub-components ─────────────────────────────────────

function EmptyState({ message, icon: Icon }) {
    return (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-[#ede8de] p-10 sm:p-14 text-center shadow-sm">
            {Icon && <Icon className="w-8 h-8 text-[#e8d9b4] mx-auto mb-3" />}
            <p className="text-sm text-[#9b8e80] font-medium">{message}</p>
        </div>
    )
}

function StandingsTable({ rows, advanceCount }) {
    const [showFull, setShowFull] = useState(false)

    return (
        <div className="flex flex-col">
            <button onClick={() => setShowFull(!showFull)} className="sm:hidden py-2 px-4 text-[10px] font-bold text-[#7a6040] bg-[#f5debe]/20 border-t border-[#ede8de] hover:bg-[#f5debe]/40 transition-colors flex items-center justify-center gap-1.5 uppercase tracking-widest">
                {showFull ? 'Hide detailed stats' : 'View full stats'}
                <Icons.chevronRight className={`w-3 h-3 transition-transform ${showFull ? '-rotate-90' : 'rotate-90'}`} />
            </button>
            <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-[#f5debe]/20 border-b border-[#ede8de]">
                            <th className="py-3 px-3 text-[10px] font-bold text-[#9b8e80] uppercase tracking-[0.1em] text-center w-8">#</th>
                            <th className="py-3 px-3 text-[10px] font-bold text-[#9b8e80] uppercase tracking-[0.1em] text-left">Team</th>
                            <th className="py-3 px-3 text-[10px] font-bold text-[#9b8e80] uppercase tracking-[0.1em] text-center w-10">P</th>
                            <th className={`py-3 px-3 text-[10px] font-bold text-[#9b8e80] uppercase tracking-[0.1em] text-center w-10 ${showFull ? 'table-cell' : 'hidden sm:table-cell'}`}>W</th>
                            <th className={`py-3 px-3 text-[10px] font-bold text-[#9b8e80] uppercase tracking-[0.1em] text-center w-10 ${showFull ? 'table-cell' : 'hidden sm:table-cell'}`}>D</th>
                            <th className={`py-3 px-3 text-[10px] font-bold text-[#9b8e80] uppercase tracking-[0.1em] text-center w-10 ${showFull ? 'table-cell' : 'hidden sm:table-cell'}`}>L</th>
                            <th className={`py-3 px-3 text-[10px] font-bold text-[#9b8e80] uppercase tracking-[0.1em] text-center w-12 ${showFull ? 'table-cell' : 'hidden md:table-cell'}`}>GD</th>
                            <th className={`py-3 px-3 text-[10px] font-bold text-[#9b8e80] uppercase tracking-[0.1em] text-center w-12 ${showFull ? 'table-cell' : 'hidden lg:table-cell'}`}>AG</th>
                            <th className="py-3 px-3 text-[10px] font-bold text-[#9b8e80] uppercase tracking-[0.1em] text-center w-12">Pts</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((team, i) => {
                            const advances = i < advanceCount
                            return (
                                <tr key={team.id || i}
                                    className={`border-b border-[#f5f0e8] last:border-0 transition-colors hover:bg-[#f5debe]/10 ${advances ? 'bg-emerald-50/30' : ''}`}>
                                    <td className="py-3 px-3 text-center text-[#9b8e80] font-semibold text-xs">{i + 1}</td>
                                    <td className="py-3 px-3 font-semibold text-[#1a1612]">
                                        <div className="flex items-center gap-2">
                                            <Avatar src={team.logo_url} name={team.name} size="w-5 h-5" text_size="text-[9px]" />
                                            <span className="truncate max-w-[80px] sm:max-w-none">{team.name}</span>
                                            {advances && <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-1 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0 ml-1">adv</span>}
                                        </div>
                                    </td>
                                    <td className="py-3 px-3 text-center text-[#6b6357] text-xs font-medium">{team.played || 0}</td>
                                    <td className={`py-3 px-3 text-center text-[#6b6357] text-xs ${showFull ? 'table-cell' : 'hidden sm:table-cell'}`}>{team.won || 0}</td>
                                    <td className={`py-3 px-3 text-center text-[#6b6357] text-xs ${showFull ? 'table-cell' : 'hidden sm:table-cell'}`}>{team.drawn || 0}</td>
                                    <td className={`py-3 px-3 text-center text-[#6b6357] text-xs ${showFull ? 'table-cell' : 'hidden sm:table-cell'}`}>{team.lost || 0}</td>
                                    <td className={`py-3 px-3 text-center text-[#6b6357] text-xs ${showFull ? 'table-cell' : 'hidden md:table-cell'}`}>{team.goal_difference || 0}</td>
                                    <td className={`py-3 px-3 text-center text-[#9b8e80] text-xs italic ${showFull ? 'table-cell' : 'hidden lg:table-cell'}`}>{team.goals_away || 0}</td>
                                    <td className="py-3 px-3 text-center font-bold text-[#1a1612] text-xs">{team.points || 0}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function MatchActionModal({ match, onClose, onScore, onReset, onRemove, scores, setScores, submitting }) {
    const [view, setView] = useState('menu')

    return (
        <div className="fixed inset-0 bg-[#1a1612]/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-[#fefcf2] rounded-3xl border border-[#ede8de] w-full max-w-sm overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="px-5 py-4 border-b border-[#f0ebe3] flex items-center justify-between">
                    <span className="text-[10px] font-black text-[#dc574b] uppercase tracking-[0.2em] italic">Match Management</span>
                    <button onClick={onClose} className="p-1 text-[#9b8e80] hover:text-[#1a1612] transition-colors">
                        <Icons.x className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5">
                    {/* Teams */}
                    <div className="flex items-center justify-between gap-4 mb-8 bg-white p-4 rounded-2xl border border-[#ede8de]">
                        <div className="flex-1 flex flex-col items-center gap-2">
                            <Avatar src={match.home_team_logo} name={match.home_team_name} size="w-12 h-12" />
                            <span className="text-[10px] font-black text-[#1a1612] uppercase tracking-wider text-center line-clamp-1">{match.home_team_name || 'TBD'}</span>
                        </div>
                        
                        <div className="px-4 py-2 bg-[#f5debe]/30 rounded-xl border border-[#e8d9b4] flex items-center justify-center min-w-[80px]">
                            {match.status === 'completed' ? (
                                <span className="text-lg font-black text-[#1a1612] tabular-nums italic">
                                    {match.home_score} – {match.away_score}
                                </span>
                            ) : (
                                <span className="text-sm font-black text-[#c8bfb0] italic tracking-tighter">VS</span>
                            )}
                        </div>

                        <div className="flex-1 flex flex-col items-center gap-2">
                            <Avatar src={match.away_team_logo} name={match.away_team_name} size="w-12 h-12" />
                            <span className="text-[10px] font-black text-[#1a1612] uppercase tracking-wider text-center line-clamp-1">{match.away_team_name || 'TBD'}</span>
                        </div>
                    </div>

                    {view === 'menu' ? (
                        <div className="space-y-2.5">
                            <button onClick={() => setView('score')}
                                className="w-full flex items-center gap-4 p-4 bg-white border border-[#e8d9b4] rounded-2xl hover:border-[#dc574b] hover:shadow-lg hover:shadow-[#dc574b]/5 transition-all group">
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-[#dc574b] group-hover:text-white transition-colors">
                                    <Icons.plus className="w-4 h-4" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-[#1a1612]">Set Result</p>
                                    <p className="text-[10px] text-[#9b8e80] uppercase tracking-wider font-medium">Record final scores</p>
                                </div>
                            </button>

                            {match.status === 'completed' && (
                                <button onClick={() => onReset(match.id)}
                                    className="w-full flex items-center gap-4 p-4 bg-white border border-[#e8d9b4] rounded-2xl hover:bg-amber-50 hover:border-amber-200 transition-all">
                                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                                        <Icons.refresh className="w-4 h-4" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-bold text-[#1a1612]">Restore Result</p>
                                        <p className="text-[10px] text-[#9b8e80] uppercase tracking-wider font-medium">Revert to scheduled</p>
                                    </div>
                                </button>
                            )}

                            <button onClick={() => onRemove(match.id)}
                                className="w-full flex items-center gap-3 p-3.5 bg-white border border-[#e8d9b4] rounded-2xl hover:bg-red-50 hover:border-red-200 transition-all">
                                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                                    <Icons.trash className="w-4 h-4" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-[#1a1612]">Remove Match</p>
                                    <p className="text-[10px] text-[#9b8e80]">Delete fixture permanently</p>
                                </div>
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            <div className="flex items-center gap-3">
                                <input type="number" placeholder="0" value={scores[match.id]?.home ?? ''}
                                    onChange={e => setScores(p => ({ ...p, [match.id]: { ...p[match.id], home: e.target.value } }))}
                                    className="flex-1 px-4 py-4 bg-white border-2 border-[#e8d9b4] rounded-2xl text-center font-black text-3xl text-[#1a1612] focus:outline-none focus:border-[#dc574b] focus:ring-4 focus:ring-[#dc574b]/5 transition-all" autoFocus />
                                <span className="text-[#c8bfb0] font-black text-3xl italic mx-2">/</span>
                                <input type="number" placeholder="0" value={scores[match.id]?.away ?? ''}
                                    onChange={e => setScores(p => ({ ...p, [match.id]: { ...p[match.id], away: e.target.value } }))}
                                    className="flex-1 px-4 py-4 bg-white border-2 border-[#e8d9b4] rounded-2xl text-center font-black text-3xl text-[#1a1612] focus:outline-none focus:border-[#dc574b] focus:ring-4 focus:ring-[#dc574b]/5 transition-all" />
                            </div>

                            {scores[match.id]?.home === scores[match.id]?.away &&
                                scores[match.id]?.home !== '' && scores[match.id]?.home !== undefined && (
                                <div className="p-5 bg-amber-50/80 rounded-[2rem] border border-amber-100 animate-in zoom-in-95">
                                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] text-center mb-4 italic">Penalty Shootout</p>
                                    <div className="flex items-center gap-4">
                                        <input type="number" placeholder="P" value={scores[match.id]?.pHome ?? ''}
                                            onChange={e => setScores(p => ({ ...p, [match.id]: { ...p[match.id], pHome: e.target.value } }))}
                                            className="flex-1 px-3 py-3 bg-white border border-amber-200 rounded-xl text-center font-black text-xl text-amber-700" />
                                        <span className="text-amber-300 font-black text-lg italic">VS</span>
                                        <input type="number" placeholder="P" value={scores[match.id]?.pAway ?? ''}
                                            onChange={e => setScores(p => ({ ...p, [match.id]: { ...p[match.id], pAway: e.target.value } }))}
                                            className="flex-1 px-3 py-3 bg-white border border-amber-200 rounded-xl text-center font-black text-xl text-amber-700" />
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col gap-2 pt-2">
                                <button onClick={() => onScore(match.id)} disabled={submitting === match.id}
                                    className="w-full py-3.5 bg-[#dc574b] text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-[#dc574b]/20 hover:bg-[#c44a3f] active:scale-95 transition-all disabled:opacity-40">
                                    {submitting === match.id ? 'Saving…' : 'Submit Final Score'}
                                </button>
                                <button onClick={() => setView('menu')} className="text-[10px] font-black text-[#9b8e80] uppercase tracking-widest py-3 italic">
                                    ← Back
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function MediaTab({ tournament, isOrganizer }) {
    // Placeholder for actual media logic
    return (
        <div className="space-y-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-[#ede8de] p-8 sm:p-12 text-center shadow-sm">
                <div className="w-20 h-20 bg-pink-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Icons.camera className="w-10 h-10 text-pink-500" />
                </div>
                <h3 className="text-xl font-black text-[#1a1612] uppercase tracking-tighter italic">Tournament Gallery</h3>
                <p className="text-sm text-[#9b8e80] mt-2 max-w-sm mx-auto font-medium">
                    Relive the moments. Photos and videos of the tournament will appear here once uploaded.
                </p>
                
                {isOrganizer && (
                    <div className="mt-8">
                        <button className="px-6 py-3 bg-[#1a1612] text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-[#2d2520] transition-all shadow-lg active:scale-95 flex items-center gap-3 mx-auto italic">
                            <Icons.plus className="w-4 h-4" /> Upload Highlights
                        </button>
                    </div>
                )}
            </div>

            {/* Grid display if media exists (placeholder) */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="aspect-square bg-white/40 border border-dashed border-[#ede8de] rounded-2xl animate-pulse" />
                ))}
            </div>
        </div>
    )
}

function MatchCard({ match, isOrganizer, showWinner = false, onClick }) {
    const homeWon = showWinner && match.winner_team_id === match.home_team_id
    const awayWon = showWinner && match.winner_team_id === match.away_team_id
    const isCompleted = match.status === 'completed'

    return (
        <div
            onClick={onClick}
            className={`bg-white/90 backdrop-blur-sm rounded-xl border transition-all duration-200 p-3.5 sm:p-4 shadow-sm ${
                isOrganizer
                    ? 'cursor-pointer hover:border-[#dc574b] hover:shadow-md active:scale-[0.99]'
                    : 'border-[#ede8de]'
            }`}>
            <div className="flex items-center gap-2 sm:gap-3">
                <span className={`font-semibold text-sm flex-1 flex items-center gap-2 min-w-0 ${homeWon ? 'text-[#dc574b]' : 'text-[#1a1612]'}`}>
                    <Avatar src={match.home_team_logo} name={match.home_team_name} size="w-5 h-5" text_size="text-[9px]" />
                    <span className="truncate">{match.home_team_name || 'TBD'}</span>
                    {homeWon && <span className="text-[9px] font-bold bg-[#dc574b]/10 text-[#dc574b] px-1.5 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0">W</span>}
                </span>
                <div className="text-center px-2 sm:px-3 flex-shrink-0">
                    {isCompleted ? (
                        <span className="font-bold text-[#1a1612] tabular-nums text-sm sm:text-base">
                            {match.home_score} – {match.away_score}
                        </span>
                    ) : (
                        <span className="text-[10px] font-bold text-[#c0b8ae] bg-[#f5debe]/40 border border-[#e8d9b4] px-3 py-1 rounded-full uppercase tracking-widest">
                            vs
                        </span>
                    )}
                </div>
                <span className={`font-semibold text-sm flex-1 text-right flex items-center gap-2 justify-end min-w-0 ${awayWon ? 'text-[#dc574b]' : 'text-[#1a1612]'}`}>
                    {awayWon && <span className="text-[9px] font-bold bg-[#dc574b]/10 text-[#dc574b] px-1.5 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0">W</span>}
                    <span className="truncate">{match.away_team_name || 'TBD'}</span>
                    <Avatar src={match.away_team_logo} name={match.away_team_name} size="w-5 h-5" text_size="text-[9px]" />
                </span>
            </div>
        </div>
    )
}

// ── Bracket Sub-components ────────────────────────────

function BracketMatchCard({ match, isFinal = false }) {
    const homeWon = match.status === 'completed' && match.winner_team_id === match.home_team_id
    const awayWon = match.status === 'completed' && match.winner_team_id === match.away_team_id

    return (
        <div className={`bg-white rounded-2xl border-2 overflow-hidden transition-all ${isFinal ? 'border-amber-300 shadow-lg' : 'border-[#ede8de] shadow-sm'}`}>
            {isFinal && (
                <div className="bg-amber-50 px-4 py-2 border-b border-amber-100 flex items-center justify-center gap-2">
                    <Icons.trophy className="w-4 h-4 text-amber-500" />
                    <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Championship Match</span>
                </div>
            )}
            <div className="p-4 space-y-3">
                {/* Home Team */}
                <div className={`flex items-center justify-between ${homeWon ? 'text-[#dc574b]' : 'text-[#1a1612]'}`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar src={match.home_team_logo} name={match.home_team_name} size={isFinal ? "w-8 h-8" : "w-6 h-6"} text_size="text-[9px]" />
                        <span className={`font-bold truncate ${isFinal ? 'text-sm' : 'text-xs'}`}>
                            {match.home_team_name || 'TBD'}
                        </span>
                        {homeWon && <Icons.check className="w-3.5 h-3.5 text-[#dc574b] flex-shrink-0" />}
                    </div>
                    <span className={`font-black tabular-nums ${isFinal ? 'text-lg' : 'text-sm'}`}>
                        {match.status === 'completed' ? match.home_score : '-'}
                    </span>
                </div>

                {/* Divider */}
                <div className="h-px bg-[#f0ebe3]" />

                {/* Away Team */}
                <div className={`flex items-center justify-between ${awayWon ? 'text-[#dc574b]' : 'text-[#1a1612]'}`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar src={match.away_team_logo} name={match.away_team_name} size={isFinal ? "w-8 h-8" : "w-6 h-6"} text_size="text-[9px]" />
                        <span className={`font-bold truncate ${isFinal ? 'text-sm' : 'text-xs'}`}>
                            {match.away_team_name || 'TBD'}
                        </span>
                        {awayWon && <Icons.check className="w-3.5 h-3.5 text-[#dc574b] flex-shrink-0" />}
                    </div>
                    <span className={`font-black tabular-nums ${isFinal ? 'text-lg' : 'text-sm'}`}>
                        {match.status === 'completed' ? match.away_score : '-'}
                    </span>
                </div>
            </div>
        </div>
    )
}

function BracketTab({ fixtures, tournament }) {
    const bracketFixtures = fixtures.filter(f => !f.group_name)

    if (bracketFixtures.length === 0) {
        return (
            <EmptyState
                message={tournament.format === 'group_knockout'
                    ? "Knockout bracket will appear after the group stage"
                    : "No bracket matches generated yet"}
                icon={Icons.bracket}
            />
        )
    }

    const rounds = {}
    bracketFixtures.forEach(f => {
        if (!rounds[f.round_number]) rounds[f.round_number] = []
        rounds[f.round_number].push(f)
    })

    const roundKeys = Object.keys(rounds).sort((a, b) => a - b)
    const totalRounds = roundKeys.length

    const getRoundName = (roundNum) => {
        const diff = totalRounds - roundNum
        if (diff === 0) return 'Final'
        if (diff === 1) return 'Semi Finals'
        if (diff === 2) return 'Quarter Finals'
        if (roundNum === 1 && totalRounds >= 4) return `Round of ${Math.pow(2, totalRounds - 1)}`
        return `Round ${roundNum}`
    }

    return (
        <div className="space-y-8 max-w-lg mx-auto">
            {roundKeys.map((roundNum, idx) => {
                const isFinal = idx === roundKeys.length - 1
                return (
                    <div key={roundNum} className="relative">
                        {/* Round Header */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#ede8de] to-transparent" />
                            <div className={`px-4 py-1.5 rounded-full ${isFinal ? 'bg-amber-100 border border-amber-200' : 'bg-[#f5debe]/40 border border-[#e8d9b4]'}`}>
                                <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${isFinal ? 'text-amber-700' : 'text-[#7a6040]'}`}>
                                    {getRoundName(roundNum)}
                                </span>
                            </div>
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#ede8de] to-transparent" />
                        </div>

                        <div className="space-y-3">
                            {rounds[roundNum].map(match => (
                                <BracketMatchCard key={match.id} match={match} isFinal={isFinal} roundNum={parseInt(roundNum)} />
                            ))}
                        </div>

                        {/* Connector to next round */}
                        {idx < roundKeys.length - 1 && (
                            <div className="flex justify-center mt-6">
                                <div className="flex flex-col items-center">
                                    <div className="w-0.5 h-6 bg-[#dc574b]/20" />
                                    <div className="w-2 h-2 rotate-45 border-r-2 border-b-2 border-[#dc574b]/30 mt-1" />
                                </div>
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}