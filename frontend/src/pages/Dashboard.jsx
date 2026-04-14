import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import API from '../config'

export default function Dashboard() {
  const navigate = useNavigate()
  const [progress, setProgress] = useState([])
  const [allLessons, setAllLessons] = useState([])
  const [totalModules, setTotalModules] = useState(0)
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
            headers: { 'Authorization': `Bearer ${session.access_token}` },
          }),
        ])

        if (!modRes.ok || !progRes.ok) throw new Error('Failed to load data')

        const modList = await modRes.json()
        setTotalModules(modList.length)

        const fullModules = await Promise.all(
          modList.map(m => fetch(`${API}/modules/${m.id}`).then(r => r.json()))
        )
        setAllLessons(fullModules.flatMap(m => m.lessons || []))
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
    <div className="min-h-screen bg-violet-50 flex items-center justify-center">
      <p className="text-gray-400">Loading your progress...</p>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-violet-50 p-8">
      <p className="text-red-500 mb-1">Could not load progress.</p>
      <p className="text-gray-400 text-sm">Make sure the backend is running.</p>
    </div>
  )

  const completedCount    = progress.length
  const totalLessons      = allLessons.length
  const completedLessonIds = new Set(progress.map(p => p.lesson_id))
  const completedModuleIds = new Set(progress.map(p => p.module_id))
  const progressPercent   = totalLessons > 0
    ? Math.round((completedCount / totalLessons) * 100)
    : 0
  const nextLesson = allLessons.find(l => !completedLessonIds.has(l.id))

  return (
    <div className="min-h-screen bg-violet-50">
      <div className="max-w-2xl mx-auto px-6 py-12">

        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Your Progress</h1>
          <p className="text-gray-500">Keep going — you're building real chess skills.</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl border shadow-sm p-5">
            <p className="text-sm text-gray-400 mb-1">Lessons Completed</p>
            <p className="text-3xl font-extrabold text-violet-500">
              {completedCount}
              <span className="text-lg text-gray-300 font-normal"> / {totalLessons}</span>
            </p>
          </div>
          <div className="bg-white rounded-2xl border shadow-sm p-5">
            <p className="text-sm text-gray-400 mb-1">Modules Started</p>
            <p className="text-3xl font-extrabold text-violet-500">
              {completedModuleIds.size}
              <span className="text-lg text-gray-300 font-normal"> / {totalModules}</span>
            </p>
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="bg-white rounded-2xl border p-5 mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-semibold text-gray-700">Overall Progress</span>
            <span className="text-violet-500 font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div
              className="bg-violet-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* CTA */}
        {nextLesson ? (
          <button
            onClick={() => navigate(`/lessons/${nextLesson.id}`)}
            className="w-full bg-violet-500 text-white py-3 rounded-xl font-semibold hover:bg-violet-600 transition-colors mb-8"
          >
            Continue Learning → {nextLesson.title}
          </button>
        ) : completedCount > 0 ? (
          <div className="w-full bg-green-50 border border-green-200 text-green-700 py-3 rounded-xl font-semibold text-center mb-8">
            All lessons complete!
          </div>
        ) : (
          <button
            onClick={() => navigate('/modules')}
            className="w-full bg-violet-500 text-white py-3 rounded-xl font-semibold hover:bg-violet-600 transition-colors mb-8"
          >
            Start Learning →
          </button>
        )}

        {/* Recent activity */}
        {progress.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Recently Completed</h2>
            <div className="space-y-2">
              {[...progress].reverse().slice(0, 5).map(p => (
                <div
                  key={p.id}
                  className="flex justify-between items-center bg-white border rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-sm font-medium text-gray-800">{p.lesson_title}</span>
                  </div>
                  <span className="text-xs text-gray-400">{p.module_title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
