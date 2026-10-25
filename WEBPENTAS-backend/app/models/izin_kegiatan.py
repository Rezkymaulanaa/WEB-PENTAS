from app import db

class IzinKegiatan(db.Model):
    __tablename__ = 'izin_kegiatan'
    
    id = db.Column(db.Integer, primary_key=True)
    id_user = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    nama_organisasi = db.Column(db.String(255), nullable=False)
    penanggung_jawab = db.Column(db.String(255), nullable=False)
    kontak_pj = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), nullable=False)
    keperluan = db.Column(db.String(255), nullable=False)
    surat_perizinan = db.Column(db.String(255), nullable=False)
    
    # Definisi status menggunakan enum literal
    status = db.Column(db.Enum('pending', 'disetujui', 'ditolak', 'disposisi', 'selesai', 'dibatalkan'), default='pending')
    komentar = db.Column(db.String(255), nullable=True)
    tanggal_permintaan = db.Column(db.TIMESTAMP, nullable=False, server_default=db.func.current_timestamp())

    # Relasi ke tabel users
    user = db.relationship('User', backref='izin_kegiatan')

    def __repr__(self):
        return f'<IzinKegiatan {self.id}>'
