import { useEffect, useState } from 'react'
import { API_URL, getAuthHeaders } from './api'

export default function LibrarianReturnBooks({ onBack }) {
  const [loans, setLoans] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoanId, setActionLoanId] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [stats, setStats] = useState({ total: 0, active: 0, overdue: 0 })

  const fetchActiveLoans = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(`${API_URL}/loans/records`, {
        headers: getAuthHeaders('librarian'),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || '获取借阅记录失败')
      }

      setLoans(data.loans || [])
      setStats(data.stats || { total: 0, active: 0, overdue: 0 })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReturn = async (loanId, waiveFine = false) => {
    const loan = loans.find(l => l.id === loanId)
    const confirmMsg = waiveFine && loan?.estimatedFine > 0
      ? `确定接收归还并免除 ${loan.estimatedFine} 元罚款吗？`
      : '确认接收该图书归还吗？'

    if (!window.confirm(confirmMsg)) {
      return
    }

    try {
      setActionLoanId(loanId)
      setError('')
      setMessage('')

      const response = await fetch(`${API_URL}/loans/return`, {
        method: 'POST',
        headers: getAuthHeaders('librarian'),
        body: JSON.stringify({ loanId, waiveFine }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || '还书失败')
      }

      setMessage(`✅ ${data.message}`)
      await fetchActiveLoans()
      
      // 3秒后清除消息
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoanId(null)
    }
  }

  useEffect(() => {
    fetchActiveLoans()
  }, [])

  const filteredLoans = loans.filter((loan) => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return true

    return (
      String(loan.id).includes(keyword) ||
      loan.user?.name?.toLowerCase().includes(keyword) ||
      loan.user?.studentId?.toLowerCase().includes(keyword) ||
      loan.copy?.book?.title?.toLowerCase().includes(keyword) ||
      loan.copy?.barcode?.toLowerCase().includes(keyword)
    )
  })

  const activeLoans = filteredLoans.filter(l => !l.returnDate)
  const overdueLoans = activeLoans.filter(l => new Date(l.dueDate) < new Date())

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">📥 接收还书</h2>
          <p className="text-gray-500 text-sm">查看在借记录，接收归还并更新状态</p>
        </div>
        <div className="flex gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
            >
              ← 返回
            </button>
          )}
          <button
            onClick={fetchActiveLoans}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            disabled={loading}
          >
            🔄 刷新
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{activeLoans.length}</div>
          <div className="text-sm text-gray-600">在借中</div>
        </div>
        <div className="bg-red-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{overdueLoans.length}</div>
          <div className="text-sm text-gray-600">已逾期</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {activeLoans.length - overdueLoans.length}
          </div>
          <div className="text-sm text-gray-600">正常</div>
        </div>
      </div>

      {/* 搜索框 */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="🔍 搜索借阅ID、学生姓名、学号、书名、条码..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>

      {/* 消息 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg">
          ❌ {error}
        </div>
      )}
      {message && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg">
          {message}
        </div>
      )}

      {/* 借阅列表 */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">加载中...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-3 text-left">ID</th>
                <th className="px-3 py-3 text-left">学生</th>
                <th className="px-3 py-3 text-left">学号</th>
                <th className="px-3 py-3 text-left">图书</th>
                <th className="px-3 py-3 text-left">条码</th>
                <th className="px-3 py-3 text-left">借出日期</th>
                <th className="px-3 py-3 text-left">应还日期</th>
                <th className="px-3 py-3 text-left">状态</th>
                <th className="px-3 py-3 text-left">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredLoans.filter(l => !l.returnDate).length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-gray-500">
                    当前没有在借记录
                  </td>
                </tr>
              ) : (
                filteredLoans
                  .filter(l => !l.returnDate)
                  .map((loan) => {
                    const isOverdue = new Date(loan.dueDate) < new Date()
                    const daysOverdue = isOverdue
                      ? Math.ceil((new Date() - new Date(loan.dueDate)) / (1000 * 60 * 60 * 24))
                      : 0
                    const estimatedFine = isOverdue ? daysOverdue * 0.5 : 0

                    return (
                      <tr key={loan.id} className={`border-b hover:bg-gray-50 ${isOverdue ? 'bg-red-50' : ''}`}>
                        <td className="px-3 py-3">{loan.id}</td>
                        <td className="px-3 py-3 font-medium">{loan.user?.name || '-'}</td>
                        <td className="px-3 py-3">{loan.user?.studentId || '-'}</td>
                        <td className="px-3 py-3">{loan.copy?.book?.title || '-'}</td>
                        <td className="px-3 py-3 text-gray-500">{loan.copy?.barcode || '-'}</td>
                        <td className="px-3 py-3">{new Date(loan.checkoutDate).toLocaleDateString()}</td>
                        <td className="px-3 py-3">
                          <span className={isOverdue ? 'text-red-600 font-semibold' : ''}>
                            {new Date(loan.dueDate).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          {isOverdue ? (
                            <div>
                              <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                                逾期 {daysOverdue} 天
                              </span>
                              <div className="text-xs text-red-500 mt-1">
                                罚款: ¥{estimatedFine}
                              </div>
                            </div>
                          ) : (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                              在借中
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReturn(loan.id, false)}
                              disabled={actionLoanId === loan.id}
                              className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50 text-xs"
                            >
                              {actionLoanId === loan.id ? '处理中' : '归还'}
                            </button>
                            {isOverdue && estimatedFine > 0 && (
                              <button
                                onClick={() => handleReturn(loan.id, true)}
                                disabled={actionLoanId === loan.id}
                                className="px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50 text-xs"
                              >
                                免罚归还
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}