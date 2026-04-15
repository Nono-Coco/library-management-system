import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import BookSearch from './pages/BookSearch';
import MyHistory from './reader/MyHistory';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import SystemLogs from './adminLogs/SystemLogs';
import LibrarianApp from './librarian/LibrarianApp';
import Announcements from './pages/Announcements';
import AdminAnnouncements from './pages/AdminAnnouncements';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('search');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
    setLoading(false);
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setActiveTab('search');
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Routes>
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/librarian-login" element={<LibrarianApp />} />
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/admin-logs" element={<SystemLogs />} />
      <Route path="/announcements" element={<Announcements />} />
      <Route path="/admin/announcements" element={<AdminAnnouncements />} />
      <Route path="/" element={
        isLoggedIn ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', background: '#3b82f6', color: 'white' }}>
              <h2>Library System</h2>
              <div style={{ display: 'flex', gap: '20px' }}>
                <button onClick={() => setActiveTab('search')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', borderBottom: activeTab === 'search' ? '2px solid white' : 'none' }}>Search Books</button>
                <button onClick={() => setActiveTab('history')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', borderBottom: activeTab === 'history' ? '2px solid white' : 'none' }}>My History</button>
                <button onClick={handleLogout} style={{ padding: '5px 10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Logout</button>
              </div>
            </div>
            <div style={{ padding: '20px' }}>
              {activeTab === 'search' ? <BookSearch /> : <MyHistory />}
            </div>
          </div>
        ) : (
          <Login onLogin={handleLogin} />
        )
      } />
    </Routes>
  );
}

export default App;