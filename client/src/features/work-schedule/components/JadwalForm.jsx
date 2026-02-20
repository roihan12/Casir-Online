import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";

import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "../../../common/components/ui/dialog";
import { Button } from "../../../common/components/ui/button";
import { Input } from "../../../common/components/ui/input";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "../../../common/components/ui/select";

import { useCreateJadwal, useUpdateJadwal, useDeleteJadwal } from "../hooks/useJadwal";
import { useMasterShiftList } from "../hooks/useMasterShift";
import { useUsers } from "../../users/hooks/useUsers";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const jadwalSchema = z.object({
  userId: z.string().min(1, "Karyawan harus dipilih"),
  tanggal: z.string().min(1, "Tanggal harus diisi"),
  tipeJadwal: z.enum(["shift", "reguler", "libur", "wfh", "cuti", "izin"]),
  shiftId: z.string().optional(),
  jamMasukOverride: z.string().optional(),
  jamKeluarOverride: z.string().optional(),
  keterangan: z.string().optional(),
}).refine((data) => {
  if (data.tipeJadwal === "shift" && !data.shiftId) return false;
  return true;
}, {
  message: "Shift harus dipilih untuk tipe jadwal Shift",
  path: ["shiftId"],
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TIPE_OPTIONS = [
  { value: "shift",   label: "Shift Kerja" },
  { value: "reguler", label: "Jam Reguler" },
  { value: "libur",   label: "Libur" },
  { value: "wfh",     label: "Work From Home" },
  { value: "cuti",    label: "Cuti" },
  { value: "izin",    label: "Izin" },
];

// ---------------------------------------------------------------------------
// Local UI helper
// ---------------------------------------------------------------------------

const Field = ({ label, error, children }) => (
  <div className="space-y-1.5">
    {label && (
      <label className="text-sm font-medium text-gray-700">{label}</label>
    )}
    {children}
    {error && (
      <p className="text-sm font-medium text-red-500">{error}</p>
    )}
  </div>
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

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

  const errors   = form.formState.errors;
  const tipeJadwal = form.watch("tipeJadwal");

  // Fetch data
  const normalizedCabangId = cabangId === "global" ? "" : cabangId;
  const { data: shiftData }   = useMasterShiftList({ cabangId: normalizedCabangId });
  const { getUsersQuery }     = useUsers({ cabangId: normalizedCabangId, limit: 100 });
  const usersData             = getUsersQuery?.data?.data ?? [];

  const createMutation = useCreateJadwal();
  const updateMutation = useUpdateJadwal();
  const deleteMutation = useDeleteJadwal();

  // Populate form when dialog opens
  useEffect(() => {
    if (!open) return;
    if (selectedSlot) {
      form.reset({
        userId:           selectedSlot.userId,
        tanggal:          format(selectedSlot.date, "yyyy-MM-dd"),
        tipeJadwal:       selectedSlot.schedule?.tipe_jadwal || "shift",
        shiftId:          selectedSlot.schedule?.master_shift_id || "",
        jamMasukOverride: selectedSlot.schedule?.jamMasuk || "",
        jamKeluarOverride:selectedSlot.schedule?.jamKeluar || "",
        keterangan:       selectedSlot.schedule?.keterangan || "",
      });
    } else {
      form.reset({
        userId: "", tanggal: format(new Date(), "yyyy-MM-dd"),
        tipeJadwal: "shift", shiftId: "",
        jamMasukOverride: "", jamKeluarOverride: "", keterangan: "",
      });
    }
  }, [open, selectedSlot]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = (data) => {
    const payload = { ...data, cabangId };
    const opts = {
      onSuccess: () => { onOpenChange(false); onClose(); },
    };
    if (isEdit) {
      updateMutation.mutate({ id: selectedSlot.scheduleId, data: payload }, opts);
    } else {
      createMutation.mutate(payload, opts);
    }
  };

  const handleDelete = () => {
    if (!confirm("Apakah Anda yakin ingin menghapus jadwal ini?")) return;
    deleteMutation.mutate(selectedSlot.scheduleId, {
      onSuccess: () => { onOpenChange(false); onClose(); },
    });
  };

  const isSaving   = createMutation.isPending ?? createMutation.isLoading ?? false;
  const isUpdating = updateMutation.isPending ?? updateMutation.isLoading ?? false;
  const isDeleting = deleteMutation.isPending ?? deleteMutation.isLoading ?? false;

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => { onOpenChange(val); if (!val) onClose(); }}
    >
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-xl">
            {selectedSlot?.schedule ? "Edit Jadwal" : "Buat Jadwal"}
          </DialogTitle>
          <DialogDescription>
            {selectedSlot?.schedule
              ? "Ubah detail jadwal kerja karyawan"
              : "Tentukan jadwal kerja untuk karyawan ini"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Karyawan */}
          <Field label="Karyawan" error={errors.userId?.message}>
            {selectedSlot?.userId ? (
              <p className="font-medium text-gray-900">
                {selectedSlot.user?.namaLengkap ||
                  selectedSlot.user?.nama_lengkap ||
                  "Unknown User"}
              </p>
            ) : (
              <Select
                value={form.watch("userId")}
                onValueChange={(val) =>
                  form.setValue("userId", val, { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Karyawan" />
                </SelectTrigger>
                <SelectContent>
                  {usersData.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.namaLengkap}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </Field>

          {/* Tanggal */}
          <Field label="Tanggal" error={errors.tanggal?.message}>
            <Input
              type="date"
              {...form.register("tanggal")}
              disabled={!!selectedSlot?.date}
              className="bg-gray-50 font-medium"
            />
          </Field>

          {/* Tipe Jadwal */}
          <Field label="Tipe Jadwal" error={errors.tipeJadwal?.message}>
            <Select
              value={tipeJadwal}
              onValueChange={(val) =>
                form.setValue("tipeJadwal", val, { shouldValidate: true })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Tipe" />
              </SelectTrigger>
              <SelectContent>
                {TIPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Pilih Shift (conditional) */}
          {tipeJadwal === "shift" && (
            <Field label="Pilih Shift" error={errors.shiftId?.message}>
              <Select
                value={form.watch("shiftId")}
                onValueChange={(val) =>
                  form.setValue("shiftId", val, { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Shift" />
                </SelectTrigger>
                <SelectContent>
                  {shiftData?.data?.map((shift) => (
                    <SelectItem key={shift.id} value={shift.id}>
                      {shift.namaShift} ({shift.jamMasuk} - {shift.jamKeluar})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}

          {/* Jam Override (reguler) */}
          {tipeJadwal === "reguler" && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Jam Masuk" error={errors.jamMasukOverride?.message}>
                <Input type="time" {...form.register("jamMasukOverride")} />
              </Field>
              <Field label="Jam Keluar" error={errors.jamKeluarOverride?.message}>
                <Input type="time" {...form.register("jamKeluarOverride")} />
              </Field>
            </div>
          )}

          {/* Keterangan */}
          <Field label="Keterangan (Opsional)" error={errors.keterangan?.message}>
            <Input
              {...form.register("keterangan")}
              placeholder="Contoh: Tukar shift, Lembur, dll"
            />
          </Field>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            {isEdit && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Menghapus..." : "Hapus Jadwal"}
              </Button>
            )}
            <Button
              type="button"
              disabled={isSaving || isUpdating}
              onClick={form.handleSubmit(onSubmit)}
            >
              {isSaving || isUpdating ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JadwalForm;
