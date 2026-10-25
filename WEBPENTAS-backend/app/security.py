from functools import wraps

from flask import current_app, g, jsonify, request
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from app import db

# Nilai role sesuai kolom users.role di database
MAHASISWA = 'mahasiswa'
ADMIN = 'admin'
DEKAN = 'dekan'
WAKIL_DEKAN_1 = 'wakil_dekan1'  # mengurus izin kegiatan mahasiswa
WAKIL_DEKAN_2 = 'wakil_dekan'   # mengurus peminjaman ruangan/sarana
SEMUA_ROLE = [MAHASISWA, ADMIN, DEKAN, WAKIL_DEKAN_1, WAKIL_DEKAN_2]
STAF = (ADMIN, DEKAN, WAKIL_DEKAN_1, WAKIL_DEKAN_2)

_SALT = 'pentas-auth-token'


def _serializer():
    return URLSafeTimedSerializer(current_app.config['SECRET_KEY'], salt=_SALT)


def buat_token(user):
    return _serializer().dumps({'id': user.id})


def user_dari_request():
    """Ambil user dari header `Authorization: Bearer <token>` atau query `?token=`."""
    from app.models.user import User

    header = request.headers.get('Authorization', '')
    token = header[7:] if header.startswith('Bearer ') else request.args.get('token')
    if not token:
        return None
    try:
        data = _serializer().loads(token, max_age=current_app.config['TOKEN_MAX_AGE'])
    except (BadSignature, SignatureExpired):
        return None
    return db.session.get(User, data.get('id'))


def login_required(*roles):
    """Wajib login. Jika `roles` diisi, hanya role tersebut yang boleh mengakses."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user = user_dari_request()
            if user is None:
                return jsonify({'error': 'Sesi tidak valid atau sudah berakhir, silakan login kembali'}), 401
            if roles and user.role not in roles:
                return jsonify({'error': 'Anda tidak memiliki akses untuk tindakan ini'}), 403
            g.user = user
            return fn(*args, **kwargs)
        return wrapper
    return decorator
