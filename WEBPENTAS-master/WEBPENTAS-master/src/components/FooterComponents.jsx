import { Link } from 'react-router-dom';

export const FooterComponents = () => {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="row g-5">
          <div className="col-lg-5">
            <div className="footer-brand">
              <img src="/logoUnhas.png" alt="" />
              <div>
                <strong>SIPANRITA</strong>
                Sistem Pengelolaan Rekomendasi Kegiatan dan Peminjaman Fasilitas
              </div>
            </div>
            <p className="mb-0">
              Fakultas Matematika dan Ilmu Pengetahuan Alam<br />
              Universitas Hasanuddin
            </p>
          </div>

          <div className="col-6 col-lg-3">
            <h2>Layanan</h2>
            <ul>
              <li><Link to="/izin-kegiatan">Ajukan izin kegiatan</Link></li>
              <li><Link to="/fasilitas">Daftar fasilitas</Link></li>
              <li><Link to="/peminjaman">Jadwal peminjaman</Link></li>
              <li><Link to="/notifications">Status pengajuan</Link></li>
            </ul>
          </div>

          <div className="col-6 col-lg-4">
            <h2>Alamat</h2>
            <address className="mb-3">
              Jl. Perintis Kemerdekaan Km. 10<br />
              Tamalanrea, Makassar 90245
            </address>
            <Link to="/contact">Hubungi kami →</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} FMIPA Universitas Hasanuddin</span>
          <div className="social-links">
            <a href="https://www.instagram.com/fmipa.uh/" target="_blank" rel="noopener noreferrer" aria-label="Instagram FMIPA Unhas">
              <i className="bi bi-instagram" aria-hidden="true"></i>
            </a>
            <a href="https://www.youtube.com/@fakultasmipaunhas1937" target="_blank" rel="noopener noreferrer" aria-label="YouTube FMIPA Unhas">
              <i className="bi bi-youtube" aria-hidden="true"></i>
            </a>
            <a href="https://sci.unhas.ac.id" target="_blank" rel="noopener noreferrer" aria-label="Situs web FMIPA Unhas">
              <i className="bi bi-globe2" aria-hidden="true"></i>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterComponents;
