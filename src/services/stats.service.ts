import prisma from '../config/database';

export const StatsService = {
  // 1. Kartu Dasbor (Quick Count)
  async getQuickStats() {
    const [totalUser, totalBarang, antreanPeminjaman, laporanAktif] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.inventaris.count(),
      prisma.peminjaman.count({ where: { status: { in: ['Menunggu_Persetujuan', 'Disetujui', 'Dipinjam'] } } }),
      prisma.laporanKerusakan.count({ where: { status: { in: ['Menunggu_Persetujuan', 'Diproses'] } } })
    ]);

    return { totalUser, totalBarang, antreanPeminjaman, laporanAktif };
  },

  // 2. Data Grafik / Charts
  async getCharts() {
    // A. Kondisi Barang Gudang
    const kondisiBarang = await prisma.inventaris.groupBy({
      by: ['statusBarang'],
      _count: { statusBarang: true }
    });

    // B. Laporan Kerusakan berdasar Status
    const statusLaporan = await prisma.laporanKerusakan.groupBy({
      by: ['status'],
      _count: { status: true }
    });

    return { 
      grafikInventaris: kondisiBarang.map(k => ({ status: k.statusBarang, jumlah: k._count.statusBarang })),
      grafikLaporan: statusLaporan.map(l => ({ status: l.status, jumlah: l._count.status }))
    };
  },

  // 3. Export Berita Acara (BA) - Format Data siap dikirim ke jsPDF Frontend
  async getExportBaLaporan(laporanId: string) {
    const laporan = await prisma.laporanKerusakan.findUnique({
      where: { id: laporanId },
      include: {
        barang: { select: { namaBarang: true, nomorInventaris: true } },
        pelapor: { select: { namaLengkap: true, nomorInduk: true } },
        teknisi: { select: { namaLengkap: true, nomorInduk: true } }
      }
    });

    if (!laporan) throw new Error('Data laporan tidak ditemukan untuk Berita Acara');
    if (laporan.status !== 'Selesai' && laporan.status !== 'Butuh_Penggantian') {
      throw new Error('Berita Acara hanya bisa dicetak untuk laporan yang sudah ditangani/selesai');
    }

    return {
      judul: 'BERITA ACARA PEMERIKSAAN / PERBAIKAN BARANG',
      nomorTugas: laporan.nomorLaporan,
      tanggalSelesai: laporan.diselesaikanPada,
      pihakPertama: laporan.teknisi?.namaLengkap || 'N/A',
      pihakKedua: laporan.pelapor.namaLengkap,
      detail: `Telah dilakukan penanganan pada barang ${laporan.barang?.namaBarang || laporan.namaBarangLain} dengan status akhir: ${laporan.status.replace('_', ' ')}.`,
      catatanTeknisi: laporan.catatanPenanganan || '-',
    };
  }
};