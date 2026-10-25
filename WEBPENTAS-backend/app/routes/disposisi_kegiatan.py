from flask import Blueprint, request, jsonify
from app import db
from app.models.disposisi_kegiatan import DisposisiKegiatan
from app.models.izin_kegiatan import IzinKegiatan
from app.helpers import format_waktu, notifikasi_status
from app.security import ADMIN, DEKAN, WAKIL_DEKAN_1, login_required

disposisi_kegiatan_bp = Blueprint('disposisi_kegiatan', __name__)


def _data_disposisi(d, detail=False):
    izin = d.izin_kegiatan
    data = {
        'id': d.id,
        'id_izin_kegiatan': d.id_izin_kegiatan,
        'dari': d.dari,
        'kepada': d.kepada,
        'status_disposisi': d.status_disposisi,
        'komentar': d.komentar,
        'created_at': format_waktu(d.created_at),
        'nama_organisasi': izin.nama_organisasi,
        'penanggung_jawab': izin.penanggung_jawab,
        'keperluan': izin.keperluan,
        'tanggal_permintaan': format_waktu(izin.tanggal_permintaan),
    }
    if detail:
        data.update({
            'kontak_pj': izin.kontak_pj,
            'email': izin.email,
            'surat_perizinan': izin.surat_perizinan,
        })
    return data


# Get semua disposisi-kegiatan
@disposisi_kegiatan_bp.route('/disposisi-kegiatan', methods=['GET'])
@login_required(ADMIN, DEKAN)
def get_all_disposisi_kegiatan():
    disposisi = DisposisiKegiatan.query.order_by(DisposisiKegiatan.created_at.desc()).all()
    return jsonify([_data_disposisi(d) for d in disposisi])


# Get disposisi-kegiatan by ID
@disposisi_kegiatan_bp.route('/disposisi-kegiatan/<int:id>', methods=['GET'])
@login_required(ADMIN, DEKAN, WAKIL_DEKAN_1)
def get_disposisi_kegiatan(id):
    return jsonify(_data_disposisi(db.get_or_404(DisposisiKegiatan, id), detail=True))


# Dekan mendisposisikan izin kegiatan ke Wakil Dekan 1
@disposisi_kegiatan_bp.route('/disposisi-kegiatan', methods=['POST'])
@login_required(DEKAN)
def add_disposisi_kegiatan():
    data = request.get_json(silent=True) or {}
    izin = db.session.get(IzinKegiatan, data.get('id_izin_kegiatan') or 0)
    if not izin:
        return jsonify({'error': 'Izin kegiatan tidak ditemukan'}), 404
    if izin.status != 'pending':
        return jsonify({'error': f'Izin kegiatan sudah berstatus {izin.status}, tidak dapat didisposisi'}), 409

    new_disposisi = DisposisiKegiatan(
        id_izin_kegiatan=izin.id,
        dari=DEKAN,
        kepada=WAKIL_DEKAN_1,
        komentar=(data.get('komentar') or '').strip() or None
    )
    izin.status = 'disposisi'
    db.session.add(new_disposisi)
    db.session.commit()

    return jsonify({
        'message': 'Disposisi kegiatan berhasil ditambahkan',
        'data': {
            'id': new_disposisi.id,
            'status_disposisi': new_disposisi.status_disposisi
        }
    }), 201


# Wakil Dekan 1 menyetujui/menolak disposisi. Status izin kegiatan ikut diperbarui.
@disposisi_kegiatan_bp.route('/disposisi-kegiatan/<int:id>/status', methods=['PUT'])
@login_required(WAKIL_DEKAN_1)
def update_disposisi_status(id):
    disposisi = db.get_or_404(DisposisiKegiatan, id)
    izin = disposisi.izin_kegiatan
    data = request.get_json(silent=True) or {}
    status = (data.get('status_disposisi') or '').lower()
    komentar = (data.get('komentar') or '').strip()

    if status not in ('disetujui', 'ditolak'):
        return jsonify({'error': 'Status harus salah satu dari: disetujui, ditolak'}), 400
    if disposisi.status_disposisi != 'pending':
        return jsonify({'error': f'Disposisi sudah berstatus {disposisi.status_disposisi}'}), 409
    if status == 'ditolak' and not komentar:
        return jsonify({'error': 'Alasan penolakan harus diisi'}), 400

    disposisi.status_disposisi = status
    disposisi.komentar = komentar or disposisi.komentar
    izin.status = status
    izin.komentar = komentar or None
    db.session.commit()

    notifikasi_status(izin.email, 'izin kegiatan', izin.nama_organisasi, status, komentar)

    return jsonify({
        'message': 'Status disposisi berhasil diperbarui',
        'data': {
            'id': disposisi.id,
            'status_disposisi': disposisi.status_disposisi,
            'komentar': disposisi.komentar
        }
    }), 200


# Disposisi kegiatan yang menunggu keputusan Wakil Dekan 1
@disposisi_kegiatan_bp.route('/perizinan/wadek1', methods=['GET'])
@login_required(ADMIN, WAKIL_DEKAN_1)
def get_wadek1_perizinan():
    disposisi = DisposisiKegiatan.query.filter_by(kepada=WAKIL_DEKAN_1, status_disposisi='pending')\
        .order_by(DisposisiKegiatan.created_at.desc()).all()
    return jsonify([_data_disposisi(d) for d in disposisi])


# Get recent notifications for wakil dekan 1
@disposisi_kegiatan_bp.route('/perizinan/wadek1/notifications', methods=['GET'])
@login_required(ADMIN, WAKIL_DEKAN_1)
def get_wadek1_notifications():
    recent = DisposisiKegiatan.query.filter_by(kepada=WAKIL_DEKAN_1)\
        .order_by(DisposisiKegiatan.created_at.desc())\
        .limit(5)\
        .all()
    return jsonify([_data_disposisi(d) for d in recent])


# Get disposisi history for wakil dekan 1
@disposisi_kegiatan_bp.route('/disposisi-kegiatan/history/wadek1', methods=['GET'])
@login_required(ADMIN, WAKIL_DEKAN_1)
def get_wadek1_history():
    page = max(request.args.get('page', 1, type=int), 1)
    limit = min(max(request.args.get('limit', 30, type=int), 1), 100)

    query = DisposisiKegiatan.query.filter_by(kepada=WAKIL_DEKAN_1)\
        .filter(DisposisiKegiatan.status_disposisi.in_(['disetujui', 'ditolak']))

    total_items = query.count()
    history = query.order_by(DisposisiKegiatan.created_at.desc())\
        .offset((page - 1) * limit).limit(limit).all()

    return jsonify({
        'data': [_data_disposisi(d) for d in history],
        'total': total_items,
        'page': page,
        'pages': max((total_items + limit - 1) // limit, 1)
    })
