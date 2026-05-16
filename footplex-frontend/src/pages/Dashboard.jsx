import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'

export default function Dashboard() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [section, setSection] = useState('browse')
    const [tournaments, setTournaments] = useState([])
    const [myTournaments, setMyTournaments] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setLoading(true)
        Promise.all([
            api.get('/api/tournaments'),
            api.get('/api/tournaments/my')
        ]).then(([all, mine]) => {
            const others = all.data.tournaments.filter(t => t.organizer_id !== user?.id)
            setTournaments(others)
            setMyTournaments(mine.data.tournaments)
        })
            .catch(err => console.error('Dashboard load error:', err))
            .finally(() => setLoading(false))
    }, [user?.id])

    return (
        <div className="min-h-screen bg-gray-50">

            {/* Top nav */}
            <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-xl">⚽</span>
                    <span className="font-bold text-gray-900">FootPlex</span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/create')}
                        className="btn-primary"
                    >
                        + Create Tournament
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center text-sm font-bold">
                            {user?.full_name?.charAt(0)?.toUpperCase()}
                        </div>
                        <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700">
                            Sign out
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto px-6 py-8">

                {/* Welcome */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Welcome back, {user?.full_name?.split(' ')[0]} 👋
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Manage your tournaments or browse open ones to join
                    </p>
                </div>

                {/* Section tabs */}
                <div className="flex gap-1 mb-6 bg-white border border-gray-200 rounded-lg p-1 w-fit">
                    {[
                        { key: 'browse', label: 'Browse' },
                        { key: 'mine', label: 'My Tournaments' },
                    ].map(s => (
                        <button
                            key={s.key}
                            onClick={() => setSection(s.key)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${section === s.key
                                ? 'bg-gray-900 text-white'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            {s.label}
                            {s.key === 'mine' && myTournaments.length > 0 && (
                                <span className="ml-2 bg-brand-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                                    {myTournaments.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Browse section */}
                {section === 'browse' && (
                    <div>
                        {loading ? (
                            <div className="text-sm text-gray-400">Loading tournaments...</div>
                        ) : tournaments.length === 0 ? (
                            <div className="card text-center py-16">
                                <div className="text-4xl mb-3">🏆</div>
                                <p className="font-medium text-gray-700">No open tournaments yet</p>
                                <p className="text-sm text-gray-400 mt-1">Check back later or create your own</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {tournaments.map(t => (
                                    <TournamentCard key={t.id} t={t} onClick={() => navigate(`/t/${t.slug}`)} />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* My tournaments section */}
                {section === 'mine' && (
                    <div>
                        {loading ? (
                            <div className="text-sm text-gray-400">Loading your tournaments...</div>
                        ) : myTournaments.length === 0 ? (
                            <div className="card text-center py-16">
                                <div className="text-4xl mb-3">📋</div>
                                <p className="font-medium text-gray-700">No tournaments created yet</p>
                                <button onClick={() => navigate('/create')} className="btn-primary mt-4">
                                    Create your first tournament
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {myTournaments.map(t => (
                                    <div key={t.id} className="card flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-gray-700">
                                                {t.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                                                <p className="text-xs text-gray-500 capitalize mt-0.5">
                                                    {t.tournament_type} · {t.format.replace(/_/g, ' ')} · {t.status}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => navigate(`/t/${t.slug}`)} className="btn-secondary text-xs py-1.5 px-3">
                                                View
                                            </button>
                                            <button onClick={() => navigate(`/manage/${t.id}`)} className="btn-primary text-xs py-1.5 px-3">
                                                Manage
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    )
}

function TournamentCard({ t, onClick }) {
    const statusColor = {
        registration: 'bg-green-100 text-green-700',
        active: 'bg-blue-100 text-blue-700',
        completed: 'bg-gray-100 text-gray-600',
        draft: 'bg-yellow-100 text-yellow-700',
    }

    return (
        <div
            onClick={onClick}
            className="card cursor-pointer hover:border-gray-300 hover:shadow-md transition-all group"
        >
            <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center font-bold text-brand-500">
                    {t.name.charAt(0).toUpperCase()}
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColor[t.status] || 'bg-gray-100 text-gray-600'}`}>
                    {t.status}
                </span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-brand-500 transition-colors">
                {t.name}
            </h3>
            <p className="text-xs text-gray-500 capitalize">
                {t.tournament_type} · {t.format.replace(/_/g, ' ')}
            </p>
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">{t.organizer_name}</span>
                <span className="text-xs font-medium text-brand-500">View →</span>
            </div>
        </div>
    )
}