import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import CreateTournament from './pages/CreateTournament'
import TournamentPage from './pages/TournamentPage'
import ManageTournament from './pages/ManageTournament'
import Profile from './pages/Profile'

function Guard({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="h-screen flex items-center justify-center text-sm text-gray-500">Loading...</div>
  return user ? children : <Navigate to="/login" />
}

function NavBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (!user) return null

  const isActive = (path) => location.pathname === path

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:left-0 lg:top-0 lg:w-64 lg:h-screen lg:bg-gray-900 lg:text-white lg:flex lg:flex-col lg:z-40">
        <div className="p-6 border-b border-gray-800">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-3 hover:opacity-80">
            <div className="w-10 h-10 rounded-lg bg-brand-500 flex items-center justify-center text-xl font-bold">⚽</div>
            <div><h1 className="text-lg font-bold">FootPlex</h1><p className="text-xs text-gray-400">Tournaments</p></div>
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {[
            { path: '/dashboard', label: 'Browse', icon: '🏆' },
            { path: '/create', label: 'Create', icon: '➕' },
            { path: '/profile', label: 'Profile', icon: '👤' },
          ].map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                isActive(item.path)
                  ? 'bg-brand-500 text-white'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={logout}
            className="w-full px-4 py-3 rounded-lg flex items-center gap-3 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <span className="text-lg">🚪</span>
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="fixed lg:hidden bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="flex items-center justify-around">
          {[
            { path: '/dashboard', label: 'Browse', icon: '🏆' },
            { path: '/create', label: 'Create', icon: '➕' },
            { path: '/profile', label: 'Profile', icon: '👤' },
          ].map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex-1 py-4 flex flex-col items-center gap-1 text-xs font-medium transition-colors ${
                isActive(item.path) ? 'text-brand-500' : 'text-gray-600'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </button>
          ))}
          <button
            onClick={logout}
            className="flex-1 py-4 flex flex-col items-center gap-1 text-xs font-medium text-red-600"
          >
            <span className="text-lg">🚪</span>
            Exit
          </button>
        </div>
      </div>
    </>
  )
}

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return <div className="h-screen flex items-center justify-center text-sm text-gray-500">Loading...</div>

  return (
    <div className="lg:ml-64">
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<Guard><Dashboard /></Guard>} />
        <Route path="/create" element={<Guard><CreateTournament /></Guard>} />
        <Route path="/manage/:id" element={<Guard><ManageTournament /></Guard>} />
        <Route path="/profile" element={<Guard><Profile /></Guard>} />
        <Route path="/t/:slug" element={<TournamentPage />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
      {user && <div className="h-24 lg:h-0"></div>}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <NavBar />
      <AppRoutes />
    </AuthProvider>
  )
}