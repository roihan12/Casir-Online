import React, { useState } from 'react';
import { useIzinCutiMe, useKuotaCutiUser } from '../hooks/useLeaveQueries';
import { useCancelIzinCuti } from '../hooks/useLeaveMutations';
import { useAuth } from '../../auth/hooks/useAuth';
import IzinCutiForm from '../components/IzinCutiForm';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../common/components/ui/card';
import { Button } from '../../../common/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../common/components/ui/select';
import { Calendar, FileText, XCircle, Clock, CheckCircle, XOctagon } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

const MyLeavePage = () => {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState('all');

  // get user info
  const userId = user?.id || '';
  
  const { data: izinData, isLoading: isIzinLoading } = useIzinCutiMe({ 
    status: statusFilter !== 'all' ? statusFilter : undefined
  });
  
  const { data: kuotaData, isLoading: isKuotaLoading } = useKuotaCutiUser(userId, {
    tahun: new Date().getFullYear()
  });

  const { mutate: cancelIzin, isPending: isCanceling } = useCancelIzinCuti();

  const handleCancel = (id) => {
    if (window.confirm('Apakah Anda yakin ingin membatalkan pengajuan ini?')) {
      cancelIzin(id);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': return <span className="flex items-center gap-1 px-2 py-1 rounded bg-amber-50 text-amber-600 border border-amber-200 text-[10px] font-bold uppercase"><Clock className="w-3 h-3" /> Pending</span>;
      case 'disetujui': return <span className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold uppercase"><CheckCircle className="w-3 h-3" /> Disetujui</span>;
      case 'ditolak': return <span className="flex items-center gap-1 px-2 py-1 rounded bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-bold uppercase"><XOctagon className="w-3 h-3" /> Ditolak</span>;
      case 'dibatalkan': return <span className="flex items-center gap-1 px-2 py-1 rounded bg-slate-50 text-slate-500 border border-slate-200 text-[10px] font-bold uppercase"><XCircle className="w-3 h-3" /> Dibatalkan</span>;
      default: return null;
    }
  };

  const leaves = izinData?.data || [];
  const kuota = kuotaData?.data;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Izin & Cuti Saya</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola pengajuan izin dan cuti serta pantau sisa kuota tahunan Anda.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          {/* Card Kuota */}
          <Card className="border-none shadow-sm bg-blue-600 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-blue-500/50 blur-2xl"></div>
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-lg font-medium text-blue-100 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-200" />
                Sisa Kuota Cuti Tahunan
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              {isKuotaLoading ? (
                <div className="animate-pulse h-12 w-24 bg-blue-500/50 rounded mt-2"></div>
              ) : kuota ? (
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black">{kuota.kuota_sisa}</span>
                    <span className="text-blue-100 font-medium">Hari</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-blue-500/50 flex justify-between text-xs text-blue-100">
                    <span>Total: {kuota.kuota_tahunan}</span>
                    <span>Diambil: {kuota.kuota_diambil}</span>
                    <span>Pending: {kuota.kuota_pending}</span>
                  </div>
                </div>
              ) : (
                <div className="text-blue-100 py-4">Belum ada data kuota cuti tahunan.</div>
              )}
            </CardContent>
          </Card>

          <IzinCutiForm onSuccess={() => {}} />
        </div>

        <div className="md:col-span-2">
          <Card className="border-none shadow-sm h-full bg-white">
            <CardHeader className="border-b pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <FileText className="w-5 h-5 text-slate-500" />
                  </div>
                  Riwayat Pengajuan
                </CardTitle>
                <div className="w-40">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Semua Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="disetujui">Disetujui</SelectItem>
                      <SelectItem value="ditolak">Ditolak</SelectItem>
                      <SelectItem value="dibatalkan">Dibatalkan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left align-middle border-collapse">
                  <thead className="bg-slate-50/80 text-slate-500 border-b text-[11px] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Tipe & Tanggal</th>
                      <th className="px-6 py-4">Lama</th>
                      <th className="px-6 py-4 hidden sm:table-cell">Alasan</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isIzinLoading ? (
                      <tr><td colSpan={5} className="text-center py-10">Memuat data...</td></tr>
                    ) : leaves.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-10 text-slate-500">Tidak ada pengajuan ditemukan.</td></tr>
                    ) : (
                      leaves.map((leave) => {
                        const idLeave = leave.izin_id || leave.id;
                        return (
                          <tr key={idLeave} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="font-semibold text-slate-900 capitalize">
                                  {leave.tipe_izin?.replace('_', ' ')}
                                </span>
                                <span className="text-[11px] text-slate-500 mt-0.5">
                                  {format(new Date(leave.tanggal_mulai), 'd MMM yyyy', {locale: localeId})} 
                                  {leave.tanggal_mulai !== leave.tanggal_selesai && ` - ${format(new Date(leave.tanggal_selesai), 'd MMM yyyy', {locale: localeId})}`}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-700">{leave.jumlah_hari} Hari</td>
                            <td className="px-6 py-4 text-slate-500 text-xs max-w-[200px] truncate hidden sm:table-cell" title={leave.alasan || '-'}>
                              {leave.alasan || '-'}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex justify-center">
                                {getStatusBadge(leave.status)}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              {leave.status === 'pending' && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-[11px] h-7 px-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 bg-white"
                                  onClick={() => handleCancel(idLeave)}
                                  disabled={isCanceling}
                                >
                                  Batalkan
                                </Button>
                              )}
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
        </div>
      </div>
    </div>
  );
};

export default MyLeavePage;
