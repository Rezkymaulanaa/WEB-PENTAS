import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { Loading, PageHeader, StatCard, StatusBadge } from '../../components/common';
import { formatTanggal } from '../../utils/format';

function DashboardHome() {
  const [data, setData] = useState(null);

  useEffect(() => {
    Promise.all([api.get('/users'), api.get('/fasilitas'), api.get('/peminjaman')])
      .then(([users, fasilitas, peminjaman]) => setData({
        users: users.data,
        fasilitas: fasilitas.data,
        peminjaman: peminjaman.data,
      }))
      .catch((error) => console.error('Error fetching data:', error));
  }, []);

  if (!data) return <Loading />;

  const terbaru = [...data.fasilitas].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));

  return (
    <>
      <PageHeader eyebrow="Admin" title="Ringkasan" description="Gambaran singkat pengguna, fasilitas, dan peminjaman." />

      <div className="stats-grid">
        <StatCard label="Pengguna" value={data.users.length} tone="brand" />
        <StatCard label="Fasilitas" value={data.fasilitas.length} tone="brand" />
        <StatCard label="Total peminjaman" value={data.peminjaman.length} />
        <StatCard label="Peminjaman menunggu" value={data.peminjaman.filter((p) => p.status === 'pending').length} tone="pending" />
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Peminjaman terbaru</h2>
          </div>
          {data.peminjaman.length ? (
            <ul className="item-list">
              {data.peminjaman.slice(0, 5).map((p) => (
                <li key={p.id}>
                  <span>
                    <span className="item-title">{p.nama_organisasi}</span>
                    <span className="item-sub">{p.nama_fasilitas} · {formatTanggal(p.tanggal_mulai)}</span>
                  </span>
                  <StatusBadge status={p.status} />
                </li>
              ))}
            </ul>
          ) : <p className="text-muted mb-0">Belum ada peminjaman.</p>}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Fasilitas terbaru</h2>
            <Link to="facilities" className="link-arrow small">Kelola →</Link>
          </div>
          {terbaru.length ? (
            <ul className="item-list">
              {terbaru.slice(0, 5).map((f) => (
                <li key={f.id}>
                  <span>
                    <span className="item-title">{f.nama_fasilitas}</span>
                    <span className="item-sub">{f.gedung} · Lantai {f.lantai}</span>
                  </span>
                  <span className="text-muted small">{f.kapasitas} orang</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-muted mb-0">Belum ada fasilitas.</p>}
        </section>
      </div>
    </>
  );
}

export default DashboardHome;
