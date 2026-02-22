import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { izinSchema, cutiSchema } from '../validations/leaveValidation';
import { useCreateIzin, useCreateCuti } from '../hooks/useLeaveMutations';
import { useCabang } from '../../cabang/context/CabangContext';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../common/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../common/components/ui/tabs';
import { Button } from '../../../common/components/ui/button';
import { Input } from '../../../common/components/ui/input';
import { Label } from '../../../common/components/ui/label';
import { Textarea } from '../../../common/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../common/components/ui/select';

const IzinCutiForm = ({ onSuccess }) => {
  const [activeTab, setActiveTab] = useState('izin');
  const { selectedCabang } = useCabang();
  const cabangId = selectedCabang?.id || '';

  const { mutate: createIzin, isPending: isIzinPending } = useCreateIzin();
  const { mutate: createCuti, isPending: isCutiPending } = useCreateCuti();

  const isPending = isIzinPending || isCutiPending;

  const izinForm = useForm({
    resolver: zodResolver(izinSchema),
    mode: 'onChange',
    defaultValues: {
      tipeIzin: 'izin_sakit',
      cabangId: cabangId,
      tanggalMulai: '',
      tanggalSelesai: '',
      alasan: '',
    }
  });

  const cutiForm = useForm({
    resolver: zodResolver(cutiSchema),
    mode: 'onChange',
    defaultValues: {
      tipeIzin: 'cuti_tahunan',
      cabangId: cabangId,
      tanggalMulai: '',
      tanggalSelesai: '',
      alasan: '',
    }
  });

  console.log(cutiForm);

  // Update cabangId on forms when context changes
  React.useEffect(() => {
    if (cabangId) {
      if(cabangId !== 'global') {
        izinForm.setValue('cabangId', cabangId);
        cutiForm.setValue('cabangId', cabangId);
      }
    }
  }, [cabangId, izinForm, cutiForm]);

  const onSubmitIzin = (data) => {
    createIzin(data, {
      onSuccess: () => {
        izinForm.reset({
          tipeIzin: 'izin_sakit',
          cabangId: cabangId !== 'global' ? cabangId : '',
          tanggalMulai: '',
          tanggalSelesai: '',
          alasan: '',
        });
        if (onSuccess) onSuccess();
      }
    });
  };

  const onSubmitCuti = (data) => {
    console.log(data);
    createCuti(data, {
      onSuccess: () => {
        cutiForm.reset({
          tipeIzin: 'cuti_tahunan',
          cabangId: cabangId !== 'global' ? cabangId : '',
          tanggalMulai: '',
          tanggalSelesai: '',
          alasan: '',
        });
        if (onSuccess) onSuccess();
      }
    });
  };

  const formDisabled = isPending || !cabangId || cabangId === 'global';
  const izinSubmitDisabled = formDisabled || !izinForm.formState.isValid;
  const cutiSubmitDisabled = formDisabled || !cutiForm.formState.isValid;

  return (
    <Card className="border-none shadow-md bg-white">
      <CardHeader className="border-b bg-white pb-4">
        <CardTitle>Pengajuan Baru</CardTitle>
        <CardDescription>Pilih jenis pengajuan (Izin / Cuti) dan lengkapi form berikut.</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="izin">Izin</TabsTrigger>
            <TabsTrigger value="cuti">Cuti</TabsTrigger>
          </TabsList>
          
          <TabsContent value="izin">
            <form onSubmit={izinForm.handleSubmit(onSubmitIzin)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="izin-tipe">Tipe Izin</Label>
                <Select 
                  value={izinForm.watch('tipeIzin')} 
                  onValueChange={(val) => izinForm.setValue('tipeIzin', val, { shouldValidate: true })}
                >
                  <SelectTrigger id="izin-tipe">
                    <SelectValue placeholder="Pilih Tipe Izin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="izin_sakit">Izin Sakit</SelectItem>
                    <SelectItem value="izin_keperluan">Izin Keperluan</SelectItem>
                  </SelectContent>
                </Select>
                {izinForm.formState.errors.tipeIzin && (
                  <p className="text-sm text-red-500">{izinForm.formState.errors.tipeIzin.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="izin-mulai">Tanggal Mulai</Label>
                  <Input id="izin-mulai" type="date" {...izinForm.register('tanggalMulai')} />
                  {izinForm.formState.errors.tanggalMulai && (
                    <p className="text-sm text-red-500">{izinForm.formState.errors.tanggalMulai.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="izin-selesai">Tanggal Selesai</Label>
                  <Input id="izin-selesai" type="date" {...izinForm.register('tanggalSelesai')} />
                  {izinForm.formState.errors.tanggalSelesai && (
                    <p className="text-sm text-red-500">{izinForm.formState.errors.tanggalSelesai.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="izin-alasan">Alasan / Keterangan</Label>
                <Controller
                  name="alasan"
                  control={izinForm.control}
                  render={({ field }) => (
                    <Textarea 
                      id="izin-alasan" 
                      placeholder="Jelaskan alasan izin Anda..."
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
                  )}
                />
                {izinForm.formState.errors.alasan && (
                  <p className="text-sm text-red-500">{izinForm.formState.errors.alasan.message}</p>
                )}
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" disabled={izinSubmitDisabled} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {isIzinPending ? "Memproses..." : "Ajukan Izin"}
                </Button>
              </div>
              {formDisabled && !isPending && (
                <p className="text-xs text-red-500 text-right mt-1">Silakan ganti cabang terlebih dahulu</p>
              )}
            </form>
          </TabsContent>

          <TabsContent value="cuti">
            <form onSubmit={cutiForm.handleSubmit(onSubmitCuti)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cuti-tipe">Tipe Cuti</Label>
                <Select 
                  value={cutiForm.watch('tipeIzin')} 
                  onValueChange={(val) => cutiForm.setValue('tipeIzin', val, { shouldValidate: true })}
                >
                  <SelectTrigger id="cuti-tipe">
                    <SelectValue placeholder="Pilih Tipe Cuti" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cuti_tahunan">Cuti Tahunan</SelectItem>
                    <SelectItem value="cuti_melahirkan">Cuti Melahirkan</SelectItem>
                    <SelectItem value="cuti_bersama">Cuti Bersama</SelectItem>
                    <SelectItem value="cuti_khusus">Cuti Khusus</SelectItem>
                  </SelectContent>
                </Select>
                {cutiForm.formState.errors.tipeIzin && (
                  <p className="text-sm text-red-500">{cutiForm.formState.errors.tipeIzin.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cuti-mulai">Tanggal Mulai</Label>
                  <Input id="cuti-mulai" type="date" {...cutiForm.register('tanggalMulai')} />
                  {cutiForm.formState.errors.tanggalMulai && (
                    <p className="text-sm text-red-500">{cutiForm.formState.errors.tanggalMulai.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cuti-selesai">Tanggal Selesai</Label>
                  <Input id="cuti-selesai" type="date" {...cutiForm.register('tanggalSelesai')} />
                  {cutiForm.formState.errors.tanggalSelesai && (
                    <p className="text-sm text-red-500">{cutiForm.formState.errors.tanggalSelesai.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cuti-alasan">Alasan / Keterangan</Label>
                <Controller
                  name="alasan"
                  control={cutiForm.control}
                  render={({ field }) => (
                    <Textarea 
                      id="cuti-alasan" 
                      placeholder="Jelaskan alasan cuti Anda..."
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
                  )}
                />
                {cutiForm.formState.errors.alasan && (
                  <p className="text-sm text-red-500">{cutiForm.formState.errors.alasan.message}</p>
                )}
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" disabled={cutiSubmitDisabled} className="bg-amber-600 hover:bg-amber-700 text-white">
                  {isCutiPending ? "Memproses..." : "Ajukan Cuti"}
                </Button>
              </div>
              {formDisabled && !isPending && (
                <p className="text-xs text-red-500 text-right mt-1">Silakan ganti cabang terlebih dahulu</p>
              )}
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default IzinCutiForm;
