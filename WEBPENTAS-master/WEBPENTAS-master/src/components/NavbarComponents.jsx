import { NavLink, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../utils/api';
import { DASHBOARD_PATH, ROLE_LABEL, getSession, logout } from '../utils/auth';

const MENU = [
  ['/', 'Beranda'],
  ['/fasilitas', 'Fasilitas'],
  ['/peminjaman', 'Jadwal'],
  ['/izin-kegiatan', 'Izin Kegiatan'],
  ['/contact', 'Kontak'],
];

export const NavbarComponents = () => {
  const { isLoggedIn, role: userRole, email: userEmail } = getSession();
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    if (!isLoggedIn || userRole !== 'mahasiswa') return undefined;

    // Jumlah pengajuan yang masih diproses (peminjaman + izin kegiatan)
    const fetchNotifications = async () => {
      try {
        const [peminjaman, izin] = await Promise.all([
          api.get('/peminjaman/me'),
          api.get('/izin-kegiatan/me'),
        ]);
        const diproses = (item) => ['pending', 'disposisi'].includes(item.status || 'pending');
        setNotificationCount(peminjaman.data.filter(diproses).length + izin.data.filter(diproses).length);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [isLoggedIn, userRole]);

  return (
    <header className="site-header">
      <a href="#konten-utama" className="skip-link">Lewati ke konten utama</a>
      <nav className="navbar navbar-expand-lg" aria-label="Navigasi utama">
        <div className="container">
          <Link className="brand me-4" to="/">
            <img src="/logoUnhas.png" alt="" />
            <span>
              <span className="brand-name">SIPANRITA</span>
              <span className="brand-sub">FMIPA Universitas Hasanuddin</span>
            </span>
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Buka menu navigasi"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto gap-lg-1">
              {MENU.map(([to, label]) => (
                <li className="nav-item" key={to}>
                  <NavLink to={to} end={to === '/'} className="nav-link">
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>

            <div className="d-flex align-items-center gap-2 py-2 py-lg-0">
              {isLoggedIn && userRole === 'mahasiswa' && (
                <Link
                  to="/notifications"
                  className="icon-btn"
                  aria-label={`Status pengajuan${notificationCount ? `, ${notificationCount} sedang diproses` : ''}`}
                  title="Status pengajuan"
                >
                  <i className="bi bi-bell" aria-hidden="true"></i>
                  {notificationCount > 0 && <span className="count" aria-hidden="true">{notificationCount}</span>}
                </Link>
              )}
              {isLoggedIn ? (
                <div className="dropdown">
                  <button
                    className="user-chip"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    aria-label="Menu akun"
                  >
                    <span className="avatar" aria-hidden="true">{userEmail.charAt(0)}</span>
                    <i className="bi bi-chevron-down small" aria-hidden="true"></i>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li className="px-3 py-2">
                      <div className="fw-semibold text-break">{userEmail}</div>
                      <div className="text-muted small">{ROLE_LABEL[userRole] || userRole}</div>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    {userRole === 'mahasiswa' && (
                      <li><Link className="dropdown-item" to="/notifications">Status pengajuan</Link></li>
                    )}
                    {DASHBOARD_PATH[userRole] && (
                      <li><Link className="dropdown-item" to={DASHBOARD_PATH[userRole]}>Dashboard</Link></li>
                    )}
                    <li>
                      <button className="dropdown-item" onClick={logout}>Keluar</button>
                    </li>
                  </ul>
                </div>
              ) : (
                <Link to="/login" className="btn btn-primary">
                  Masuk
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};
