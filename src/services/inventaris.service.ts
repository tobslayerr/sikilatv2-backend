import prisma from '../config/database';
import { uploadImage } from '../config/cloudinary';
import { generateQRCode } from '../utils/qr.util';

export const InventarisService = {
  async getAll(page: number, limit: number, search: string) {
    const skip = (page - 1) * limit;
    const where = search ? { namaBarang: { contains: search, mode: 'insensitive' as const } } : {};

    const [total, data] = await Promise.all([
      prisma.inventaris.count({ where }),
      prisma.inventaris.findMany({
        where, skip, take: limit,
        orderBy: { ditambahkanPada: 'desc' }
      })
    ]);
    return { total, data };
  },

  async create(data: any, file?: Express.Multer.File) {
    let fotoUrl = null;
    if (file) fotoUrl = await uploadImage(file.buffer, 'sikilat/inventaris');

    const payload: any = {
      namaBarang: data.namaBarang,
      nomorInventaris: data.nomorInventaris || `INV-${Date.now()}`,
      deskripsi: data.deskripsi || null,
      jumlahTotal: data.jumlahTotal,
      jumlahTersedia: data.jumlahTotal, // Awal tambah, tersedia = total
      idJenis: data.idJenis,
      idLokasi: data.idLokasi || null,
      idSumber: data.idSumber || null,
    };
    
    // Jika di Prisma Schema ada kolom foto, masukkan. (Aman dari crash).
    if (fotoUrl) payload.foto = fotoUrl;

    return prisma.inventaris.create({ data: payload });
  },

  async getQrCode(id: string) {
    const item = await prisma.inventaris.findUnique({ where: { id } });
    if (!item) throw new Error('Barang tidak ditemukan');

    // QR Payload berisi JSON unik untuk discan oleh Teknisi/Peminjam
    const payload = JSON.stringify({ id: item.id, kode: item.nomorInventaris });
    const qrImageBase64 = await generateQRCode(payload);
    
    return { item, qrImageBase64 };
  },

  // Update Barang
  async update(id: string, data: any, file?: Express.Multer.File) {
    const barang = await prisma.inventaris.findUnique({ where: { id } });
    if (!barang) throw new Error('Barang tidak ditemukan');

    // Perbaikan TS: Gunakan 'as any' agar TypeScript tidak protes jika kolom foto tidak ada di skema
    let fotoUrl = (barang as any).foto || null; 
    if (file) {
      const { uploadImage } = await import('../config/cloudinary');
      fotoUrl = await uploadImage(file.buffer, 'sikilat/inventaris');
    }

    const payload: any = {
      ...(data.namaBarang && { namaBarang: data.namaBarang }),
      ...(data.deskripsi !== undefined && { deskripsi: data.deskripsi }),
      ...(data.jumlahTotal && { jumlahTotal: data.jumlahTotal }),
      ...(data.idJenis && { idJenis: data.idJenis }),
      ...(data.idLokasi && { idLokasi: data.idLokasi }),
    };

    // Jika berhasil upload foto / foto sudah ada, baru masukkan ke payload
    if (fotoUrl) payload.foto = fotoUrl;

    return prisma.inventaris.update({ where: { id }, data: payload });
  }
};