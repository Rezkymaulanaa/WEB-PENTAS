import { useEffect, useRef, useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { dokumenUrl, handleImageError } from '../utils/api';
import { formatWaktuLokal } from '../utils/format';

const STATUS_LABEL = {
  pending: 'Menunggu',
  disposisi: 'Didisposisi',
  disetujui: 'Disetujui',
  ditolak: 'Ditolak',
  selesai: 'Selesai',
};

export const StatusBadge = ({ status }) => {
  const value = status || 'pending';
  return <span className={`status-badge ${value}`}>{STATUS_LABEL[value] || value}</span>;
};

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
      <div className="toast show" role="alert" aria-live="assertive" aria-atomic="true">
        <div className="toast-header">
          <strong className="me-auto">Notifikasi</strong>
          <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
        </div>
        <div className="toast-body">{message}</div>
      </div>
    </div>
  );
};

// Modal untuk mengisi alasan penolakan
export const RejectModal = ({ show, onHide, onSubmit, title = 'Alasan Penolakan' }) => {
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const close = () => {
    setComment('');
    onHide();
  };

  const handleSubmit = async () => {
    if (!comment.trim()) {
      alert('Alasan penolakan harus diisi.');
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
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <textarea
          className="form-control"
          rows="4"
          placeholder="Masukkan alasan penolakan..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        ></textarea>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={close}>Batal</Button>
        <Button variant="danger" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Memproses...' : 'Tolak'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// Tombol unduh + pratinjau surat (PDF/gambar)
export const DokumenPreview = ({ filename }) => {
  if (!filename) {
    return <p>Tidak ada dokumen yang tersedia</p>;
  }

  const url = dokumenUrl(filename);
  return (
    <div className="document-preview">
      <p>Nama File: {filename}</p>
      <div className="document-actions">
        <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
          <i className="bi bi-download"></i> Unduh Surat
        </a>
        {filename.toLowerCase().endsWith('.pdf') ? (
          <iframe
            title="Pratinjau surat"
            src={url}
            width="100%"
            height="500px"
            style={{ marginTop: '10px', border: '1px solid #ddd' }}
          />
        ) : (
          <img
            src={url}
            alt="Preview Surat"
            style={{ maxWidth: '100%', marginTop: '10px' }}
            onError={handleImageError}
          />
        )}
      </div>
    </div>
  );
};

// Ringkasan izin kegiatan yang menjadi dasar peminjaman
export const IzinKegiatanInfo = ({ izin }) => (
  <div className="detail-section">
    <h3>Izin Kegiatan Terkait</h3>
    {izin ? (
      <table>
        <tbody>
          <tr>
            <td>Organisasi</td>
            <td>: {izin.nama_organisasi}</td>
          </tr>
          <tr>
            <td>Keperluan</td>
            <td>: {izin.keperluan}</td>
          </tr>
          <tr>
            <td>Diajukan</td>
            <td>: {formatWaktuLokal(izin.tanggal_permintaan)}</td>
          </tr>
          <tr>
            <td>Status</td>
            <td>: <StatusBadge status={izin.status} /></td>
          </tr>
          <tr>
            <td>Surat Izin</td>
            <td>
              :{' '}
              <a href={dokumenUrl(izin.surat_perizinan)} target="_blank" rel="noopener noreferrer">
                Lihat surat izin kegiatan
              </a>
            </td>
          </tr>
        </tbody>
      </table>
    ) : (
      <p className="text-muted">Pengajuan ini dibuat sebelum fitur izin kegiatan wajib (data lama).</p>
    )}
  </div>
);
