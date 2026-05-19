import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navigation from './components/Navigation'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import CreateTournament from './pages/CreateTournament'
import TournamentPage from './pages/TournamentPage'
import ManageTournament from './pages/ManageTournament'
import Profile from './pages/Profile'
import MyEvents from './pages/MyEvents'

function Guard({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="h-screen flex items-center justify-center text-sm text-gray-500">Loading...</div>
  return user ? children : <Navigate to="/login" />
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
        <Route path="/my-events" element={<Guard><MyEvents /></Guard>} />
        <Route path="/notifications" element={<Guard><Notifications /></Guard>} />
        <Route path="/t/:slug" element={<TournamentPage />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
      {user && <div className="h-24 lg:h-0"></div>}
    </div>
  )
}

function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstall, setShowInstall] = useState(false)

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstall(true)
    }

    const handleInstalled = () => {
      setShowInstall(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowInstall(false)
    }
  }

  if (!showInstall) return null

  return (
    <div className="fixed top-0 left-0 right-0 bg-brand-500 text-white p-4 flex items-center justify-between z-50 shadow-lg">
      <span className="text-sm font-medium">📱 Add FootPlex to your home screen</span>
      <button
        onClick={handleInstall}
        className="bg-white text-brand-500 px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-gray-100 transition-colors"
      >
        Install
      </button>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <InstallPrompt />
      <Navigation />
      <AppRoutes />
    </AuthProvider>
  )
}