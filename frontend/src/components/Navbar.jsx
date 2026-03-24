import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useEffect, useState } from 'react'

export default function Navbar() {
  const navigate = useNavigate()
  const [userEmail, setUserEmail] = useState(null)

  useEffect(() => {
    // Check if already logged in on page load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email ?? null)
    })

    // Listen for login/logout changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    setUserEmail(null)
    navigate('/login')
  }

  return (
    <nav className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
      <Link to="/" className="text-xl font-bold tracking-wide">Caissa ♟</Link>
      <div className="flex gap-6 items-center">
        <Link to="/modules" className="hover:text-gray-300">Learn</Link>
        <Link to="/dashboard" className="hover:text-gray-300">Progress</Link>
        {userEmail ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">{userEmail}</span>
            <button
              onClick={handleLogout}
              className="bg-white text-gray-900 px-4 py-1.5 rounded font-medium hover:bg-gray-100"
            >
              Logout
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="bg-white text-gray-900 px-4 py-1.5 rounded font-medium hover:bg-gray-100"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  )
}