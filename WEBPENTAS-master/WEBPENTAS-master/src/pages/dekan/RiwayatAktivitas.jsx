import { useState, useEffect } from "react";
import api from "../../utils/api";
import { formatTanggal } from "../../utils/format";

// Dipakai juga oleh dashboard Wakil Dekan 2
export function RiwayatAktivitas({ judul = "Riwayat Aktivitas" }) {
  const [riwayat, setRiwayat] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get("/peminjaman")
      .then((response) => setRiwayat(response.data.filter((item) => item.status === "selesai")))
      .catch((err) => {
        console.error(err);
        setError("Gagal mengambil data riwayat aktivitas");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container py-5">
      <h1 className="mb-4">{judul}</h1>

      {loading ? (
        <p>Memuat data riwayat...</p>
      ) : error ? (
        <p className="text-danger">{error}</p>
      ) : riwayat.length === 0 ? (
        <p>Tidak ada aktivitas yang telah selesai.</p>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead className="table-light">
              <tr>
                <th>Nama Organisasi</th>
                <th>Penanggung Jawab</th>
                <th>Nama Fasilitas</th>
                <th>Tanggal Mulai</th>
                <th>Tanggal Selesai</th>
                <th>Waktu Mulai</th>
                <th>Waktu Selesai</th>
              </tr>
            </thead>
            <tbody>
              {riwayat.map((item) => (
                <tr key={item.id}>
                  <td>{item.nama_organisasi}</td>
                  <td>{item.penanggung_jawab}</td>
                  <td>{item.nama_fasilitas}</td>
                  <td>{formatTanggal(item.tanggal_mulai)}</td>
                  <td>{formatTanggal(item.tanggal_selesai)}</td>
                  <td>{item.waktu_mulai}</td>
                  <td>{item.waktu_selesai}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
