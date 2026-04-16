import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { supabase } from '../supabaseClient'
import API from '../config'
import PuzzleBoard from '../components/PuzzleBoard'

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
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          navigate('/login')
          return
        }
        const res = await fetch(`${API}/lessons/${id}`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        })
        if (res.status === 401) { navigate('/login'); return }
        if (res.status === 403) {
          const data = await res.json()
          throw new Error(data.error || 'You must complete the previous lesson first')
        }
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
  }, [id, navigate])

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
    <div className="min-h-screen bg-violet-50 flex items-center justify-center">
      <p className="text-gray-400">Loading lesson...</p>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-violet-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border p-8 text-center">
          <p className="text-red-500 font-medium mb-4">{error}</p>
          <button
            onClick={() => navigate('/modules')}
            className="text-sm text-violet-500 hover:text-violet-800 font-medium"
          >
            ← Back to modules
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-violet-50">
      <div className="max-w-2xl mx-auto px-6 py-12">

        {/* Back link */}
        <button
          onClick={() => navigate('/modules')}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-violet-500 transition-colors mb-8 font-medium"
        >
          ← Back to modules
        </button>

        {/* Lesson title */}
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6">{lesson.title}</h1>

        {/* Lesson content */}
        <div className="bg-white rounded-2xl border shadow-sm p-6 mb-8 text-gray-700 leading-relaxed prose prose-violet max-w-none">
          {lesson.content ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => <h1 className="text-2xl font-bold text-gray-900 mt-6 mb-3">{children}</h1>,
                h2: ({ children }) => <h2 className="text-xl font-bold text-gray-800 mt-5 mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">{children}</h3>,
                p: ({ children }) => <p className="mb-4 text-gray-700 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="text-gray-700">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                em: ({ children }) => <em className="italic text-gray-600">{children}</em>,
                hr: () => <hr className="my-6 border-gray-200" />,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-violet-300 pl-4 italic text-gray-500 my-4">{children}</blockquote>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-4">
                    <table className="min-w-full border border-gray-200 rounded-lg text-sm">{children}</table>
                  </div>
                ),
                thead: ({ children }) => <thead className="bg-violet-50">{children}</thead>,
                tbody: ({ children }) => <tbody className="divide-y divide-gray-100">{children}</tbody>,
                tr: ({ children }) => <tr className="divide-x divide-gray-200">{children}</tr>,
                th: ({ children }) => <th className="px-4 py-2 text-left font-semibold text-gray-700 border-b border-gray-200">{children}</th>,
                td: ({ children }) => <td className="px-4 py-2 text-gray-700">{children}</td>,
              }}
            >
              {lesson.content}
            </ReactMarkdown>
          ) : (
            <span className="text-gray-400 italic">No content available for this lesson yet.</span>
          )}
        </div>

        {/* Puzzles */}
        <PuzzleBoard lessonId={Number(id)} />

        {/* Complete / Done */}
        {completed ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-green-600 text-xl font-bold">✓</span>
            </div>
            <p className="text-green-700 font-bold text-lg mb-1">Lesson Complete!</p>
            <p className="text-green-600 text-sm mb-4">Great work — keep going.</p>
            <button
              onClick={() => navigate('/modules')}
              className="bg-violet-500 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-violet-600 transition-colors"
            >
              Back to modules →
            </button>
          </div>
        ) : (
          <button
            onClick={handleComplete}
            disabled={completing}
            className="w-full bg-violet-500 text-white py-3 rounded-xl font-semibold hover:bg-violet-600 transition-colors disabled:opacity-50"
          >
            {completing ? 'Saving...' : 'Mark as Complete ✓'}
          </button>
        )}
      </div>
    </div>
  )
}
