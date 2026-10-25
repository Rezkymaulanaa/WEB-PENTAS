import { Routes, Route, Link, useParams } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { FaInbox, FaHome, FaHistory } from "react-icons/fa";
import api, { getErrorMessage } from "../utils/api";
import { DashboardLayout } from "../components/DashboardLayout";
import { Loading, PageHeader, RejectModal, StatCard, StatusBadge, Toast } from "../components/common";
import { BackLink, IzinDetail } from "../components/detail";
import { formatWaktuLokal, formatWaktuUtc } from "../utils/format";

// Dashboard Wakil Dekan 1: memutuskan izin kegiatan yang didisposisi Dekan
const MENU = [
  { to: "/dashboard-wadek1", label: "Ringkasan", icon: FaHome, end: true },
  { to: "/dashboard-wadek1/disposisi-kegiatan", label: "Disposisi izin kegiatan", icon: FaInbox },
  { to: "/dashboard-wadek1/riwayat", label: "Riwayat keputusan", icon: FaHistory },
];

export function DashboardWakilDekan1() {
  return (
    <DashboardLayout title="Wakil Dekan 1" items={MENU}>
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
  const [data, setData] = useState(null);

  useEffect(() => {
    Promise.all([api.get("/perizinan/wadek1"), api.get("/perizinan/wadek1/notifications")])
      .then(([pending, terbaru]) => setData({ pending: pending.data, terbaru: terbaru.data }))
      .catch((error) => {
        console.error("Error:", error);
        setData({ pending: [], terbaru: [] });
      });
  }, []);

  if (!data) return <Loading />;

  return (
    <>
      <PageHeader eyebrow="Wakil Dekan 1" title="Ringkasan" description="Izin kegiatan yang didisposisikan Dekan kepada Anda." />

      <div className="stats-grid">
        <StatCard label="Menunggu keputusan" value={data.pending.length} tone="pending" />
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2 className="panel-title">Disposisi terbaru</h2>
          <Link to="disposisi-kegiatan" className="link-arrow small">Semua →</Link>
        </div>
        {data.terbaru.length ? (
          <ul className="item-list">
            {data.terbaru.map((item) => (
              <li key={item.id}>
                <span>
                  {item.status_disposisi === "pending"
                    ? <Link to={`disposisi-kegiatan/${item.id}`} className="item-title">{item.keperluan}</Link>
                    : <span className="item-title">{item.keperluan}</span>}
                  <span className="item-sub">{item.nama_organisasi} · didisposisi {formatWaktuUtc(item.created_at)}</span>
                </span>
                <StatusBadge status={item.status_disposisi} />
              </li>
            ))}
          </ul>
        ) : <p className="text-muted mb-0">Belum ada disposisi.</p>}
      </section>
    </>
  );
}

function DaftarDisposisi() {
  const [perizinan, setPerizinan] = useState(null);

  useEffect(() => {
    // Server hanya mengirim disposisi yang masih menunggu, terurut dari terbaru
    api.get("/perizinan/wadek1")
      .then((response) => setPerizinan(response.data))
      .catch((error) => {
        console.error("Error:", error);
        setPerizinan([]);
      });
  }, []);

  if (!perizinan) return <Loading />;

  return (
    <>
      <PageHeader eyebrow="Wakil Dekan 1" title="Disposisi izin kegiatan" description="Izin kegiatan yang menunggu keputusan Anda." />

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Kegiatan</th>
              <th scope="col">Penanggung jawab</th>
              <th scope="col">Diajukan</th>
              <th scope="col" className="cell-actions"><span className="visually-hidden">Aksi</span></th>
            </tr>
          </thead>
          <tbody>
            {perizinan.length === 0 && (
              <tr><td colSpan="4" className="empty-state">Tidak ada izin kegiatan yang menunggu.</td></tr>
            )}
            {perizinan.map((item) => (
              <tr key={item.id}>
                <td>
                  <span className="fw-semibold">{item.keperluan}</span>
                  <span className="cell-sub">{item.nama_organisasi}</span>
                </td>
                <td>{item.penanggung_jawab}</td>
                <td>{formatWaktuLokal(item.tanggal_permintaan)}</td>
                <td className="cell-actions">
                  <Link to={`/dashboard-wadek1/disposisi-kegiatan/${item.id}`} className="btn btn-primary btn-sm">
                    Tinjau<span className="visually-hidden"> {item.keperluan}</span>
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
      setToastMessage(status === "disetujui" ? "Izin kegiatan disetujui" : "Izin kegiatan ditolak");
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
      <BackLink to="/dashboard-wadek1/disposisi-kegiatan">Disposisi izin kegiatan</BackLink>
      <PageHeader eyebrow="Disposisi dari Dekan" title={disposisi.keperluan} description={disposisi.nama_organisasi} />

      <IzinDetail
        data={disposisi}
        status={disposisi.status_disposisi}
        catatan={disposisi.status_disposisi === "ditolak" ? disposisi.komentar : null}
      />

      {disposisi.status_disposisi === "pending" && (
        <div className="detail-actions">
          <button className="btn btn-success" onClick={() => handleStatusUpdate("disetujui")}>
            <i className="bi bi-check-lg" aria-hidden="true"></i> Setujui izin kegiatan
          </button>
          <span className="spacer" />
          <button className="btn btn-outline-danger" onClick={() => setShowReject(true)}>Tolak</button>
        </div>
      )}

      <RejectModal
        show={showReject}
        onHide={() => setShowReject(false)}
        onSubmit={(komentar) => handleStatusUpdate("ditolak", komentar)}
        title="Tolak izin kegiatan"
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

  return (
    <>
      <PageHeader eyebrow="Wakil Dekan 1" title="Riwayat keputusan" description="Izin kegiatan yang sudah Anda setujui atau tolak." />

      {loading ? <Loading /> : error ? <div className="alert alert-danger">{error}</div> : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Kegiatan</th>
                <th scope="col">Diajukan</th>
                <th scope="col">Keputusan</th>
                <th scope="col">Catatan</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 && (
                <tr><td colSpan="4" className="empty-state">Belum ada riwayat.</td></tr>
              )}
              {history.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span className="fw-semibold">{item.keperluan}</span>
                    <span className="cell-sub">{item.nama_organisasi}</span>
                  </td>
                  <td>{formatWaktuLokal(item.tanggal_permintaan)}</td>
                  <td><StatusBadge status={item.status_disposisi} /></td>
                  <td className="text-muted">{item.komentar || "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <nav aria-label="Halaman riwayat">
          <ul className="pagination justify-content-center mt-4">
            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)}>Sebelumnya</button>
            </li>
            {Array.from({ length: totalPages }, (_, i) => (
              <li key={i} className={`page-item ${currentPage === i + 1 ? "active" : ""}`}>
                <button className="page-link" onClick={() => setCurrentPage(i + 1)} aria-current={currentPage === i + 1 ? "page" : undefined}>
                  {i + 1}
                </button>
              </li>
            ))}
            <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)}>Berikutnya</button>
            </li>
          </ul>
        </nav>
      )}
    </>
  );
}
