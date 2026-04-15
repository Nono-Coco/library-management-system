import { useState, useEffect } from 'react'
import LibrarianBookManager from './LibrarianBookManager'
import LibrarianBorrow from './LibrarianBorrow'
import LibrarianReturnBooks from './LibrarianReturnBooks'
import { API_URL, getAuthHeaders } from './api'

export default function LibrarianDashboard({ librarian, onLogout }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [activeTab, setActiveTab] = useState('home')
  const [stats, setStats] = useState({
    totalBooks: 0,
    activeLoans: 0,
    overdueLoans: 0,
    totalStudents: 0
  })
  const [loading, setLoading] = useState(true)

  // 获取统计数据
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 获取图书数量
        const booksRes = await fetch(`${API_URL}/books`, {
          headers: getAuthHeaders('librarian')
        })
        const booksData = await booksRes.json()
        
        // 获取借阅记录
        const loansRes = await fetch(`${API_URL}/loans/records`, {
          headers: getAuthHeaders('librarian')
        })
        const loansData = await loansRes.json()

        setStats({
          totalBooks: booksData.data?.length || 0,
          activeLoans: loansData.stats?.active || 0,
          overdueLoans: loansData.stats?.overdue || 0,
          totalStudents: 0 // 可以从其他接口获取
        })
      } catch (error) {
        console.error('获取统计数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('librarianToken')
    localStorage.removeItem('librarianInfo')
    localStorage.removeItem('savedEmployeeId')
    if (onLogout) {
      onLogout()
    }
  }

  // 获取当前时间问候语
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 6) return '夜深了'
    if (hour < 9) return '早上好'
    if (hour < 12) return '上午好'
    if (hour < 14) return '中午好'
    if (hour < 18) return '下午好'
    if (hour < 22) return '晚上好'
    return '夜深了'
  }

  // 获取当前日期
  const getCurrentDate = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
    const weekday = weekdays[now.getDay()]
    return `${year}年${month}月${day}日 ${weekday}`
  }

  // 渲染不同内容
  const renderContent = () => {
    // 图书管理页面
    if (activeTab === 'books') {
      return (
        <LibrarianBookManager 
          librarian={librarian} 
          onBack={() => setActiveTab('home')} 
          onLogout={handleLogout} 
        />
      )
    }
    
    // 借阅管理页面（借书）
    if (activeTab === 'borrow') {
      return (
        <div>
          <button
            onClick={() => setActiveTab('home')}
            className="mb-4 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition flex items-center gap-2"
          >
            <span>←</span> 返回仪表盘
          </button>
          <LibrarianBorrow />
        </div>
      )
    }

    // 还书管理页面
    if (activeTab === 'return') {
      return (
        <LibrarianReturnBooks onBack={() => setActiveTab('home')} />
      )
    }
    
    // 首页仪表盘
    return (
      <>
        {/* 欢迎卡片 */}
        <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl shadow-xl p-8 mb-8 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-100 mb-2">{getCurrentDate()}</p>
              <h2 className="text-3xl font-bold mb-2">
                {getGreeting()}，{librarian?.name}！
              </h2>
              <p className="text-blue-100 text-lg">欢迎回到图书馆管理系统</p>
            </div>
            <div className="text-6xl">📚</div>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer" onClick={() => setActiveTab('books')}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">馆藏图书</p>
                <p className="text-3xl font-bold text-gray-800">
                  {loading ? '...' : stats.totalBooks}
                </p>
                <p className="text-gray-400 text-xs mt-2">本</p>
              </div>
              <div className="text-4xl">📖</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer" onClick={() => setActiveTab('borrow')}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">在借图书</p>
                <p className="text-3xl font-bold text-blue-600">
                  {loading ? '...' : stats.activeLoans}
                </p>
                <p className="text-gray-400 text-xs mt-2">本</p>
              </div>
              <div className="text-4xl">📋</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer" onClick={() => setActiveTab('return')}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">逾期图书</p>
                <p className={`text-3xl font-bold ${stats.overdueLoans > 0 ? 'text-red-600' : 'text-gray-800'}`}>
                  {loading ? '...' : stats.overdueLoans}
                </p>
                <p className="text-gray-400 text-xs mt-2">本待处理</p>
              </div>
              <div className="text-4xl">⚠️</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">今日借阅</p>
                <p className="text-3xl font-bold text-green-600">-</p>
                <p className="text-gray-400 text-xs mt-2">本</p>
              </div>
              <div className="text-4xl">📅</div>
            </div>
          </div>
        </div>

        {/* 功能卡片 */}
        <h3 className="text-xl font-bold text-gray-800 mb-4">⚡ 快速操作</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 图书管理卡片 */}
          <div 
            className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition cursor-pointer border-2 border-transparent hover:border-blue-300"
            onClick={() => setActiveTab('books')}
          >
            <div className="text-5xl mb-4">📖</div>
            <h2 className="text-xl font-bold mb-2 text-gray-800">图书管理</h2>
            <p className="text-gray-500 text-sm mb-4">添加新书、编辑信息、管理副本、删除图书记录</p>
            <div className="flex items-center text-blue-500 font-semibold">
              进入图书管理 <span className="ml-2">→</span>
            </div>
          </div>

          {/* 借书管理卡片 */}
          <div 
            className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition cursor-pointer border-2 border-transparent hover:border-green-300"
            onClick={() => setActiveTab('borrow')}
          >
            <div className="text-5xl mb-4">📤</div>
            <h2 className="text-xl font-bold mb-2 text-gray-800">借出图书</h2>
            <p className="text-gray-500 text-sm mb-4">搜索学生、查找图书、办理借阅、记录应还日期</p>
            <div className="flex items-center text-green-500 font-semibold">
              进入借书管理 <span className="ml-2">→</span>
            </div>
          </div>

          {/* 还书管理卡片 */}
          <div 
            className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition cursor-pointer border-2 border-transparent hover:border-orange-300"
            onClick={() => setActiveTab('return')}
          >
            <div className="text-5xl mb-4">📥</div>
            <h2 className="text-xl font-bold mb-2 text-gray-800">归还图书</h2>
            <p className="text-gray-500 text-sm mb-4">查看在借记录、接收归还、处理逾期罚款</p>
            <div className="flex items-center text-orange-500 font-semibold">
              进入还书管理 <span className="ml-2">→</span>
            </div>
          </div>
        </div>

        {/* 快捷提示 */}
        <div className="mt-8 bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-start gap-3">
            <span className="text-blue-500 text-xl">💡</span>
            <div>
              <p className="font-semibold text-blue-800 mb-1">操作提示</p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 借书前请确认学生是否有逾期未还的图书</li>
                <li>• 还书时系统会自动计算逾期罚款金额</li>
                <li>• 删除图书前请确保没有未归还的借阅记录</li>
              </ul>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部导航栏 */}
      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl">📚</div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">图书馆管理系统</h1>
                <p className="text-sm text-gray-500">图书管理员工作台</p>
              </div>
              <span className="bg-blue-100 text-blue-600 text-xs px-3 py-1 rounded-full font-semibold">
                馆员
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              {/* 快捷导航 */}
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('home')}
                  className={`px-3 py-1.5 rounded-lg text-sm transition ${
                    activeTab === 'home' 
                      ? 'bg-blue-500 text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  首页
                </button>
                <button
                  onClick={() => setActiveTab('books')}
                  className={`px-3 py-1.5 rounded-lg text-sm transition ${
                    activeTab === 'books' 
                      ? 'bg-blue-500 text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  图书管理
                </button>
                <button
                  onClick={() => setActiveTab('borrow')}
                  className={`px-3 py-1.5 rounded-lg text-sm transition ${
                    activeTab === 'borrow' 
                      ? 'bg-blue-500 text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  借书
                </button>
                <button
                  onClick={() => setActiveTab('return')}
                  className={`px-3 py-1.5 rounded-lg text-sm transition ${
                    activeTab === 'return' 
                      ? 'bg-blue-500 text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  还书
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm text-gray-500">{getGreeting()}</p>
                  <p className="font-semibold text-gray-800">{librarian?.name}</p>
                  <p className="text-xs text-gray-400">工号：{librarian?.employeeId}</p>
                </div>
                <button
                  onClick={() => setShowConfirm(true)}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition text-sm font-semibold"
                >
                  退出
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {renderContent()}
      </main>

      {/* 退出确认弹窗 */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-96">
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">👋</div>
              <h3 className="text-xl font-bold text-gray-800">确认退出</h3>
              <p className="text-gray-500 mt-1">确定要退出登录吗？</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                取消
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 bg-red-500 text-white py-2.5 rounded-lg hover:bg-red-600 transition font-semibold"
              >
                确定退出
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}