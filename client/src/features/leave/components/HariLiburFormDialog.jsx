import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { hariLiburSchema } from '../validations/leaveValidation';
import { useCreateHariLibur } from '../hooks/useLeaveMutations';
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
import { Checkbox } from '../../../common/components/ui/checkbox';

const HariLiburFormDialog = ({ open, onOpenChange }) => {
  const { mutate: createHariLibur, isPending } = useCreateHariLibur();
  
  const form = useForm({
    resolver: zodResolver(hariLiburSchema),
    defaultValues: {
      tanggal: '',
      nama: '',
      isRecurring: false,
    },
  });

  const onSubmit = (data) => {
    createHariLibur(data, {
      onSuccess: () => {
        form.reset();
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      onOpenChange(val);
      if (!val) form.reset();
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tambah Hari Libur</DialogTitle>
          <DialogDescription>
            Masukkan detail hari libur baru.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="tanggal">Tanggal Libur</Label>
            <Input 
              id="tanggal"
              type="date"
              {...form.register('tanggal')}
            />
            {form.formState.errors.tanggal && (
              <span className="text-sm text-red-500">{form.formState.errors.tanggal.message}</span>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="nama">Nama Libur</Label>
            <Input 
              id="nama"
              placeholder="Contoh: Tahun Baru Masehi"
              {...form.register('nama')}
            />
            {form.formState.errors.nama && (
              <span className="text-sm text-red-500">{form.formState.errors.nama.message}</span>
            )}
          </div>
          
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox 
              id="isRecurring"
              checked={form.watch('isRecurring')}
              onCheckedChange={(checked) => form.setValue('isRecurring', !!checked)}
            />
            <Label htmlFor="isRecurring" className="text-sm font-normal">
              Berulang setiap tahun (Recurring)
            </Label>
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

export default HariLiburFormDialog;
