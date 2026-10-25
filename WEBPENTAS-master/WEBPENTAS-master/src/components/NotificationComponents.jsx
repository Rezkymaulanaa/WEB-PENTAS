import { useState, useEffect } from 'react';
import api, { getErrorMessage } from '../utils/api';
import { StatusBadge } from './common';
import { formatRentangTanggal, formatWaktuLokal, formatWaktuUtc } from '../utils/format';
import '../disc/css/components/NotificationComponents.css';

const ITEMS_PER_PAGE = 10;

const useDataSaya = (url) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get(url)
      .then((response) => setItems(response.data))
      .catch((err) => setError(getErrorMessage(err, 'Gagal memuat data')))
      .finally(() => setLoading(false));
  }, [url]);

  return { items, loading, error };
};

const Pagination = ({ total, currentPage, onChange }) => {
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Pagination">
      <ul className="pagination justify-content-center">
        {[...Array(totalPages).keys()].map((pageNumber) => (
          <li key={pageNumber} className={`page-item ${currentPage === pageNumber + 1 ? 'active' : ''}`}>
            <button className="page-link" onClick={() => onChange(pageNumber + 1)}>
              {pageNumber + 1}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

const StatusCard = ({ item, type }) => (
  <div className="notification-card">
    <div className="notification-header">
      <h5 className="facility-name">
        {type === 'peminjaman' ? item.nama_fasilitas : item.nama_organisasi}
      </h5>
      <StatusBadge status={item.status} />
    </div>
    <div className="notification-body">
      <div className="info-row">
        <span className="label">Organisasi:</span>
        <span className="value">{item.nama_organisasi}</span>
      </div>
      {type === 'peminjaman' && (
        <>
          <div className="info-row">
            <span className="label">Tanggal:</span>
            <span className="value">{formatRentangTanggal(item.tanggal_mulai, item.tanggal_selesai)}</span>
          </div>
          <div className="info-row">
            <span className="label">Waktu:</span>
            <span className="value">{item.waktu_mulai} - {item.waktu_selesai}</span>
          </div>
        </>
      )}
      <div className="info-row">
        <span className="label">Keperluan:</span>
        <span className="value">{item.keperluan}</span>
      </div>
      {item.status === 'ditolak' && item.komentar && (
        <div className="info-row">
          <span className="label text-danger">Alasan Ditolak:</span>
          <span className="value text-danger">{item.komentar}</span>
        </div>
      )}
    </div>
    <div className="notification-footer">
      <small className="timestamp">
        Diajukan pada:{' '}
        {type === 'peminjaman' ? formatWaktuUtc(item.created_at) : formatWaktuLokal(item.tanggal_permintaan)}
      </small>
    </div>
  </div>
);

const StatusSection = ({ title, type, data, emptyText }) => {
  const [page, setPage] = useState(1);
  const { items, loading, error } = data;

  return (
    <div className="status-section">
      <h4 className="section-title">{title}</h4>
      {loading ? (
        <div className="notification-alert info">Memuat data...</div>
      ) : error ? (
        <div className="notification-alert error">{error}</div>
      ) : items.length === 0 ? (
        <div className="notification-alert info">{emptyText}</div>
      ) : (
        <>
          <div className="notifications-wrapper">
            {items.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE).map((item) => (
              <StatusCard key={item.id} item={item} type={type} />
            ))}
          </div>
          <div className="mt-4">
            <Pagination total={items.length} currentPage={page} onChange={setPage} />
          </div>
        </>
      )}
    </div>
  );
};

const NotificationComponents = () => {
  const perizinan = useDataSaya('/izin-kegiatan/me');
  const peminjaman = useDataSaya('/peminjaman/me');

  return (
    <div className="container my-4">
      <h4 className="notification-title fw-semibold">Notifikasi</h4>
      <div className="row">
        <div className="col-lg-6">
          <StatusSection title="Status Perizinan" type="perizinan" data={perizinan} emptyText="Belum ada perizinan" />
        </div>
        <div className="col-lg-6">
          <StatusSection title="Status Peminjaman" type="peminjaman" data={peminjaman} emptyText="Belum ada peminjaman" />
        </div>
      </div>
    </div>
  );
};

export default NotificationComponents;
