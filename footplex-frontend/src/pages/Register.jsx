import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'

export default function Register() {
    const { register } = useAuth()
    const navigate = useNavigate()
    const [form, setForm] = useState({ full_name: '', email: '', password: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e) {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            await register(form.email, form.password, form.full_name)
            navigate('/dashboard')
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <div className="mb-8 text-center">
                    <div className="text-3xl mb-2">⚽</div>
                    <h1 className="text-2xl font-bold text-gray-900">FootPlex</h1>
                    <p className="text-sm text-gray-500 mt-1">Create your account</p>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
                            <input
                                type="text" required
                                value={form.full_name}
                                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                                className="input"
                                placeholder="James Mensah"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email" required
                                value={form.email}
                                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                className="input"
                                placeholder="you@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input
                                type="password" required
                                value={form.password}
                                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                className="input"
                                placeholder="••••••••"
                            />
                        </div>
                        <button type="submit" disabled={loading} className="btn-primary w-full justify-center flex">
                            {loading ? 'Creating account...' : 'Create account'}
                        </button>
                    </form>
                </div>

                <p className="text-center text-sm text-gray-500 mt-4">
                    Have an account?{' '}
                    <Link to="/login" className="text-brand-500 font-medium hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    )
}