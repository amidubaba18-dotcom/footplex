import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

const BRACKET_FORMATS = new Set([
    'single_elim',
    'single_elimination',
    'double_elim',
    'double_elimination',
    'group_knockout'
])

export default function CreateTournament() {
    const navigate = useNavigate()
    const [form, setForm] = useState({
        name: '',
        tournament_type: 'physical',
        format: 'round_robin',
        max_teams: '8',
        group_count: '2',
        teams_advance: '2',
        description: '',
        is_two_legged_knockout: false,
        start_date: '',
        end_date: '',
        is_double_round_robin: false
    })


    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    function handleChange(e) {
        const { name, value, type, checked } = e.target;
        setForm(f => ({
            ...f,
            [name]: type === 'checkbox' ? checked : value
        }))
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            const res = await api.post('/api/tournaments', {
                ...form,
                max_teams: parseInt(form.max_teams),
                group_count: parseInt(form.group_count || '2'),
                teams_advance_per_group: parseInt(form.teams_advance || '2'),
            })
            if (res.data.tournament) {
                navigate(`/manage/${res.data.tournament.id}`)
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create tournament')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
                <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-gray-600">
                    ← Back
                </button>
                <span className="font-semibold text-gray-900">Create Tournament</span>
            </nav>

            <div className="max-w-2xl mx-auto px-6 py-10">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">New Tournament</h1>
                    <p className="text-gray-500 text-sm mt-1">Set up your tournament in seconds</p>
                </div>

                {error && (
                    <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Basic info */}
                    <div className="card space-y-4">
                        <h2 className="font-semibold text-gray-900">Basic Info</h2>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tournament Name <span className="text-red-400">*</span>
                            </label>
                            <input
                                name="name" required
                                value={form.name}
                                onChange={handleChange}
                                className="input"
                                placeholder="Copa Norte 2025"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                rows={3}
                                className="input resize-none"
                                placeholder="Tell participants what this tournament is about..."
                            />
                        </div>
                    </div>

                    {/* Tournament settings */}
                    <div className="card space-y-4">
                        <h2 className="font-semibold text-gray-900">Settings</h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <select name="tournament_type" value={form.tournament_type} onChange={handleChange} className="input">
                                    <option value="physical">⚽ Physical Football</option>
                                    <option value="efootball">🎮 eFootball</option>
                                    <option value="futsal">🏃 Futsal</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                                <select name="format" value={form.format} onChange={handleChange} className="input">
                                    <option value="round_robin">Round Robin</option>
                                    <option value="free_for_all">Free For All</option>
                                    <option value="single_elim">Single Elimination</option>
                                    <option value="group_knockout">Group + Knockout</option>
                                    <option value="swiss">Swiss System</option>
                                    <option value="double_elim"> Double Elimination</option>

                                </select>
                            </div>
                        </div>

                        {(form.format === 'round_robin' || form.format === 'free_for_all') && (
                            <div className="flex items-center gap-3 p-3 bg-brand-50 rounded-lg border border-brand-100">
                                <input
                                    type="checkbox"
                                    name="is_double_round_robin"
                                    id="is_double_round_robin"
                                    checked={form.is_double_round_robin}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500"
                                />
                                <label htmlFor="is_double_round_robin" className="text-sm font-medium text-brand-900">
                                    Double Round Robin (Home & Away)
                                </label>
                                <p className="text-[10px] text-brand-600 ml-auto italic">Teams play each other twice</p>
                            </div>
                        )}

                        {BRACKET_FORMATS.has(form.format) && (
                            <div className="flex items-center gap-3 p-3 bg-brand-50 rounded-lg border border-brand-100">
                                <input
                                    type="checkbox"
                                    name="is_two_legged_knockout"
                                    id="is_two_legged_knockout"
                                    checked={form.is_two_legged_knockout}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500"
                                />
                                <label htmlFor="is_two_legged_knockout" className="text-sm font-medium text-brand-900">
                                    Two-Legged Knockout (Home & Away)
                                </label>
                            </div>
                        )}
                        {form.format === 'group_knockout' && (
                            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Number of Groups</label>
                                    <select name="group_count" value={form.group_count || '2'} onChange={handleChange} className="input">
                                        <option value="2">2 Groups (A, B)</option>
                                        <option value="4">4 Groups (A, B, C, D)</option>
                                        <option value="8">8 Groups (A–H)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Teams Advance Per Group</label>
                                    <select name="teams_advance" value={form.teams_advance || '2'} onChange={handleChange} className="input">
                                        <option value="1">Top 1</option>
                                        <option value="2">Top 2</option>
                                        <option value="3">Top 3</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Max Teams</label>
                            <select name="max_teams" value={form.max_teams} onChange={handleChange} className="input">
                                {[4, 8, 16, 32].map(n => (
                                    <option key={n} value={n}>{n} teams</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="card space-y-4">
                        <h2 className="font-semibold text-gray-900">Dates (optional)</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                <input type="date" name="start_date" value={form.start_date} onChange={handleChange} className="input" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                <input type="date" name="end_date" value={form.end_date} onChange={handleChange} className="input" />
                            </div>
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary w-full justify-center flex text-base py-3">
                        {loading ? 'Creating...' : 'Create Tournament'}
                    </button>

                </form>
            </div>
        </div>
    )
}