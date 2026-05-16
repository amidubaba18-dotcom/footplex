import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import CreateTournament from './pages/CreateTournament'
import TournamentPage from './pages/TournamentPage'
import ManageTournament from './pages/ManageTournament'

function Guard({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="h-screen flex items-center justify-center text-sm text-gray-500">Loading...</div>
  return user ? children : <Navigate to="/login" />
}

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return <div className="h-screen flex items-center justify-center text-sm text-gray-500">Loading...</div>

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
      <Route path="/dashboard" element={<Guard><Dashboard /></Guard>} />
      <Route path="/create" element={<Guard><CreateTournament /></Guard>} />
      <Route path="/manage/:id" element={<Guard><ManageTournament /></Guard>} />
      <Route path="/t/:slug" element={<TournamentPage />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}