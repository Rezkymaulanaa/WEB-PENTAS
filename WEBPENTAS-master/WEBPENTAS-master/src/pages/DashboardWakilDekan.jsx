import { Routes, Route, Link, useParams } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { FaInbox, FaHome, FaHistory } from "react-icons/fa";
import api, { getErrorMessage } from "../utils/api";
import { DashboardLayout } from "../components/DashboardLayout";
import { Loading, PageHeader, RejectModal, StatCard, StatusBadge, Toast } from "../components/common";
import { BackLink, PeminjamanDetail } from "../components/detail";
import { RiwayatAktivitas } from "./dekan/RiwayatAktivitas";
import { formatRentangTanggal, formatWaktuUtc } from "../utils/format";

// Dashboard Wakil Dekan 2: memutuskan peminjaman ruangan/sarana yang didisposisi Dekan
const MENU = [
  { to: "/dashboard-wadek", label: "Ringkasan", icon: FaHome, end: true },
  { to: "/dashboard-wadek/disposisi", label: "Disposisi peminjaman", icon: FaInbox },
  { to: "/dashboard-wadek/riwayat", label: "Riwayat peminjaman", icon: FaHistory },
];

export function DashboardWakilDekan() {
  return (
    <DashboardLayout title="Wakil Dekan 2" items={MENU}>
      <Routes>
        <Route index element={<BerandaWadek />} />
        <Route path="disposisi" element={<DaftarDisposisi />} />
        <Route path="disposisi/:id" element={<DetailDisposisi />} />
        <Route path="riwayat" element={<RiwayatAktivitas eyebrow="Wakil Dekan 2" />} />
      </Routes>
    </DashboardLayout>
  );
}

const useDisposisi = () => {
  const [disposisi, setDisposisi] = useState(null);
  useEffect(() => {
    api.get("/peminjaman/wadek")
      .then((response) => setDisposisi(response.data))
      .catch((error) => {
        console.error("Error:", error);
        setDisposisi([]);
      });
  }, []);
  return disposisi;
};

function BerandaWadek() {
  const disposisi = useDisposisi();
  if (!disposisi) return <Loading />;

  const hitung = (status) => disposisi.filter((d) => d.status_disposisi === status).length;
  const menunggu = disposisi.filter((d) => d.status_disposisi === "pending");

  return (
    <>
      <PageHeader eyebrow="Wakil Dekan 2" title="Ringkasan" description="Peminjaman fasilitas yang didisposisikan Dekan kepada Anda." />

      <div className="stats-grid">
        <StatCard label="Menunggu keputusan" value={hitung("pending")} tone="pending" />
        <StatCard label="Disetujui" value={hitung("disetujui")} tone="ok" />
        <StatCard label="Ditolak" value={hitung("ditolak")} tone="no" />
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2 className="panel-title">Menunggu keputusan Anda</h2>
          <Link to="disposisi" className="link-arrow small">Semua →</Link>
        </div>
        {menunggu.length ? (
          <ul className="item-list">
            {menunggu.slice(0, 6).map((item) => (
              <li key={item.id}>
                <span>
                  <Link to={`disposisi/${item.id}`} className="item-title">{item.nama_fasilitas}</Link>
                  <span className="item-sub">
                    {item.nama_organisasi} · {formatRentangTanggal(item.tanggal_mulai, item.tanggal_selesai)} · didisposisi {formatWaktuUtc(item.created_at)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : <p className="text-muted mb-0">Tidak ada disposisi yang menunggu.</p>}
      </section>
    </>
  );
}

function DaftarDisposisi() {
  const disposisi = useDisposisi();
  if (!disposisi) return <Loading />;

  // Sembunyikan peminjaman yang tanggalnya sudah lewat
  const aktif = disposisi.filter(
    (item) => new Date(`${item.tanggal_selesai}T${item.waktu_selesai}`) >= new Date()
  );

  return (
    <>
      <PageHeader eyebrow="Wakil Dekan 2" title="Disposisi peminjaman" description="Peminjaman yang jadwalnya belum lewat." />

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Pemohon</th>
              <th scope="col">Fasilitas</th>
              <th scope="col">Jadwal</th>
              <th scope="col">Status</th>
              <th scope="col" className="cell-actions"><span className="visually-hidden">Aksi</span></th>
            </tr>
          </thead>
          <tbody>
            {aktif.length === 0 && (
              <tr><td colSpan="5" className="empty-state">Tidak ada peminjaman aktif.</td></tr>
            )}
            {aktif.map((item) => (
              <tr key={item.id}>
                <td>
                  <span className="fw-semibold">{item.nama_organisasi}</span>
                  <span className="cell-sub">{item.penanggung_jawab}</span>
                </td>
                <td>{item.nama_fasilitas}</td>
                <td>
                  {formatRentangTanggal(item.tanggal_mulai, item.tanggal_selesai)}
                  <span className="cell-sub">{item.waktu_mulai.replace(":", ".")}–{item.waktu_selesai.replace(":", ".")} WITA</span>
                </td>
                <td><StatusBadge status={item.status_disposisi} /></td>
                <td className="cell-actions">
                  <Link
                    to={`/dashboard-wadek/disposisi/${item.id}`}
                    className={`btn btn-sm ${item.status_disposisi === "pending" ? "btn-primary" : "btn-secondary"}`}
                  >
                    {item.status_disposisi === "pending" ? "Tinjau" : "Detail"}
                    <span className="visually-hidden"> {item.nama_organisasi}</span>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function DetailDisposisi() {
  const { id } = useParams();
  const [disposisi, setDisposisi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReject, setShowReject] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchDetailDisposisi = useCallback(async () => {
    try {
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

  if (loading) return <Loading />;
  if (!disposisi) return <div className="panel empty-state">Data tidak ditemukan.</div>;

  return (
    <div className="detail-container">
      <BackLink to="/dashboard-wadek/disposisi">Disposisi peminjaman</BackLink>
      <PageHeader eyebrow="Disposisi dari Dekan" title={disposisi.nama_organisasi} />

      <PeminjamanDetail
        data={disposisi}
        status={disposisi.status_disposisi}
        catatan={disposisi.status_disposisi === "ditolak" ? disposisi.catatan : null}
      />

      {disposisi.status_disposisi === "pending" && (
        <div className="detail-actions">
          <button className="btn btn-success" onClick={() => handleStatusUpdate("disetujui")}>
            <i className="bi bi-check-lg" aria-hidden="true"></i> Setujui peminjaman
          </button>
          <span className="spacer" />
          <button className="btn btn-outline-danger" onClick={() => setShowReject(true)}>Tolak</button>
        </div>
      )}

      <RejectModal
        show={showReject}
        onHide={() => setShowReject(false)}
        onSubmit={(catatan) => handleStatusUpdate("ditolak", catatan)}
        title="Tolak peminjaman"
      />
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}
