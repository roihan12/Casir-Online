const prisma = require("../config/db");
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

const getLaporanKehadiranData = async (query) => {
  const { userId, cabangId, dari, sampai, status } = query;

  const where = {};
  if (userId) where.userId = userId;
  if (cabangId) where.cabangId = cabangId;
  if (status) where.status_kehadiran = status;
  
  if (dari || sampai) {
    where.tanggalAbsensi = {};
    if (dari) where.tanggalAbsensi.gte = new Date(dari);
    if (sampai) where.tanggalAbsensi.lte = new Date(sampai);
  }

  const absensiData = await prisma.absensiPegawai.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          namaLengkap: true,
        }
      }
    },
    orderBy: {
      tanggalAbsensi: 'asc'
    }
  });

  return absensiData.map(a => ({
    nama: a.user?.namaLengkap,
    tanggal: a.tanggalAbsensi.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' }),
    hari: a.tanggalAbsensi.toLocaleDateString('id-ID', { weekday: 'long' }),
    jamMasuk: a.waktuMasuk ? a.waktuMasuk.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-',
    jamKeluar: a.waktuKeluar ? a.waktuKeluar.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-',
    jamKerja: a.jamKerja || 0,
    lembur: a.jamLembur || 0,
    status: a.status_kehadiran,
    keterangan: a.keterangan || '-'
  }));
};

const getPreviewLaporan = async (query) => {
  const data = await getLaporanKehadiranData(query);
  return data;
};

const exportExcel = async (query, res) => {
  const data = await getLaporanKehadiranData(query);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Rekap Kehadiran');

  worksheet.columns = [
    { header: 'Nama', key: 'nama', width: 25 },
    { header: 'Tanggal', key: 'tanggal', width: 15 },
    { header: 'Hari', key: 'hari', width: 15 },
    { header: 'Jam Masuk', key: 'jamMasuk', width: 15 },
    { header: 'Jam Keluar', key: 'jamKeluar', width: 15 },
    { header: 'Jam Kerja', key: 'jamKerja', width: 15 },
    { header: 'Lembur', key: 'lembur', width: 15 },
    { header: 'Status', key: 'status', width: 20 },
    { header: 'Keterangan', key: 'keterangan', width: 30 },
  ];

  worksheet.getRow(1).font = { bold: true };
  
  let totalHadir = 0;
  let totalAlpha = 0;
  let totalIzin = 0;
  let summaryJamKerja = 0;
  let summaryLembur = 0;

  data.forEach((item) => {
    worksheet.addRow(item);
    
    if (['hadir', 'hadir_terlambat', 'hadir_pulang_cepat'].includes(item.status)) totalHadir++;
    if (item.status === 'alpha') totalAlpha++;
    if (['izin_sakit', 'izin_keperluan'].includes(item.status)) totalIzin++;
    
    summaryJamKerja += Number(item.jamKerja);
    summaryLembur += Number(item.lembur);
  });

  // Summary row
  worksheet.addRow({});
  worksheet.addRow({
    nama: `Total Hadir: ${totalHadir} | Alpha: ${totalAlpha} | Izin: ${totalIzin} | Total Jam Kerja: ${summaryJamKerja} jam | Total Lembur: ${summaryLembur} jam`
  });

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    'attachment; filename=' + 'laporan_kehadiran.xlsx'
  );

  await workbook.xlsx.write(res);
  res.end();
};

const exportPDF = async (query, res) => {
  const data = await getLaporanKehadiranData(query);

  const doc = new PDFDocument({ margin: 30, size: 'A4' });
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=laporan_kehadiran.pdf');
  doc.pipe(res);

  doc.fontSize(18).text('Laporan Kehadiran Pegawai', { align: 'center' });
  doc.moveDown();

  let totalHadir = 0, totalAlpha = 0, totalIzin = 0, summaryJamKerja = 0, summaryLembur = 0;

  data.forEach(item => {
    const text = `${item.nama} - ${item.tanggal} (${item.hari}) | Masuk: ${item.jamMasuk} | Keluar: ${item.jamKeluar} | Jam Kerja: ${item.jamKerja} | Lembur: ${item.lembur} | Status: ${item.status}`;
    doc.fontSize(10).text(text);
    
    if (['hadir', 'hadir_terlambat', 'hadir_pulang_cepat'].includes(item.status)) totalHadir++;
    if (item.status === 'alpha') totalAlpha++;
    if (['izin_sakit', 'izin_keperluan'].includes(item.status)) totalIzin++;
    summaryJamKerja += Number(item.jamKerja);
    summaryLembur += Number(item.lembur);
  });

  doc.moveDown();
  const summaryText = `Total Hadir: ${totalHadir} | Alpha: ${totalAlpha} | Izin: ${totalIzin} | Total Jam Kerja: ${summaryJamKerja} jam | Total Lembur: ${summaryLembur} jam`;
  doc.fontSize(12).text(summaryText, { bold: true });

  doc.end();
};

module.exports = {
  getPreviewLaporan,
  exportExcel,
  exportPDF,
};
