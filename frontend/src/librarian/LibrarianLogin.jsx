import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export default function LibrarianLogin({ onLogin, onSwitchToRegister }) {
  const [employeeId, setEmployeeId] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  // 加载保存的工号
  useEffect(() => {
    const savedId = localStorage.getItem('savedEmployeeId')
    if (savedId) {
      setEmployeeId(savedId)
      setRememberMe(true)
    }
  }, [])

  // 实时验证
  const validateEmployeeId = (value) => {
    if (!value.trim()) {
      setFieldErrors(prev => ({ ...prev, employeeId: '请输入工号' }))
      return false
    }
    setFieldErrors(prev => ({ ...prev, employeeId: '' }))
    return true
  }

  const validatePassword = (value) => {
    if (!value) {
      setFieldErrors(prev => ({ ...prev, password: '请输入密码' }))
      return false
    }
    setFieldErrors(prev => ({ ...prev, password: '' }))
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const isEmployeeIdValid = validateEmployeeId(employeeId)
    const isPasswordValid = validatePassword(password)
    
    if (!isEmployeeIdValid || !isPasswordValid) {
      setError('请填写完整信息')
      return
    }

    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: employeeId,  // 馆员登录使用工号作为 email 字段
          password, 
          type: 'librarian' 
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || '登录失败')
      }

      // 记住工号
      if (rememberMe) {
        localStorage.setItem('savedEmployeeId', employeeId)
      } else {
        localStorage.removeItem('savedEmployeeId')
      }

      // 保存 token 和用户信息
      localStorage.setItem('librarianToken', data.token)
      localStorage.setItem('librarianInfo', JSON.stringify(data.librarian))
      
      onLogin(data.librarian, data.token)
    } catch (err) {
      setError(err.message || '网络错误，请确保后端已启动')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-96">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">📚</div>
          <h1 className="text-2xl font-bold text-gray-800">图书管理员登录</h1>
          <p className="text-gray-500 mt-2">欢迎回来！请登录您的账号</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 工号输入 */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              工号 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition
                ${fieldErrors.employeeId 
                  ? 'border-red-500 focus:ring-red-200' 
                  : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'}`}
              placeholder="请输入工号"
              value={employeeId}
              onChange={(e) => {
                setEmployeeId(e.target.value)
                validateEmployeeId(e.target.value)
              }}
              disabled={loading}
              autoFocus
            />
            {fieldErrors.employeeId && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.employeeId}</p>
            )}
          </div>

          {/* 密码输入 */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              密码 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition pr-12
                  ${fieldErrors.password 
                    ? 'border-red-500 focus:ring-red-200' 
                    : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'}`}
                placeholder="请输入密码"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  validatePassword(e.target.value)
                }}
                disabled={loading}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
            )}
          </div>

          {/* 记住我 */}
          <div className="mb-6 flex items-center">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 mr-2 text-blue-500 rounded focus:ring-blue-500"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="text-sm text-gray-600">记住工号</span>
            </label>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
              ❌ {error}
            </div>
          )}

          {/* 登录按钮 */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                登录中...
              </span>
            ) : '登 录'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          还没有账号？{' '}
          <button
            onClick={onSwitchToRegister}
            className="text-blue-500 hover:text-blue-600 hover:underline font-semibold"
            disabled={loading}
          >
            立即注册
          </button>
        </p>
      </div>
    </div>
  )
}