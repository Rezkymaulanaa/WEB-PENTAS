import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import api, { getErrorMessage } from "../../utils/api";
import { Loading, PageHeader, RejectModal, StatusBadge, Toast } from "../../components/common";
import { formatRentangTanggal } from "../../utils/format";

export function DaftarPeminjaman() {
  const [peminjaman, setPeminjaman] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: "pending", tanggal: "", keyword: "" });
  const [rejectId, setRejectId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchPeminjaman = useCallback(async () => {
    try {
      // Server otomatis mengubah peminjaman yang waktunya sudah lewat menjadi 'selesai'
      const response = await api.get("/peminjaman");
      setPeminjaman(response.data.filter((item) => item.status !== "selesai"));
    } catch (error) {
      setToastMessage(getErrorMessage(error, "Gagal memuat data peminjaman"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPeminjaman();
  }, [fetchPeminjaman]);

  const handleStatusUpdate = async (id, status, komentar = "") => {
    try {
      await api.put(`/peminjaman/${id}/status`, { status, komentar });
      setToastMessage(status === "disetujui" ? "Peminjaman disetujui" : "Peminjaman ditolak");
      fetchPeminjaman();
      return true;
    } catch (error) {
      setToastMessage(getErrorMessage(error, "Gagal memperbarui status"));
      return false;
    }
  };

  const keyword = filter.keyword.trim().toLowerCase();
  const dataTampil = peminjaman.filter((item) => {
    const statusMatch = filter.status === "semua" || item.status === filter.status;
    const tanggalMatch = !filter.tanggal || (item.tanggal_mulai <= filter.tanggal && item.tanggal_selesai >= filter.tanggal);
    const keywordMatch = !keyword
      || item.nama_organisasi.toLowerCase().includes(keyword)
      || (item.nama_fasilitas || "").toLowerCase().includes(keyword);
    return statusMatch && tanggalMatch && keywordMatch;
  });

  return (
    <>
      <PageHeader
        eyebrow="Dekan"
        title="Peminjaman fasilitas"
        description="Setujui atau tolak langsung, atau buka detail untuk mendisposisikan ke Wakil Dekan 2."
      />

      <div className="toolbar">
        <div>
          <label htmlFor="filter-status" className="form-label small">Status</label>
          <select id="filter-status" value={filter.status} className="form-select"
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
            <option value="pending">Menunggu</option>
            <option value="disposisi">Didisposisi</option>
            <option value="disetujui">Disetujui</option>
            <option value="ditolak">Ditolak</option>
            <option value="dibatalkan">Dibatalkan</option>
            <option value="semua">Semua status</option>
          </select>
        </div>
        <div>
          <label htmlFor="filter-tanggal" className="form-label small">Tanggal pemakaian</label>
          <input id="filter-tanggal" type="date" value={filter.tanggal} className="form-control"
            onChange={(e) => setFilter({ ...filter, tanggal: e.target.value })} />
        </div>
        <div>
          <label htmlFor="filter-kata" className="form-label small">Cari</label>
          <input id="filter-kata" type="search" placeholder="Organisasi atau fasilitas" value={filter.keyword}
            className="form-control" onChange={(e) => setFilter({ ...filter, keyword: e.target.value })} />
        </div>
      </div>

      {loading ? <Loading /> : (
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
              {dataTampil.length === 0 && (
                <tr><td colSpan="5" className="empty-state">Tidak ada peminjaman dengan filter ini.</td></tr>
              )}
              {dataTampil.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link to={`/dashboard-dekan/peminjaman/${item.id}`} className="fw-semibold">{item.nama_organisasi}</Link>
                    <span className="cell-sub">{item.penanggung_jawab}</span>
                  </td>
                  <td>{item.nama_fasilitas}</td>
                  <td>
                    {formatRentangTanggal(item.tanggal_mulai, item.tanggal_selesai)}
                    <span className="cell-sub">{item.waktu_mulai.replace(":", ".")}–{item.waktu_selesai.replace(":", ".")} WITA</span>
                  </td>
                  <td><StatusBadge status={item.status} /></td>
                  <td className="cell-actions">
                    {item.status === "pending" ? (
                      <>
                        <button className="btn btn-success btn-sm" onClick={() => handleStatusUpdate(item.id, "disetujui")}>
                          Setujui<span className="visually-hidden"> {item.nama_organisasi}</span>
                        </button>
                        <button className="btn btn-outline-danger btn-sm" onClick={() => setRejectId(item.id)}>
                          Tolak<span className="visually-hidden"> {item.nama_organisasi}</span>
                        </button>
                      </>
                    ) : (
                      <Link to={`/dashboard-dekan/peminjaman/${item.id}`} className="btn btn-secondary btn-sm">Detail</Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <RejectModal
        show={rejectId !== null}
        onHide={() => setRejectId(null)}
        onSubmit={(komentar) => handleStatusUpdate(rejectId, "ditolak", komentar)}
        title="Tolak peminjaman"
      />
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </>
  );
}
