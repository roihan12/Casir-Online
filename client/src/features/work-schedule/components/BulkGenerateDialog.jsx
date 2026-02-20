import React, { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Calendar as CalendarIcon,
  Users,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  Check,
  Search,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { cn } from "@common/utils/cn";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../common/components/ui/dialog";
import { Button } from "../../../common/components/ui/button";
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

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const bulkSchema = z
  .object({
    userIds: z.array(z.string()).min(1, "Pilih minimal satu karyawan"),
    shiftId: z.string().min(1, "Pilih shift kerja"),
    tanggalMulai: z.string().min(1, "Tanggal mulai harus diisi"),
    tanggalSelesai: z.string().min(1, "Tanggal selesai harus diisi"),
    hariKerja: z.array(z.string()).min(1, "Pilih minimal satu hari kerja"),
    skipExisting: z.boolean().default(true),
  })
  .refine(
    (data) =>
      !data.tanggalMulai ||
      !data.tanggalSelesai ||
      data.tanggalSelesai >= data.tanggalMulai,
    {
      message: "Tanggal selesai tidak boleh sebelum tanggal mulai",
      path: ["tanggalSelesai"],
    }
  );

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HARI_LIST = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

const STEPS = [
  { id: 1, label: "Karyawan" },
  { id: 2, label: "Jadwal" },
  { id: 3, label: "Konfirmasi" },
];

const STEP_FIELDS = {
  1: ["userIds"],
  2: ["shiftId", "tanggalMulai", "tanggalSelesai", "hariKerja"],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const safeFormat = (dateStr, fmt, options) => {
  if (!dateStr) return "-";
  try {
    return format(parseISO(dateStr), fmt, options);
  } catch {
    return "-";
  }
};

const getDefaultValues = (defaultStartDate, defaultEndDate) => ({
  userIds: [],
  shiftId: "",
  tanggalMulai: defaultStartDate || format(new Date(), "yyyy-MM-dd"),
  tanggalSelesai: defaultEndDate || format(new Date(), "yyyy-MM-dd"),
  hariKerja: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"],
  skipExisting: true,
});

// ---------------------------------------------------------------------------
// Local UI helper — replaces FormItem / FormLabel / FormControl / FormMessage
// ---------------------------------------------------------------------------

const Field = ({ label, error, description, children }) => (
  <div className="space-y-1.5">
    {label && (
      <label className="text-sm font-medium text-gray-700">{label}</label>
    )}
    {children}
    {description && (
      <p className="text-[10px] text-gray-500">{description}</p>
    )}
    {error && (
      <p className="text-sm font-medium text-red-500">{error}</p>
    )}
  </div>
);

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Visual step indicator */
const StepIndicator = ({ currentStep }) => (
  <div className="flex items-center justify-center gap-0 mb-6">
    {STEPS.map((step, idx) => (
      <React.Fragment key={step.id}>
        <div className="flex flex-col items-center gap-1">
          <div
            className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors",
              currentStep > step.id
                ? "bg-blue-600 border-blue-600 text-white"
                : currentStep === step.id
                ? "bg-white border-blue-600 text-blue-600"
                : "bg-white border-gray-200 text-gray-400"
            )}
          >
            {currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
          </div>
          <span
            className={cn(
              "text-[10px] font-medium",
              currentStep === step.id ? "text-blue-600" : "text-gray-400"
            )}
          >
            {step.label}
          </span>
        </div>
        {idx < STEPS.length - 1 && (
          <div
            className={cn(
              "h-0.5 w-12 mx-1 mb-5 transition-colors",
              currentStep > step.id ? "bg-blue-600" : "bg-gray-200"
            )}
          />
        )}
      </React.Fragment>
    ))}
  </div>
);

/** Step 1 — employee selection */
const StepEmployees = ({ form, users }) => {
  const [search, setSearch] = useState("");
  const selectedUserIds = form.watch("userIds") ?? [];
  const errors = form.formState.errors;

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.namaLengkap || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q)
    );
  });

  const allFilteredIds = filtered.map((u) => u.id);
  const allSelected =
    allFilteredIds.length > 0 &&
    allFilteredIds.every((id) => selectedUserIds.includes(id));

  const toggleAll = useCallback(() => {
    const current = form.getValues("userIds");
    if (allSelected) {
      form.setValue(
        "userIds",
        current.filter((id) => !allFilteredIds.includes(id)),
        { shouldValidate: true }
      );
    } else {
      const merged = Array.from(new Set([...current, ...allFilteredIds]));
      form.setValue("userIds", merged, { shouldValidate: true });
    }
  }, [allSelected, allFilteredIds, form]);

  const toggleUser = useCallback(
    (userId, checked) => {
      const current = form.getValues("userIds");
      form.setValue(
        "userIds",
        checked ? [...current, userId] : current.filter((id) => id !== userId),
        { shouldValidate: true }
      );
    },
    [form]
  );

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          className="pl-8 h-8 text-sm"
          placeholder="Cari karyawan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Select All row */}
      <label className="flex items-center gap-3 px-3 py-2 rounded-md bg-blue-50/50 border border-blue-100 cursor-pointer">
        <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
        <span className="text-xs font-semibold text-blue-700">
          {allSelected ? "Batalkan semua" : "Pilih semua"} ({allFilteredIds.length} karyawan)
        </span>
        {selectedUserIds.length > 0 && (
          <Badge className="ml-auto bg-blue-600 text-white text-[10px]">
            {selectedUserIds.length} dipilih
          </Badge>
        )}
      </label>

      {/* User list */}
      <div className="border rounded-md max-h-[260px] overflow-y-auto divide-y bg-gray-50/30">
        {filtered.length === 0 && (
          <p className="text-xs text-center text-muted-foreground py-6">
            Tidak ada karyawan ditemukan.
          </p>
        )}
        {filtered.map((user) => (
          <label
            key={user.id}
            className="flex items-center gap-3 p-3 hover:bg-white cursor-pointer transition-colors"
          >
            <Checkbox
              checked={selectedUserIds.includes(user.id)}
              onCheckedChange={(checked) => toggleUser(user.id, checked)}
            />
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">
                {user.namaLengkap || user.email}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
              <p className="text-[10px] text-muted-foreground truncate">
                {user.userRoles?.map((r) => r.role.namaRole).join(", ")}
              </p>
            </div>
          </label>
        ))}
      </div>

      {errors.userIds && (
        <p className="text-xs text-red-500 font-medium">
          {errors.userIds.message}
        </p>
      )}
    </div>
  );
};

/** Step 2 — schedule settings */
const StepSchedule = ({ form, shiftData }) => {
  const errors = form.formState.errors;
  const shiftId = form.watch("shiftId");
  const hariKerja = form.watch("hariKerja") ?? [];
  const skipExisting = form.watch("skipExisting");

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Mulai Tanggal" error={errors.tanggalMulai?.message}>
          <Input type="date" {...form.register("tanggalMulai")} />
        </Field>
        <Field label="Sampai Tanggal" error={errors.tanggalSelesai?.message}>
          <Input type="date" {...form.register("tanggalSelesai")} />
        </Field>
      </div>

      <Field label="Shift Kerja" error={errors.shiftId?.message}>
        <Select
          value={shiftId}
          onValueChange={(val) =>
            form.setValue("shiftId", val, { shouldValidate: true })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih shift" />
          </SelectTrigger>
          <SelectContent>
            {shiftData?.data?.map((shift) => {
              console.log(shift);
              return (
                <SelectItem key={shift.id} value={shift.id}>
                  {`${shift.namaShift} (${shift.jamMasuk} - ${shift.jamKeluar})`}
                </SelectItem>
              )
            } )}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Hari Kerja" error={errors.hariKerja?.message}>
        <div className="flex flex-wrap gap-2 pt-1">
          {HARI_LIST.map((hari) => {
            const isSelected = hariKerja.includes(hari);
            return (
              <Badge
                key={hari}
                variant={isSelected ? "default" : "outline"}
                className={cn(
                  "cursor-pointer transition-all hover:scale-105 px-3 py-1.5 select-none",
                  isSelected
                    ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-sm"
                    : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                )}
                onClick={() => {
                  const next = isSelected
                    ? hariKerja.filter((h) => h !== hari)
                    : [...hariKerja, hari];
                  form.setValue("hariKerja", next, { shouldValidate: true });
                }}
              >
                {hari}
              </Badge>
            );
          })}
        </div>
      </Field>

      <div className="flex flex-row items-start gap-3 rounded-md border p-4 bg-orange-50/30 border-orange-100">
        <Checkbox
          checked={skipExisting}
          onCheckedChange={(val) =>
            form.setValue("skipExisting", val, { shouldValidate: true })
          }
        />
        <div className="space-y-1 leading-none">
          <label className="text-sm font-medium text-gray-700">
            Lewati jadwal yang sudah ada
          </label>
          <p className="text-[10px] text-gray-500">
            Jika dicentang, sistem tidak akan menimpa jadwal yang sudah dibuat sebelumnya.
          </p>
        </div>
      </div>
    </div>
  );
};

/** Step 3 — confirmation summary */
const StepConfirmation = ({ form, selectedUsers }) => {
  const tanggalMulai = form.watch("tanggalMulai");
  const tanggalSelesai = form.watch("tanggalSelesai");
  const hariKerja = form.watch("hariKerja") ?? [];
  const errors = form.formState.errors;

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold">Konfirmasi Generate</h3>
        <p className="text-sm text-muted-foreground">Periksa kembali data sebelum memulai proses.</p>
      </div>

      <div className="space-y-3 bg-gray-50 rounded-xl p-5 border">
        <div className="flex justify-between text-sm py-1 border-b border-gray-100">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" /> Total Karyawan
          </span>
          <span className="font-bold">{selectedUsers.length} Orang</span>
        </div>
        <div className="flex justify-between text-sm py-1 border-b border-gray-100">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <CalendarIcon className="h-3.5 w-3.5" /> Periode
          </span>
          <span className="font-bold">
            {safeFormat(tanggalMulai, "d MMM", { locale: localeId })} –{" "}
            {safeFormat(tanggalSelesai, "d MMM yyyy", { locale: localeId })}
          </span>
        </div>
        <div className="flex justify-between text-sm py-1">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" /> Hari Kerja
          </span>
          <span className="font-bold">{hariKerja.length} Hari/Minggu</span>
        </div>
      </div>

      <div className="max-h-[120px] overflow-y-auto pr-1">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-2">
          Daftar Karyawan Terpilih:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {selectedUsers.map((u) => (
            <Badge
              key={u.id}
              variant="secondary"
              className="bg-white border text-[10px] py-0 px-2"
            >
              {u.namaLengkap || u.email}
            </Badge>
          ))}
        </div>
      </div>

      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
          <p className="text-xs font-bold text-red-600 flex items-center gap-1.5">
            <AlertCircle className="h-3 w-3" /> Ada kesalahan validasi:
          </p>
          <ul className="list-disc list-inside text-[10px] text-red-500">
            {Object.entries(errors).map(([key, error]) => (
              <li key={key}>{error?.message}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const BulkGenerateDialog = ({
  open,
  onOpenChange,
  cabangId,
  defaultStartDate,
  defaultEndDate,
}) => {
  const [step, setStep] = useState(1);

  const form = useForm({
    resolver: zodResolver(bulkSchema),
    defaultValues: getDefaultValues(defaultStartDate, defaultEndDate),
  });

  // Reset only when dialog transitions from closed → open
  const prevOpenRef = React.useRef(false);
  React.useEffect(() => {
    if (open && !prevOpenRef.current) {
      setStep(1);
      form.reset(getDefaultValues(defaultStartDate, defaultEndDate));
    }
    prevOpenRef.current = open;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const normalizedCabangId = cabangId === "global" ? "" : cabangId;

  const generateMutation = useBulkGenerateJadwal();
  const { data: shiftData } = useMasterShiftList();
  const { getUsersQuery } = useUsers({ cabangId: normalizedCabangId, limit: 200 });
  const users = getUsersQuery?.data?.data ?? [];

  const selectedUserIds = form.watch("userIds") ?? [];
  const selectedUsers = users.filter((u) => selectedUserIds.includes(u.id));

  const handleNext = async () => {
    const fields = STEP_FIELDS[step];
    if (fields) {
      const valid = await form.trigger(fields);
      if (!valid) return;
    }
    setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => s - 1);

  const onSubmit = (data) => {
    generateMutation.mutate(
      { ...data, cabangId },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  const isSubmitting =
    generateMutation.isPending ?? generateMutation.isLoading ?? false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Bulk Generate Jadwal
          </DialogTitle>
          <DialogDescription>
            Buat jadwal kerja untuk banyak karyawan sekaligus.
          </DialogDescription>
        </DialogHeader>

        <StepIndicator currentStep={step} />

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {step === 1 && <StepEmployees form={form} users={users} />}
          {step === 2 && <StepSchedule form={form} shiftData={shiftData} />}
          {step === 3 && (
            <StepConfirmation form={form} selectedUsers={selectedUsers} />
          )}

          <DialogFooter className="mt-6 border-t pt-4">
            {step > 1 && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleBack}
                disabled={isSubmitting}
              >
                Kembali
              </Button>
            )}

            {step < 3 ? (
              <Button type="button" onClick={handleNext}>
                Lanjut <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Memproses..." : "Mulai Generate"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BulkGenerateDialog;