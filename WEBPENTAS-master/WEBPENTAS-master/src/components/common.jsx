import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Modal, Button } from 'react-bootstrap';
import { dokumenUrl, fasilitasImageUrl, handleImageError } from '../utils/api';
import { formatWaktuLokal } from '../utils/format';

const STATUS_LABEL = {
  pending: 'Menunggu',
  disposisi: 'Didisposisi',
  disetujui: 'Disetujui',
  ditolak: 'Ditolak',
  selesai: 'Selesai',
  dibatalkan: 'Dibatalkan',
};

export const StatusBadge = ({ status }) => {
  const value = status || 'pending';
  return <span className={`status-badge ${value}`}>{STATUS_LABEL[value] || value}</span>;
};

// Judul halaman: eyebrow kecil, judul, dan deskripsi opsional
export const PageHeader = ({ eyebrow, title, description, children }) => (
  <header className="page-header d-flex flex-wrap justify-content-between align-items-end gap-3">
    <div>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
    {children && <div className="d-flex flex-wrap gap-2">{children}</div>}
  </header>
);

// Angka ringkasan di beranda dashboard
export const StatCard = ({ label, value, tone = '' }) => (
  <div className={`stat-card ${tone ? `tone-${tone}` : ''}`}>
    <p className="stat-label">{label}</p>
    <div className="stat-value">{value}</div>
  </div>
);

// Daftar label : nilai yang dibaca rapi oleh pembaca layar
export const InfoList = ({ items }) => (
  <dl className="info-list">
    {items.filter(Boolean).map(([label, value]) => (
      <div key={label} style={{ display: 'contents' }}>
        <dt>{label}</dt>
        <dd>{value ?? '-'}</dd>
      </div>
    ))}
  </dl>
);

export const Loading = ({ text = 'Memuat data...' }) => (
  <div className="loading" role="status">
    <div className="spinner-border spinner-border-sm me-2" aria-hidden="true"></div>
    {text}
  </div>
);

// Kartu fasilitas untuk halaman publik
export const FacilityCard = ({ facility }) => (
  <article className="facility-card">
    <img src={fasilitasImageUrl(facility.image)} alt="" loading="lazy" onError={handleImageError} />
    <div className="facility-card-body">
      <h3>
        <Link to={`/detail-fasilitas/${facility.id}`}>{facility.nama_fasilitas}</Link>
      </h3>
      <p className="facility-meta">
        {[facility.gedung, facility.lantai && `Lantai ${facility.lantai}`].filter(Boolean).join(' · ')}
      </p>
      <p className="facility-meta">Kapasitas {facility.kapasitas} orang</p>
      <span className="link-arrow" aria-hidden="true">Lihat jadwal &amp; booking →</span>
    </div>
  </article>
);

// Notifikasi kecil di pojok kanan atas, otomatis hilang setelah 5 detik
export const Toast = ({ message, onClose }) => {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => onCloseRef.current(), 5000);
    return () => clearTimeout(timer);
  }, [message]);

  if (!message) return null;

  return (
    <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1080 }}>
      <div className="toast show" role="status" aria-live="polite" aria-atomic="true">
        <div className="toast-body d-flex align-items-start gap-3">
          <span className="flex-grow-1">{message}</span>
          <button type="button" className="btn-close" aria-label="Tutup notifikasi" onClick={onClose}></button>
        </div>
      </div>
    </div>
  );
};

// Modal konfirmasi dengan kolom alasan (untuk menolak pengajuan)
export const RejectModal = ({ show, onHide, onSubmit, title = 'Tolak pengajuan' }) => {
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const close = () => {
    setComment('');
    setError('');
    onHide();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError('Alasan penolakan wajib diisi.');
      return;
    }
    setSubmitting(true);
    try {
      const berhasil = await onSubmit(comment.trim());
      if (berhasil !== false) close();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={close} centered>
      <form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <label htmlFor="alasan-penolakan" className="form-label">Alasan penolakan</label>
          <textarea
            id="alasan-penolakan"
            className={`form-control ${error ? 'is-invalid' : ''}`}
            rows="4"
            placeholder="Contoh: jadwal bertabrakan dengan kegiatan fakultas"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            aria-describedby="alasan-help"
          ></textarea>
          <div id="alasan-help" className={error ? 'invalid-feedback d-block' : 'form-text'}>
            {error || 'Alasan ini akan dilihat oleh pemohon.'}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={close}>Batal</Button>
          <Button variant="danger" type="submit" disabled={submitting}>
            {submitting ? 'Memproses...' : 'Tolak pengajuan'}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

// Tombol unduh + pratinjau surat (PDF/gambar)
export const DokumenPreview = ({ filename }) => {
  if (!filename) {
    return <p className="text-muted mb-0">Tidak ada dokumen.</p>;
  }

  const url = dokumenUrl(filename);
  return (
    <div className="document-preview">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
        <span className="text-muted small text-break">{filename}</span>
        <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
          <i className="bi bi-box-arrow-up-right" aria-hidden="true"></i> Buka di tab baru
        </a>
      </div>
      {filename.toLowerCase().endsWith('.pdf') ? (
        <iframe title="Pratinjau surat" src={url} />
      ) : (
        <img src={url} alt="Pratinjau surat" onError={handleImageError} />
      )}
    </div>
  );
};

// Ringkasan izin kegiatan yang menjadi dasar peminjaman
export const IzinKegiatanInfo = ({ izin }) => (
  <section className="panel">
    <h2 className="panel-title">Izin kegiatan terkait</h2>
    {izin ? (
      <InfoList items={[
        ['Organisasi', izin.nama_organisasi],
        ['Kegiatan', izin.keperluan],
        ['Diajukan', formatWaktuLokal(izin.tanggal_permintaan)],
        ['Status', <StatusBadge key="s" status={izin.status} />],
        ['Surat izin', (
          <a key="a" href={dokumenUrl(izin.surat_perizinan)} target="_blank" rel="noopener noreferrer">
            Lihat surat izin kegiatan
          </a>
        )],
      ]} />
    ) : (
      <p className="text-muted mb-0">Pengajuan ini dibuat sebelum izin kegiatan diwajibkan (data lama).</p>
    )}
  </section>
);
