import React, { useState } from 'react';
import { useIzinCutiPending, useIzinCutiAll } from '../hooks/useLeaveQueries';
import { useCabang } from '../../cabang/context/CabangContext';
import { LeaveApprovalDialog, LeaveRejectionDialog, LeaveDetailDialog } from '../components/LeaveApprovalDialogs';

import { Card, CardContent, CardHeader, CardTitle } from '../../../common/components/ui/card';
import { Button } from '../../../common/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../common/components/ui/tabs';
import { Check, X, FileText, Clock, CheckCircle, XOctagon, XCircle, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

const LeaveApprovalPage = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  const { selectedCabang } = useCabang();
  const cabangId = selectedCabang?.id === 'global' ? '' : (selectedCabang?.id || '');

  const { data: pendingData, isLoading: isPendingLoading } = useIzinCutiPending({ cabangId });
  const { data: allData, isLoading: isAllLoading } = useIzinCutiAll({ 
    cabangId,
    // When viewing 'ALL', we can just fetch everything, or limit by page if pagination is supported
  });

  const pendingLeaves = pendingData?.data || [];
  const allLeaves = allData?.data || [];

  const handleApproveClick = (leave) => {
    setSelectedLeave(leave);
    setIsApproveOpen(true);
  };

  const handleRejectClick = (leave) => {
    setSelectedLeave(leave);
    setIsRejectOpen(true);
  };

  const handleDetailClick = (leave) => {
    setSelectedLeave(leave);
    setIsDetailOpen(true);
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

  const renderTable = (leaves, isLoading, isPendingTab = false) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left align-middle border-collapse">
        <thead className="bg-slate-50/80 text-slate-500 border-b text-[11px] font-bold uppercase tracking-wider">
          <tr>
            <th className="px-6 py-4">Karyawan</th>
            <th className="px-6 py-4">Tipe & Tanggal</th>
            <th className="px-6 py-4">Lama</th>
            <th className="px-6 py-4 hidden md:table-cell">Alasan</th>
            {!isPendingTab && <th className="px-6 py-4 text-center">Status</th>}
            {isPendingTab && <th className="px-6 py-4 text-center border-l w-[280px]">Aksi</th>}
            {!isPendingTab && <th className="px-6 py-4 text-center border-l w-[100px]">Aksi</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {isLoading ? (
            <tr><td colSpan={isPendingTab ? 5 : 5} className="text-center py-10">Memuat data...</td></tr>
          ) : leaves.length === 0 ? (
            <tr><td colSpan={isPendingTab ? 5 : 5} className="text-center py-10 text-slate-500">Tidak ada pengajuan izin/cuti.</td></tr>
          ) : (
            leaves.map((leave) => {
              const user = leave.user_izin_cuti_user_idTouser || {};
              const userName = user.namaLengkap || user.username || user.email || 'Unknown';
              return (
                <tr key={leave.izin_id || leave.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900">{userName}</span>
                      <span className="text-[11px] text-slate-500">{user.email || ''}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800 capitalize">
                        {leave.tipe_izin?.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] text-slate-500 mt-0.5">
                        {format(new Date(leave.tanggal_mulai), 'd MMM', {locale: localeId})} 
                        {leave.tanggal_mulai !== leave.tanggal_selesai && ` - ${format(new Date(leave.tanggal_selesai), 'd MMM yyyy', {locale: localeId})}`}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">{leave.jumlah_hari} Hari</td>
                  <td className="px-6 py-4 text-slate-500 text-xs max-w-xs truncate hidden md:table-cell" title={leave.alasan || '-'}>
                    {leave.alasan || '-'}
                  </td>
                  {!isPendingTab && (
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        {getStatusBadge(leave.status)}
                      </div>
                    </td>
                  )}
                  {isPendingTab && (
                    <td className="px-6 py-4 text-center space-x-2 whitespace-nowrap border-l">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-blue-700 bg-white"
                        onClick={() => handleDetailClick(leave)}
                      >
                        <Eye className="w-4 h-4 mr-1" /> Detail
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 bg-white"
                        onClick={() => handleApproveClick(leave)}
                      >
                        <Check className="w-4 h-4 mr-1" /> Setujui
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 bg-white"
                        onClick={() => handleRejectClick(leave)}
                      >
                        <X className="w-4 h-4 mr-1" /> Tolak
                      </Button>
                    </td>
                  )}
                  {!isPendingTab && (
                    <td className="px-6 py-4 text-center border-l">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 text-slate-500 hover:text-blue-600"
                        title="Lihat Detail"
                        onClick={() => handleDetailClick(leave)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Persetujuan Izin & Cuti</h1>
          <p className="text-sm text-muted-foreground mt-1">Review dan kelola pengajuan izin dan cuti dari karyawan.</p>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-white">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-6 pt-4 border-b">
              <TabsList className="grid w-[400px] grid-cols-2 mb-0 rounded-none border-b-0 bg-transparent h-12">
                <TabsTrigger 
                  value="pending"
                  className="rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-blue-50/50 data-[state=active]:shadow-none px-4 py-3"
                >
                  <Clock className="w-4 h-4 mr-2" /> Menunggu Persetujuan
                  {pendingLeaves.length > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {pendingLeaves.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="all"
                  className="rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-blue-50/50 data-[state=active]:shadow-none px-4 py-3"
                >
                  <FileText className="w-4 h-4 mr-2" /> Semua Riwayat
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="pending" className="m-0 border-t-0 p-0">
              {renderTable(pendingLeaves, isPendingLoading, true)}
            </TabsContent>

            <TabsContent value="all" className="m-0 border-t-0 p-0">
              {renderTable(allLeaves, isAllLoading, false)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <LeaveApprovalDialog 
        open={isApproveOpen} 
        onOpenChange={setIsApproveOpen} 
        data={selectedLeave} 
      />
      <LeaveRejectionDialog 
        open={isRejectOpen} 
        onOpenChange={setIsRejectOpen} 
        data={selectedLeave} 
      />
      <LeaveDetailDialog 
        open={isDetailOpen} 
        onOpenChange={setIsDetailOpen} 
        data={selectedLeave} 
      />
    </div>
  );
};

export default LeaveApprovalPage;
