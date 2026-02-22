import React, { useState } from 'react';
import { useSlipList } from '../hooks/usePayrollQueries';
import { useDeleteSlip, useFinalizeSlip, useBatchFinalizeSlip } from '../hooks/usePayrollMutations';
import { useCabang } from '../../cabang/context/CabangContext';
import { GenerateSlipDialog, SlipDetailDialog } from '../components/SlipGajiDialogs';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../common/components/ui/card';
import { Button } from '../../../common/components/ui/button';
import { Input } from '../../../common/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../common/components/ui/select';
import { Checkbox } from '../../../common/components/ui/checkbox';
import { Printer, Trash2, CheckCircle, FileText, Search, Settings2, ShieldCheck } from 'lucide-react';

const SlipGajiAdminPage = () => {
  const { selectedCabang } = useCabang();
  const cabangId = selectedCabang?.id === 'global' ? '' : (selectedCabang?.id || '');

  const currentDate = new Date();
  const defaultPeriode = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  
  const [periode, setPeriode] = useState(defaultPeriode);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [selectedSlipId, setSelectedSlipId] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Selection for batch actions
  const [selectedIds, setSelectedIds] = useState([]);

  // Fetch Slips
  const { data: slipsData, isLoading } = useSlipList({ 
    cabangId, 
    periode,
    status: statusFilter !== 'all' ? statusFilter : undefined
  });

  const { mutate: deleteSlip, isPending: isDeleting } = useDeleteSlip();
  const { mutate: finalizeSlip, isPending: isFinalizing } = useFinalizeSlip();
  const { mutate: batchFinalize, isPending: isBatchFinalizing } = useBatchFinalizeSlip();

  const slips = slipsData?.data || [];
  
  // Client-side search filtering
  const filteredSlips = slips.filter(slip => {
    const name = slip.user?.nama_lengkap || slip.user?.username || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleSelectAll = (checked) => {
    if (checked) {
      // Only select draft ones for finalize
      const draftIds = filteredSlips.filter(s => s.status === 'draft').map(s => s.slip_id || s.id);
      setSelectedIds(draftIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id, checked) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  const handleViewDetail = (id) => {
    setSelectedSlipId(id);
    setIsDetailOpen(true);
  };

  const handlePrint = (id) => {
    window.open(`/payroll/slips/print/${id}`, '_blank');
  };

  const handleDelete = (id) => {
    if (window.confirm('Hapus draft slip gaji ini?')) {
      deleteSlip(id);
    }
  };

  const handleFinalize = (id) => {
    if (window.confirm('Finalisasi slip ini? Slip yang sudah difinalisasi akan bisa dilihat oleh karyawan dan tidak bisa diubah.')) {
      finalizeSlip({ id, data: {} });
    }
  };

  const handleBatchFinalize = () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Finalisasi ${selectedIds.length} slip gaji?`)) {
      batchFinalize({ periode, cabangId, slipIds: selectedIds }, {
        onSuccess: () => setSelectedIds([])
      });
    }
  };

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(angka || 0);
  };

  const draftCount = filteredSlips.filter(s => s.status === 'draft').length;
  const isAllDraftSelected = draftCount > 0 && selectedIds.length === draftCount;
  const hasSelection = selectedIds.length > 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Slip Gaji</h1>
          <p className="text-sm text-muted-foreground mt-1">Generate dan kelola slip gaji bulanan karyawan.</p>
        </div>
        <div className="flex items-center gap-2">
          {hasSelection && (
            <Button 
              onClick={handleBatchFinalize} 
              disabled={isBatchFinalizing}
              className="bg-emerald-600 hover:bg-emerald-700 shadow-sm text-white transition-all"
            >
              <ShieldCheck className="w-4 h-4 mr-2" /> Finalisasi ({selectedIds.length})
            </Button>
          )}
          <Button onClick={() => setIsGenerateOpen(true)} className="bg-blue-600 hover:bg-blue-700 shadow-sm text-white">
            <Settings2 className="w-4 h-4 mr-2" /> Generate Slip
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="border-b bg-white pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <FileText className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Daftar Slip Gaji</CardTitle>
                <CardDescription className="text-xs mt-0.5">Filter berdasarkan periode dan status</CardDescription>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Cari karyawan..." 
                  className="pl-9 h-9 text-sm w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-36">
                <Input 
                  type="month"
                  value={periode}
                  onChange={(e) => setPeriode(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="w-full sm:w-36">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="finalized">Finalized</SelectItem>
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
                  <th className="px-4 py-4 w-10 text-center">
                    <Checkbox 
                      checked={isAllDraftSelected} 
                      onCheckedChange={handleSelectAll}
                      disabled={draftCount === 0}
                    />
                  </th>
                  <th className="px-6 py-4">Karyawan</th>
                  <th className="px-6 py-4 text-right">Gaji Pokok</th>
                  <th className="px-6 py-4 text-right">Lembur & Tnj.</th>
                  <th className="px-6 py-4 text-right">Potongan</th>
                  <th className="px-6 py-4 text-right">Take Home Pay</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                        <span className="text-muted-foreground animate-pulse text-xs">Memuat daftar slip...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredSlips.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
                          <FileText className="h-6 w-6 text-slate-400" />
                        </div>
                        <p className="font-medium text-slate-900 mt-2">Belum Ada Slip Gaji</p>
                        <p className="text-xs">Tidak ada slip untuk periode atau filter yang dipilih.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSlips.map((slip) => {
                    const id = slip.slip_id || slip.id;
                    const userName = slip.user?.namaLengkap || slip.user?.username || 'Unknown';
                    const isDraft = slip.status === 'draft';
                    const isSelected = selectedIds.includes(id);
                    
                    return (
                      <tr key={id} className={`transition-colors ${isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50/50'}`}>
                        <td className="px-4 py-4 text-center">
                          {isDraft && (
                            <Checkbox 
                              checked={isSelected}
                              onCheckedChange={(checked) => handleSelectOne(id, checked)}
                            />
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-slate-900">{userName}</span>
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-slate-600">
                          {formatRupiah(slip.gaji_pokok)}
                        </td>
                        <td className="px-6 py-4 text-right text-emerald-600 font-medium text-xs">
                          + {formatRupiah(Number(slip.total_lembur) + Number(slip.total_tunjangan))}
                        </td>
                        <td className="px-6 py-4 text-right text-rose-600 font-medium text-xs">
                          - {formatRupiah(slip.total_potongan)}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-800">
                          {formatRupiah(slip.gaji_bersih)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isDraft ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {slip.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => handleViewDetail(id)}
                            title="Lihat Detail"
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                          
                          {isDraft ? (
                            <>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                onClick={() => handleFinalize(id)}
                                disabled={isFinalizing}
                                title="Finalisasi"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDelete(id)}
                                disabled={isDeleting}
                                title="Hapus Draft"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                              title="Print Slip"
                              onClick={() => handlePrint(id)}
                            >
                              <Printer className="w-4 h-4" />
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

      <GenerateSlipDialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen} />
      
      {selectedSlipId && (
        <SlipDetailDialog 
          open={isDetailOpen} 
          onOpenChange={(val) => {
            setIsDetailOpen(val);
            if (!val) setTimeout(() => setSelectedSlipId(null), 300);
          }} 
          slipId={selectedSlipId} 
        />
      )}
    </div>
  );
};

export default SlipGajiAdminPage;
