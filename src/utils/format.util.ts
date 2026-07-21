export const formatRupiah = (angka: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(angka);
};

export const formatDateWIB = (date: Date | string): string => {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
    timeStyle: 'medium',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(date));
};