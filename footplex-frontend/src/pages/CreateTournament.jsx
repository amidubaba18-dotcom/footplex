import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import Navigation from '../Components/Navigation'


const BRACKET_FORMATS = new Set([
    'single_elim', 'single_elimination', 'double_elim', 'double_elimination', 'group_knockout'
])

/* ─── Warm Sports Arena SVG Hero ─── */
const StadiumHero = () => (
    <svg viewBox="0 0 800 240" className="absolute inset-0 w-full h-full opacity-50 pointer-events-none" preserveAspectRatio="xMidYMid slice">
        <defs>
            <linearGradient id="arenaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f5debe" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#fefcf2" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="pitchWarm" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#92cfc6" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#92cfc6" stopOpacity="0.05" />
            </linearGradient>
        </defs>

        {/* Arena background */}
        <rect width="100%" height="100%" fill="url(#arenaGrad)" />

        {/* Stadium stands silhouette */}
        <path d="M0 200 Q200 140 400 130 Q600 140 800 200 L800 240 L0 240 Z" fill="#da513f" opacity="0.06" />
        <path d="M0 220 Q200 170 400 160 Q600 170 800 220 L800 240 L0 240 Z" fill="#5c3d2e" opacity="0.04" />

        {/* Floodlight poles */}
        <line x1="120" y1="20" x2="120" y2="140" stroke="#e5b186" strokeWidth="3" opacity="0.3" strokeLinecap="round" />
        <line x1="680" y1="20" x2="680" y2="140" stroke="#e5b186" strokeWidth="3" opacity="0.3" strokeLinecap="round" />

        {/* Floodlight beams */}
        <ellipse cx="120" cy="25" rx="35" ry="12" fill="#fefcf2" opacity="0.15" />
        <ellipse cx="680" cy="25" rx="35" ry="12" fill="#fefcf2" opacity="0.15" />
        <path d="M120 35 L80 180 M120 35 L160 180" stroke="#fefcf2" strokeWidth="40" opacity="0.03" strokeLinecap="round" />
        <path d="M680 35 L640 180 M680 35 L720 180" stroke="#fefcf2" strokeWidth="40" opacity="0.03" strokeLinecap="round" />

        {/* Pitch / Field */}
        <rect x="100" y="155" width="600" height="70" rx="8" fill="url(#pitchWarm)" />
        <rect x="100" y="155" width="600" height="70" rx="8" stroke="#92cfc6" strokeWidth="1.5" fill="none" opacity="0.25" />

        {/* Center line */}
        <line x1="400" y1="155" x2="400" y2="225" stroke="#92cfc6" strokeWidth="1.5" opacity="0.3" strokeDasharray="6 4" />
        <circle cx="400" cy="190" r="18" stroke="#92cfc6" strokeWidth="1.5" fill="none" opacity="0.25" />
        <circle cx="400" cy="190" r="2" fill="#92cfc6" opacity="0.4" />

        {/* Goal areas */}
        <rect x="140" y="170" width="45" height="40" rx="3" stroke="#92cfc6" strokeWidth="1.2" fill="none" opacity="0.2" />
        <rect x="615" y="170" width="45" height="40" rx="3" stroke="#92cfc6" strokeWidth="1.2" fill="none" opacity="0.2" />

        {/* Goal nets */}
        <line x1="140" y1="170" x2="140" y2="210" stroke="#da513f" strokeWidth="2" opacity="0.15" />
        <line x1="660" y1="170" x2="660" y2="210" stroke="#da513f" strokeWidth="2" opacity="0.15" />

        {/* Corner arcs */}
        <path d="M100 165 Q105 165 105 170" stroke="#92cfc6" strokeWidth="1" fill="none" opacity="0.3" />
        <path d="M700 165 Q695 165 695 170" stroke="#92cfc6" strokeWidth="1" fill="none" opacity="0.3" />

        {/* Ball */}
        <circle cx="400" cy="190" r="5" fill="#fefcf2" stroke="#da513f" strokeWidth="1.2" opacity="0.9" />
        <path d="M397.5 187.5 L402.5 187.5 L400 192.5 Z" fill="#da513f" opacity="0.5" />

        {/* Abstract player silhouettes */}
        <g opacity="0.35">
            <circle cx="280" cy="175" r="5" fill="#da513f" />
            <path d="M280 180 L280 200 M280 190 L272 196 M280 190 L288 196 M280 200 L275 212 M280 200 L285 212" stroke="#da513f" strokeWidth="2" strokeLinecap="round" fill="none" />
        </g>
        <g opacity="0.35">
            <circle cx="520" cy="185" r="5" fill="#92cfc6" />
            <path d="M520 190 L520 210 M520 200 L512 206 M520 200 L528 206 M520 210 L515 222 M520 210 L525 222" stroke="#92cfc6" strokeWidth="2" strokeLinecap="round" fill="none" />
        </g>

        {/* eSports / screen element (subtle) */}
        <rect x="360" y="40" width="80" height="50" rx="4" stroke="#e5b186" strokeWidth="1" fill="none" opacity="0.12" />
        <line x1="370" y1="55" x2="430" y2="55" stroke="#e5b186" strokeWidth="1" opacity="0.1" />
        <line x1="370" y1="65" x2="410" y2="65" stroke="#e5b186" strokeWidth="1" opacity="0.1" />
        <line x1="370" y1="75" x2="420" y2="75" stroke="#e5b186" strokeWidth="1" opacity="0.1" />

        {/* Trophy silhouette in distance */}
        <g transform="translate(740, 60)" opacity="0.12">
            <path d="M10 0 L10 8 M6 8 L14 8 M6 8 C6 8 4 10 4 14 C4 18 6 20 6 20 M14 8 C14 8 16 10 16 14 C16 18 14 20 14 20 M6 20 C6 22 8 24 10 24 C12 24 14 22 14 20 M10 24 L10 30" stroke="#da513f" strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>

        {/* Subtle confetti / energy lines */}
        <path d="M200 80 L205 70 M205 70 L210 80" stroke="#e5b186" strokeWidth="1.5" opacity="0.2" strokeLinecap="round" />
        <path d="M600 90 L605 80 M605 80 L610 90" stroke="#e5b186" strokeWidth="1.5" opacity="0.2" strokeLinecap="round" />
        <circle cx="250" cy="100" r="2" fill="#da513f" opacity="0.15" />
        <circle cx="580" cy="110" r="2" fill="#92cfc6" opacity="0.15" />
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

const StepIcon = ({ step, current }) => {
    const isActive = step === current
    const isDone = step < current
    return (
        <div className={`
            w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
            ${isDone ? 'bg-[#da513f] border-[#da513f] text-white' : ''}
            ${isActive ? 'bg-white border-[#da513f] text-[#da513f] shadow-md' : ''}
            ${!isActive && !isDone ? 'bg-[#fefcf2] border-[#e5b186] text-[#957467]' : ''}
        `}>
            {isDone ? '✓' : step}
        </div>
    )
}

const formatCards = {
    round_robin: {
        label: 'Round Robin', icon: (
            <svg viewBox="0 0 48 48" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" /><circle cx="36" cy="12" r="3" /><circle cx="12" cy="36" r="3" />
                <circle cx="36" cy="36" r="3" /><circle cx="24" cy="24" r="3" />
                <path d="M12 12l12 12m12-12L24 24M12 36l12-12m12 12L24 24" opacity="0.4" />
            </svg>
        )
    },
    free_for_all: {
        label: 'Free For All', icon: (
            <svg viewBox="0 0 48 48" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M24 6l4 14h14L32 30l4 14-12-8-12 8 4-14L6 20h14z" />
            </svg>
        )
    },
    single_elim: {
        label: 'Single Elim', icon: (
            <svg viewBox="0 0 48 48" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="6" y="8" width="10" height="6" rx="1" /><rect x="6" y="34" width="10" height="6" rx="1" />
                <rect x="32" y="21" width="10" height="6" rx="1" />
                <path d="M16 11h8v10h8M16 37h8v-10h8" />
            </svg>
        )
    },
    group_knockout: {
        label: 'Group + KO', icon: (
            <svg viewBox="0 0 48 48" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="4" width="14" height="14" rx="2" /><rect x="30" y="4" width="14" height="14" rx="2" />
                <rect x="4" y="30" width="14" height="14" rx="2" /><rect x="30" y="30" width="14" height="14" rx="2" />
                <path d="M22 11h4M22 37h4M18 24h8" />
            </svg>
        )
    },
    swiss: {
        label: 'Swiss', icon: (
            <svg viewBox="0 0 48 48" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 12h32M8 24h32M8 36h32" strokeLinecap="round" />
                <circle cx="16" cy="12" r="2" fill="currentColor" /><circle cx="32" cy="24" r="2" fill="currentColor" />
                <circle cx="20" cy="36" r="2" fill="currentColor" />
            </svg>
        )
    },
    double_elim: {
        label: 'Double Elim', icon: (
            <svg viewBox="0 0 48 48" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 8h10v6H8zM8 34h10v6H8zM30 21h10v6H30z" />
                <path d="M18 11h4v7h8M18 37h4v-7h8M13 14v7h7v4" />
            </svg>
        )
    }
}

export default function CreateTournament() {
    const navigate = useNavigate()
    const [step, setStep] = useState(1)
    const [form, setForm] = useState({
        name: '', tournament_type: 'physical', format: 'round_robin',
        max_teams: '8', group_count: '2', teams_advance: '2',
        description: '', is_two_legged_knockout: false,
        start_date: '', end_date: '', is_double_round_robin: false,
        penalties_enabled: false
    })
    const [loading, setLoading] = useState(false)
    const [bannerFile, setBannerFile] = useState(null)
    const [bannerPreview, setBannerPreview] = useState(null)
    const bannerRef = useRef(null)
    const [error, setError] = useState('')

    function handleChange(e) {
        const { name, value, type, checked } = e.target
        setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
    }

    function handleBannerChange(e) {
        const file = e.target.files[0]
        if (file) {
            setBannerFile(file)
            setBannerPreview(URL.createObjectURL(file))
        }
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setLoading(true); setError('')
        try {
            const res = await api.post('/api/tournaments', {
                ...form,
                max_teams: parseInt(form.max_teams),
                group_count: parseInt(form.group_count || '2'),
                teams_advance_per_group: parseInt(form.teams_advance || '2'),
            })
            const tournamentId = res.data.tournament?.id
            if (tournamentId && bannerFile) {
                const formData = new FormData()
                formData.append('file', bannerFile)
                await api.post(`/api/tournaments/${tournamentId}/banner`, formData, {
                    headers: {
                        'Content-Type': undefined
                    }
                })
            }
            if (tournamentId) navigate(`/t/${res.data.tournament.slug}`)
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create tournament')
            setLoading(false)
        }
    }

    const totalSteps = 3

    return (
        <div className="min-h-screen bg-[#fefcf2] text-[#5c3d2e] relative overflow-hidden">

            {/* ─── Background Texture ─── */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
                style={{ backgroundImage: 'radial-gradient(#da513f 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

            {/* ─── Header ─── */}
            <nav className="sticky top-0 z-50 bg-[#fefcf2]/90 backdrop-blur-md border-b border-[#e5b186]/40">

            </nav>

            {/* ─── Hero (compact on mobile) ─── */}
            <div className="relative bg-gradient-to-b from-[#f5debe]/30 to-[#fefcf2]">
                <div className="max-w-xl mx-auto px-4 pt-6 pb-4 md:pt-10 md:pb-6 relative">
                    <StadiumHero />
                    <div className="lg:hidden absolute left-4 top-6 md:top-10 z-20">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-[#6b6357] hover:text-[#1a1612] hover:bg-[#f5debe]/50 transition-colors bg-white/50 backdrop-blur-sm shadow-sm border border-[#e5b186]/30"
                        >
                            <ArrowLeftIcon className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="relative z-10 text-center">

                        <h1 className="text-2xl md:text-3xl font-black text-[#5c3d2e] tracking-tight leading-tight">
                            Build Your <span className="text-[#da513f]">Tournament</span>
                        </h1>
                        <p className="text-xs md:text-sm text-[#957467] mt-1 max-w-xs mx-auto leading-relaxed">
                            Set up your competition in seconds. Choose format, invite teams, play.
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-xl mx-auto px-4 pb-32 md:pb-12 relative z-10">

                {/* ─── Error ─── */}
                {error && (
                    <div className="mb-4 p-3 bg-[#da513f]/8 border border-[#da513f]/20 text-[#da513f] rounded-xl flex items-center gap-2 text-xs font-medium animate-pulse">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {error}
                    </div>
                )}

                {/* ─── Stepper ─── */}
                <div className="md:mb-8 mb-4">
                    <div className="flex items-center justify-between max-w-xs mx-auto">
                        {[1, 2, 3].map((s, i) => (
                            <div key={s} className="flex items-center flex-1 last:flex-none">
                                <button onClick={() => !loading && setStep(s)} className="focus:outline-none">
                                    <StepIcon step={s} current={step} />
                                </button>
                                {i < 2 && <div className={`h-0.5 flex-1 mx-2 rounded-full transition-colors ${s < step ? 'bg-[#da513f]' : 'bg-[#e5b186]/40'}`} />}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between max-w-xs mx-auto mt-1 px-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${step === 1 ? 'text-[#da513f]' : 'text-[#957467]'}`}>Info</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${step === 2 ? 'text-[#da513f]' : 'text-[#957467]'}`}>Format</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${step === 3 ? 'text-[#da513f]' : 'text-[#957467]'}`}>Schedule</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>

                    {/* ═══════════════════ STEP 1: BASIC INFO ═══════════════════ */}
                    {step === 1 && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">

                            {/* Banner */}
                            <div>
                                <label className="block text-xs font-bold text-[#957467] uppercase tracking-wider mb-2">Banner</label>
                                <div onClick={() => bannerRef.current?.click()}
                                    className={`relative w-full h-36 md:h-44 rounded-2xl border-2 border-dashed cursor-pointer overflow-hidden transition-all
                                    ${bannerPreview ? 'border-[#92cfc6] shadow-md' : 'border-[#e5b186]/60 hover:border-[#da513f]/50 bg-white/50'}`}>
                                    {bannerPreview ? (
                                        <>
                                            <img src={bannerPreview} className="w-full h-full object-cover" alt="" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#5c3d2e]/60 to-transparent" />
                                            <button type="button" onClick={e => { e.stopPropagation(); setBannerFile(null); setBannerPreview(null) }}
                                                className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-lg text-[#da513f] shadow-sm hover:bg-white">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                            <p className="absolute bottom-2 left-3 text-[10px] font-bold text-white/90 truncate max-w-[80%]">{bannerFile?.name}</p>
                                        </>
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                                            <div className="w-10 h-10 rounded-xl bg-[#92cfc6]/15 border border-[#92cfc6]/30 flex items-center justify-center">
                                                <svg className="w-5 h-5 text-[#92cfc6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            </div>
                                            <p className="text-xs font-bold text-[#957467]">Tap to upload banner</p>
                                            <p className="text-[10px] text-[#957467]/60">1200×400 • JPG/PNG</p>
                                        </div>
                                    )}
                                </div>
                                <input type="file" ref={bannerRef} onChange={handleBannerChange} accept="image/*" className="hidden" />
                            </div>

                            {/* Name */}
                            <div>
                                <label className="block text-xs font-bold text-[#957467] uppercase tracking-wider mb-1.5">Tournament Name <span className="text-[#da513f]">*</span></label>
                                <input name="name" required value={form.name} onChange={handleChange}
                                    className="w-full bg-white border border-[#e5b186]/60 rounded-xl px-3.5 py-3 text-[#5c3d2e] placeholder-[#957467]/40 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#da513f]/20 focus:border-[#da513f]/40 transition-all shadow-sm"
                                    placeholder="e.g. Copa Norte 2025" />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-bold text-[#957467] uppercase tracking-wider mb-1.5">Description</label>
                                <textarea name="description" value={form.description} onChange={handleChange} rows={2}
                                    className="w-full bg-white border border-[#e5b186]/60 rounded-xl px-3.5 py-3 text-[#5c3d2e] placeholder-[#957467]/40 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#da513f]/20 focus:border-[#da513f]/40 transition-all resize-none shadow-sm"
                                    placeholder="What's this tournament about?" />
                            </div>
                        </div>
                    )}

                    {/* ═══════════════════ STEP 2: SETTINGS ═══════════════════ */}
                    {step === 2 && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">

                            {/* Type & Teams */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-[#957467] uppercase tracking-wider mb-1.5">Sport</label>
                                    <div className="relative">
                                        <select name="tournament_type" value={form.tournament_type} onChange={handleChange}
                                            className="w-full appearance-none bg-white border border-[#e5b186]/60 rounded-xl px-3 py-2.5 text-sm font-medium text-[#5c3d2e] focus:outline-none focus:ring-2 focus:ring-[#da513f]/20 focus:border-[#da513f]/40 shadow-sm">
                                            <option value="physical">⚽ Football</option>
                                            <option value="efootball">🎮 eFootball</option>
                                            <option value="futsal">🏃 Futsal</option>
                                        </select>
                                        <svg className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[#957467] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#957467] uppercase tracking-wider mb-1.5">Teams</label>
                                    <div className="relative">
                                        <select name="max_teams" value={form.max_teams} onChange={handleChange}
                                            className="w-full appearance-none bg-white border border-[#e5b186]/60 rounded-xl px-3 py-2.5 text-sm font-medium text-[#5c3d2e] focus:outline-none focus:ring-2 focus:ring-[#da513f]/20 focus:border-[#da513f]/40 shadow-sm">
                                            {[4, 8, 16, 32].map(n => <option key={n} value={n}>{n}</option>)}
                                        </select>
                                        <svg className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[#957467] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </div>
                            </div>

                            {/* Format - 2-col grid on mobile, 3-col on desktop */}
                            <div>
                                <label className="block text-xs font-bold text-[#957467] uppercase tracking-wider mb-2">Format</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                                    {Object.entries(formatCards).map(([key, { label, icon }]) => (
                                        <button key={key} type="button" onClick={() => handleChange({ target: { name: 'format', value: key } })}
                                            className={`flex flex-col items-center p-3 rounded-xl border transition-all
                                            ${form.format === key
                                                    ? 'bg-[#da513f]/8 border-[#da513f]/40 text-[#da513f] shadow-sm'
                                                    : 'bg-white border-[#e5b186]/40 text-[#957467] hover:border-[#da513f]/30'}`}>
                                            {icon}
                                            <span className="text-[10px] font-bold mt-1.5 leading-tight text-center">{label}</span>
                                            {form.format === key && <div className="w-1.5 h-1.5 rounded-full bg-[#da513f] mt-1" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Conditional Options - Compact Cards */}
                            {(form.format === 'round_robin' || form.format === 'free_for_all') && (
                                <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#e5b186]/40 shadow-sm cursor-pointer active:scale-[0.98] transition-transform">
                                    <div className="w-8 h-8 rounded-lg bg-[#92cfc6]/15 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-4 h-4 text-[#92cfc6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-[#5c3d2e]">Double Round Robin</p>
                                        <p className="text-[10px] text-[#957467]">Home & Away legs</p>
                                    </div>
                                    <div className="relative inline-flex items-center">
                                        <input type="checkbox" name="is_double_round_robin" checked={form.is_double_round_robin} onChange={handleChange} className="sr-only peer" />
                                        <div className="w-9 h-5 bg-[#e5b186]/40 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#92cfc6] shadow-sm"></div>
                                    </div>
                                </label>
                            )}

                            {BRACKET_FORMATS.has(form.format) && (
                                <div className="space-y-2">
                                    <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#e5b186]/40 shadow-sm cursor-pointer active:scale-[0.98] transition-transform">
                                        <div className="w-8 h-8 rounded-lg bg-[#da513f]/10 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-4 h-4 text-[#da513f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-[#5c3d2e]">Penalty Shootouts</p>
                                            <p className="text-[10px] text-[#957467]">Decide drawn matches</p>
                                        </div>
                                        <div className="relative inline-flex items-center">
                                            <input type="checkbox" name="penalties_enabled" checked={form.penalties_enabled} onChange={handleChange} className="sr-only peer" />
                                            <div className="w-9 h-5 bg-[#e5b186]/40 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#da513f] shadow-sm"></div>
                                        </div>
                                    </label>

                                    <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#e5b186]/40 shadow-sm cursor-pointer active:scale-[0.98] transition-transform">
                                        <div className="w-8 h-8 rounded-lg bg-[#92cfc6]/15 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-4 h-4 text-[#92cfc6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-[#5c3d2e]">Two-Legged Knockout</p>
                                            <p className="text-[10px] text-[#957467]">Home & Away aggregate</p>
                                        </div>
                                        <div className="relative inline-flex items-center">
                                            <input type="checkbox" name="is_two_legged_knockout" checked={form.is_two_legged_knockout} onChange={handleChange} className="sr-only peer" />
                                            <div className="w-9 h-5 bg-[#e5b186]/40 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#92cfc6] shadow-sm"></div>
                                        </div>
                                    </label>
                                </div>
                            )}

                            {form.format === 'group_knockout' && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-[#957467] uppercase tracking-wider mb-1.5">Groups</label>
                                        <div className="relative">
                                            <select name="group_count" value={form.group_count} onChange={handleChange}
                                                className="w-full appearance-none bg-white border border-[#e5b186]/60 rounded-xl px-3 py-2.5 text-sm font-medium text-[#5c3d2e] focus:outline-none focus:ring-2 focus:ring-[#da513f]/20 shadow-sm">
                                                <option value="2">2 (A,B)</option>
                                                <option value="4">4 (A–D)</option>
                                                <option value="8">8 (A–H)</option>
                                            </select>
                                            <svg className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[#957467] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#957467] uppercase tracking-wider mb-1.5">Advance</label>
                                        <div className="relative">
                                            <select name="teams_advance" value={form.teams_advance} onChange={handleChange}
                                                className="w-full appearance-none bg-white border border-[#e5b186]/60 rounded-xl px-3 py-2.5 text-sm font-medium text-[#5c3d2e] focus:outline-none focus:ring-2 focus:ring-[#da513f]/20 shadow-sm">
                                                <option value="1">Top 1</option>
                                                <option value="2">Top 2</option>
                                                <option value="3">Top 3</option>
                                            </select>
                                            <svg className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[#957467] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ═══════════════════ STEP 3: SCHEDULE ═══════════════════ */}
                    {step === 3 && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-[#957467] uppercase tracking-wider mb-1.5">Kickoff</label>
                                    <input type="date" name="start_date" value={form.start_date} onChange={handleChange}
                                        className="w-full bg-white border border-[#e5b186]/60 rounded-xl px-3 py-2.5 text-sm font-medium text-[#5c3d2e] focus:outline-none focus:ring-2 focus:ring-[#da513f]/20 shadow-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#957467] uppercase tracking-wider mb-1.5">Final</label>
                                    <input type="date" name="end_date" value={form.end_date} onChange={handleChange}
                                        className="w-full bg-white border border-[#e5b186]/60 rounded-xl px-3 py-2.5 text-sm font-medium text-[#5c3d2e] focus:outline-none focus:ring-2 focus:ring-[#da513f]/20 shadow-sm" />
                                </div>
                            </div>

                            {/* Summary Card */}
                            <div className="p-4 bg-white rounded-2xl border border-[#e5b186]/40 shadow-sm space-y-2">
                                <h3 className="text-xs font-bold text-[#957467] uppercase tracking-wider mb-2">Summary</h3>
                                <div className="flex justify-between text-xs">
                                    <span className="text-[#957467]">Name</span>
                                    <span className="font-bold text-[#5c3d2e] truncate max-w-[60%] text-right">{form.name || '—'}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-[#957467]">Format</span>
                                    <span className="font-bold text-[#5c3d2e]">{formatCards[form.format]?.label}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-[#957467]">Teams</span>
                                    <span className="font-bold text-[#5c3d2e]">{form.max_teams} teams</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-[#957467]">Type</span>
                                    <span className="font-bold text-[#5c3d2e] capitalize">{form.tournament_type.replace('_', ' ')}</span>
                                </div>
                            </div>
                        </div>
                    )}

                </form>
            </div>

            {/* ─── Sticky Bottom Bar (Mobile) / Inline (Desktop) ─── */}
            <div className="fixed md:relative bottom-0 left-0 right-0 bg-[#fefcf2]/95 md:bg-transparent backdrop-blur-md border-t md:border-0 border-[#e5b186]/30 p-4 z-40">
                <div className="max-w-xl mx-auto flex items-center gap-3">
                    {step > 1 && (
                        <button type="button" onClick={() => setStep(s => s - 1)} disabled={loading}
                            className="flex-shrink-0 px-5 py-3 rounded-xl border border-[#e5b186]/60 text-[#957467] font-bold text-sm hover:bg-white transition-colors">
                            Back
                        </button>
                    )}
                    {step < totalSteps ? (
                        <button type="button" onClick={() => setStep(s => s + 1)}
                            className="flex-1 bg-[#da513f] hover:bg-[#c44836] text-white font-bold text-sm py-3 rounded-xl shadow-lg shadow-[#da513f]/20 active:scale-[0.98] transition-all">
                            Continue
                        </button>
                    ) : (
                        <button type="button" onClick={handleSubmit} disabled={loading || !form.name}
                            className="flex-1 bg-[#da513f] hover:bg-[#c44836] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm py-3 rounded-xl shadow-lg shadow-[#da513f]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <TrophyIcon className="w-4 h-4" />
                                    Create Tournament
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}