import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import API from '../config'

export default function AdminPanel() {
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('modules')

  // Modules state
  const [modules, setModules] = useState([])
  const [editingModule, setEditingModule] = useState(null)
  const [newModule, setNewModule] = useState({ title: '', description: '', order_index: '' })
  const [showNewModule, setShowNewModule] = useState(false)
  const [moduleError, setModuleError] = useState(null)

  // Users state
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [userError, setUserError] = useState(null)

  // Lessons state
  const [selectedModuleId, setSelectedModuleId] = useState('')
  const [lessons, setLessons] = useState([])
  const [editingLesson, setEditingLesson] = useState(null)
  const [newLesson, setNewLesson] = useState({ title: '', content: '', order_index: '' })
  const [showNewLesson, setShowNewLesson] = useState(false)
  const [lessonError, setLessonError] = useState(null)

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        navigate('/login')
        return
      }
      setSession(session)
      const role = session.user?.app_metadata?.role
      if (role !== 'admin') {
        setIsAdmin(false)
        setLoading(false)
        return
      }
      setIsAdmin(true)
      await loadModules()
      setLoading(false)
    }
    init()
  }, [navigate])

  async function loadModules() {
    const res = await fetch(`${API}/modules`)
    if (res.ok) {
      const data = await res.json()
      setModules(data.sort((a, b) => a.order_index - b.order_index))
    }
  }

  async function loadLessons(moduleId) {
    const res = await fetch(`${API}/modules/${moduleId}`)
    if (res.ok) {
      const data = await res.json()
      setLessons((data.lessons || []).sort((a, b) => a.order_index - b.order_index))
    }
  }

  function getToken() {
    return session?.access_token
  }

  function authHeaders() {
    return {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
    }
  }

  // ----------------------------------------------------------------
  // Users
  // ----------------------------------------------------------------

  async function loadUsers() {
    setUsersLoading(true)
    setUserError(null)
    const res = await fetch(`${API}/admin/users`, {
      headers: { 'Authorization': `Bearer ${getToken()}` },
    })
    const data = await res.json()
    if (!res.ok) return setUserError(data.error)
    setUsers(data.sort((a, b) => a.email.localeCompare(b.email)))
    setUsersLoading(false)
  }

  async function setUserRole(userId, role) {
    setUserError(null)
    const res = await fetch(`${API}/admin/users/${userId}/role`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ role }),
    })
    const data = await res.json()
    if (!res.ok) return setUserError(data.error)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: data.role } : u))
  }

  // ----------------------------------------------------------------
  // Reorder helper - swaps two items' order_index values via 3 PUTs
  // to avoid the unique constraint firing mid-swap.
  // ----------------------------------------------------------------
  async function swapOrderIndex(type, itemA, itemB) {
    const TEMP = 999999
    const base = `${API}/${type}`
    const h = authHeaders()
    await fetch(`${base}/${itemA.id}`, { method: 'PUT', headers: h, body: JSON.stringify({ order_index: TEMP }) })
    await fetch(`${base}/${itemB.id}`, { method: 'PUT', headers: h, body: JSON.stringify({ order_index: itemA.order_index }) })
    await fetch(`${base}/${itemA.id}`, { method: 'PUT', headers: h, body: JSON.stringify({ order_index: itemB.order_index }) })
  }

  // ----------------------------------------------------------------
  // Module CRUD
  // ----------------------------------------------------------------

  async function createModule(e) {
    e.preventDefault()
    setModuleError(null)
    const res = await fetch(`${API}/admin/modules`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        title: newModule.title.trim(),
        description: newModule.description.trim() || undefined,
        order_index: parseInt(newModule.order_index, 10),
      }),
    })
    const data = await res.json()
    if (!res.ok) return setModuleError(data.error)
    setModules(prev => [...prev, data].sort((a, b) => a.order_index - b.order_index))
    setNewModule({ title: '', description: '', order_index: '' })
    setShowNewModule(false)
  }

  async function updateModule(e) {
    e.preventDefault()
    setModuleError(null)
    const res = await fetch(`${API}/modules/${editingModule.id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({
        title: editingModule.title.trim(),
        description: editingModule.description?.trim() || null,
        order_index: parseInt(editingModule.order_index, 10),
      }),
    })
    const data = await res.json()
    if (!res.ok) return setModuleError(data.error)
    setModules(prev => prev.map(m => m.id === data.id ? data : m).sort((a, b) => a.order_index - b.order_index))
    setEditingModule(null)
  }

  async function deleteModule(id) {
    if (!confirm('Delete this module and all its lessons?')) return
    const res = await fetch(`${API}/modules/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${getToken()}` },
    })
    if (res.ok) setModules(prev => prev.filter(m => m.id !== id))
  }

  async function moveModule(index, direction) {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= modules.length) return
    await swapOrderIndex('modules', modules[index], modules[targetIndex])
    await loadModules()
  }

  // ----------------------------------------------------------------
  // Lesson CRUD
  // ----------------------------------------------------------------

  async function createLesson(e) {
    e.preventDefault()
    setLessonError(null)
    const res = await fetch(`${API}/admin/lessons`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        module_id: parseInt(selectedModuleId, 10),
        title: newLesson.title.trim(),
        content: newLesson.content.trim() || undefined,
        order_index: parseInt(newLesson.order_index, 10),
      }),
    })
    const data = await res.json()
    if (!res.ok) return setLessonError(data.error)
    setLessons(prev => [...prev, data].sort((a, b) => a.order_index - b.order_index))
    setNewLesson({ title: '', content: '', order_index: '' })
    setShowNewLesson(false)
  }

  async function updateLesson(e) {
    e.preventDefault()
    setLessonError(null)
    const res = await fetch(`${API}/lessons/${editingLesson.id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({
        title: editingLesson.title.trim(),
        content: editingLesson.content?.trim() || null,
        order_index: parseInt(editingLesson.order_index, 10),
      }),
    })
    const data = await res.json()
    if (!res.ok) return setLessonError(data.error)
    setLessons(prev => prev.map(l => l.id === data.id ? data : l).sort((a, b) => a.order_index - b.order_index))
    setEditingLesson(null)
  }

  async function deleteLesson(id) {
    if (!confirm('Delete this lesson?')) return
    const res = await fetch(`${API}/lessons/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${getToken()}` },
    })
    if (res.ok) setLessons(prev => prev.filter(l => l.id !== id))
  }

  async function moveLesson(index, direction) {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= lessons.length) return
    await swapOrderIndex('lessons', lessons[index], lessons[targetIndex])
    await loadLessons(selectedModuleId)
  }

  // ----------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>

  if (!isAdmin) return (
    <div className="p-8">
      <p className="text-red-500 font-semibold">Access denied - admin role required.</p>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-8 border-b">
        {['modules', 'lessons', 'users'].map(tab => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab)
              if (tab === 'users' && users.length === 0) loadUsers()
            }}
            className={`px-4 py-2 font-medium capitalize transition border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ---- MODULES TAB ---- */}
      {activeTab === 'modules' && (
        <div>
          {moduleError && <p className="mb-4 text-red-500 text-sm">{moduleError}</p>}

          <div className="space-y-2 mb-6">
            {modules.map((mod, i) => (
              <div key={mod.id}>
                {editingModule?.id === mod.id ? (
                  <form onSubmit={updateModule} className="border rounded-xl p-4 bg-blue-50 space-y-2">
                    <div className="flex gap-2">
                      <input
                        value={editingModule.title}
                        onChange={e => setEditingModule(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Title"
                        className="border rounded px-2 py-1 flex-1 text-sm"
                        required
                      />
                      <input
                        type="number"
                        value={editingModule.order_index}
                        onChange={e => setEditingModule(prev => ({ ...prev, order_index: e.target.value }))}
                        placeholder="Order"
                        className="border rounded px-2 py-1 w-20 text-sm"
                        min="1"
                        required
                      />
                    </div>
                    <input
                      value={editingModule.description || ''}
                      onChange={e => setEditingModule(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Description (optional)"
                      className="border rounded px-2 py-1 w-full text-sm"
                    />
                    <div className="flex gap-2">
                      <button type="submit" className="px-3 py-1 bg-gray-900 text-white text-sm rounded">Save</button>
                      <button type="button" onClick={() => setEditingModule(null)} className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <div className="border rounded-xl p-4 bg-white flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-400 mr-2">#{mod.order_index}</span>
                      <span className="font-medium">{mod.title}</span>
                      {mod.description && (
                        <span className="text-sm text-gray-500 ml-2">- {mod.description}</span>
                      )}
                    </div>
                    <div className="flex gap-1 items-center">
                      <button
                        onClick={() => moveModule(i, -1)}
                        disabled={i === 0}
                        title="Move up"
                        className="px-2 py-1 text-sm text-gray-500 hover:text-gray-800 disabled:opacity-25"
                      >↑</button>
                      <button
                        onClick={() => moveModule(i, 1)}
                        disabled={i === modules.length - 1}
                        title="Move down"
                        className="px-2 py-1 text-sm text-gray-500 hover:text-gray-800 disabled:opacity-25"
                      >↓</button>
                      <button
                        onClick={() => { setEditingModule({ ...mod }); setModuleError(null) }}
                        className="px-2 py-1 text-sm text-blue-600 hover:text-blue-800"
                      >Edit</button>
                      <button
                        onClick={() => deleteModule(mod.id)}
                        className="px-2 py-1 text-sm text-red-500 hover:text-red-700"
                      >Delete</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {modules.length === 0 && (
              <p className="text-gray-400 text-sm">No modules yet.</p>
            )}
          </div>

          {showNewModule ? (
            <form onSubmit={createModule} className="border rounded-xl p-4 bg-green-50 space-y-2">
              <h3 className="font-medium text-sm text-gray-700">New Module</h3>
              <div className="flex gap-2">
                <input
                  value={newModule.title}
                  onChange={e => setNewModule(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Title"
                  className="border rounded px-2 py-1 flex-1 text-sm"
                  required
                />
                <input
                  type="number"
                  value={newModule.order_index}
                  onChange={e => setNewModule(prev => ({ ...prev, order_index: e.target.value }))}
                  placeholder="Order"
                  className="border rounded px-2 py-1 w-20 text-sm"
                  min="1"
                  required
                />
              </div>
              <input
                value={newModule.description}
                onChange={e => setNewModule(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description (optional)"
                className="border rounded px-2 py-1 w-full text-sm"
              />
              <div className="flex gap-2">
                <button type="submit" className="px-3 py-1 bg-gray-900 text-white text-sm rounded">Create</button>
                <button type="button" onClick={() => setShowNewModule(false)} className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => { setShowNewModule(true); setModuleError(null) }}
              className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-gray-400 hover:text-gray-700 text-sm"
            >
              + Add Module
            </button>
          )}
        </div>
      )}

      {/* ---- LESSONS TAB ---- */}
      {activeTab === 'lessons' && (
        <div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Module</label>
            <select
              value={selectedModuleId}
              onChange={e => {
                const id = e.target.value
                setSelectedModuleId(id)
                setLessons([])
                setEditingLesson(null)
                setShowNewLesson(false)
                setLessonError(null)
                if (id) loadLessons(id)
              }}
              className="border rounded px-3 py-2 text-sm w-72"
            >
              <option value="">-- choose a module --</option>
              {modules.map(m => (
                <option key={m.id} value={m.id}>{m.order_index}. {m.title}</option>
              ))}
            </select>
          </div>

          {selectedModuleId && (
            <>
              {lessonError && <p className="mb-4 text-red-500 text-sm">{lessonError}</p>}

              <div className="space-y-2 mb-6">
                {lessons.length === 0 && (
                  <p className="text-gray-400 text-sm">No lessons yet in this module.</p>
                )}
                {lessons.map((lesson, i) => (
                  <div key={lesson.id}>
                    {editingLesson?.id === lesson.id ? (
                      <form onSubmit={updateLesson} className="border rounded-xl p-4 bg-blue-50 space-y-2">
                        <div className="flex gap-2">
                          <input
                            value={editingLesson.title}
                            onChange={e => setEditingLesson(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Title"
                            className="border rounded px-2 py-1 flex-1 text-sm"
                            required
                          />
                          <input
                            type="number"
                            value={editingLesson.order_index}
                            onChange={e => setEditingLesson(prev => ({ ...prev, order_index: e.target.value }))}
                            placeholder="Order"
                            className="border rounded px-2 py-1 w-20 text-sm"
                            min="1"
                            required
                          />
                        </div>
                        <textarea
                          value={editingLesson.content || ''}
                          onChange={e => setEditingLesson(prev => ({ ...prev, content: e.target.value }))}
                          placeholder="Content (optional)"
                          rows={4}
                          className="border rounded px-2 py-1 w-full text-sm font-mono"
                        />
                        <div className="flex gap-2">
                          <button type="submit" className="px-3 py-1 bg-gray-900 text-white text-sm rounded">Save</button>
                          <button type="button" onClick={() => setEditingLesson(null)} className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                        </div>
                      </form>
                    ) : (
                      <div className="border rounded-xl p-4 bg-white flex items-center justify-between">
                        <div>
                          <span className="text-xs text-gray-400 mr-2">#{lesson.order_index}</span>
                          <span className="font-medium">{lesson.title}</span>
                        </div>
                        <div className="flex gap-1 items-center">
                          <button
                            onClick={() => moveLesson(i, -1)}
                            disabled={i === 0}
                            title="Move up"
                            className="px-2 py-1 text-sm text-gray-500 hover:text-gray-800 disabled:opacity-25"
                          >↑</button>
                          <button
                            onClick={() => moveLesson(i, 1)}
                            disabled={i === lessons.length - 1}
                            title="Move down"
                            className="px-2 py-1 text-sm text-gray-500 hover:text-gray-800 disabled:opacity-25"
                          >↓</button>
                          <button
                            onClick={() => { setEditingLesson({ ...lesson }); setLessonError(null) }}
                            className="px-2 py-1 text-sm text-blue-600 hover:text-blue-800"
                          >Edit</button>
                          <button
                            onClick={() => deleteLesson(lesson.id)}
                            className="px-2 py-1 text-sm text-red-500 hover:text-red-700"
                          >Delete</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {showNewLesson ? (
                <form onSubmit={createLesson} className="border rounded-xl p-4 bg-green-50 space-y-2">
                  <h3 className="font-medium text-sm text-gray-700">New Lesson</h3>
                  <div className="flex gap-2">
                    <input
                      value={newLesson.title}
                      onChange={e => setNewLesson(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Title"
                      className="border rounded px-2 py-1 flex-1 text-sm"
                      required
                    />
                    <input
                      type="number"
                      value={newLesson.order_index}
                      onChange={e => setNewLesson(prev => ({ ...prev, order_index: e.target.value }))}
                      placeholder="Order"
                      className="border rounded px-2 py-1 w-20 text-sm"
                      min="1"
                      required
                    />
                  </div>
                  <textarea
                    value={newLesson.content}
                    onChange={e => setNewLesson(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Content (optional)"
                    rows={4}
                    className="border rounded px-2 py-1 w-full text-sm font-mono"
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="px-3 py-1 bg-gray-900 text-white text-sm rounded">Create</button>
                    <button type="button" onClick={() => setShowNewLesson(false)} className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => { setShowNewLesson(true); setLessonError(null) }}
                  className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-gray-400 hover:text-gray-700 text-sm"
                >
                  + Add Lesson
                </button>
              )}
            </>
          )}
        </div>
      )}
      {/* ---- USERS TAB ---- */}
      {activeTab === 'users' && (
        <div>
          {userError && <p className="mb-4 text-red-500 text-sm">{userError}</p>}

          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              Role changes take effect on the user's next login.
            </p>
            <button
              onClick={loadUsers}
              className="text-sm text-gray-500 hover:text-gray-800 underline"
            >
              Refresh
            </button>
          </div>

          {usersLoading ? (
            <p className="text-gray-400 text-sm">Loading users...</p>
          ) : (
            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-4 py-3">Email</th>
                    <th className="text-left px-4 py-3">Role</th>
                    <th className="text-left px-4 py-3">Joined</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map(user => (
                    <tr key={user.id} className="bg-white hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">
                        {user.email}
                        {user.id === session?.user?.id && (
                          <span className="ml-2 text-xs text-gray-400">(you)</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'admin'
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {user.id !== session?.user?.id && (
                          user.role === 'admin' ? (
                            <button
                              onClick={() => setUserRole(user.id, 'learner')}
                              className="text-red-500 hover:text-red-700 text-xs font-medium"
                            >
                              Revoke Admin
                            </button>
                          ) : (
                            <button
                              onClick={() => setUserRole(user.id, 'admin')}
                              className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                            >
                              Grant Admin
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-gray-400 text-sm">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
