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

// --- SVG Icons ---
const ExploreIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const MyTournamentsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
)

const CreateIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const ProfileIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const SignOutIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
)

function Guard({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="h-screen flex items-center justify-center text-sm text-gray-500">Loading...</div>
  return user ? children : <Navigate to="/login" />
}

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Explore', icon: ExploreIcon },
  { path: '/my-events', label: 'My Tournaments', icon: MyTournamentsIcon },
  { path: '/create', label: 'Create', icon: CreateIcon },
  { path: '/profile', label: 'Profile', icon: ProfileIcon },
  { path: '/settings', label: 'Settings', icon: SettingsIcon },
]

function NavButton({ item, isActive, onClick, isMobile = false }) {
  const Icon = item.icon
  if (isMobile) {
    return (
      <button
        onClick={onClick}
        className={`flex-1 py-3 flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${isActive ? 'text-brand-600' : 'text-gray-400'}`}
      >
        <Icon />
        {item.label.split(' ')[0]}
      </button>
    )
  }
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${isActive ? 'bg-brand-500 text-white shadow-lg shadow-brand-200' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}
    >
      <Icon />
      <span className="font-semibold text-sm">{item.label}</span>
    </button>
  )
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
          {NAV_ITEMS.map(item => (
            <NavButton key={item.path} item={item} isActive={isActive(item.path)} onClick={() => navigate(item.path)} />
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center text-xs">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="profile" className="w-full h-full object-cover" />
              ) : (
                user.full_name.charAt(0)
              )}
            </div>
            <div className="flex-1 truncate">
              <p className="text-sm font-medium text-white truncate">{user.full_name}</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">{user.role || 'Member'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full px-4 py-3 rounded-xl flex items-center gap-3 text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all group"
          >
            <SignOutIcon />
            <span className="font-semibold text-sm">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="fixed lg:hidden bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-around px-2">
          {NAV_ITEMS.slice(0, 4).map(item => (
            <NavButton key={item.path} item={item} isActive={isActive(item.path)} onClick={() => navigate(item.path)} isMobile />
          ))}
          <button
            onClick={logout}
            className="flex-1 py-3 flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-400"
          >
            <SignOutIcon />
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