import { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/id';
import { Modal, Button } from 'react-bootstrap';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import api from '../utils/api';
import { formatTanggal } from '../utils/format';

moment.locale('id');
const localizer = momentLocalizer(moment);

const MESSAGES = {
  today: 'Hari ini',
  previous: 'Sebelumnya',
  next: 'Berikutnya',
  month: 'Bulan',
  agenda: 'Agenda',
  date: 'Tanggal',
  time: 'Waktu',
  event: 'Peminjaman',
  noEventsInRange: 'Tidak ada peminjaman pada rentang ini.',
};

export const PeminjamanPage = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Jadwal peminjaman yang sudah disetujui
    api.get('/peminjaman/jadwal')
      .then((response) => {
        setEvents(response.data.map((p) => ({
          ...p,
          start: new Date(`${p.tanggal_mulai}T${p.waktu_mulai}`),
          end: new Date(`${p.tanggal_selesai}T${p.waktu_selesai}`),
          title: `${p.nama_fasilitas} - ${p.nama_organisasi}`,
        })));
      })
      .catch((err) => {
        console.error('Gagal memuat jadwal peminjaman', err);
        setError('Gagal memuat jadwal peminjaman.');
      });
  }, []);

  return (
    <div className="peminjaman-page p-5">
      <h2 className='fw-bolder'>PEMINJAMAN FASILITAS</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <div style={{ height: '500px' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          onSelectEvent={setSelectedEvent}
          views={['month', 'agenda']}
          messages={MESSAGES}
        />
      </div>

      <Modal show={Boolean(selectedEvent)} onHide={() => setSelectedEvent(null)}>
        <Modal.Header closeButton>
          <Modal.Title>Informasi Peminjaman Fasilitas</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEvent && (
            <p>
              <strong>{selectedEvent.nama_fasilitas}</strong> dipinjam oleh {selectedEvent.nama_organisasi} pada{' '}
              {formatTanggal(selectedEvent.tanggal_mulai)} pukul {selectedEvent.waktu_mulai} sampai{' '}
              {formatTanggal(selectedEvent.tanggal_selesai)} pukul {selectedEvent.waktu_selesai}.
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setSelectedEvent(null)}>
            Tutup
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PeminjamanPage;
