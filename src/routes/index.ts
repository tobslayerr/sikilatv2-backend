import { Router } from 'express';
import authRoute from './auth.route';
import userRoute from './user.route';
import inventarisRoute from './inventaris.route';
import peminjamanRoute from './peminjaman.route';
import laporanRoute from './laporan.route';
import agendaRoute from './agenda.route';
import waRoute from './wa.route';
import statsRoute from './stats.route';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Modul Autentikasi & Manajemen Sesi (Login/Logout/OTP)
 *   - name: Users
 *     description: Modul Manajemen Pengguna & Persetujuan Profil
 *   - name: Inventaris
 *     description: Modul Gudang, Barang, Upload Cloudinary & Generate QR Code
 *   - name: Peminjaman
 *     description: Modul Transaksi Peminjaman, Antrean Otomatis & Scan Return
 *   - name: Laporan
 *     description: Modul Ticketing Kerusakan, Bukti Foto & Claim Teknisi
 *   - name: Agenda
 *     description: Modul Booking Lab & Kalender Kegiatan
 *   - name: WA Gateway
 *     description: Modul Notifikasi & Broadcast WhatsApp
 *   - name: Statistik
 *     description: Modul Agregat Dasbor & Export Berita Acara
 */

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login Pengguna
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username: { type: string, example: "admin" }
 *               password: { type: string, example: "rahasia123" }
 *     responses:
 *       200:
 *         description: Login berhasil, menghasilkan HttpOnly Cookie
 * 
 * /api/v1/auth/me:
 *   get:
 *     summary: Cek Sesi Aktif
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Mengembalikan data user yang sedang login
 * 
 * /api/v1/inventaris:
 *   get:
 *     summary: Ambil Daftar Barang
 *     tags: [Inventaris]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: search
 *         schema: { type: string, description: "Cari nama barang" }
 *     responses:
 *       200:
 *         description: Sukses mengambil data (Pagination)
 * 
 * /api/v1/peminjaman:
 *   post:
 *     summary: Ajukan Peminjaman
 *     description: Jika stok habis, akan otomatis masuk ke tabel Antrean.
 *     tags: [Peminjaman]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idBarang: { type: string }
 *               tanggalWajibKembali: { type: string, format: date-time }
 *               keperluan: { type: string }
 *     responses:
 *       201:
 *         description: Berhasil diajukan
 * 
 * /api/v1/stats/quick:
 *   get:
 *     summary: Angka Agregat Dasbor
 *     tags: [Statistik]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil Quick Stats
 */

// =================================================================
// PEMUSATAN 8 MODUL UTAMA SIKILAT V2
// =================================================================
router.use('/auth', authRoute);
router.use('/users', userRoute);
router.use('/inventaris', inventarisRoute);
router.use('/peminjaman', peminjamanRoute);
router.use('/laporan', laporanRoute);
router.use('/agenda', agendaRoute);
router.use('/wa', waRoute);
router.use('/stats', statsRoute);

export default router;