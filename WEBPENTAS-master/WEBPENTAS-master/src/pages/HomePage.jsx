import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { FacilityCard } from '../components/common';

const ALUR = [
  ['Ajukan izin kegiatan', 'Isi formulir dan unggah surat permohonan izin kegiatan organisasi Anda.'],
  ['Tunggu persetujuan', 'Dekan memeriksa pengajuan, lalu meneruskannya ke Wakil Dekan 1 bila perlu.'],
  ['Booking fasilitas', 'Setelah izin disetujui, pilih ruangan dan jam yang masih kosong.'],
  ['Pantau statusnya', 'Lihat hasil keputusan dan catatan dari pimpinan di halaman status pengajuan.'],
];

export const HomePage = () => {
  const [facilities, setFacilities] = useState([]);

  useEffect(() => {
    api.get('/fasilitas')
      .then((response) => {
        // Tampilkan 3 fasilitas terbaru
        const terbaru = [...response.data].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
        setFacilities(terbaru.slice(0, 3));
      })
      .catch((error) => console.error('Error fetching facilities:', error));
  }, []);

  return (
    <>
      <section className="hero" style={{ backgroundImage: 'url(/sb3.jpg)' }} aria-labelledby="hero-title">
        <div className="container">
          <span className="eyebrow">Fakultas MIPA · Universitas Hasanuddin</span>
          <h1 id="hero-title">Pinjam ruang dan urus izin kegiatan di satu tempat</h1>
          <p>
            Ajukan izin kegiatan organisasi, cek jadwal ruangan yang masih kosong, dan pantau
            persetujuan pimpinan fakultas tanpa harus bolak-balik ke kantor.
          </p>
          <div className="hero-actions">
            <Link to="/izin-kegiatan" className="btn btn-primary btn-lg">Ajukan izin kegiatan</Link>
            <Link to="/peminjaman" className="btn btn-on-dark btn-lg">Lihat jadwal ruangan</Link>
          </div>
        </div>
      </section>

      <section className="page pb-0" aria-labelledby="alur-title">
        <div className="container">
          <span className="eyebrow">Alur pengajuan</span>
          <h2 id="alur-title" className="section-title">Empat langkah sampai ruangan bisa dipakai</h2>
          <ol className="steps">
            {ALUR.map(([judul, isi], index) => (
              <li key={judul}>
                <span className="step-no">{String(index + 1).padStart(2, '0')}</span>
                <h3>{judul}</h3>
                <p>{isi}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="page" aria-labelledby="fasilitas-title">
        <div className="container">
          <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
            <div>
              <span className="eyebrow">Fasilitas</span>
              <h2 id="fasilitas-title" className="section-title mb-0">Fasilitas terbaru</h2>
            </div>
            <Link to="/fasilitas" className="link-arrow">Semua fasilitas →</Link>
          </div>
          {facilities.length > 0 ? (
            <div className="facility-grid">
              {facilities.map((facility) => <FacilityCard key={facility.id} facility={facility} />)}
            </div>
          ) : (
            <div className="panel empty-state">Belum ada fasilitas yang terdaftar.</div>
          )}
        </div>
      </section>
    </>
  );
};
