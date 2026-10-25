"""Tambah kolom id_izin_kegiatan ke tabel peminjaman

Peminjaman ruangan kini harus didasari izin kegiatan yang sudah disetujui.

Revision ID: b5e1d7a3c902
Revises: 86a186c22308
Create Date: 2026-10-25 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b5e1d7a3c902'
down_revision = '86a186c22308'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('peminjaman', schema=None) as batch_op:
        batch_op.add_column(sa.Column('id_izin_kegiatan', sa.Integer(), nullable=True))
        batch_op.create_foreign_key('fk_peminjaman_izin_kegiatan', 'izin_kegiatan', ['id_izin_kegiatan'], ['id'])


def downgrade():
    with op.batch_alter_table('peminjaman', schema=None) as batch_op:
        batch_op.drop_constraint('fk_peminjaman_izin_kegiatan', type_='foreignkey')
        batch_op.drop_column('id_izin_kegiatan')
