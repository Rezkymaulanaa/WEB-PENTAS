import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { fasilitasImageUrl, handleImageError } from '../utils/api';

export const FasilitasPage = () => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const response = await api.get('/fasilitas');
        setFacilities(response.data);
      } catch (error) {
        console.error('Error fetching fasilitas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFacilities();
  }, []);

  return (
    <div className="fasilitas container-fluid pb-5" style={{ backgroundColor: '#f8f9fa' }}>
      <div className="container">
        <h2 className="text-center py-3 fw-semibold">
          FASILITAS
        </h2>

        {loading ? (
          <div className="text-center">
            <p>Loading facilities...</p>
          </div>
        ) : (
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 g-4 px-4">
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
        )}
      </div>
    </div>
  );
};

export default FasilitasPage;
