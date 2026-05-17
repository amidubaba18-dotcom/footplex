export default function Notifications() {
    return (
        <div className="max-w-4xl mx-auto px-6 py-8">
            <div className="mb-8">
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