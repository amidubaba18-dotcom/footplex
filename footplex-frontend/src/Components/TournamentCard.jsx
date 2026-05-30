import React, { useState } from 'react'
import { CardStadiumBg } from './Backgrounds'
import Avatar from './Avatar'

/* ═══════════════════════════════════════════════════════════════
   ICONS
   ═══════════════════════════════════════════════════════════════ */
const IconImagePlaceholder = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
)

/* ═══════════════════════════════════════════════════════════════
   STATUS BADGE
   ═══════════════════════════════════════════════════════════════ */
function StatusBadge({ status }) {
    const config = {
        active: { bg: 'bg-green-500', label: 'Live' },
        registration: { bg: 'bg-blue-500', label: 'Open' },
        upcoming: { bg: 'bg-orange-500', label: 'Soon' },
        completed: { bg: 'bg-gray-600', label: 'Done' },
        draft: { bg: 'bg-gray-400', label: 'Draft' },
        cancelled: { bg: 'bg-red-500', label: 'Canceled' },
    }
    const s = config[status] || config.draft

    return (
        <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-white shadow-sm z-10 ${s.bg}`}>
            {s.label}
        </span>
    )
}

/* ═══════════════════════════════════════════════════════════════
   BANNER RESOLVER
   ═══════════════════════════════════════════════════════════════ */
function getBannerUrl(t) {
    return t.banner_url || t.banner || t.cover_image || t.image_url || t.cover_url || t.photo_url || null
}

/* ═══════════════════════════════════════════════════════════════
   MAIN CARD
   ═══════════════════════════════════════════════════════════════ */
export default function TournamentCard({ t, user, onClick }) {
    const [imageError, setImageError] = useState(false)

    const bannerUrl = getBannerUrl(t)
    const isOwner = t.organizer_id === user?.id

    // Determine if we should show the fallback UI
    const showFallback = !bannerUrl || imageError

    return (
        <button
            onClick={onClick}
            className="group text-left w-full flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
        >
            {/* ═══ Top Image Container ═══ */}
            <div className="relative w-full aspect-[4/3] bg-gray-50 border-b border-gray-100 overflow-hidden">
                {!showFallback && (
                    <img
                        src={bannerUrl}
                        alt={t.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        onError={() => setImageError(true)}
                    />
                )}

                {/* Fallback placeholder (shown if no image or on error) */}
                {showFallback && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50">
                        <CardStadiumBg type={t.tournament_type} />
                        <IconImagePlaceholder className="w-10 h-10 mb-2 text-gray-300 relative z-10" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 relative z-10">
                            {t.tournament_type || 'Tournament'}
                        </span>
                    </div>
                )}

                {/* Status Badge overlay */}
                <StatusBadge status={t.status} />

                {/* Subtle Image Gradient for depth */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* ═══ Bottom Content Container ═══ */}
            <div className="p-4 flex flex-col w-full">
                <h3 className="font-semibold text-sm text-gray-900 leading-snug group-hover:text-gray-600 transition-colors line-clamp-2">
                    {t.name}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                    <Avatar
                        src={t.organizer_avatar}
                        name={t.organizer_name}
                        size="w-5 h-5"
                        text_size="text-[10px]"
                    />
                    {t.organizer_name && (
                        <p className="text-xs text-gray-500 truncate font-medium">
                            {t.organizer_name}
                        </p>
                    )}
                </div>
            </div>
        </button>
    )
}