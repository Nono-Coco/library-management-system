import { useEffect, useState } from 'react'
import { LIBRARIAN_API_URL } from './api'

const initialForm = {
  title: '',
  author: '',
  isbn: '',
  genre: '',
  description: '',
  language: 'English',
  floor: 1,
  libraryArea: '',
  shelfNo: 'A',
  shelfLevel: 1,
};

function normalizeBookToForm(book) {
  return {
    title: book.title || '',
    author: book.author || '',
    isbn: book.isbn || '',
    genre: book.genre || '',
    description: book.description || '',
    language: book.language || 'English',
    floor: book.floor || 1,
    libraryArea: book.libraryArea || '',
    shelfNo: book.shelfNo || 'A',
    shelfLevel: book.shelfLevel || 1,
  };
}

function formatDate(value) {
  if (!value) return '暂无'
  return new Date(value).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function LibrarianBookManager({ librarian, onBack, onLogout }) {
  const [books, setBooks] = useState([])
  const [form, setForm] = useState(initialForm)
  const [editingBookId, setEditingBookId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const isEditing = editingBookId !== null

  const fetchBooks = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${LIBRARIAN_API_URL}/books`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '获取图书列表失败')
      setBooks(Array.isArray(data.data) ? data.data : [])
    } catch (fetchError) {
      setError(fetchError.message || '获取图书列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchBooks()
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleUnauthorized = () => {
    setError('登录状态已失效，请重新登录')
    if (onLogout) onLogout()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!form.title.trim() || !form.author.trim() || !form.isbn.trim() || !form.genre.trim()) {
      setError('请填写完整的图书基础信息')
      return
    }

    setSaving(true)

    try {
      const token = localStorage.getItem('librarianToken')
      const response = await fetch(
        isEditing
          ? `${LIBRARIAN_API_URL}/books/${editingBookId}`
          : `${LIBRARIAN_API_URL}/books`,
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(form),
        }
      )

      const data = await response.json()

      if (response.status === 401) {
        handleUnauthorized()
        return
      }

      if (!response.ok) {
        throw new Error(data.error || (isEditing ? '更新图书失败' : '新增图书失败'))
      }

      setBooks((current) => {
        if (isEditing) {
          return current.map((book) => (book.id === data.book.id ? data.book : book))
        }
        return [...current, data.book].sort((left, right) => left.id - right.id)
      })
      setForm(initialForm)
      setEditingBookId(null)
      setSuccess(isEditing ? `已更新《${data.book.title}》` : '图书新增成功')
    } catch (submitError) {
      setError(submitError.message || (isEditing ? '更新图书失败' : '新增图书失败'))
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (book) => {
    setEditingBookId(book.id)
    setForm(normalizeBookToForm(book))
    setError('')
    setSuccess('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (book) => {
    const confirmed = window.confirm(`确定删除《${book.title}》吗？`)
    if (!confirmed) return

    setDeletingId(book.id)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('librarianToken')
      const response = await fetch(`${LIBRARIAN_API_URL}/books/${book.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()

      if (response.status === 401) {
        handleUnauthorized()
        return
      }

      if (!response.ok) {
        throw new Error(data.error || '删除图书失败')
      }

      setBooks((current) => current.filter((item) => item.id !== book.id))
      if (editingBookId === book.id) {
        setEditingBookId(null)
        setForm(initialForm)
      }
      setSuccess(`已删除《${book.title}》`)
    } catch (deleteError) {
      setError(deleteError.message || '删除图书失败')
    } finally {
      setDeletingId(null)
    }
  }

  const handleReset = () => {
    setEditingBookId(null)
    setForm(initialForm)
    setError('')
    setSuccess('')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
            >
              返回
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">图书管理</h1>
              <p className="text-sm text-gray-500">新增图书并管理现有馆藏记录</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500">
              当前管理员：
              <span className="ml-1 font-semibold text-gray-700">
                {librarian?.name}（{librarian?.employeeId}）
              </span>
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
            >
              退出登录
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 xl:grid-cols-[380px_minmax(0,1fr)] gap-6">
        <section className="bg-white rounded-2xl shadow-lg p-6 h-fit">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              {isEditing ? '编辑图书' : '新增图书'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {isEditing ? '可在这里修正图书信息和书架位置' : '带 * 的字段为必填项'}
            </p>
          </div>

          {isEditing && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              正在编辑已有馆藏记录。修改完成后点击"保存修改"，或点"取消编辑"返回新增模式。
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">书名 *</label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                placeholder="请输入书名"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">作者 *</label>
              <input
                name="author"
                value={form.author}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                placeholder="请输入作者"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">ISBN *</label>
              <input
                name="isbn"
                value={form.isbn}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                placeholder="请输入唯一 ISBN"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">分类 *</label>
              <input
                name="genre"
                value={form.genre}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                placeholder="如：Technology / Literature"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">语言</label>
              <input
                name="language"
                value={form.language}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
              />
            </div>

            {/* 书架位置字段 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">楼层</label>
                <input
                  name="floor"
                  type="number"
                  min="1"
                  value={form.floor}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">区域</label>
                <input
                  name="libraryArea"
                  value={form.libraryArea}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                  placeholder="如：文学区"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">书架号</label>
                <input
                  name="shelfNo"
                  value={form.shelfNo}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                  placeholder="如：A"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">层数</label>
                <input
                  name="shelfLevel"
                  type="number"
                  min="1"
                  value={form.shelfLevel}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">描述</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="3"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                placeholder="可填写图书简介"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                {success}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleReset}
                disabled={saving}
                className="w-full rounded-lg border border-gray-300 py-3 font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isEditing ? '取消编辑' : '重置表单'}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-blue-500 text-white py-3 font-semibold hover:bg-blue-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? (isEditing ? '保存中...' : '提交中...') : (isEditing ? '保存修改' : '新增图书')}
              </button>
            </div>
          </form>
        </section>

        <section className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">馆藏列表</h2>
              <p className="text-sm text-gray-500 mt-1">当前共 {books.length} 本图书记录</p>
            </div>
            <button
              onClick={() => void fetchBooks()}
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
            >
              刷新列表
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-500">正在加载图书列表...</div>
          ) : books.length === 0 ? (
            <div className="py-12 text-center text-gray-500">还没有图书记录，先在左侧新增一本吧。</div>
          ) : (
            <div className="space-y-4">
              {books.map((book) => (
                <article
                  key={book.id}
                  className="border border-gray-200 rounded-xl p-5 hover:border-blue-200 transition"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-gray-800">{book.title}</h3>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                          {book.genre}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            book.availableCopies > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                          }`}
                        >
                          {book.availableCopies > 0 ? '可借' : '无可借副本'}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mb-2">
                        作者：{book.author} | ISBN：{book.isbn}
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        语言：{book.language || '暂无'}
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        位置：{book.floor || 1}F {book.libraryArea || '未设置'} {book.shelfNo || 'A'}架 {book.shelfLevel || 1}层
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        副本数：{book.totalCopies || 1} / 可借：{book.availableCopies || 0}
                      </p>
                      <p className="text-sm text-gray-500 mb-3">
                        创建时间：{formatDate(book.createdAt)}
                      </p>

                      {book.description && (
                        <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 leading-6">
                          {book.description}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 flex flex-col gap-2 sm:flex-row lg:flex-col">
                      <button
                        onClick={() => handleEdit(book)}
                        disabled={saving || deletingId === book.id}
                        className="px-4 py-2 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        编辑图书
                      </button>
                      <button
                        onClick={() => void handleDelete(book)}
                        disabled={deletingId === book.id}
                        className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {deletingId === book.id ? '删除中...' : '删除图书'}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}