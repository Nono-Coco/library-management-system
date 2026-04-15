import { useState, useEffect } from 'react'
import LibrarianLogin from './LibrarianLogin'
import LibrarianRegister from './LibrarianRegister'
import LibrarianDashboard from './LibrarianDashboard'
import { isLibrarianAuthenticated, librarianLogout } from './api'

function LibrarianApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [librarian, setLibrarian] = useState(null)
  const [showRegister, setShowRegister] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 检查登录状态
    if (isLibrarianAuthenticated()) {
      const savedLibrarian = localStorage.getItem('librarianInfo')
      if (savedLibrarian) {
        try {
          setLibrarian(JSON.parse(savedLibrarian))
          setIsLoggedIn(true)
        } catch (e) {
          librarianLogout()
        }
      }
    }
    setLoading(false)
  }, [])

  const handleLogin = (user, token) => {
    localStorage.setItem('librarianToken', token)
    localStorage.setItem('librarianInfo', JSON.stringify(user))
    setIsLoggedIn(true)
    setLibrarian(user)
    setShowRegister(false)
  }

  const handleLogout = () => {
    librarianLogout()
    setIsLoggedIn(false)
    setLibrarian(null)
  }

  const handleRegisterSuccess = () => {
    setShowRegister(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (isLoggedIn && librarian) {
    return <LibrarianDashboard librarian={librarian} onLogout={handleLogout} />
  }

  if (showRegister) {
    return (
      <LibrarianRegister 
        onRegister={handleRegisterSuccess} 
        onSwitchToLogin={() => setShowRegister(false)} 
      />
    )
  }

  return (
    <LibrarianLogin 
      onLogin={handleLogin} 
      onSwitchToRegister={() => setShowRegister(true)} 
    />
  )
}

export default LibrarianApp