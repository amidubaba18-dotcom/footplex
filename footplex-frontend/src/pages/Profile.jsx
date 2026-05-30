import { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import Avatar from '../Components/Avatar'



/* ─── Dynamic Arena SVG Background ─── */
const ProfileArenaBg = () => (
    <svg viewBox="0 0 800 300" className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" preserveAspectRatio="xMidYMid slice">
        <defs>
            <radialGradient id="spotlight" cx="50%" cy="0%" r="80%">
                <stop offset="0%" stopColor="#da513f" stopOpacity="0.15" />
                <stop offset="50%" stopColor="#92cfc6" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#fefcf2" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="floorGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f5debe" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#fefcf2" stopOpacity="0" />
            </linearGradient>
        </defs>

        {/* Spotlights from top */}
        <rect width="100%" height="100%" fill="url(#spotlight)" />

        {/* Stadium floor perspective */}
        <path d="M0 250 L200 180 L600 180 L800 250 L800 300 L0 300 Z" fill="url(#floorGrad)" />

        {/* Center circle glow */}
        <ellipse cx="400" cy="200" rx="120" ry="30" stroke="#92cfc6" strokeWidth="1" fill="none" opacity="0.15" />
        <ellipse cx="400" cy="200" rx="60" ry="15" stroke="#da513f" strokeWidth="0.5" fill="none" opacity="0.2" />

        {/* Goal silhouette */}
        <rect x="360" y="140" width="80" height="50" rx="4" stroke="#e5b186" strokeWidth="1" fill="none" opacity="0.1" />
        <line x1="360" y1="160" x2="440" y2="160" stroke="#e5b186" strokeWidth="0.5" opacity="0.15" />
        <line x1="360" y1="175" x2="440" y2="175" stroke="#e5b186" strokeWidth="0.5" opacity="0.15" />

        {/* Abstract player silhouettes */}
        <g opacity="0.2">
            <circle cx="300" cy="170" r="5" fill="#da513f" />
            <path d="M300 175 L300 195 M300 185 L295 190 M300 185 L305 190 M300 195 L297 205 M300 195 L303 205" stroke="#da513f" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </g>
        <g opacity="0.2">
            <circle cx="500" cy="175" r="5" fill="#92cfc6" />
            <path d="M500 180 L500 200 M500 190 L495 195 M500 190 L505 195 M500 200 L497 210 M500 200 L503 210" stroke="#92cfc6" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </g>

        {/* Energy particles */}
        <circle cx="250" cy="120" r="2" fill="#e5b186" opacity="0.3" />
        <circle cx="550" cy="100" r="1.5" fill="#da513f" opacity="0.25" />
        <circle cx="450" cy="80" r="1" fill="#92cfc6" opacity="0.4" />
        <circle cx="350" cy="90" r="1.5" fill="#e5b186" opacity="0.2" />

        {/* Scoreboard */}
        <rect x="320" y="40" width="160" height="40" rx="4" stroke="#e5b186" strokeWidth="1" fill="none" opacity="0.2" />
        <line x1="400" y1="40" x2="400" y2="80" stroke="#e5b186" strokeWidth="1" opacity="0.15" />
    </svg>
)

const TrophyIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2v4M8 6h8M8 6s-2 2-2 5 2 5 2 5M16 6s2 2 2 5-2 5-2 5M8 16s2 3 4 3 4-3 4-3M12 19v3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

const CameraIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5">
        <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="13" r="4" />
    </svg>
)

const PencilIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

const ShieldIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

const TrashIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5">
        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

const UserIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="7" r="4" />
    </svg>
)

const MailIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22 6l-10 7L2 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

const CrownIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5">
        <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

const ArrowLeftIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m15 18-6-6 6-6" />
    </svg>
)

export default function Profile() {
    const { user, logout, setUser } = useAuth()
    const navigate = useNavigate()
    const [avatar, setAvatar] = useState(user?.avatar_url || null)
    const [uploading, setUploading] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const fileInputRef = useRef(null)
    const [isEditing, setIsEditing] = useState(false)
    const [editName, setEditName] = useState(user?.full_name || '')
    const [saving, setSaving] = useState(false)

    async function handleUpdateName(e) {
        e.preventDefault()
        setSaving(true)
        try {
            const res = await api.patch('/api/users/me', { full_name: editName })
            setUser(res.data.user)
            setIsEditing(false)
        } catch (err) {
            alert(err.response?.data?.error || 'Update failed')
        } finally { setSaving(false) }
    }

    async function handleAvatarChange(e) {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            const res = await api.post('/api/users/me/avatar', formData, {
                headers: {
                    'Content-Type': undefined
                }
            })
            setAvatar(res.data.avatar_url)
            setUser({ ...user, avatar_url: res.data.avatar_url })
        } catch (err) {
            alert('Failed to upload avatar')
        } finally {
            setUploading(false)
        }
    }

    async function handleDeleteAccount() {
        if (!window.confirm('Are you SURE? This cannot be undone.')) return

        try {
            await api.delete('/api/users/me')
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            logout()
            navigate('/login')
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to delete account')
        }
    }

    return (
        <div className="min-h-screen bg-[#fefcf2] text-[#5c3d2e] relative overflow-hidden">

            {/* Background texture */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.02]"
                style={{ backgroundImage: 'radial-gradient(#da513f 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

            {/* ─── Hero Header with Arena BG ─── */}
            <div className="relative bg-gradient-to-b from-[#f5debe]/30 to-[#fefcf2] overflow-hidden border-b border-[#ede8de]">
                <div className="absolute inset-0">
                    <ProfileArenaBg />
                </div>
                <div className="relative z-10 max-w-2xl mx-auto px-4 pt-8 pb-6">
                    <div className="flex items-center gap-4 mb-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="lg:hidden flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-[#6b6357] hover:text-[#1a1612] hover:bg-[#f5debe]/50 transition-colors bg-white/50 backdrop-blur-sm shadow-sm border border-[#e5b186]/30"
                        >
                            <ArrowLeftIcon className="w-5 h-5" />
                        </button>
                        <div className="w-10 h-0.5 bg-[#da513f] rounded-full" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight leading-tight text-[#5c3d2e]">
                        My <span className="text-[#da513f]">Profile</span>
                    </h1>
                    <p className="text-sm text-[#957467] mt-1 max-w-xs">
                        Manage your account, avatar, and preferences
                    </p>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 pb-24 relative z-10 mt-6 space-y-4">

                {/* ─── Avatar Card ─── */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-[#ede8de] p-5 shadow-sm">
                    <div className="flex items-center gap-5">
                        {/* Avatar with glow ring */}
                        <div className="relative">
                            <div className="absolute -inset-1 bg-gradient-to-br from-[#da513f] to-[#92cfc6] rounded-full opacity-30 blur-sm" />
                            <Avatar
                                src={avatar}
                                name={user?.full_name}
                                size="w-20 h-20"
                                rounded="rounded-full"
                                border="border-white"
                                text_size="text-2xl"
                            />
                            {/* Online indicator */}
                            <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-[#10b981] border-2 border-white" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <h2 className="font-bold text-[#1a1612] text-lg leading-tight">{user?.full_name || 'Player'}</h2>
                            <p className="text-xs text-[#9b8e80] mt-0.5">{user?.email}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#f5debe]/50 hover:bg-[#f5debe] border border-[#e5b186]/50 text-[#7a6040] text-xs font-bold rounded-xl transition-all active:scale-95 disabled:opacity-40"
                                >
                                    <CameraIcon className="w-3.5 h-3.5" />
                                    {uploading ? 'Uploading...' : 'Change'}
                                </button>

                            </div>
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                        </div>
                    </div>
                </div>

                {/* ─── Account Info Card ─── */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-[#ede8de] p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-[#92cfc6]/15 border border-[#92cfc6]/30 flex items-center justify-center">
                                <UserIcon className="w-3.5 h-3.5 text-[#92cfc6]" />
                            </div>
                            <h2 className="font-bold text-[#1a1612] text-sm">Account Details</h2>
                        </div>
                        {!isEditing && (
                            <button
                                onClick={() => { setIsEditing(true); setEditName(user?.full_name || '') }}
                                className="flex items-center gap-1 px-3 py-1.5 bg-[#f5debe]/40 hover:bg-[#f5debe]/60 text-[#9b8e80] hover:text-[#7a6040] text-[10px] font-black uppercase tracking-widest rounded-lg transition-all border border-[#e8d9b4]/50"
                            >
                                <PencilIcon className="w-3 h-3" />
                                Edit
                            </button>
                        )}
                    </div>

                    <div className="space-y-3">
                        {/* Name Field */}
                        <div className="bg-[#fcfaf5] rounded-xl border border-[#ede8de]/60 p-4">
                            <label className="flex items-center gap-1.5 text-[10px] font-bold text-[#9b8e80] uppercase tracking-[0.15em] mb-2">
                                <UserIcon className="w-3 h-3" />
                                Full Name
                            </label>
                            {isEditing ? (
                                <form onSubmit={handleUpdateName} className="flex gap-2 mt-1">
                                    <input
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                        className="flex-1 bg-white border border-[#e8e2d6] rounded-xl px-3.5 py-2.5 text-sm text-[#1a1612] placeholder-[#9b8e80]/40 focus:outline-none focus:ring-2 focus:ring-[#dc574b]/10 focus:border-[#dc574b]/40 transition-all shadow-sm"
                                        autoFocus
                                    />
                                    <button
                                        disabled={saving}
                                        className="px-3 py-2 bg-[#da513f] hover:bg-[#c44836] text-white rounded-lg text-xs font-bold active:scale-95 transition-all"
                                    >
                                        {saving ? '...' : 'Save'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        className="px-3 py-2 bg-[#f5debe]/50 text-[#7a6040] rounded-lg text-xs font-bold active:scale-95 transition-all"
                                    >
                                        Cancel
                                    </button>
                                </form>
                            ) : (
                                <p className="text-[#1a1612] font-bold text-sm">{user?.full_name || '—'}</p>
                            )}
                        </div>

                        {/* Email Field */}
                        <div className="bg-[#fcfaf5] rounded-xl border border-[#ede8de]/60 p-4">
                            <label className="flex items-center gap-1.5 text-[10px] font-bold text-[#9b8e80] uppercase tracking-[0.15em] mb-2">
                                <MailIcon className="w-3 h-3" />
                                Email
                            </label>
                            <p className="text-[#1a1612] font-bold text-sm">{user?.email || '—'}</p>
                        </div>

                        {/* Role Field */}
                        <div className="bg-[#fcfaf5] rounded-xl border border-[#ede8de]/60 p-4">
                            <label className="flex items-center gap-1.5 text-[10px] font-bold text-[#9b8e80] uppercase tracking-[0.15em] mb-2">
                                <CrownIcon className="w-3 h-3" />
                                Role
                            </label>
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#e5b186]/15 border border-[#e5b186]/30 text-[#7a6040] text-[10px] font-black uppercase tracking-widest">
                                    {user?.role || 'Player'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>



                {/* ─── Danger Zone ─── */}
                <div className="bg-gradient-to-br from-[#ef4444]/5 to-transparent rounded-2xl border border-[#ef4444]/20 p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/20 flex items-center justify-center">
                            <TrashIcon className="w-3.5 h-3.5 text-[#ef4444]" />
                        </div>
                        <h2 className="font-bold text-[#ef4444] text-sm">Danger Zone</h2>
                    </div>
                    <p className="text-xs text-[#9b8e80] mb-4 leading-relaxed font-medium">
                        Deleting your account is permanent. All tournaments, matches, and data will be permanently erased.
                    </p>
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full sm:w-auto px-6 py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-xl active:scale-95 transition-all"
                    >
                        Delete Account
                    </button>
                </div>

                {/* ─── Sign Out ─── */}
                <button
                    onClick={logout}
                    className="w-full py-4 bg-white hover:bg-[#fcfaf5] border border-[#ede8de] text-[#9b8e80] hover:text-[#1a1612] text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl active:scale-[0.98] transition-all shadow-sm"
                >
                    Sign Out
                </button>
            </div>

            {/* ─── Delete Confirmation Modal ─── */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-[#1a1612]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#fefcf2] rounded-3xl border border-[#ede8de] p-8 max-w-sm w-full shadow-2xl">
                        <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
                            <TrashIcon className="w-6 h-6 text-[#ef4444]" />
                        </div>
                        <h3 className="text-xl font-black text-[#1a1612] text-center mb-2 tracking-tight">Delete Account?</h3>
                        <p className="text-xs text-[#9b8e80] text-center mb-8 leading-relaxed font-medium">
                            This action cannot be undone. All your tournaments, matches, and personal data will be permanently erased from our servers.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleDeleteAccount}
                                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-red-200"
                            >
                                Delete Permanently
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="w-full py-3.5 bg-[#f5debe]/40 text-[#7a6040] rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all border border-[#e8d9b4]/50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}