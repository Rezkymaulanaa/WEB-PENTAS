import { useState, useEffect } from "react";
import api from "../../utils/api";
import { Loading, PageHeader, StatusBadge } from "../../components/common";
import { formatRentangTanggal } from "../../utils/format";

const STATUS_RIWAYAT = ["selesai", "disetujui", "ditolak", "dibatalkan"];

// Dipakai juga oleh dashboard Wakil Dekan 2
export function RiwayatAktivitas({ eyebrow = "Dekan", judul = "Riwayat peminjaman" }) {
  const [riwayat, setRiwayat] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("selesai");

  useEffect(() => {
    api.get("/peminjaman")
      .then((response) => setRiwayat(response.data.filter((item) => STATUS_RIWAYAT.includes(item.status))))
      .catch(() => setError("Gagal mengambil data riwayat"))
      .finally(() => setLoading(false));
  }, []);

  const tampil = status === "semua" ? riwayat : riwayat.filter((r) => r.status === status);

  return (
    <>
      <PageHeader eyebrow={eyebrow} title={judul} description="Peminjaman yang sudah diputuskan atau telah berlangsung." />

      <div className="toolbar">
        <div>
          <label htmlFor="riwayat-status" className="form-label small">Status</label>
          <select id="riwayat-status" className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="selesai">Selesai</option>
            <option value="disetujui">Disetujui (akan datang)</option>
            <option value="ditolak">Ditolak</option>
            <option value="dibatalkan">Dibatalkan</option>
            <option value="semua">Semua</option>
          </select>
        </div>
      </div>

      {loading ? <Loading /> : error ? <div className="alert alert-danger">{error}</div> : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Pemohon</th>
                <th scope="col">Fasilitas</th>
                <th scope="col">Jadwal</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {tampil.length === 0 && (
                <tr><td colSpan="4" className="empty-state">Belum ada riwayat dengan status ini.</td></tr>
              )}
              {tampil.map((item) => (
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
                  <td>
                    <StatusBadge status={item.status} />
                    {item.komentar && <span className="cell-sub">{item.komentar}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
