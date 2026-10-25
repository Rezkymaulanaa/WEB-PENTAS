from app import db
from datetime import datetime

class Peminjaman(db.Model):
    __tablename__ = 'peminjaman'

    id = db.Column(db.Integer, primary_key=True)
    id_user = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    id_fasilitas = db.Column(db.Integer, db.ForeignKey('fasilitas.id'), nullable=False)
    # Izin kegiatan dari WD1 yang menjadi dasar peminjaman (nullable untuk data lama)
    id_izin_kegiatan = db.Column(db.Integer, db.ForeignKey('izin_kegiatan.id'), nullable=True)
    nama_organisasi = db.Column(db.String(255), nullable=False)
    tanggal_mulai = db.Column(db.Date, nullable=False)
    tanggal_selesai = db.Column(db.Date, nullable=False)
    waktu_mulai = db.Column(db.Time, nullable=False)
    waktu_selesai = db.Column(db.Time, nullable=False)
    penanggung_jawab = db.Column(db.String(255), nullable=False)
    kontak_pj = db.Column(db.String(15), nullable=False)
    keperluan = db.Column(db.Text, nullable=False)
    email = db.Column(db.String(255), nullable=False)
    surat_peminjaman = db.Column(db.String(255), nullable=False)
    status = db.Column(db.Enum('pending', 'disetujui', 'ditolak', 'disposisi', 'selesai'), default='pending')
    komentar = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.TIMESTAMP, default=datetime.utcnow)

    # Relasi ke tabel users, fasilitas, dan izin_kegiatan
    user = db.relationship('User', backref='peminjaman')
    fasilitas = db.relationship('Fasilitas', backref='peminjaman')
    izin_kegiatan = db.relationship('IzinKegiatan', backref='peminjaman')

    def __repr__(self):
        return f'<Peminjaman {self.id}>'
