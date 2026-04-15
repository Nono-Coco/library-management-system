import { useState } from 'react';

function Register() {
  const [form, setForm] = useState({ name: '', email: '', studentId: '', password: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const res = await fetch('http://localhost:3001/readers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (res.ok && data.token) {
        setMessage('Registration successful! Redirecting...');
        setTimeout(() => { window.location.href = '/'; }, 1500);
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Cannot connect to server');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '100px auto', padding: 20, border: '1px solid #ccc', borderRadius: 8 }}>
      <h2 style={{ textAlign: 'center' }}>Reader Register</h2>
      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required style={{ width: '100%', padding: 8, margin: '10px 0' }} />
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required style={{ width: '100%', padding: 8, margin: '10px 0' }} />
        <input name="studentId" placeholder="Student ID" value={form.studentId} onChange={handleChange} required style={{ width: '100%', padding: 8, margin: '10px 0' }} />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required style={{ width: '100%', padding: 8, margin: '10px 0' }} />
        {error && <div style={{ color: 'red' }}>{error}</div>}
        {message && <div style={{ color: 'green' }}>{message}</div>}
        <button type="submit" style={{ width: '100%', padding: 10, background: '#007bff', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Register</button>
      </form>
      <div style={{ textAlign: 'center', marginTop: 15 }}>
        <a href="/" style={{ color: '#007bff' }}>Already have an account? Login</a>
      </div>
    </div>
  );
}

export default Register;