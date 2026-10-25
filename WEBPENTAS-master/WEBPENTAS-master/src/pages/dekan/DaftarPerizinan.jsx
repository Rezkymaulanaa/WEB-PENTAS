import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api, { getErrorMessage } from "../../utils/api";
import { Loading, PageHeader, StatusBadge, Toast } from "../../components/common";
import { formatWaktuLokal } from "../../utils/format";

export function DaftarPerizinan() {
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
    <>
      <PageHeader
        eyebrow="Dekan"
        title="Izin kegiatan"
        description="Buka detail untuk menyetujui, menolak, atau mendisposisikan ke Wakil Dekan 1."
      />

      <div className="toolbar">
        <div>
          <label htmlFor="status-filter" className="form-label small">Status</label>
          <select id="status-filter" className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="pending">Menunggu</option>
            <option value="disposisi">Didisposisi ke WD1</option>
            <option value="disetujui">Disetujui</option>
            <option value="ditolak">Ditolak</option>
            <option value="dibatalkan">Dibatalkan</option>
            <option value="semua">Semua status</option>
          </select>
        </div>
      </div>

      {loading ? <Loading /> : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Kegiatan</th>
                <th scope="col">Penanggung jawab</th>
                <th scope="col">Diajukan</th>
                <th scope="col">Status</th>
                <th scope="col" className="cell-actions"><span className="visually-hidden">Aksi</span></th>
              </tr>
            </thead>
            <tbody>
              {dataTampil.length === 0 && (
                <tr><td colSpan="5" className="empty-state">Tidak ada izin kegiatan dengan status ini.</td></tr>
              )}
              {dataTampil.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span className="fw-semibold">{item.keperluan}</span>
                    <span className="cell-sub">{item.nama_organisasi}</span>
                  </td>
                  <td>{item.penanggung_jawab}</td>
                  <td>{formatWaktuLokal(item.tanggal_permintaan)}</td>
                  <td><StatusBadge status={item.status} /></td>
                  <td className="cell-actions">
                    <Link
                      to={`/dashboard-dekan/izin-kegiatan/${item.id}`}
                      className={`btn btn-sm ${item.status === "pending" ? "btn-primary" : "btn-secondary"}`}
                    >
                      {item.status === "pending" ? "Tinjau" : "Detail"}
                      <span className="visually-hidden"> {item.keperluan}</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </>
  );
}
