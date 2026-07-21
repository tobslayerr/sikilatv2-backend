import { z } from 'zod';

export const inventarisSchema = z.object({
  namaBarang: z.string().min(2, 'Nama barang wajib diisi'),
  nomorInventaris: z.string().optional(),
  deskripsi: z.string().optional(),
  // ZOD BARU: Gunakan z.coerce.number() untuk memaksa string dari form-data menjadi angka
  jumlahTotal: z.coerce.number().min(1, 'Jumlah minimal 1'),
  idJenis: z.string().min(1, 'Jenis barang wajib dipilih'),
  idLokasi: z.string().optional(),
  idSumber: z.string().optional(),
});