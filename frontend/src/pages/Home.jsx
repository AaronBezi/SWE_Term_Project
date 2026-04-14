import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import API from '../config'

export default function Home() {
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [modules, setModules] = useState([])
  const [completedLessonIds, setCompletedLessonIds] = useState(new Set())
  const [totalLessons, setTotalLessons] = useState(0)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)

      // Fetch modules + their lessons for the preview card
      const modRes = await fetch(`${API}/modules`)
      if (!modRes.ok) return
      const modList = await modRes.json()

      const full = await Promise.all(
        modList.map(m => fetch(`${API}/modules/${m.id}`).then(r => r.json()))
      )
      setModules(full)
      setTotalLessons(full.reduce((sum, m) => sum + (m.lessons?.length ?? 0), 0))

      if (session) {
        const progRes = await fetch(`${API}/progress`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        })
        if (progRes.ok) {
          const prog = await progRes.json()
          setCompletedLessonIds(new Set(prog.map(p => p.lesson_id)))
        }
      }
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-violet-50">

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white border border-violet-200/60 text-violet-600 text-xs font-semibold px-4 py-1.5 rounded-full mb-8 shadow-sm">
          <span>Master Chess Through Structured Learning</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
          Learn Chess the<br />
          <span className="text-violet-500">Right Way</span>
        </h1>

        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-10">
          Progress through expertly crafted modules and lessons in a structured sequence.
          Complete each lesson to unlock the next and track your journey to chess mastery.
        </p>

        {/* CTAs */}
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {session ? (
            <>
              <button
                onClick={() => navigate('/modules')}
                className="bg-violet-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-violet-600 transition-colors flex items-center gap-2"
              >
                Continue Learning <span>→</span>
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                View Progress
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/signup')}
                className="bg-violet-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-violet-600 transition-colors flex items-center gap-2"
              >
                Start Your Journey <span>→</span>
              </button>
              <button
                onClick={() => navigate('/modules')}
                className="bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                View Course
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-4xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-2 gap-6 text-center max-w-xs mx-auto">
          {[
            { value: `${modules.length}+`, label: 'Modules' },
            { value: `${totalLessons}+`, label: 'Lessons' },
          ].map(stat => (
            <div key={stat.label}>
              <p className="text-3xl font-extrabold text-violet-500">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Module preview card */}
      {modules.length > 0 && (
        <div className="max-w-3xl mx-auto px-6 pb-24">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {modules.slice(0, 4).map((mod, i) => {
                const lessons = mod.lessons ?? []
                const completedInMod = lessons.filter(l => completedLessonIds.has(l.id)).length
                const pct = lessons.length > 0 ? Math.round((completedInMod / lessons.length) * 100) : 0
                const allDone = lessons.length > 0 && completedInMod === lessons.length

                // Unlocked if first module, or previous module fully complete
                const prevMod = modules[i - 1]
                const isUnlocked = i === 0 || (
                  prevMod?.lessons?.every(l => completedLessonIds.has(l.id))
                )

                return (
                  <div
                    key={mod.id}
                    onClick={() => isUnlocked && navigate('/modules')}
                    className={`rounded-xl border p-4 transition-all ${
                      isUnlocked
                        ? 'bg-white hover:shadow-md cursor-pointer'
                        : 'bg-gray-50 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                          isUnlocked ? 'bg-violet-500 text-white' : 'bg-gray-300 text-gray-500'
                        }`}>
                          {isUnlocked ? mod.order_index : '🔒'}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-gray-900">{mod.title}</p>
                          <p className="text-xs text-gray-400">{lessons.length} lessons</p>
                        </div>
                      </div>
                      {allDone && (
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-green-600 text-xs">✓</span>
                        </div>
                      )}
                    </div>

                    {isUnlocked && (
                      <div>
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>Progress</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className="bg-violet-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
