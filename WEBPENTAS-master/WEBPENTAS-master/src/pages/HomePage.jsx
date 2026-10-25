import { useState, useEffect } from 'react';
import api, { fasilitasImageUrl, handleImageError } from '../utils/api';
import { Link } from 'react-router-dom';

export const HomePage = () => {
  const [facilities, setFacilities] = useState([]);

  // Fetch data fasilitas
  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const response = await api.get('/fasilitas');
        
        // Filter dan ambil hanya 3 fasilitas terbaru
        const sortedFacilities = Array.isArray(response.data)
          ? response.data
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) // Urutkan berdasarkan created_at terbaru
              .slice(0, 3) // Ambil 3 item pertama
          : [];
        
        setFacilities(sortedFacilities);
      } catch (error) {
        console.error('Error fetching facilities:', error);
      }
    };

    fetchFacilities();
  }, []);


  return (
    <div>
          <div className="welcome-text position-absolute my-5 top-50 start-50 translate-middle text-center text-light px-5 py-3 rounded shadow"
          style={{ background:'rgba(255, 255, 255, 0.2)', backdropFilter:'blur(10px)' }}>
            <p>SELAMAT DATANG DI SIPANRITA</p>
            <h1 className='fw-bold'>SISTEM PENGELOLAAN REKOMENDASI KEGIATAN DAN PEMINJAMAN FASILITAS</h1>
          </div>
        {/* CARAUSEL */}
                <div id="carouselExampleIndicators" className="carousel slide fixed-size-carousel">
                <div className="carousel-indicators">
                    <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="0" className="active" aria-current="true" aria-label="Slide 1"></button>
                    <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="1" aria-label="Slide 2"></button>
                    <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="2" aria-label="Slide 3"></button>
                    <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="3" aria-label="Slide 4"></button>
                </div>
                <div className="carousel-inner">
                    <div className="carousel-item active">
                      <img
                          src="https://sci.unhas.ac.id/wp-content/uploads/2023/05/Rektorat-Unhas1.png"
                          className="d-block w-100 carousel-image"
                          alt="..."
                      />
                    </div>
                    <div className="carousel-item">
                      <img src="/sb3.jpg" className="d-block w-100" alt="..." />
                    </div>
                    <div className="carousel-item">
                      <img src="/sb2.jpg" className="d-block w-100" alt="..." />
                    </div>
                    <div className="carousel-item">
                      <img src="/sb1.jpg" className="d-block w-100" alt="..." />
                    </div>
                </div>
                <button className="carousel-control-prev" type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide="prev">
                    <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                    <span className="visually-hidden">Previous</span>
                </button>
                <button className="carousel-control-next" type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide="next">
                    <span className="carousel-control-next-icon" aria-hidden="true"></span>
                    <span className="visually-hidden">Next</span>
                </button>
                </div>     

      {/* FASILITAS */}
      <div className="fasilitas container-fluid py-5" style={{ backgroundColor: '#f8f9fa' }}>
        <div className="container">
          <h2 className="text-center py-5 fw-semibold">FASILITAS TERBARU</h2>

          {/* CARD */}
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4 px-4">
            {facilities.map((facility) => (
              <div className="col" key={facility.id}>
                <div className="card h-100" style={{ maxWidth: '320px', margin: '0 auto' }}>
                  <div className="card-img-wrapper" style={{ height: '180px' }}>
                    <img
                      src={fasilitasImageUrl(facility.image)}
                      className="card-img-top"
                      alt={facility.nama_fasilitas}
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                      onError={handleImageError}
                    />
                  </div>
                  <div className="card-body d-flex flex-column bg-white">
                    <h5 className="card-title mb-2">{facility.nama_fasilitas}</h5>
                    <p className="card-text text-muted small mb-3">
                      Kapasitas: {facility.kapasitas} orang
                    </p>
                    <Link
                      to={`/detail-fasilitas/${facility.id}`}
                      className="btn btn-outline-secondary btn-sm align-self-start"
                      style={{
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        padding: '6px 16px',
                      }}
                    >
                      Lihat Detail
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
