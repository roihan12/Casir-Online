import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { approveIzinCutiSchema, rejectIzinCutiSchema } from '../validations/leaveValidation';
import { useApproveIzinCuti, useRejectIzinCuti } from '../hooks/useLeaveMutations';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../../common/components/ui/dialog';
import { Button } from '../../../common/components/ui/button';
import { Label } from '../../../common/components/ui/label';
import { Textarea } from '../../../common/components/ui/textarea';

export const LeaveApprovalDialog = ({ open, onOpenChange, data }) => {
  const { mutate: approveIzin, isPending } = useApproveIzinCuti();
  
  const form = useForm({
    resolver: zodResolver(approveIzinCutiSchema),
    defaultValues: {
      catatanApprover: '',
    },
  });

  const onSubmit = (formData) => {
    if (!data) return;
    const id = data.izin_id || data.id;
    approveIzin({ id, data: formData }, {
      onSuccess: () => {
        form.reset();
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      onOpenChange(val);
      if(!val) form.reset();
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Setujui Pengajuan</DialogTitle>
          <DialogDescription>
            Tuliskan catatan persetujuan (opsional) untuk dikirim ke karyawan.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="catatan-approve">Catatan Persetujuan (Opsional)</Label>
            <Textarea 
              id="catatan-approve"
              placeholder="Contoh: Disetujui, harap selesaikan hand-over sebelum cuti."
              className="resize-none"
              rows={3}
              {...form.register('catatanApprover')}
            />
            {form.formState.errors.catatanApprover && (
              <span className="text-sm text-red-500">{form.formState.errors.catatanApprover.message}</span>
            )}
          </div>
          
          <div className="flex justify-end pt-6 space-x-2">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={isPending}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {isPending ? "Memproses..." : "Setujui"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const LeaveRejectionDialog = ({ open, onOpenChange, data }) => {
  const { mutate: rejectIzin, isPending } = useRejectIzinCuti();
  
  const form = useForm({
    resolver: zodResolver(rejectIzinCutiSchema),
    defaultValues: {
      catatanApprover: '',
    },
  });

  const onSubmit = (formData) => {
    if (!data) return;
    const id = data.izin_id || data.id;
    rejectIzin({ id, data: formData }, {
      onSuccess: () => {
        form.reset();
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      onOpenChange(val);
      if(!val) form.reset();
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-red-600">Tolak Pengajuan</DialogTitle>
          <DialogDescription>
            Tuliskan alasan penolakan untuk dikirim ke karyawan.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="catatan-reject">Catatan Penolakan <span className="text-red-500">*</span></Label>
            <Textarea 
              id="catatan-reject"
              placeholder="Contoh: Ditolak karena jadwal operasional padat."
              className="resize-none"
              rows={3}
              {...form.register('catatanApprover')}
            />
            {form.formState.errors.catatanApprover && (
              <span className="text-sm text-red-500">{form.formState.errors.catatanApprover.message}</span>
            )}
          </div>
          
          <div className="flex justify-end pt-6 space-x-2">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={isPending}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending} className="bg-red-600 hover:bg-red-700 text-white">
              {isPending ? "Memproses..." : "Tolak"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const LeaveDetailDialog = ({ open, onOpenChange, data }) => {
  if (!data) return null;
  const user = data.user_izin_cuti_user_idTouser || {};
  const userName = user.namaLengkap || user.username || user.email || 'Unknown';
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Detail Pengajuan Izin/Cuti</DialogTitle>
          <DialogDescription>
            Rincian informasi pengajuan izin atau cuti karyawan.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-lg border">
            <div>
              <span className="text-slate-500 block mb-1 font-semibold text-[11px] uppercase tracking-wider">Nama Karyawan</span>
              <span className="font-medium">{userName}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-1 font-semibold text-[11px] uppercase tracking-wider">Status Pengajuan</span>
              <span className="font-medium">{data.status ? data.status.toUpperCase() : '-'}</span>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-dashed border-slate-200">
              <span className="text-slate-600 font-medium">Tipe Pengajuan</span>
              <span className="font-semibold capitalize">{data.tipe_izin?.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-dashed border-slate-200">
              <span className="text-slate-600 font-medium">Tanggal Mulai</span>
              <span className="font-semibold">{format(new Date(data.tanggal_mulai), 'dd MMMM yyyy', {locale: localeId})}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-dashed border-slate-200">
              <span className="text-slate-600 font-medium">Tanggal Selesai</span>
              <span className="font-semibold">{format(new Date(data.tanggal_selesai), 'dd MMMM yyyy', {locale: localeId})}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-dashed border-slate-200">
              <span className="text-slate-600 font-medium">Lama Izin/Cuti</span>
              <span className="font-semibold">{data.jumlah_hari} Hari</span>
            </div>
          </div>
          <div>
             <span className="text-slate-600 font-medium text-sm block mb-1">Alasan / Keterangan</span>
             <p className="text-sm bg-slate-50 p-3 rounded border text-slate-700 whitespace-pre-wrap">
               {data.alasan || '-'}
             </p>
          </div>
          {data.catatan_approver && (
            <div>
               <span className="text-slate-600 font-medium text-sm block mb-1">Catatan Approver</span>
               <p className="text-sm bg-amber-50 p-3 rounded border border-amber-200 text-amber-800 whitespace-pre-wrap">
                 {data.catatan_approver}
               </p>
            </div>
          )}
        </div>
        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
