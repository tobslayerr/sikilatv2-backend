import prisma from '../config/database';
import { Role } from '@prisma/client'; // Tambahan Import Tipe Role Prisma

export const WaService = {
  // Fungsi internal untuk simulasi hit API WA (Ganti dengan Axios ke Fonnte/Wablas di tahap produksi)
  async _kirimPesanGateway(noWa: string, pesan: string) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`\n💬 [WA GATEWAY SIMULASI] -> Ke: ${noWa}\nIsi: ${pesan}\n`);
      return true;
    }
    // TODO: Produksi -> await fetch('URL_PROVIDER_WA', { method: 'POST', body: ... })
    return true; 
  },

  async sendReminder(idPeminjaman: string) {
    const pinjam = await prisma.peminjaman.findUnique({
      where: { id: idPeminjaman },
      include: { peminjam: true, barang: true }
    });

    if (!pinjam) throw new Error('Data peminjaman tidak ditemukan');
    if (!pinjam.peminjam.noWa) throw new Error('User ini tidak mendaftarkan nomor WA');
    if (pinjam.status !== 'Disetujui' && pinjam.status !== 'Dipinjam' && pinjam.status !== 'Terlambat') {
      throw new Error('Peminjaman ini sudah selesai atau belum disetujui');
    }

    const pesan = `*PENGINGAT SIKILAT SMPN 6 PEKALONGAN*\nHalo ${pinjam.peminjam.namaLengkap}, barang *${pinjam.barang.namaBarang}* yang Anda pinjam sudah melewati batas waktu. Mohon segera dikembalikan ke laboratorium. Terima kasih.`;

    await this._kirimPesanGateway(pinjam.peminjam.noWa, pesan);
    
    // Tandai status sebagai terlambat jika belum
    if (pinjam.status !== 'Terlambat') {
      await prisma.peminjaman.update({ where: { id: idPeminjaman }, data: { status: 'Terlambat' } });
    }

    return { target: pinjam.peminjam.namaLengkap, noWa: pinjam.peminjam.noWa };
  },

  async sendBroadcast(teknisiId: string, pesan: string, roleTarget: string) {
    const teknisi = await prisma.user.findUnique({ where: { id: teknisiId } });
    
    // Perbaikan TS: Menegaskan bahwa array ini bertipe Role Prisma, bukan string biasa
    const targetRoles: Role[] = roleTarget === 'Semua_Pengawas' 
      ? ['Pengawas_IT', 'Pengawas_Sarpras', 'Admin', 'Super_Admin'] as Role[]
      : [roleTarget as Role];

    const penerima = await prisma.user.findMany({
      where: { role: { in: targetRoles }, isActive: true, noWa: { not: null } },
      select: { namaLengkap: true, noWa: true }
    });

    if (penerima.length === 0) throw new Error('Tidak ada pengguna aktif dengan role tersebut yang memiliki nomor WA');

    const pesanFinal = `*INFO TEKNISI SIKILAT*\nDari: ${teknisi?.namaLengkap} (Teknisi)\n\n${pesan}`;

    // Kirim secara paralel agar cepat
    await Promise.all(penerima.map(p => this._kirimPesanGateway(p.noWa!, pesanFinal)));

    return { jumlahTerkirim: penerima.length, targetRoles };
  }
};