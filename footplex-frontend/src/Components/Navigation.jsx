import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Avatar from './Avatar'

const IconMenu = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
    </svg>
)

const IconClose = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
)

const BrowseIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
)

const MyEventsIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
)

const ProfileIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
)

const CreateIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
)

const NotificationsIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
)

const SignOutIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
)

export default function Navigation({ isCollapsed, setIsCollapsed }) {
    const navigate = useNavigate()
    const location = useLocation()
    const { user, logout } = useAuth()
    const [mobileOpen, setMobileOpen] = useState(false)

    if (!user) return null

    const isActive = (path) => location.pathname === path

    const navItems = [
        { path: '/dashboard', label: 'Home', icon: BrowseIcon },
        { path: '/my-events', label: 'My Events', icon: MyEventsIcon },
        { path: '/create', label: 'Editor\'s Picks', icon: CreateIcon }, // Renamed slightly to mirror image feel, revert if needed
        { path: '/profile', label: 'Profile', icon: ProfileIcon },
        { path: '/notifications', label: 'Notifications', icon: NotificationsIcon },
    ]

    return (
        <>
            {/* ─── Mobile Top Bar ─── */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white text-gray-900 flex items-center justify-between px-4 z-40 border-b border-gray-100 shadow-sm">
                <button onClick={() => setMobileOpen(true)} className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
                    <IconMenu />
                </button>
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
                    <span className="font-bold tracking-tight text-xl text-gray-900">FootPlex</span>
                </div>
                <div className="w-8"></div> {/* Spacer for centering */}
            </div>

            {/* ─── Mobile Drawer Overlay ─── */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] lg:hidden transition-opacity"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* ─── Mobile Side Drawer (Left Side) ─── */}
            <div className={`fixed top-0 left-0 w-80 h-full bg-white text-gray-800 z-[70] lg:hidden transform transition-transform duration-300 ease-in-out shadow-2xl ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full overflow-y-auto">

                    {/* Drawer Header - Matches Image exactly */}
                    <div className="p-6 relative">
                        <button
                            onClick={() => setMobileOpen(false)}
                            className="absolute top-6 right-6 p-1 text-gray-500 hover:text-gray-900 transition-colors"
                        >
                            <IconClose />
                        </button>

                        <div className="flex items-center gap-4 mt-6 mb-2">
                            <Avatar
                                src={user.avatar_url}
                                name={user.full_name}
                                size="w-12 h-12"
                            />
                            <div className="flex flex-col">
                                <span className="font-semibold text-gray-900 text-base leading-tight">{user.full_name || 'User'}</span>
                                <span className="text-sm text-gray-400">
                                    {user.email || 'bayer_martin@yahoo.com'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Items */}
                    <nav className="flex-1 px-4 py-2 space-y-1">
                        {navItems.map(item => {
                            const Icon = item.icon
                            return (
                                <button
                                    key={item.path}
                                    onClick={() => { navigate(item.path); setMobileOpen(false); }}
                                    className={`w-full text-left px-4 py-3.5 rounded-lg flex items-center gap-5 transition-colors ${isActive(item.path)
                                        ? 'bg-gray-100 text-gray-900 font-medium'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <Icon />
                                    <span className="text-sm">{item.label}</span>
                                </button>
                            )
                        })}
                    </nav>

                    {/* Footer Actions */}
                    <div className="p-4 mb-4">
                        <button
                            onClick={() => { logout(); setMobileOpen(false); }}
                            className="w-full px-4 py-3.5 rounded-lg flex items-center gap-5 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors text-sm"
                        >
                            <SignOutIcon />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* ─── Desktop Sidebar (Adapted to Light Theme) ─── */}
            <div className={`hidden lg:fixed lg:left-0 lg:top-0 h-screen bg-white text-gray-800 lg:flex lg:flex-col lg:z-40 transition-all duration-300 border-r border-gray-200 ${isCollapsed ? 'w-20' : 'w-64'}`}>

                {/* Logo Area */}
                <div className="p-6 relative z-10 flex items-center min-h-[88px]">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className={`flex items-center gap-3 w-full group ${isCollapsed ? 'justify-center' : ''}`}
                    >
                        <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center text-white font-bold flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                            F
                        </div>
                        {!isCollapsed && (
                            <div className="text-left overflow-hidden">
                                <h1 className="text-lg font-bold text-gray-900 leading-tight">FootPlex</h1>
                            </div>
                        )}
                    </button>

                    {/* Toggle Button */}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white text-gray-500 flex items-center justify-center text-[10px] shadow-sm border border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-all z-20"
                    >
                        {isCollapsed ? '→' : '←'}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto no-scrollbar">
                    {navItems.map(item => {
                        const Icon = item.icon
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`w-full rounded-lg flex items-center gap-4 transition-colors group ${isCollapsed ? 'justify-center p-3' : 'px-4 py-3 text-left'
                                    } ${isActive(item.path)
                                        ? 'bg-gray-100 text-gray-900 font-medium'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                                title={isCollapsed ? item.label : ''}
                            >
                                <Icon />
                                {!isCollapsed && <span className="text-sm truncate">{item.label}</span>}
                            </button>
                        )
                    })}
                </nav>

                {/* Sign Out */}
                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={logout}
                        className={`w-full rounded-lg flex items-center gap-4 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors ${isCollapsed ? 'justify-center p-3' : 'px-4 py-3 text-left'
                            }`}
                        title={isCollapsed ? 'Sign Out' : ''}
                    >
                        <SignOutIcon />
                        {!isCollapsed && <span className="text-sm">Sign Out</span>}
                    </button>
                </div>
            </div>

            {/* Mobile Layout Spacer */}
            <div className="lg:hidden h-16" />
        </>
    )
}