import prisma from '../config/database';

export const AgendaService = {
  // 1. Ambil Template Uraian Kegiatan (Dropdown untuk Frontend)
  async getTemplates() {
    return prisma.templateAgenda.findMany({
      orderBy: { namaTemplate: 'asc' }
    });
  },

  // 2. Ambil Kalender Agenda
  async getAll(startDate?: string, endDate?: string) {
    const where: any = {};
    
    // Filter rentang waktu jika ada parameter bulan/minggu dari frontend
    if (startDate && endDate) {
      where.waktuMulai = { gte: new Date(startDate) };
      where.waktuSelesai = { lte: new Date(endDate) };
    }

    return prisma.agendaKegiatan.findMany({
      where,
      include: {
        penanggungJawab: { select: { namaLengkap: true, role: true } }
      },
      orderBy: { waktuMulai: 'asc' }
    });
  },

  // 3. Buat Jadwal Baru
  async create(userId: string, data: any) {
    // Validasi tabrakan jadwal di lab yang sama
    const bentrok = await prisma.agendaKegiatan.findFirst({
      where: {
        posisiRuangan: data.posisiRuangan,
        AND: [
          { waktuMulai: { lt: new Date(data.waktuSelesai) } },
          { waktuSelesai: { gt: new Date(data.waktuMulai) } }
        ]
      }
    });

    if (bentrok) throw new Error('Jadwal bentrok! Ruangan ini sudah dibooking pada jam tersebut.');

    return prisma.agendaKegiatan.create({
      data: {
        idPenanggungJawab: userId,
        waktuMulai: new Date(data.waktuMulai),
        waktuSelesai: new Date(data.waktuSelesai),
        posisiRuangan: data.posisiRuangan,
        uraianKegiatan: data.uraianKegiatan,
        hasilKegiatan: data.hasilKegiatan || null,
        ringkasan: data.ringkasan || null,
        objekPengguna: data.objekPengguna || null,
      }
    });
  }
};