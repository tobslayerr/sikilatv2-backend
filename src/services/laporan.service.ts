import prisma from '../config/database';
import { uploadImage } from '../config/cloudinary';

export const LaporanService = {
  // 1. Ambil Semua Laporan (Filter berdasarkan Role)
  async getAll(page: number, limit: number, userId: string, role: string, statusFilter?: string) {
    const skip = (page - 1) * limit;
    
    // Pelapor hanya lihat laporannya. Teknisi/Admin lihat semua.
    let where: any = ['Admin', 'Super_Admin', 'Teknisi'].includes(role) ? {} : { idPelapor: userId };
    if (statusFilter) where.status = statusFilter;

    const [total, data] = await Promise.all([
      prisma.laporanKerusakan.count({ where }),
      prisma.laporanKerusakan.findMany({
        where, skip, take: limit,
        include: {
          barang: { select: { namaBarang: true, nomorInventaris: true } },
          pelapor: { select: { namaLengkap: true, username: true } },
          teknisi: { select: { namaLengkap: true } }
        },
        orderBy: { dilaporkanPada: 'desc' }
      })
    ]);
    return { total, data };
  },

  // 2. Buat Laporan Baru (Pelapor Umum)
  async create(userId: string, data: any, file?: Express.Multer.File) {
    let fotoUrl = null;
    if (file) fotoUrl = await uploadImage(file.buffer, 'sikilat/laporan');

    const payload: any = {
      nomorLaporan: `TKT-${Date.now()}`,
      idBarang: data.idBarang || null,
      namaBarangLain: data.namaBarangLain || null,
      idPelapor: userId,
      deskripsiKerusakan: fotoUrl ? `${data.deskripsiKerusakan}\n\nLampiran Foto: ${fotoUrl}` : data.deskripsiKerusakan,
      status: 'Menunggu_Persetujuan',
    };

    // Jika ada foto, kita simpan juga ke field fotoBukti (Jika ada di schema Prisma Anda)
    // Untuk keamanan agar tidak crash jika schema beda, kita juga sudah menempelkannya di deskripsiKerusakan atas
    if (fotoUrl) payload.fotoBukti = fotoUrl;

    return prisma.$transaction(async (tx) => {
      const laporan = await tx.laporanKerusakan.create({ data: payload });
      // Ubah status barang di gudang jadi Rusak
      if (data.idBarang) {
        await tx.inventaris.update({ where: { id: data.idBarang }, data: { statusBarang: 'Rusak' } });
      }
      return laporan;
    });
  },

  // 3. Teknisi Ambil Tugas (Claim)
  async ambilTugas(laporanId: string, teknisiId: string) {
    const laporan = await prisma.laporanKerusakan.findUnique({ where: { id: laporanId } });
    if (!laporan) throw new Error('Laporan tidak ditemukan');
    if (laporan.idTeknisi) throw new Error('Tugas ini sudah diambil oleh teknisi lain');

    return prisma.laporanKerusakan.update({
      where: { id: laporanId },
      data: { idTeknisi: teknisiId, status: 'Diproses', diprosesPada: new Date() }
    });
  },

  // 4. Update Status Perbaikan & Input Sparepart
  async updateStatus(laporanId: string, teknisiId: string, status: 'Diproses' | 'Selesai' | 'Butuh_Penggantian', catatan?: string) {
    return prisma.$transaction(async (tx) => {
      const laporan = await tx.laporanKerusakan.findUnique({ where: { id: laporanId } });
      if (!laporan) throw new Error('Laporan tidak ditemukan');
      if (laporan.idTeknisi !== teknisiId && status !== 'Butuh_Penggantian') {
        throw new Error('Anda tidak berhak mengupdate tugas teknisi lain');
      }

      const payload: any = { status, catatanPenanganan: catatan || null };
      if (status === 'Selesai') payload.diselesaikanPada = new Date();

      const updated = await tx.laporanKerusakan.update({ where: { id: laporanId }, data: payload });

      // Jika Selesai, kembalikan barang ke kondisi "Tersedia"
      if (status === 'Selesai' && laporan.idBarang) {
        await tx.inventaris.update({ where: { id: laporan.idBarang }, data: { statusBarang: 'Tersedia' } });
      }

      return updated;
    });
  },

  // 5. Teknisi Insert Langsung (Saat Patroli / Cek Lab)
  async teknisiInsert(teknisiId: string, data: any, file?: Express.Multer.File) {
    // Sama seperti create, tapi langsung diambil oleh Teknisi tersebut
    let fotoUrl = null;
    if (file) fotoUrl = await uploadImage(file.buffer, 'sikilat/laporan');

    const payload: any = {
      nomorLaporan: `TKT-TKNS-${Date.now()}`,
      idBarang: data.idBarang || null,
      namaBarangLain: data.namaBarangLain || null,
      idPelapor: teknisiId, // Teknisi sendiri yang lapor
      idTeknisi: teknisiId, // Langsung di-assign ke diri sendiri
      status: 'Diproses',   // Langsung diproses
      diprosesPada: new Date(),
      deskripsiKerusakan: fotoUrl ? `${data.deskripsiKerusakan}\n\nLampiran Foto: ${fotoUrl}` : data.deskripsiKerusakan,
    };
    if (fotoUrl) payload.fotoBukti = fotoUrl;

    return prisma.$transaction(async (tx) => {
      const laporan = await tx.laporanKerusakan.create({ data: payload });
      if (data.idBarang) {
        await tx.inventaris.update({ where: { id: data.idBarang }, data: { statusBarang: 'Dalam_Perbaikan' } });
      }
      return laporan;
    });
  }
};