import React, { useState } from 'react';
import { useSlipMe } from '../hooks/usePayrollQueries';
import { SlipDetailDialog } from '../components/SlipGajiDialogs';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../common/components/ui/card';
import { Button } from '../../../common/components/ui/button';
import { Input } from '../../../common/components/ui/input';
import { FileText, Printer, CheckCircle } from 'lucide-react';

const MySlipGajiPage = () => {
  const currentDate = new Date();
  const defaultTahun = String(currentDate.getFullYear());
  
  const [tahun, setTahun] = useState(defaultTahun);
  const [selectedSlipId, setSelectedSlipId] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // We fetch employee slips, here we might filter by year client-side or use params if API supports it
  const { data: slipsData, isLoading } = useSlipMe({
    // Using year as a filter if your API supports extracting year from periode,
    // otherwise we just fetch all and filter client side.
  });

  const slips = slipsData?.data || [];
  
  const filteredSlips = slips.filter(slip => slip.periode.startsWith(tahun));

  const handleViewDetail = (id) => {
    setSelectedSlipId(id);
    setIsDetailOpen(true);
  };

  const handlePrint = (id) => {
    window.open(`/payroll/slips/print/${id}`, '_blank');
  };

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(angka || 0);
  };

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Slip Gaji Saya</h1>
          <p className="text-sm text-muted-foreground mt-1">Lihat dan unduh slip gaji bulanan Anda.</p>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="border-b bg-white pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Riwayat Slip Gaji</CardTitle>
              <CardDescription className="text-xs mt-0.5">Hanya menampilkan slip gaji yang sudah difinalisasi.</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Tahun:</span>
            <Input 
              type="number" 
              value={tahun} 
              onChange={(e) => setTahun(e.target.value)}
              className="w-24 h-9 text-sm text-center"
            />
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-full text-center py-10 text-slate-500">
                <div className="flex justify-center mb-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                </div>
                Memuat data slip gaji...
              </div>
            ) : filteredSlips.length === 0 ? (
              <div className="col-span-full text-center py-16 bg-slate-50 rounded-xl border border-dashed">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-slate-900">Belum Ada Slip Gaji</h3>
                <p className="text-sm text-slate-500 mt-1">Tidak ada catatan slip gaji untuk tahun {tahun}.</p>
              </div>
            ) : (
              filteredSlips.map((slip) => {
                const id = slip.slip_id || slip.id;
                // Slip parameter is usually 'YYYY-MM'
                const [yyyy, mm] = slip.periode.split('-');
                const monthName = monthNames[parseInt(mm, 10) - 1];
                
                return (
                  <div key={id} className="bg-white rounded-xl border p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-50 to-blue-50 -ml-12 -mt-12 rounded-full z-0 group-hover:scale-150 transition-transform duration-500"></div>
                    
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Finalized</span>
                        </div>
                        <div className="text-xs text-slate-500">
                          {slip.periode}
                        </div>
                      </div>
                      
                      <div className="mb-2">
                        <h3 className="text-xl font-black text-slate-800">{monthName} {yyyy}</h3>
                        <p className="text-sm text-slate-500">Take Home Pay</p>
                      </div>
                      
                      <div className="text-2xl font-bold tracking-tight text-indigo-600 mb-6">
                        {formatRupiah(slip.gaji_bersih)}
                      </div>
                      
                      <div className="flex gap-2 w-full pt-4 border-t border-slate-100 mt-auto">
                        <Button 
                          variant="outline" 
                          className="w-full text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border-slate-200"
                          onClick={() => handleViewDetail(id)}
                        >
                          <FileText className="w-4 h-4 mr-2" /> Detail
                        </Button>
                        <Button 
                          variant="outline"
                          className="w-full text-slate-600 hover:text-blue-600 hover:bg-blue-50 border-slate-200"
                          onClick={() => handlePrint(id)}
                        >
                          <Printer className="w-4 h-4 mr-2" /> Cetak
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

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

export default MySlipGajiPage;
