import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

const API = 'http://localhost:3000'

export default function Dashboard() {
  const navigate = useNavigate()
  const [progress, setProgress] = useState([])
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        navigate('/login')
        return
      }

      try {
        const [modRes, progRes] = await Promise.all([
          fetch(`${API}/modules`),
          fetch(`${API}/progress`, {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          })
        ])

        if (!modRes.ok || !progRes.ok) throw new Error('Failed to load data')

        setModules(await modRes.json())
        setProgress(await progRes.json())
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [navigate])

  if (loading) return (
    <div className="p-8 text-gray-500">Loading your progress...</div>
  )

  if (error) return (
    <div className="p-8">
      <p className="text-red-500 mb-2">Could not load progress.</p>
      <p className="text-gray-400 text-sm">Make sure the backend is running.</p>
    </div>
  )

  const completedCount = progress.length
  const totalModules = modules.length
  const completedModuleIds = new Set(progress.map(p => p.module_id))
  const completedModules = completedModuleIds.size
  const nextLessonId = progress.length > 0
    ? progress[progress.length - 1].lesson_id + 1
    : 1

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">Your Progress</h1>
      <p className="text-gray-500 mb-8">
        Keep going — you're building real chess skills.
      </p>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white border rounded-xl p-5">
          <p className="text-sm text-gray-500 mb-1">Lessons Completed</p>
          <p className="text-3xl font-bold">{completedCount}</p>
        </div>
        <div className="bg-white border rounded-xl p-5">
          <p className="text-sm text-gray-500 mb-1">Modules Started</p>
          <p className="text-3xl font-bold">
            {completedModules} / {totalModules}
          </p>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-5 mb-8">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium">Overall Progress</span>
          <span className="text-gray-500">{completedCount} lessons done</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className="bg-gray-900 h-3 rounded-full transition-all duration-500"
            style={{
              width: completedCount === 0 ? '0%' : `${Math.min(completedCount * 10, 100)}%`
            }}
          />
        </div>
      </div>

      <button
        onClick={() => navigate(`/lessons/${nextLessonId}`)}
        className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-700 mb-8"
      >
        Continue Learning →
      </button>

      {progress.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Recently Completed</h2>
          <div className="space-y-2">
            {[...progress].reverse().slice(0, 5).map(p => (
              <div
                key={p.id}
                className="flex justify-between items-center bg-white border rounded-lg px-4 py-3"
              >
                <span className="text-sm font-medium">{p.lesson_title}</span>
                <span className="text-xs text-gray-400">{p.module_title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


