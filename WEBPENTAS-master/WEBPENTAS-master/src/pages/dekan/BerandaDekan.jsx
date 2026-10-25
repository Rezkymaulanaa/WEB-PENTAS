import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../utils/api";
import { Loading, PageHeader, StatCard, StatusBadge } from "../../components/common";
import { formatTanggal, formatWaktuLokal, formatWaktuUtc } from "../../utils/format";

export function BerandaDekan() {
  const [data, setData] = useState(null);

  useEffect(() => {
    Promise.all([api.get("/peminjaman"), api.get("/disposisi"), api.get("/izin-kegiatan")])
      .then(([peminjaman, disposisi, izin]) => setData({
        peminjaman: peminjaman.data,
        disposisi: disposisi.data,
        izin: izin.data,
      }))
      .catch((error) => console.error("Error:", error));
  }, []);

  if (!data) return <Loading />;

  const izinMenunggu = data.izin.filter((i) => i.status === "pending");
  const pinjamMenunggu = data.peminjaman.filter((p) => p.status === "pending");

  return (
    <>
      <PageHeader eyebrow="Dekan" title="Ringkasan" description="Pengajuan yang menunggu keputusan Anda dan perkembangan disposisi." />

      <div className="stats-grid">
        <StatCard label="Izin kegiatan menunggu" value={izinMenunggu.length} tone="pending" />
        <StatCard label="Peminjaman menunggu" value={pinjamMenunggu.length} tone="pending" />
        <StatCard label="Di Wakil Dekan" tone="disposisi"
          value={data.disposisi.filter((d) => d.status_disposisi === "pending").length} />
        <StatCard label="Peminjaman disetujui" value={data.peminjaman.filter((p) => p.status === "disetujui").length} tone="ok" />
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Izin kegiatan menunggu</h2>
            <Link to="izin-kegiatan" className="link-arrow small">Semua →</Link>
          </div>
          {izinMenunggu.length ? (
            <ul className="item-list">
              {izinMenunggu.slice(0, 5).map((i) => (
                <li key={i.id}>
                  <span>
                    <Link to={`izin-kegiatan/${i.id}`} className="item-title">{i.keperluan}</Link>
                    <span className="item-sub">{i.nama_organisasi} · {formatWaktuLokal(i.tanggal_permintaan)}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : <p className="text-muted mb-0">Tidak ada izin yang menunggu.</p>}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Peminjaman menunggu</h2>
            <Link to="peminjaman" className="link-arrow small">Semua →</Link>
          </div>
          {pinjamMenunggu.length ? (
            <ul className="item-list">
              {pinjamMenunggu.slice(0, 5).map((p) => (
                <li key={p.id}>
                  <span>
                    <Link to={`peminjaman/${p.id}`} className="item-title">{p.nama_fasilitas}</Link>
                    <span className="item-sub">{p.nama_organisasi} · {formatTanggal(p.tanggal_mulai)}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : <p className="text-muted mb-0">Tidak ada peminjaman yang menunggu.</p>}
        </section>

        <section className="panel">
          <h2 className="panel-title">Disposisi terbaru ke Wakil Dekan 2</h2>
          {data.disposisi.length ? (
            <ul className="item-list">
              {data.disposisi.slice(0, 5).map((d) => (
                <li key={d.id}>
                  <span>
                    <span className="item-title">{d.nama_fasilitas}</span>
                    <span className="item-sub">{d.nama_organisasi} · {formatWaktuUtc(d.created_at)}</span>
                  </span>
                  <StatusBadge status={d.status_disposisi} />
                </li>
              ))}
            </ul>
          ) : <p className="text-muted mb-0">Belum ada disposisi.</p>}
        </section>
      </div>
    </>
  );
}
