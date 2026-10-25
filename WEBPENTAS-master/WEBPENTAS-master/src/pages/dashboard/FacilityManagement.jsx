import { useState, useEffect, useCallback } from 'react';
import { Modal, Button } from 'react-bootstrap';
import api, { fasilitasImageUrl, getErrorMessage, handleImageError } from '../../utils/api';
import { Loading, PageHeader, Toast } from '../../components/common';

const FORM_KOSONG = { nama_fasilitas: '', kapasitas: '', gedung: '', lantai: '' };
const KOLOM_GAMBAR = ['image', 'image2', 'image3'];

const FacilityManagement = () => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(FORM_KOSONG);
  const [files, setFiles] = useState([null, null, null]);     // file baru yang dipilih
  const [previews, setPreviews] = useState([null, null, null]); // URL pratinjau
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [akanDihapus, setAkanDihapus] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchFacilities = useCallback(async () => {
    try {
      const response = await api.get('/fasilitas');
      setFacilities(response.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal mengambil data fasilitas'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFacilities();
  }, [fetchFacilities]);

  const bukaForm = (facility = null) => {
    setEditingId(facility?.id ?? null);
    setFormData(facility
      ? { nama_fasilitas: facility.nama_fasilitas, kapasitas: facility.kapasitas, gedung: facility.gedung || '', lantai: facility.lantai || '' }
      : FORM_KOSONG);
    setFiles([null, null, null]);
    setPreviews(KOLOM_GAMBAR.map((k) => (facility?.[k] ? fasilitasImageUrl(facility[k]) : null)));
    setFormError('');
    setShowModal(true);
  };

  const handleFileChange = (index, file) => {
    if (!file) return;
    setFiles((prev) => prev.map((f, i) => (i === index ? file : f)));
    setPreviews((prev) => prev.map((p, i) => (i === index ? URL.createObjectURL(file) : p)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const body = new FormData();
      Object.entries(formData).forEach(([key, value]) => body.append(key, value));
      // Server hanya mengganti gambar yang diupload baru
      files.forEach((file, i) => file && body.append(`image${i + 1}`, file));

      if (editingId) {
        await api.put(`/fasilitas/${editingId}`, body);
        setToastMessage('Fasilitas berhasil diperbarui');
      } else {
        await api.post('/fasilitas', body);
        setToastMessage('Fasilitas berhasil ditambahkan');
      }
      setShowModal(false);
      fetchFacilities();
    } catch (err) {
      setFormError(getErrorMessage(err, 'Gagal menyimpan fasilitas'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/fasilitas/${akanDihapus.id}`);
      setToastMessage('Fasilitas berhasil dihapus');
      fetchFacilities();
    } catch (err) {
      setToastMessage(getErrorMessage(err, 'Terjadi kesalahan saat menghapus fasilitas'));
    } finally {
      setAkanDihapus(null);
    }
  };

  return (
    <>
      <PageHeader eyebrow="Fasilitas" title="Kelola fasilitas" description="Ruangan dan sarana yang dapat dipinjam mahasiswa.">
        <button className="btn btn-primary" onClick={() => bukaForm()}>
          <i className="bi bi-plus-lg" aria-hidden="true"></i> Tambah fasilitas
        </button>
      </PageHeader>

      {loading ? <Loading /> : error ? <div className="alert alert-danger">{error}</div> : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col"><span className="visually-hidden">Foto</span></th>
                <th scope="col">Nama fasilitas</th>
                <th scope="col">Lokasi</th>
                <th scope="col">Kapasitas</th>
                <th scope="col" className="cell-actions"><span className="visually-hidden">Aksi</span></th>
              </tr>
            </thead>
            <tbody>
              {facilities.length === 0 && (
                <tr><td colSpan="5" className="empty-state">Belum ada fasilitas. Tambahkan fasilitas pertama.</td></tr>
              )}
              {facilities.map((facility) => {
                const jumlahFoto = KOLOM_GAMBAR.filter((k) => facility[k]).length;
                return (
                  <tr key={facility.id}>
                    <td style={{ width: 96 }}>
                      <img src={fasilitasImageUrl(facility.image)} alt="" className="cell-thumb" onError={handleImageError} />
                    </td>
                    <td>
                      <span className="fw-semibold">{facility.nama_fasilitas}</span>
                      <span className="cell-sub">{jumlahFoto} foto</span>
                    </td>
                    <td>{facility.gedung}<span className="cell-sub">Lantai {facility.lantai}</span></td>
                    <td>{facility.kapasitas} orang</td>
                    <td className="cell-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => bukaForm(facility)}>
                        Ubah<span className="visually-hidden"> {facility.nama_fasilitas}</span>
                      </button>
                      <button className="btn btn-outline-danger btn-sm" onClick={() => setAkanDihapus(facility)}>
                        Hapus<span className="visually-hidden"> {facility.nama_fasilitas}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>{editingId ? 'Ubah fasilitas' : 'Tambah fasilitas'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="row">
              <div className="col-md-8 mb-3">
                <label htmlFor="f-nama" className="form-label">Nama fasilitas</label>
                <input id="f-nama" className="form-control" value={formData.nama_fasilitas} required
                  onChange={(e) => setFormData({ ...formData, nama_fasilitas: e.target.value })} />
              </div>
              <div className="col-md-4 mb-3">
                <label htmlFor="f-kapasitas" className="form-label">Kapasitas (orang)</label>
                <input id="f-kapasitas" type="number" min="1" className="form-control" value={formData.kapasitas} required
                  onChange={(e) => setFormData({ ...formData, kapasitas: e.target.value })} />
              </div>
              <div className="col-md-8 mb-3">
                <label htmlFor="f-gedung" className="form-label">Gedung</label>
                <input id="f-gedung" className="form-control" value={formData.gedung} required placeholder="Contoh: Science Building"
                  onChange={(e) => setFormData({ ...formData, gedung: e.target.value })} />
              </div>
              <div className="col-md-4 mb-3">
                <label htmlFor="f-lantai" className="form-label">Lantai</label>
                <input id="f-lantai" className="form-control" value={formData.lantai} required
                  onChange={(e) => setFormData({ ...formData, lantai: e.target.value })} />
              </div>
            </div>

            <fieldset>
              <legend className="form-label">Foto (maksimal 3, JPG/PNG/WEBP)</legend>
              <div className="image-inputs">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="image-slot">
                    {previews[i] && <img src={previews[i]} alt={`Pratinjau foto ${i + 1}`} onError={handleImageError} />}
                    <label htmlFor={`f-foto-${i}`} className="small fw-semibold d-block mb-1">
                      Foto {i + 1}{i === 0 ? ' (utama)' : ''}
                    </label>
                    <input id={`f-foto-${i}`} type="file" accept="image/png,image/jpeg,image/webp" className="form-control form-control-sm"
                      onChange={(e) => handleFileChange(i, e.target.files[0])} />
                  </div>
                ))}
              </div>
            </fieldset>

            {formError && <div className="alert alert-danger mt-3 mb-0" role="alert">{formError}</div>}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Batal</Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? 'Menyimpan...' : editingId ? 'Simpan perubahan' : 'Tambah fasilitas'}
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      <Modal show={Boolean(akanDihapus)} onHide={() => setAkanDihapus(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Hapus fasilitas?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <strong>{akanDihapus?.nama_fasilitas}</strong> akan dihapus beserta fotonya. Fasilitas yang pernah
          dipinjam tidak dapat dihapus.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setAkanDihapus(null)}>Batal</Button>
          <Button variant="danger" onClick={handleDelete}>Hapus</Button>
        </Modal.Footer>
      </Modal>

      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </>
  );
};

export default FacilityManagement;
