import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Signup() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSignup(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signUp({ email, password })

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-violet-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border shadow-sm max-w-md w-full p-8 text-center">
          <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-violet-500 text-xl">✉</span>
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 mb-2">Check your email</h2>
          <p className="text-gray-500 text-sm mb-6">
            We sent a verification link to <strong>{email}</strong>.
            Click it to activate your account, then log in.
          </p>
          <Link
            to="/login"
            className="bg-violet-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-600 transition-colors inline-block"
          >
            Go to login →
          </Link>
        </div>
      </div>
    )
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

        <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Create your account</h1>
        <p className="text-gray-400 text-sm mb-6">Start your chess learning journey today.</p>

        <form onSubmit={handleSignup} className="space-y-4">
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
              minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
              placeholder="At least 6 characters"
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
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-5 text-sm text-center text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-violet-500 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
