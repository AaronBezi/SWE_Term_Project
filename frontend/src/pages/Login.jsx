import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    if (data.session) {
      navigate('/modules')
    } else {
      setError('Login succeeded but no session was created. Try again.')
    }
  }

  return (
    <div className="min-h-screen bg-violet-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border shadow-md w-full max-w-md p-8">

        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-violet-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">
            ♟
          </div>
          <span className="text-lg font-bold text-gray-900">Caissa</span>
        </div>

        <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Welcome back</h1>
        <p className="text-gray-400 text-sm mb-6">Sign in to continue your learning journey.</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-500 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-violet-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-5 text-sm text-center text-gray-400">
          Don't have an account?{' '}
          <Link to="/signup" className="text-violet-500 font-medium hover:underline">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  )
}
