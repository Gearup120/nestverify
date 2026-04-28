import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useEffect, useState } from 'react'
import { chatAPI } from '../../api'
import { LogOut, Home, ShieldCheck, PlusCircle, MessageCircle, Heart, User } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!user) return
    chatAPI.unread()
      .then(({ data }) => setUnread(data.unread))
      .catch(() => {})

    const interval = setInterval(() => {
      chatAPI.unread()
        .then(({ data }) => setUnread(data.unread))
        .catch(() => {})
    }, 30000)
    return () => clearInterval(interval)
  }, [user])

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out successfully.')
    navigate('/login')
  }

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-[var(--nest-teal)]">
          Nest<span className="text-[var(--nest-amber)]">Verify</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-gray-500">
          <Link to="/about" className="hover:text-[var(--nest-teal)] transition-colors">Our Story</Link>
          <Link to="/properties" className="hover:text-[var(--nest-teal)] transition-colors">Find Homes</Link>
          {user && <Link to="/dashboard" className="hover:text-[var(--nest-teal)] transition-colors">Dashboard</Link>}
          <Link to="/contact" className="hover:text-[var(--nest-teal)] transition-colors">Support</Link>
        </nav>

        {/* Auth controls */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-6">
              <Link to="/messages" className="text-gray-500 hover:text-[var(--nest-teal)] transition-colors relative">
                <MessageCircle size={22} />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </Link>
              <Link to="/profile" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-[var(--nest-teal)] group-hover:bg-[var(--nest-teal)] group-hover:text-white transition-all">
                  <User size={20} />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter leading-none">Account</p>
                  <p className="text-sm font-bold text-gray-700">{user.first_name}</p>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-[var(--nest-teal)] transition-colors border border-gray-100 rounded-xl">
                Sign In
              </Link>
              <Link to="/register" className="btn-amber text-sm py-2.5 px-6">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}