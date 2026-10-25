import { useState } from 'react';
import api, { getErrorMessage } from '../utils/api';
import { PageHeader } from '../components/common';

const FORM_KOSONG = { name: '', email: '', subject: '', message: '' };

export const ContactPage = () => {
  const [form, setForm] = useState(FORM_KOSONG);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success' | 'danger', text }

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      await api.post('/contact', form);
      setStatus({ type: 'success', text: 'Pesan Anda telah terkirim. Kami akan membalas melalui email.' });
      setForm(FORM_KOSONG);
    } catch (err) {
      setStatus({ type: 'danger', text: getErrorMessage(err, 'Terjadi kesalahan. Coba lagi nanti.') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <PageHeader
          eyebrow="Kontak"
          title="Hubungi kami"
          description="Ada pertanyaan soal peminjaman fasilitas atau izin kegiatan? Kirim pesan atau datang langsung ke kantor fakultas."
        />

        <div className="row g-5">
          <div className="col-lg-6">
            <form className="panel" onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="name" className="form-label">Nama</label>
                  <input type="text" className="form-control" id="name" name="name" autoComplete="name"
                    value={form.name} onChange={handleChange} required />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input type="email" className="form-control" id="email" name="email" autoComplete="email"
                    value={form.email} onChange={handleChange} required />
                </div>
              </div>
              <div className="mb-3">
                <label htmlFor="subject" className="form-label">Subjek</label>
                <input type="text" className="form-control" id="subject" name="subject"
                  value={form.subject} onChange={handleChange} required />
              </div>
              <div className="mb-4">
                <label htmlFor="message" className="form-label">Pesan</label>
                <textarea className="form-control" id="message" name="message" rows="6"
                  value={form.message} onChange={handleChange} required></textarea>
              </div>

              {status && (
                <div className={`alert alert-${status.type}`} role={status.type === 'danger' ? 'alert' : 'status'}>
                  {status.text}
                </div>
              )}

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Mengirim...' : 'Kirim pesan'}
              </button>
            </form>
          </div>

          <div className="col-lg-6">
            <div className="panel h-100 d-flex flex-column">
              <h2 className="panel-title">Lokasi</h2>
              <address className="text-muted mb-3">
                Science Building, Fakultas MIPA Universitas Hasanuddin<br />
                Jl. Perintis Kemerdekaan Km. 10, Tamalanrea, Makassar 90245
              </address>
              <div className="ratio ratio-4x3 rounded overflow-hidden flex-grow-1">
                <iframe
                  title="Peta lokasi Science Building FMIPA Unhas"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3973.8226191925614!2d119.48268247468782!3d-5.13225129484488!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2dbefcc8497a410f%3A0x818e7a15d96cb84!2sScience%20Building%20FMIPA%20UNHAS!5e0!3m2!1sid!2sid!4v1733697017130!5m2!1sid!2sid"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
