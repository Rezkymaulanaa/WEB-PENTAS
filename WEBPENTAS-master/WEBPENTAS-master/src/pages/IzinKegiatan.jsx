import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import api, { getErrorMessage } from "../utils/api";
import { PageHeader, Toast } from "../components/common";

const FORM_KOSONG = {
  nama_organisasi: "",
  keperluan: "",
  penanggung_jawab: "",
  kontak_pj: "",
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

  const input = (name, label, props = {}) => (
    <div className="mb-3">
      <label htmlFor={name} className="form-label">{label}</label>
      <input
        className="form-control"
        id={name}
        name={name}
        value={formData[name]}
        onChange={handleChange}
        required
        {...props}
      />
    </div>
  );

  return (
    <div className="page">
      <div className="container">
        <div className="row g-5">
          <div className="col-lg-7">
            <PageHeader
              eyebrow="Izin kegiatan"
              title="Ajukan izin kegiatan"
              description="Izin kegiatan menjadi syarat sebelum organisasi Anda dapat meminjam ruangan atau fasilitas fakultas."
            />

            <form className="panel" onSubmit={handleSubmit}>
              <h2 className="form-section-title">Kegiatan</h2>
              {input("nama_organisasi", "Nama organisasi", { type: "text", placeholder: "Contoh: HIMATIKA FMIPA" })}
              {input("keperluan", "Nama / keperluan kegiatan", { type: "text", placeholder: "Contoh: Seminar Nasional Matematika" })}

              <h2 className="form-section-title">Penanggung jawab</h2>
              {input("penanggung_jawab", "Nama lengkap", { type: "text", autoComplete: "name" })}
              <div className="row">
                <div className="col-md-6">
                  {input("kontak_pj", "No. HP / WhatsApp", { type: "tel", autoComplete: "tel", placeholder: "08123456789" })}
                </div>
                <div className="col-md-6">
                  {input("email", "Email", { type: "email", autoComplete: "email", placeholder: "nama@student.unhas.ac.id" })}
                </div>
              </div>

              <h2 className="form-section-title">Dokumen</h2>
              <div className="mb-4">
                <label htmlFor="suratPerizinan" className="form-label">Surat permohonan izin</label>
                <input
                  type="file"
                  className="form-control"
                  id="suratPerizinan"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setSuratPerizinan(e.target.files[0])}
                  ref={fileInputRef}
                  aria-describedby="surat-help"
                  required
                />
                <div id="surat-help" className="form-text">Format PDF, JPG, atau PNG. Maksimal 16MB.</div>
              </div>

              {error && <div className="alert alert-danger" role="alert">{error}</div>}

              <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                {loading ? "Mengirim..." : "Kirim permohonan"}
              </button>
            </form>
          </div>

          <aside className="col-lg-5">
            <div className="panel">
              <h2 className="panel-title">Setelah Anda mengirim</h2>
              <ol className="ps-3 mb-3 text-muted">
                <li className="mb-2">Dekan memeriksa permohonan dan dapat langsung memutuskan atau meneruskannya ke Wakil Dekan 1.</li>
                <li className="mb-2">Hasil keputusan dan catatannya muncul di halaman <Link to="/notifications">Status pengajuan</Link>.</li>
                <li>Jika disetujui, buka <Link to="/fasilitas">Fasilitas</Link> untuk memesan ruangan.</li>
              </ol>
              <p className="small text-muted mb-0">
                Permohonan yang belum diputuskan masih dapat Anda batalkan dari halaman Status pengajuan.
              </p>
            </div>
          </aside>
        </div>
      </div>

      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
};

export default IzinKegiatan;
