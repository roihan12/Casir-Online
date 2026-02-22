import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tunjanganSchema } from '../validations/payrollValidation';
import { useCreateTunjangan, useUpdateTunjangan } from '../hooks/usePayrollMutations';
import { useKomponenGaji } from '../hooks/usePayrollQueries';

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../common/components/ui/select';

export const TunjanganFormDialog = ({ open, onOpenChange, data, userId }) => {
  const isEdit = !!data;
  
  const { mutate: createTunjangan, isPending: isCreating } = useCreateTunjangan();
  const { mutate: updateTunjangan, isPending: isUpdating } = useUpdateTunjangan();
  const isPending = isCreating || isUpdating;

  const { data: komponenData } = useKomponenGaji({ tipe: 'tunjangan', isActive: true });
  const tunjanganOptions = komponenData?.data || [];
  
  const form = useForm({
    resolver: zodResolver(tunjanganSchema),
    defaultValues: {
      userId: userId || '',
      komponenId: '',
      nilaiOverride: 0,
      berlakuDari: '',
      berlakuSampai: '',
    },
  });

  React.useEffect(() => {
    if (data && open) {
      // Setting edit values
      form.reset({
        userId: userId || data.user_id || '',
        komponenId: data.komponen_id || '',
        nilaiOverride: data.nilai_override ? Number(data.nilai_override) : 0,
        berlakuDari: data.berlaku_dari ? new Date(data.berlaku_dari).toISOString().split('T')[0] : '',
        berlakuSampai: data.berlaku_sampai ? new Date(data.berlaku_sampai).toISOString().split('T')[0] : '',
      });
    } else if (!open) {
      form.reset({
        userId: userId || '',
        komponenId: '',
        nilaiOverride: 0,
        berlakuDari: '',
        berlakuSampai: '',
      });
    }
  }, [data, open, form, userId]);

  const onSubmit = (formData) => {
    // If nilaiOverride is 0, backend might just use components default if we don't send it or send it as 0.
    // The schema allows it. We should pass it correctly.
    const payload = { ...formData };
    if (!payload.berlakuSampai) {
      payload.berlakuSampai = null;
    }

    if (isEdit) {
      const id = data.tunjangan_id || data.id;
      updateTunjangan({ id, data: payload }, {
        onSuccess: () => onOpenChange(false)
      });
    } else {
      createTunjangan(payload, {
        onSuccess: () => onOpenChange(false)
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Update Tunjangan Karyawan' : 'Tambah Tunjangan Baru'}</DialogTitle>
          <DialogDescription>
            Tentukan komponen tunjangan dan masa berlaku untuk karyawan ini.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="komponenId">Komponen Tunjangan</Label>
            <Select 
              value={form.watch('komponenId')} 
              onValueChange={(val) => form.setValue('komponenId', val)}
              disabled={isEdit}
            >
              <SelectTrigger id="komponenId" className={isEdit ? 'bg-slate-50 opacity-70' : ''}>
                <SelectValue placeholder="Pilih Tunjangan" />
              </SelectTrigger>
              <SelectContent>
                {tunjanganOptions.map((opt) => (
                  <SelectItem key={opt.komponen_id || opt.id} value={opt.komponen_id || opt.id}>
                    {opt.nama} (Def: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(opt.nilai)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.komponenId && (
              <span className="text-sm text-red-500">{form.formState.errors.komponenId.message}</span>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nilaiOverride">Nilai Khusus / Override (Rp) - Opsional</Label>
            <Input 
              id="nilaiOverride"
              type="number"
              placeholder="0 (Gunakan nilai default)"
              {...form.register('nilaiOverride')}
            />
            {form.formState.errors.nilaiOverride && (
              <span className="text-sm text-red-500">{form.formState.errors.nilaiOverride.message}</span>
            )}
            <p className="text-[10px] text-muted-foreground">Isi 0 jika ingin menggunakan nominal default dari komponen master.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="berlakuDari">Mulai Berlaku</Label>
              <Input 
                id="berlakuDari"
                type="date"
                {...form.register('berlakuDari')}
              />
              {form.formState.errors.berlakuDari && (
                <span className="text-sm text-red-500">{form.formState.errors.berlakuDari.message}</span>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="berlakuSampai">Sampai (Opsional)</Label>
              <Input 
                id="berlakuSampai"
                type="date"
                {...form.register('berlakuSampai')}
              />
            </div>
          </div>

          <div className="flex justify-end pt-6 space-x-2">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={isPending}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isPending ? "Menyimpan..." : "Simpan Tunjangan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
