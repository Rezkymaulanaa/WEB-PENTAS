import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import api, { getErrorMessage } from "../utils/api";
import { Toast } from "../components/common";

const FORM_KOSONG = {
  nama_organisasi: "",
  penanggung_jawab: "",
  kontak_pj: "",
  keperluan: "",
  email: "",
};

export const IzinKegiatan = () => {
  const [formData, setFormData] = useState(FORM_KOSONG);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suratPerizinan, setSuratPerizinan] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => formDataToSend.append(key, value));
      if (suratPerizinan) {
        formDataToSend.append("surat_perizinan", suratPerizinan);
      }

      await api.post("/izin-kegiatan", formDataToSend);
      setToastMessage("Permohonan izin kegiatan Anda telah dikirim");

      // Reset form setelah permohonan berhasil dikirim
      setFormData(FORM_KOSONG);
      setSuratPerizinan(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(getErrorMessage(err, "Terjadi kesalahan saat mengajukan permohonan izin"));
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    ["nama_organisasi", "Nama Organisasi", "text"],
    ["penanggung_jawab", "Penanggung Jawab", "text"],
    ["kontak_pj", "Kontak Penanggung Jawab", "tel"],
    ["email", "Email", "email"],
    ["keperluan", "Keperluan / Nama Kegiatan", "text"],
  ];

  return (
    <div className="container my-5">
      <h2 className="text-center mb-4 fw-semibold">
        FORM PERMOHONAN IZIN KEGIATAN
      </h2>
      <div className="alert alert-info">
        Izin kegiatan diperiksa oleh Dekan dan Wakil Dekan 1. Setelah <strong>disetujui</strong>, Anda dapat
        mengajukan peminjaman ruangan/fasilitas melalui halaman <Link to="/fasilitas">Fasilitas</Link>.
        Pantau statusnya di halaman <Link to="/notifications">Notifikasi</Link>.
      </div>
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {fields.map(([name, label, type]) => (
              <div className="mb-3" key={name}>
                <label htmlFor={name} className="form-label">
                  {label}
                </label>
                <input
                  type={type}
                  className="form-control"
                  id={name}
                  name={name}
                  value={formData[name]}
                  onChange={handleChange}
                  required
                />
              </div>
            ))}

            <div className="mb-3">
              <label htmlFor="suratPerizinan" className="form-label">
                Surat Perizinan (PDF/JPG/PNG, maks. 16MB)
              </label>
              <input
                type="file"
                className="form-control"
                id="suratPerizinan"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setSuratPerizinan(e.target.files[0])}
                ref={fileInputRef}
                required
              />
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <div className="d-grid gap-2 mb-3">
              <button
                type="submit"
                className="btn btn-secondary"
                disabled={loading}
              >
                {loading ? "Mengirim..." : "Ajukan Permohonan"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
};

export default IzinKegiatan;
