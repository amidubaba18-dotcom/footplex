import { useNavigate } from 'react-router-dom'

const ArrowLeftIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m15 18-6-6 6-6" />
    </svg>
)

export default function Notifications() {
    const navigate = useNavigate()
    return (
        <div className="max-w-4xl mx-auto px-6 py-8">
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
                <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                <p className="text-gray-500 text-sm mt-1">Stay updated on tournament activities</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="text-5xl mb-3">🔔</div>
                <p className="text-gray-500">No notifications yet</p>
                <p className="text-sm text-gray-400 mt-1">You'll be notified when tournaments start and scores are submitted</p>
            </div>
        </div>
    )
}