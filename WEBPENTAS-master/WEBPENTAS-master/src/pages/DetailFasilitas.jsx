import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Modal } from 'react-bootstrap';
import api, { fasilitasImageUrl, getErrorMessage, handleImageError } from '../utils/api';
import { getSession } from '../utils/auth';
import { formatRentangTanggal, formatWaktuLokal } from '../utils/format';

const FORM_KOSONG = {
  id_izin_kegiatan: '',
  nama_organisasi: '',
  tanggal_mulai: '',
  tanggal_selesai: '',
  waktu_mulai: '',
  waktu_selesai: '',
  penanggung_jawab: '',
  kontak_pj: '',
  keperluan: '',
  email: '',
};

// Pilihan jam format 24 jam (06.00 - 22.00, tiap 30 menit) agar tidak tertukar AM/PM
const PILIHAN_JAM = Array.from({ length: 33 }, (_, i) => {
  const menit = 6 * 60 + i * 30;
  return `${String(Math.floor(menit / 60)).padStart(2, '0')}:${String(menit % 60).padStart(2, '0')}`;
});

const labelJam = (jam) => jam.replace(':', '.');

const keDateTime = (tanggal, waktu) => (tanggal && waktu ? new Date(`${tanggal}T${waktu}`) : null);

const hariIni = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatTanggalPanjang = (tanggal) =>
  new Date(`${tanggal}T00:00:00`).toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

const formatDurasi = (mulai, selesai) => {
  const totalMenit = Math.round((selesai - mulai) / 60000);
  const hari = Math.floor(totalMenit / 1440);
  const jam = Math.floor((totalMenit % 1440) / 60);
  const menit = totalMenit % 60;
  return [hari && `${hari} hari`, jam && `${jam} jam`, menit && `${menit} menit`].filter(Boolean).join(' ');
};

export const DetailFasilitas = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [facility, setFacility] = useState(null);
  const [formData, setFormData] = useState(FORM_KOSONG);
  const [multiHari, setMultiHari] = useState(false);
  const [suratPeminjaman, setSuratPeminjaman] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [bookings, setBookings] = useState([]);
  const [izinDisetujui, setIzinDisetujui] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const fetchBookings = () =>
    api.get(`/peminjaman/fasilitas/${id}`).then((response) => setBookings(response.data));

  useEffect(() => {
    api.get(`/fasilitas/${id}`)
      .then((response) => setFacility(response.data))
      .catch((err) => console.error('Error:', err));
    fetchBookings().catch((err) => console.error('Error:', err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const images = facility
    ? [facility.image, facility.image2, facility.image3].filter(Boolean).map(fasilitasImageUrl)
    : [];

  const jadwalMendatang = bookings.filter(
    (booking) => keDateTime(booking.tanggal_selesai, booking.waktu_selesai) > new Date()
  );

  const tanggalSelesai = multiHari ? formData.tanggal_selesai : formData.tanggal_mulai;
  const mulai = keDateTime(formData.tanggal_mulai, formData.waktu_mulai);
  const selesai = keDateTime(tanggalSelesai, formData.waktu_selesai);

  // Jadwal yang sudah dipesan pada tanggal yang dipilih
  const terpakaiDiTanggal = useMemo(() => {
    if (!formData.tanggal_mulai) return [];
    const akhir = tanggalSelesai || formData.tanggal_mulai;
    return bookings.filter((b) => b.tanggal_mulai <= akhir && b.tanggal_selesai >= formData.tanggal_mulai);
  }, [bookings, formData.tanggal_mulai, tanggalSelesai]);

  // Cek waktu & bentrok dari nilai form terbaru
  const pesanWaktu = useMemo(() => {
    if (!mulai || !selesai) return '';
    if (selesai <= mulai) return 'Jam selesai harus setelah jam mulai';
    if (mulai < new Date()) return 'Waktu mulai sudah lewat, pilih jam atau tanggal lain';
    const bentrok = bookings.some((booking) => {
      const bookedStart = keDateTime(booking.tanggal_mulai, booking.waktu_mulai);
      const bookedEnd = keDateTime(booking.tanggal_selesai, booking.waktu_selesai);
      return mulai < bookedEnd && selesai > bookedStart;
    });
    return bentrok ? 'Jam tersebut sudah dipesan, silakan pilih jam lain' : '';
  }, [mulai, selesai, bookings]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      // Isi otomatis data dari izin kegiatan yang dipilih
      if (name === 'id_izin_kegiatan') {
        const izin = izinDisetujui.find((item) => String(item.id) === value);
        if (izin) {
          next.nama_organisasi = izin.nama_organisasi;
          next.penanggung_jawab = izin.penanggung_jawab;
          next.keperluan = izin.keperluan;
          next.kontak_pj = (izin.kontak_pj || '').slice(0, 15);
          next.email = izin.email || '';
        }
      }
      // Kosongkan jam selesai jika tidak lagi setelah jam mulai
      if (name === 'waktu_mulai' && !multiHari && prev.waktu_selesai && prev.waktu_selesai <= value) {
        next.waktu_selesai = '';
      }
      return next;
    });
  };

  const handleBookingClick = async () => {
    const { isLoggedIn, role } = getSession();

    if (!isLoggedIn) {
      alert('Silakan login terlebih dahulu untuk melakukan peminjaman fasilitas');
      navigate('/login');
      return;
    }
    if (role !== 'mahasiswa') {
      alert('Peminjaman fasilitas hanya dapat diajukan oleh akun mahasiswa.');
      return;
    }

    try {
      const response = await api.get('/izin-kegiatan/me');
      const disetujui = response.data.filter((izin) => izin.status === 'disetujui');
      setIzinDisetujui(disetujui);
      // Jika hanya ada satu izin, langsung pilih dan isi otomatis
      if (disetujui.length === 1 && !formData.id_izin_kegiatan) {
        const izin = disetujui[0];
        setFormData((prev) => ({
          ...prev,
          id_izin_kegiatan: String(izin.id),
          nama_organisasi: izin.nama_organisasi,
          penanggung_jawab: izin.penanggung_jawab,
          keperluan: izin.keperluan,
          kontak_pj: (izin.kontak_pj || '').slice(0, 15),
          email: izin.email || '',
        }));
      }
    } catch (err) {
      console.error('Gagal memuat izin kegiatan:', err);
    }
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pesanWaktu) {
      setError(pesanWaktu);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('id_fasilitas', id);
      Object.entries({ ...formData, tanggal_selesai: tanggalSelesai })
        .forEach(([key, value]) => formDataToSend.append(key, value));
      formDataToSend.append('surat_peminjaman', suratPeminjaman);

      const response = await api.post('/peminjaman', formDataToSend);
      alert(`${response.data.message}. Pantau statusnya di halaman Notifikasi.`);
      setFormData(FORM_KOSONG);
      setMultiHari(false);
      setSuratPeminjaman(null);
      setShowForm(false);
      fetchBookings();
    } catch (err) {
      setError(getErrorMessage(err, 'Terjadi kesalahan saat mengajukan peminjaman'));
    } finally {
      setLoading(false);
    }
  };

  const pilihanJamSelesai = multiHari
    ? PILIHAN_JAM
    : PILIHAN_JAM.filter((jam) => !formData.waktu_mulai || jam > formData.waktu_mulai);

  // Header memakai foto fasilitas itu sendiri, cadangannya foto gedung Unhas
  const fotoHeader = images[0] || '/gedung-rektorat.jpg';

  return (
    <div>
      <section className="page-banner" style={{ backgroundImage: `url("${fotoHeader}")` }}>
        <div className="container">
          <div>
            <Link to="/fasilitas" className="breadcrumb-link">← Semua fasilitas</Link>
            <h1 className="mt-2">{facility ? facility.nama_fasilitas : 'Memuat...'}</h1>
            {facility && (
              <p>
                {[facility.gedung, facility.lantai && `Lantai ${facility.lantai}`, `Kapasitas ${facility.kapasitas} orang`]
                  .filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          <button className="btn btn-primary btn-lg" onClick={handleBookingClick} disabled={!facility}>
            <i className="bi bi-calendar-plus" aria-hidden="true"></i> Ajukan peminjaman
          </button>
        </div>
      </section>

      {/* Modal Form Peminjaman */}
      <Modal show={showForm} onHide={() => setShowForm(false)} size="lg" aria-labelledby="judul-form-peminjaman">
        <Modal.Header closeButton>
          <Modal.Title id="judul-form-peminjaman">
            Peminjaman {facility?.nama_fasilitas}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {izinDisetujui.length === 0 ? (
            <div className="alert alert-warning mb-0">
              Peminjaman ruangan/fasilitas memerlukan <strong>izin kegiatan yang sudah disetujui</strong>.
              Anda belum memiliki izin kegiatan yang disetujui.{' '}
              <Link to="/izin-kegiatan">Ajukan izin kegiatan</Link> terlebih dahulu, lalu cek statusnya di
              halaman <Link to="/notifications">Notifikasi</Link>.
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <div className="alert alert-danger">{error}</div>}

              {/* 1. Kegiatan */}
              <h3 className="form-section-title">1. Kegiatan</h3>
              <div className="mb-3">
                <label htmlFor="bk-id_izin_kegiatan" className="form-label">Izin kegiatan yang sudah disetujui</label>
                <select
                  className="form-select"
                  id="bk-id_izin_kegiatan" name="id_izin_kegiatan"
                  value={formData.id_izin_kegiatan}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">-- Pilih izin kegiatan --</option>
                  {izinDisetujui.map((izin) => (
                    <option key={izin.id} value={izin.id}>
                      {izin.nama_organisasi} - {izin.keperluan} (diajukan {formatWaktuLokal(izin.tanggal_permintaan)})
                    </option>
                  ))}
                </select>
                <div className="form-text">Data organisasi dan penanggung jawab akan terisi otomatis dari izin ini.</div>
              </div>

              <div className="row mb-4">
                <div className="col-md-6 mb-3 mb-md-0">
                  <label htmlFor="bk-nama_organisasi" className="form-label">Nama Organisasi</label>
                  <input
                    type="text"
                    className="form-control"
                    id="bk-nama_organisasi" name="nama_organisasi"
                    value={formData.nama_organisasi}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="bk-keperluan" className="form-label">Keperluan Peminjaman</label>
                  <input
                    type="text"
                    className="form-control"
                    id="bk-keperluan" name="keperluan"
                    value={formData.keperluan}
                    onChange={handleInputChange}
                    placeholder="Contoh: Seminar Nasional"
                    required
                  />
                </div>
              </div>

              {/* 2. Jadwal */}
              <h3 className="form-section-title">2. Jadwal Peminjaman</h3>
              <div className="row mb-2">
                <div className="col-md-6 mb-3">
                  <label htmlFor="bk-tanggal_mulai" className="form-label">{multiHari ? 'Tanggal Mulai' : 'Tanggal'}</label>
                  <input
                    type="date"
                    className="form-control"
                    id="bk-tanggal_mulai" name="tanggal_mulai"
                    value={formData.tanggal_mulai}
                    min={hariIni()}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                {multiHari && (
                  <div className="col-md-6 mb-3">
                    <label htmlFor="bk-tanggal_selesai" className="form-label">Tanggal Selesai</label>
                    <input
                      type="date"
                      className="form-control"
                      id="bk-tanggal_selesai" name="tanggal_selesai"
                      value={formData.tanggal_selesai}
                      min={formData.tanggal_mulai || hariIni()}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                )}
              </div>
              <div className="form-check mb-3">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="multiHari"
                  checked={multiHari}
                  onChange={(e) => {
                    setMultiHari(e.target.checked);
                    setFormData((prev) => ({ ...prev, tanggal_selesai: e.target.checked ? prev.tanggal_mulai : '' }));
                  }}
                />
                <label className="form-check-label" htmlFor="multiHari">
                  Kegiatan berlangsung lebih dari satu hari
                </label>
              </div>

              <div className="row mb-3">
                <div className="col-6">
                  <label htmlFor="bk-waktu_mulai" className="form-label">Jam Mulai</label>
                  <select
                    className="form-select"
                    id="bk-waktu_mulai" name="waktu_mulai"
                    value={formData.waktu_mulai}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">-- Pilih jam --</option>
                    {PILIHAN_JAM.slice(0, -1).map((jam) => (
                      <option key={jam} value={jam}>{labelJam(jam)} WITA</option>
                    ))}
                  </select>
                </div>
                <div className="col-6">
                  <label htmlFor="bk-waktu_selesai" className="form-label">Jam Selesai</label>
                  <select
                    className="form-select"
                    id="bk-waktu_selesai" name="waktu_selesai"
                    value={formData.waktu_selesai}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">-- Pilih jam --</option>
                    {pilihanJamSelesai.map((jam) => (
                      <option key={jam} value={jam}>{labelJam(jam)} WITA</option>
                    ))}
                  </select>
                </div>
              </div>

              {terpakaiDiTanggal.length > 0 && (
                <div className="alert alert-secondary py-2 small">
                  <strong>Sudah dipesan pada tanggal ini:</strong>
                  <ul className="mb-0 ps-3">
                    {terpakaiDiTanggal.map((b, index) => (
                      <li key={index}>
                        {formatRentangTanggal(b.tanggal_mulai, b.tanggal_selesai)}, {labelJam(b.waktu_mulai)} - {labelJam(b.waktu_selesai)} WITA
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {pesanWaktu ? (
                <div className="alert alert-warning py-2">{pesanWaktu}</div>
              ) : mulai && selesai ? (
                <div className="alert alert-success py-2">
                  <strong>Jadwal Anda:</strong>{' '}
                  {formatTanggalPanjang(formData.tanggal_mulai)}, {labelJam(formData.waktu_mulai)}
                  {multiHari && tanggalSelesai !== formData.tanggal_mulai
                    ? ` s/d ${formatTanggalPanjang(tanggalSelesai)}, ${labelJam(formData.waktu_selesai)}`
                    : ` - ${labelJam(formData.waktu_selesai)}`}{' '}
                  WITA ({formatDurasi(mulai, selesai)})
                </div>
              ) : null}

              {/* 3. Penanggung jawab */}
              <h3 className="form-section-title">3. Penanggung Jawab</h3>
              <div className="row mb-3">
                <div className="col-md-4 mb-3 mb-md-0">
                  <label htmlFor="bk-penanggung_jawab" className="form-label">Nama</label>
                  <input
                    type="text"
                    className="form-control"
                    id="bk-penanggung_jawab" name="penanggung_jawab"
                    value={formData.penanggung_jawab}
                    onChange={handleInputChange}
                    placeholder="Nama Lengkap"
                    required
                  />
                </div>
                <div className="col-md-4 mb-3 mb-md-0">
                  <label htmlFor="bk-kontak_pj" className="form-label">No. HP / WhatsApp</label>
                  <input
                    type="tel"
                    className="form-control"
                    id="bk-kontak_pj" name="kontak_pj"
                    value={formData.kontak_pj}
                    onChange={handleInputChange}
                    placeholder="08123456789"
                    maxLength={15}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label htmlFor="bk-email" className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    id="bk-email" name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="organisasi@gmail.com"
                    required
                  />
                </div>
              </div>

              {/* 4. Dokumen */}
              <h3 className="form-section-title">4. Dokumen</h3>
              <div className="mb-3">
                <label htmlFor="bk-surat_peminjaman" className="form-label">Surat Peminjaman</label>
                <input
                  type="file"
                  className="form-control"
                  id="bk-surat_peminjaman" name="surat_peminjaman"
                  onChange={(e) => setSuratPeminjaman(e.target.files[0])}
                  accept=".pdf,.jpg,.jpeg,.png"
                  required
                />
                <div className="form-text">Format PDF, JPG, atau PNG. Maksimal 16MB.</div>
              </div>

              <div className="mb-3 form-check">
                <input type="checkbox" className="form-check-input" id="agreement" required />
                <label className="form-check-label" htmlFor="agreement">
                  Saya menyetujui syarat dan ketentuan peminjaman fasilitas ini, termasuk bertanggung jawab atas kerusakan, kebersihan, dan pengembalian fasilitas dalam kondisi baik setelah digunakan
                </label>
              </div>

              <div className="text-end">
                <button type="button" className="btn btn-secondary me-2" onClick={() => setShowForm(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading || Boolean(pesanWaktu)}>
                  {loading ? 'Memproses...' : 'Ajukan Peminjaman'}
                </button>
              </div>
            </form>
          )}
        </Modal.Body>
      </Modal>

      <div className="page">
        <div className="container">
          <div className="row g-5">
            <div className="col-lg-7">
              <h2 className="visually-hidden">Foto fasilitas</h2>
              <img
                src={images[selectedImage] || fasilitasImageUrl(null)}
                alt={facility ? `Foto ${facility.nama_fasilitas}` : ''}
                className="gallery-main"
                onError={handleImageError}
              />
              {images.length > 1 && (
                <div className="gallery-thumbs">
                  {images.map((img, index) => (
                    <button
                      type="button"
                      key={img}
                      aria-pressed={selectedImage === index}
                      aria-label={`Tampilkan foto ${index + 1}`}
                      onClick={() => setSelectedImage(index)}
                    >
                      <img src={img} alt="" onError={handleImageError} />
                    </button>
                  ))}
                </div>
              )}

              {facility && (
                <dl className="spec-list mt-4">
                  <div>
                    <dt>Gedung</dt>
                    <dd>{facility.gedung || '-'}</dd>
                  </div>
                  <div>
                    <dt>Lantai</dt>
                    <dd>{facility.lantai || '-'}</dd>
                  </div>
                  <div>
                    <dt>Kapasitas</dt>
                    <dd>{facility.kapasitas} orang</dd>
                  </div>
                </dl>
              )}
            </div>

            <div className="col-lg-5">
              <section className="panel" aria-labelledby="jadwal-terpakai">
                <h2 id="jadwal-terpakai" className="panel-title">Jadwal yang sudah terisi</h2>
                {jadwalMendatang.length > 0 ? (
                  <ul className="item-list">
                    {jadwalMendatang.map((booking, index) => (
                      <li key={index}>
                        <span className="item-title">
                          {formatRentangTanggal(booking.tanggal_mulai, booking.tanggal_selesai)}
                        </span>
                        <span className="text-muted small">
                          {labelJam(booking.waktu_mulai)}–{labelJam(booking.waktu_selesai)} WITA
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted mb-0">Belum ada jadwal. Fasilitas ini bebas dipesan.</p>
                )}
                <p className="small text-muted mt-3 mb-0">
                  Peminjaman memerlukan izin kegiatan yang sudah disetujui.{' '}
                  <Link to="/izin-kegiatan">Ajukan izin kegiatan</Link>.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
