import React, { useEffect, useState } from "react";

function MyHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('请先登录');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:3001/api/loans/my-history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('获取借阅历史失败');
      }

      const data = await response.json();
      setHistory(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ON_LOAN': return '借阅中';
      case 'RETURNED': return '已归还';
      case 'OVERDUE': return '已逾期';
      default: return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ON_LOAN': return '#3b82f6';
      case 'RETURNED': return '#10b981';
      case 'OVERDUE': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>加载中...</div>;
  }

  if (error) {
    return <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>{error}</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', borderBottom: '2px solid #3b82f6', paddingBottom: '10px' }}>
        我的借阅历史
      </h2>

      {history.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>暂无借阅记录</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <thead style={{ backgroundColor: '#f3f4f6' }}>
              <tr>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>书名</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>作者</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>借阅日期</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>应还日期</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>归还日期</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>状态</th>
              </tr>
            </thead>
            <tbody>
              {history.map((loan) => (
                <tr key={loan.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px' }}>{loan.book?.title || '未知'}</td>
                  <td style={{ padding: '12px' }}>{loan.book?.author || '未知'}</td>
                  <td style={{ padding: '12px' }}>{new Date(loan.checkoutDate).toLocaleDateString()}</td>
                  <td style={{ padding: '12px' }}>{new Date(loan.dueDate).toLocaleDateString()}</td>
                  <td style={{ padding: '12px' }}>{loan.returnDate ? new Date(loan.returnDate).toLocaleDateString() : '-'}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      backgroundColor: getStatusColor(loan.status),
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}>
                      {getStatusText(loan.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default MyHistory;