import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Modal, Button } from 'react-bootstrap';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import api from '../utils/api';
import { formatTanggal } from '../utils/format';
import { InfoList, PageHeader } from '../components/common';

// Kalender berbahasa Indonesia, minggu dimulai hari Senin
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales: { id: localeId },
});

const MESSAGES = {
  today: 'Hari ini',
  previous: 'Sebelumnya',
  next: 'Berikutnya',
  month: 'Bulan',
  week: 'Minggu',
  agenda: 'Agenda',
  date: 'Tanggal',
  time: 'Waktu',
  event: 'Peminjaman',
  noEventsInRange: 'Tidak ada peminjaman pada rentang ini.',
  showMore: (total) => `+${total} lainnya`,
};

const jam = (value) => value.replace(':', '.');

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
          title: `${p.nama_fasilitas} · ${p.nama_organisasi}`,
        })));
      })
      .catch((err) => {
        console.error('Gagal memuat jadwal peminjaman', err);
        setError('Gagal memuat jadwal peminjaman.');
      });
  }, []);

  return (
    <div className="page">
      <div className="container">
        <PageHeader
          eyebrow="Jadwal"
          title="Jadwal peminjaman fasilitas"
          description="Peminjaman yang sudah disetujui. Pilih sebuah jadwal untuk melihat detailnya."
        >
          <Link to="/fasilitas" className="btn btn-primary">Pinjam fasilitas</Link>
        </PageHeader>

        {error && <div className="alert alert-danger">{error}</div>}
        <div className="calendar-wrap">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            onSelectEvent={setSelectedEvent}
            views={['month', 'week', 'agenda']}
            messages={MESSAGES}
            culture="id"
            popup
          />
        </div>
      </div>

      <Modal show={Boolean(selectedEvent)} onHide={() => setSelectedEvent(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{selectedEvent?.nama_fasilitas}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEvent && (
            <InfoList items={[
              ['Dipinjam oleh', selectedEvent.nama_organisasi],
              ['Mulai', `${formatTanggal(selectedEvent.tanggal_mulai)}, ${jam(selectedEvent.waktu_mulai)} WITA`],
              ['Selesai', `${formatTanggal(selectedEvent.tanggal_selesai)}, ${jam(selectedEvent.waktu_selesai)} WITA`],
            ]} />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Link to={`/detail-fasilitas/${selectedEvent?.id_fasilitas}`} className="btn btn-secondary">
            Lihat fasilitas
          </Link>
          <Button variant="primary" onClick={() => setSelectedEvent(null)}>Tutup</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PeminjamanPage;
