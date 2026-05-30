import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const ArrowLeftIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m15 18-6-6 6-6" />
    </svg>
)

export default function Settings() {
    const navigate = useNavigate()
    const [notifications, setNotifications] = useState(true)
    const [darkMode, setDarkMode] = useState(false)

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-2xl mx-auto px-6 py-8">
                <div className="mb-8 space-y-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="lg:hidden flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-colors bg-white shadow-sm border border-gray-200"
                        >
                            <ArrowLeftIcon className="w-5 h-5" />
                        </button>
                        <div className="w-10 h-0.5 bg-gray-300 rounded-full" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Settings</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage your app experience</p>
                </div>

                <div className="space-y-4">
                    <div className="card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-gray-900">Email Notifications</p>
                                <p className="text-xs text-gray-400">Receive updates about tournament results</p>
                            </div>
                            <button
                                onClick={() => setNotifications(!notifications)}
                                className={`w-12 h-6 rounded-full transition-colors relative ${notifications ? 'bg-brand-500' : 'bg-gray-200'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notifications ? 'right-1' : 'left-1'}`} />
                            </button>
                        </div>
                    </div>

                    <div className="card opacity-50 cursor-not-allowed">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-gray-900">Dark Mode</p>
                                <p className="text-xs text-gray-400">Coming soon in future updates</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}