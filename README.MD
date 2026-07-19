# SIKILAT V2 - Backend API Documentation

API ini dibangun menggunakan Node.js, Express, TypeScript, dan Prisma ORM. 
Dilengkapi dengan sistem keamanan JWT HttpOnly Cookie, Helmet, CORS strict, dan Rate Limiter.

## Base URL
- **Development:** `http://localhost:5000/api/v1`
- **Production:** `menyesuaikan`
- **Swagger UI:** `/api-docs`

## Authentication & Security
- Menggunakan **JWT** yang disimpan dalam **HTTP-Only Cookies**.
- **CORS** dibatasi hanya untuk origin Frontend (`https://sikilat.smpn6pekalongan.org`).
- **RBAC (Role-Based Access Control):** Setiap endpoint dilindungi oleh `rbac.middleware.ts` sesuai Enum Role di Prisma.
- **Audit Log:** Middleware otomatis mencatat aktivitas mutasi (POST/PUT/DELETE) ke tabel `AuditLog`.

---

## 📚 API Endpoints Outline

### 1. Authentication & Profil (`/auth`)
| Method | Endpoint | Deskripsi | RBAC Access |
| :--- | :--- | :--- | :--- |
| POST | `/auth/login` | Login user, set HttpOnly Cookie | Public |
| POST | `/auth/register` | Daftar akun baru (membutuhkan NIP/NISN valid) | Public |
| POST | `/auth/request-otp` | Request OTP untuk lupa password | Public |
| POST | `/auth/reset-password` | Reset password via OTP | Public |
| POST | `/auth/logout` | Clear HttpOnly Cookie & hapus sesi | All Roles |
| GET  | `/auth/me` | Dapatkan data user yang sedang login | All Roles |

### 2. User Management & Approval (`/users`)
| Method | Endpoint | Deskripsi | RBAC Access |
| :--- | :--- | :--- | :--- |
| GET  | `/users` | Get semua data user dengan filter & pagination | Admin, Super_Admin |
| POST | `/users/edit-profil` | Siswa/Staff kirim request ubah profil | All Roles |
| GET  | `/users/approval-requests` | Lihat antrean request ubah profil | Admin |
| POST | `/users/approve/:id` | Admin Setuju/Tolak request ubah profil | Admin |
| PUT  | `/users/:id/block` | Blokir atau nonaktifkan akun user | Admin |

### 3. Inventaris Barang (`/inventaris`)
| Method | Endpoint | Deskripsi | RBAC Access |
| :--- | :--- | :--- | :--- |
| GET  | `/inventaris` | List barang (Search, Filter Kategori) | All Roles |
| POST | `/inventaris` | Tambah barang + Generate QR Code Unik | Admin |
| PUT  | `/inventaris/:id` | Update data dan spesifikasi barang | Admin |
| GET  | `/inventaris/:id/qr` | Get/Print QR Code barang | Admin |

### 4. Peminjaman & Antrean (`/peminjaman`)
| Method | Endpoint | Deskripsi | RBAC Access |
| :--- | :--- | :--- | :--- |
| POST | `/peminjaman` | Ajukan pinjam (Masuk Antrean jika stok 0) | All Roles |
| GET  | `/peminjaman` | List riwayat & status peminjaman | All Roles (Self), Admin (All) |
| PUT  | `/peminjaman/:id/approve` | Setujui/Tolak ajuan peminjaman | Admin |
| POST | `/peminjaman/scan-return` | Scan QR untuk mengembalikan barang | Admin |
| PUT  | `/peminjaman/:id/return-status` | Validasi akhir: Dikembalikan "Normal" atau "Rusak" (Otomatis potong stok + buat tiket aduan jika rusak) | Admin |

### 5. Ticketing & Laporan Kerusakan (`/laporan`)
| Method | Endpoint | Deskripsi | RBAC Access |
| :--- | :--- | :--- | :--- |
| POST | `/laporan` | Buat aduan (Upload foto max 2MB via Multer/Cloudinary) | Pelapor, All Roles |
| GET  | `/laporan` | List Laporan (Filter Status) | All Roles |
| POST | `/laporan/teknisi-insert` | Teknisi buat aduan lapangan ekstra untuk pelapor | Teknisi |
| PUT  | `/laporan/:id/ambil-tugas` | Teknisi claim laporan masuk | Teknisi |
| PUT  | `/laporan/:id/update-status`| Update status (Diproses/Selesai) + Input sparepart | Teknisi |

### 6. Agenda & Booking Lab (`/agenda`)
| Method | Endpoint | Deskripsi | RBAC Access |
| :--- | :--- | :--- | :--- |
| GET  | `/agenda` | Lihat kalender agenda kegiatan/lab | All Roles |
| POST | `/agenda` | Booking lab/fasilitas dengan Template JSON | Pengawas, Admin |
| GET  | `/agenda/templates` | Get opsi template uraian agenda | Pengawas, Admin |

### 7. Statistik & Metrik (`/stats`)
| Method | Endpoint | Deskripsi | RBAC Access |
| :--- | :--- | :--- | :--- |
| GET  | `/stats/quick` | Angka agregat untuk Kartu Dasbor (Count) | All Roles |
| GET  | `/stats/charts` | Data kurva kerusakan & barang terlaris | Admin, Pengawas |
| GET  | `/stats/export-ba` | Generate/Export Berita Acara (PDF Ready) | Pengawas, Admin |

### 8. Integrasi WhatsApp Gateway (`/wa`)
| Method | Endpoint | Deskripsi | RBAC Access |
| :--- | :--- | :--- | :--- |
| POST | `/wa/reminder` | Hit API WA untuk tagih peminjam terlambat | Admin |
| POST | `/wa/broadcast` | Teknisi broadcast progres ke multi-pengawas | Teknisi |
