import { FaBell, FaUserCircle } from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../utils/api';
import { DASHBOARD_PATH, ROLE_LABEL, getSession, logout } from '../utils/auth';

const MENU = [
  ['/', 'Home'],
  ['/izin-kegiatan', 'Izin Kegiatan'],
  ['/fasilitas', 'Fasilitas'],
  ['/peminjaman', 'Peminjaman'],
  ['/contact', 'Kontak'],
];

export const NavbarComponents = () => {
  const { isLoggedIn, role: userRole, email: userEmail } = getSession();
  const [notificationCount, setNotificationCount] = useState(0);
  const location = useLocation();

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
    <div className="container-fluid">
      <nav className="navbar navbar-expand-lg bg-body-tertiary">
        <div className="container">
          <Link className="navbar-brand fw-bold d-flex align-items-center" to="/">
            <img src="/logoUnhas.png" alt="Logo Unhas" width="25" className="me-2" />
            <span className="my-auto">SIPANRITA</span>
          </Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse justify-content-center" id="navbarNav">
            <ul className="navbar-nav">
              {MENU.map(([to, label]) => (
                <li className="nav-item" key={to}>
                  <Link to={to} className={`nav-link ${location.pathname === to ? 'active' : ''}`}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="d-flex align-items-center gap-3">
            {isLoggedIn && userRole === 'mahasiswa' && (
              <Link to="/notifications" className="position-relative">
                <FaBell size={20} className="text-dark" />
                {notificationCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                    {notificationCount}
                    <span className="visually-hidden">notifikasi baru</span>
                  </span>
                )}
              </Link>
            )}
            {isLoggedIn ? (
              <div className="dropdown">
                <button
                  className="btn btn-link text-dark p-0"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <FaUserCircle size={30} />
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li><span className="dropdown-item-text fw-bold">{userEmail}</span></li>
                  <li><span className="dropdown-item-text">{ROLE_LABEL[userRole] || userRole}</span></li>
                  {DASHBOARD_PATH[userRole] && (
                    <li><Link className="dropdown-item" to={DASHBOARD_PATH[userRole]}>Dashboard</Link></li>
                  )}
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className="dropdown-item text-danger" onClick={logout}>
                      Logout
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <Link to="/login" className="btn btn-outline-danger">
                Login
              </Link>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
};
