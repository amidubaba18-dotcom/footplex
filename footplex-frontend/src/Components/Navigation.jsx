import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const BrowseIcon = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
    </svg>
)

const MyEventsIcon = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />
    </svg>
)

const ProfileIcon = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
)

const NotificationsIcon = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V2h-3v2.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
    </svg>
)

const SignOutIcon = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
    </svg>
)

export default function Navigation() {
    const navigate = useNavigate()
    const location = useLocation()
    const { user, logout } = useAuth()

    if (!user) return null

    const isActive = (path) => location.pathname === path

    const desktopNav = [
        { path: '/dashboard', label: 'Browse', icon: BrowseIcon },
        { path: '/my-events', label: 'My Events', icon: MyEventsIcon },
        { path: '/profile', label: 'Profile', icon: ProfileIcon },
        { path: '/notifications', label: 'Notifications', icon: NotificationsIcon },
    ]

    const mobileNav = [
        { path: '/dashboard', label: 'Browse', icon: BrowseIcon },
        { path: '/my-events', label: 'My Events', icon: MyEventsIcon },
        { path: '/profile', label: 'Profile', icon: ProfileIcon },
    ]

    return (
        <>
            {/* Desktop Sidebar */}
            <div className="hidden lg:fixed lg:left-0 lg:top-0 lg:w-64 lg:h-screen lg:bg-gray-900 lg:text-white lg:flex lg:flex-col lg:z-40">

                {/* Logo */}
                <div className="p-6 border-b border-gray-800">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                        <div className="w-10 h-10 rounded-lg bg-brand-500 flex items-center justify-center text-xl font-bold">
                            ⚽
                        </div>
                        <div>
                            <h1 className="text-lg font-bold">FootPlex</h1>
                            <p className="text-xs text-gray-400">Tournament Manager</p>
                        </div>
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2">
                    {desktopNav.map(item => {
                        const Icon = item.icon
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${isActive(item.path)
                                    ? 'bg-brand-500 text-white'
                                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                                    }`}
                            >
                                <Icon />
                                <span className="font-medium">{item.label}</span>
                            </button>
                        )
                    })}
                </nav>

                {/* Divider */}
                <div className="px-4 py-3 border-t border-gray-800"></div>

                {/* Sign Out */}
                <div className="p-4 space-y-2">
                    <button
                        onClick={logout}
                        className="w-full px-4 py-3 rounded-lg flex items-center gap-3 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                    >
                        <SignOutIcon />
                        <span className="font-medium">Sign Out</span>
                    </button>
                </div>
            </div>

            {/* Mobile Bottom Nav */}
            <div className="fixed lg:hidden bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
                <div className="flex items-center justify-around">
                    {mobileNav.map(item => {
                        const Icon = item.icon
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`flex-1 py-4 flex flex-col items-center gap-1 transition-colors ${isActive(item.path)
                                    ? 'text-brand-500'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <Icon />
                                <span className="text-xs font-medium">{item.label}</span>
                            </button>
                        )
                    })}

                    {/* Sign Out Mobile */}
                    <button
                        onClick={logout}
                        className="flex-1 py-4 flex flex-col items-center gap-1 text-gray-600 hover:text-red-600 transition-colors"
                    >
                        <SignOutIcon />
                        <span className="text-xs font-medium">Exit</span>
                    </button>
                </div>
            </div>
        </>
    )
}