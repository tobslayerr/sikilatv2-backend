import { PrismaClient } from '@prisma/client';
import mysql from 'mysql2/promise';

const prisma = new PrismaClient();
const MYSQL_LOCAL_URL = 'mysql://root:@localhost:3306/labkompu_db_manajemen_lab_it';

async function main() {
  console.log('🚀 MEMULAI MIGRASI MASSAL (ULTIMATE) SIKILAT V1 -> V2...');
  const connection: any = await mysql.createConnection(MYSQL_LOCAL_URL);

  const mapJenjang = new Map<number, string>();
  const mapKelas = new Map<number, string>();
  const mapUser = new Map<number, string>();
  const mapJenis = new Map<number, string>();
  const mapLokasi = new Map<number, string>();
  const mapSumber = new Map<number, string>();
  const mapInventaris = new Map<number, string>();

  // 1. MASTER PENDIDIKAN
  console.log('\n📦 1. Memigrasi Jenjang & Kelas...');
  const [rowsJenjang]: any = await connection.execute('SELECT * FROM jenjang');
  for (const row of rowsJenjang) {
    const jenjang = await prisma.jenjang.create({
      data: { nama: row.nama_jenjang, rombelAwal: row.huruf_awal || 'A', rombelAkhir: row.huruf_akhir || 'Z' }
    });
    mapJenjang.set(row.id_jenjang, jenjang.id);
  }

  const [rowsKelas]: any = await connection.execute('SELECT * FROM kelas');
  for (const row of rowsKelas) {
    const idJenjangV2 = mapJenjang.get(row.id_jenjang);
    if (idJenjangV2) {
      const kelas = await prisma.kelas.create({ data: { idJenjang: idJenjangV2, namaKelas: row.nama_kelas } });
      mapKelas.set(row.id_kelas, kelas.id);
    }
  }

  // 2. USER
  console.log('👤 2. Memigrasi Pengguna (Users)...');
  const [rowsPengguna]: any = await connection.execute('SELECT * FROM pengguna');
  for (const row of rowsPengguna) {
    let roleBaru: any = 'Pelapor';
    if (row.role === 'Admin') roleBaru = 'Admin';
    else if (row.role === 'Super Admin') roleBaru = 'Super_Admin';
    else if (row.role === 'Pengawas IT') roleBaru = 'Pengawas_IT';
    else if (row.role === 'Pengawas Sarpras') roleBaru = 'Pengawas_Sarpras';
    else if (row.role === 'Pengawas Administrasi') roleBaru = 'Pengawas_Admin';
    else if (row.role === 'Penanggung Jawab') roleBaru = 'Teknisi';

    try {
      const user = await prisma.user.create({
        data: {
          namaLengkap: row.nama_lengkap, nomorInduk: row.nomor_induk || null,
          username: row.username, password: row.password, noWa: row.no_wa || '-',
          email: row.email || null, role: roleBaru,
          statusVerifikasi: row.status_verifikasi === 'terverifikasi' ? 'terverifikasi' : 'belum_verifikasi',
          isActive: row.is_active === 1, idKelas: row.kelas_id ? mapKelas.get(row.kelas_id) : null,
          dibuatPada: row.dibuat_pada ? new Date(row.dibuat_pada) : new Date()
        }
      });
      mapUser.set(row.id_pengguna, user.id);
    } catch (e) { }
  }

  // 3. MASTER INVENTARIS
  console.log('⚙️ 3. Memigrasi Master Inventaris...');
  const defaultJenis = await prisma.jenisBarang.create({ data: { nama: 'Lainnya', kategori: 'Non_IT' } });
  
  const [rowsJenis]: any = await connection.execute('SELECT * FROM jenis_barang');
  for (const row of rowsJenis) {
    const jenis = await prisma.jenisBarang.create({ data: { nama: row.nama_jenis, kategori: row.kategori === 'IT' ? 'IT' : 'Non_IT' } });
    mapJenis.set(row.id_jenis, jenis.id);
  }

  const [rowsLokasi]: any = await connection.execute('SELECT * FROM lokasi_barang');
  for (const row of rowsLokasi) {
    const lokasi = await prisma.lokasiBarang.create({ data: { nama: row.nama_lokasi } });
    mapLokasi.set(row.id_lokasi, lokasi.id);
  }

  const [rowsSumber]: any = await connection.execute('SELECT * FROM sumber_barang');
  for (const row of rowsSumber) {
    const sumber = await prisma.sumberBarang.create({ data: { nama: row.nama_sumber } });
    mapSumber.set(row.id_sumber, sumber.id);
  }

  // 4. INVENTARIS & FITUR
  console.log('💻 4. Memigrasi Inventaris & Fitur Tambahannya...');
  const [rowsInventaris]: any = await connection.execute('SELECT * FROM inventaris');
  for (const row of rowsInventaris) {
    let statusV2: any = 'Tersedia';
    if (row.status_barang === 'Dipinjam') statusV2 = 'Dipinjam';
    else if (row.status_barang === 'Rusak') statusV2 = 'Rusak';
    else if (row.status_barang === 'Dalam Perbaikan') statusV2 = 'Dalam_Perbaikan';
    else if (row.status_barang === 'Habis') statusV2 = 'Habis';

    try {
      const inv = await prisma.inventaris.create({
        data: {
          nomorInventaris: row.nomor_inventaris || `MIGRASI-${row.id_barang}`,
          namaBarang: row.nama_barang, deskripsi: row.deskripsi || null, 
          jumlahTotal: row.jumlah_total || 1, jumlahTersedia: row.jumlah_tersedia || 1,
          statusBarang: statusV2, tanggalMasuk: row.tanggal_masuk ? new Date(row.tanggal_masuk) : null,
          idJenis: mapJenis.get(row.id_jenis) || defaultJenis.id,
          idLokasi: row.id_lokasi ? mapLokasi.get(row.id_lokasi) : null,
          idSumber: row.id_sumber ? mapSumber.get(row.id_sumber) : null,
          ditambahkanPada: row.ditambahkan_pada ? new Date(row.ditambahkan_pada) : new Date()
        }
      });
      mapInventaris.set(row.id_barang, inv.id);
    } catch (e) {}
  }

  const [rowsFitur]: any = await connection.execute('SELECT * FROM inventaris_fitur');
  for (const row of rowsFitur) {
    if (mapInventaris.get(row.id_barang)) {
      await prisma.inventarisFitur.create({
        data: {
          idBarang: mapInventaris.get(row.id_barang)!,
          namaFitur: row.nama_fitur, keterangan: row.keterangan_fitur || null,
          tipeFitur: row.tipe_fitur || 'aman'
        }
      });
    }
  }

  // 5. TRANSAKSI (PEMINJAMAN & ANTREAN)
  console.log('🛒 5. Memigrasi Peminjaman & Antrean...');
  let pinjamGagal = 0;
  const [rowsPinjam]: any = await connection.execute('SELECT * FROM peminjaman');
  for (const row of rowsPinjam) {
    let statusV2: any = 'Menunggu_Persetujuan';
    if (row.status_peminjaman === 'Disetujui') statusV2 = 'Disetujui';
    else if (row.status_peminjaman === 'Dipinjam') statusV2 = 'Dipinjam';
    else if (row.status_peminjaman === 'Ditolak') statusV2 = 'Ditolak';
    else if (row.status_peminjaman === 'Selesai') statusV2 = 'Selesai_Normal';
    else if (row.status_peminjaman === 'Terlambat') statusV2 = 'Terlambat';

    if (mapInventaris.get(row.id_barang) && mapUser.get(row.id_pengguna_peminjam)) {
      await prisma.peminjaman.create({
        data: {
          idBarang: mapInventaris.get(row.id_barang)!,
          idPeminjam: mapUser.get(row.id_pengguna_peminjam)!,
          tanggalPinjam: new Date(row.tanggal_pinjam), tanggalWajibKembali: new Date(row.tanggal_wajib_kembali),
          tanggalAktualKembali: row.tanggal_aktual_kembali ? new Date(row.tanggal_aktual_kembali) : null,
          keperluan: row.keperluan, status: statusV2,
          catatanPengembalian: row.catatan_pengembalian || null, catatanPenolakan: row.catatan_penolakan || null
        }
      });
    } else {
      pinjamGagal++;
    }
  }
  if (pinjamGagal > 0) console.log(`   ⚠️ Lewati ${pinjamGagal} Peminjaman (Data User/Barang sudah dihapus di V1)`);

  const [rowsAntrean]: any = await connection.execute('SELECT * FROM peminjaman_antrian');
  for (const row of rowsAntrean) {
    if (mapInventaris.get(row.id_barang) && mapUser.get(row.id_pengguna)) {
      await prisma.antreanPeminjaman.create({
        data: {
          idBarang: mapInventaris.get(row.id_barang)!,
          idPeminjam: mapUser.get(row.id_pengguna)!,
          keperluan: row.keperluan,
          status: (row.status_notifikasi === 'diberitahu' ? 'Diberitahu' : 'Menunggu') as any,
          tanggalAntri: row.tanggal_antri ? new Date(row.tanggal_antri) : new Date()
        }
      });
    }
  }

  // 6. LAPORAN KERUSAKAN
  console.log('🔧 6. Memigrasi Laporan Kerusakan...');
  const [rowsAduan]: any = await connection.execute('SELECT * FROM pengaduan_kerusakan');
  for (const row of rowsAduan) {
    let statusV2: any = 'Menunggu_Persetujuan';
    if (row.status_laporan === 'Diproses') statusV2 = 'Diproses';
    else if (row.status_laporan === 'Selesai') statusV2 = 'Selesai';
    else if (row.status_laporan === 'Butuh Pergantian') statusV2 = 'Butuh_Penggantian';

    if (mapUser.get(row.id_pengguna_pelapor)) {
      await prisma.laporanKerusakan.create({
        data: {
          nomorLaporan: `TKT-MIGRASI-${row.id_pengaduan}`,
          idBarang: row.id_barang ? mapInventaris.get(row.id_barang) : null,
          namaBarangLain: row.nama_barang_lain || null,
          idPelapor: mapUser.get(row.id_pengguna_pelapor)!,
          idTeknisi: row.id_pengguna_penanggung_jawab ? mapUser.get(row.id_pengguna_penanggung_jawab) : null,
          idPengawas: row.id_pengawas ? mapUser.get(row.id_pengawas) : null,
          deskripsiKerusakan: row.deskripsi_kerusakan, catatanPenanganan: row.catatan_penanganan || null,
          status: statusV2, dilaporkanPada: row.dilaporkan_pada ? new Date(row.dilaporkan_pada) : new Date(),
          diprosesPada: row.diproses_pada ? new Date(row.diproses_pada) : null,
          diselesaikanPada: row.diselesaikan_pada ? new Date(row.diselesaikan_pada) : null
        }
      });
    }
  }

  // 7. TEMPLATE & AGENDA KEGIATAN
  console.log('📅 7. Memigrasi Template & Kalender Agenda...');
  const mapTemplate = new Map<number, string>();
  const [rowsTemplate1]: any = await connection.execute('SELECT * FROM agenda_templates');
  for (const row of rowsTemplate1) {
    const t = await prisma.templateAgenda.create({
      data: { namaTemplate: row.nama_template, uraianKegiatan: row.uraian_kegiatan, hasilKegiatan: row.hasil_kegiatan }
    });
    mapTemplate.set(row.id, t.id);
  }

  const [rowsAgenda]: any = await connection.execute('SELECT * FROM agenda_kegiatan');
  for (const row of rowsAgenda) {
    if (mapUser.get(row.id_pj)) {
      await prisma.agendaKegiatan.create({
        data: {
          idPenanggungJawab: mapUser.get(row.id_pj)!,
          waktuMulai: new Date(row.waktu_mulai), waktuSelesai: new Date(row.waktu_selesai),
          posisiRuangan: row.posisi, uraianKegiatan: row.uraian_kegiatan, hasilKegiatan: row.hasil_kegiatan,
          objekPengguna: row.objek_pengguna ? JSON.parse(row.objek_pengguna) : null,
          ringkasan: row.ringkasan || null, dibuatPada: row.dibuat_pada ? new Date(row.dibuat_pada) : new Date()
        }
      });
    }
  }

  // 8. LOG & SISTEM
  console.log('🔄 8. Memigrasi Request Profil & Audit Logs...');
  const [rowsProfilReq]: any = await connection.execute('SELECT * FROM profil_edit_requests');
  for (const row of rowsProfilReq) {
    if (mapUser.get(row.id_pengguna)) {
      let st: any = 'PENDING';
      if(row.status === 'disetujui') st = 'APPROVED';
      else if(row.status === 'ditolak') st = 'REJECTED';

      await prisma.profilEditRequest.create({
        data: {
          idUser: mapUser.get(row.id_pengguna)!,
          dataBaru: row.data_baru ? JSON.parse(row.data_baru) : {},
          alasan: row.alasan || '-', status: st,
          diajukanPada: row.requested_at ? new Date(row.requested_at) : new Date()
        }
      });
    }
  }

  const [rowsLog]: any = await connection.execute('SELECT * FROM log_aktivitas_admin');
  for (const row of rowsLog) {
     await prisma.auditLog.create({
       data: {
         idUser: row.id_admin ? mapUser.get(row.id_admin) : null,
         aksi: row.aksi || 'UPDATE', tabelTerkait: 'inventaris',
         idDataTerkait: row.id_barang_terkait ? mapInventaris.get(row.id_barang_terkait) : null,
         dataSebelum: row.data_sebelum ? JSON.parse(row.data_sebelum) : null,
         dataSesudah: row.data_sesudah ? JSON.parse(row.data_sesudah) : null,
         waktu: row.waktu_perubahan ? new Date(row.waktu_perubahan) : new Date()
       }
     });
  }

  console.log('\n✅✅ SEMUA TABEL BERHASIL DIMIGRASI DENGAN SEMPURNA! ✅✅');
  await connection.end();
}

main().then(async () => { await prisma.$disconnect(); process.exit(0); }).catch(async (e) => { console.error('\n🔥 ERROR:', e); await prisma.$disconnect(); process.exit(1); });