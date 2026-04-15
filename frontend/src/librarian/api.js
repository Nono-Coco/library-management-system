const DEFAULT_API_URL = 'http://localhost:3001/api'

export const API_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/$/, '')

// 兼容旧的导出名
export const LIBRARIAN_API_URL = API_URL

// 获取认证头
export const getAuthHeaders = (type = 'librarian') => {
  const token = localStorage.getItem(type === 'librarian' ? 'librarianToken' : 'token')
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  }
}

// 检查是否已登录
export const isLibrarianAuthenticated = () => {
  const token = localStorage.getItem('librarianToken')
  const info = localStorage.getItem('librarianInfo')
  return !!(token && info)
}

// 登出
export const librarianLogout = () => {
  localStorage.removeItem('librarianToken')
  localStorage.removeItem('librarianInfo')
  localStorage.removeItem('savedEmployeeId')
}