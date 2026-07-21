import prisma from '../config/database';

export const PeminjamanService = {
  // 1. Ambil Riwayat (Admin lihat semua, User lihat miliknya sendiri)
  async getAll(page: number, limit: number, userId: string, role: string) {
    const skip = (page - 1) * limit;
    // Jika bukan Admin, hanya tampilkan peminjaman miliknya
    const where = ['Admin', 'Super_Admin'].includes(role) ? {} : { idPeminjam: userId };

    const [total, data] = await Promise.all([
      prisma.peminjaman.count({ where }),
      prisma.peminjaman.findMany({
        where, skip, take: limit,
        include: {
          barang: { select: { namaBarang: true, nomorInventaris: true } },
          peminjam: { select: { namaLengkap: true, username: true } }
        },
        orderBy: { tanggalPinjam: 'desc' }
      })
    ]);
    return { total, data };
  },

  // 2. Ajukan Pinjam (Trigger Antrean Otomatis)
  async create(userId: string, data: any) {
    return prisma.$transaction(async (tx) => {
      const barang = await tx.inventaris.findUnique({ where: { id: data.idBarang } });
      if (!barang) throw new Error('Barang tidak ditemukan.');
      if (barang.statusBarang !== 'Tersedia') throw new Error(`Barang sedang berstatus: ${barang.statusBarang}`);

      // LOGIKA ANTREAN: Jika stok habis, masukkan ke tabel Antrean
      if (barang.jumlahTersedia <= 0) {
        const antrean = await tx.antreanPeminjaman.create({
          data: { idBarang: barang.id, idPeminjam: userId, keperluan: data.keperluan, status: 'Menunggu' }
        });
        return { type: 'ANTREAN', message: 'Stok habis! Anda dimasukkan ke dalam daftar antrean otomatis.', data: antrean };
      }

      // LOGIKA NORMAL: Potong stok, buat status Menunggu Persetujuan
      await tx.inventaris.update({
        where: { id: barang.id },
        data: { jumlahTersedia: { decrement: 1 } }
      });

      const pinjam = await tx.peminjaman.create({
        data: {
          idBarang: barang.id,
          idPeminjam: userId,
          keperluan: data.keperluan,
          tanggalWajibKembali: new Date(data.tanggalWajibKembali),
          status: 'Menunggu_Persetujuan'
        }
      });
      return { type: 'PEMINJAMAN', message: 'Berhasil diajukan. Menunggu persetujuan Admin.', data: pinjam };
    });
  },

  // 3. Persetujuan Admin (Approve/Reject)
  async approve(id: string, status: 'Disetujui' | 'Ditolak', catatanPenolakan?: string) {
    return prisma.$transaction(async (tx) => {
      const pinjam = await tx.peminjaman.findUnique({ where: { id } });
      if (!pinjam) throw new Error('Data peminjaman tidak ditemukan.');
      if (pinjam.status !== 'Menunggu_Persetujuan') throw new Error('Pengajuan ini sudah diproses.');

      // Jika ditolak, kembalikan stok barang yang sempat ditahan
      if (status === 'Ditolak') {
        await tx.inventaris.update({ where: { id: pinjam.idBarang }, data: { jumlahTersedia: { increment: 1 } } });
      }

      return tx.peminjaman.update({
        where: { id },
        data: { status, catatanPenolakan: catatanPenolakan || null }
      });
    });
  },

  // 4. Scanner Kamera Pengembalian
  async scanReturn(idBarang: string) {
    // Cari transaksi "Disetujui" atau "Dipinjam" yang aktif untuk barang ini
    const aktif = await prisma.peminjaman.findFirst({
      where: { idBarang, status: { in: ['Disetujui', 'Dipinjam', 'Terlambat'] } },
      include: { peminjam: { select: { namaLengkap: true, username: true } }, barang: { select: { namaBarang: true } } }
    });
    if (!aktif) throw new Error('Tidak ada transaksi peminjaman aktif untuk barang ini (QR Salah atau sudah dikembalikan).');
    
    return aktif;
  },

  // 5. Validasi Akhir Pengembalian (Normal / Rusak)
  async processReturn(id: string, kondisi: 'Normal' | 'Rusak', catatanPengembalian?: string, adminId?: string) {
    return prisma.$transaction(async (tx) => {
      const pinjam = await tx.peminjaman.findUnique({ where: { id } });
      if (!pinjam) throw new Error('Data peminjaman tidak ditemukan.');

      let tiketLaporan = null;

      if (kondisi === 'Normal') {
        // Barang sehat: Kembalikan stok tersedia
        await tx.inventaris.update({ where: { id: pinjam.idBarang }, data: { jumlahTersedia: { increment: 1 } } });
      } else {
        // Barang Rusak: Jangan kembalikan stok tersedia. Potong stok Total, ubah status barang, buat Laporan Kerusakan.
        await tx.inventaris.update({
          where: { id: pinjam.idBarang },
          data: { jumlahTotal: { decrement: 1 }, statusBarang: 'Rusak' }
        });

        tiketLaporan = await tx.laporanKerusakan.create({
          data: {
            nomorLaporan: `TKT-AUTO-${Date.now()}`,
            idBarang: pinjam.idBarang,
            idPelapor: pinjam.idPeminjam, // Siswa yang menghilangkan/merusak
            idPengawas: adminId, // Admin yang mengonfirmasi
            deskripsiKerusakan: `[SISTEM AUTO] Dilaporkan saat pengembalian barang. Catatan: ${catatanPengembalian || 'Rusak/Hilang'}`,
            status: 'Menunggu_Persetujuan'
          }
        });
      }

      const hasilAkhir = await tx.peminjaman.update({
        where: { id },
        data: {
          status: 'Selesai_Normal',
          tanggalAktualKembali: new Date(),
          catatanPengembalian: catatanPengembalian || `Dikembalikan dalam kondisi ${kondisi}`
        }
      });

      return { peminjaman: hasilAkhir, tiketKerusakan: tiketLaporan };
    });
  }
};