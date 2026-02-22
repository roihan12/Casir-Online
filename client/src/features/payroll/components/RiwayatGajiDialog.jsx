import React from 'react';
import { useRiwayatGaji } from '../hooks/usePayrollQueries';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../../common/components/ui/dialog';
import { History, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export const RiwayatGajiDialog = ({ open, onOpenChange, userId, userName }) => {
  const { data: riwayatData, isLoading } = useRiwayatGaji(userId, { limit: 10 });
  
  const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' });
  const formatRupiah = (angka) => formatter.format(angka);

  const riwayatList = riwayatData?.data || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            Riwayat Perubahan Gaji
          </DialogTitle>
          <DialogDescription>
            Menampilkan histori penyesuaian gaji pokok untuk <strong>{userName || 'Karyawan'}</strong>.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <span className="text-sm text-slate-500 animate-pulse">Memuat riwayat...</span>
            </div>
          ) : riwayatList.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm bg-slate-50 rounded-lg">
              Belum ada catatan riwayat perubahan gaji.
            </div>
          ) : (
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
              {riwayatList.map((item, index) => {
                const isFirst = index === 0;
                // Simplified view for history list
                return (
                  <div key={item.riwayat_id || item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-white text-slate-500 group-[.is-active]:text-indigo-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      <div className={`w-3 h-3 rounded-full ${isFirst ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                    </div>
                    
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-lg shadow-sm border border-slate-100 mb-2 md:mb-0">
                      <div className="flex items-center justify-between space-x-2 mb-1">
                        <div className="font-bold text-slate-800 text-sm">{formatRupiah(item.gaji_pokok_baru)}</div>
                        <time className="text-[10px] sm:text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                          {format(new Date(item.tanggal_perubahan || item.created_at), 'dd MMM yyyy', {locale: localeId})}
                        </time>
                      </div>
                      
                      {item.gaji_pokok_lama > 0 && (
                         <div className="text-[11px] text-slate-500 mb-2 flex items-center">
                           <span>Sebelumnya: {formatRupiah(item.gaji_pokok_lama)}</span>
                           {item.gaji_pokok_baru > item.gaji_pokok_lama ? (
                             <TrendingUp className="w-3 h-3 text-emerald-500 ml-1" />
                           ) : item.gaji_pokok_baru < item.gaji_pokok_lama ? (
                             <TrendingDown className="w-3 h-3 text-rose-500 ml-1" />
                           ) : null}
                         </div>
                      )}
                      
                      <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded line-clamp-2" title={item.alasan}>
                        <span className="font-medium text-slate-700">Catatan:</span> {item.alasan || '-'}
                      </div>
                      
                      <div className="mt-2 text-[10px] text-slate-400">
                        Oleh: {item.changedBy?.nama_lengkap || item.changedBy?.email || 'Sistem'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
