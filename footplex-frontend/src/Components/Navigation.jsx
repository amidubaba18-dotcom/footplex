import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const TrophyIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2v4M8 6h8M8 6s-2 2-2 5 2 5 2 5M16 6s2 2 2 5-2 5-2 5M8 16s2 3 4 3 4-3 4-3M12 19v3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

const ExploreIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5">
        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

const MyEventsIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5">
        <path d="M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

const ProfileIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="7" r="4" />
    </svg>
)

const SignOutIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5">
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

export default function Navigation() {
    const navigate = useNavigate()
    const location = useLocation()
    const { user, logout } = useAuth()

    if (!user) return null

    const isActive = (path) => location.pathname === path

    const navItems = [
        { path: '/dashboard', label: 'Explore', icon: ExploreIcon },
        { path: '/my-events', label: 'My Arena', icon: MyEventsIcon },
        { path: '/profile', label: 'Profile', icon: ProfileIcon },
    ]

    return (
        <>
            {/* ─── Desktop Sidebar ─── */}
            <div className="hidden lg:fixed lg:left-0 lg:top-0 lg:w-64 lg:h-screen lg:bg-[#fefcf2] lg:border-r lg:border-[#e5b186]/30 lg:flex lg:flex-col lg:z-40">
                {/* Logo */}
                <div className="p-6 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#da513f] to-[#c44836] flex items-center justify-center shadow-sm shadow-[#da513f]/20">
                            <TrophyIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <span className="text-lg font-black text-[#5c3d2e] tracking-tight leading-none">FootPlex</span>
                            <p className="text-[10px] text-[#957467] font-bold uppercase tracking-wider mt-0.5">Tournaments</p>
                        </div>
                    </div>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 px-3 space-y-1">
                    {navItems.map(item => {
                        const Icon = item.icon
                        const active = isActive(item.path)
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`
                                    w-full text-left px-4 py-3 rounded-xl flex items-center gap-3.5 transition-all active:scale-[0.98]
                                    ${active
                                        ? 'bg-[#da513f] text-white shadow-md shadow-[#da513f]/20'
                                        : 'text-[#957467] hover:text-[#5c3d2e] hover:bg-[#f5debe]/30'
                                    }
                                `}
                            >
                                <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-[#957467]'}`} />
                                <span className={`text-sm font-bold ${active ? 'tracking-wide' : ''}`}>{item.label}</span>
                                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80" />}
                            </button>
                        )
                    })}
                </nav>

                {/* User & Sign Out */}
                <div className="p-4 space-y-3">
                    <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/60 border border-[#e5b186]/20">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#f5debe] to-[#e5b186]/50 border border-[#e5b186]/30 flex items-center justify-center">
                            <span className="font-black text-[#da513f] text-xs">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-bold text-[#5c3d2e] truncate">{user?.name || 'User'}</p>
                            <p className="text-[10px] text-[#957467] truncate">{user?.email || ''}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#e5b186]/40 text-[10px] font-black uppercase tracking-[0.15em] text-[#957467] hover:bg-[#da513f]/5 hover:text-[#da513f] hover:border-[#da513f]/20 transition-all active:scale-[0.98]"
                    >
                        <SignOutIcon className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </div>

            {/* ─── Mobile Bottom Nav ─── */}
            <div className="fixed lg:hidden bottom-0 left-0 right-0 bg-[#fefcf2]/90 backdrop-blur-xl border-t border-[#e5b186]/30 z-50">
                <div className="max-w-xl mx-auto flex items-center justify-around px-2 py-1">
                    {navItems.map(item => {
                        const Icon = item.icon
                        const active = isActive(item.path)
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`flex flex-col items-center gap-0.5 py-2 px-4 rounded-xl transition-all active:scale-95 ${active ? 'text-[#da513f]' : 'text-[#957467]'}`}
                            >
                                <div className={`relative ${active ? 'scale-110' : ''} transition-transform`}>
                                    <Icon className="w-5 h-5" />
                                    {active && (
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#da513f]" />
                                    )}
                                </div>
                                <span className={`text-[9px] font-bold ${active ? 'text-[#da513f]' : ''}`}>{item.label}</span>
                            </button>
                        )
                    })}
                    <button
                        onClick={logout}
                        className="flex flex-col items-center gap-0.5 py-2 px-4 rounded-xl text-[#957467] active:scale-95 transition-all"
                    >
                        <SignOutIcon className="w-5 h-5" />
                        <span className="text-[9px] font-bold">Exit</span>
                    </button>
                </div>

                {/* Home indicator spacing */}
                <div className="h-1 bg-transparent" />
            </div>
        </>
    )
}