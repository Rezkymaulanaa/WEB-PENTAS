import { Routes, Route, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { FaInbox, FaHome, FaHistory } from "react-icons/fa";
import api, { getErrorMessage } from "../utils/api";
import { DashboardLayout } from "../components/DashboardLayout";
import { DokumenPreview, RejectModal, StatusBadge, Toast } from "../components/common";
import { formatWaktuLokal, formatWaktuUtc } from "../utils/format";

// Dashboard Wakil Dekan 1: memutuskan izin kegiatan yang didisposisi Dekan
const MENU = [
  { to: "/dashboard-wadek1", label: "Beranda", icon: FaHome, end: true },
  { to: "/dashboard-wadek1/disposisi-kegiatan", label: "Daftar Perizinan", icon: FaInbox },
  { to: "/dashboard-wadek1/riwayat", label: "Riwayat Perizinan", icon: FaHistory },
];

export function DashboardWakilDekan1() {
  return (
    <DashboardLayout title="Dashboard WD 1" items={MENU}>
      <Routes>
        <Route index element={<BerandaWadek />} />
        <Route path="disposisi-kegiatan" element={<DaftarDisposisi />} />
        <Route path="disposisi-kegiatan/:id" element={<DetailDisposisi />} />
        <Route path="riwayat" element={<RiwayatAktivitas />} />
      </Routes>
    </DashboardLayout>
  );
}

function BerandaWadek() {
  const [pending, setPending] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/perizinan/wadek1"), api.get("/perizinan/wadek1/notifications")])
      .then(([pendingRes, notifRes]) => {
        setPending(pendingRes.data.length);
        setNotifications(notifRes.data);
      })
      .catch((error) => console.error("Error:", error))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="loading">Memuat data...</div>;
  }

  return (
    <div className="dashboard-content">
      <h1 className="dashboard-title">Dashboard Overview</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon pending">
            <FaInbox />
          </div>
          <div className="stat-info">
            <h3>Disposisi Pending</h3>
            <div className="value">{pending}</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Disposisi Terbaru</h2>
          </div>
          <div className="notification-list">
            {notifications.map((notif) => (
              <div key={notif.id} className="perizinan-item">
                <div className="perizinan-info">
                  <hr />
                  <h4>{notif.nama_organisasi}</h4>
                  <h5>{notif.keperluan}</h5>
                  <p>Didisposisi: {formatWaktuUtc(notif.created_at)}</p>
                  <StatusBadge status={notif.status_disposisi} />
                </div>
              </div>
            ))}
            {notifications.length === 0 && <div className="no-data">Belum ada disposisi</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function DaftarDisposisi() {
  const [perizinan, setPerizinan] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Server hanya mengirim disposisi yang masih pending, terurut dari terbaru
    api.get("/perizinan/wadek1")
      .then((response) => setPerizinan(response.data))
      .catch((error) => console.error("Error:", error))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="loading">Memuat data...</div>;
  }

  return (
    <div className="dashboard-content">
      <h1 className="dashboard-title">Daftar Perizinan (Status Disposisi)</h1>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nama Organisasi</th>
              <th>Penanggung Jawab</th>
              <th>Keperluan</th>
              <th>Tanggal Permintaan</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {perizinan.length > 0 ? (
              perizinan.map((item) => (
                <tr key={item.id}>
                  <td>{item.nama_organisasi}</td>
                  <td>{item.penanggung_jawab}</td>
                  <td>{item.keperluan}</td>
                  <td>{formatWaktuLokal(item.tanggal_permintaan)}</td>
                  <td>
                    <StatusBadge status={item.status_disposisi} />
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-detail"
                        onClick={() => navigate(`/dashboard-wadek1/disposisi-kegiatan/${item.id}`)}
                      >
                        <i className="bi bi-eye"></i>
                        Detail
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center">Tidak ada surat izin yang di Disposisi</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DetailDisposisi() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [disposisi, setDisposisi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReject, setShowReject] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchDetailDisposisi = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/disposisi-kegiatan/${id}`);
      setDisposisi(response.data);
    } catch (error) {
      setToastMessage(getErrorMessage(error, "Gagal memuat data disposisi"));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetailDisposisi();
  }, [fetchDetailDisposisi]);

  // Server ikut memperbarui status izin kegiatan sesuai keputusan
  const handleStatusUpdate = async (status, komentar = "") => {
    try {
      await api.put(`/disposisi-kegiatan/${id}/status`, { status_disposisi: status, komentar });
      setToastMessage(status === "disetujui" ? "Perizinan berhasil disetujui" : "Perizinan berhasil ditolak");
      await fetchDetailDisposisi();
      return true;
    } catch (error) {
      setToastMessage(getErrorMessage(error, "Gagal memperbarui status"));
      return false;
    }
  };

  if (loading) return <div className="loading">Memuat data...</div>;
  if (!disposisi) return <div>Data tidak ditemukan</div>;

  return (
    <div className="detail-container">
      <h2>Detail Perizinan</h2>

      <div className="detail-section">
        <h3>Informasi Pemohon</h3>
        <table>
          <tbody>
            <tr><td>Nama Organisasi</td><td>: {disposisi.nama_organisasi}</td></tr>
            <tr><td>Penanggung Jawab</td><td>: {disposisi.penanggung_jawab}</td></tr>
            <tr><td>Kontak</td><td>: {disposisi.kontak_pj}</td></tr>
            <tr><td>Email</td><td>: {disposisi.email}</td></tr>
            <tr><td>Keperluan</td><td>: {disposisi.keperluan}</td></tr>
            <tr><td>Tanggal Permintaan</td><td>: {formatWaktuLokal(disposisi.tanggal_permintaan)}</td></tr>
            <tr>
              <td>Status</td>
              <td>: <StatusBadge status={disposisi.status_disposisi} /></td>
            </tr>
            {disposisi.status_disposisi === "ditolak" && (
              <tr>
                <td>Komentar</td>
                <td>: {disposisi.komentar}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="detail-section">
        <h3>Dokumen</h3>
        <DokumenPreview filename={disposisi.surat_perizinan} />
      </div>

      <div className="action-buttons">
        {disposisi.status_disposisi === "pending" && (
          <>
            <button className="btn-approve" onClick={() => handleStatusUpdate("disetujui")}>
              <i className="bi bi-check-lg"></i> Setujui
            </button>
            <button className="btn btn-danger" onClick={() => setShowReject(true)}>
              <i className="bi bi-x-lg"></i> Tolak
            </button>
          </>
        )}
        <button className="btn-back" onClick={() => navigate("/dashboard-wadek1/disposisi-kegiatan")}>
          <i className="bi bi-arrow-left"></i> Kembali
        </button>
      </div>

      <RejectModal
        show={showReject}
        onHide={() => setShowReject(false)}
        onSubmit={(komentar) => handleStatusUpdate("ditolak", komentar)}
      />
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}

function RiwayatAktivitas() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const limit = 30; // Jumlah data per halaman

  useEffect(() => {
    setLoading(true);
    api.get("/disposisi-kegiatan/history/wadek1", { params: { page: currentPage, limit } })
      .then((response) => {
        setHistory(response.data.data);
        setTotalPages(response.data.pages);
      })
      .catch((err) => setError(getErrorMessage(err, "Gagal memuat data riwayat.")))
      .finally(() => setLoading(false));
  }, [currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (loading) return <div className="text-center mt-3">Memuat riwayat...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="container m-4">
      <h2 className="mb-4 fw-semibold">Riwayat Aktivitas</h2>

      {history.length === 0 ? (
        <div className="alert alert-warning text-center">Tidak ada riwayat aktivitas.</div>
      ) : (
        <div className="table-container mb-4">
          <table className="data-table">
            <thead className="table-dark">
              <tr>
                <th>No</th>
                <th>Nama Organisasi</th>
                <th>Keperluan</th>
                <th>Status</th>
                <th>Komentar</th>
                <th>Tanggal Permintaan</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item, index) => (
                <tr key={item.id}>
                  <td>{(currentPage - 1) * limit + index + 1}</td>
                  <td>{item.nama_organisasi}</td>
                  <td>{item.keperluan}</td>
                  <td>
                    <StatusBadge status={item.status_disposisi} />
                  </td>
                  <td>{item.komentar || "-"}</td>
                  <td>{formatWaktuLokal(item.tanggal_permintaan)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <nav>
          <ul className="pagination justify-content-center">
            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => handlePageChange(currentPage - 1)}>
                Previous
              </button>
            </li>

            {Array.from({ length: totalPages }, (_, i) => (
              <li key={i} className={`page-item ${currentPage === i + 1 ? "active" : ""}`}>
                <button className="page-link" onClick={() => handlePageChange(i + 1)}>
                  {i + 1}
                </button>
              </li>
            ))}

            <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => handlePageChange(currentPage + 1)}>
                Next
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}
