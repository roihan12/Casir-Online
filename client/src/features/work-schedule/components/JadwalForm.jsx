import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../common/components/ui/dialog";
import { Button } from "../../../common/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../../../common/components/ui/form";
import { Input } from "../../../common/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../common/components/ui/select";

import { useCreateJadwal, useUpdateJadwal, useDeleteJadwal } from "../../../hooks/useJadwal";
import { useMasterShiftList } from "../../../hooks/useMasterShift";
import { useUsers } from "../../users/hooks/useUsers";
import { X } from "lucide-react";

// Validation Schema
const jadwalSchema = z.object({
  userId: z.string().min(1, "Karyawan harus dipilih"),
  tanggal: z.string().min(1, "Tanggal harus diisi"),
  tipeJadwal: z.enum(["shift", "reguler", "libur", "wfh", "cuti", "izin"]),
  shiftId: z.string().optional(),
  jamMasukOverride: z.string().optional(),
  jamKeluarOverride: z.string().optional(),
  keterangan: z.string().optional(),
}).refine((data) => {
  if (data.tipeJadwal === "shift" && !data.shiftId) {
    return false;
  }
  return true;
}, {
  message: "Shift harus dipilih untuk tipe jadwal Shift",
  path: ["shiftId"],
});

const JadwalForm = ({ open, onOpenChange, selectedSlot, onClose, cabangId }) => {
  const isEdit = !!selectedSlot?.scheduleId;
  
  const form = useForm({
    resolver: zodResolver(jadwalSchema),
    defaultValues: {
      userId: "",
      tanggal: format(new Date(), "yyyy-MM-dd"),
      tipeJadwal: "shift",
      shiftId: "", 
      jamMasukOverride: "",
      jamKeluarOverride: "",
      keterangan: "",
    },
  });

  const tipeJadwalOptions = [
    { value: "shift", label: "Shift Kerja" },
    { value: "reguler", label: "Jam Reguler" },
    { value: "libur", label: "Libur" },
    { value: "wfh", label: "Work From Home" },
    { value: "cuti", label: "Cuti" },
    { value: "izin", label: "Izin" },
  ];

  // Watch type for conditional conditional rendering
  const tipeJadwal = form.watch("tipeJadwal");

  // Fetch Data
  const { data: shiftData } = useMasterShiftList({ cabangId });
  
  // Fetch users using the hook
  const { getUsersQuery } = useUsers({ cabangId, limit: 100 });
  const { data: userData } = getUsersQuery;

  const createMutation = useCreateJadwal();
  const updateMutation = useUpdateJadwal();
  const deleteMutation = useDeleteJadwal();

  useEffect(() => {
    if (open) {
      if (selectedSlot) {
        form.reset({
          userId: selectedSlot.userId,
          tanggal: format(selectedSlot.date, "yyyy-MM-dd"),
          tipeJadwal: selectedSlot.schedule?.tipe_jadwal || "shift",
          shiftId: selectedSlot.schedule?.master_shift_id || "",
          jamMasukOverride: selectedSlot.schedule?.jamMasuk || "",
          jamKeluarOverride: selectedSlot.schedule?.jamKeluar || "",
          keterangan: selectedSlot.schedule?.keterangan || "",
        });
      } else {
        form.reset({
            userId: "",
            tanggal: format(new Date(), "yyyy-MM-dd"),
            tipeJadwal: "shift",
            shiftId: "", 
            jamMasukOverride: "",
            jamKeluarOverride: "",
            keterangan: "",
        });
      }
    }
  }, [open, selectedSlot, form]);

  const onSubmit = (data) => {
    const payload = {
        ...data,
        cabangId,
    };

    if (isEdit) {
      updateMutation.mutate({ id: selectedSlot.scheduleId, data: payload }, {
        onSuccess: () => {
          onOpenChange(false);
          onClose();
        }
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          onOpenChange(false);
          onClose();
        }
      });
    }
  };

  const handleDelete = () => {
    if (confirm("Apakah Anda yakin ingin menghapus jadwal ini?")) {
      deleteMutation.mutate(selectedSlot.scheduleId, {
        onSuccess: () => {
          onOpenChange(false);
          onClose();
        }
      });
    }
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(val) => {
        onOpenChange(val);
        if (!val) onClose();
      }}
    >
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-xl">
            {selectedSlot?.schedule ? "Edit Jadwal" : "Buat Jadwal"}
          </DialogTitle>
          <DialogDescription>
            {selectedSlot?.schedule ? "Ubah detail jadwal kerja karyawan" : "Tentukan jadwal kerja untuk karyawan ini"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            {/* User Selection (Read only if pre-selected via grid click) */}
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Karyawan</FormLabel>
                  {selectedSlot?.userId ? (
                    <div className="font-medium text-gray-900">
                  {selectedSlot.user?.namaLengkap || selectedSlot.user?.nama_lengkap || "Unknown User"}
                </div>
                  ) : (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Karyawan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {userData?.data?.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.namaLengkap}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tanggal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanggal</FormLabel>
                  <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                        disabled={!!selectedSlot?.date} 
                        className="bg-gray-50 font-medium"
                      />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tipeJadwal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipe Jadwal</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Tipe" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tipeJadwalOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {tipeJadwal === "shift" && (
                <FormField
                control={form.control}
                name="shiftId"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Pilih Shift</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Pilih Shift" />
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
            )}

            {/* Optional: Add custom time overrides if needed for 'reguler' or even 'shift' adjustments */}
            {tipeJadwal === "reguler" && (
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="jamMasukOverride"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Jam Masuk</FormLabel>
                                <FormControl>
                                    <Input type="time" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="jamKeluarOverride"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Jam Keluar</FormLabel>
                                <FormControl>
                                    <Input type="time" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            )}

            <FormField
              control={form.control}
              name="keterangan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keterangan (Opsional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Contoh: Tukar shift, Lembur, dll" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              {isEdit && (
                <Button 
                    type="button" 
                    variant="destructive" 
                    onClick={handleDelete}
                    disabled={deleteMutation.isLoading}
                >
                  {deleteMutation.isLoading ? "Menghapus..." : "Hapus Jadwal"}
                </Button>
              )}
              <Button type="submit" disabled={createMutation.isLoading || updateMutation.isLoading}>
                {createMutation.isLoading || updateMutation.isLoading ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default JadwalForm;
