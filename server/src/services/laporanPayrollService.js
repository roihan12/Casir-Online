const prisma = require("../config/db");
const ExcelJS = require('exceljs');

const getLaporanPayrollData = async (query) => {
  const { cabangId, periode } = query;

  const where = {};
  if (cabangId) where.cabang_id = cabangId;
  if (periode) where.periode = periode; // format YYYY-MM
  // Opsional: hanya yang final/terbayar:
  // where.status = { in: ['final', 'terbayar'] };

  const payrollData = await prisma.slip_gaji.findMany({
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
      user: {
        namaLengkap: 'asc'
      }
    }
  });

  return payrollData.map(p => ({
    id: p.slip_id,
    nama: p.user?.namaLengkap,
    periode: p.periode,
    gajiPokok: Number(p.gaji_pokok || 0),
    tunjangan: Number(p.total_tunjangan || 0),
    upahLembur: Number(p.upah_lembur || 0),
    potonganKehadiran: Number(p.potongan_alpha || 0) + Number(p.potongan_terlambat || 0),
    potonganLain: Number(p.total_potongan || 0),
    gajiBersih: Number(p.gaji_bersih || 0),
    status: p.status,
  }));
};

const getPreviewPayroll = async (query) => {
  const data = await getLaporanPayrollData(query);
  return data;
};

const exportExcel = async (query, res) => {
  const data = await getLaporanPayrollData(query);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Laporan Payroll');

  worksheet.columns = [
    { header: 'Nama Karyawan', key: 'nama', width: 25 },
    { header: 'Periode', key: 'periode', width: 15 },
    { header: 'Gaji Pokok', key: 'gajiPokok', width: 20 },
    { header: 'Tunjangan', key: 'tunjangan', width: 20 },
    { header: 'Upah Lembur', key: 'upahLembur', width: 20 },
    { header: 'Potongan Kehadiran', key: 'potonganKehadiran', width: 20 },
    { header: 'Potongan Lain', key: 'potonganLain', width: 20 },
    { header: 'Gaji Bersih', key: 'gajiBersih', width: 20 },
    { header: 'Status', key: 'status', width: 15 },
  ];

  worksheet.getRow(1).font = { bold: true };
  
  let totalGajiBersih = 0;

  data.forEach((item) => {
    worksheet.addRow(item);
    totalGajiBersih += item.gajiBersih;
  });

  worksheet.addRow({});
  worksheet.addRow({
    nama: `Total Keseluruhan`,
    gajiBersih: totalGajiBersih
  });

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    'attachment; filename=laporan_payroll.xlsx'
  );

  await workbook.xlsx.write(res);
  res.end();
};

module.exports = {
  getPreviewPayroll,
  exportExcel,
};
