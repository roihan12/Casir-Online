import React, { useState } from 'react';
import { useKuotaCutiAll } from '../hooks/useLeaveQueries';
import { GenerateKuotaDialog, AdjustKuotaDialog } from '../components/LeaveQuotaDialogs';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../common/components/ui/card';
import { Button } from '../../../common/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../common/components/ui/select';
import { Users, ShieldAlert, Zap, Edit, Search } from 'lucide-react';

const LeaveQuotaPage = () => {
  const currentYear = new Date().getFullYear().toString();
  const [tahun, setTahun] = useState(currentYear);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [selectedData, setSelectedData] = useState(null);

  const { data: kuotaData, isLoading } = useKuotaCutiAll({ tahun });

  const handleAdjustClick = (data) => {
    setSelectedData(data);
    setIsAdjustOpen(true);
  };

  const kuotaList = kuotaData?.data || [];
  
  const years = [
    (parseInt(currentYear) - 1).toString(),
    currentYear,
    (parseInt(currentYear) + 1).toString(),
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Kuota Cuti</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola dan pantau saldo cuti karyawan perusahaan.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsGenerateOpen(true)} className="bg-blue-600 hover:bg-blue-700 shadow-sm text-white">
            <Zap className="w-4 h-4 mr-2" /> Generate Kuota Massal
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="border-b bg-white pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Data Kuota Karyawan</CardTitle>
                <CardDescription className="text-xs mt-0.5">Tampilan sisa cuti periode {tahun}</CardDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-full sm:w-40 relative">
                <Select value={tahun} onValueChange={setTahun}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Tahun" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left align-middle border-collapse">
              <thead className="bg-slate-50/80 text-slate-500 border-b text-[10px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Karyawan</th>
                  <th className="px-6 py-4 text-center">Total Tahunan</th>
                  <th className="px-6 py-4 text-center hidden sm:table-cell">Sudah Diambil</th>
                  <th className="px-6 py-4 text-center hidden md:table-cell">Pending Approval</th>
                  <th className="px-6 py-4 text-center">Sisa Saldo</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                        <span className="text-muted-foreground animate-pulse text-xs">Memuat data kuota...</span>
                      </div>
                    </td>
                  </tr>
                ) : kuotaList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
                          <Search className="h-6 w-6 text-slate-400" />
                        </div>
                        <p className="font-medium text-slate-900 mt-2">Belum Ada Kuota</p>
                        <p className="text-xs">Silakan gunakan tombol "Generate Kuota Massal" untuk tahun {tahun}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  kuotaList.map((kuota) => {
                    const idKuota = kuota.kuota_id || kuota.id;
                    const user = kuota.user || {};
                    const userName = user.nama_lengkap || user.username || user.email || 'Unknown';
                    const sisaCuti = kuota.kuota_sisa;
                    const isWarning = sisaCuti <= 2;
                    
                    return (
                      <tr key={idKuota} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900">{userName}</span>
                            <span className="text-[11px] text-slate-500">{user.email || ''}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-700 max-w-[80px]">
                          {kuota.kuota_tahunan}
                        </td>
                        <td className="px-6 py-4 text-center text-slate-500 hidden sm:table-cell max-w-[80px]">
                          {kuota.kuota_diambil}
                        </td>
                        <td className="px-6 py-4 text-center text-amber-500 font-medium hidden md:table-cell max-w-[80px]">
                          {kuota.kuota_pending > 0 ? kuota.kuota_pending : '-'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            isWarning 
                              ? 'bg-red-50 text-red-600 border border-red-200' 
                              : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          }`}>
                            {isWarning && <ShieldAlert className="w-3 h-3 mr-1" />}
                            {sisaCuti}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 bg-white"
                            onClick={() => handleAdjustClick(kuota)}
                          >
                            <Edit className="w-3.5 h-3.5 mr-1 hidden sm:inline-block" /> Ubah
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <GenerateKuotaDialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen} />
      <AdjustKuotaDialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen} data={selectedData} />
    </div>
  );
};

export default LeaveQuotaPage;
