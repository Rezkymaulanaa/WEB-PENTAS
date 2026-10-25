import { useState, useEffect } from 'react';
import api, { getErrorMessage } from '../utils/api';

export const ContactPage = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (success || error) {
            const timer = setTimeout(() => {
                setSuccess(false);
                setError('');
            }, 5000); // Menghilangkan pesan setelah 5 detik
            return () => clearTimeout(timer);
        }
    }, [success, error]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name || !email || !subject || !message) {
            setError('Semua field wajib diisi.');
            return;
        }

        setLoading(true);
        setSuccess(false);
        setError('');

        try {
            const response = await api.post('/contact', {
                name,
                email,
                subject,
                message,
            });

            if (response.data.success) {
                setSuccess(true);
                setName('');
                setEmail('');
                setSubject('');
                setMessage('');
            }
        } catch (err) {
            console.error('Terjadi kesalahan:', err);
            setError(getErrorMessage(err, 'Terjadi kesalahan. Coba lagi nanti.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container p-5">
            <h2 className="text-center fw-semibold">Hubungi Kami</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label htmlFor="name" className="form-label">Nama</label>
                    <input
                        type="text"
                        className="form-control"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Masukkan nama Anda"
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="email" className="form-label">Email</label>
                    <input
                        type="email"
                        className="form-control"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Masukkan email Anda"
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="subject" className="form-label">Subjek</label>
                    <input
                        type="text"
                        className="form-control"
                        id="subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Masukkan subjek pesan"
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="message" className="form-label">Pesan</label>
                    <textarea
                        className="form-control"
                        id="message"
                        rows="5"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Tulis pesan Anda di sini"
                    ></textarea>
                </div>
                <button type="submit" className="btn btn-secondary w-100" disabled={loading}>
                    {loading ? 'Mengirim...' : 'Kirim Pesan'}
                </button>
            </form>
            {success && <p className="text-success mt-3">Pesan Anda telah dikirim!</p>}
            {error && <p className="text-danger mt-3">{error}</p>}

            <hr />

            {/* Peta Lokasi */}
            <div className="row mt-5">
                <h4 className="text-center mb-4 fw-semibold">Lokasi Kami</h4>
                <div className="col"></div>
                <div className="col-6">
                    <div className="ratio ratio-16x9">
                        <iframe
                            title="Lokasi Kami"
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3973.8226191925614!2d119.48268247468782!3d-5.13225129484488!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2dbefcc8497a410f%3A0x818e7a15d96cb84!2sScience%20Building%20FMIPA%20UNHAS!5e0!3m2!1sid!2sid!4v1733697017130!5m2!1sid!2sid"
                            style={{ border: 0 }}
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            className="rounded"
                        ></iframe>
                    </div>
                </div>
                <div className="col"></div>
            </div>
        </div>
    );
};

export default ContactPage;
