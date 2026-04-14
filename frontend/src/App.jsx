import { useState, useEffect } from 'react';
import BookSearch from './pages/BookSearch';
import MyHistory from './reader/MyHistory';
import Login from './pages/Login';
import Register from './pages/Register';

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

  const path = window.location.pathname;

  if (path === '/register') {
    return <Register />;
  }

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', background: '#3b82f6', color: 'white' }}>
        <h2>Library System</h2>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <button onClick={() => setActiveTab('search')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '16px', borderBottom: activeTab === 'search' ? '2px solid white' : 'none', padding: '5px 0' }}>
            Search Books
          </button>
          <button onClick={() => setActiveTab('history')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '16px', borderBottom: activeTab === 'history' ? '2px solid white' : 'none', padding: '5px 0' }}>
            My History
          </button>
          <button onClick={handleLogout} style={{ padding: '5px 10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Logout</button>
        </div>
      </div>
      
      <div style={{ padding: '20px' }}>
        {activeTab === 'search' ? <BookSearch /> : <MyHistory />}
      </div>
    </div>
  );
}

export default App;