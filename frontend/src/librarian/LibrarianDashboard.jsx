import { useState } from 'react'

export default function LibrarianDashboard({ librarian, onLogout }) {
  const [showConfirm, setShowConfirm] = useState(false)

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
    if (hour < 12) return '早上好'
    if (hour < 18) return '下午好'
    return '晚上好'
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部导航栏 */}
      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="text-2xl">📚</div>
            <h1 className="text-xl font-bold text-gray-800">图书馆管理系统</h1>
            <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">图书管理员</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">{getGreeting()}</p>
              <p className="font-semibold text-gray-800">{librarian?.name}</p>
              <p className="text-xs text-gray-400">工号：{librarian?.employeeId}</p>
            </div>
            <button
              onClick={() => setShowConfirm(true)}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition text-sm"
            >
              退出登录
            </button>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 欢迎卡片 */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 mb-8 text-white">
          <h2 className="text-2xl font-bold mb-2">
            {getGreeting()}，{librarian?.name}！
          </h2>
          <p className="opacity-90">欢迎回来，您可以通过下方功能管理图书馆系统。</p>
        </div>

        {/* 功能卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition">
            <div className="text-4xl mb-4">📖</div>
            <h2 className="text-xl font-bold mb-2">图书管理</h2>
            <p className="text-gray-500 text-sm mb-4">添加、编辑、删除图书信息</p>
            <button className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">
              进入 →
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition">
            <div className="text-4xl mb-4">📋</div>
            <h2 className="text-xl font-bold mb-2">借阅管理</h2>
            <p className="text-gray-500 text-sm mb-4">管理借阅记录、处理还书</p>
            <button className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">
              进入 →
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition">
            <div className="text-4xl mb-4">👥</div>
            <h2 className="text-xl font-bold mb-2">读者管理</h2>
            <p className="text-gray-500 text-sm mb-4">查看读者信息、借阅历史</p>
            <button className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">
              进入 →
            </button>
          </div>
        </div>
      </main>

      {/* 退出确认弹窗 */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-80">
            <h3 className="text-lg font-bold mb-4">确认退出</h3>
            <p className="text-gray-600 mb-6">确定要退出登录吗？</p>
            <div className="flex gap-3">
              <button
                onClick={handleLogout}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition"
              >
                确定
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}