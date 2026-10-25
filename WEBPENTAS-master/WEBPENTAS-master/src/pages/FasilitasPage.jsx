import { useEffect, useState } from 'react';
import api from '../utils/api';
import { FacilityCard, Loading, PageHeader } from '../components/common';

export const FasilitasPage = () => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    api.get('/fasilitas')
      .then((response) => setFacilities(response.data))
      .catch((error) => console.error('Error fetching fasilitas:', error))
      .finally(() => setLoading(false));
  }, []);

  const kata = keyword.trim().toLowerCase();
  const hasil = facilities.filter((f) =>
    !kata || [f.nama_fasilitas, f.gedung].some((v) => (v || '').toLowerCase().includes(kata))
  );

  return (
    <div className="page">
      <div className="container">
        <PageHeader
          eyebrow="Fasilitas"
          title="Ruangan dan fasilitas FMIPA"
          description="Pilih fasilitas untuk melihat jadwal yang sudah terisi dan mengajukan peminjaman."
        >
          <div style={{ minWidth: 260 }}>
            <label htmlFor="cari-fasilitas" className="visually-hidden">Cari fasilitas</label>
            <input
              id="cari-fasilitas"
              type="search"
              className="form-control"
              placeholder="Cari nama ruangan atau gedung"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
        </PageHeader>

        {loading ? (
          <Loading text="Memuat fasilitas..." />
        ) : hasil.length > 0 ? (
          <div className="facility-grid">
            {hasil.map((facility) => <FacilityCard key={facility.id} facility={facility} />)}
          </div>
        ) : (
          <div className="panel empty-state">
            {facilities.length === 0 ? 'Belum ada fasilitas yang terdaftar.' : `Tidak ada fasilitas yang cocok dengan "${keyword}".`}
          </div>
        )}
      </div>
    </div>
  );
};

export default FasilitasPage;
