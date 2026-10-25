import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
    <div className="login-page">
      <section className="login-visual" aria-hidden="true">
        <div className="brand">
          <img src="/logoUnhas.png" alt="" />
          <span>
            <span className="brand-name">SIPANRITA</span>
            <span className="brand-sub">FMIPA Universitas Hasanuddin</span>
          </span>
        </div>
        <div>
          <h1>Peminjaman fasilitas dan izin kegiatan FMIPA</h1>
          <p>Satu akun untuk mengajukan, memeriksa, dan menyetujui kegiatan mahasiswa.</p>
        </div>
      </section>

      <main id="konten-utama" className="login-panel">
        <form className="login-form" onSubmit={handleSubmit}>
          <h2>Masuk</h2>
          <p>Gunakan akun yang diberikan oleh admin fakultas.</p>

          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              id="email"
              type="email"
              className="form-control"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="form-label">Password</label>
            <div className="password-field">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                aria-pressed={showPassword}
              >
                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} aria-hidden="true"></i>
              </button>
            </div>
          </div>

          {error && <div className="alert alert-danger" role="alert">{error}</div>}

          <button type="submit" className="btn btn-primary btn-lg w-100" disabled={isLoading}>
            {isLoading ? 'Memeriksa...' : 'Masuk'}
          </button>

          <p className="small text-muted mt-4 mb-0">
            Lupa password? Hubungi admin fakultas melalui halaman <Link to="/contact">Kontak</Link>.
          </p>
        </form>
      </main>
    </div>
  );
};
