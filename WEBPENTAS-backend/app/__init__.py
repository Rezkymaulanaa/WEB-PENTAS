import os
import secrets

import click
from flask import Flask, abort, jsonify, send_from_directory
from flask_cors import CORS
from flask_mail import Mail
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, safe_join

from app.config import Config

db = SQLAlchemy()
migrate = Migrate()
mail = Mail()


def create_app(config_object=Config):
    app = Flask(__name__)
    app.config.from_object(config_object)

    if not app.config.get('SECRET_KEY'):
        # Tetap bisa jalan untuk development, tapi token login akan hilang setiap server restart.
        app.config['SECRET_KEY'] = secrets.token_hex(32)
        app.logger.warning('SECRET_KEY belum diisi di .env, memakai kunci sementara.')

    CORS(app, resources={
        r"/*": {
            "origins": app.config['FRONTEND_ORIGINS'],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
        }
    })

    db.init_app(app)
    migrate.init_app(app, db)
    mail.init_app(app)

    os.makedirs(app.config['FASILITAS_FOLDER'], exist_ok=True)

    with app.app_context():
        # Import models
        from app.models.user import User
        from app.models.fasilitas import Fasilitas
        from app.models.peminjaman import Peminjaman
        from app.models.disposisi import Disposisi
        from app.models.izin_kegiatan import IzinKegiatan
        from app.models.disposisi_kegiatan import DisposisiKegiatan

        # Import blueprints
        from app.routes.auth import auth_bp
        from app.routes.fasilitas import fasilitas_bp
        from app.routes.peminjaman import peminjaman_bp
        from app.routes.disposisi import disposisi_bp
        from app.routes.contact import contact_bp
        from app.routes.izin_kegiatan import izin_kegiatan_bp
        from app.routes.disposisi_kegiatan import disposisi_kegiatan_bp

        # Register blueprints
        app.register_blueprint(auth_bp)
        app.register_blueprint(fasilitas_bp)
        app.register_blueprint(peminjaman_bp)
        app.register_blueprint(disposisi_bp)
        app.register_blueprint(contact_bp)
        app.register_blueprint(izin_kegiatan_bp)
        app.register_blueprint(disposisi_kegiatan_bp)

        # Create tables (hanya membuat tabel yang belum ada; perubahan kolom lewat `flask db upgrade`)
        db.create_all()

    _daftarkan_route_upload(app)
    _daftarkan_cli(app)

    _daftarkan_error_handler(app)

    return app


def _daftarkan_error_handler(app):
    from werkzeug.exceptions import HTTPException
    from app.helpers import ValidasiError

    @app.errorhandler(ValidasiError)
    def validasi_error(e):
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

    @app.errorhandler(413)
    def file_terlalu_besar(_):
        return jsonify({'error': 'Ukuran file maksimal 16MB'}), 413

    @app.errorhandler(HTTPException)
    def http_error(e):
        return jsonify({'error': e.description}), e.code

    @app.errorhandler(Exception)
    def server_error(e):
        # Detail error hanya dicatat di log server, tidak dikirim ke pengguna.
        db.session.rollback()
        app.logger.exception('Terjadi kesalahan pada server')
        return jsonify({'error': 'Terjadi kesalahan pada server, silakan coba lagi'}), 500


def _daftarkan_route_upload(app):
    from app.models.fasilitas import Fasilitas
    from app.models.izin_kegiatan import IzinKegiatan
    from app.models.peminjaman import Peminjaman
    from app.security import MAHASISWA, user_dari_request

    @app.route('/uploads/fasilitas/<path:filename>')
    def gambar_fasilitas(filename):
        # Gambar fasilitas bersifat publik.
        folder = app.config['FASILITAS_FOLDER']
        path = safe_join(folder, filename)
        if path is None or not os.path.isfile(path):
            # Gambar lama sempat tersimpan di folder uploads/, layani hanya jika memang gambar fasilitas.
            dipakai = Fasilitas.query.filter(
                (Fasilitas.image == filename) | (Fasilitas.image2 == filename) | (Fasilitas.image3 == filename)
            ).first()
            if not dipakai:
                abort(404)
            folder = app.config['UPLOAD_FOLDER']
        return send_from_directory(folder, filename)

    @app.route('/uploads/<path:filename>')
    def dokumen_surat(filename):
        # Surat berisi data pribadi: hanya staf atau mahasiswa pemiliknya yang boleh membuka.
        user = user_dari_request()
        if user is None:
            return jsonify({'error': 'Silakan login terlebih dahulu'}), 401
        if user.role == MAHASISWA:
            milik_sendiri = (
                Peminjaman.query.filter_by(id_user=user.id, surat_peminjaman=filename).first()
                or IzinKegiatan.query.filter_by(id_user=user.id, surat_perizinan=filename).first()
            )
            if not milik_sendiri:
                return jsonify({'error': 'Anda tidak memiliki akses ke dokumen ini'}), 403
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


def _daftarkan_cli(app):
    from app.models.user import User
    from app.security import SEMUA_ROLE

    @app.cli.command('buat-user')
    @click.argument('email')
    @click.argument('password')
    @click.argument('role', type=click.Choice(SEMUA_ROLE))
    def buat_user(email, password, role):
        """Buat user baru atau reset password user yang sudah ada.

        Contoh: flask --app run buat-user admin@pentas.id rahasia123 admin
        """
        user = User.query.filter_by(email=email).first()
        if user:
            user.password = generate_password_hash(password)
            user.role = role
            pesan = 'diperbarui'
        else:
            db.session.add(User(email=email, password=generate_password_hash(password), role=role))
            pesan = 'dibuat'
        db.session.commit()
        click.echo(f'User {email} ({role}) berhasil {pesan}.')
