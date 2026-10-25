import { useState, useEffect, useCallback } from 'react';
import { Modal, Button } from 'react-bootstrap';
import api, { getErrorMessage } from '../../utils/api';
import { ROLE_LABEL, getSession } from '../../utils/auth';
import { Loading, PageHeader, Toast } from '../../components/common';

const FORM_KOSONG = { email: '', password: '', role: '' };

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState(FORM_KOSONG);
  const [formError, setFormError] = useState('');
  const [akanDihapus, setAkanDihapus] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [keyword, setKeyword] = useState('');
  const { id: myId } = getSession();

  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal mengambil data pengguna'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const bukaForm = (user = null) => {
    setEditingUser(user);
    setFormData(user ? { email: user.email, role: user.role, password: '' } : FORM_KOSONG);
    setFormError('');
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, formData);
        setToastMessage('Pengguna berhasil diperbarui');
      } else {
        await api.post('/users', formData);
        setToastMessage('Pengguna berhasil ditambahkan');
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      setFormError(getErrorMessage(err, 'Gagal menyimpan pengguna'));
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/users/${akanDihapus.id}`);
      setToastMessage('Pengguna berhasil dihapus');
      fetchUsers();
    } catch (err) {
      setToastMessage(getErrorMessage(err, 'Gagal menghapus pengguna'));
    } finally {
      setAkanDihapus(null);
    }
  };

  const kata = keyword.trim().toLowerCase();
  const tampil = users.filter((u) => !kata || u.email.toLowerCase().includes(kata) || (ROLE_LABEL[u.role] || '').toLowerCase().includes(kata));

  return (
    <>
      <PageHeader eyebrow="Admin" title="Pengguna" description="Kelola akun mahasiswa dan pimpinan fakultas.">
        <button className="btn btn-primary" onClick={() => bukaForm()}>
          <i className="bi bi-plus-lg" aria-hidden="true"></i> Tambah pengguna
        </button>
      </PageHeader>

      <div className="toolbar">
        <div>
          <label htmlFor="cari-user" className="visually-hidden">Cari pengguna</label>
          <input id="cari-user" type="search" className="form-control" placeholder="Cari email atau peran"
            value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        </div>
      </div>

      {loading ? <Loading /> : error ? <div className="alert alert-danger">{error}</div> : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Email</th>
                <th scope="col">Peran</th>
                <th scope="col" className="cell-actions"><span className="visually-hidden">Aksi</span></th>
              </tr>
            </thead>
            <tbody>
              {tampil.length === 0 && (
                <tr><td colSpan="3" className="empty-state">Tidak ada pengguna.</td></tr>
              )}
              {tampil.map((user) => (
                <tr key={user.id}>
                  <td>
                    {user.email}
                    {String(user.id) === myId && <span className="cell-sub">Akun Anda</span>}
                  </td>
                  <td>{ROLE_LABEL[user.role] || user.role}</td>
                  <td className="cell-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => bukaForm(user)}>
                      Ubah<span className="visually-hidden"> {user.email}</span>
                    </button>
                    {String(user.id) !== myId && (
                      <button className="btn btn-outline-danger btn-sm" onClick={() => setAkanDihapus(user)}>
                        Hapus<span className="visually-hidden"> {user.email}</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>{editingUser ? 'Ubah pengguna' : 'Tambah pengguna'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="mb-3">
              <label htmlFor="user-email" className="form-label">Email</label>
              <input id="user-email" type="email" name="email" className="form-control"
                value={formData.email} onChange={handleInputChange} required />
            </div>
            <div className="mb-3">
              <label htmlFor="user-password" className="form-label">Password</label>
              <input id="user-password" type="password" name="password" className="form-control"
                value={formData.password} onChange={handleInputChange}
                required={!editingUser} minLength={6} aria-describedby="password-help" autoComplete="new-password" />
              <div id="password-help" className="form-text">
                {editingUser ? 'Kosongkan jika tidak ingin mengubah password.' : 'Minimal 6 karakter.'}
              </div>
            </div>
            <div className="mb-1">
              <label htmlFor="user-role" className="form-label">Peran</label>
              <select id="user-role" name="role" className="form-select" value={formData.role} onChange={handleInputChange} required>
                <option value="" disabled>Pilih peran</option>
                {Object.entries(ROLE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            {formError && <div className="alert alert-danger mt-3 mb-0" role="alert">{formError}</div>}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Batal</Button>
            <Button variant="primary" type="submit">{editingUser ? 'Simpan perubahan' : 'Tambah pengguna'}</Button>
          </Modal.Footer>
        </form>
      </Modal>

      <Modal show={Boolean(akanDihapus)} onHide={() => setAkanDihapus(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Hapus pengguna?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Akun <strong>{akanDihapus?.email}</strong> akan dihapus permanen.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setAkanDihapus(null)}>Batal</Button>
          <Button variant="danger" onClick={handleDelete}>Hapus</Button>
        </Modal.Footer>
      </Modal>

      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </>
  );
}

export default UserManagement;
