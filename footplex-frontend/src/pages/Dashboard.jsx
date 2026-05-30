import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import TournamentCard from '../components/TournamentCard'


const IconSearch = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
    </svg>
)

const IconTrophy = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v4M8 6h8M8 6s-2 2-2 5 2 5 2 5M16 6s2 2 2 5-2 5-2 5M8 16s2 3 4 3 4-3 4-3M12 19v3" />
    </svg>
)

const IconSparkles = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        <path d="M5 3v4M19 17v4M3 5h4M17 19h4" />
    </svg>
)

const IconSliders = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M9 15h6M15 8h6M3 12h6" />
    </svg>
)

function Hero() {
    return (
        <div className="relative bg-white border-b border-slate-100 overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-rose-100/40 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-orange-100/30 to-transparent rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
            </div>

            <div className="relative max-w-6xl mx-auto px-4 py-10 md:py-14">
                <div className="max-w-xl">
                   
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-[1.1]">
                        Explore <span className="text-[#dc574b]">Tournaments</span>
                    </h1>
                    <p className="mt-3 text-sm md:text-base text-slate-500 leading-relaxed">
                        Browse upcoming competitions, track live scores, and join the action.
                    </p>
                </div>
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════
   SEARCH & FILTER BAR
   ═══════════════════════════════════════════════════════════════ */
const STATUS_OPTIONS = [
    { key: 'all',       label: 'All' },
    { key: 'active',    label: 'Live' },
    { key: 'upcoming',  label: 'Upcoming' },
    { key: 'completed', label: 'Finished' },
]

function SearchFilterBar({ searchQuery, setSearchQuery, statusFilter, setStatusFilter, resultCount }) {
    return (
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100">
            <div className="max-w-6xl mx-auto px-4 py-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search tournaments, organizers..."
                            className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-[#dc574b]/40 focus:ring-2 focus:ring-[#dc574b]/10 transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    {/* Status pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                        {STATUS_OPTIONS.map(opt => (
                            <button
                                key={opt.key}
                                onClick={() => setStatusFilter(opt.key)}
                                className={`px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                                    statusFilter === opt.key
                                        ? 'bg-slate-900 text-white shadow-sm'
                                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 border border-slate-100'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* Result count */}
                    <div className="hidden sm:block text-xs font-semibold text-slate-400 pl-2 shrink-0">
                        {resultCount} found
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════
   SKELETON
   ═══════════════════════════════════════════════════════════════ */
function SkeletonGrid() {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="flex flex-col gap-2.5">
                    <div className="aspect-square w-full rounded-2xl bg-slate-100 animate-pulse border border-slate-50" />
                    <div className="h-4 bg-slate-100 rounded-lg w-3/4 animate-pulse" />
                    <div className="h-3 bg-slate-100 rounded-lg w-1/2 animate-pulse" />
                </div>
            ))}
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════
   EMPTY STATE
   ═══════════════════════════════════════════════════════════════ */
function EmptyState({ searchQuery }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-5">
                <IconTrophy className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
                {searchQuery ? `No results for "${searchQuery}"` : 'No tournaments yet'}
            </h3>
            <p className="text-sm text-slate-400 mt-1.5 text-center max-w-xs">
                {searchQuery
                    ? 'Try adjusting your search or filters.'
                    : 'Check back later for new competitions.'}
            </p>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN DASHBOARD
   ═══════════════════════════════════════════════════════════════ */
export default function Dashboard() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [tournaments, setTournaments] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setLoading(true)
        api.get('/api/tournaments')
            .then((all) => {
                const others = all.data.tournaments.filter(t => t.organizer_id !== user?.id)
                setTournaments(others)
            })
            .catch(err => console.error('Dashboard load error:', err))
            .finally(() => setLoading(false))
    }, [user?.id])

    const filteredTournaments = useMemo(() => {
        return tournaments.filter(t => {
            const q = searchQuery.toLowerCase()
            const matchesSearch = !q ||
                t.name?.toLowerCase().includes(q) ||
                t.organizer_name?.toLowerCase().includes(q) ||
                t.format?.toLowerCase().includes(q)
            const matchesStatus = statusFilter === 'all' || t.status === statusFilter
            return matchesSearch && matchesStatus
        })
    }, [tournaments, searchQuery, statusFilter])

    return (
        <div className="min-h-screen bg-white text-slate-800">
            {/* Hero */}
            <Hero />

            {/* Sticky Search & Filter */}
            <SearchFilterBar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                resultCount={filteredTournaments.length}
            />

            {/* Content */}
            <main className="max-w-6xl mx-auto px-4 py-6 pb-24">
                {loading ? (
                    <SkeletonGrid />
                ) : filteredTournaments.length === 0 ? (
                    <EmptyState searchQuery={searchQuery} />
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
                        {filteredTournaments.map(t => (
                            <TournamentCard
                                key={t.id}
                                t={t}
                                user={user}
                                onClick={() => navigate(`/t/${t.slug}`)}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}