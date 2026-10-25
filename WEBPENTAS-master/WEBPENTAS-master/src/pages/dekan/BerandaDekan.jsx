import { useState, useEffect } from "react";
import { FaClipboardList, FaCheckCircle, FaTimesCircle, FaExchangeAlt, FaFileSignature } from "react-icons/fa";
import api from "../../utils/api";
import { StatusBadge } from "../../components/common";
import { formatWaktuUtc } from "../../utils/format";

const StatCard = ({ icon: Icon, className, label, value }) => (
  <div className="stat-card">
    <div className={`stat-icon ${className}`}>
      <Icon />
    </div>
    <div className="stat-info">
      <h3>{label}</h3>
      <div className="value">{value}</div>
    </div>
  </div>
);

export function BerandaDekan() {
  const [peminjaman, setPeminjaman] = useState([]);
  const [disposisi, setDisposisi] = useState([]);
  const [izin, setIzin] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/peminjaman"), api.get("/disposisi"), api.get("/izin-kegiatan")])
      .then(([peminjamanRes, disposisiRes, izinRes]) => {
        setPeminjaman(peminjamanRes.data);
        setDisposisi(disposisiRes.data);
        setIzin(izinRes.data);
      })
      .catch((error) => console.error("Error:", error))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="loading">Memuat data...</div>;
  }

  const hitung = (status) => peminjaman.filter((p) => (p.status || "pending") === status).length;

  return (
    <div className="dashboard-content">
      <h1 className="dashboard-title">Dashboard Overview</h1>

      <div className="stats-grid">
        <StatCard icon={FaFileSignature} className="pending" label="Izin Kegiatan Pending"
          value={izin.filter((i) => i.status === "pending").length} />
        <StatCard icon={FaClipboardList} className="pending" label="Peminjaman Pending" value={hitung("pending")} />
        <StatCard icon={FaCheckCircle} className="approved" label="Peminjaman Disetujui" value={hitung("disetujui")} />
        <StatCard icon={FaTimesCircle} className="rejected" label="Peminjaman Ditolak" value={hitung("ditolak")} />
        <StatCard icon={FaExchangeAlt} className="disposisi" label="Menunggu Keputusan WD2"
          value={disposisi.filter((d) => d.status_disposisi === "pending").length} />
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Peminjaman Terbaru</h2>
          </div>
          <div className="peminjaman-list">
            {peminjaman.slice(0, 5).map((p) => (
              <div key={p.id} className="peminjaman-item">
                <div className="peminjaman-info">
                  <h4 className="fw-bold">{p.nama_organisasi}</h4>
                  <div className="peminjaman-details">
                    <span>
                      <i className="bi bi-building"></i> {p.nama_fasilitas}
                    </span>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              </div>
            ))}
            {peminjaman.length === 0 && <div className="no-data">Belum ada peminjaman</div>}
          </div>
        </div>

        <div className="dashboard-card disposisi-terbaru">
          <div className="card-header">
            <h2>Disposisi Terbaru</h2>
          </div>
          <div className="disposisi-list">
            {disposisi.length > 0 ? (
              disposisi.slice(0, 5).map((item) => (
                <div key={item.id} className="disposisi-item">
                  <div className="disposisi-header">
                    <span className="org-name">Disposisi ke Wakil Dekan 2</span>
                  </div>
                  <div className="peminjaman-info">
                    <span>Peminjaman: </span>
                    <span>
                      {item.nama_organisasi} - {item.nama_fasilitas}
                    </span>
                  </div>
                  <div className="disposisi-info">
                    <div className="time-info">
                      <span>Waktu Disposisi: </span>
                      <span>{formatWaktuUtc(item.created_at)}</span>
                    </div>
                    <StatusBadge status={item.status_disposisi} />
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data">Tidak ada disposisi terbaru</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
