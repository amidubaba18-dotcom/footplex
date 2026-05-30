import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import TournamentCard from '../Components/TournamentCard'

/* ─── Warm Sports Arena SVG Background ─── */
const ArenaBackground = () => (
    <svg viewBox="0 0 800 200" className="absolute inset-0 w-full h-full opacity-40 pointer-events-none" preserveAspectRatio="xMidYMid slice">
        <defs>
            <linearGradient id="myArenaSky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f5debe" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#fefcf2" stopOpacity="0" />
            </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#myArenaSky)" />
        <path d="M0 160 Q200 110 400 100 Q600 110 800 160 L800 200 L0 200 Z" fill="#da513f" opacity="0.06" />
        <path d="M0 175 Q200 135 400 125 Q600 135 800 175 L800 200 L0 200 Z" fill="#5c3d2e" opacity="0.04" />
        <line x1="100" y1="20" x2="100" y2="110" stroke="#e5b186" strokeWidth="2.5" opacity="0.25" strokeLinecap="round" />
        <line x1="700" y1="20" x2="700" y2="110" stroke="#e5b186" strokeWidth="2.5" opacity="0.25" strokeLinecap="round" />
        <ellipse cx="100" cy="22" rx="30" ry="10" fill="#fefcf2" opacity="0.12" />
        <ellipse cx="700" cy="22" rx="30" ry="10" fill="#fefcf2" opacity="0.12" />
        <rect x="120" y="125" width="560" height="55" rx="6" fill="#92cfc6" opacity="0.08" />
        <rect x="120" y="125" width="560" height="55" rx="6" stroke="#92cfc6" strokeWidth="1" fill="none" opacity="0.2" />
        <line x1="400" y1="125" x2="400" y2="180" stroke="#92cfc6" strokeWidth="1" opacity="0.25" strokeDasharray="5 4" />
        <circle cx="400" cy="152" r="14" stroke="#92cfc6" strokeWidth="1" fill="none" opacity="0.2" />
        <rect x="155" y="138" width="35" height="30" rx="2" stroke="#92cfc6" strokeWidth="1" fill="none" opacity="0.15" />
        <rect x="610" y="138" width="35" height="30" rx="2" stroke="#92cfc6" strokeWidth="1" fill="none" opacity="0.15" />
        <circle cx="400" cy="152" r="4" fill="#fefcf2" stroke="#da513f" strokeWidth="1" opacity="0.8" />
        <g opacity="0.3">
            <circle cx="300" cy="142" r="4" fill="#da513f" />
            <path d="M300 146 L300 162 M300 154 L294 158 M300 154 L306 158 M300 162 L296 170 M300 162 L304 170" stroke="#da513f" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </g>
        <g opacity="0.3">
            <circle cx="500" cy="148" r="4" fill="#92cfc6" />
            <path d="M500 152 L500 168 M500 160 L494 164 M500 160 L506 164 M500 168 L496 176 M500 168 L504 176" stroke="#92cfc6" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </g>
        <circle cx="220" cy="80" r="1.5" fill="#da513f" opacity="0.15" />
        <circle cx="580" cy="90" r="1.5" fill="#92cfc6" opacity="0.15" />
        <circle cx="350" cy="70" r="1" fill="#e5b186" opacity="0.2" />
    </svg>
)

const ArrowLeftIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m15 18-6-6 6-6" />
    </svg>
)

const TrophyIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2v4M8 6h8M8 6s-2 2-2 5 2 5 2 5M16 6s2 2 2 5-2 5-2 5M8 16s2 3 4 3 4-3 4-3M12 19v3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

export default function MyEvents() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [tournaments, setTournaments] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const fetchTournaments = async () => {
            try {
                setLoading(true)
                const res = await api.get('/api/tournaments/my')
                setTournaments(res?.data?.tournaments || [])
            } catch (err) {
                console.error(err)
                setError(err?.response?.data?.message || 'Failed to load tournaments')
            } finally {
                setLoading(false)
            }
        }
        fetchTournaments()
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen bg-[#fefcf2] flex items-center justify-center">
                <svg className="animate-spin h-6 w-6 text-[#da513f]" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#fefcf2] px-4 py-8">
                <div className="max-w-xl mx-auto">
                    <div className="bg-[#da513f]/8 border border-[#da513f]/20 text-[#da513f] rounded-xl p-4 flex items-center gap-2 text-sm font-medium">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {error}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#fefcf2] text-[#5c3d2e] relative overflow-hidden">

            {/* Background texture */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.025]"
                style={{ backgroundImage: 'radial-gradient(#da513f 1px, transparent 1px)', backgroundSize: '24px 24px' }} />



            {/* ─── Hero ─── */}
            <div className="relative bg-gradient-to-b from-[#f5debe]/25 to-[#fefcf2]">
                <div className="max-w-6xl mx-auto px-4 pt-6 pb-3 relative">
                    <ArenaBackground />
                    <div className="relative z-10 flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate(-1)}
                                className="lg:hidden flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-[#6b6357] hover:text-[#1a1612] hover:bg-[#f5debe]/50 transition-colors bg-white/50 backdrop-blur-sm shadow-sm border border-[#e5b186]/30"
                            >
                                <ArrowLeftIcon className="w-5 h-5" />
                            </button>
                            <div className="w-10 h-0.5 bg-[#da513f] rounded-full" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black text-[#5c3d2e] tracking-tight leading-tight">
                            My <span className="text-[#da513f]">Tournaments</span>
                        </h1>
                        <p className="text-xs md:text-sm text-[#957467] mt-1 max-w-xs leading-relaxed">
                            {user?.name ? `${user.name}'s organized competitions` : "Tournaments you've organized"}
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 pb-24 md:pb-12 relative z-10">

                {tournaments.length === 0 ? (
                    <div className="text-center py-14 bg-white/60 rounded-2xl border border-dashed border-[#e5b186]/40 mt-4">
                        <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-[#e5b186]/15 flex items-center justify-center">
                            <TrophyIcon className="w-7 h-7 text-[#e5b186]" />
                        </div>
                        <p className="font-bold text-[#5c3d2e] text-sm">No tournaments yet</p>
                        <p className="text-xs text-[#957467] mt-1 mb-4">Create your first competition and start the game</p>
                        <button onClick={() => navigate('/create')}
                            className="px-5 py-2.5 bg-[#da513f] hover:bg-[#c44836] text-white text-xs font-bold rounded-xl shadow-sm shadow-[#da513f]/20 active:scale-95 transition-all">
                            Create Your First Tournament
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mt-4">
                        {tournaments.map((t) => (
                            <TournamentCard key={t.id} t={t} user={user} onClick={() => navigate(`/t/${t.slug}`)} />
                        ))}
                    </div>
                )}
            </div>


        </div>
    )
}