import { useState } from 'react'

export default function Settings() {
    const [notifications, setNotifications] = useState(true)
    const [darkMode, setDarkMode] = useState(false)

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-2xl mx-auto px-6 py-8">
                <div className="mb-8">
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