from flask import Blueprint, request, jsonify, g
from werkzeug.security import check_password_hash, generate_password_hash
from app.models.user import User
from app import db
from app.security import ADMIN, SEMUA_ROLE, buat_token, login_required

auth_bp = Blueprint('auth', __name__)

PANJANG_PASSWORD_MIN = 6


def _data_user(user):
    return {
        'id': user.id,
        'email': user.email,
        'role': user.role,
        'create_at': user.create_at.strftime('%Y-%m-%d %H:%M:%S') if user.create_at else None
    }


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip()
    password = data.get('password') or ''

    user = User.query.filter_by(email=email).first()

    if user and check_password_hash(user.password, password):
        return jsonify({
            'message': 'Login berhasil',
            'token': buat_token(user),
            'id': user.id,
            'role': user.role,
            'email': user.email
        })

    return jsonify({
        'message': 'Email atau password salah'
    }), 401


@auth_bp.route('/me', methods=['GET'])
@login_required()
def me():
    return jsonify(_data_user(g.user))


@auth_bp.route('/users', methods=['GET'])
@login_required(ADMIN)
def get_users():
    return jsonify([_data_user(user) for user in User.query.order_by(User.id).all()])


@auth_bp.route('/users', methods=['POST'])
@login_required(ADMIN)
def add_user():
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip()
    password = data.get('password') or ''
    role = data.get('role')

    if not email or not password or not role:
        return jsonify({'error': 'Email, password dan role harus diisi'}), 400
    if role not in SEMUA_ROLE:
        return jsonify({'error': 'Role tidak valid'}), 400
    if len(password) < PANJANG_PASSWORD_MIN:
        return jsonify({'error': f'Password minimal {PANJANG_PASSWORD_MIN} karakter'}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email sudah terdaftar'}), 400

    new_user = User(email=email, password=generate_password_hash(password), role=role)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({
        'message': 'User berhasil ditambahkan',
        'data': _data_user(new_user)
    }), 201


@auth_bp.route('/users/<int:id>', methods=['PUT'])
@login_required(ADMIN)
def update_user(id):
    user = db.get_or_404(User, id)
    data = request.get_json(silent=True) or {}

    if 'email' in data:
        email = (data['email'] or '').strip()
        if not email:
            return jsonify({'error': 'Email tidak boleh kosong'}), 400
        if User.query.filter(User.email == email, User.id != user.id).first():
            return jsonify({'error': 'Email sudah dipakai pengguna lain'}), 400
        user.email = email

    # Update password jika diisi
    if data.get('password'):
        if len(data['password']) < PANJANG_PASSWORD_MIN:
            return jsonify({'error': f'Password minimal {PANJANG_PASSWORD_MIN} karakter'}), 400
        user.password = generate_password_hash(data['password'])

    if 'role' in data:
        if data['role'] not in SEMUA_ROLE:
            return jsonify({'error': 'Role tidak valid'}), 400
        if user.id == g.user.id and data['role'] != ADMIN:
            return jsonify({'error': 'Anda tidak dapat mengubah role akun Anda sendiri'}), 400
        user.role = data['role']

    db.session.commit()
    return jsonify({'message': 'User berhasil diupdate'})


@auth_bp.route('/users/<int:id>', methods=['DELETE'])
@login_required(ADMIN)
def delete_user(id):
    user = db.get_or_404(User, id)
    if user.id == g.user.id:
        return jsonify({'error': 'Anda tidak dapat menghapus akun Anda sendiri'}), 400
    if user.peminjaman or user.izin_kegiatan:
        return jsonify({'error': 'User tidak dapat dihapus karena memiliki riwayat pengajuan'}), 400

    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'User berhasil dihapus'})
