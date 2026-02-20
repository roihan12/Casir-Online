import React, { useState, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  RotateCcw,
  ChevronRight,
  Plus,
  Trash2,
  Info,
  LayoutGrid,
  Users,
  Check,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { cn } from "@common/utils/cn";

import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "../../../common/components/ui/dialog";
import { Button } from "../../../common/components/ui/button";
import { Input } from "../../../common/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../../../common/components/ui/select";
import { Checkbox } from "../../../common/components/ui/checkbox";
import { Badge } from "../../../common/components/ui/badge";
import { Card, CardContent } from "../../../common/components/ui/card";
import { Separator } from "../../../common/components/ui/separator";

import { useReguList } from "../hooks/useRegu";
import { useMasterShiftList } from "../hooks/useMasterShift";
import { useReguRollingGenerateJadwal } from "../hooks/useBulkGenerate";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const rollingSchema = z.object({
  cabangId: z.string(),
  tanggalMulai: z.string().min(1, "Tanggal mulai wajib diisi"),
  tanggalSelesai: z.string().min(1, "Tanggal selesai wajib diisi"),
  skipExisting: z.boolean().default(true),
  regu: z.array(z.object({
    reguId: z.string().min(1),
    tanggalMulaiKerjaRegu: z.string().min(1, "Tanggal mulai kerja wajib diisi"),
    pola: z.array(z.number()),
    rotasiShift: z.array(z.string()).min(1, "Pilih minimal satu shift"),
    hariKerjaPerRotasi: z.number().min(1, "Minimal 1 hari"),
    startShiftId: z.string().min(1, "Pilih shift awal"),
  })).min(1, "Pilih minimal satu regu"),
}).refine(
  (data) =>
    !data.tanggalMulai || !data.tanggalSelesai ||
    data.tanggalSelesai >= data.tanggalMulai,
  {
    message: "Tanggal selesai tidak boleh sebelum tanggal mulai",
    path: ["tanggalSelesai"],
  }
);

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const defaultPattern = [1, 1, 0, 0]; // 2K-2L

const STEPS = [
  { id: 1, label: "Regu" },
  { id: 2, label: "Periode" },
  { id: 3, label: "Konfigurasi" },
  { id: 4, label: "Konfirmasi" },
];

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

const getDefaultValues = (cabangId, defaultStartDate, defaultEndDate) => ({
  cabangId,
  tanggalMulai: defaultStartDate || format(new Date(), "yyyy-MM-dd"),
  tanggalSelesai: defaultEndDate || format(new Date(), "yyyy-MM-dd"),
  skipExisting: true,
  regu: [],
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
              "h-0.5 w-8 sm:w-12 mx-1 mb-5 transition-colors",
              currentStep > step.id ? "bg-blue-600" : "bg-gray-200"
            )}
          />
        )}
      </React.Fragment>
    ))}
  </div>
);

/** Step 1 — select regu teams */
const StepSelectRegu = ({ reguData, selectedReguIds, onToggle }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
      {reguData?.data?.map((r) => (
        <Card
          key={r.id}
          className={cn(
            "cursor-pointer transition-all hover:border-blue-300",
            selectedReguIds.includes(r.id) && "border-blue-500 bg-blue-50/30"
          )}
          onClick={() => onToggle(r.id)}
        >
          <CardContent className="p-3 flex items-center gap-3">
            <Checkbox checked={selectedReguIds.includes(r.id)} readOnly />
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold truncate">{r.nama_regu}</p>
              <p className="text-[10px] text-muted-foreground">
                {r._count?.regu_member || 0} Anggota
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
    {selectedReguIds.length === 0 && (
      <p className="text-xs text-red-500 italic">
        Pilih minimal satu regu untuk melanjutkan
      </p>
    )}
  </div>
);

/** Step 2 — period settings */
const StepPeriod = ({ form }) => {
  const errors = form.formState.errors;
  const skipExisting = form.watch("skipExisting");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Mulai Tanggal" error={errors.tanggalMulai?.message}>
          <Input
            type="date"
            {...form.register("tanggalMulai")}
          />
        </Field>
        <Field label="Sampai Tanggal" error={errors.tanggalSelesai?.message}>
          <Input
            type="date"
            {...form.register("tanggalSelesai")}
          />
        </Field>
      </div>

      <div className="flex flex-row items-start gap-3 rounded-md border p-4 bg-gray-50/50">
        <Checkbox
          checked={skipExisting}
          onCheckedChange={(val) =>
            form.setValue("skipExisting", val, { shouldValidate: true })
          }
        />
        <div className="space-y-1 leading-none">
          <label className="text-sm font-medium text-gray-700">Skip Duplikat</label>
          <p className="text-[10px] text-gray-500">
            Jangan timpa jadwal yang sudah ada.
          </p>
        </div>
      </div>
    </div>
  );
};

/** Step 3 — rolling configuration per regu */
const StepConfiguration = ({ fields, form, reguData, shiftData, update }) => (
  <div className="space-y-6 max-h-[450px] overflow-y-auto pr-2 scrollbar-thin">
    {fields.map((field, index) => {
      const regu = reguData?.data?.find((r) => r.id === field.reguId);
      return (
        <Card key={field.id} className="border-blue-100 shadow-sm overflow-visible">
          <div className="bg-blue-50/50 p-3 border-b border-blue-100 flex justify-between items-center">
            <h4 className="font-bold text-blue-700 text-sm flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              {regu?.nama_regu || regu?.namaRegu}
            </h4>
          </div>
          <CardContent className="p-4 space-y-4">
            {/* Pattern Builder */}
            <div>
              <label className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2 block">
                Pola Kerja (1: Kerja, 0: Libur)
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {field.pola.map((val, pIdx) => (
                  <div
                    key={pIdx}
                    onClick={() => {
                      const newPola = [...field.pola];
                      newPola[pIdx] = val === 1 ? 0 : 1;
                      update(index, { ...field, pola: newPola });
                    }}
                    className={cn(
                      "h-9 w-9 rounded-md flex items-center justify-center cursor-pointer transition-all border-2 text-xs font-bold",
                      val === 1
                        ? "bg-blue-600 border-blue-700 text-white shadow-md scale-105"
                        : "bg-white border-gray-200 text-gray-400"
                    )}
                  >
                    {val === 1 ? "K" : "L"}
                  </div>
                ))}
                <Button
                  type="button" size="icon" variant="outline" className="h-9 w-9"
                  onClick={() => update(index, { ...field, pola: [...field.pola, 1] })}
                >
                  <Plus className="h-3 w-3" />
                </Button>
                {field.pola.length > 2 && (
                  <Button
                    type="button" size="icon" variant="outline" className="h-9 w-9 text-red-400"
                    onClick={() => update(index, { ...field, pola: field.pola.slice(0, -1) })}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] text-muted-foreground uppercase">Mulai Kerja Sejak</label>
                <Input
                  type="date"
                  value={field.tanggalMulaiKerjaRegu}
                  onChange={(e) => update(index, { ...field, tanggalMulaiKerjaRegu: e.target.value })}
                />
                <p className="text-[9px] text-muted-foreground italic">
                  Untuk menghitung posisi siklus pola.
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] text-muted-foreground uppercase">
                  Ganti Shift Setiap (Hari Kerja)
                </label>
                <Input
                  type="number"
                  value={field.hariKerjaPerRotasi}
                  onChange={(e) =>
                    update(index, {
                      ...field,
                      hariKerjaPerRotasi: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
            </div>

            <Separator className="my-4" />

            {/* Shift Rotation Order */}
            <div className="space-y-2">
              <label className="text-[11px] text-muted-foreground uppercase">
                Urutan Rotasi Shift
              </label>
              <div className="flex flex-wrap gap-2">
                {shiftData?.data?.map((s) => {
                  const isSelected = field.rotasiShift.includes(s.id);
                  return (
                    <Badge
                      key={s.id}
                      variant={isSelected ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer py-1 px-3 select-none transition-all hover:scale-105",
                        isSelected
                          ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-sm"
                          : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                      )}
                      onClick={() => {
                        const next = isSelected
                          ? field.rotasiShift.filter((id) => id !== s.id)
                          : [...field.rotasiShift, s.id];
                        update(index, { ...field, rotasiShift: next });
                      }}
                    >
                      {isSelected && (
                        <span className="mr-1.5 font-bold text-blue-200">
                          {field.rotasiShift.indexOf(s.id) + 1}
                        </span>
                      )}
                      {s.namaShift}
                    </Badge>
                  );
                })}
              </div>
            </div>

            {/* Start Shift */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-muted-foreground uppercase">
                Mulai Dari Shift
              </label>
              <Select
                value={form.watch(`regu.${index}.startShiftId`)}
                onValueChange={(val) =>
                  update(index, {
                    ...form.getValues(`regu.${index}`),
                    startShiftId: val,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih shift pertama pada Mulai Kerja" />
                </SelectTrigger>
                <SelectContent>
                  {shiftData?.data
                    ?.filter((s) => (form.watch(`regu.${index}.rotasiShift`) || []).includes(s.id))
                    .map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {`${s.namaShift} (${s.jamMasuk} - ${s.jamKeluar})`} 
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      );
    })}
  </div>
);

/** Step 4 — final preview */
const StepPreview = ({ fields, form, reguData }) => {
  const tanggalMulai = form.watch("tanggalMulai");

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center space-y-2 mb-4">
        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-2">
          <RotateCcw className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold">Siap Sinkronisasi?</h3>
        <p className="text-sm text-muted-foreground">
          Sistem akan melakukan kalkulasi pola rolling untuk setiap regu.
        </p>
      </div>

      <div className="space-y-3">
        {fields.map((f, i) => {
          const regu = reguData?.data?.find((r) => r.id === f.reguId);
          const currentValues = form.watch(`regu.${i}`);
          return (
            <div
              key={f.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-bold">
                    {regu?.nama_regu || regu?.namaRegu}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Pola: {currentValues?.pola?.join("-")} | Rotasi:{" "}
                    {currentValues?.rotasiShift?.length} Shift | Setiap{" "}
                    {currentValues?.hariKerjaPerRotasi} Hari
                  </p>
                </div>
              </div>
              <Badge
                variant="secondary"
                className="bg-emerald-50 text-emerald-700 border-emerald-100"
              >
                Siap
              </Badge>
            </div>
          );
        })}
      </div>

      <div className="p-4 bg-orange-50 rounded-lg border border-orange-200 flex gap-3">
        <Info className="h-5 w-5 text-orange-400 shrink-0 mt-0.5" />
        <p className="text-xs text-orange-700 leading-relaxed">
          Proses ini akan menghitung offset berdasarkan <b>Mulai Kerja</b>. Jika
          tanggal tersebut jauh di masa lalu, sistem tetap akan memastikan shift
          pada{" "}
          <b>{safeFormat(tanggalMulai, "d MMMM yyyy", { locale: localeId })}</b>{" "}
          sesuai dengan urutan siklus yang seharusnya.
        </p>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const ReguRollingGenerateDialog = ({
  open,
  onOpenChange,
  cabangId,
  defaultStartDate,
  defaultEndDate,
}) => {
  const [step, setStep] = useState(1);
  const [selectedReguIds, setSelectedReguIds] = useState([]);

  const { data: reguData } = useReguList(
    cabangId === "global" ? {} : { cabangId }
  );
  const { data: shiftData } = useMasterShiftList();
  const generateMutation = useReguRollingGenerateJadwal();

  const form = useForm({
    resolver: zodResolver(rollingSchema),
    defaultValues: getDefaultValues(cabangId, defaultStartDate, defaultEndDate),
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "regu",
  });

  // Reset only when dialog transitions from closed → open
  const prevOpenRef = React.useRef(false);
  React.useEffect(() => {
    if (open && !prevOpenRef.current) {
      setStep(1);
      setSelectedReguIds([]);
      form.reset(getDefaultValues(cabangId, defaultStartDate, defaultEndDate));
    }
    prevOpenRef.current = open;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleReguToggle = useCallback(
    (reguId) => {
      if (selectedReguIds.includes(reguId)) {
        setSelectedReguIds((prev) => prev.filter((id) => id !== reguId));
        const idx = fields.findIndex((f) => f.reguId === reguId);
        if (idx !== -1) remove(idx);
      } else {
        setSelectedReguIds((prev) => [...prev, reguId]);
        append({
          reguId,
          tanggalMulaiKerjaRegu: form.getValues("tanggalMulai"),
          pola: [...defaultPattern],
          rotasiShift: [],
          hariKerjaPerRotasi: 4,
          startShiftId: "",
        });
      }
    },
    [selectedReguIds, fields, remove, append, form]
  );

  const handleNext = useCallback(async () => {
    // Step 1: just ensure at least one regu is selected
    if (step === 1) {
      if (fields.length === 0) return;
      setStep((s) => s + 1);
      return;
    }

    // Step 2: validate top-level date fields
    if (step === 2) {
      const valid = await form.trigger(["tanggalMulai", "tanggalSelesai"]);
      if (!valid) return;
    }

    setStep((s) => s + 1);
  }, [step, form, fields.length]);

  const handleBack = () => setStep((s) => s - 1);

  const onSubmit = (data) => {
    generateMutation.mutate(data, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  const isSubmitting =
    generateMutation.isPending ?? generateMutation.isLoading ?? false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Generate Rolling Regu
          </DialogTitle>
          <DialogDescription>
            Automasi jadwal bergilir dengan pola kerja dan rotasi shift kustom.
          </DialogDescription>
        </DialogHeader>

        <StepIndicator currentStep={step} />

        <form onSubmit={form.handleSubmit(onSubmit)}>
          {step === 1 && (
            <StepSelectRegu
              reguData={reguData}
              selectedReguIds={selectedReguIds}
              onToggle={handleReguToggle}
            />
          )}
          {step === 2 && <StepPeriod form={form} />}
          {step === 3 && (
            <StepConfiguration
              fields={fields}
              form={form}
              reguData={reguData}
              shiftData={shiftData}
              update={update}
            />
          )}
          {step === 4 && (
            <StepPreview fields={fields} form={form} reguData={reguData} />
          )}

          <DialogFooter className="mt-4 pt-4 border-t flex justify-between sm:justify-end gap-2">
            <div className="flex-1 text-xs text-muted-foreground flex items-center">
              Step {step} of {STEPS.length}
            </div>
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
            {step < STEPS.length ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={step === 1 && fields.length === 0}
              >
                Lanjut <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Membangun Sinkronisasi..." : "Mulai Generate"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReguRollingGenerateDialog;
