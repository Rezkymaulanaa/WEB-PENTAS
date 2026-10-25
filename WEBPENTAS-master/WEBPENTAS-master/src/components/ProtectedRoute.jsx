import { Navigate } from 'react-router-dom';
import { DASHBOARD_PATH, getSession } from '../utils/auth';

// Hanya untuk tampilan; hak akses sebenarnya tetap dicek oleh backend di setiap request.
export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isLoggedIn, role } = getSession();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    // Arahkan ke dashboard milik role tersebut
    return <Navigate to={DASHBOARD_PATH[role] || '/'} replace />;
  }

  return children;
};
