from flask import Blueprint, request, jsonify, current_app
from app.helpers import ambil_field, email_aktif, kirim_email

contact_bp = Blueprint('contact', __name__)


@contact_bp.route('/contact', methods=['POST'])
def send_message():
    if not email_aktif() or not current_app.config.get('ADMIN_EMAIL'):
        return jsonify({
            'success': False,
            'message': 'Fitur kontak belum aktif. Silakan hubungi admin fakultas secara langsung.'
        }), 503

    data = ambil_field(request.get_json(silent=True) or {}, ['name', 'email', 'subject', 'message'])

    # Pesan hanya dikirim ke admin; admin cukup menekan "Balas" untuk menjawab pengirim.
    # Server tidak mengirim isi pesan ke alamat yang diketik pengunjung agar tidak disalahgunakan untuk spam.
    kirim_email(
        current_app.config['ADMIN_EMAIL'],
        f'[Kontak Website] {data["subject"]}',
        (
            'Ada pesan baru dari form kontak website:\n\n'
            f'- Nama  : {data["name"]}\n'
            f'- Email : {data["email"]}\n'
            f'- Subjek: {data["subject"]}\n\n'
            f'{data["message"]}\n'
        ),
        reply_to=data['email'],
    )

    return jsonify({"success": True, "message": "Pesan berhasil dikirim!"}), 200
