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

  return (
    <div>
      {/* HEADER DETAIL FASILITAS */}
      <div className="row">
        <div className="fixed-size position-relative">
          <img
            src="https://sci.unhas.ac.id/wp-content/uploads/2023/05/Rektorat-Unhas1.png"
            alt="Fakultas MIPA"
            className="detail-image"
          />
          <div className="position-absolute top-50 start-50 translate-middle text-center text-light px-5 py-3 rounded shadow"
          style={{ background:'rgba(255, 255, 255, 0.2)', backdropFilter:'blur(10px)' }}>
            <h1 className="fw-bold mb-3 text-uppercase">
              {facility ? facility.nama_fasilitas : 'Loading...'}
            </h1>
            <button className="btn btn-danger" onClick={handleBookingClick}>
              Booking
            </button>
          </div>
        </div>
      </div>

      {/* Modal Form Peminjaman */}
      <Modal show={showForm} onHide={() => setShowForm(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">
            Formulir Peminjaman {facility?.nama_fasilitas}
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
              <h6 className="fw-bold text-uppercase text-muted small mb-3">1. Kegiatan</h6>
              <div className="mb-3">
                <label className="form-label">Izin kegiatan yang sudah disetujui</label>
                <select
                  className="form-select"
                  name="id_izin_kegiatan"
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
                  <label className="form-label">Nama Organisasi</label>
                  <input
                    type="text"
                    className="form-control"
                    name="nama_organisasi"
                    value={formData.nama_organisasi}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Keperluan Peminjaman</label>
                  <input
                    type="text"
                    className="form-control"
                    name="keperluan"
                    value={formData.keperluan}
                    onChange={handleInputChange}
                    placeholder="Contoh: Seminar Nasional"
                    required
                  />
                </div>
              </div>

              {/* 2. Jadwal */}
              <h6 className="fw-bold text-uppercase text-muted small mb-3">2. Jadwal Peminjaman</h6>
              <div className="row mb-2">
                <div className="col-md-6 mb-3">
                  <label className="form-label">{multiHari ? 'Tanggal Mulai' : 'Tanggal'}</label>
                  <input
                    type="date"
                    className="form-control"
                    name="tanggal_mulai"
                    value={formData.tanggal_mulai}
                    min={hariIni()}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                {multiHari && (
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Tanggal Selesai</label>
                    <input
                      type="date"
                      className="form-control"
                      name="tanggal_selesai"
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
                  <label className="form-label">Jam Mulai</label>
                  <select
                    className="form-select"
                    name="waktu_mulai"
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
                  <label className="form-label">Jam Selesai</label>
                  <select
                    className="form-select"
                    name="waktu_selesai"
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
              <h6 className="fw-bold text-uppercase text-muted small mb-3 mt-4">3. Penanggung Jawab</h6>
              <div className="row mb-3">
                <div className="col-md-4 mb-3 mb-md-0">
                  <label className="form-label">Nama</label>
                  <input
                    type="text"
                    className="form-control"
                    name="penanggung_jawab"
                    value={formData.penanggung_jawab}
                    onChange={handleInputChange}
                    placeholder="Nama Lengkap"
                    required
                  />
                </div>
                <div className="col-md-4 mb-3 mb-md-0">
                  <label className="form-label">No. HP / WhatsApp</label>
                  <input
                    type="tel"
                    className="form-control"
                    name="kontak_pj"
                    value={formData.kontak_pj}
                    onChange={handleInputChange}
                    placeholder="08123456789"
                    maxLength={15}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="organisasi@gmail.com"
                    required
                  />
                </div>
              </div>

              {/* 4. Dokumen */}
              <h6 className="fw-bold text-uppercase text-muted small mb-3 mt-4">4. Dokumen</h6>
              <div className="mb-3">
                <label className="form-label">Surat Peminjaman</label>
                <input
                  type="file"
                  className="form-control"
                  name="surat_peminjaman"
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
                <button type="button" className="btn btn-outline-secondary me-2" onClick={() => setShowForm(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-danger" disabled={loading || Boolean(pesanWaktu)}>
                  {loading ? 'Memproses...' : 'Ajukan Peminjaman'}
                </button>
              </div>
            </form>
          )}
        </Modal.Body>
      </Modal>

      {/* DETAIL FASILITAS */}
      <div className="container my-2">
        <h2 className="fw-bold fs-2 text-center py-5">DETAIL FASILITAS</h2>

        <div className="row">
          <div className="col-lg-6 mb-4">
            <img
              src={images[selectedImage] || fasilitasImageUrl(null)}
              alt={facility?.nama_fasilitas || ''}
              className="img-fluid rounded"
              style={{
                width: '100%',
                height: '400px',
                objectFit: 'cover'
              }}
              onError={handleImageError}
            />
          </div>

          <div className="col-lg-5 offset-lg-1">
            <p className="fw-semibold">Ruangan ini telah di booking pada:</p>

            <table className="table table-bordered">
              <thead>
                <tr>
                  <th scope="col">TANGGAL PINJAM</th>
                  <th scope="col">JAM MULAI</th>
                  <th scope="col">JAM AKHIR</th>
                </tr>
              </thead>
              <tbody>
                {jadwalMendatang.length > 0 ? (
                  jadwalMendatang.map((booking, index) => (
                    <tr key={index}>
                      <td>{formatRentangTanggal(booking.tanggal_mulai, booking.tanggal_selesai)}</td>
                      <td>{labelJam(booking.waktu_mulai)}</td>
                      <td>{labelJam(booking.waktu_selesai)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="text-center">Belum ada peminjaman</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Thumbnail Images */}
        <div className="row py-3">
          {images.map((img, index) => (
            <div className="col-4 col-md-2" key={index}>
              <img
                src={img}
                alt={`Foto ${index + 1}`}
                className={`img-fluid rounded ${selectedImage === index ? 'border border-2 border-primary' : ''}`}
                style={{
                  width: '100%',
                  height: '120px',
                  objectFit: 'cover',
                  cursor: 'pointer',
                  opacity: selectedImage === index ? '1' : '0.7'
                }}
                onClick={() => setSelectedImage(index)}
                onError={handleImageError}
              />
            </div>
          ))}
        </div>

        {/* TABLE */}
        {facility && (
          <div className="row">
            <div className="col-lg-6">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th scope="col">Gedung</th>
                    <th scope="col">Lantai</th>
                    <th scope="col">Kapasitas</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{facility.gedung}</td>
                    <td>{facility.lantai}</td>
                    <td>{facility.kapasitas} Orang</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
