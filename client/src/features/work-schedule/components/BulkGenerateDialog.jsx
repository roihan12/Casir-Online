import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Calendar as CalendarIcon, Users, CheckCircle2, ChevronRight, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../common/components/ui/dialog";
import { Button } from "../../../common/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "../../../common/components/ui/form";
import { Input } from "../../../common/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../common/components/ui/select";
import { Checkbox } from "../../../common/components/ui/checkbox";
import { Badge } from "../../../common/components/ui/badge";

import { useMasterShiftList } from "../hooks/useMasterShift";
import { useUsers } from "../../users/hooks/useUsers";
import { useBulkGenerateJadwal } from "../hooks/useBulkGenerate";

const bulkSchema = z.object({
  userIds: z.array(z.string()).min(1, "Pilih minimal satu karyawan"),
  shiftId: z.string().min(1, "Pilih shift kerja"),
  tanggalMulai: z.string().min(1, "Tanggal mulai harus diisi"),
  tanggalSelesai: z.string().min(1, "Tanggal selesai harus diisi"),
  hariKerja: z.array(z.string()).min(1, "Pilih minimal satu hari kerja"),
  skipExisting: z.boolean().default(true),
});

const HARI_LIST = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

const BulkGenerateDialog = ({ open, onOpenChange, cabangId, defaultStartDate, defaultEndDate }) => {
  const [step, setStep] = useState(1);
  
  const form = useForm({
    resolver: zodResolver(bulkSchema),
    defaultValues: {
      userIds: [],
      shiftId: "",
      tanggalMulai: defaultStartDate || format(new Date(), "yyyy-MM-dd"),
      tanggalSelesai: defaultEndDate || format(new Date(), "yyyy-MM-dd"),
      hariKerja: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"],
      skipExisting: true,
    },
  });

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setStep(1);
      form.reset({
        userIds: [],
        shiftId: "",
        tanggalMulai: defaultStartDate || format(new Date(), "yyyy-MM-dd"),
        tanggalSelesai: defaultEndDate || format(new Date(), "yyyy-MM-dd"),
        hariKerja: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"],
        skipExisting: true,
      });
    }
  }, [open, defaultStartDate, defaultEndDate]);

  const generateMutation = useBulkGenerateJadwal();
  const { data: shiftData } = useMasterShiftList({ cabangId: cabangId === "global" ? "" : cabangId });
  const { getUsersQuery } = useUsers({ cabangId: cabangId === "global" ? "" : cabangId, limit: 200 });
  const users = getUsersQuery?.data?.data ?? [];

  const onSubmit = (data) => {
    generateMutation.mutate({ ...data, cabangId }, {
      onSuccess: () => {
        onOpenChange(false);
        setStep(1);
        form.reset();
      },
    });
  };

  const selectedUserIds = form.watch("userIds");
  const selectedUsers = users.filter(u => selectedUserIds.includes(u.id));

  const content = () => {
    if (step === 1) {
      return (
        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="h-6 w-6 p-0 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 border-blue-200">1</Badge>
            <h3 className="font-semibold text-gray-700">Pilih Karyawan</h3>
          </div>
          <div className="border rounded-md max-h-[300px] overflow-y-auto divide-y bg-gray-50/30">
            {users.map((user) => (
              <label
                key={user.id}
                className="flex items-center gap-3 p-3 hover:bg-white cursor-pointer transition-colors"
              >
                <Checkbox
                  checked={selectedUserIds.includes(user.id)}
                  onCheckedChange={(checked) => {
                    const current = form.getValues("userIds");
                    form.setValue("userIds", checked 
                      ? [...current, user.id] 
                      : current.filter(id => id !== user.id)
                    );
                  }}
                />
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium truncate">{user.namaLengkap || user.email}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                </div>
              </label>
            ))}
          </div>
          {form.formState.errors.userIds && (
            <p className="text-xs text-red-500 font-medium">{form.formState.errors.userIds.message}</p>
          )}
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="space-y-6 py-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="h-6 w-6 p-0 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 border-blue-200">2</Badge>
            <h3 className="font-semibold text-gray-700">Pengaturan Waktu & Shift</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="tanggalMulai"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mulai Tanggal</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tanggalSelesai"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sampai Tanggal</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="shiftId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Shift Kerja</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih shift" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {shiftData?.data?.map((shift) => (
                      <SelectItem key={shift.id} value={shift.id}>
                        {shift.namaShift} ({shift.jamMasuk} - {shift.jamKeluar})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="hariKerja"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hari Kerja</FormLabel>
                <div className="flex flex-wrap gap-2 pt-1">
                  {HARI_LIST.map((hari) => (
                    <Badge
                      key={hari}
                      variant={field.value.includes(hari) ? "default" : "outline"}
                      className="cursor-pointer transition-all hover:scale-105"
                      onClick={() => {
                        const current = field.value;
                        field.onChange(current.includes(hari)
                          ? current.filter(h => h !== hari)
                          : [...current, hari]
                        );
                      }}
                    >
                      {hari}
                    </Badge>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="skipExisting"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-orange-50/30 border-orange-100">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Lewati jadwal yang sudah ada</FormLabel>
                  <FormDescription className="text-[10px]">
                    Jika dicentang, sistem tidak akan menimpa jadwal yang sudah dibuat sebelumnya.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>
      );
    }

    if (step === 3) {
      return (
        <div className="space-y-6 py-4">
          <div className="flex flex-col items-center text-center space-y-2 mb-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-2">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold">Konfirmasi Generate</h3>
            <p className="text-sm text-muted-foreground">Periksa kembali data sebelum memulai proses.</p>
          </div>

          <div className="space-y-3 bg-gray-50 rounded-xl p-5 border">
            <div className="flex justify-between text-sm py-1 border-b border-gray-100">
              <span className="text-muted-foreground flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Total Karyawan</span>
              <span className="font-bold">{selectedUserIds.length} Orang</span>
            </div>
            <div className="flex justify-between text-sm py-1 border-b border-gray-100">
              <span className="text-muted-foreground flex items-center gap-1.5"><CalendarIcon className="h-3.5 w-3.5" /> Periode</span>
              <span className="font-bold">
                {format(new Date(form.watch("tanggalMulai")), "d MMM", { locale: localeId })} - 
                {format(new Date(form.watch("tanggalSelesai")), "d MMM yyyy", { locale: localeId })}
              </span>
            </div>
            <div className="flex justify-between text-sm py-1 border-b border-gray-100">
              <span className="text-muted-foreground flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5" /> Hari Kerja</span>
              <span className="font-bold">{form.watch("hariKerja").length} Hari/Minggu</span>
            </div>
          </div>

          <div className="max-h-[120px] overflow-y-auto pr-2">
             <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-2">Daftar Karyawan Terpilih:</p>
             <div className="flex flex-wrap gap-1.5">
               {selectedUsers.map(u => (
                 <Badge key={u.id} variant="secondary" className="bg-white border text-[10px] py-0 px-2">
                   {u.namaLengkap || u.email}
                 </Badge>
               ))}
             </div>
          </div>
        </div>
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
             Bulk Generate Jadwal
          </DialogTitle>
          <DialogDescription>
             Buat jadwal kerja untuk banyak karyawan sekaligus.
          </DialogDescription>
        </DialogHeader>

        <Form onSubmit={form.handleSubmit(onSubmit)}>
          {content()}

          <DialogFooter className="mt-6 border-t pt-4">
            {step > 1 && (
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setStep(s => s - 1)}
                disabled={generateMutation.isLoading}
              >
                Kembali
              </Button>
            )}
            {step < 3 ? (
              <Button 
                type="button" 
                onClick={() => setStep(s => s + 1)}
                disabled={step === 1 && selectedUserIds.length === 0}
              >
                Lanjut <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700" 
                disabled={generateMutation.isLoading}
              >
                {generateMutation.isLoading ? "Memproses..." : "Mulai Generate"}
              </Button>
            )}
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default BulkGenerateDialog;
