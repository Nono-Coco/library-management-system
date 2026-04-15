import { useState, useEffect } from 'react'
import LibrarianLogin from './LibrarianLogin'
import LibrarianRegister from './LibrarianRegister'
import LibrarianDashboard from './LibrarianDashboard'
<<<<<<< HEAD
import { isLibrarianAuthenticated, librarianLogout } from './api'
=======
>>>>>>> ddb6f928a0a4d415de4bcd19023920f056be6972

function LibrarianApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [librarian, setLibrarian] = useState(null)
  const [showRegister, setShowRegister] = useState(false)
<<<<<<< HEAD
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
=======

  useEffect(() => {
    const token = localStorage.getItem('librarianToken')
    const savedLibrarian = localStorage.getItem('librarianInfo')
    
    if (token && savedLibrarian) {
      setIsLoggedIn(true)
      setLibrarian(JSON.parse(savedLibrarian))
    }
>>>>>>> ddb6f928a0a4d415de4bcd19023920f056be6972
  }, [])

  const handleLogin = (user, token) => {
    localStorage.setItem('librarianToken', token)
    localStorage.setItem('librarianInfo', JSON.stringify(user))
    setIsLoggedIn(true)
    setLibrarian(user)
    setShowRegister(false)
  }

  const handleLogout = () => {
<<<<<<< HEAD
    librarianLogout()
=======
    localStorage.removeItem('librarianToken')
    localStorage.removeItem('librarianInfo')
>>>>>>> ddb6f928a0a4d415de4bcd19023920f056be6972
    setIsLoggedIn(false)
    setLibrarian(null)
  }

  const handleRegisterSuccess = () => {
    setShowRegister(false)
  }

<<<<<<< HEAD
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (isLoggedIn && librarian) {
=======
  if (isLoggedIn) {
>>>>>>> ddb6f928a0a4d415de4bcd19023920f056be6972
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