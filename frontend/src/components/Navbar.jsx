import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useEffect, useState } from 'react'

export default function Navbar() {
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setIsAdmin(session?.user?.app_metadata?.role === 'admin')
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setIsAdmin(session?.user?.app_metadata?.role === 'admin')
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <nav className="bg-white border-b border-gray-100 shadow-sm px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl">♟</span>
          <span className="text-lg font-bold text-gray-900">Caissa</span>
        </Link>

        {/* Center nav */}
        <div className="flex items-center gap-8 text-sm font-medium text-gray-600">
          <Link to="/modules" className="hover:text-violet-500 transition-colors">Learn</Link>
          {session && (
            <Link to="/dashboard" className="hover:text-violet-500 transition-colors">Progress</Link>
          )}
          {isAdmin && (
            <Link to="/admin" className="hover:text-violet-500 transition-colors">Admin</Link>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {session ? (
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign out
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                className="bg-violet-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-violet-600 transition-colors"
              >
                Start Learning
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
