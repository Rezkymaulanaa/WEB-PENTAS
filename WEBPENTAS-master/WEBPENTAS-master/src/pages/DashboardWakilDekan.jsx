import { Routes, Route, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { FaInbox, FaCheckCircle, FaTimesCircle, FaHome, FaHistory } from "react-icons/fa";
import api, { getErrorMessage } from "../utils/api";
import { DashboardLayout } from "../components/DashboardLayout";
import { DokumenPreview, IzinKegiatanInfo, RejectModal, StatusBadge, Toast } from "../components/common";
import { RiwayatAktivitas } from "./dekan/RiwayatAktivitas";
import { formatRentangTanggal, formatTanggal, formatWaktuUtc } from "../utils/format";

// Dashboard Wakil Dekan 2: memutuskan peminjaman ruangan/sarana yang didisposisi Dekan
const MENU = [
  { to: "/dashboard-wadek", label: "Beranda", icon: FaHome, end: true },
  { to: "/dashboard-wadek/disposisi", label: "Daftar Peminjaman Fasilitas", icon: FaInbox },
  { to: "/dashboard-wadek/riwayat", label: "Riwayat Peminjaman", icon: FaHistory },
];

export function DashboardWakilDekan() {
  return (
    <DashboardLayout title="Dashboard WD 2" items={MENU}>
      <Routes>
        <Route index element={<BerandaWadek />} />
        <Route path="disposisi" element={<DaftarDisposisi />} />
        <Route path="disposisi/:id" element={<DetailDisposisi />} />
        <Route path="riwayat" element={<RiwayatAktivitas judul="Riwayat Peminjaman" />} />
      </Routes>
    </DashboardLayout>
  );
}

function BerandaWadek() {
  const [disposisi, setDisposisi] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/peminjaman/wadek")
      .then((response) => setDisposisi(response.data))
      .catch((error) => console.error("Error:", error))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="loading">Memuat data...</div>;
  }

  const hitung = (status) => disposisi.filter((d) => d.status_disposisi === status).length;

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
            <div className="value">{hitung("pending")}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon approved">
            <FaCheckCircle />
          </div>
          <div className="stat-info">
            <h3>Disposisi Disetujui</h3>
            <div className="value">{hitung("disetujui")}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon rejected">
            <FaTimesCircle />
          </div>
          <div className="stat-info">
            <h3>Disposisi Ditolak</h3>
            <div className="value">{hitung("ditolak")}</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Disposisi Terbaru</h2>
          </div>
          <div className="notification-list">
            {disposisi.slice(0, 5).map((item) => (
              <div key={item.id} className="peminjaman-item">
                <div className="peminjaman-info">
                  <h4>{item.nama_organisasi}</h4>
                  <p>{item.nama_fasilitas} &middot; {formatWaktuUtc(item.created_at)}</p>
                  <StatusBadge status={item.status_disposisi} />
                </div>
              </div>
            ))}
            {disposisi.length === 0 && <div className="no-data">Belum ada disposisi</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function DaftarDisposisi() {
  const [disposisi, setDisposisi] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/peminjaman/wadek")
      .then((response) => setDisposisi(response.data))
      .catch((error) => console.error("Error:", error))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="loading">Memuat data...</div>;
  }

  // Sembunyikan peminjaman yang tanggalnya sudah lewat
  const aktif = disposisi.filter(
    (item) => new Date(`${item.tanggal_selesai}T${item.waktu_selesai}`) >= new Date()
  );

  return (
    <div className="dashboard-content">
      <h1 className="dashboard-title">Daftar Peminjaman Didisposisi</h1>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nama Organisasi</th>
              <th>Penanggung Jawab</th>
              <th>Fasilitas</th>
              <th>Jadwal Peminjaman</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {aktif.length > 0 ? (
              aktif.map((item) => (
                <tr key={item.id}>
                  <td>{item.nama_organisasi}</td>
                  <td>{item.penanggung_jawab}</td>
                  <td>{item.nama_fasilitas}</td>
                  <td>
                    {formatRentangTanggal(item.tanggal_mulai, item.tanggal_selesai)}
                    <br />
                    <small>{item.waktu_mulai} - {item.waktu_selesai}</small>
                  </td>
                  <td>
                    <StatusBadge status={item.status_disposisi} />
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-detail"
                        onClick={() => navigate(`/dashboard-wadek/disposisi/${item.id}`)}
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
                <td colSpan="6" className="text-center">Tidak ada peminjaman yang aktif</td>
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
      const response = await api.get(`/disposisi/${id}`);
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

  // Server ikut memperbarui status peminjaman sesuai keputusan
  const handleStatusUpdate = async (status, catatan = "") => {
    try {
      await api.put(`/disposisi/${id}/status`, { status_disposisi: status, catatan });
      setToastMessage(status === "disetujui" ? "Peminjaman disetujui" : "Peminjaman ditolak");
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
      <h2>Detail Peminjaman</h2>

      <div className="detail-section">
        <h3>Informasi Pemohon</h3>
        <table>
          <tbody>
            <tr>
              <td>Nama Organisasi</td>
              <td>: {disposisi.nama_organisasi}</td>
            </tr>
            <tr>
              <td>Penanggung Jawab</td>
              <td>: {disposisi.penanggung_jawab}</td>
            </tr>
            <tr>
              <td>Kontak</td>
              <td>: {disposisi.kontak_pj}</td>
            </tr>
            <tr>
              <td>Email</td>
              <td>: {disposisi.email}</td>
            </tr>
            <tr>
              <td>Fasilitas</td>
              <td>: {disposisi.nama_fasilitas}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="detail-section">
        <h3>Informasi Peminjaman</h3>
        <table>
          <tbody>
            <tr>
              <td>Tanggal Mulai</td>
              <td>: {formatTanggal(disposisi.tanggal_mulai)}</td>
            </tr>
            <tr>
              <td>Tanggal Selesai</td>
              <td>: {formatTanggal(disposisi.tanggal_selesai)}</td>
            </tr>
            <tr>
              <td>Waktu</td>
              <td>: {disposisi.waktu_mulai} - {disposisi.waktu_selesai}</td>
            </tr>
            <tr>
              <td>Keperluan</td>
              <td>: {disposisi.keperluan}</td>
            </tr>
            <tr>
              <td>Status</td>
              <td>: <StatusBadge status={disposisi.status_disposisi} /></td>
            </tr>
            {disposisi.status_disposisi === "ditolak" && (
              <tr>
                <td>Catatan</td>
                <td>: {disposisi.catatan}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <IzinKegiatanInfo izin={disposisi.izin_kegiatan} />

      <div className="detail-section">
        <h3>Dokumen</h3>
        <DokumenPreview filename={disposisi.surat_peminjaman} />
      </div>

      <div className="action-buttons">
        {disposisi.status_disposisi === "pending" && (
          <>
            <button className="btn-approve" onClick={() => handleStatusUpdate("disetujui")}>
              <i className="bi bi-check-lg"></i>
              Setujui
            </button>
            <button className="btn btn-danger" onClick={() => setShowReject(true)}>
              <i className="bi bi-x-lg"></i> Tolak
            </button>
          </>
        )}
        <button className="btn-back" onClick={() => navigate("/dashboard-wadek/disposisi")}>
          <i className="bi bi-arrow-left"></i>
          Kembali
        </button>
      </div>

      <RejectModal
        show={showReject}
        onHide={() => setShowReject(false)}
        onSubmit={(catatan) => handleStatusUpdate("ditolak", catatan)}
      />
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}
