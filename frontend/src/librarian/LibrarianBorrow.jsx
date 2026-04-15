import { useEffect, useState } from 'react'
import { API_URL, getAuthHeaders } from './api'

export default function LibrarianBorrow() {
  const [studentKeyword, setStudentKeyword] = useState('')
  const [bookKeyword, setBookKeyword] = useState('')
  const [students, setStudents] = useState([])
  const [books, setBooks] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [selectedBook, setSelectedBook] = useState(null)
  const [loanRecords, setLoanRecords] = useState([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({ total: 0, active: 0, overdue: 0 })

  const searchStudents = async () => {
    setError('')
    setMessage('')
    if (!studentKeyword.trim()) {
      setError('请输入学生学号、姓名或邮箱')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/loans/users/search?keyword=${encodeURIComponent(studentKeyword)}`, {
        headers: getAuthHeaders('librarian'),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || '搜索失败')
      }

      setStudents(data.users || [])
      setSelectedStudent(null)
      if ((data.users || []).length === 0) {
        setMessage('未找到匹配的学生')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const searchBooks = async () => {
    setError('')
    setMessage('')
    if (!bookKeyword.trim()) {
      setError('请输入书名、作者或ISBN')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/loans/books/search?keyword=${encodeURIComponent(bookKeyword)}`, {
        headers: getAuthHeaders('librarian'),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || '搜索失败')
      }

      setBooks(data.books || [])
      setSelectedBook(null)
      if ((data.books || []).length === 0) {
        setMessage('未找到匹配的图书')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchLoanRecords = async () => {
    try {
      const response = await fetch(`${API_URL}/loans/records`, {
        headers: getAuthHeaders('librarian'),
      })
      const data = await response.json()
      if (response.ok) {
        setLoanRecords(data.loans || [])
        setStats(data.stats || { total: 0, active: 0, overdue: 0 })
      }
    } catch (err) {
      console.error('获取借阅记录失败:', err)
    }
  }

  const handleLend = async () => {
    setError('')
    setMessage('')

    if (!selectedStudent || !selectedBook) {
      setError('请先选择学生和图书')
      return
    }

    if (selectedBook.availableCopies === 0) {
      setError('该图书没有可用副本')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/loans/lend`, {
        method: 'POST',
        headers: getAuthHeaders('librarian'),
        body: JSON.stringify({ 
          userId: selectedStudent.id, 
          bookId: selectedBook.id 
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || '借书失败')
      }

      setMessage(`✅ ${data.message}`)
      setSelectedStudent(null)
      setSelectedBook(null)
      setStudents([])
      setBooks([])
      setStudentKeyword('')
      setBookKeyword('')
      fetchLoanRecords()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLoanRecords()
  }, [])

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">📚 借出图书</h2>
        <p className="text-gray-500 text-sm">搜索学生和图书，为学生办理借阅</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 学生搜索 */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">
            👤 搜索学生
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={studentKeyword}
              onChange={(e) => setStudentKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchStudents()}
              className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="学号 / 姓名 / 邮箱"
            />
            <button
              onClick={searchStudents}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
              disabled={loading}
            >
              搜索
            </button>
          </div>
          {students.length > 0 && (
            <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-2">
              {students.map((student) => (
                <div
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={`p-3 rounded-lg cursor-pointer transition ${
                    selectedStudent?.id === student.id
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <div className="font-semibold">{student.name}</div>
                  <div className="text-sm text-gray-600">学号: {student.studentId}</div>
                  <div className="text-sm text-gray-500">{student.email}</div>
                  <div className="flex gap-3 mt-1 text-xs">
                    <span className={`${student.stats?.hasOverdue ? 'text-red-500' : 'text-green-500'}`}>
                      借阅: {student.stats?.currentBorrowCount || 0} 本
                    </span>
                    {student.stats?.hasOverdue && (
                      <span className="text-red-500 font-semibold">⚠️ 有逾期</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 图书搜索 */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">
            📖 搜索图书
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={bookKeyword}
              onChange={(e) => setBookKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchBooks()}
              className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="书名 / 作者 / ISBN"
            />
            <button
              onClick={searchBooks}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
              disabled={loading}
            >
              搜索
            </button>
          </div>
          {books.length > 0 && (
            <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-2">
              {books.map((book) => (
                <div
                  key={book.id}
                  onClick={() => setSelectedBook(book)}
                  className={`p-3 rounded-lg cursor-pointer transition ${
                    selectedBook?.id === book.id
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <div className="font-semibold">{book.title}</div>
                  <div className="text-sm text-gray-600">{book.author}</div>
                  <div className="text-sm text-gray-500">ISBN: {book.isbn}</div>
                  <div className="mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      book.availableCopies > 0 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      可借: {book.availableCopies} / {book.totalCopies}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 已选信息 */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex gap-6">
          <div>
            <span className="text-gray-500 text-sm">已选学生：</span>
            <span className="font-semibold">
              {selectedStudent ? `${selectedStudent.name} (${selectedStudent.studentId})` : '未选择'}
            </span>
          </div>
          <div>
            <span className="text-gray-500 text-sm">已选图书：</span>
            <span className="font-semibold">
              {selectedBook ? `${selectedBook.title} (可借: ${selectedBook.availableCopies})` : '未选择'}
            </span>
          </div>
        </div>
      </div>

      {/* 消息 */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg">
          ❌ {error}
        </div>
      )}
      {message && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg">
          {message}
        </div>
      )}

      {/* 借书按钮 */}
      <button
        onClick={handleLend}
        disabled={loading || !selectedStudent || !selectedBook}
        className="mt-4 bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
      >
        {loading ? '处理中...' : '✅ 确认借书'}
      </button>

      {/* 当前借阅记录 */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">📋 当前借阅记录</h3>
          <div className="flex gap-3 text-sm">
            <span className="text-blue-600">在借: {stats.active}</span>
            <span className="text-red-600">逾期: {stats.overdue}</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">学生</th>
                <th className="px-4 py-2 text-left">图书</th>
                <th className="px-4 py-2 text-left">借出日期</th>
                <th className="px-4 py-2 text-left">应还日期</th>
                <th className="px-4 py-2 text-left">状态</th>
              </tr>
            </thead>
            <tbody>
              {loanRecords.slice(0, 10).map((loan) => (
                <tr key={loan.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{loan.user?.name}</td>
                  <td className="px-4 py-2">{loan.copy?.book?.title}</td>
                  <td className="px-4 py-2">{new Date(loan.checkoutDate).toLocaleDateString()}</td>
                  <td className="px-4 py-2">{new Date(loan.dueDate).toLocaleDateString()}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      loan.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {loan.status === 'overdue' ? '逾期' : '在借'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}