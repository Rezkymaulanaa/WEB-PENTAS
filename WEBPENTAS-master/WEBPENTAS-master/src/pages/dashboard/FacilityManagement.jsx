import { useState, useEffect } from 'react';
import api, { fasilitasImageUrl, getErrorMessage, handleImageError } from '../../utils/api';
import { Toast } from '../../components/common';
import '../../disc/css/main.css';

const FacilityManagement = () => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nama_fasilitas: '',
    kapasitas: '',
    gedung: '',
    lantai: '',
    images: [],
    originalFileNames: []
  });
  const [editingId, setEditingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);  // State untuk pesan toast

  // Fetch data fasilitas
  const fetchFacilities = async () => {
    try {
      setLoading(true);
      const response = await api.get('/fasilitas');
      setFacilities(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error:', error);
      setError('Gagal mengambil data fasilitas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  // Handle file input
  const handleFileChange = (index, file) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => {
          const newImages = [...prev.images];
          const newFileNames = [...prev.originalFileNames];
          newImages[index] = reader.result;
          newFileNames[index] = file.name;

          return {
            ...prev,
            images: newImages,
            originalFileNames: newFileNames
          };
        });
      };
      reader.onerror = () => {
        console.error(`Error reading file at index ${index}`);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('nama_fasilitas', formData.nama_fasilitas);
      formDataToSend.append('kapasitas', formData.kapasitas);
      formDataToSend.append('gedung', formData.gedung);
      formDataToSend.append('lantai', formData.lantai);

      // Handle gambar
      for (let i = 0; i < 3; i++) {
        const image = formData.images[i];
        const fieldName = `image${i + 1}`;

        if (image) {
          if (image.startsWith('data:')) {
            // Konversi base64 ke blob
            const response = await fetch(image);
            const blob = await response.blob();

            const fileName = formData.originalFileNames[i] || `image${i + 1}.jpg`;
            formDataToSend.append(fieldName, blob, fileName);
          }
          // Gambar lama tidak perlu dikirim ulang; server hanya mengganti gambar yang diupload baru
        }
      }

      let response;
      if (editingId) {
        response = await api.put(`/fasilitas/${editingId}`, formDataToSend);
        if (response.data.message === 'Fasilitas berhasil diupdate') {
          setShowModal(false);
          setFormData({ nama_fasilitas: '', kapasitas: '', gedung:'', lantai:'', images: [], originalFileNames: [] });
          setEditingId(null);
          await fetchFacilities();
          setToastMessage('Fasilitas berhasil diupdate!');  // Menampilkan pesan toast
        }
      } else {
        response = await api.post('/fasilitas', formDataToSend);
        if (response.data.message === 'Fasilitas berhasil ditambahkan') {
          setShowModal(false);
          setFormData({ nama_fasilitas: '', kapasitas: '', gedung:'', lantai:'', images: [], originalFileNames: [] });
          await fetchFacilities();
          setToastMessage('Fasilitas berhasil ditambahkan!');  // Menampilkan pesan toast
        }
      }
    } catch (error) {
      setToastMessage(getErrorMessage(error, 'Gagal menyimpan fasilitas.'));
    }
  };

  // Handle hapus fasilitas
  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus fasilitas ini?')) {
      try {
        await api.delete(`/fasilitas/${id}`);
        setToastMessage('Fasilitas berhasil dihapus');
        await fetchFacilities();
      } catch (error) {
        setToastMessage(getErrorMessage(error, 'Terjadi kesalahan saat menghapus fasilitas.'));
      }
    }
  };

  // Handle edit fasilitas
  const handleEdit = (facility) => {
    setFormData({
      nama_fasilitas: facility.nama_fasilitas,
      kapasitas: facility.kapasitas,
      gedung: facility.gedung,
      lantai: facility.lantai,
      images: [facility.image, facility.image2, facility.image3],
      originalFileNames: [facility.image, facility.image2, facility.image3]
    });
    setEditingId(facility.id);
    setShowModal(true);
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="management-card">
      <div className="card-header">
        <h2>Kelola Fasilitas</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            setFormData({ nama_fasilitas: '', kapasitas: '', gedung: '', lantai: '', images: [], originalFileNames: [] });
            setEditingId(null);
            setShowModal(true);
          }}
        >
          + Tambah Fasilitas
        </button>
      </div>

      {/* Modal Form */}
      <div className={`facility-modal ${showModal ? 'show' : ''}`}>
        <div className="facility-modal-dialog">
          <div className="facility-modal-content">
            <div className="facility-modal-header">
              <h5 className="facility-modal-title">
                {editingId ? 'Edit Fasilitas' : 'Tambah Fasilitas'}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => {
                  setShowModal(false);
                  setFormData({ nama_fasilitas: '', kapasitas: '', gedung: '', lantai: '', images: [], originalFileNames: [] });
                  setEditingId(null);
                }}
              />
            </div>
            <div className="facility-modal-body">
              <form onSubmit={handleSubmit}>
                <div className="facility-form-group">
                  <label>Nama Fasilitas:</label>
                  <input
                    type="text"
                    value={formData.nama_fasilitas}
                    onChange={(e) => setFormData({...formData, nama_fasilitas: e.target.value})}
                    required
                  />
                </div>
                <div className="facility-form-group">
                  <label>Kapasitas:</label>
                  <input
                    type="number"
                    value={formData.kapasitas}
                    onChange={(e) => setFormData({...formData, kapasitas: e.target.value})}
                    required
                  />
                </div>
                <div className="facility-form-group">
                  <label>Gedung:</label>
                  <input
                    type="text"
                    value={formData.gedung}
                    onChange={(e) => setFormData({ ...formData, gedung: e.target.value })}
                    required
                  />
                </div>
                <div className="facility-form-group">
                  <label>Lantai:</label>
                  <input
                    type="number"
                    value={formData.lantai}
                    onChange={(e) => setFormData({ ...formData, lantai: e.target.value })}
                    required
                  />
                </div>
                <div className="facility-form-group">
                  <label>Gambar Fasilitas (Maksimal 3):</label>
                  {[1, 2, 3].map((index) => (
                    <div key={index} className="mb-3">
                      <label>Gambar {index}:</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(index - 1, e.target.files[0])}
                      />
                      {formData.images[index - 1] && (
                        <div className="image-preview">
                          <img
                            src={formData.images[index - 1].startsWith('data:')
                              ? formData.images[index - 1]
                              : fasilitasImageUrl(formData.images[index - 1])
                            }
                            alt={`Preview ${index}`}
                            style={{
                              maxWidth: '200px',
                              maxHeight: '150px',
                              marginTop: '10px',
                              objectFit: 'cover'
                            }}
                            onError={handleImageError}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="facility-modal-footer">
                  <button type="submit" className="btn btn-primary">
                    {editingId ? 'Update' : 'Simpan'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Fasilitas */}
      {facilities.length > 0 ? (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nama Fasilitas</th>
                <th>Kapasitas</th>
                <th>Gedung</th>
                <th>Lantai</th>
                <th>Gambar</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {facilities.map(facility => (
                <tr key={facility.id}>
                  <td>{facility.nama_fasilitas}</td>
                  <td>{facility.kapasitas} Orang</td>
                  <td>{facility.gedung}</td>
                  <td>{facility.lantai}</td>
                  <td>
                    {facility.image && (
                      <img
                        src={fasilitasImageUrl(facility.image)}
                        alt={facility.nama_fasilitas}
                        className="facility-image"
                        style={{width: '100px', height: '60px', objectFit: 'cover'}}
                        onError={handleImageError}
                      />
                    )}
                    {(facility.image2 || facility.image3) && (
                      <span className="badge bg-info ms-2">
                        +{[facility.image2, facility.image3].filter(img => img !== null).length}
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="editBtn" onClick={() => handleEdit(facility)}>
                        <svg height="1em" viewBox="0 0 512 512">
                          <path d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z"></path>
                        </svg>
                      </button>
                      <button className="bin-button" onClick={() => handleDelete(facility.id)}>
                        <svg className="bin-top" viewBox="0 0 39 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <line y1="5" x2="39" y2="5" stroke="white" strokeWidth="4"></line>
                          <line x1="12" y1="1.5" x2="26.0357" y2="1.5" stroke="white" strokeWidth="3"></line>
                        </svg>
                        <svg className="bin-bottom" viewBox="0 0 33 39" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <mask id={`path-1-inside-1_8_19_${facility.id}`} fill="white">
                            <path d="M0 0H33V35C33 37.2091 31.2091 39 29 39H4C1.79086 39 0 37.2091 0 35V0Z"></path>
                          </mask>
                          <path d="M0 0H33H0ZM37 35C37 39.4183 33.4183 43 29 43H4C-0.418278 43 -4 39.4183 -4 35H4H29H37ZM4 43C-0.418278 43 -4 39.4183 -4 35V0H4V35V43ZM37 0V35C37 39.4183 33.4183 43 29 43V35V0H37Z" fill="white" mask={`url(#path-1-inside-1_8_19_${facility.id})`}></path>
                          <path d="M12 6L12 29" stroke="white" strokeWidth="4"></path>
                          <path d="M21 6V29" stroke="white" strokeWidth="4"></path>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="no-data">Tidak ada data fasilitas</div>
      )}

      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}

export default FacilityManagement;