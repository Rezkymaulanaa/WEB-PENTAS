const ZONA_WAKTU = 'Asia/Makassar'; // WITA

const parse = (value, utc) => {
  if (!value) return null;
  // Format dari server: "YYYY-MM-DD HH:MM:SS" atau "YYYY-MM-DD"
  const iso = value.length <= 10 ? `${value}T00:00:00` : value.replace(' ', 'T');
  const date = new Date(utc ? `${iso}Z` : iso);
  return Number.isNaN(date.getTime()) ? null : date;
};

const OPSI_TANGGAL = { day: '2-digit', month: 'short', year: 'numeric' };
const OPSI_TANGGAL_WAKTU = {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
};

// Kolom created_at disimpan dalam UTC oleh server
export const formatWaktuUtc = (value) => {
  const date = parse(value, true);
  return date ? date.toLocaleString('id-ID', { ...OPSI_TANGGAL_WAKTU, timeZone: ZONA_WAKTU }) : '-';
};

// Kolom tanggal_permintaan memakai waktu lokal database
export const formatWaktuLokal = (value) => {
  const date = parse(value, false);
  return date ? date.toLocaleString('id-ID', OPSI_TANGGAL_WAKTU) : '-';
};

export const formatTanggal = (value) => {
  const date = parse(value, false);
  return date ? date.toLocaleDateString('id-ID', OPSI_TANGGAL) : '-';
};

export const formatRentangTanggal = (mulai, selesai) =>
  mulai === selesai ? formatTanggal(mulai) : `${formatTanggal(mulai)} - ${formatTanggal(selesai)}`;
