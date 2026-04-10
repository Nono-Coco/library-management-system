import { useState } from 'react'

const API_URL = 'http://localhost:3001/api'

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

  // 实时验证工号
  const validateEmployeeId = (value) => {
    if (!value.trim()) {
      setFieldErrors(prev => ({ ...prev, employeeId: '请输入工号' }))
      return false
    }
    if (value.length < 3) {
      setFieldErrors(prev => ({ ...prev, employeeId: '工号长度不能少于3位' }))
      return false
    }
    setFieldErrors(prev => ({ ...prev, employeeId: '' }))
    return true
  }

  // 实时验证姓名
  const validateName = (value) => {
    if (!value.trim()) {
      setFieldErrors(prev => ({ ...prev, name: '请输入姓名' }))
      return false
    }
    setFieldErrors(prev => ({ ...prev, name: '' }))
    return true
  }

  // 实时验证密码
  const validatePassword = (value) => {
    if (!value) {
      setFieldErrors(prev => ({ ...prev, password: '请输入密码' }))
      return false
    }
    if (value.length < 6) {
      setFieldErrors(prev => ({ ...prev, password: '密码长度不能少于6位' }))
      return false
    }
    setFieldErrors(prev => ({ ...prev, password: '' }))
    return true
  }

  // 实时验证确认密码
  const validateConfirmPassword = (value) => {
    if (value !== password) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: '两次输入的密码不一致' }))
      return false
    }
    setFieldErrors(prev => ({ ...prev, confirmPassword: '' }))
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // 表单验证
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
      const res = await fetch(`${API_URL}/librarian/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, name, password })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '注册失败')
        setLoading(false)
        return
      }

      setSuccess('注册成功！2秒后跳转到登录页...')
      setTimeout(() => {
        if (onRegister) {
          onRegister()
        }
      }, 2000)
    } catch (err) {
      setError('网络错误，请确保后端已启动')
      setLoading(false)
    }
  }

  // 密码强度检测
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

  const strengthLevels = ['极弱', '弱', '中等', '强', '非常强']
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-green-600']

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
      <div className="bg-white p-8 rounded-lg shadow-xl w-96">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">图书管理员注册</h1>
          <p className="text-gray-500 mt-2">创建您的管理员账号</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 工号输入 */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              工号 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition
                ${fieldErrors.employeeId 
                  ? 'border-red-500 focus:ring-red-200' 
                  : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'}`}
              placeholder="请输入工号（至少3位）"
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

          {/* 姓名输入 */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              姓名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition
                ${fieldErrors.name 
                  ? 'border-red-500 focus:ring-red-200' 
                  : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'}`}
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

          {/* 密码输入 */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              密码 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition pr-10
                  ${fieldErrors.password 
                    ? 'border-red-500 focus:ring-red-200' 
                    : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'}`}
                placeholder="请输入密码（至少6位）"
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
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            
            {/* 密码强度提示 */}
            {password && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <div 
                      key={i}
                      className={`h-1 flex-1 rounded ${i < getPasswordStrength() ? strengthColors[getPasswordStrength()-1] : 'bg-gray-200'}`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  密码强度：{strengthLevels[getPasswordStrength()-1] || '极弱'}
                </p>
              </div>
            )}
            
            {fieldErrors.password && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
            )}
          </div>

          {/* 确认密码输入 */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              确认密码 <span className="text-red-500">*</span>
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition
                ${fieldErrors.confirmPassword 
                  ? 'border-red-500 focus:ring-red-200' 
                  : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'}`}
              placeholder="请再次输入密码"
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

          {/* 错误提示 */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* 成功提示 */}
          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">
              {success}
            </div>
          )}

          {/* 注册按钮 */}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                注册中...
              </span>
            ) : '注册'}
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