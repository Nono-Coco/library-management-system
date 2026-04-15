import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Megaphone, Search, ChevronLeft, ChevronRight, Pin } from 'lucide-react';

export default function Announcements() {
  const { apiRequest, isAdmin } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAnnouncements = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: pagination.limit });
      if (searchQuery) params.append('search', searchQuery);

      const data = await apiRequest(`/announcements?${params}`);
      setAnnouncements(data.announcements);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements(1);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchAnnouncements(1);
  };

  const handlePageChange = (newPage) => {
    fetchAnnouncements(newPage);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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
            <Megaphone className="h-6 w-6" />
            图书馆公告
          </h1>
          <p className="text-gray-600 mt-1">查看最新的图书馆通知和资讯</p>
        </div>

        {isAdmin && (
          <a
            href="/admin/announcements"
            className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            管理公告
          </a>
        )}
      </div>

      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索公告标题或内容..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            搜索
          </button>
        </div>
      </form>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <Megaphone className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">暂无公告</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className={`bg-white rounded-lg border p-5 transition-shadow hover:shadow-md ${
                announcement.isPinned ? 'border-yellow-300 bg-yellow-50/30' : ''
              } ${isExpired(announcement.expiryDate) ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start gap-3">
                {announcement.isPinned && (
                  <Pin className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-lg font-semibold">{announcement.title}</h2>
                    {announcement.isPinned && (
                      <span className="flex-shrink-0 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                        置顶
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 mt-2 whitespace-pre-wrap">{announcement.content}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-gray-500">
                    <span>发布日期：{formatDate(announcement.publishDate)}</span>
                    {announcement.expiryDate && (
                      <span className={isExpired(announcement.expiryDate) ? 'text-red-500' : ''}>
                        {isExpired(announcement.expiryDate) ? '已过期：' : '过期日期：'}
                        {formatDate(announcement.expiryDate)}
                      </span>
                    )}
                    {announcement.publishers?.[0] && (
                      <span>
                        发布者：{announcement.publishers[0].user.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="p-2 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="text-sm text-gray-600 px-3">
            {pagination.page} / {pagination.totalPages}
          </span>

          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="p-2 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
