import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'

export default function MyEvents() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [tournaments, setTournaments] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.get('/api/tournaments/my')
            .then(res => setTournaments(res.data.tournaments))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    if (loading) return <div className="p-8">Loading...</div>

    return (
        <div className="max-w-6xl mx-auto px-6 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">My Tournaments</h1>
                <p className="text-gray-500 text-sm mt-1">Tournaments you've organized</p>
            </div>

            {tournaments.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <div className="text-5xl mb-3">📋</div>
                    <p className="font-medium text-gray-700">No tournaments yet</p>
                    <button
                        onClick={() => navigate('/create')}
                        className="btn-primary mt-4"
                    >
                        Create Your First Tournament
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tournaments.map(t => (
                        <div
                            key={t.id}
                            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                            onClick={() => navigate(`/manage/${t.id}`)}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-12 h-12 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center font-bold text-brand-500">
                                    {t.name.charAt(0).toUpperCase()}
                                </div>
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${t.status === 'active' ? 'bg-green-100 text-green-700' :
                                        t.status === 'registration' ? 'bg-blue-100 text-blue-700' :
                                            'bg-gray-100 text-gray-600'
                                    }`}>
                                    {t.status}
                                </span>
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-1">{t.name}</h3>
                            <p className="text-xs text-gray-500 capitalize mb-3">
                                {t.tournament_type} · {t.format.replace(/_/g, ' ')}
                            </p>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    navigate(`/manage/${t.id}`)
                                }}
                                className="w-full btn-primary text-sm py-2"
                            >
                                Manage →
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}