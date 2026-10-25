"""Tambah status 'dibatalkan' untuk peminjaman dan izin kegiatan

Mahasiswa kini dapat membatalkan pengajuannya sendiri.

Revision ID: c7a2f4e9d1b3
Revises: b5e1d7a3c902
Create Date: 2026-10-25 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c7a2f4e9d1b3'
down_revision = 'b5e1d7a3c902'
branch_labels = None
depends_on = None

STATUS_LAMA = ('pending', 'disetujui', 'ditolak', 'disposisi', 'selesai')
STATUS_BARU = STATUS_LAMA + ('dibatalkan',)


def _ubah_enum(tabel, dari, ke):
    with op.batch_alter_table(tabel, schema=None) as batch_op:
        batch_op.alter_column('status', existing_type=sa.Enum(*dari), type_=sa.Enum(*ke),
                              existing_nullable=True)


def upgrade():
    _ubah_enum('peminjaman', STATUS_LAMA, STATUS_BARU)
    _ubah_enum('izin_kegiatan', STATUS_LAMA, STATUS_BARU)


def downgrade():
    op.execute("UPDATE peminjaman SET status = 'ditolak' WHERE status = 'dibatalkan'")
    op.execute("UPDATE izin_kegiatan SET status = 'ditolak' WHERE status = 'dibatalkan'")
    _ubah_enum('peminjaman', STATUS_BARU, STATUS_LAMA)
    _ubah_enum('izin_kegiatan', STATUS_BARU, STATUS_LAMA)
