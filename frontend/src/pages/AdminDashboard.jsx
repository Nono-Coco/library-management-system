import { useState } from 'react';

function AdminDashboard() {
  const adminUser = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ marginBottom: '20px' }}>超级管理员控制台</h1>
      <p style={{ marginBottom: '30px', color: '#666' }}>欢迎，{adminUser.name || adminUser.email}</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        <a href="/admin-logs" style={{ display: 'block', padding: '30px', background: '#3b82f6', color: 'white', borderRadius: '8px', textDecoration: 'none', textAlign: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '20px' }}>系统日志</h3>
          <p style={{ margin: '10px 0 0', opacity: 0.9 }}>查看系统操作日志</p>
        </a>

        <a href="/announcements" style={{ display: 'block', padding: '30px', background: '#10b981', color: 'white', borderRadius: '8px', textDecoration: 'none', textAlign: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '20px' }}>公告查看</h3>
          <p style={{ margin: '10px 0 0', opacity: 0.9 }}>查看所有公告</p>
        </a>

        <a href="/admin/announcements" style={{ display: 'block', padding: '30px', background: '#f59e0b', color: 'white', borderRadius: '8px', textDecoration: 'none', textAlign: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '20px' }}>公告管理</h3>
          <p style={{ margin: '10px 0 0', opacity: 0.9 }}>发布和管理公告</p>
        </a>
      </div>

      <div style={{ marginTop: '40px' }}>
        <button onClick={() => { localStorage.removeItem('adminToken'); localStorage.removeItem('user'); localStorage.removeItem('token'); window.location.href = '/login'; }} style={{ padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          退出登录
        </button>
      </div>
    </div>
  );
}

export default AdminDashboard;