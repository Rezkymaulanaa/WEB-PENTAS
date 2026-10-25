import { useState, useEffect } from 'react';
import api, { getErrorMessage } from '../../utils/api';
import { ROLE_LABEL } from '../../utils/auth';
import { Toast } from '../../components/common';
import '../../disc/css/main.css';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: ''
  });
  const [toastMessage, setToastMessage] = useState(null);  // State untuk pesan toast

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(error);
      setError('Gagal mengambil data pengguna');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle form input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Add user
  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users', {
        email: formData.email,
        password: formData.password,
        role: formData.role
      });

      setShowModal(false);
      setFormData({ email: '', password: '', role: '' });
      fetchUsers();
      setToastMessage('Pengguna berhasil ditambahkan!');
    } catch (error) {
      setToastMessage(getErrorMessage(error, 'Gagal menambah pengguna'));
    }
  };

  // Edit user
  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/users/${editingUser.id}`, formData);
      setShowModal(false);
      setEditingUser(null);
      setFormData({ email: '', password: '', role: '' });
      fetchUsers();
      setToastMessage('Pengguna berhasil diperbarui!');
    } catch (error) {
      setToastMessage(getErrorMessage(error, 'Gagal mengupdate pengguna'));
    }
  };

  // Delete user
  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) {
      try {
        await api.delete(`/users/${id}`);
        fetchUsers();
        setToastMessage('Pengguna berhasil dihapus!');
      } catch (error) {
        setToastMessage(getErrorMessage(error, 'Gagal menghapus pengguna'));
      }
    }
  };

  // Open modal for edit
  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      role: user.role,
      password: '' // kosongkan password saat edit
    });
    setShowModal(true);
  };

  const getRoleText = (role) => ROLE_LABEL[role] || role;


  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="management-card">
      <div className="card-header">
        <h2>Kelola Pengguna</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingUser(null);
            setFormData({ email: '', password: '', role: '' });
            setShowModal(true);
          }}
        >
          + Tambah Pengguna
        </button>
      </div>

      {/* Modal Form */}
      <div className={`custom-modal ${showModal ? 'show' : ''}`}>
        <div className="custom-modal-dialog">
          <div className="custom-modal-content">
            <div className="custom-modal-header">
              <h5 className="custom-modal-title">
                {editingUser ? 'Edit Pengguna' : 'Tambah Pengguna'}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => {
                  setShowModal(false);
                  setEditingUser(null);
                  setFormData({ email: '', password: '', role: '' });
                }}
              />
            </div>
            <form onSubmit={editingUser ? handleEdit : handleAdd}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password {editingUser && '(Kosongkan jika tidak ingin mengubah)'}</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required={!editingUser}
                  minLength={6}
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                  className='form-select'
                  aria-label="Floating label select example"
                >
                  <option value="" disabled>Pilih role</option>
                  <option value="mahasiswa">Mahasiswa</option>
                  <option value="admin">Admin</option>
                  <option value="dekan">Dekan</option>
                  <option value="wakil_dekan1">Wakil Dekan 1</option>
                  <option value="wakil_dekan">Wakil Dekan 2</option>
                </select>
              </div>
              <div className="custom-modal-footer">
                <button type="submit" className="btn btn-primary">
                  {editingUser ? 'Update' : 'Simpan'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowModal(false);
                    setEditingUser(null);
                    setFormData({ email: '', password: '', role: '' });
                  }}
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Table */}
      {users.length > 0 ? (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>
                    <span className="text-dark">
                      {getRoleText(user.role)}
                    </span>
                  </td>
                  <td className="form-actions my-auto">
                    <button
                      className="btn btn-warning"
                      onClick={() => openEditModal(user)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(user.id)}
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="no-data">Tidak ada data pengguna</div>
      )}

      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}

export default UserManagement;
