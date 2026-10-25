import { Link } from 'react-router-dom';
import { DokumenPreview, InfoList, IzinKegiatanInfo, StatusBadge } from './common';
import { formatTanggal, formatWaktuLokal } from '../utils/format';

const jam = (value) => (value || '').replace(':', '.');

export const BackLink = ({ to, children }) => (
  <Link to={to} className="link-arrow small d-inline-block mb-3">← {children}</Link>
);

// Isi halaman detail peminjaman (dipakai Dekan & Wakil Dekan 2)
export const PeminjamanDetail = ({ data, status, catatan }) => (
  <>
    <section className="panel">
      <div className="panel-head">
        <h2 className="panel-title">Jadwal & fasilitas</h2>
        <StatusBadge status={status} />
      </div>
      <InfoList items={[
        ['Fasilitas', data.nama_fasilitas],
        ['Tanggal', data.tanggal_mulai === data.tanggal_selesai
          ? formatTanggal(data.tanggal_mulai)
          : `${formatTanggal(data.tanggal_mulai)} – ${formatTanggal(data.tanggal_selesai)}`],
        ['Waktu', `${jam(data.waktu_mulai)}–${jam(data.waktu_selesai)} WITA`],
        ['Keperluan', data.keperluan],
        catatan && ['Catatan', catatan],
      ]} />
    </section>

    <section className="panel">
      <h2 className="panel-title">Pemohon</h2>
      <InfoList items={[
        ['Organisasi', data.nama_organisasi],
        ['Penanggung jawab', data.penanggung_jawab],
        ['Kontak', data.kontak_pj],
        ['Email', data.email && <a key="m" href={`mailto:${data.email}`}>{data.email}</a>],
      ]} />
    </section>

    <IzinKegiatanInfo izin={data.izin_kegiatan} />

    <section className="panel">
      <h2 className="panel-title">Surat peminjaman</h2>
      <DokumenPreview filename={data.surat_peminjaman} />
    </section>
  </>
);

// Isi halaman detail izin kegiatan (dipakai Dekan & Wakil Dekan 1)
export const IzinDetail = ({ data, status, catatan }) => (
  <>
    <section className="panel">
      <div className="panel-head">
        <h2 className="panel-title">Kegiatan & pemohon</h2>
        <StatusBadge status={status} />
      </div>
      <InfoList items={[
        ['Kegiatan', data.keperluan],
        ['Organisasi', data.nama_organisasi],
        ['Penanggung jawab', data.penanggung_jawab],
        ['Kontak', data.kontak_pj],
        ['Email', data.email && <a key="m" href={`mailto:${data.email}`}>{data.email}</a>],
        ['Diajukan', formatWaktuLokal(data.tanggal_permintaan)],
        catatan && ['Catatan', catatan],
      ]} />
    </section>

    <section className="panel">
      <h2 className="panel-title">Surat permohonan</h2>
      <DokumenPreview filename={data.surat_perizinan} />
    </section>
  </>
);
