import React, { useState, useMemo } from 'react';
import { useCabang } from '../../cabang/context/CabangContext';
import { usePreviewPayroll, downloadExcelPayroll } from '../hooks/useLaporanPayroll';
import { format } from 'date-fns';
import { FileSpreadsheet, Filter, DollarSign, Users, Info } from 'lucide-react';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const LaporanPayroll = () => {
  const { selectedCabang } = useCabang();
  const branchId = selectedCabang?.id;

  const [periode, setPeriode] = useState(format(new Date(), 'yyyy-MM'));

  const params = {
    cabangId: branchId,
    periode
  };

  const { data, isLoading } = usePreviewPayroll(params);

  const handleExcel = () => downloadExcelPayroll(branchId, periode);

  // Calculate top-level stats
  const totalGajiBersih = useMemo(() => {
    if (!data) return 0;
    return data.reduce((sum, item) => sum + Number(item.gajiBersih), 0);
  }, [data]);

  const totalPotongan = useMemo(() => {
    if (!data) return 0;
    return data.reduce((sum, item) => sum + Number(item.potonganKehadiran) + Number(item.potonganLain), 0);
  }, [data]);

  const totalKaryawan = data?.length || 0;

  if (!branchId) {
    return (
      <div className="flex h-64 items-center justify-center bg-white rounded-lg shadow-sm">
        <p className="text-gray-500">Pilih cabang terlebih dahulu untuk melihat Laporan Payroll.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan Payroll</h1>
          <p className="text-sm text-gray-500">Preview slip gaji dan total pengeluaran gaji karyawan.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExcel}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Excel
          </button>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Periode (Bulan)</label>
          <input
            type="month"
            value={periode}
            onChange={(e) => setPeriode(e.target.value)}
            className="w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="ml-auto flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg font-medium border border-blue-100">
          <Info className="w-4 h-4" /> Total Gaji Bersih Dikeluarkan: {formatCurrency(totalGajiBersih)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Karyawan Tergaji</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalKaryawan}</h3>
          </div>
          <div className="p-3 bg-indigo-50 rounded-lg">
            <Users className="w-6 h-6 text-indigo-600" />
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Potongan Karyawan</p>
            <h3 className="text-xl font-bold text-red-600 mt-1">{formatCurrency(totalPotongan)}</h3>
          </div>
          <div className="p-3 bg-red-50 rounded-lg">
            <DollarSign className="w-6 h-6 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Estimasi Beban Payroll</p>
            <h3 className="text-xl font-bold text-green-600 mt-1">{formatCurrency(totalGajiBersih)}</h3>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-700">
              <tr>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider uppercase">Nama Karyawan</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider uppercase">Gaji Pokok</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider uppercase">Tunjangan</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider uppercase">Upah Lembur</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider uppercase">Tot. Potongan</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider uppercase">Gaji Bersih</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">Memuat data payroll...</td>
                </tr>
              ) : data?.length > 0 ? (
                data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3 font-medium text-gray-900">{row.nama}</td>
                    <td className="px-6 py-3 text-gray-600">{formatCurrency(row.gajiPokok)}</td>
                    <td className="px-6 py-3 text-green-600">+{formatCurrency(row.tunjangan)}</td>
                    <td className="px-6 py-3 text-blue-600">+{formatCurrency(row.upahLembur)}</td>
                    <td className="px-6 py-3 text-red-600">-{formatCurrency(Number(row.potonganKehadiran) + Number(row.potonganLain))}</td>
                    <td className="px-6 py-3 font-bold text-gray-900">{formatCurrency(row.gajiBersih)}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${
                        row.status === 'terbayar' || row.status === 'final' ? 'bg-green-100 text-green-800' :
                        row.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500 flex flex-col items-center justify-center">
                    <FileSpreadsheet className="w-10 h-10 text-gray-300 mb-2" />
                    Belum ada data slip gaji pada periode tersebut.
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

export default LaporanPayroll;
