import React, { useState } from 'react';
import { useCabang } from '../../cabang/context/CabangContext';
import { usePreviewLaporan, downloadExcel, downloadPDF } from '../hooks/useLaporanKehadiran';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Download, FileText, FileSpreadsheet, Filter } from 'lucide-react';

const LaporanKehadiran = () => {
  const { selectedCabang } = useCabang();
  const branchId = selectedCabang?.id;

  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [status, setStatus] = useState('');

  const params = {
    cabangId: branchId,
    startDate,
    endDate,
    ...(status ? { status } : {})
  };

  const { data, isLoading } = usePreviewLaporan(params);

  const handleExcel = () => downloadExcel(branchId, startDate, endDate, status);
  const handlePDF = () => downloadPDF(branchId, startDate, endDate, status);

  if (!branchId) {
    return (
      <div className="flex h-64 items-center justify-center bg-white rounded-lg shadow-sm">
        <p className="text-gray-500">Pilih cabang terlebih dahulu untuk melihat Laporan Kehadiran.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan Kehadiran</h1>
          <p className="text-sm text-gray-500">Preview dan cetak laporan kehadiran karyawan</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExcel}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Excel
          </button>
          <button 
            onClick={handlePDF}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
          >
            <FileText className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Tanggal Mulai</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Tanggal Akhir</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Status Kehadiran</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Semua Status</option>
            <option value="hadir">Hadir (On-Time)</option>
            <option value="hadir_terlambat">Hadir (Terlambat)</option>
            <option value="izin_sakit">Izin Sakit</option>
            <option value="izin_keperluan">Izin Keperluan</option>
            <option value="cuti">Cuti</option>
            <option value="alpha">Alpha/Tanpa Keterangan</option>
          </select>
        </div>
        <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
          <Filter className="w-4 h-4" /> Menampilkan hasil query langsung
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-700">
              <tr>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider uppercase">Nama Karyawan</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider uppercase">Tanggal</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider uppercase">Status</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider uppercase">Jam Masuk</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider uppercase">Jam Keluar</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider uppercase">Lokasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">Memuat data histori kehadiran...</td>
                </tr>
              ) : data?.length > 0 ? (
                data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3 font-medium text-gray-900">{row.nama}</td>
                    <td className="px-6 py-3 text-gray-600">{format(new Date(row.tanggal), 'dd MMM yyyy')}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        row.status === 'hadir' || row.status === 'wfh' ? 'bg-green-100 text-green-800' :
                        row.status === 'hadir_terlambat' ? 'bg-yellow-100 text-yellow-800' :
                        row.status === 'alpha' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {row.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-600">{row.jamMasuk}</td>
                    <td className="px-6 py-3 text-gray-600">{row.jamKeluar}</td>
                    <td className="px-6 py-3 text-gray-500 max-w-xs truncate" title={row.lokasiMasuk}>{row.lokasiMasuk || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500 flex flex-col items-center justify-center">
                    <FileText className="w-10 h-10 text-gray-300 mb-2" />
                    Belum ada data kehadiran pada periode tersebut.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LaporanKehadiran;
