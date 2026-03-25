import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Home() {
  const navigate = useNavigate()
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
  }, [])

  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <h1 className="text-5xl font-bold mb-4">Caissa ♟</h1>
      <p className="text-xl text-gray-600 mb-4">
        A structured chess learning journey.
      </p>
      <p className="text-gray-500 mb-10">
        Stop jumping between random videos and tutorials. Caissa guides you
        through ordered lessons — from the basics to advanced concepts — one
        step at a time.
      </p>

      {session ? (
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate('/modules')}
            className="bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-700"
          >
            Continue Learning →
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="border border-gray-300 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50"
          >
            View Progress
          </button>
        </div>
      ) : (
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate('/signup')}
            className="bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-700"
          >
            Get Started Free
          </button>
          <button
            onClick={() => navigate('/login')}
            className="border border-gray-300 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50"
          >
            Log In
          </button>
        </div>
      )}
    </div>
  )
}