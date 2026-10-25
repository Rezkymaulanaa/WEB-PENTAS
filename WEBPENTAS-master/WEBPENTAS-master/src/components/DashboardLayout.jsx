import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FaSignOutAlt } from 'react-icons/fa';
import { logout } from '../utils/auth';
import '../disc/css/main.css';

// Kerangka dashboard (sidebar + konten) yang dipakai semua role staf.
// items: [{ to, label, icon, end }]
export const DashboardLayout = ({ title, items, children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="dashboard-container">
      <div className={`dashboard-sidebar ${!isSidebarOpen ? 'closed' : ''}`}>
        <div className="sidebar-header">
          <h2>{title}</h2>
        </div>

        <nav className="sidebar-nav">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              {Icon && <Icon className="me-2" />}
              <span>{label}</span>
            </NavLink>
          ))}

          <button
            className="nav-item logout-button"
            onClick={logout}
            style={{
              border: 'none',
              background: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <FaSignOutAlt className="me-2" />
            <span>Logout</span>
          </button>
        </nav>
      </div>

      <main className={`dashboard-main ${!isSidebarOpen ? 'full' : ''}`}>
        <button className="toggle-sidebar" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? '←' : '→'}
        </button>
        {children}
      </main>
    </div>
  );
};
