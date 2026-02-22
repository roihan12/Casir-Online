import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { generateKuotaSchema, adjustKuotaSchema } from '../validations/leaveValidation';
import { useGenerateKuotaCuti, useAdjustKuotaCuti } from '../hooks/useLeaveMutations';

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
import { Textarea } from '../../../common/components/ui/textarea';
import { Checkbox } from '../../../common/components/ui/checkbox';

export const GenerateKuotaDialog = ({ open, onOpenChange }) => {
  const { mutate: generateKuota, isPending } = useGenerateKuotaCuti();
  
  const form = useForm({
    resolver: zodResolver(generateKuotaSchema),
    defaultValues: {
      tahun: new Date().getFullYear(),
      kuotaDefault: 12,
      carryOver: false,
      maxCarryOver: 0,
    },
  });

  const onSubmit = (data) => {
    generateKuota(data, {
      onSuccess: () => {
        form.reset();
        onOpenChange(false);
      }
    });
  };

  const isCarryOver = form.watch('carryOver');

  return (
    <Dialog open={open} onOpenChange={(val) => {
      onOpenChange(val);
      if(!val) form.reset();
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generate Kuota Tahunan</DialogTitle>
          <DialogDescription>
            Buat kuota cuti tahunan secara massal untuk semua karyawan aktif.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tahun">Tahun</Label>
              <Input 
                id="tahun"
                type="number"
                {...form.register('tahun')}
              />
              {form.formState.errors.tahun && (
                <span className="text-sm text-red-500">{form.formState.errors.tahun.message}</span>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="kuotaDefault">Kuota Dasar (Hari)</Label>
              <Input 
                id="kuotaDefault"
                type="number"
                {...form.register('kuotaDefault')}
              />
              {form.formState.errors.kuotaDefault && (
                <span className="text-sm text-red-500">{form.formState.errors.kuotaDefault.message}</span>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox 
              id="carryOver"
              checked={isCarryOver}
              onCheckedChange={(checked) => form.setValue('carryOver', !!checked)}
            />
            <Label htmlFor="carryOver" className="text-sm font-normal">
              Bawa sisa cuti tahun lalu (Carry Over)
            </Label>
          </div>

          {isCarryOver && (
            <div className="space-y-2 pl-6">
              <Label htmlFor="maxCarryOver">Maksimal Bawa Sisa (Hari)</Label>
              <Input 
                id="maxCarryOver"
                type="number"
                {...form.register('maxCarryOver')}
              />
              {form.formState.errors.maxCarryOver && (
                <span className="text-sm text-red-500">{form.formState.errors.maxCarryOver.message}</span>
              )}
            </div>
          )}

          <div className="flex justify-end pt-6 space-x-2">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={isPending}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isPending ? "Memproses..." : "Generate"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const AdjustKuotaDialog = ({ open, onOpenChange, data }) => {
  const { mutate: adjustKuota, isPending } = useAdjustKuotaCuti();
  
  const form = useForm({
    resolver: zodResolver(adjustKuotaSchema),
    defaultValues: {
      kuotaTahunan: 0,
      alasan: '',
    },
  });

  // Init form values when dialog opens with data
  React.useEffect(() => {
    if (data && open) {
      form.setValue('kuotaTahunan', data.kuota_tahunan || 0);
      form.setValue('alasan', '');
    }
  }, [data, open, form]);

  const onSubmit = (formData) => {
    if (!data) return;
    const id = data.kuota_id || data.id;
    adjustKuota({ id, data: formData }, {
      onSuccess: () => {
        form.reset();
        onOpenChange(false);
      }
    });
  };

  const userName = data?.user?.nama_lengkap || data?.user?.email || 'Karyawan';

  return (
    <Dialog open={open} onOpenChange={(val) => {
      onOpenChange(val);
      if(!val) form.reset();
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sesuaikan Kuota Cuti</DialogTitle>
          <DialogDescription>
            Ubah total kuota cuti tahunan milik <strong>{userName}</strong> secara manual.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="kuota-tahunan">Total Kuota Tahunan Baru (Hari)</Label>
            <Input 
              id="kuota-tahunan"
              type="number"
              {...form.register('kuotaTahunan')}
            />
            {form.formState.errors.kuotaTahunan && (
              <span className="text-sm text-red-500">{form.formState.errors.kuotaTahunan.message}</span>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="alasan-adjust">Alasan Perubahan</Label>
            <Textarea 
              id="alasan-adjust"
              placeholder="Contoh: Reward tambahan kuota 2 hari karena loyalitas"
              className="resize-none"
              rows={3}
              {...form.register('alasan')}
            />
            {form.formState.errors.alasan && (
              <span className="text-sm text-red-500">{form.formState.errors.alasan.message}</span>
            )}
          </div>
          
          <div className="flex justify-end pt-6 space-x-2">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={isPending}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending} className="bg-amber-600 hover:bg-amber-700 text-white">
              {isPending ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
