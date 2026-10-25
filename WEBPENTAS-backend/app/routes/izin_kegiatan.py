from flask import Blueprint, request, jsonify, current_app, g
from app import db
from app.models.izin_kegiatan import IzinKegiatan
from app.models.disposisi_kegiatan import DisposisiKegiatan
from app.helpers import EKSTENSI_DOKUMEN, ambil_field, format_waktu, notifikasi_status, simpan_file
from app.security import ADMIN, DEKAN, MAHASISWA, STAF, login_required

izin_kegiatan_bp = Blueprint('izin_kegiatan', __name__)


def data_izin(izin, detail=False):
    disposisi = DisposisiKegiatan.query.filter_by(id_izin_kegiatan=izin.id)\
        .order_by(DisposisiKegiatan.id.desc()).first()
    data = {
        'id': izin.id,
        'nama_organisasi': izin.nama_organisasi,
        'penanggung_jawab': izin.penanggung_jawab,
        'keperluan': izin.keperluan,
        'tanggal_permintaan': format_waktu(izin.tanggal_permintaan),
        'status': izin.status,
        'komentar': izin.komentar,
        'status_disposisi': disposisi.status_disposisi if disposisi else None,
    }
    if detail:
        data.update({
            'kontak_pj': izin.kontak_pj,
            'email': izin.email,
            'surat_perizinan': izin.surat_perizinan,
        })
    return data


# Get semua izin kegiatan (untuk Dekan/Admin)
@izin_kegiatan_bp.route('/izin-kegiatan', methods=['GET'])
@login_required(ADMIN, DEKAN)
def get_all_izin_kegiatan():
    perizinan = IzinKegiatan.query.order_by(IzinKegiatan.tanggal_permintaan.desc()).all()
    return jsonify([data_izin(izin) for izin in perizinan])


# Get izin kegiatan milik user yang sedang login
@izin_kegiatan_bp.route('/izin-kegiatan/me', methods=['GET'])
@login_required()
def get_izin_kegiatan_saya():
    perizinan = IzinKegiatan.query.filter_by(id_user=g.user.id)\
        .order_by(IzinKegiatan.tanggal_permintaan.desc()).all()
    # Data milik sendiri, termasuk kontak & email untuk mengisi otomatis form peminjaman
    return jsonify([data_izin(izin, detail=True) for izin in perizinan])


# Get izin kegiatan by ID
@izin_kegiatan_bp.route('/izin-kegiatan/<int:id>', methods=['GET'])
@login_required()
def get_izin_kegiatan(id):
    izin = db.get_or_404(IzinKegiatan, id)
    if g.user.role not in STAF and izin.id_user != g.user.id:
        return jsonify({'error': 'Anda tidak memiliki akses ke data ini'}), 403
    return jsonify(data_izin(izin, detail=True))


# Tambah izin kegiatan baru
@izin_kegiatan_bp.route('/izin-kegiatan', methods=['POST'])
@login_required(MAHASISWA)
def add_izin_kegiatan():
    data = ambil_field(request.form, ['nama_organisasi', 'penanggung_jawab', 'kontak_pj', 'email', 'keperluan'])
    filename = simpan_file(request.files.get('surat_perizinan'), current_app.config['UPLOAD_FOLDER'], EKSTENSI_DOKUMEN)

    new_izin = IzinKegiatan(id_user=g.user.id, surat_perizinan=filename, **data)
    db.session.add(new_izin)
    db.session.commit()

    return jsonify({
        'message': 'Izin kegiatan berhasil diajukan',
        'data': {
            'id': new_izin.id,
            'nama_organisasi': new_izin.nama_organisasi,
            'status': new_izin.status
        }
    }), 201


# Mahasiswa membatalkan izin kegiatannya sendiri
@izin_kegiatan_bp.route('/izin-kegiatan/<int:id>/batal', methods=['PUT'])
@login_required(MAHASISWA)
def batalkan_izin_kegiatan(id):
    izin = db.get_or_404(IzinKegiatan, id)
    if izin.id_user != g.user.id:
        return jsonify({'error': 'Anda tidak memiliki akses ke data ini'}), 403
    if izin.status not in ('pending', 'disposisi', 'disetujui'):
        return jsonify({'error': f'Izin kegiatan berstatus {izin.status} tidak dapat dibatalkan'}), 409
    aktif = [p for p in izin.peminjaman if p.status in ('pending', 'disposisi', 'disetujui')]
    if aktif:
        return jsonify({'error': 'Batalkan dulu peminjaman fasilitas yang memakai izin kegiatan ini'}), 409

    # Disposisi yang belum diputuskan WD1 ikut ditarik
    DisposisiKegiatan.query.filter_by(id_izin_kegiatan=izin.id, status_disposisi='pending').delete()
    izin.status = 'dibatalkan'
    db.session.commit()

    return jsonify({'message': 'Izin kegiatan berhasil dibatalkan'})


# Dekan menyetujui/menolak langsung izin kegiatan yang masih pending
@izin_kegiatan_bp.route('/izin-kegiatan/<int:id>/status', methods=['PUT'])
@login_required(DEKAN)
def update_status(id):
    izin = db.get_or_404(IzinKegiatan, id)
    data = request.get_json(silent=True) or {}
    status = (data.get('status') or '').lower()
    komentar = (data.get('komentar') or '').strip()

    if status not in ('disetujui', 'ditolak'):
        return jsonify({'error': 'Status harus salah satu dari: disetujui, ditolak'}), 400
    if izin.status != 'pending':
        return jsonify({'error': f'Izin kegiatan sudah berstatus {izin.status}'}), 409
    if status == 'ditolak' and not komentar:
        return jsonify({'error': 'Alasan penolakan harus diisi'}), 400

    izin.status = status
    izin.komentar = komentar or None
    db.session.commit()

    notifikasi_status(izin.email, 'izin kegiatan', izin.nama_organisasi, status, komentar)

    return jsonify({
        'message': 'Status izin kegiatan berhasil diupdate',
        'data': {
            'id': izin.id,
            'status': izin.status,
            'komentar': izin.komentar
        }
    }), 200
