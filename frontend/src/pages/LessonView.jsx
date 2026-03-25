import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import API from '../config'

export default function LessonView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lesson, setLesson] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [completing, setCompleting] = useState(false)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    async function loadLesson() {
      try {
        const res = await fetch(`${API}/lessons/${id}`)
        if (res.status === 404) throw new Error('Lesson not found')
        if (!res.ok) throw new Error('Failed to load lesson')
        const data = await res.json()
        setLesson(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadLesson()
  }, [id])

  async function handleComplete() {
    setCompleting(true)
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      navigate('/login')
      return
    }

    const res = await fetch(`${API}/progress`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ lesson_id: Number(id) }),
    })

    setCompleting(false)

    if (res.ok) {
      setCompleted(true)
    } else {
      const data = await res.json()
      setError(data.error || 'Something went wrong')
    }
  }

  if (loading) return (
    <div className="p-8 text-gray-500">Loading lesson...</div>
  )

  if (error) return (
    <div className="p-8">
      <p className="text-red-500 mb-2">{error}</p>
      <button
        onClick={() => navigate('/modules')}
        className="text-sm text-gray-500 hover:underline"
      >
        ← Back to modules
      </button>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <button
        onClick={() => navigate('/modules')}
        className="text-sm text-gray-500 hover:text-gray-800 mb-6 flex items-center gap-1"
      >
        ← Back to modules
      </button>

      <h1 className="text-3xl font-bold mb-4">{lesson.title}</h1>

      <div className="bg-white border rounded-xl p-6 mb-8 text-gray-700 leading-relaxed whitespace-pre-wrap">
        {lesson.content || 'No content available for this lesson yet.'}
      </div>

      {completed ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
          <p className="text-green-700 font-semibold text-lg mb-2">
            ✓ Lesson Complete!
          </p>
          <button
            onClick={() => navigate('/modules')}
            className="text-sm text-green-800 underline hover:no-underline"
          >
            Back to modules →
          </button>
        </div>
      ) : (
        <button
          onClick={handleComplete}
          disabled={completing}
          className="w-full bg-gray-900 text-white py-3 rounded-xl font-medium hover:bg-gray-700 disabled:opacity-50"
        >
          {completing ? 'Saving...' : 'Mark as Complete ✓'}
        </button>
      )}
    </div>
  )
}