import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import BracketView from '../Components/BracketView'
import { getFixtureLabel, getPublicTournamentTabs } from '../lib/tournamentFormat'

const BRACKET_FORMATS = new Set([
  'single_elim', 'single_elimination',
  'double_elim', 'double_elimination',
  'group_knockout'
])

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
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('standings')

  // ── Chat States ─────────────────────────────────────
  const [chatInput, setChatInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  // ── Public Request States ───────────────────────────
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [requestForm, setRequestForm] = useState({ name: '', contact_name: '', contact_email: '' })
  const [requestLoading, setRequestLoading] = useState(false)

  // ── Organizer Management States ─────────────────────
  const [scores, setScores] = useState({})
  const [submitting, setSubmitting] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [showAddTeam, setShowAddTeam] = useState(false)
  const [newTeam, setNewTeam] = useState({ name: '', contact_name: '', contact_email: '' })
  const [addingTeam, setAddingTeam] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const bannerInputRef = useRef(null)

  // ── Toast System ────────────────────────────────────
  const [toasts, setToasts] = useState([])
  const addToast = (msg) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, msg }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000)
  }

  const isOrganizer = user && tournament && user.id === tournament.organizer_id
  const confirmedTeams = teams.filter(t => t.status === 'confirmed')
  const pendingTeams = teams.filter(t => t.status === 'pending')

  // ── Data Loading ────────────────────────────────────
  async function loadData(tournamentId) {
    if (!tournamentId) return
    try {
      const [s, f, tm, m, g] = await Promise.all([
        api.get(`/api/tournaments/${tournamentId}/standings`),
        api.get(`/api/tournaments/${tournamentId}/fixtures`),
        api.get(`/api/tournaments/${tournamentId}/teams`),
        api.get(`/api/tournaments/${tournamentId}/messages`),
        tournament?.format === 'group_knockout'
          ? api.get(`/api/tournaments/${tournamentId}/groups`)
          : Promise.resolve({ data: { groups: [] } })
      ])
      setStandings(s.data.standings || [])
      setFixtures(f.data.fixtures || [])
      setTeams(tm.data.teams || [])
      setMessages(m.data.messages || [])
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
      .catch(err => {
        console.error('Load error:', err)
        setLoading(false)
      })
      .finally(() => setLoading(false))
  }, [slug, user])

  // ── WebSocket ───────────────────────────────────────
  useEffect(() => {
    if (!tournament?.id) return
    const baseURL = api.defaults.baseURL || window.location.origin
    const wsURL = baseURL.replace(/^http/, 'ws') + `/api/tournaments/${tournament.id}/chat`
    const socket = new WebSocket(wsURL)

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'new_message') {
        setMessages(prev => prev.find(m => m.id === data.message.id) ? prev : [...prev, data.message])
      } else if (data.type === 'new_team_request') {
        setTeams(prev => [...prev, data.team])
        if (isOrganizer) addToast(`New request: ${data.team.name}`)
      }
    }
    return () => socket.close()
  }, [tournament?.id, isOrganizer])

  useEffect(() => {
    if (tab === 'chat') bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, tab])

  useEffect(() => {
    if (!tournament) return
    const available = getTabs(tournament.format)
    if (!available.includes(tab)) setTab(available[0])
  }, [tournament, tab])

  // ── Helper: Tab List ────────────────────────────────
  function getTabs(format) {
    const tabs = ['standings', 'fixtures', 'teams', 'chat', 'info']
    if (BRACKET_FORMATS.has(format)) tabs.splice(1, 0, 'bracket')
    if (isOrganizer) {
      const idx = tabs.indexOf('fixtures') + 1
      tabs.splice(idx, 0, 'scores')
      tabs.push('settings')
    }
    return tabs
  }

  // ── Handlers: Public ────────────────────────────────
  async function sendMessage(e) {
    e.preventDefault()
    if (!chatInput.trim() || !user) return
    setSending(true)
    try {
      const res = await api.post(`/api/tournaments/${tournament.id}/messages`, {
        sender_name: user.full_name,
        content: chatInput
      })
      setMessages(prev => [...prev, res.data.message])
      setChatInput('')
    } catch (err) { console.error(err) }
    finally { setSending(false) }
  }

  async function handleRequestTeam(e) {
    e.preventDefault()
    setRequestLoading(true)
    try {
      await api.post(`/api/tournaments/${tournament.id}/teams/request`, requestForm)
      alert('✅ Request submitted!')
      setRequestForm({ name: '', contact_name: '', contact_email: '' })
      setShowRequestForm(false)
    } catch (err) {
      alert(err.response?.data?.error || 'Request failed')
    } finally {
      setRequestLoading(false)
    }
  }

  // ── Handlers: Organizer ─────────────────────────────
  async function handleGenerate() {
    if (!isOrganizer) return
    setGenerating(true)
    try {
      const res = await api.post(`/api/tournaments/${tournament.id}/generate`)
      await loadData(tournament.id)
      addToast(`Generated ${res.data.count} matches!`)
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to generate')
    } finally {
      setGenerating(false)
    }
  }

  async function handleScore(matchId) {
    if (!isOrganizer) return
    const s = scores[matchId]
    if (!s || s.home === '' || s.away === '') {
      alert('Enter both scores')
      return
    }
    setSubmitting(matchId)
    try {
      const payload = {
        home_score: parseInt(s.home, 10),
        away_score: parseInt(s.away, 10)
      }
      if (s.pHome !== undefined && s.pAway !== undefined) {
        payload.home_penalty_score = parseInt(s.pHome, 10)
        payload.away_penalty_score = parseInt(s.pAway, 10)
      }
      await api.patch(`/api/tournaments/${tournament.id}/matches/${matchId}/score`, payload)
      await loadData(tournament.id)
      setScores(prev => {
        const next = { ...prev }
        delete next[matchId]
        return next
      })
      addToast('Score saved!')
    } catch (err) {
      alert(err.response?.data?.error || 'Failed')
    } finally {
      setSubmitting(null)
    }
  }

  async function handleResetMatch(matchId) {
    if (!isOrganizer || !confirm('Reset this match?')) return
    try {
      await api.patch(`/api/tournaments/${tournament.id}/matches/${matchId}/reset`)
      await loadData(tournament.id)
      addToast('Match reset')
    } catch (err) {
      alert(err.response?.data?.error || 'Reset failed')
    }
  }

  async function handleAddTeam(e) {
    e.preventDefault()
    if (!isOrganizer || !newTeam.name.trim()) return
    setAddingTeam(true)
    try {
      await api.post(`/api/tournaments/${tournament.id}/teams`, newTeam)
      setNewTeam({ name: '', contact_name: '', contact_email: '' })
      setShowAddTeam(false)
      await loadData(tournament.id)
      addToast('Team added!')
    } catch (err) {
      alert(err.response?.data?.error || 'Failed')
    } finally {
      setAddingTeam(false)
    }
  }

  async function handleTeamStatus(teamId, action) {
    if (!isOrganizer) return
    try {
      await api.patch(`/api/tournaments/${tournament.id}/teams/${teamId}`, { action })
      await loadData(tournament.id)
      addToast(action === 'approve' ? 'Approved!' : 'Rejected')
    } catch (err) {
      alert(err.response?.data?.error || 'Failed')
    }
  }

  async function handleStatusChange(newStatus) {
    if (!isOrganizer) return
    try {
      await api.patch(`/api/tournaments/${tournament.id}/status`, { status: newStatus })
      setTournament(prev => ({ ...prev, status: newStatus }))
      addToast(`Status: ${newStatus}`)
    } catch (err) {
      alert(err.response?.data?.error || 'Failed')
    }
  }

  async function handleRollover() {
    if (!isOrganizer) return
    const seasonName = prompt('New season name:', 'Season 2')
    if (!seasonName) return
    try {
      const res = await api.post(`/api/tournaments/${tournament.id}/rollover`, {
        season_name: seasonName,
        carry_teams: true
      })
      navigate(`/t/${res.data.tournament.slug}`)
    } catch (err) {
      alert(err.response?.data?.error || 'Rollover failed')
    }
  }

  async function handleUpdateTournament(e) {
    e.preventDefault()
    if (!isOrganizer) return
    try {
      const res = await api.patch(`/api/tournaments/${tournament.id}`, editForm)
      setTournament(res.data.tournament)
      setIsEditing(false)
      addToast('Tournament updated!')
    } catch (err) {
      alert(err.response?.data?.error || 'Update failed')
    }
  }

  async function handleBannerUpload(e) {
    if (!isOrganizer) return
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await api.post(`/api/tournaments/${tournament.id}/banner`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setTournament(prev => ({ ...prev, banner_url: res.data.banner_url }))
      addToast('Banner updated!')
    } catch (err) {
      alert(err.response?.data?.error || 'Upload failed')
    }
  }

  async function handleDeleteTournament() {
    if (!isOrganizer || deleteInput !== tournament.name) {
      alert('Type the exact name to confirm')
      return
    }
    try {
      await api.delete(`/api/tournaments/${tournament.id}`)
      navigate('/dashboard')
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed')
    }
  }

  function startEditing() {
    setEditForm({
      name: tournament.name,
      description: tournament.description || '',
      tournament_type: tournament.tournament_type,
      format: tournament.format,
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

  // ── Render: Loading / Not Found ─────────────────────
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

  // ── Render: Main ────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Banner */}
      {tournament.banner_url && (
        <div className="w-full h-48 md:h-64 lg:h-80 relative overflow-hidden group">
          <img src={tournament.banner_url} alt={tournament.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent" />
          {isOrganizer && (
            <button
              onClick={() => bannerInputRef.current?.click()}
              className="absolute top-4 right-4 bg-white/90 backdrop-blur text-gray-900 text-xs px-3 py-1.5 rounded-lg font-bold opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Change Banner
            </button>
          )}
          <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-gray-600 text-sm">←</button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-gray-900">{tournament.name}</h1>
                {seasons.length > 1 && (
                  <div className="relative group">
                    <select
                      className="appearance-none bg-gray-100 border-none py-0.5 pl-2 pr-6 rounded text-[10px] font-bold uppercase tracking-tight text-gray-500 cursor-pointer hover:bg-gray-200"
                      value={tournament.slug}
                      onChange={e => navigate(`/t/${e.target.value}`)}
                    >
                      {seasons.map(s => (
                        <option key={s.slug} value={s.slug}>
                          {s.season_name || new Date(s.created_at).getFullYear()} {s.status === 'completed' ? '• Done' : ''}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] text-gray-400">▼</div>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 capitalize">
                {tournament.season_name && <span className="text-brand-600 font-bold mr-1">{tournament.season_name}</span>}
                {tournament.tournament_type} · {tournament.format.replace(/_/g, ' ')} · {tournament.status}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              tournament.status === 'active' ? 'bg-green-100 text-green-700' :
              tournament.status === 'registration' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {tournament.status}
            </span>

            {!isOrganizer && tournament.status === 'registration' && (
              <button onClick={() => setShowRequestForm(!showRequestForm)} className="btn-primary text-xs py-1.5 px-3">
                📋 Request to Join
              </button>
            )}

            {isOrganizer && tournament.status === 'completed' && (
              <button onClick={handleRollover} className="bg-brand-500 text-white text-xs py-1.5 px-3 rounded-lg hover:bg-brand-600 font-bold">
                🔄 New Season
              </button>
            )}

            {isOrganizer && (
              <>
                <button onClick={() => setIsEditing(!isEditing)} className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200">
                  {isEditing ? 'Cancel Edit' : '✏️ Edit'}
                </button>
                <button onClick={() => setShowDeleteConfirm(true)} className="text-xs bg-red-100 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-200">
                  🗑 Delete
                </button>
              </>
            )}
          </div>
        </div>

        {/* Organizer Status Bar */}
        {isOrganizer && (
          <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status Flow</p>
              <span className="text-[10px] text-gray-400">
                {confirmedTeams.length}/{tournament.max_teams} teams · {fixtures.length} matches
              </span>
            </div>
            <div className="flex items-center gap-2">
              {['draft', 'registration', 'active', 'completed'].map((s, i, arr) => {
                const cur = tournament.status
                const isActive = cur === s
                const isPast = arr.indexOf(cur) > i
                return (
                  <div key={s} className="flex items-center gap-2">
                    <button
                      onClick={() => !isActive && !isPast && handleStatusChange(s)}
                      disabled={isActive || isPast}
                      className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase transition-all ${
                        isActive ? 'bg-gray-900 text-white shadow-md' :
                        isPast ? 'bg-green-100 text-green-700 cursor-default' :
                        'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {isPast ? '✓ ' : ''}{s}
                    </button>
                    {i < arr.length - 1 && <span className="text-gray-200 text-[10px]">→</span>}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Request Modal */}
      {showRequestForm && !isOrganizer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl border border-gray-200 max-w-md w-full mx-4 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Register Your Team</h2>
            <form onSubmit={handleRequestTeam} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Name *</label>
                <input type="text" required value={requestForm.name}
                  onChange={e => setRequestForm(f => ({ ...f, name: e.target.value }))}
                  className="input" placeholder="Your team name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                <input type="text" value={requestForm.contact_name}
                  onChange={e => setRequestForm(f => ({ ...f, contact_name: e.target.value }))}
                  className="input" placeholder="Optional" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                <input type="email" value={requestForm.contact_email}
                  onChange={e => setRequestForm(f => ({ ...f, contact_email: e.target.value }))}
                  className="input" placeholder="Optional" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowRequestForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={requestLoading || !requestForm.name.trim()}
                  className="btn-primary flex-1 disabled:opacity-40">
                  {requestLoading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteConfirm && isOrganizer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-red-600 mb-2">Delete Tournament?</h2>
            <p className="text-sm text-gray-500 mb-4">Type <strong>"{tournament.name}"</strong> to confirm.</p>
            <input value={deleteInput} onChange={e => setDeleteInput(e.target.value)}
              placeholder={tournament.name} className="input mb-4" />
            <div className="flex gap-3">
              <button onClick={() => { setShowDeleteConfirm(false); setDeleteInput('') }} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleDeleteTournament} disabled={deleteInput !== tournament.name}
                className="flex-1 bg-red-600 text-white rounded-xl font-bold py-2.5 disabled:opacity-30">
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && isOrganizer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Edit Tournament</h2>
            <form onSubmit={handleUpdateTournament} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Name</label>
                <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="input" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Description</label>
                <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  className="input resize-none" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Type</label>
                  <select value={editForm.tournament_type} onChange={e => setEditForm({ ...editForm, tournament_type: e.target.value })} className="input">
                    <option value="physical">⚽ Physical</option>
                    <option value="efootball">🎮 eFootball</option>
                    <option value="futsal">🏃 Futsal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Max Teams</label>
                  <input type="number" value={editForm.max_teams}
                    onChange={e => setEditForm({ ...editForm, max_teams: parseInt(e.target.value) })} className="input" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Start Date</label>
                  <input type="date" value={editForm.start_date}
                    onChange={e => setEditForm({ ...editForm, start_date: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">End Date</label>
                  <input type="date" value={editForm.end_date}
                    onChange={e => setEditForm({ ...editForm, end_date: e.target.value })} className="input" />
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                {[
                  { key: 'is_double_round_robin', label: 'Double Round Robin' },
                  { key: 'penalties_enabled', label: 'Penalties Enabled' },
                  { key: 'is_two_legged_knockout', label: 'Two-Legged Knockout' }
                ].map(opt => (
                  <div key={opt.key} className="flex items-center gap-2">
                    <input type="checkbox" id={opt.key} checked={editForm[opt.key]}
                      onChange={e => setEditForm({ ...editForm, [opt.key]: e.target.checked })} />
                    <label htmlFor={opt.key} className="text-xs text-gray-700">{opt.label}</label>
                  </div>
                ))}
              </div>
              {editForm.format === 'group_knockout' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Groups</label>
                    <input type="number" value={editForm.group_count}
                      onChange={e => setEditForm({ ...editForm, group_count: parseInt(e.target.value) })} className="input" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Advance Per Group</label>
                    <input type="number" value={editForm.teams_advance_per_group}
                      onChange={e => setEditForm({ ...editForm, teams_advance_per_group: parseInt(e.target.value) })} className="input" />
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary flex-1 py-2">Cancel</button>
                <button type="submit" className="btn-primary flex-1 py-2">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 overflow-x-auto">
        <div className="flex px-6 min-w-max">
          {getTabs(tournament.format).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`py-3 px-4 text-sm font-medium capitalize border-b-2 transition-colors ${
                tab === t ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {t}
              {t === 'teams' && isOrganizer && pendingTeams.length > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingTeams.length}</span>
              )}
              {t === 'chat' && messages.length > 0 && (
                <span className="ml-1.5 bg-brand-500 text-white text-xs px-1.5 py-0.5 rounded-full">{messages.length}</span>
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
                    <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                      <h3 className="font-bold text-gray-900">Group {group.name}</h3>
                      <span className="text-xs text-gray-400">{group.fixtures?.length || 0} matches</span>
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
            {isOrganizer && (
              <div className="flex justify-end mb-4">
                <button onClick={handleGenerate} disabled={generating || confirmedTeams.length < 2}
                  className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40">
                  {generating ? 'Generating...' : fixtures.length > 0 ? '↺ Regenerate' : '⚡ Generate Fixtures'}
                </button>
              </div>
            )}

            {tournament.format === 'group_knockout' ? (
              <div>
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                  <div>
                    <h3 className="font-bold text-gray-900">Group Stage</h3>
                    <p className="text-xs text-gray-500">
                      {fixtures.filter(f => f.group_name && f.status === 'completed').length} of {fixtures.filter(f => f.group_name).length} completed
                    </p>
                  </div>
                </div>

                {groups.map(group => (
                  <div key={group.name} className="mb-6">
                    <p className="text-sm font-bold text-gray-700 mb-3">Group {group.name}</p>
                    <div className="space-y-2">
                      {group.fixtures?.map(match => (
                        <div key={match.id} className="card">
                          <div className="flex items-center justify-between gap-3">
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
                          {isOrganizer && match.status === 'completed' && (
                            <button onClick={() => handleResetMatch(match.id)}
                              className="mt-2 text-[9px] text-gray-400 hover:text-red-500 font-bold uppercase">Reset</button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {fixtures.filter(f => !f.group_name).length > 0 && (
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <h3 className="font-bold text-gray-900 mb-4">Knockout Stage</h3>
                    {[...new Set(fixtures.filter(f => !f.group_name).map(f => f.round_number))].sort((a, b) => a - b).map(round => (
                      <div key={round}>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                          {getFixtureLabel(fixtures.find(f => !f.group_name && f.round_number === round))}
                        </p>
                        <div className="space-y-2 mb-4">
                          {fixtures.filter(f => !f.group_name && f.round_number === round).map(match => (
                            <div key={match.id} className="card">
                              <div className="flex items-center justify-between gap-3">
                                <span className={`font-medium text-sm flex-1 ${match.winner_team_id === match.home_team_id ? 'text-brand-500 font-bold' : ''}`}>
                                  {match.home_team_name || 'TBD'}
                                </span>
                                <div className="text-center px-4">
                                  {match.status === 'completed' ? (
                                    <span className="font-bold">{match.home_score} – {match.away_score}</span>
                                  ) : (
                                    <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">vs</span>
                                  )}
                                </div>
                                <span className={`font-medium text-sm flex-1 text-right ${match.winner_team_id === match.away_team_id ? 'text-brand-500 font-bold' : ''}`}>
                                  {match.away_team_name || 'TBD'}
                                </span>
                              </div>
                              {isOrganizer && match.status === 'completed' && (
                                <button onClick={() => handleResetMatch(match.id)}
                                  className="mt-2 text-[9px] text-gray-400 hover:text-red-500 font-bold uppercase">Reset</button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {fixtures.length === 0 ? (
                  <div className="card text-center text-sm text-gray-400 py-12">
                    {isOrganizer ? 'Add teams and click Generate Fixtures.' : 'No fixtures yet.'}
                  </div>
                ) : (
                  [...new Set(fixtures.map(f => f.round_number))].sort((a, b) => a - b).map(round => (
                    <div key={round}>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                        {getFixtureLabel(fixtures.find(f => f.round_number === round))}
                      </p>
                      <div className="space-y-2">
                        {fixtures.filter(f => f.round_number === round).map(match => (
                          <div key={match.id} className="card">
                            <div className="flex items-center justify-between gap-3">
                              <span className={`font-medium text-sm flex-1 ${match.winner_team_id === match.home_team_id ? 'text-brand-500 font-bold' : ''}`}>
                                {match.home_team_name}
                              </span>
                              <div className="text-center px-4">
                                {match.status === 'completed' ? (
                                  <span className="font-bold">{match.home_score} – {match.away_score}</span>
                                ) : (
                                  <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">vs</span>
                                )}
                              </div>
                              <span className={`font-medium text-sm flex-1 text-right ${match.winner_team_id === match.away_team_id ? 'text-brand-500 font-bold' : ''}`}>
                                {match.away_team_name}
                              </span>
                            </div>
                            {isOrganizer && match.status === 'completed' && (
                              <button onClick={() => handleResetMatch(match.id)}
                                className="mt-2 text-[9px] text-gray-400 hover:text-red-500 font-bold uppercase">Reset</button>
                            )}
                          </div>
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
          <BracketView fixtures={fixtures} tournament={tournament} />
        )}

        {/* SCORES (Organizer Only) */}
        {tab === 'scores' && isOrganizer && (
          <div className="space-y-3">
            {fixtures.filter(f => f.status === 'scheduled').length === 0 ? (
              <div className="card text-center text-sm text-gray-400 py-12">
                {fixtures.length === 0 ? 'Generate fixtures first.' : '🎉 All matches scored!'}
              </div>
            ) : (
              fixtures.filter(f => f.status === 'scheduled').map(match => (
                <div key={match.id} className="card">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">{getFixtureLabel(match)}</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-1.5 truncate">{match.home_team_name || 'TBD'}</p>
                      <input type="number" placeholder="0" value={scores[match.id]?.home ?? ''}
                        onChange={e => setScores(p => ({ ...p, [match.id]: { ...p[match.id], home: e.target.value } }))}
                        className="input text-center font-bold" />
                    </div>
                    <span className="text-gray-300 font-bold mt-6">–</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-1.5 text-right truncate">{match.away_team_name || 'TBD'}</p>
                      <input type="number" placeholder="0" value={scores[match.id]?.away ?? ''}
                        onChange={e => setScores(p => ({ ...p, [match.id]: { ...p[match.id], away: e.target.value } }))}
                        className="input text-center font-bold" />
                    </div>
                  </div>
                  {scores[match.id]?.home === scores[match.id]?.away && scores[match.id]?.home !== '' && scores[match.id]?.home !== undefined && (
                    <div className="mt-4 p-3 bg-brand-50 rounded-lg border border-brand-100">
                      <p className="text-[10px] font-bold text-brand-600 uppercase mb-2 text-center">Penalty Shootout</p>
                      <div className="flex items-center gap-3">
                        <input type="number" placeholder="P" value={scores[match.id]?.pHome ?? ''}
                          onChange={e => setScores(p => ({ ...p, [match.id]: { ...p[match.id], pHome: e.target.value } }))}
                          className="input flex-1 text-center text-sm" />
                        <input type="number" placeholder="P" value={scores[match.id]?.pAway ?? ''}
                          onChange={e => setScores(p => ({ ...p, [match.id]: { ...p[match.id], pAway: e.target.value } }))}
                          className="input flex-1 text-center text-sm" />
                      </div>
                    </div>
                  )}
                  <button onClick={() => handleScore(match.id)} disabled={submitting === match.id}
                    className="btn-primary w-full justify-center flex mt-3">
                    {submitting === match.id ? 'Saving...' : 'Submit Score'}
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* TEAMS */}
        {tab === 'teams' && (
          <div className="space-y-3">
            {isOrganizer && (
              <div className="mb-6 flex gap-2">
                <button onClick={() => setShowAddTeam(!showAddTeam)} className="btn-primary text-xs py-2 px-4">
                  {showAddTeam ? 'Cancel' : '+ Add Team Directly'}
                </button>
              </div>
            )}

            {isOrganizer && showAddTeam && (
              <form onSubmit={handleAddTeam} className="card space-y-3 mb-6 bg-brand-50/30 border-brand-100">
                <h3 className="font-bold text-sm text-gray-900">Add Team</h3>
                <input required placeholder="Team name" value={newTeam.name}
                  onChange={e => setNewTeam({ ...newTeam, name: e.target.value })} className="input" />
                <button type="submit" disabled={addingTeam} className="btn-primary w-full">
                  {addingTeam ? 'Adding...' : 'Confirm Team'}
                </button>
              </form>
            )}

            {isOrganizer && pendingTeams.length > 0 && (
              <div className="mb-8">
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-3">Pending Requests</p>
                <div className="space-y-2">
                  {pendingTeams.map(t => (
                    <div key={t.id} className="card flex items-center justify-between gap-3 bg-red-50/30 border-red-100">
                      <span className="font-bold text-sm text-gray-900">{t.name}</span>
                      <div className="flex gap-2">
                        <button onClick={() => handleTeamStatus(t.id, 'approve')}
                          className="bg-green-600 text-white text-[10px] px-3 py-1.5 rounded-lg font-bold">Approve</button>
                        <button onClick={() => handleTeamStatus(t.id, 'reject')}
                          className="bg-white text-red-600 border border-red-200 text-[10px] px-3 py-1.5 rounded-lg font-bold">Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-gray-400">No messages yet</div>
              ) : (
                messages.map(msg => {
                  const isMe = user && msg.sender_name === user.full_name
                  return (
                    <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 border border-white shadow-sm">
                        {msg.avatar_url ? (
                          <img src={msg.avatar_url} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-[10px] font-bold text-gray-400">
                            {msg.sender_name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <span className="text-[10px] text-gray-400 mb-1 px-1 font-bold uppercase tracking-tight">
                          {isMe ? 'You' : msg.sender_name}
                        </span>
                        <div className={`px-3 py-2 rounded-2xl text-sm shadow-sm ${isMe ? 'bg-brand-600 text-white' : 'bg-white border border-gray-100 text-gray-800'}`}>
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={bottomRef} />
            </div>
            {user ? (
              <form onSubmit={sendMessage} className="p-3 border-t border-gray-100 flex gap-2">
                <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                  placeholder="Type a message..." disabled={sending} className="input flex-1" />
                <button type="submit" disabled={sending || !chatInput.trim()} className="btn-primary px-4">
                  {sending ? '...' : '→'}
                </button>
              </form>
            ) : (
              <div className="p-3 border-t border-gray-100 text-center text-xs text-gray-400">
                Sign in to chat
              </div>
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
              <div className="pt-3 flex flex-wrap gap-2">
                {tournament.is_double_round_robin && (
                  <span className="text-[10px] bg-brand-50 text-brand-600 px-2 py-0.5 rounded font-bold uppercase">Double RR</span>
                )}
                {tournament.penalties_enabled && (
                  <span className="text-[10px] bg-brand-50 text-brand-600 px-2 py-0.5 rounded font-bold uppercase">Penalties</span>
                )}
                {tournament.is_two_legged_knockout && (
                  <span className="text-[10px] bg-brand-50 text-brand-600 px-2 py-0.5 rounded font-bold uppercase">Two-Legged</span>
                )}
              </div>
            </div>

            {seasons.filter(s => s.status === 'completed').length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span>🏆</span> Hall of Fame
                </h3>
                <div className="space-y-3">
                  {seasons.filter(s => s.status === 'completed').map(s => (
                    <div key={s.slug} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-xs font-bold text-brand-600 uppercase tracking-tight">{s.season_name}</p>
                        <p className="text-sm font-medium text-gray-900">{s.winner_name || 'No Winner'}</p>
                      </div>
                      <button onClick={() => navigate(`/t/${s.slug}`)}
                        className="text-[10px] font-bold text-gray-400 hover:text-brand-500 uppercase tracking-widest">
                        View →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Copied!') }}
                  className="btn-secondary text-xs py-1.5 px-3">Copy</button>
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS (Organizer Only) */}
        {tab === 'settings' && isOrganizer && (
          <div className="space-y-4">
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-widest">Tournament Banner</h3>
              <div className="space-y-3">
                {tournament.banner_url ? (
                  <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-200 group">
                    <img src={tournament.banner_url} alt="Banner" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => bannerInputRef.current?.click()}
                        className="bg-white text-gray-900 px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg">
                        Change Image
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => bannerInputRef.current?.click()}
                    className="w-full h-32 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-brand-500 hover:bg-brand-50/30 transition-all">
                    <span className="text-2xl">🖼️</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Upload Banner</span>
                  </button>
                )}
                <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
                <p className="text-[10px] text-gray-400 italic text-center">Recommended 3:1 ratio (1200x400)</p>
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3">Share Link</h3>
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                <span className="text-xs text-gray-400 flex-1 truncate">{window.location.origin}/t/{tournament.slug}</span>
                <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/t/${tournament.slug}`); alert('Copied!') }}
                  className="btn-secondary text-xs py-1.5 px-3">Copy</button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Toasts */}
      <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id}
            className="pointer-events-auto bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-white/10 min-w-[280px]"
            style={{ animation: 'slideIn 0.3s ease-out forwards' }}>
            <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-sm shadow-inner">🔔</div>
            <div className="flex-1">
              <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Notification</p>
              <p className="text-sm font-medium">{t.msg}</p>
            </div>
            <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
              className="text-gray-500 hover:text-white transition-colors">✕</button>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}