from flask import Blueprint, request, jsonify, current_app
from app import db
from app.models.fasilitas import Fasilitas
from app.models.peminjaman import Peminjaman
from app.helpers import EKSTENSI_GAMBAR, ValidasiError, ambil_field, hapus_file, simpan_file
from app.security import ADMIN, DEKAN, login_required

fasilitas_bp = Blueprint('fasilitas', __name__)

KOLOM_GAMBAR = ['image', 'image2', 'image3']   # nama kolom di database
FIELD_GAMBAR = ['image1', 'image2', 'image3']  # nama field dari form frontend


def _data_fasilitas(f):
    return {
        'id': f.id,
        'nama_fasilitas': f.nama_fasilitas,
        'image': f.image,
        'image2': f.image2,
        'image3': f.image3,
        'kapasitas': f.kapasitas,
        'gedung': f.gedung,
        'lantai': f.lantai,
        'created_at': f.created_at.strftime('%Y-%m-%d %H:%M:%S') if f.created_at else None
    }


def _ambil_data_form():
    data = ambil_field(request.form, ['nama_fasilitas', 'kapasitas', 'gedung', 'lantai'])
    try:
        data['kapasitas'] = int(data['kapasitas'])
    except ValueError:
        raise ValidasiError('Kapasitas harus berupa angka')
    if data['kapasitas'] <= 0:
        raise ValidasiError('Kapasitas harus lebih dari 0')
    return data


# Get semua fasilitas
@fasilitas_bp.route('/fasilitas', methods=['GET'])
def get_all_fasilitas():
    return jsonify([_data_fasilitas(f) for f in Fasilitas.query.all()])


# Get fasilitas by ID
@fasilitas_bp.route('/fasilitas/<int:id>', methods=['GET'])
def get_fasilitas(id):
    return jsonify(_data_fasilitas(db.get_or_404(Fasilitas, id)))


# Tambah fasilitas baru
@fasilitas_bp.route('/fasilitas', methods=['POST'])
@login_required(ADMIN, DEKAN)
def add_fasilitas():
    data = _ambil_data_form()
    folder = current_app.config['FASILITAS_FOLDER']

    new_fasilitas = Fasilitas(**data)
    for kolom, field in zip(KOLOM_GAMBAR, FIELD_GAMBAR):
        file = request.files.get(field)
        if file and file.filename:
            setattr(new_fasilitas, kolom, simpan_file(file, folder, EKSTENSI_GAMBAR))

    db.session.add(new_fasilitas)
    db.session.commit()

    return jsonify({
        'message': 'Fasilitas berhasil ditambahkan',
        'id': new_fasilitas.id
    }), 201


# Update fasilitas
@fasilitas_bp.route('/fasilitas/<int:id>', methods=['PUT'])
@login_required(ADMIN, DEKAN)
def update_fasilitas(id):
    fasilitas = db.get_or_404(Fasilitas, id)
    data = _ambil_data_form()
    folder = current_app.config['FASILITAS_FOLDER']

    for key, value in data.items():
        setattr(fasilitas, key, value)

    # Ganti gambar hanya jika ada file baru yang diupload
    file_lama = []
    for kolom, field in zip(KOLOM_GAMBAR, FIELD_GAMBAR):
        file = request.files.get(field)
        if file and file.filename:
            file_lama.append(getattr(fasilitas, kolom))
            setattr(fasilitas, kolom, simpan_file(file, folder, EKSTENSI_GAMBAR))

    db.session.commit()

    # Hapus file lama setelah data tersimpan
    for filename in file_lama:
        hapus_file(folder, filename)

    return jsonify({
        'message': 'Fasilitas berhasil diupdate',
        'id': fasilitas.id
    }), 200


# Hapus fasilitas
@fasilitas_bp.route('/fasilitas/<int:id>', methods=['DELETE'])
@login_required(ADMIN, DEKAN)
def delete_fasilitas(id):
    fasilitas = db.get_or_404(Fasilitas, id)

    # Jika ada peminjaman terkait, blokir penghapusan
    if Peminjaman.query.filter_by(id_fasilitas=id).count() > 0:
        return jsonify({
            'error': 'Fasilitas tidak dapat dihapus karena sedang digunakan dalam peminjaman'
        }), 400

    gambar = [getattr(fasilitas, kolom) for kolom in KOLOM_GAMBAR]
    db.session.delete(fasilitas)
    db.session.commit()

    for filename in gambar:
        hapus_file(current_app.config['FASILITAS_FOLDER'], filename)

    return jsonify({'message': 'Fasilitas berhasil dihapus'})
