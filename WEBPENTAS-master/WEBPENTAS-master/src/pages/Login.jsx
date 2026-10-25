import { useState } from 'react';
import '../disc/css/main.css';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { DASHBOARD_PATH, saveSession } from '../utils/auth';

export const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi input
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Email tidak valid');
      return;
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/login', { email, password });

      // Simpan token dan data user di localStorage
      saveSession(response.data);

      // Redirect berdasarkan role
      navigate(DASHBOARD_PATH[response.data.role] || '/', { replace: true });
    } catch (err) {
      const message = err.response?.data?.message || 'Tidak dapat terhubung ke server. Silakan coba lagi.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <h1 className="fw-bold">WELCOME TO PENTAS</h1>
        <p>WEBSITE PEMINJAMAN FASILITAS FMIPA UNHAS</p>
      </div>

      <div className="login-right">
        <div className="login-form">
          <h2 className="fw-bold">LOGIN</h2>
          <p>Masukkan data dengan lengkap</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <div className="password-input-container" style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {showPassword ? "🙉" : "🙈"}
                </button>
              </div>
            </div>

            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </button>

            <div className="forgot-password">
              <span className="text-muted small">Lupa password? Hubungi admin fakultas.</span>
            </div>

            {error && <div className="error-message">{error}</div>}
          </form>
        </div>
      </div>
    </div>
  );
};