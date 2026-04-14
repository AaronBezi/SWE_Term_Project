import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Modules from './pages/Modules'
import LessonView from './pages/LessonView'
import Dashboard from './pages/Dashboard'
import AdminPanel from './pages/AdminPanel'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/modules" element={<Modules />} />
          <Route path="/lessons/:id" element={<LessonView />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}