import { createContext, useContext, useState, useEffect } from 'react'
import api from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const token = localStorage.getItem('token')
        const stored = localStorage.getItem('user')
        if (token && stored) {
            setUser(JSON.parse(stored))
        }
        setLoading(false)
    }, [])

    async function login(email, password) {
        const res = await api.post('/api/auth/login', { email, password })
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('user', JSON.stringify(res.data.user))
        setUser(res.data.user)
        return res.data
    }

    async function register(email, password, full_name) {
        const res = await api.post('/api/auth/register', { email, password, full_name })
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('user', JSON.stringify(res.data.user))
        setUser(res.data.user)
        return res.data
    }

    function logout() {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}