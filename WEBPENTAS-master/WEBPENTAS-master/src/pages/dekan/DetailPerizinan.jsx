import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api, { getErrorMessage } from "../../utils/api";
import { DokumenPreview, RejectModal, StatusBadge, Toast } from "../../components/common";
import { formatWaktuLokal } from "../../utils/format";

export function DetailPerizinan() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [perizinan, setPerizinan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReject, setShowReject] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/izin-kegiatan/${id}`);
      setPerizinan(response.data);
    } catch (error) {
      setToastMessage(getErrorMessage(error, "Gagal mengambil data perizinan"));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleStatusUpdate = async (status, komentar = "") => {
    try {
      await api.put(`/izin-kegiatan/${id}/status`, { status, komentar });
      setToastMessage(status === "disetujui" ? "Perizinan berhasil disetujui" : "Perizinan berhasil ditolak");
      fetchDetail();
      return true;
    } catch (error) {
      setToastMessage(getErrorMessage(error, "Gagal memperbarui status perizinan"));
      return false;
    }
  };

  const handleDisposisi = async () => {
    if (!window.confirm("Disposisikan perizinan ini ke Wakil Dekan 1?")) return;
    try {
      await api.post("/disposisi-kegiatan", { id_izin_kegiatan: Number(id) });
      alert("Perizinan berhasil didisposisikan ke Wakil Dekan 1");
      navigate("/dashboard-dekan/izin-kegiatan");
    } catch (error) {
      setToastMessage(getErrorMessage(error, "Gagal mendisposisikan perizinan"));
    }
  };

  if (loading) {
    return <div>Memuat data...</div>;
  }

  if (!perizinan) {
    return <div>Data tidak ditemukan</div>;
  }

  return (
    <div className="detail-container">
      <h2>Detail Perizinan</h2>

      <div className="detail-section">
        <h3>Informasi Pemohon</h3>
        <table>
          <tbody>
            <tr>
              <td>Nama Organisasi</td>
              <td>: {perizinan.nama_organisasi}</td>
            </tr>
            <tr>
              <td>Penanggung Jawab</td>
              <td>: {perizinan.penanggung_jawab}</td>
            </tr>
            <tr>
              <td>Kontak</td>
              <td>: {perizinan.kontak_pj}</td>
            </tr>
            <tr>
              <td>Email</td>
              <td>: {perizinan.email}</td>
            </tr>
            <tr>
              <td>Keperluan</td>
              <td>: {perizinan.keperluan}</td>
            </tr>
            <tr>
              <td>Tanggal Permintaan</td>
              <td>: {formatWaktuLokal(perizinan.tanggal_permintaan)}</td>
            </tr>
            <tr>
              <td>Status</td>
              <td>
                : <StatusBadge status={perizinan.status} />
              </td>
            </tr>
            {perizinan.komentar && (
              <tr>
                <td>Catatan</td>
                <td>: {perizinan.komentar}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="detail-section">
        <h3>Dokumen</h3>
        <DokumenPreview filename={perizinan.surat_perizinan} />
      </div>

      <div className="action-buttons">
        <button onClick={() => navigate("/dashboard-dekan/izin-kegiatan")} className="btn-back">
          <i className="bi bi-arrow-left"></i>
          Kembali
        </button>

        {perizinan.status === "pending" && (
          <>
            <button className="btn-reject" onClick={() => setShowReject(true)}>
              <i className="bi bi-x-lg"></i>
              Tolak Perizinan
            </button>
            <button onClick={() => handleStatusUpdate("disetujui")} className="btn-approve">
              <i className="bi bi-check-lg"></i>
              Setujui Perizinan
            </button>
            <button onClick={handleDisposisi} className="btn-disposisi">
              <i className="bi bi-arrow-left-right"></i>
              Disposisi ke Wakil Dekan 1
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
