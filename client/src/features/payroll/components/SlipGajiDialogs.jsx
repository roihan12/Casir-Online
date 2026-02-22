import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { generateSlipSchema, batchFinalizeSlipSchema } from '../validations/payrollValidation';
import { useGenerateSlip, useBatchFinalizeSlip } from '../hooks/usePayrollMutations';
import { useSlipDetail } from '../hooks/usePayrollQueries';
import { useCabang } from '../../cabang/context/CabangContext';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../../common/components/ui/dialog';
import { Button } from '../../../common/components/ui/button';
import { Input } from '../../../common/components/ui/input';
import { Label } from '../../../common/components/ui/label';
import { Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const GenerateSlipDialog = ({ open, onOpenChange }) => {
  const { selectedCabang } = useCabang();
  const cabangId = selectedCabang?.id === 'global' ? '' : (selectedCabang?.id || '');

  const { mutate: generateSlip, isPending } = useGenerateSlip();
  
  // Format current year and month as YYYY-MM
  const currentDate = new Date();
  const defaultPeriode = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  const form = useForm({
    resolver: zodResolver(generateSlipSchema),
    defaultValues: {
      periode: defaultPeriode,
      cabangId: cabangId,
    },
  });

  React.useEffect(() => {
    if (cabangId) {
      form.setValue('cabangId', cabangId);
    }
  }, [cabangId, form]);

  const onSubmit = (formData) => {
    generateSlip(formData, {
      onSuccess: () => onOpenChange(false)
    });
  };

  const isGlobal = !cabangId || cabangId === 'global';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generate Slip Bulanan</DialogTitle>
          <DialogDescription>
            Sistem akan menghitung gaji pokok, lembur, izin/cuti, tunjangan, dan potongan untuk membuat draft slip gaji.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="periode">Periode (Bulan - Tahun)</Label>
            <Input 
              id="periode"
              type="month"
              {...form.register('periode')}
            />
            {form.formState.errors.periode && (
              <span className="text-sm text-red-500">{form.formState.errors.periode.message}</span>
            )}
          </div>

          <div className="flex justify-end pt-6 space-x-2">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={isPending}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending || isGlobal} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isPending ? "Memproses..." : "Generate Draft"}
            </Button>
          </div>
          {isGlobal && !isPending && (
            <p className="text-xs text-red-500 text-right mt-1">Silakan ganti cabang terlebih dahulu</p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const SlipDetailDialog = ({ open, onOpenChange, slipId }) => {
  const { data: detailData, isLoading } = useSlipDetail(slipId);
  const slip = detailData?.data;
  const navigate = useNavigate();

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(angka || 0);
  };

  const handlePrint = () => {
    if (slipId) {
       window.open(`/payroll/slips/print/${slipId}`, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div>
            <DialogTitle>Detail Slip Gaji</DialogTitle>
            <DialogDescription>
              {slip?.user?.nama_lengkap} - Periode {slip?.periode}
            </DialogDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePrint} 
            disabled={isLoading || !slip}
            className="flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Slip</span>
          </Button>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-2 mt-4 space-y-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">Memuat detail...</div>
          ) : !slip ? (
            <div className="text-center text-slate-500 py-10">Detail tidak ditemukan.</div>
          ) : (
            <>
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-lg border">
                <div>
                  <span className="text-slate-500 block mb-1 font-semibold text-[11px] uppercase tracking-wider">Nama Karyawan</span>
                  <span className="font-medium">{slip.user?.nama_lengkap}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1 font-semibold text-[11px] uppercase tracking-wider">Status Slip</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase ${slip.status === 'draft' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {slip.status}
                  </span>
                </div>
              </div>

              {/* Rincian Pemasukan */}
              <div>
                <h4 className="font-bold text-slate-800 border-b pb-2 mb-3">Pemasukan</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-200">
                    <span className="text-slate-600">Gaji Pokok</span>
                    <span className="font-semibold">{formatRupiah(slip.gaji_pokok)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-200">
                    <span className="text-slate-600">Lembur ({slip.total_jam_lembur} Jam)</span>
                    <span className="font-semibold">{formatRupiah(slip.total_lembur)}</span>
                  </div>
                  {/* Tunjangan List */}
                  {((slip.slip_gaji_detail || []).filter(d => d.tipe === 'tunjangan')).map((t, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1 border-b border-dashed border-slate-200">
                      <span className="text-slate-600">{t.nama}</span>
                      <span className="font-semibold">{formatRupiah(t.nilai)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center py-2 bg-slate-50 px-2 rounded font-bold text-slate-800 mt-2">
                    <span>Total Pemasukan</span>
                    <span>{formatRupiah(slip.total_pemasukan || (Number(slip.gaji_pokok) + Number(slip.total_lembur) + Number(slip.total_tunjangan)))}</span>
                  </div>
                </div>
              </div>

              {/* Rincian Potongan */}
              <div>
                <h4 className="font-bold text-slate-800 border-b pb-2 mb-3">Potongan</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-200">
                    <span className="text-slate-600 text-rose-600">Potongan Izin/Alpa ({slip.total_hari_absen_potong} Hari)</span>
                    <span className="font-semibold text-rose-600">- {formatRupiah(slip.total_potongan_absen)}</span>
                  </div>
                  {/* Potongan List */}
                  {((slip.slip_gaji_detail || []).filter(d => d.tipe === 'potongan')).map((p, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1 border-b border-dashed border-slate-200">
                      <span className="text-slate-600 text-rose-600">{p.nama}</span>
                      <span className="font-semibold text-rose-600">- {formatRupiah(p.nilai)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center py-2 bg-rose-50 px-2 rounded font-bold text-rose-800 mt-2">
                    <span>Total Potongan</span>
                    <span>{formatRupiah(slip.total_potongan)}</span>
                  </div>
                </div>
              </div>

              {/* Take Home Pay */}
              <div className="bg-indigo-600 text-white p-4 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">Take Home Pay</div>
                  <div className="text-slate-200 text-[10px]">Diterima Karyawan</div>
                </div>
                <div className="text-3xl font-black">{formatRupiah(slip.gaji_bersih)}</div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
