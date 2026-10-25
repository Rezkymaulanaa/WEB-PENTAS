# WEBPENTAS Backend (Flask)

API untuk website peminjaman fasilitas dan izin kegiatan FMIPA.

## Alur pengajuan

1. Mahasiswa mengajukan **izin kegiatan**.
2. Dekan menyetujui/menolak langsung, atau **mendisposisikan ke Wakil Dekan 1**.
3. Setelah izin kegiatan **disetujui**, mahasiswa dapat mengajukan **peminjaman ruangan/sarana**
   dengan memilih izin kegiatan tersebut.
4. Dekan menyetujui/menolak langsung, atau **mendisposisikan ke Wakil Dekan 2**.
5. Peminjaman yang bentrok dengan jadwal yang sudah disetujui otomatis ditolak sistem.
6. Peminjaman yang waktunya sudah lewat otomatis berstatus `selesai`.

Role di database: `mahasiswa`, `admin`, `dekan`, `wakil_dekan1` (WD1), `wakil_dekan` (WD2).

## Menjalankan pertama kali

```bash
cd WEBPENTAS-backend
python -m venv venv
venv\Scripts\activate          # Windows (Linux/Mac: source venv/bin/activate)
pip install -r requirements.txt

copy .env.example .env         # lalu isi SECRET_KEY dan DATABASE_URL
```

Pastikan MySQL berjalan dan database `db_pentas` sudah ada.

- **Database sudah ada (data lama):** jalankan `flask --app run db upgrade` untuk menambah kolom baru.
- **Database baru/kosong:** cukup jalankan server sekali (tabel dibuat otomatis), lalu
  `flask --app run db stamp head`.

Buat akun (atau reset password jika lupa):

```bash
flask --app run buat-user admin@pentas.id passwordbaru admin
```

Jalankan server:

```bash
python run.py
```

## Email (opsional)

Notifikasi status ke mahasiswa dan form Kontak memakai email. Jika `MAIL_USERNAME`/`MAIL_PASSWORD`
di `.env` kosong, website tetap berjalan normal dan email dilewati. Untuk Gmail, gunakan
**App Password** (bukan password akun biasa).
