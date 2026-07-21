import QRCode from 'qrcode';

export const generateQRCode = async (data: string): Promise<string> => {
  try {
    // Menghasilkan QR Code dalam bentuk Data URL (Base64 Image) yang bisa langsung dirender HTML
    return await QRCode.toDataURL(data, { margin: 1, width: 300 });
  } catch (error) {
    throw new Error('Gagal memproses QR Code');
  }
};