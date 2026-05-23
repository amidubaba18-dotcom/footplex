import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'

/* ─── Warm Sports Arena SVG Background ─── */
const ArenaBackground = () => (
    <svg viewBox="0 0 800 200" className="absolute inset-0 w-full h-full opacity-40 pointer-events-none" preserveAspectRatio="xMidYMid slice">
        <defs>
            <linearGradient id="arenaSky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f5debe" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#fefcf2" stopOpacity="0" />
            </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#arenaSky)" />
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

/* ─── Card Background SVGs ─── */
const CardStadiumBg = ({ type }) => {
    const isEfootball = type === 'efootball'
    return (
        <svg viewBox="0 0 300 120" className="absolute inset-0 w-full h-full opacity-[0.08] pointer-events-none" preserveAspectRatio="xMidYMid slice">
            <defs>
                <linearGradient id={`cardGrad-${type}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isEfootball ? "#5c3d2e" : "#da513f"} stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#fefcf2" stopOpacity="0" />
                </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill={`url(#cardGrad-${type})`} />
            {/* Stadium roof */}
            <path d="M0 40 Q75 15 150 20 Q225 15 300 40 L300 120 L0 120 Z" fill="#da513f" opacity="0.06" />
            {/* Pitch lines */}
            <line x1="150" y1="50" x2="150" y2="110" stroke="#92cfc6" strokeWidth="1.5" opacity="0.2" strokeDasharray="4 3" />
            <circle cx="150" cy="80" r="12" stroke="#92cfc6" strokeWidth="1" fill="none" opacity="0.15" />
            <rect x="40" y="65" width="25" height="30" rx="2" stroke="#92cfc6" strokeWidth="0.8" fill="none" opacity="0.12" />
            <rect x="235" y="65" width="25" height="30" rx="2" stroke="#92cfc6" strokeWidth="0.8" fill="none" opacity="0.12" />
            {/* Ball */}
            <circle cx="150" cy="80" r="3" fill="#da513f" opacity="0.3" />
            {/* Player dots */}
            <circle cx="100" cy="75" r="2" fill="#da513f" opacity="0.2" />
            <circle cx="200" cy="85" r="2" fill="#92cfc6" opacity="0.2" />
            {/* eSports screen overlay */}
            {isEfootball && (
                <rect x="110" y="25" width="80" height="35" rx="3" stroke="#e5b186" strokeWidth="0.8" fill="none" opacity="0.15" />
            )}
        </svg>
    )
}

const TrophyIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2v4M8 6h8M8 6s-2 2-2 5 2 5 2 5M16 6s2 2 2 5-2 5-2 5M8 16s2 3 4 3 4-3 4-3M12 19v3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

const SearchIcon = () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
)

const statusConfig = {
    registration: { bg: 'bg-[#92cfc6]/20', text: 'text-[#5c8d85]', border: 'border-[#92cfc6]/40', label: 'Open' },
    active: { bg: 'bg-[#da513f]/15', text: 'text-[#da513f]', border: 'border-[#da513f]/30', label: 'Live' },
    completed: { bg: 'bg-[#957467]/15', text: 'text-[#957467]', border: 'border-[#957467]/25', label: 'Done' },
    draft: { bg: 'bg-[#e5b186]/20', text: 'text-[#b8956a]', border: 'border-[#e5b186]/35', label: 'Draft' },
}

const formatLabels = {
    round_robin: 'Round Robin',
    free_for_all: 'Free For All',
    single_elim: 'Single Elim',
    single_elimination: 'Single Elim',
    double_elim: 'Double Elim',
    double_elimination: 'Double Elim',
    group_knockout: 'Group + KO',
    swiss: 'Swiss'
}

const typeEmoji = {
    physical: '⚽',
    efootball: '🎮',
    futsal: '🏃'
}

export default function Dashboard() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [tournaments, setTournaments] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setLoading(true)
        api.get('/api/tournaments').then((all) => {
            const others = all.data.tournaments.filter(t => t.organizer_id !== user?.id)
            setTournaments(others)
        })
            .catch(err => console.error('Dashboard load error:', err))
            .finally(() => setLoading(false))
    }, [user?.id])

    const filteredTournaments = tournaments.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.organizer_name?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === 'all' || t.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const statusFilters = [
        { key: 'all', label: 'All' },
        { key: 'registration', label: 'Open' },
        { key: 'active', label: 'Live' },
        { key: 'completed', label: 'Done' },
    ]

    return (
        <div className="min-h-screen bg-[#fefcf2] text-[#5c3d2e] relative overflow-hidden">

            {/* Background texture */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.025]"
                style={{ backgroundImage: 'radial-gradient(#da513f 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

            {/* ─── Header ─── */}
            <nav className="sticky top-0 z-50 bg-[#fefcf2]/90 backdrop-blur-md border-b border-[#e5b186]/30">
                <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#da513f]/10 border border-[#da513f]/20 flex items-center justify-center">
                            <TrophyIcon className="w-4 h-4 text-[#da513f]" />
                        </div>
                        <span className="font-black text-[#5c3d2e] text-sm tracking-tight">FootPlex</span>
                    </div>
                    <button onClick={() => navigate('/create')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#da513f] hover:bg-[#c44836] text-white text-xs font-bold rounded-lg shadow-sm shadow-[#da513f]/20 active:scale-95 transition-all">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                        New
                    </button>
                </div>
            </nav>

            {/* ─── Hero ─── */}
            <div className="relative bg-gradient-to-b from-[#f5debe]/25 to-[#fefcf2]">
                <div className="max-w-6xl mx-auto px-4 pt-6 pb-3 relative">
                    <ArenaBackground />
                    <div className="relative z-10">
                        <h1 className="text-2xl md:text-3xl font-black text-[#5c3d2e] tracking-tight leading-tight">
                            Explore <span className="text-[#da513f]">Tournaments</span>
                        </h1>
                        <p className="text-xs md:text-sm text-[#957467] mt-1 max-w-xs leading-relaxed">
                            Discover and join the latest competitions
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 pb-24 md:pb-12 relative z-10 space-y-4">

                {/* ─── Search & Filter ─── */}
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1 md:max-w-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#957467]">
                            <SearchIcon />
                        </div>
                        <input
                            type="text"
                            placeholder="Search tournaments..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-[#e5b186]/50 rounded-xl pl-9 pr-3 py-2.5 text-sm font-medium text-[#5c3d2e] placeholder-[#957467]/50 focus:outline-none focus:ring-2 focus:ring-[#da513f]/15 focus:border-[#da513f]/30 shadow-sm transition-all"
                        />
                    </div>
                    {/* Status Pills - horizontal scroll mobile, inline desktop */}
                    <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide snap-x md:snap-none">
                        {statusFilters.map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => setStatusFilter(key)}
                                className={`
                                    flex-shrink-0 snap-start px-3.5 py-2 rounded-full text-xs font-bold border transition-all active:scale-95
                                    ${statusFilter === key
                                        ? 'bg-[#da513f] border-[#da513f] text-white shadow-sm shadow-[#da513f]/20'
                                        : 'bg-white border-[#e5b186]/50 text-[#957467] hover:border-[#da513f]/30'}
                                `}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ─── Tournament Grid: 2-col mobile, 4-col desktop ─── */}
                <div>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <svg className="animate-spin h-5 w-5 text-[#da513f]" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        </div>
                    ) : filteredTournaments.length === 0 ? (
                        <div className="text-center py-14 bg-white/60 rounded-2xl border border-dashed border-[#e5b186]/40">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[#e5b186]/15 flex items-center justify-center">
                                <TrophyIcon className="w-6 h-6 text-[#e5b186]" />
                            </div>
                            <p className="font-bold text-[#5c3d2e] text-sm">
                                {searchQuery ? `No results for "${searchQuery}"` : 'No tournaments yet'}
                            </p>
                            <p className="text-xs text-[#957467] mt-1">
                                {searchQuery ? 'Try a different search' : 'Check back later or create your own'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                            {filteredTournaments.map(t => (
                                <TournamentCard key={t.id} t={t} user={user} onClick={() => navigate(`/t/${t.slug}`)} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

        </div>
    )
}

function TournamentCard({ t, user, onClick }) {
    const status = statusConfig[t.status] || statusConfig.draft
    const formatLabel = formatLabels[t.format] || t.format.replace(/_/g, ' ')
    const emoji = typeEmoji[t.tournament_type] || '⚽'

    return (
        <div
            onClick={onClick}
            className="group relative bg-white rounded-2xl border border-[#e5b186]/25 shadow-sm hover:shadow-lg hover:shadow-[#da513f]/5 hover:border-[#da513f]/20 active:scale-[0.98] transition-all cursor-pointer overflow-hidden flex flex-col"
        >
            {/* Sports Image Background */}
            <div className="relative h-24 md:h-28 overflow-hidden bg-gradient-to-b from-[#f5debe]/20 to-[#fefcf2]">
                <CardStadiumBg type={t.tournament_type} />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />

                {/* Top row: Type emoji + Status */}
                <div className="absolute top-2 left-2 right-2 flex items-start justify-between z-10">
                    <span className="text-lg md:text-xl drop-shadow-sm">{emoji}</span>
                    <span className={`text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded-full border backdrop-blur-sm ${status.bg} ${status.text} ${status.border}`}>
                        {status.label}
                    </span>
                </div>

                {/* Initial watermark */}
                <div className="absolute bottom-1 right-2 text-4xl md:text-5xl font-black text-[#da513f]/[0.04] leading-none select-none">
                    {t.name.charAt(0).toUpperCase()}
                </div>
            </div>

            {/* Content */}
            <div className="p-2.5 md:p-3 flex-1 flex flex-col">
                <h3 className="font-bold text-[#5c3d2e] text-xs md:text-sm leading-tight line-clamp-2 group-hover:text-[#da513f] transition-colors mb-1">
                    {t.name}
                </h3>

                <p className="text-[10px] md:text-xs text-[#957467] truncate mb-2">
                    {t.organizer_name}
                </p>

                {/* Meta tags */}
                <div className="mt-auto flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-0.5 text-[9px] md:text-[10px] font-bold text-[#957467] bg-[#fefcf2] px-1.5 py-0.5 rounded-md border border-[#e5b186]/20">
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        {t.max_teams}
                    </span>
                    <span className="text-[9px] md:text-[10px] font-bold text-[#957467] bg-[#fefcf2] px-1.5 py-0.5 rounded-md border border-[#e5b186]/20 truncate max-w-[80px] md:max-w-none">
                        {formatLabel}
                    </span>
                </div>

                {/* Action strip */}
                <div className="mt-2 pt-2 border-t border-[#e5b186]/10 flex items-center justify-between">
                    <span className="text-[9px] font-bold text-[#957467] uppercase tracking-wider">
                        {t.tournament_type === 'efootball' ? 'eFootball' : t.tournament_type === 'futsal' ? 'Futsal' : 'Football'}
                    </span>
                    <span className="text-[10px] md:text-xs font-bold text-[#da513f] flex items-center gap-0.5 group-hover:gap-1 transition-all">
                        {t.organizer_id === user?.id ? 'Manage' : 'View'}
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    </span>
                </div>
            </div>
        </div>
    )
}