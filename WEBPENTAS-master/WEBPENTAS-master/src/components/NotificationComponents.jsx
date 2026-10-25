import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Modal, Button } from 'react-bootstrap';
import api, { getErrorMessage } from '../utils/api';
import { InfoList, Loading, PageHeader, StatusBadge, Toast } from './common';
import { formatRentangTanggal, formatWaktuLokal, formatWaktuUtc } from '../utils/format';

const ITEMS_PER_PAGE = 10;

const useDataSaya = (url) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const muat = useCallback(() => {
    api.get(url)
      .then((response) => setItems(response.data))
      .catch((err) => setError(getErrorMessage(err, 'Gagal memuat data')))
      .finally(() => setLoading(false));
  }, [url]);

  useEffect(() => {
    muat();
  }, [muat]);

  return { items, loading, error, muat };
};

// Pengajuan yang masih boleh dibatalkan oleh mahasiswa
const bisaDibatalkan = (item, type) => {
  if (['pending', 'disposisi'].includes(item.status)) return true;
  if (item.status !== 'disetujui') return false;
  if (type === 'perizinan') return true; // server menolak jika masih dipakai peminjaman aktif
  return new Date(`${item.tanggal_mulai}T${item.waktu_mulai}`) > new Date();
};

const Pagination = ({ total, currentPage, onChange }) => {
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Halaman">
      <ul className="pagination pagination-sm mt-3 mb-0">
        {[...Array(totalPages).keys()].map((n) => (
          <li key={n} className={`page-item ${currentPage === n + 1 ? 'active' : ''}`}>
            <button className="page-link" onClick={() => onChange(n + 1)} aria-current={currentPage === n + 1 ? 'page' : undefined}>
              {n + 1}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

const RequestCard = ({ item, type, onBatal }) => (
  <article className="request-card">
    <div className="request-card-head">
      <h3>{type === 'peminjaman' ? item.nama_fasilitas : item.keperluan}</h3>
      <StatusBadge status={item.status} />
    </div>
    <InfoList items={[
      ['Organisasi', item.nama_organisasi],
      type === 'peminjaman' && ['Tanggal', formatRentangTanggal(item.tanggal_mulai, item.tanggal_selesai)],
      type === 'peminjaman' && ['Waktu', `${item.waktu_mulai.replace(':', '.')}–${item.waktu_selesai.replace(':', '.')} WITA`],
      type === 'peminjaman' && ['Keperluan', item.keperluan],
    ]} />
    {item.status === 'ditolak' && item.komentar && (
      <div className="reject-note"><strong>Alasan ditolak:</strong> {item.komentar}</div>
    )}
    <div className="request-card-foot">
      <span>
        Diajukan {type === 'peminjaman' ? formatWaktuUtc(item.created_at) : formatWaktuLokal(item.tanggal_permintaan)}
      </span>
      {bisaDibatalkan(item, type) && (
        <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => onBatal(item, type)}>
          Batalkan
        </button>
      )}
    </div>
  </article>
);

const StatusSection = ({ title, type, data, emptyText, onBatal }) => {
  const [page, setPage] = useState(1);
  const { items, loading, error } = data;

  return (
    <section aria-labelledby={`judul-${type}`}>
      <h2 id={`judul-${type}`} className="section-title">
        {title} <span className="text-muted fw-normal">({items.length})</span>
      </h2>
      {loading ? (
        <Loading />
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : items.length === 0 ? (
        <div className="panel empty-state">{emptyText}</div>
      ) : (
        <>
          <div className="request-list">
            {items.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE).map((item) => (
              <RequestCard key={item.id} item={item} type={type} onBatal={onBatal} />
            ))}
          </div>
          <Pagination total={items.length} currentPage={page} onChange={setPage} />
        </>
      )}
    </section>
  );
};

const NotificationComponents = () => {
  const perizinan = useDataSaya('/izin-kegiatan/me');
  const peminjaman = useDataSaya('/peminjaman/me');
  const [akanDibatalkan, setAkanDibatalkan] = useState(null);
  const [memproses, setMemproses] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const konfirmasiBatal = async () => {
    const { item, type } = akanDibatalkan;
    setMemproses(true);
    try {
      const url = type === 'peminjaman' ? `/peminjaman/${item.id}/batal` : `/izin-kegiatan/${item.id}/batal`;
      const response = await api.put(url);
      setToastMessage(response.data.message);
      (type === 'peminjaman' ? peminjaman : perizinan).muat();
    } catch (err) {
      setToastMessage(getErrorMessage(err, 'Gagal membatalkan pengajuan'));
    } finally {
      setMemproses(false);
      setAkanDibatalkan(null);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <PageHeader
          eyebrow="Akun saya"
          title="Status pengajuan"
          description="Pantau keputusan pimpinan atas izin kegiatan dan peminjaman fasilitas Anda."
        >
          <Link to="/izin-kegiatan" className="btn btn-secondary">Ajukan izin baru</Link>
          <Link to="/fasilitas" className="btn btn-primary">Pinjam fasilitas</Link>
        </PageHeader>

        <div className="row g-5">
          <div className="col-lg-6">
            <StatusSection
              title="Izin kegiatan"
              type="perizinan"
              data={perizinan}
              emptyText="Belum ada izin kegiatan yang diajukan."
              onBatal={(item, type) => setAkanDibatalkan({ item, type })}
            />
          </div>
          <div className="col-lg-6">
            <StatusSection
              title="Peminjaman fasilitas"
              type="peminjaman"
              data={peminjaman}
              emptyText="Belum ada peminjaman fasilitas."
              onBatal={(item, type) => setAkanDibatalkan({ item, type })}
            />
          </div>
        </div>
      </div>

      <Modal show={Boolean(akanDibatalkan)} onHide={() => setAkanDibatalkan(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Batalkan pengajuan?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {akanDibatalkan && (
            <p className="mb-0">
              {akanDibatalkan.type === 'peminjaman'
                ? `Peminjaman ${akanDibatalkan.item.nama_fasilitas} pada ${formatRentangTanggal(akanDibatalkan.item.tanggal_mulai, akanDibatalkan.item.tanggal_selesai)} akan dibatalkan dan jadwalnya dibuka untuk orang lain.`
                : `Izin kegiatan "${akanDibatalkan.item.keperluan}" akan dibatalkan.`}{' '}
              Tindakan ini tidak dapat diurungkan.
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setAkanDibatalkan(null)}>Kembali</Button>
          <Button variant="danger" onClick={konfirmasiBatal} disabled={memproses}>
            {memproses ? 'Membatalkan...' : 'Ya, batalkan'}
          </Button>
        </Modal.Footer>
      </Modal>

      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
};

export default NotificationComponents;
