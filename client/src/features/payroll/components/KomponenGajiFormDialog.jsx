import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { komponenSchema } from '../validations/payrollValidation';
import { useCreateKomponen, useUpdateKomponen } from '../hooks/usePayrollMutations';

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
import { Textarea } from '../../../common/components/ui/textarea';
import { Checkbox } from '../../../common/components/ui/checkbox';

const KomponenGajiFormDialog = ({ open, onOpenChange, data }) => {
  const isEdit = !!data;
  
  const { mutate: createKomponen, isPending: isCreating } = useCreateKomponen();
  const { mutate: updateKomponen, isPending: isUpdating } = useUpdateKomponen();
  const isPending = isCreating || isUpdating;
  
  const form = useForm({
    resolver: zodResolver(komponenSchema),
    defaultValues: {
      nama: '',
      tipe: 'tunjangan',
      nilai: 0,
      isProrate: false,
      keterangan: '',
    },
  });

  React.useEffect(() => {
    if (data && open) {
      form.reset({
        nama: data.nama || '',
        tipe: data.tipe || 'tunjangan',
        nilai: data.nilai || 0,
        isProrate: data.is_prorate || data.isProrate || false,
        keterangan: data.keterangan || '',
      });
    } else if (!open) {
      form.reset();
    }
  }, [data, open, form]);

  const onSubmit = (formData) => {
    if (isEdit) {
      const id = data.komponen_id || data.id;
      updateKomponen({ id, data: formData }, {
        onSuccess: () => onOpenChange(false)
      });
    } else {
      createKomponen(formData, {
        onSuccess: () => onOpenChange(false)
      });
    }
  };

  const tipe = form.watch('tipe');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Komponen Gaji' : 'Tambah Komponen Gaji'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Ubah data komponen gaji.' : 'Buat komponen gaji (Tunjangan / Potongan) baru.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="nama">Nama Komponen</Label>
            <Input 
              id="nama"
              placeholder="Contoh: Tunjangan Makan"
              {...form.register('nama')}
            />
            {form.formState.errors.nama && (
              <span className="text-sm text-red-500">{form.formState.errors.nama.message}</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipe">Tipe Komponen</Label>
              <Select 
                value={form.watch('tipe')} 
                onValueChange={(val) => form.setValue('tipe', val)}
                disabled={isEdit} // Biasanya tipe susah diubah setelah komponen dibuat
              >
                <SelectTrigger id="tipe" className={isEdit ? 'bg-slate-50 text-slate-500' : ''}>
                  <SelectValue placeholder="Pilih Tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tunjangan">Tunjangan</SelectItem>
                  <SelectItem value="potongan">Potongan</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.tipe && (
                <span className="text-sm text-red-500">{form.formState.errors.tipe.message}</span>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nilai">Nilai (Rp)</Label>
              <Input 
                id="nilai"
                type="number"
                {...form.register('nilai')}
              />
              {form.formState.errors.nilai && (
                <span className="text-sm text-red-500">{form.formState.errors.nilai.message}</span>
              )}
            </div>
          </div>

          {tipe === 'tunjangan' && (
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="isProrate"
                checked={form.watch('isProrate')}
                onCheckedChange={(checked) => form.setValue('isProrate', !!checked)}
              />
              <Label htmlFor="isProrate" className="text-sm font-normal">
                Hitung prorate berdasarkan kehadiran
              </Label>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="keterangan">Keterangan (Opsional)</Label>
            <Textarea 
              id="keterangan"
              placeholder="Tambahkan keterangan..."
              className="resize-none"
              rows={2}
              {...form.register('keterangan')}
            />
            {form.formState.errors.keterangan && (
              <span className="text-sm text-red-500">{form.formState.errors.keterangan.message}</span>
            )}
          </div>

          <div className="flex justify-end pt-6 space-x-2">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={isPending}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default KomponenGajiFormDialog;
