import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api, { getErrorMessage } from "../../utils/api";
import { RejectModal, StatusBadge, Toast } from "../../components/common";
import { formatRentangTanggal } from "../../utils/format";

export function DaftarPeminjaman() {
  const navigate = useNavigate();
  const [peminjaman, setPeminjaman] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: "semua", tanggal: "", keyword: "" });
  const [rejectId, setRejectId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchPeminjaman = useCallback(async () => {
    try {
      setLoading(true);
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

  const keyword = filter.keyword.toLowerCase();
  const dataTampil = peminjaman.filter((item) => {
    const statusMatch = filter.status === "semua" || item.status === filter.status;
    const tanggalMatch = !filter.tanggal || item.tanggal_mulai === filter.tanggal;
    const keywordMatch = !keyword
      || item.nama_organisasi.toLowerCase().includes(keyword)
      || (item.nama_fasilitas || "").toLowerCase().includes(keyword);
    return statusMatch && tanggalMatch && keywordMatch;
  });

  return (
    <div className="dashboard-content">
      <h1 className="dashboard-title">Daftar Peminjaman</h1>

      <div className="filter-container mb-4">
        <div className="filter-group">
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="form-select"
          >
            <option value="semua">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="disetujui">Disetujui</option>
            <option value="ditolak">Ditolak</option>
            <option value="disposisi">Disposisi</option>
          </select>

          <input
            type="date"
            value={filter.tanggal}
            onChange={(e) => setFilter({ ...filter, tanggal: e.target.value })}
            className="form-control"
          />

          <input
            type="text"
            placeholder="Cari Organisasi/Fasilitas"
            value={filter.keyword}
            onChange={(e) => setFilter({ ...filter, keyword: e.target.value })}
            className="form-control"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Memuat data peminjaman...</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama Organisasi</th>
                <th>Penanggung Jawab</th>
                <th>Fasilitas</th>
                <th>Waktu</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {dataTampil.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center">Tidak ada data peminjaman</td>
                </tr>
              )}
              {dataTampil.map((item) => (
                <tr key={item.id}>
                  <td>{item.nama_organisasi}</td>
                  <td>{item.penanggung_jawab}</td>
                  <td>{item.nama_fasilitas}</td>
                  <td>
                    {formatRentangTanggal(item.tanggal_mulai, item.tanggal_selesai)}
                    <br />
                    <small>
                      {item.waktu_mulai} - {item.waktu_selesai}
                    </small>
                  </td>
                  <td>
                    <StatusBadge status={item.status} />
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-detail"
                        onClick={() => navigate(`/dashboard-dekan/peminjaman/${item.id}`)}
                      >
                        <i className="bi bi-eye"></i>
                        Detail
                      </button>
                    </div>
                    {item.status === "pending" && (
                      <>
                        <button
                          className="btn btn-success btn-sm me-2"
                          onClick={() => handleStatusUpdate(item.id, "disetujui")}
                        >
                          Setujui
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => setRejectId(item.id)}>
                          Tolak
                        </button>
                      </>
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
      />
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}
