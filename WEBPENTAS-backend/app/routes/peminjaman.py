from datetime import datetime

from flask import Blueprint, request, jsonify, current_app, g
from app import db
from app.models.peminjaman import Peminjaman
from app.models.fasilitas import Fasilitas
from app.models.izin_kegiatan import IzinKegiatan
from app.models.disposisi import Disposisi
from app.helpers import (
    EKSTENSI_DOKUMEN, ValidasiError, ambil_field, cari_bentrok, format_waktu,
    notifikasi_status, parse_tanggal_waktu, pesan_bentrok, simpan_file, tandai_peminjaman_selesai,
)
from app.security import ADMIN, DEKAN, MAHASISWA, STAF, WAKIL_DEKAN_2, login_required

peminjaman_bp = Blueprint('peminjaman', __name__)


def data_izin_ringkas(izin):
    if not izin:
        return None
    return {
        'id': izin.id,
        'nama_organisasi': izin.nama_organisasi,
        'keperluan': izin.keperluan,
        'status': izin.status,
        'surat_perizinan': izin.surat_perizinan,
        'tanggal_permintaan': format_waktu(izin.tanggal_permintaan),
    }


def data_peminjaman(p, detail=False):
    disposisi = Disposisi.query.filter_by(id_peminjaman=p.id).order_by(Disposisi.id.desc()).first()
    data = {
        'id': p.id,
        'id_fasilitas': p.id_fasilitas,
        'nama_fasilitas': p.fasilitas.nama_fasilitas if p.fasilitas else None,
        'nama_organisasi': p.nama_organisasi,
        'penanggung_jawab': p.penanggung_jawab,
        'tanggal_mulai': p.tanggal_mulai.strftime('%Y-%m-%d'),
        'tanggal_selesai': p.tanggal_selesai.strftime('%Y-%m-%d'),
        'waktu_mulai': p.waktu_mulai.strftime('%H:%M'),
        'waktu_selesai': p.waktu_selesai.strftime('%H:%M'),
        'keperluan': p.keperluan,
        'status': p.status,
        'komentar': p.komentar,
        'status_disposisi': disposisi.status_disposisi if disposisi else None,
        'created_at': format_waktu(p.created_at),
    }
    if detail:
        data.update({
            'kontak_pj': p.kontak_pj,
            'email': p.email,
            'surat_peminjaman': p.surat_peminjaman,
            'izin_kegiatan': data_izin_ringkas(p.izin_kegiatan),
        })
    return data


# Get semua peminjaman (untuk dashboard staf)
@peminjaman_bp.route('/peminjaman', methods=['GET'])
@login_required(ADMIN, DEKAN, WAKIL_DEKAN_2)
def get_all_peminjaman():
    tandai_peminjaman_selesai()
    peminjaman = Peminjaman.query.order_by(Peminjaman.created_at.desc()).all()
    return jsonify([data_peminjaman(p) for p in peminjaman])


# Jadwal peminjaman yang disetujui (publik, untuk kalender) tanpa data pribadi
@peminjaman_bp.route('/peminjaman/jadwal', methods=['GET'])
def get_jadwal():
    tandai_peminjaman_selesai()
    peminjaman = Peminjaman.query.filter_by(status='disetujui').all()
    return jsonify([{
        'id': p.id,
        'id_fasilitas': p.id_fasilitas,
        'nama_fasilitas': p.fasilitas.nama_fasilitas if p.fasilitas else None,
        'nama_organisasi': p.nama_organisasi,
        'tanggal_mulai': p.tanggal_mulai.strftime('%Y-%m-%d'),
        'tanggal_selesai': p.tanggal_selesai.strftime('%Y-%m-%d'),
        'waktu_mulai': p.waktu_mulai.strftime('%H:%M'),
        'waktu_selesai': p.waktu_selesai.strftime('%H:%M'),
    } for p in peminjaman])


# Get peminjaman milik user yang sedang login
@peminjaman_bp.route('/peminjaman/me', methods=['GET'])
@login_required()
def get_peminjaman_saya():
    tandai_peminjaman_selesai()
    peminjaman = Peminjaman.query.filter_by(id_user=g.user.id).order_by(Peminjaman.created_at.desc()).all()
    return jsonify([data_peminjaman(p) for p in peminjaman])


# Get peminjaman by ID
@peminjaman_bp.route('/peminjaman/<int:id>', methods=['GET'])
@login_required()
def get_peminjaman(id):
    peminjaman = db.get_or_404(Peminjaman, id)
    if g.user.role not in STAF and peminjaman.id_user != g.user.id:
        return jsonify({'error': 'Anda tidak memiliki akses ke data ini'}), 403
    return jsonify(data_peminjaman(peminjaman, detail=True))


# Tambah peminjaman baru
@peminjaman_bp.route('/peminjaman', methods=['POST'])
@login_required(MAHASISWA)
def add_peminjaman():
    data = ambil_field(request.form, [
        'id_fasilitas', 'id_izin_kegiatan', 'nama_organisasi',
        'tanggal_mulai', 'tanggal_selesai', 'waktu_mulai',
        'waktu_selesai', 'penanggung_jawab', 'kontak_pj',
        'keperluan', 'email'
    ])

    if len(data['kontak_pj']) > 15:
        raise ValidasiError('Kontak penanggung jawab maksimal 15 karakter')

    fasilitas = db.session.get(Fasilitas, int(data['id_fasilitas']) if data['id_fasilitas'].isdigit() else 0)
    if not fasilitas:
        return jsonify({'error': 'Fasilitas tidak ditemukan'}), 404

    # Peminjaman ruangan harus didasari izin kegiatan yang sudah disetujui
    izin = db.session.get(IzinKegiatan, int(data['id_izin_kegiatan']) if data['id_izin_kegiatan'].isdigit() else 0)
    if not izin or izin.id_user != g.user.id:
        raise ValidasiError('Izin kegiatan tidak ditemukan')
    if izin.status != 'disetujui':
        raise ValidasiError('Izin kegiatan belum disetujui, peminjaman belum dapat diajukan')

    mulai = parse_tanggal_waktu(data['tanggal_mulai'], data['waktu_mulai'])
    selesai = parse_tanggal_waktu(data['tanggal_selesai'], data['waktu_selesai'])
    if selesai <= mulai:
        raise ValidasiError('Waktu selesai harus setelah waktu mulai')
    if mulai < datetime.now():
        raise ValidasiError('Waktu mulai tidak boleh di masa lalu')

    bentrok = cari_bentrok(fasilitas.id, mulai, selesai)
    if bentrok:
        return jsonify({'error': pesan_bentrok(bentrok)}), 409

    # File disimpan setelah semua validasi lolos
    filename = simpan_file(request.files.get('surat_peminjaman'), current_app.config['UPLOAD_FOLDER'], EKSTENSI_DOKUMEN)

    new_peminjaman = Peminjaman(
        id_user=g.user.id,
        id_fasilitas=fasilitas.id,
        id_izin_kegiatan=izin.id,
        nama_organisasi=data['nama_organisasi'],
        tanggal_mulai=mulai.date(),
        tanggal_selesai=selesai.date(),
        waktu_mulai=mulai.time(),
        waktu_selesai=selesai.time(),
        penanggung_jawab=data['penanggung_jawab'],
        kontak_pj=data['kontak_pj'],
        keperluan=data['keperluan'],
        email=data['email'],
        surat_peminjaman=filename,
    )

    db.session.add(new_peminjaman)
    db.session.commit()

    return jsonify({
        'message': 'Peminjaman berhasil diajukan',
        'data': {
            'id': new_peminjaman.id,
            'nama_organisasi': new_peminjaman.nama_organisasi,
            'status': new_peminjaman.status
        }
    }), 201


# Dekan menyetujui/menolak langsung peminjaman yang masih pending
@peminjaman_bp.route('/peminjaman/<int:id>/status', methods=['PUT'])
@login_required(DEKAN)
def update_status(id):
    peminjaman = db.get_or_404(Peminjaman, id)
    data = request.get_json(silent=True) or {}
    status = data.get('status')
    komentar = (data.get('komentar') or '').strip()

    if status not in ('disetujui', 'ditolak'):
        return jsonify({'error': 'Status harus salah satu dari: disetujui, ditolak'}), 400
    if peminjaman.status != 'pending':
        return jsonify({'error': f'Peminjaman sudah berstatus {peminjaman.status}'}), 409
    if status == 'ditolak' and not komentar:
        return jsonify({'error': 'Alasan penolakan harus diisi'}), 400

    if status == 'disetujui':
        mulai, selesai = (datetime.combine(peminjaman.tanggal_mulai, peminjaman.waktu_mulai),
                          datetime.combine(peminjaman.tanggal_selesai, peminjaman.waktu_selesai))
        bentrok = cari_bentrok(peminjaman.id_fasilitas, mulai, selesai, kecuali_id=peminjaman.id)
        if bentrok:
            return jsonify({'error': pesan_bentrok(bentrok)}), 409

    peminjaman.status = status
    peminjaman.komentar = komentar or None
    db.session.commit()

    notifikasi_status(peminjaman.email, 'peminjaman fasilitas', peminjaman.nama_organisasi, status, komentar)

    return jsonify({
        'message': 'Status peminjaman berhasil diupdate',
        'data': {
            'id': peminjaman.id,
            'status': peminjaman.status,
            'komentar': peminjaman.komentar
        }
    })


# Mahasiswa membatalkan pengajuannya sendiri
@peminjaman_bp.route('/peminjaman/<int:id>/batal', methods=['PUT'])
@login_required(MAHASISWA)
def batalkan_peminjaman(id):
    peminjaman = db.get_or_404(Peminjaman, id)
    if peminjaman.id_user != g.user.id:
        return jsonify({'error': 'Anda tidak memiliki akses ke data ini'}), 403
    if peminjaman.status not in ('pending', 'disposisi', 'disetujui'):
        return jsonify({'error': f'Peminjaman berstatus {peminjaman.status} tidak dapat dibatalkan'}), 409
    if peminjaman.status == 'disetujui' and \
            datetime.combine(peminjaman.tanggal_mulai, peminjaman.waktu_mulai) <= datetime.now():
        return jsonify({'error': 'Peminjaman yang sudah berlangsung tidak dapat dibatalkan'}), 409

    # Disposisi yang belum diputuskan WD2 ikut ditarik
    Disposisi.query.filter_by(id_peminjaman=peminjaman.id, status_disposisi='pending').delete()
    peminjaman.status = 'dibatalkan'
    db.session.commit()

    return jsonify({'message': 'Peminjaman berhasil dibatalkan'})


# Jadwal yang sudah disetujui untuk satu fasilitas (publik)
@peminjaman_bp.route('/peminjaman/fasilitas/<int:id_fasilitas>', methods=['GET'])
def get_peminjaman_by_fasilitas(id_fasilitas):
    tandai_peminjaman_selesai()
    peminjaman = Peminjaman.query.filter_by(id_fasilitas=id_fasilitas, status='disetujui').all()

    return jsonify([{
        'tanggal_mulai': p.tanggal_mulai.strftime('%Y-%m-%d'),
        'tanggal_selesai': p.tanggal_selesai.strftime('%Y-%m-%d'),
        'waktu_mulai': p.waktu_mulai.strftime('%H:%M'),
        'waktu_selesai': p.waktu_selesai.strftime('%H:%M')
    } for p in peminjaman])
