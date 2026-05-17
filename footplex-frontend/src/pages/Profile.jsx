import { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

export default function Profile() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [avatar, setAvatar] = useState(user?.avatar || '👤')
    const [uploading, setUploading] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const fileInputRef = useRef(null)

    async function handleAvatarChange(e) {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            const reader = new FileReader()
            reader.onload = (event) => {
                const data = event.target?.result
                localStorage.setItem(`avatar_${user.id}`, data)
                setAvatar(data)
            }
            reader.readAsDataURL(file)
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
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-2xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage your account and preferences</p>
                </div>

                {/* Avatar Section */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                    <h2 className="font-semibold text-gray-900 mb-4">Profile Picture</h2>
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-5xl border-2 border-gray-200">
                            {typeof avatar === 'string' && avatar.startsWith('data:')
                                ? <img src={avatar} alt="avatar" className="w-full h-full rounded-full object-cover" />
                                : avatar}
                        </div>
                        <div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="btn-primary disabled:opacity-40"
                            >
                                {uploading ? 'Uploading...' : 'Change Picture'}
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                className="hidden"
                            />
                            <p className="text-xs text-gray-400 mt-2">JPG, PNG up to 5MB</p>
                        </div>
                    </div>
                </div>

                {/* Account Info */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                    <h2 className="font-semibold text-gray-900 mb-4">Account Information</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-500 mb-1">Full Name</label>
                            <p className="text-gray-900 font-medium">{user?.full_name}</p>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-500 mb-1">Email</label>
                            <p className="text-gray-900 font-medium">{user?.email}</p>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-500 mb-1">Role</label>
                            <p className="text-gray-900 font-medium capitalize">{user?.role || 'Player'}</p>
                        </div>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <h2 className="font-semibold text-red-600 mb-4">Danger Zone</h2>
                    <p className="text-sm text-red-600 mb-4">
                        Deleting your account is permanent. All your tournaments and data will be lost.
                    </p>
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        Delete Account
                    </button>
                </div>

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 max-w-sm mx-4">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Account?</h3>
                            <p className="text-sm text-gray-600 mb-6">
                                This action cannot be undone. All your data will be permanently deleted.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteAccount}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}