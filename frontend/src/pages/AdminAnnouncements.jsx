import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Settings,
    Plus,
    Edit,
    Trash2,
    Search,
    ChevronLeft,
    ChevronRight,
    X,
    Pin,
    Loader2,
    AlertCircle,
    Check,
} from 'lucide-react';

export default function AdminAnnouncements() {
    const { apiRequest } = useAuth();
    const [announcements, setAnnouncements] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ title: '', content: '', isPinned: false, expiryDate: '' });
    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const fetchAnnouncements = async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit: pagination.limit });
            if (searchQuery) params.append('search', searchQuery);

            const data = await apiRequest(`/announcements?${params}`);
            setAnnouncements(data.announcements);
            setPagination(data.pagination);
        } catch (error) {
            showMessage('error', error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnnouncements(1);
    }, []);

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchAnnouncements(1);
    };

    const handlePageChange = (newPage) => {
        fetchAnnouncements(newPage);
    };

    const openCreateForm = () => {
        setForm({ title: '', content: '', isPinned: false, expiryDate: '' });
        setEditingId(null);
        setFormError('');
        setShowForm(true);
    };

    const openEditForm = (announcement) => {
        setForm({
            title: announcement.title,
            content: announcement.content,
            isPinned: announcement.isPinned,
            expiryDate: announcement.expiryDate ? announcement.expiryDate.slice(0, 16) : '',
        });
        setEditingId(announcement.id);
        setFormError('');
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingId(null);
        setFormError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        if (!form.title.trim() || !form.content.trim()) {
            setFormError('标题和内容不能为空');
            return;
        }

        setSubmitting(true);

        try {
            const payload = {
                title: form.title.trim(),
                content: form.content.trim(),
                isPinned: form.isPinned,
                expiryDate: form.expiryDate ? new Date(form.expiryDate).toISOString() : null,
            };

            if (editingId) {
                await apiRequest(`/announcements/${editingId}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload),
                });
                showMessage('success', '公告更新成功');
            } else {
                await apiRequest('/announcements', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                });
                showMessage('success', '公告创建成功');
            }

            closeForm();
            fetchAnnouncements(pagination.page);
        } catch (error) {
            setFormError(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('确定要删除此公告吗？此操作不可撤销。')) return;

        try {
            await apiRequest(`/announcements/${id}`, { method: 'DELETE' });
            showMessage('success', '公告删除成功');
            fetchAnnouncements(pagination.page);
        } catch (error) {
            showMessage('error', error.message);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    };

    const isExpired = (expiryDate) => {
        if (!expiryDate) return false;
        return new Date(expiryDate) < new Date();
    };

    return (
        <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Settings className="h-6 w-6" />
                        公告管理
                    </h1>
                    <p className="text-gray-600 mt-1">管理图书馆公告的发布、编辑和删除</p>
                </div>
                <button
                    onClick={openCreateForm}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    新建公告
                </button>
            </div>

            {message.text && (
                <div
                    className={`mb-4 p-3 rounded-md flex items-center gap-2 text-sm ${
                        message.type === 'success'
                            ? 'bg-green-50 border border-green-200 text-green-700'
                            : 'bg-red-50 border border-red-200 text-red-700'
                    }`}
                >
                    {message.type === 'success' ? (
                        <Check className="h-4 w-4 flex-shrink-0" />
                    ) : (
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    )}
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSearch} className="mb-6">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="搜索公告..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                        搜索
                    </button>
                </div>
            </form>

            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-5 border-b">
                            <h2 className="text-lg font-semibold">
                                {editingId ? '编辑公告' : '新建公告'}
                            </h2>
                            <button
                                onClick={closeForm}
                                className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            {formError && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-sm text-red-700">
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                    {formError}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium mb-1.5" htmlFor="form-title">
                                    标题 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="form-title"
                                    type="text"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="请输入公告标题"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5" htmlFor="form-content">
                                    内容 <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    id="form-content"
                                    value={form.content}
                                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                                    rows={5}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    placeholder="请输入公告内容"
                                    required
                                />
                            </div>

                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.isPinned}
                                        onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm">置顶公告</span>
                                </label>

                                <div className="flex items-center gap-2">
                                    <label className="text-sm" htmlFor="form-expiry">
                                        过期时间：
                                    </label>
                                    <input
                                        id="form-expiry"
                                        type="datetime-local"
                                        value={form.expiryDate}
                                        onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                                        className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            提交中...
                                        </>
                                    ) : editingId ? (
                                        '更新'
                                    ) : (
                                        '创建'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : announcements.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border">
                    <Settings className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">暂无公告</p>
                    <button
                        onClick={openCreateForm}
                        className="mt-3 text-sm text-blue-600 hover:underline"
                    >
                        创建第一条公告
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-lg border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">标题</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">状态</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">发布日期</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">过期日期</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">发布者</th>
                                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">操作</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y">
                            {announcements.map((announcement) => (
                                <tr key={announcement.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            {announcement.isPinned && (
                                                <Pin className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                                            )}
                                            <span className="font-medium truncate max-w-xs">
                          {announcement.title}
                        </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {announcement.isPinned ? (
                                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                          置顶
                        </span>
                                        ) : isExpired(announcement.expiryDate) ? (
                                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                          已过期
                        </span>
                                        ) : (
                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                          正常
                        </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {formatDate(announcement.publishDate)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {announcement.expiryDate
                                            ? formatDate(announcement.expiryDate)
                                            : '永久'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {announcement.publishers?.[0]?.user?.name || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => openEditForm(announcement)}
                                                className="p-1.5 rounded-md hover:bg-gray-100 transition-colors text-gray-600 hover:text-blue-600 border border-transparent hover:border-gray-200"
                                                title="编辑"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(announcement.id)}
                                                className="p-1.5 rounded-md hover:bg-gray-100 transition-colors text-gray-600 hover:text-red-600 border border-transparent hover:border-gray-200"
                                                title="删除"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <span className="text-sm text-gray-600">
                共 {pagination.total} 条
              </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                    disabled={pagination.page === 1}
                                    className="p-1.5 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <span className="text-sm text-gray-600 px-2">
                  {pagination.page} / {pagination.totalPages}
                </span>
                                <button
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                    disabled={pagination.page === pagination.totalPages}
                                    className="p-1.5 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}