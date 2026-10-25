from datetime import datetime

from flask import Blueprint, request, jsonify
from app import db
from app.models.disposisi import Disposisi
from app.models.peminjaman import Peminjaman
from app.helpers import cari_bentrok, format_waktu, notifikasi_status, pesan_bentrok
from app.routes.peminjaman import data_izin_ringkas
from app.security import ADMIN, DEKAN, WAKIL_DEKAN_2, login_required

disposisi_bp = Blueprint('disposisi', __name__)


def _data_disposisi(d):
    return {
        'id': d.id,
        'id_peminjaman': d.id_peminjaman,
        'dari': d.dari,
        'kepada': d.kepada,
        'status_disposisi': d.status_disposisi,
        'catatan': d.catatan,
        'created_at': format_waktu(d.created_at),
    }


def _data_disposisi_peminjaman(d, detail=False):
    p = d.peminjaman
    data = _data_disposisi(d)
    data.update({
        'nama_organisasi': p.nama_organisasi,
        'penanggung_jawab': p.penanggung_jawab,
        'nama_fasilitas': p.fasilitas.nama_fasilitas if p.fasilitas else None,
        'tanggal_mulai': p.tanggal_mulai.strftime('%Y-%m-%d'),
        'tanggal_selesai': p.tanggal_selesai.strftime('%Y-%m-%d'),
        'waktu_mulai': p.waktu_mulai.strftime('%H:%M'),
        'waktu_selesai': p.waktu_selesai.strftime('%H:%M'),
        'keperluan': p.keperluan,
        'status_peminjaman': p.status,
    })
    if detail:
        data.update({
            'kontak_pj': p.kontak_pj,
            'email': p.email,
            'surat_peminjaman': p.surat_peminjaman,
            'izin_kegiatan': data_izin_ringkas(p.izin_kegiatan),
        })
    return data


# Get semua disposisi
@disposisi_bp.route('/disposisi', methods=['GET'])
@login_required(ADMIN, DEKAN)
def get_all_disposisi():
    disposisi = Disposisi.query.order_by(Disposisi.created_at.desc()).all()
    return jsonify([_data_disposisi_peminjaman(d) for d in disposisi])


# Get disposisi by ID
@disposisi_bp.route('/disposisi/<int:id>', methods=['GET'])
@login_required(ADMIN, DEKAN, WAKIL_DEKAN_2)
def get_disposisi(id):
    return jsonify(_data_disposisi_peminjaman(db.get_or_404(Disposisi, id), detail=True))


# Dekan mendisposisikan peminjaman ke Wakil Dekan 2
@disposisi_bp.route('/disposisi', methods=['POST'])
@login_required(DEKAN)
def add_disposisi():
    data = request.get_json(silent=True) or {}
    peminjaman = db.session.get(Peminjaman, data.get('id_peminjaman') or 0)
    if not peminjaman:
        return jsonify({'error': 'Peminjaman tidak ditemukan'}), 404
    if peminjaman.status != 'pending':
        return jsonify({'error': f'Peminjaman sudah berstatus {peminjaman.status}, tidak dapat didisposisi'}), 409

    new_disposisi = Disposisi(
        id_peminjaman=peminjaman.id,
        dari=DEKAN,
        kepada=WAKIL_DEKAN_2,
        catatan=(data.get('catatan') or '').strip() or None
    )
    peminjaman.status = 'disposisi'

    db.session.add(new_disposisi)
    db.session.commit()

    return jsonify({
        'message': 'Disposisi berhasil ditambahkan',
        'data': {
            'id': new_disposisi.id,
            'status_disposisi': new_disposisi.status_disposisi,
            'peminjaman_status': peminjaman.status
        }
    }), 201


# Wakil Dekan 2 menyetujui/menolak disposisi. Status peminjaman ikut diperbarui.
@disposisi_bp.route('/disposisi/<int:id>/status', methods=['PUT'])
@login_required(WAKIL_DEKAN_2)
def update_status(id):
    disposisi = db.get_or_404(Disposisi, id)
    peminjaman = disposisi.peminjaman
    data = request.get_json(silent=True) or {}
    status = data.get('status_disposisi')
    catatan = (data.get('catatan') or '').strip()

    if status not in ('disetujui', 'ditolak'):
        return jsonify({'error': 'Status harus salah satu dari: disetujui, ditolak'}), 400
    if disposisi.status_disposisi != 'pending':
        return jsonify({'error': f'Disposisi sudah berstatus {disposisi.status_disposisi}'}), 409
    if status == 'ditolak' and not catatan:
        return jsonify({'error': 'Catatan penolakan harus diisi'}), 400

    if status == 'disetujui':
        mulai = datetime.combine(peminjaman.tanggal_mulai, peminjaman.waktu_mulai)
        selesai = datetime.combine(peminjaman.tanggal_selesai, peminjaman.waktu_selesai)
        bentrok = cari_bentrok(peminjaman.id_fasilitas, mulai, selesai, kecuali_id=peminjaman.id)
        if bentrok:
            return jsonify({'error': pesan_bentrok(bentrok)}), 409

    disposisi.status_disposisi = status
    disposisi.catatan = catatan or disposisi.catatan
    peminjaman.status = status
    peminjaman.komentar = catatan or None
    db.session.commit()

    notifikasi_status(peminjaman.email, 'peminjaman fasilitas', peminjaman.nama_organisasi, status, catatan)

    return jsonify({
        'message': 'Status berhasil diupdate',
        'status': disposisi.status_disposisi
    })


@disposisi_bp.route('/peminjaman/wadek', methods=['GET'])
@login_required(ADMIN, WAKIL_DEKAN_2)
def get_wadek_peminjaman():
    disposisi = Disposisi.query.filter_by(kepada=WAKIL_DEKAN_2).order_by(Disposisi.created_at.desc()).all()
    return jsonify([_data_disposisi_peminjaman(d) for d in disposisi])


@disposisi_bp.route('/peminjaman/wadek/notifications', methods=['GET'])
@login_required(ADMIN, WAKIL_DEKAN_2)
def get_wadek_notifications():
    # Ambil 5 disposisi terbaru untuk wakil dekan
    recent = Disposisi.query.filter_by(kepada=WAKIL_DEKAN_2)\
        .order_by(Disposisi.created_at.desc())\
        .limit(5)\
        .all()
    return jsonify([{
        'id': d.id,
        'nama_organisasi': d.peminjaman.nama_organisasi,
        'status': d.status_disposisi,
        'created_at': format_waktu(d.created_at)
    } for d in recent])


@disposisi_bp.route('/disposisi/history/wadek', methods=['GET'])
@login_required(ADMIN, WAKIL_DEKAN_2)
def get_wadek_history():
    history = Disposisi.query.filter_by(kepada=WAKIL_DEKAN_2)\
        .filter(Disposisi.status_disposisi.in_(['disetujui', 'ditolak']))\
        .order_by(Disposisi.created_at.desc())\
        .all()
    return jsonify([_data_disposisi_peminjaman(d) for d in history])
