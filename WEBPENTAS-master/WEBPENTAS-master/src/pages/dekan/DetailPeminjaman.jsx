import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";
import api, { getErrorMessage } from "../../utils/api";
import { Loading, PageHeader, RejectModal, Toast } from "../../components/common";
import { BackLink, PeminjamanDetail } from "../../components/detail";

export function DetailPeminjaman() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [peminjaman, setPeminjaman] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReject, setShowReject] = useState(false);
  const [showDisposisi, setShowDisposisi] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchData = useCallback(async () => {
    try {
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
    try {
      await api.post("/disposisi", { id_peminjaman: Number(id) });
      navigate("/dashboard-dekan/peminjaman");
    } catch (error) {
      setShowDisposisi(false);
      setToastMessage(getErrorMessage(error, "Gagal mendisposisikan peminjaman"));
    }
  };

  if (loading) return <Loading />;
  if (!peminjaman) return <div className="panel empty-state">Data tidak ditemukan.</div>;

  return (
    <div className="detail-container">
      <BackLink to="/dashboard-dekan/peminjaman">Daftar peminjaman</BackLink>
      <PageHeader eyebrow="Peminjaman fasilitas" title={peminjaman.nama_organisasi} />

      <PeminjamanDetail data={peminjaman} status={peminjaman.status} catatan={peminjaman.komentar} />

      {peminjaman.status === "pending" && (
        <div className="detail-actions">
          <button className="btn btn-success" onClick={() => handleStatusUpdate("disetujui")}>
            <i className="bi bi-check-lg" aria-hidden="true"></i> Setujui
          </button>
          <button className="btn btn-primary" onClick={() => setShowDisposisi(true)}>
            <i className="bi bi-send" aria-hidden="true"></i> Disposisi ke Wakil Dekan 2
          </button>
          <span className="spacer" />
          <button className="btn btn-outline-danger" onClick={() => setShowReject(true)}>Tolak</button>
        </div>
      )}

      <Modal show={showDisposisi} onHide={() => setShowDisposisi(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Disposisi ke Wakil Dekan 2?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Keputusan atas peminjaman ini akan diserahkan kepada Wakil Dekan 2 (bidang sarana dan prasarana).
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
        title="Tolak peminjaman"
      />
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}
