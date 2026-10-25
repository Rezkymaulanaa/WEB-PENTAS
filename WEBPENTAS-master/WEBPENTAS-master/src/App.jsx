import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { Login } from './pages/Login';
import { NavbarComponents } from './components/NavbarComponents';
import { FooterComponents } from './components/FooterComponents';
import { ProtectedRoute } from './components/ProtectedRoute';

// Halaman dimuat saat dibuka saja (code splitting) agar website lebih ringan
const DetailFasilitas = lazy(() => import('./pages/DetailFasilitas').then((m) => ({ default: m.DetailFasilitas })));
const NotificationComponents = lazy(() => import('./components/NotificationComponents'));
const PeminjamanPage = lazy(() => import('./pages/PeminjamanPage'));
const FasilitasPage = lazy(() => import('./pages/FasilitasPage'));
const IzinKegiatan = lazy(() => import('./pages/IzinKegiatan'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const DashboardAdmin = lazy(() => import('./pages/DashboardAdmin').then((m) => ({ default: m.DashboardAdmin })));
const DashboardDekan = lazy(() => import('./pages/DashboardDekan').then((m) => ({ default: m.DashboardDekan })));
const DashboardWakilDekan = lazy(() => import('./pages/DashboardWakilDekan').then((m) => ({ default: m.DashboardWakilDekan })));
const DashboardWakilDekan1 = lazy(() => import('./pages/DashboardWakilDekan1').then((m) => ({ default: m.DashboardWakilDekan1 })));

const Loading = () => (
  <div className="d-flex justify-content-center align-items-center py-5">
    <div className="spinner-border" role="status">
      <span className="visually-hidden">Memuat...</span>
    </div>
  </div>
);

function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const isDashboardPage = location.pathname.startsWith('/dashboard');

  return (
    <div>
      {/* Navbar */}
      {!isLoginPage && !isDashboardPage && <NavbarComponents />}

      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Rute Publik */}
          <Route path="/fasilitas" element={<FasilitasPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/detail-fasilitas/:id" element={<DetailFasilitas />} />
          <Route path="/login" element={<Login />} />
          <Route path="/peminjaman" element={<PeminjamanPage />} />

          {/* Rute Mahasiswa */}
          <Route
            path="/izin-kegiatan"
            element={
              <ProtectedRoute allowedRoles={['mahasiswa']}>
                <IzinKegiatan />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute allowedRoles={['mahasiswa']}>
                <NotificationComponents />
              </ProtectedRoute>
            }
          />

          {/* Rute Dilindungi */}
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard-dekan/*"
            element={
              <ProtectedRoute allowedRoles={['dekan']}>
                <DashboardDekan />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard-wadek/*"
            element={
              <ProtectedRoute allowedRoles={['wakil_dekan']}>
                <DashboardWakilDekan />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard-wadek1/*"
            element={
              <ProtectedRoute allowedRoles={['wakil_dekan1']}>
                <DashboardWakilDekan1 />
              </ProtectedRoute>
            }
          />

          {/* Route untuk HomePage */}
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={['mahasiswa', 'admin']}>
                <HomePage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>

      {/* Footer */}
      {!isLoginPage && !isDashboardPage && <FooterComponents />}
    </div>
  );
}

export default App;
