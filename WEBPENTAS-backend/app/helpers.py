import os
import uuid
from datetime import datetime
from threading import Thread

from flask import current_app
from flask_mail import Message
from werkzeug.utils import secure_filename

from app import db, mail

EKSTENSI_DOKUMEN = {'pdf', 'png', 'jpg', 'jpeg'}
EKSTENSI_GAMBAR = {'png', 'jpg', 'jpeg', 'webp'}


class ValidasiError(Exception):
    """Kesalahan input dari pengguna; pesan aman untuk ditampilkan."""


def ambil_field(data, fields):
    """Ambil field wajib dari form/json, menolak nilai kosong."""
    hasil = {}
    for field in fields:
        value = data.get(field)
        if value is None or str(value).strip() == '':
            raise ValidasiError(f'Field {field} harus diisi')
        hasil[field] = str(value).strip()
    return hasil


def simpan_file(file, folder, ekstensi_diizinkan):
    """Simpan file upload dengan nama unik agar tidak menimpa file milik orang lain."""
    if file is None or not file.filename:
        raise ValidasiError('Tidak ada file yang dipilih')

    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
    if ext not in ekstensi_diizinkan:
        raise ValidasiError(f'Format file harus salah satu dari: {", ".join(sorted(ekstensi_diizinkan))}')

    nama_aman = secure_filename(file.filename) or f'file.{ext}'
    if not nama_aman.lower().endswith(f'.{ext}'):
        nama_aman = f'{nama_aman}.{ext}'
    nama_unik = f'{uuid.uuid4().hex[:12]}_{nama_aman}'

    os.makedirs(folder, exist_ok=True)
    file.save(os.path.join(folder, nama_unik))
    return nama_unik


def hapus_file(folder, filename):
    if not filename:
        return
    path = os.path.join(folder, filename)
    if os.path.isfile(path):
        os.remove(path)


def parse_tanggal_waktu(tanggal, waktu):
    try:
        return datetime.strptime(f'{tanggal} {waktu[:5]}', '%Y-%m-%d %H:%M')
    except ValueError:
        raise ValidasiError('Format tanggal/waktu tidak valid')


def rentang_peminjaman(p):
    return (datetime.combine(p.tanggal_mulai, p.waktu_mulai),
            datetime.combine(p.tanggal_selesai, p.waktu_selesai))


def cari_bentrok(id_fasilitas, mulai, selesai, kecuali_id=None):
    """Cari peminjaman yang sudah disetujui dan waktunya tumpang tindih."""
    from app.models.peminjaman import Peminjaman

    kandidat = Peminjaman.query.filter(
        Peminjaman.id_fasilitas == id_fasilitas,
        Peminjaman.status == 'disetujui',
        Peminjaman.tanggal_mulai <= selesai.date(),
        Peminjaman.tanggal_selesai >= mulai.date(),
    ).all()
    for p in kandidat:
        if p.id == kecuali_id:
            continue
        p_mulai, p_selesai = rentang_peminjaman(p)
        if mulai < p_selesai and selesai > p_mulai:
            return p
    return None


def pesan_bentrok(p):
    return (f'Fasilitas sudah dipesan pada {p.tanggal_mulai:%d-%m-%Y} {p.waktu_mulai:%H:%M} '
            f's/d {p.tanggal_selesai:%d-%m-%Y} {p.waktu_selesai:%H:%M}')


def tandai_peminjaman_selesai():
    """Ubah status peminjaman yang disetujui dan waktunya sudah lewat menjadi 'selesai'."""
    from app.models.peminjaman import Peminjaman

    sekarang = datetime.now()
    berubah = False
    for p in Peminjaman.query.filter_by(status='disetujui').all():
        if rentang_peminjaman(p)[1] < sekarang:
            p.status = 'selesai'
            berubah = True
    if berubah:
        db.session.commit()


def format_waktu(value, fmt='%Y-%m-%d %H:%M:%S'):
    return value.strftime(fmt) if value else None


# ---------------------------------------------------------------- Email ---

def email_aktif():
    cfg = current_app.config
    return bool(cfg.get('MAIL_USERNAME') and cfg.get('MAIL_PASSWORD'))


def _kirim_async(app, msg):
    with app.app_context():
        try:
            mail.send(msg)
        except Exception:
            app.logger.exception('Gagal mengirim email ke %s', msg.recipients)


def kirim_email(penerima, subjek, isi, reply_to=None):
    """Kirim email di background. Dilewati jika email belum dikonfigurasi di .env."""
    if not penerima:
        return False
    if not email_aktif():
        current_app.logger.info('Email belum dikonfigurasi, notifikasi ke %s dilewati', penerima)
        return False
    msg = Message(subject=subjek, recipients=[penerima], body=isi, reply_to=reply_to)
    Thread(target=_kirim_async, args=(current_app._get_current_object(), msg), daemon=True).start()
    return True


def notifikasi_status(penerima, jenis, nama_organisasi, status, komentar=None):
    """Beritahu mahasiswa bahwa pengajuannya disetujui/ditolak."""
    label = {'disetujui': 'DISETUJUI', 'ditolak': 'DITOLAK'}.get(status, status.upper())
    isi = (
        f'Halo {nama_organisasi},\n\n'
        f'Pengajuan {jenis} Anda telah {label}.\n'
    )
    if komentar:
        isi += f'\nCatatan: {komentar}\n'
    isi += '\nSilakan cek halaman Notifikasi di website untuk detailnya.\n\nSalam,\nTim SIPANRITA FMIPA'
    kirim_email(penerima, f'Status Pengajuan {jenis.title()}: {label}', isi)
