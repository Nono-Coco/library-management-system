import { useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export default function LibrarianRegister({ onRegister, onSwitchToLogin }) {
  const [employeeId, setEmployeeId] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  // 验证函数
  const validateEmployeeId = (value) => {
    if (!value.trim()) {
      setFieldErrors(prev => ({ ...prev, employeeId: '请输入工号' }))
      return false
    }
    if (value.length < 3) {
      setFieldErrors(prev => ({ ...prev, employeeId: '工号至少3位' }))
      return false
    }
    setFieldErrors(prev => ({ ...prev, employeeId: '' }))
    return true
  }

  const validateName = (value) => {
    if (!value.trim()) {
      setFieldErrors(prev => ({ ...prev, name: '请输入姓名' }))
      return false
    }
    if (value.length < 2) {
      setFieldErrors(prev => ({ ...prev, name: '姓名至少2位' }))
      return false
    }
    setFieldErrors(prev => ({ ...prev, name: '' }))
    return true
  }

  const validatePassword = (value) => {
    if (!value) {
      setFieldErrors(prev => ({ ...prev, password: '请输入密码' }))
      return false
    }
    if (value.length < 6) {
      setFieldErrors(prev => ({ ...prev, password: '密码至少6位' }))
      return false
    }
    setFieldErrors(prev => ({ ...prev, password: '' }))
    return true
  }

  const validateConfirmPassword = (value) => {
    if (value !== password) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: '两次密码不一致' }))
      return false
    }
    setFieldErrors(prev => ({ ...prev, confirmPassword: '' }))
    return true
  }

  const getPasswordStrength = () => {
    if (!password) return 0
    let strength = 0
    if (password.length >= 6) strength++
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    return Math.min(strength, 4)
  }

  const strengthLevels = ['弱', '一般', '中等', '强', '很强']
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-green-600']

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const isEmployeeIdValid = validateEmployeeId(employeeId)
    const isNameValid = validateName(name)
    const isPasswordValid = validatePassword(password)
    const isConfirmValid = validateConfirmPassword(confirmPassword)
    
    if (!isEmployeeIdValid || !isNameValid || !isPasswordValid || !isConfirmValid) {
      setError('请正确填写所有信息')
      return
    }

    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, name, password })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || '注册失败')
      }

      setSuccess('注册成功！即将跳转到登录页...')
      setTimeout(() => {
        onRegister?.()
      }, 1500)
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
          <h1 className="text-2xl font-bold text-gray-800">图书管理员注册</h1>
          <p className="text-gray-500 mt-2">创建您的管理员账号</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 工号 */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              工号 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition
                ${fieldErrors.employeeId ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="至少3位"
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

          {/* 姓名 */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              姓名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition
                ${fieldErrors.name ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="请输入姓名"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                validateName(e.target.value)
              }}
              disabled={loading}
            />
            {fieldErrors.name && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>
            )}
          </div>

          {/* 密码 */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              密码 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition pr-12
                  ${fieldErrors.password ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="至少6位"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  validatePassword(e.target.value)
                  if (confirmPassword) validateConfirmPassword(confirmPassword)
                }}
                disabled={loading}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {password && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full ${i < getPasswordStrength() ? strengthColors[getPasswordStrength()-1] : 'bg-gray-200'}`} />
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">强度：{strengthLevels[getPasswordStrength()-1] || '弱'}</p>
              </div>
            )}
            {fieldErrors.password && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
            )}
          </div>

          {/* 确认密码 */}
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              确认密码 <span className="text-red-500">*</span>
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition
                ${fieldErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="再次输入密码"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                validateConfirmPassword(e.target.value)
              }}
              disabled={loading}
            />
            {fieldErrors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          {/* 错误/成功提示 */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
              ❌ {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-xl text-sm">
              ✅ {success}
            </div>
          )}

          {/* 注册按钮 */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition disabled:opacity-50 font-semibold shadow-lg"
            disabled={loading}
          >
            {loading ? '注册中...' : '注 册'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          已有账号？{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-blue-500 hover:text-blue-600 hover:underline font-semibold"
            disabled={loading}
          >
            返回登录
          </button>
        </p>
      </div>
    </div>
  )
}