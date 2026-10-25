import { useState, useEffect } from 'react';
import { FaUsers, FaBuilding, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import api from '../../utils/api';
import { StatusBadge } from '../../components/common';
import { formatTanggal } from '../../utils/format';

function DashboardHome() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalFacilities: 0,
    totalPeminjaman: 0,
    pendingPeminjaman: 0
  });

  const [recentData, setRecentData] = useState({
    peminjaman: [],
    facilities: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, facilitiesRes, peminjamanRes] = await Promise.all([
          api.get('/users'),
          api.get('/fasilitas'),
          api.get('/peminjaman')
        ]);

        setStats({
          totalUsers: usersRes.data.length,
          totalFacilities: facilitiesRes.data.length,
          totalPeminjaman: peminjamanRes.data.length,
          pendingPeminjaman: peminjamanRes.data.filter(p => p.status === 'pending').length
        });

        setRecentData({
          // Data peminjaman dari server sudah terurut dari yang terbaru
          peminjaman: peminjamanRes.data.slice(0, 5),
          facilities: facilitiesRes.data.slice(-5).reverse()
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="dashboard-content">
      <h1 className="dashboard-title">Dashboard Overview</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon users">
            <FaUsers />
          </div>
          <div className="stat-info">
            <h3>Total Pengguna</h3>
            <div className="value">{stats.totalUsers}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon facilities">
            <FaBuilding />
          </div>
          <div className="stat-info">
            <h3>Total Fasilitas</h3>
            <div className="value">{stats.totalFacilities}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon active">
            <FaCheckCircle />
          </div>
          <div className="stat-info">
            <h3>Total Peminjaman</h3>
            <div className="value">{stats.totalPeminjaman}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon inactive">
            <FaExclamationCircle />
          </div>
          <div className="stat-info">
            <h3>Peminjaman Pending</h3>
            <div className="value">{stats.pendingPeminjaman}</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Peminjaman Terbaru</h2>
          </div>
          <div className="peminjaman-list">
            {recentData.peminjaman.map(pinjam => (
              <div key={pinjam.id} className="peminjaman-item">
                <div className="peminjaman-info">
                  <h4>{pinjam.nama_organisasi}</h4>
                  <p>{pinjam.nama_fasilitas} &middot; {formatTanggal(pinjam.tanggal_mulai)}</p>
                  <StatusBadge status={pinjam.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h2>Fasilitas Terbaru</h2>
          </div>
          <div className="facility-list">
            {recentData.facilities.map(facility => (
              <div key={facility.id} className="facility-item mb-2">
                <div className="facility-info">
                  <h4>{facility.nama_fasilitas}</h4>
                  <p>Kapasitas: {facility.kapasitas} orang</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardHome;