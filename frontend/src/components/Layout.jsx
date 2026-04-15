import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Megaphone, Settings, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/announcements', label: '公告列表', icon: Megaphone },
    ...(isAdmin ? [{ to: '/admin/announcements', label: '公告管理', icon: Settings }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 text-primary font-semibold text-lg">
              <BookOpen className="h-6 w-6" />
              <span>图书馆管理系统</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary ${
                    location.pathname === to ? 'text-primary' : 'text-gray-600'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <>
                  <span className="text-sm text-gray-600">
                    {user.name} ({user.role})
                  </span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-destructive transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    退出
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  登录
                </Link>
              )}
            </div>

            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="container mx-auto px-4 py-3 space-y-3">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 text-sm font-medium py-2 ${
                    location.pathname === to ? 'text-primary' : 'text-gray-600'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
              {user ? (
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-gray-600">
                    {user.name} ({user.role})
                  </span>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-1.5 text-sm text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    退出
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-sm font-medium text-primary py-2"
                >
                  登录
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="container mx-auto px-4 py-6">
        {location.pathname !== '/announcements' && location.pathname !== '/admin/announcements' && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold">图书馆管理系统</h1>
            <p className="text-gray-600 mt-1">欢迎使用图书馆公告管理系统</p>
          </div>
        )}
      </main>
    </div>
  );
}
