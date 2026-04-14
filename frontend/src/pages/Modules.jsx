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

        const fullModules = await Promise.all(
          modList.map(m => fetch(`${API}/modules/${m.id}`).then(r => r.json()))
        )
        setModules(fullModules)

        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const progRes = await fetch(`${API}/progress`, {
            headers: { 'Authorization': `Bearer ${session.access_token}` },
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
    <div className="min-h-screen bg-violet-50 flex items-center justify-center">
      <p className="text-gray-400">Loading modules...</p>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-violet-50 p-8">
      <p className="text-red-500 mb-1">Could not load modules: {error}</p>
      <p className="text-gray-400 text-sm">Make sure the backend server is running.</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-violet-50">
      <div className="max-w-3xl mx-auto px-6 py-12">

        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Your Learning Journey</h1>
          <p className="text-gray-500">Complete each module in order to unlock the next.</p>
        </div>

        <div className="space-y-4">
          {modules.map((mod, index) => {
            const prevMod = modules[index - 1]
            const isUnlocked = index === 0 || prevMod?.lessons?.every(l => completedLessonIds.has(l.id))
            const lessons = mod.lessons ?? []
            const completedInMod = lessons.filter(l => completedLessonIds.has(l.id)).length
            const pct = lessons.length > 0 ? Math.round((completedInMod / lessons.length) * 100) : 0
            const allDone = lessons.length > 0 && completedInMod === lessons.length
            const nextLesson = lessons.find(l => !completedLessonIds.has(l.id)) || lessons[0]

            return (
              <div
                key={mod.id}
                className={`bg-white rounded-2xl border transition-all ${
                  isUnlocked ? 'shadow-sm hover:shadow-md cursor-pointer' : 'opacity-50'
                }`}
              >
                {/* Module header */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                        isUnlocked ? 'bg-violet-500 text-white' : 'bg-gray-200 text-gray-400'
                      }`}>
                        {isUnlocked ? mod.order_index : '🔒'}
                      </div>
                      <div>
                        <h2 className="font-bold text-gray-900">{mod.title}</h2>
                        {mod.description && (
                          <p className="text-sm text-gray-400 mt-0.5">{mod.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">{lessons.length} lessons</span>
                      {allDone && (
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-green-600 text-xs font-bold">✓</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  {isUnlocked && lessons.length > 0 && (
                    <div>
                      <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                        <span>Progress</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-violet-500 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Lessons list */}
                {isUnlocked && lessons.length > 0 && (
                  <div className="border-t divide-y">
                    {lessons.map(lesson => {
                      const done = completedLessonIds.has(lesson.id)
                      return (
                        <div
                          key={lesson.id}
                          onClick={() => navigate(`/lessons/${lesson.id}`)}
                          className="flex items-center justify-between px-5 py-3 hover:bg-violet-50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              done
                                ? 'border-violet-600 bg-violet-500'
                                : 'border-gray-200'
                            }`}>
                              {done && <span className="text-white text-xs">✓</span>}
                            </div>
                            <span className={`text-sm ${done ? 'text-gray-400 line-through' : 'text-gray-700 font-medium'}`}>
                              {lesson.title}
                            </span>
                          </div>
                          {!done && (
                            <span className="text-violet-500 text-xs font-semibold">Start →</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* CTA for unlocked modules */}
                {isUnlocked && !allDone && nextLesson && (
                  <div className="px-5 pb-5 pt-3">
                    <button
                      onClick={() => navigate(`/lessons/${nextLesson.id}`)}
                      className="w-full bg-violet-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-600 transition-colors"
                    >
                      {completedInMod === 0 ? 'Start Module →' : 'Continue →'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
