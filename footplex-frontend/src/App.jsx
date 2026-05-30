import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import CreateTournament from './pages/CreateTournament'
import TournamentPage from './pages/TournamentPage'
import Profile from './pages/Profile'
import MyEvents from './pages/MyEvents'
import Settings from './pages/Settings'
import Navigation from './Components/Navigation'

function Guard({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="h-screen flex items-center justify-center text-sm text-gray-500">Loading...</div>
  return user ? children : <Navigate to="/login" />
}

function AppRoutes({ isCollapsed }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="h-screen flex items-center justify-center text-sm text-gray-500">Loading...</div>

  const marginClass = user ? (isCollapsed ? "lg:ml-20" : "lg:ml-64") : ""

  return (
    <div className={`transition-all duration-300 ease-in-out ${marginClass}`}>
      <Routes>
        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to="/dashboard" />}
        />

        <Route
          path="/register"
          element={!user ? <Register /> : <Navigate to="/dashboard" />}
        />

        <Route
          path="/dashboard"
          element={
            <Guard>
              <Dashboard />
            </Guard>
          }
        />

        <Route
          path="/my-events"
          element={
            <Guard>
              <MyEvents />
            </Guard>
          }
        />

        <Route
          path="/create"
          element={
            <Guard>
              <CreateTournament />
            </Guard>
          }
        />

        <Route
          path="/profile"
          element={
            <Guard>
              <Profile />
            </Guard>
          }
        />

        <Route
          path="/settings"
          element={
            <Guard>
              <Settings />
            </Guard>
          }
        />

        <Route path="/t/:slug" element={<TournamentPage />} />

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </div>
  )
}

export default function App() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  return (
    <AuthProvider>
      <Navigation isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <AppRoutes isCollapsed={isCollapsed} />
    </AuthProvider>
  )
}