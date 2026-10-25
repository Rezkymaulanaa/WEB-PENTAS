import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api, { getErrorMessage } from "../../utils/api";
import { DokumenPreview, IzinKegiatanInfo, RejectModal, StatusBadge, Toast } from "../../components/common";
import { formatTanggal } from "../../utils/format";

export function DetailPeminjaman() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [peminjaman, setPeminjaman] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReject, setShowReject] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/peminjaman/${id}`);
      setPeminjaman(response.data);
    } catch (error) {
      setToastMessage(getErrorMessage(error, "Gagal mengambil data peminjaman"));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusUpdate = async (status, komentar = "") => {
    try {
      await api.put(`/peminjaman/${id}/status`, { status, komentar });
      setToastMessage(status === "disetujui" ? "Peminjaman disetujui" : "Peminjaman ditolak");
      fetchData();
      return true;
    } catch (error) {
      setToastMessage(getErrorMessage(error, "Gagal memperbarui status"));
      return false;
    }
  };

  const handleDisposisi = async () => {
    if (!window.confirm("Disposisikan peminjaman ini ke Wakil Dekan 2?")) return;
    try {
      await api.post("/disposisi", { id_peminjaman: Number(id) });
      alert("Berhasil mendisposisikan peminjaman ke Wakil Dekan 2");
      navigate("/dashboard-dekan/peminjaman");
    } catch (error) {
      setToastMessage(getErrorMessage(error, "Gagal mendisposisikan peminjaman"));
    }
  };

  if (loading) {
    return <div>Memuat data...</div>;
  }

  if (!peminjaman) {
    return <div>Data tidak ditemukan</div>;
  }

  return (
    <div className="detail-container">
      <h2>Detail Peminjaman</h2>

      <div className="detail-section">
        <h3>Informasi Pemohon</h3>
        <table>
          <tbody>
            <tr>
              <td>Nama Organisasi</td>
              <td>: {peminjaman.nama_organisasi}</td>
            </tr>
            <tr>
              <td>Penanggung Jawab</td>
              <td>: {peminjaman.penanggung_jawab}</td>
            </tr>
            <tr>
              <td>Kontak</td>
              <td>: {peminjaman.kontak_pj}</td>
            </tr>
            <tr>
              <td>Email</td>
              <td>: {peminjaman.email}</td>
            </tr>
            <tr>
              <td>Fasilitas</td>
              <td>: {peminjaman.nama_fasilitas}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="detail-section">
        <h3>Informasi Peminjaman</h3>
        <table>
          <tbody>
            <tr>
              <td>Tanggal Mulai</td>
              <td>: {formatTanggal(peminjaman.tanggal_mulai)}</td>
            </tr>
            <tr>
              <td>Tanggal Selesai</td>
              <td>: {formatTanggal(peminjaman.tanggal_selesai)}</td>
            </tr>
            <tr>
              <td>Waktu</td>
              <td>
                : {peminjaman.waktu_mulai} - {peminjaman.waktu_selesai}
              </td>
            </tr>
            <tr>
              <td>Keperluan</td>
              <td>: {peminjaman.keperluan}</td>
            </tr>
            <tr>
              <td>Status</td>
              <td>
                : <StatusBadge status={peminjaman.status} />
              </td>
            </tr>
            {peminjaman.komentar && (
              <tr>
                <td>Catatan</td>
                <td>: {peminjaman.komentar}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <IzinKegiatanInfo izin={peminjaman.izin_kegiatan} />

      <div className="detail-section">
        <h3>Dokumen</h3>
        <DokumenPreview filename={peminjaman.surat_peminjaman} />
      </div>

      <div className="action-buttons">
        <button onClick={() => navigate("/dashboard-dekan/peminjaman")} className="btn-back">
          <i className="bi bi-arrow-left"></i>
          Kembali
        </button>
        {peminjaman.status === "pending" && (
          <>
            <button className="btn-reject" onClick={() => setShowReject(true)}>
              <i className="bi bi-x-lg"></i>
              Tolak
            </button>
            <button className="btn-approve" onClick={() => handleStatusUpdate("disetujui")}>
              <i className="bi bi-check-lg"></i>
              Setujui
            </button>
            <button onClick={handleDisposisi} className="btn-disposisi">
              <i className="bi bi-arrow-left-right"></i>
              Disposisi ke Wakil Dekan 2
            </button>
          </>
        )}
      </div>

      <RejectModal
        show={showReject}
        onHide={() => setShowReject(false)}
        onSubmit={(komentar) => handleStatusUpdate("ditolak", komentar)}
      />
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}
