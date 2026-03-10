const { GoogleGenAI } = require('@google/genai');
const { ResponseError } = require("../error/responseError");
const { logger } = require("../utils/logger");


const extractInvoiceOCR = async (fileBuffer, mimeType) => {
  try {
    // Memastikan API key tersedia
    if (!process.env.GEMINI_API_KEY) {
      throw new ResponseError(500, "Gemini API Key tidak dikonfigurasi");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Validasi file
    if (!fileBuffer) {
      throw new ResponseError(400, "File gambar tidak ditemukan");
    }

    // Convert buffer to base64
    const base64Image = fileBuffer.toString('base64');

    const prompt = `
      Anda adalah asisten ekstraksi data spesialis invoice dan nota pembelian/struk kasir berbahasa Indonesia.
      Tugas Anda adalah mengekstrak data dari gambar nota/invoice yang diberikan dan mengembalikannya HANYA DALAM FORMAT JSON VALID.
      
      Jika ada field yang tidak dapat dibaca atau tidak ada di nota, isi null (kecuali array items, isi [] jika tidak ada).
      Format JSON yang dimuat:
      {
        "supplierName": "Nama toko/supplier",
        "tanggal": "Tanggal transaksi dalam format YYYY-MM-DD",
        "totalBayar": 100000, 
        "items": [
          {
            "namaProduk": "Nama barang/produk",
            "quantity": 2,
            "hargaSatuan": 50000,
            "subtotal": 100000
          }
        ]
      }
      Pastikan angka dikonversi dengan menghapus simbol titik atau koma pemisah ribuan (misal Rp 10.000 menjadi 10000 bertipe Number).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Image
              }
            }
          ]
        }
      ],
      config: {
        temperature: 0.1, // Low temp for more accurate deterministic extraction
        responseMimeType: "application/json",
      }
    });

    const responseText = response.text;
    
    try {
      const extractedData = JSON.parse(responseText);
      return extractedData;
    } catch (parseError) {
      logger.error("Failed to parse OCR response:", responseText);
      throw new ResponseError(500, "Gagal memproses hasil OCR ke format data");
    }

  } catch (error) {
    if (error instanceof ResponseError) throw error;
    logger.error("OCR Service Error:", error);
    throw new ResponseError(500, "Terjadi kesalahan saat mengekstrak gambar dengan AI");
  }
};

module.exports = {
  extractInvoiceOCR,
};
