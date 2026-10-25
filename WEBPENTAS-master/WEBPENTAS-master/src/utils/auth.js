// Penyimpanan sesi login di localStorage.
const KEYS = ['token', 'userId', 'userRole', 'userEmail'];

export const ROLE_LABEL = {
  mahasiswa: 'Mahasiswa',
  admin: 'Admin',
  dekan: 'Dekan',
  wakil_dekan1: 'Wakil Dekan 1',
  wakil_dekan: 'Wakil Dekan 2',
};

export const DASHBOARD_PATH = {
  admin: '/dashboard',
  dekan: '/dashboard-dekan',
  wakil_dekan: '/dashboard-wadek',
  wakil_dekan1: '/dashboard-wadek1',
};

export const saveSession = ({ token, id, role, email }) => {
  localStorage.setItem('token', token);
  localStorage.setItem('userId', String(id));
  localStorage.setItem('userRole', role);
  localStorage.setItem('userEmail', email);
  // Bersihkan key lama dari versi sebelumnya
  localStorage.removeItem('isLoggedIn');
};

export const getToken = () => localStorage.getItem('token');

export const getSession = () => ({
  token: getToken(),
  id: localStorage.getItem('userId'),
  role: localStorage.getItem('userRole') || '',
  email: localStorage.getItem('userEmail') || '',
  isLoggedIn: Boolean(getToken()),
});

export const clearSession = () => {
  KEYS.forEach((key) => localStorage.removeItem(key));
  localStorage.removeItem('isLoggedIn');
};

export const logout = () => {
  clearSession();
  window.location.href = '/login';
};
