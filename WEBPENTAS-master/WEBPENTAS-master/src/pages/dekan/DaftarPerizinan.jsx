import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api, { getErrorMessage } from "../../utils/api";
import { StatusBadge, Toast } from "../../components/common";
import { formatWaktuLokal } from "../../utils/format";

export function DaftarPerizinan() {
  const navigate = useNavigate();
  const [perizinan, setPerizinan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("pending");
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    api.get("/izin-kegiatan")
      .then((response) => setPerizinan(response.data))
      .catch((error) => setToastMessage(getErrorMessage(error, "Terjadi kesalahan saat memuat data perizinan.")))
      .finally(() => setLoading(false));
  }, []);

  // Data dari server sudah terurut dari yang terbaru
  const dataTampil = filterStatus === "semua" ? perizinan : perizinan.filter((item) => item.status === filterStatus);

  return (
    <div className="container">
      <h1 className="my-4 text-center">Daftar Perizinan</h1>

      <div className="mb-4">
        <label htmlFor="status-filter" className="form-label">Filter Status</label>
        <select
          id="status-filter"
          className="form-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="pending">Pending</option>
          <option value="disposisi">Disposisi ke WD1</option>
          <option value="disetujui">Disetujui</option>
          <option value="ditolak">Ditolak</option>
          <option value="semua">Semua</option>
        </select>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
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
              {dataTampil.length > 0 ? (
                dataTampil.map((item) => (
                  <tr key={item.id}>
                    <td>{item.nama_organisasi}</td>
                    <td>{item.penanggung_jawab}</td>
                    <td>{item.keperluan}</td>
                    <td>{formatWaktuLokal(item.tanggal_permintaan)}</td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate(`/dashboard-dekan/izin-kegiatan/${item.id}`)}
                      >
                        <i className="bi bi-eye"></i> Detail
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center">Tidak ada perizinan untuk status ini</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}
