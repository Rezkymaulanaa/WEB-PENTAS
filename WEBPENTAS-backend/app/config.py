import os
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, '.env'))


def _env_bool(name, default=False):
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in ('1', 'true', 'yes', 'ya')


class Config:
    # Semua nilai rahasia dibaca dari file .env (lihat .env.example)
    SECRET_KEY = os.getenv('SECRET_KEY')
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'mysql+pymysql://root:@localhost/db_pentas')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Alamat frontend yang boleh mengakses API (pisahkan dengan koma jika lebih dari satu)
    FRONTEND_ORIGINS = [o.strip() for o in os.getenv('FRONTEND_ORIGIN', 'http://localhost:5173').split(',') if o.strip()]

    # Masa berlaku token login (detik), default 8 jam
    TOKEN_MAX_AGE = int(os.getenv('TOKEN_MAX_AGE', 8 * 60 * 60))

    # Email bersifat opsional: jika MAIL_USERNAME/MAIL_PASSWORD kosong, website tetap jalan
    # dan notifikasi email dilewati.
    MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.getenv('MAIL_PORT', 587))
    MAIL_USE_TLS = _env_bool('MAIL_USE_TLS', True)
    MAIL_USERNAME = os.getenv('MAIL_USERNAME') or None
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD') or None
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER') or MAIL_USERNAME
    ADMIN_EMAIL = os.getenv('ADMIN_EMAIL') or MAIL_USERNAME

    # Konfigurasi upload
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
    FASILITAS_FOLDER = os.path.join(UPLOAD_FOLDER, 'fasilitas')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # Max 16MB
