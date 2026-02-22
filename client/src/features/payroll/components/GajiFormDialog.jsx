import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { gajiSchema } from '../validations/payrollValidation';
import { useUpdateGajiKaryawan } from '../hooks/usePayrollMutations';

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

export const GajiFormDialog = ({ open, onOpenChange, data, userId, userName }) => {
  const { mutate: updateGaji, isPending } = useUpdateGajiKaryawan();

  const form = useForm({
    resolver: zodResolver(gajiSchema),
    defaultValues: {
      gajiPokok: 0,
      tarifLembur: 0,
      tipeGaji: 'bulanan',
      alasan: '',
    },
  });

  React.useEffect(() => {
    if (data && open) {
      form.reset({
        gajiPokok: data.gaji_pokok || 0,
        tarifLembur: data.tarif_lembur || 0,
        tipeGaji: data.tipe_gaji || 'bulanan',
        alasan: '', // Reason is required for history log
      });
    } else if (!open) {
      form.reset();
    }
  }, [data, open, form]);

  const onSubmit = (formData) => {
    if (!userId) return;
    updateGaji({ userId, data: formData }, {
      onSuccess: () => onOpenChange(false)
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Gaji Karyawan</DialogTitle>
          <DialogDescription>
            Ubah gaji pokok atau tarif lembur untuk <strong>{userName || 'Karyawan'}</strong>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="gajiPokok">Gaji Pokok (Rp)</Label>
            <Input 
              id="gajiPokok"
              type="number"
              {...form.register('gajiPokok')}
            />
            {form.formState.errors.gajiPokok && (
              <span className="text-sm text-red-500">{form.formState.errors.gajiPokok.message}</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipeGaji">Tipe Gaji</Label>
              <Select 
                value={form.watch('tipeGaji')} 
                onValueChange={(val) => form.setValue('tipeGaji', val)}
              >
                <SelectTrigger id="tipeGaji">
                  <SelectValue placeholder="Pilih Tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bulanan">Bulanan</SelectItem>
                  <SelectItem value="harian">Harian</SelectItem>
                  <SelectItem value="mingguan">Mingguan</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.tipeGaji && (
                <span className="text-sm text-red-500">{form.formState.errors.tipeGaji.message}</span>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tarifLembur">Tarif Lembur / Jam (Rp)</Label>
              <Input 
                id="tarifLembur"
                type="number"
                {...form.register('tarifLembur')}
              />
              {form.formState.errors.tarifLembur && (
                <span className="text-sm text-red-500">{form.formState.errors.tarifLembur.message}</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="alasan">Alasan Perubahan <span className="text-red-500">*</span></Label>
            <Textarea 
              id="alasan"
              placeholder="Contoh: Penyesuaian gaji tahunan 2024"
              className="resize-none"
              rows={2}
              {...form.register('alasan')}
            />
            {form.formState.errors.alasan && (
              <span className="text-sm text-red-500">{form.formState.errors.alasan.message}</span>
            )}
            <p className="text-[10px] text-muted-foreground">Alasan ini akan dicatat dalam riwayat perubahan gaji.</p>
          </div>

          <div className="flex justify-end pt-6 space-x-2">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={isPending}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isPending ? "Menyimpan..." : "Update Gaji"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
