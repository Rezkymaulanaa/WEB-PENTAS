import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";
import api, { getErrorMessage } from "../../utils/api";
import { Loading, PageHeader, RejectModal, Toast } from "../../components/common";
import { BackLink, IzinDetail } from "../../components/detail";

export function DetailPerizinan() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [perizinan, setPerizinan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReject, setShowReject] = useState(false);
  const [showDisposisi, setShowDisposisi] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchDetail = useCallback(async () => {
    try {
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
      setToastMessage(status === "disetujui" ? "Izin kegiatan disetujui" : "Izin kegiatan ditolak");
      fetchDetail();
      return true;
    } catch (error) {
      setToastMessage(getErrorMessage(error, "Gagal memperbarui status perizinan"));
      return false;
    }
  };

  const handleDisposisi = async () => {
    try {
      await api.post("/disposisi-kegiatan", { id_izin_kegiatan: Number(id) });
      navigate("/dashboard-dekan/izin-kegiatan");
    } catch (error) {
      setShowDisposisi(false);
      setToastMessage(getErrorMessage(error, "Gagal mendisposisikan perizinan"));
    }
  };

  if (loading) return <Loading />;
  if (!perizinan) return <div className="panel empty-state">Data tidak ditemukan.</div>;

  return (
    <div className="detail-container">
      <BackLink to="/dashboard-dekan/izin-kegiatan">Daftar izin kegiatan</BackLink>
      <PageHeader eyebrow="Izin kegiatan" title={perizinan.keperluan} description={perizinan.nama_organisasi} />

      <IzinDetail data={perizinan} status={perizinan.status} catatan={perizinan.komentar} />

      {perizinan.status === "pending" && (
        <div className="detail-actions">
          <button className="btn btn-success" onClick={() => handleStatusUpdate("disetujui")}>
            <i className="bi bi-check-lg" aria-hidden="true"></i> Setujui
          </button>
          <button className="btn btn-primary" onClick={() => setShowDisposisi(true)}>
            <i className="bi bi-send" aria-hidden="true"></i> Disposisi ke Wakil Dekan 1
          </button>
          <span className="spacer" />
          <button className="btn btn-outline-danger" onClick={() => setShowReject(true)}>Tolak</button>
        </div>
      )}

      <Modal show={showDisposisi} onHide={() => setShowDisposisi(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Disposisi ke Wakil Dekan 1?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Keputusan atas izin kegiatan ini akan diserahkan kepada Wakil Dekan 1 (bidang kemahasiswaan).
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDisposisi(false)}>Batal</Button>
          <Button variant="primary" onClick={handleDisposisi}>Disposisikan</Button>
        </Modal.Footer>
      </Modal>

      <RejectModal
        show={showReject}
        onHide={() => setShowReject(false)}
        onSubmit={(komentar) => handleStatusUpdate("ditolak", komentar)}
        title="Tolak izin kegiatan"
      />
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}
