import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FaSignOutAlt, FaBars } from 'react-icons/fa';
import { ROLE_LABEL, getSession, logout } from '../utils/auth';

const LAYAR_KECIL = '(max-width: 992px)';

// Kerangka dashboard (sidebar + topbar + konten) untuk semua role staf.
// items: [{ to, label, icon, end }]
export const DashboardLayout = ({ title, items, children }) => {
  const { email, role } = getSession();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => !window.matchMedia(LAYAR_KECIL).matches);

  // Di layar kecil, sidebar tertutup otomatis setelah pindah halaman
  useEffect(() => {
    if (window.matchMedia(LAYAR_KECIL).matches) setIsSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="dashboard-container">
      <a href="#konten-utama" className="skip-link">Lewati ke konten utama</a>

      <aside
        id="sidebar"
        className={`dashboard-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}
        aria-label="Navigasi dashboard"
      >
        <div className="sidebar-header">
          <div className="brand">
            <img src="/logoUnhas.png" alt="" />
            <span>
              <span className="brand-name">SIPANRITA</span>
              <span className="brand-sub">{title}</span>
            </span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <span className="sidebar-label">Menu</span>
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              {Icon && <Icon aria-hidden="true" />}
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <strong>{ROLE_LABEL[role] || role}</strong>
            {email}
          </div>
          <button type="button" className="nav-item" onClick={logout}>
            <FaSignOutAlt aria-hidden="true" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      <div
        className={`sidebar-backdrop ${isSidebarOpen ? 'show' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden="true"
      />

      <div className={`dashboard-main ${!isSidebarOpen ? 'full' : ''}`}>
        <div className="dashboard-topbar">
          <button
            type="button"
            className="icon-btn"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-controls="sidebar"
            aria-expanded={isSidebarOpen}
            aria-label={isSidebarOpen ? 'Tutup menu' : 'Buka menu'}
          >
            <FaBars aria-hidden="true" />
          </button>
          <span className="topbar-title">Fakultas MIPA · Universitas Hasanuddin</span>
        </div>
        <main id="konten-utama" className="dashboard-content" tabIndex="-1">
          {children}
        </main>
      </div>
    </div>
  );
};
