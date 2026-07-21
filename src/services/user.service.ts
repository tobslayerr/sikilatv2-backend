import prisma from '../config/database';

export const UserService = {
  // 1. Ambil Semua User untuk Tabel Admin (Dilengkapi Pagination & Pencarian)
  async getAllUsers(page: number, limit: number, search: string) {
    const skip = (page - 1) * limit;
    
    // Pencarian Case-Insensitive untuk Nama atau Username
    const where = search ? {
      OR: [
        { namaLengkap: { contains: search, mode: 'insensitive' as const } },
        { username: { contains: search, mode: 'insensitive' as const } },
      ]
    } : {};

    const [total, data] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: { 
          id: true, namaLengkap: true, username: true, role: true, 
          isActive: true, statusVerifikasi: true, noWa: true, email: true, dibuatPada: true 
        },
        orderBy: { dibuatPada: 'desc' }
      })
    ]);

    return { total, data };
  },

  // 2. Request Ubah Profil (Pelapor/User Biasa)
  async requestEditProfile(userId: string, dataBaru: any, alasan: string) {
    // Anti-Spam: Cek apakah user masih punya request PENDING
    const pendingRequest = await prisma.profilEditRequest.findFirst({
      where: { idUser: userId, status: 'PENDING' }
    });

    if (pendingRequest) {
      throw new Error('Anda masih memiliki pengajuan perubahan profil yang sedang diproses (PENDING).');
    }

    return prisma.profilEditRequest.create({
      data: { idUser: userId, dataBaru, alasan, status: 'PENDING' }
    });
  },

  // 3. Ambil Antrean Request Profil (Untuk Admin)
  async getApprovalRequests(page: number, limit: number, statusFilter?: string) {
    const skip = (page - 1) * limit;
    const where = statusFilter ? { status: statusFilter as any } : {};

    const [total, data] = await Promise.all([
      prisma.profilEditRequest.count({ where }),
      prisma.profilEditRequest.findMany({
        where, skip, take: limit,
        include: { user: { select: { namaLengkap: true, username: true, role: true } } },
        orderBy: { diajukanPada: 'asc' }
      })
    ]);

    return { total, data };
  },

  // 4. Proses Setuju / Tolak (Admin)
  async processApproval(requestId: string, adminId: string, status: 'APPROVED' | 'REJECTED', alasanPenolakan?: string) {
    return prisma.$transaction(async (tx) => {
      // Pastikan data ada dan masih PENDING
      const reqProfil = await tx.profilEditRequest.findUnique({ where: { id: requestId } });
      if (!reqProfil) throw new Error('Pengajuan tidak ditemukan.');
      if (reqProfil.status !== 'PENDING') throw new Error('Pengajuan ini sudah diproses sebelumnya.');

      // Ubah status pengajuan
      const updatedReq = await tx.profilEditRequest.update({
        where: { id: requestId },
        data: { status }
      });

      // Jika APPROVED, timpa data user yang asli dengan data baru
      if (status === 'APPROVED') {
        const payloadBaru = reqProfil.dataBaru as any;
        await tx.user.update({
          where: { id: reqProfil.idUser },
          data: {
            ...(payloadBaru.namaLengkap && { namaLengkap: payloadBaru.namaLengkap }),
            ...(payloadBaru.noWa && { noWa: payloadBaru.noWa }),
            ...(payloadBaru.email !== undefined && { email: payloadBaru.email }),
          }
        });
      }

      return updatedReq;
    });
  },

  // 5. Blokir / Buka Blokir Akun
  async toggleBlockUser(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User tidak ditemukan.');
    if (user.role === 'Super_Admin') throw new Error('Pelanggaran: Anda tidak bisa memblokir Super Admin!');

    return prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
      select: { id: true, username: true, isActive: true, role: true }
    });
  }
};