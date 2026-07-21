import prisma from '../config/database';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/jwt.util';

// ------------------------------------------------------------------
// SURAT IZIN TYPESCRIPT: Deklarasi variabel global untuk OTP Store
// ------------------------------------------------------------------
declare global {
  var otpStore: Map<string, { otp: string; expires: number }> | undefined;
}

// Inisialisasi OTP Store (Aman dari reset saat tsx melakukan hot-reload)
const otpStore = global.otpStore || new Map<string, { otp: string; expires: number }>();
if (process.env.NODE_ENV !== 'production') global.otpStore = otpStore;
// ------------------------------------------------------------------

export const AuthService = {
  async register(data: any) {
    const isExist = await prisma.user.findUnique({ where: { username: data.username } });
    if (isExist) throw new Error('Username sudah digunakan!');

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const newUser = await prisma.user.create({
      data: {
        namaLengkap: data.namaLengkap,
        username: data.username,
        password: hashedPassword,
        nomorInduk: data.nomorInduk || null,
        noWa: data.noWa,
        email: data.email || null,
        role: 'Pelapor', // Default role untuk pendaftar baru
        statusVerifikasi: 'belum_verifikasi',
      },
    });

    return { id: newUser.id, username: newUser.username, role: newUser.role };
  },

  async login(username: string, password: string) {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) throw new Error('Username atau password salah!');
    if (!user.isActive) throw new Error('Akun Anda dinonaktifkan/diblokir oleh Admin.');

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new Error('Username atau password salah!');

    const token = generateToken({ id: user.id, role: user.role });
    return { token, user: { id: user.id, nama: user.namaLengkap, role: user.role } };
  },

  async requestOtp(username: string) {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) throw new Error('Username tidak terdaftar!');

    // Generate 6 digit angka random
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 5 * 60 * 1000; // 5 Menit
    
    otpStore.set(username, { otp, expires });
    return otp; // Mengembalikan OTP untuk ditampilkan di response (Tahap Dev)
  },

  async resetPassword(username: string, otp: string, newPassword: string) {
    const record = otpStore.get(username);
    if (!record) throw new Error('Sesi OTP tidak ditemukan atau sudah kadaluarsa.');
    if (record.expires < Date.now()) throw new Error('Kode OTP sudah kadaluarsa!');
    if (record.otp !== otp) throw new Error('Kode OTP salah!');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { username },
      data: { password: hashedPassword }
    });

    otpStore.delete(username); // Hapus OTP setelah terpakai
    return true;
  }
};