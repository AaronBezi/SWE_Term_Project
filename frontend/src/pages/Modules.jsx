import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import API from '../config'

export default function Modules() {
  const navigate = useNavigate()
  const [modules, setModules] = useState([])
  const [completedLessonIds, setCompletedLessonIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadData() {
      try {
        const modRes = await fetch(`${API}/modules`)
        if (!modRes.ok) throw new Error('Failed to load modules')
        const modList = await modRes.json()

        // Fetch each module with its lessons so we know lesson counts per module
        const fullModules = await Promise.all(
          modList.map(m => fetch(`${API}/modules/${m.id}`).then(r => r.json()))
        )
        setModules(fullModules)

        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const progRes = await fetch(`${API}/progress`, {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          })
          if (progRes.ok) {
            const progress = await progRes.json()
            setCompletedLessonIds(new Set(progress.map(p => p.lesson_id)))
          }
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) return (
    <div className="p-8 text-gray-500">Loading modules...</div>
  )

  if (error) return (
    <div className="p-8">
      <p className="text-red-500 mb-2">Could not load modules: {error}</p>
      <p className="text-gray-400 text-sm">Make sure the backend server is running at localhost:3000</p>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">Your Learning Journey</h1>
      <p className="text-gray-500 mb-8">
        Complete each module in order to unlock the next.
      </p>

      <div className="space-y-4">
        {modules.map((mod, index) => {
          const prevMod = modules[index - 1]
          const allPrevCompleted = index === 0 || (
            prevMod?.lessons?.every(l => completedLessonIds.has(l.id))
          )
          const isUnlocked = allPrevCompleted
          // Navigate to first incomplete lesson in this module, or first lesson if all done
          const nextLesson = mod.lessons?.find(l => !completedLessonIds.has(l.id)) || mod.lessons?.[0]
          const allLessonsComplete = mod.lessons?.every(l => completedLessonIds.has(l.id))

          return (
            <div key={mod.id} className={`border rounded-xl p-5 transition ${
              isUnlocked
                ? 'bg-white shadow hover:shadow-md'
                : 'bg-gray-100 opacity-60'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                    Module {mod.order_index}
                  </p>
                  <h2 className="text-lg font-semibold">{mod.title}</h2>
                  {mod.description && (
                    <p className="text-sm text-gray-500 mt-1">{mod.description}</p>
                  )}
                </div>
                <span className="text-2xl">
                  {!isUnlocked ? '🔒' : allLessonsComplete ? '✅' : '▶'}
                </span>
              </div>

              {isUnlocked && mod.lessons?.length > 0 && (
                <div className="mt-3 space-y-2">
                  {mod.lessons.map(lesson => {
                    const done = completedLessonIds.has(lesson.id)
                    return (
                      <div
                        key={lesson.id}
                        onClick={() => navigate(`/lessons/${lesson.id}`)}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer text-sm"
                      >
                        <span className={done ? 'text-gray-400 line-through' : 'text-gray-700'}>
                          {lesson.title}
                        </span>
                        <span>{done ? '✓' : '→'}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}