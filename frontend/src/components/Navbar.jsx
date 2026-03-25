import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useEffect, useState } from 'react'

export default function Navbar() {
  const navigate = useNavigate()
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <nav className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
      <Link to="/" className="text-xl font-bold tracking-wide">Caissa ♟</Link>
      <div className="flex gap-6 items-center">
        <Link to="/modules" className="hover:text-gray-300">Learn</Link>
        {session && <Link to="/dashboard" className="hover:text-gray-300">Progress</Link>}
        {session ? (
          <button
            onClick={handleLogout}
            className="bg-white text-gray-900 px-4 py-1.5 rounded font-medium hover:bg-gray-100"
          >
            Logout
          </button>
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