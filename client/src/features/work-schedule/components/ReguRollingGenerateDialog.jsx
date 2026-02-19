import React, { useState, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Calendar, RotateCcw, ChevronRight, CheckCircle2, 
  Plus, Trash2, Info, ArrowRight, LayoutGrid, Users
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "../../../common/components/ui/dialog";
import { Button } from "../../../common/components/ui/button";
import {
  Form, FormControl, FormField, FormItem, FormLabel,
  FormMessage, FormDescription,
} from "../../../common/components/ui/form";
import { Input } from "../../../common/components/ui/input";
import { Label } from "../../../common/components/ui/label";
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

const rollingSchema = z.object({
  cabangId: z.string(),
  tanggalMulai: z.string().min(1, "Wajib diisi"),
  tanggalSelesai: z.string().min(1, "Wajib diisi"),
  skipExisting: z.boolean().default(true),
  regu: z.array(z.object({
    reguId: z.string().min(1),
    tanggalMulaiKerjaRegu: z.string().min(1),
    pola: z.array(z.number()),
    rotasiShift: z.array(z.string()).min(1),
    hariKerjaPerRotasi: z.number().min(1),
    startShiftId: z.string().min(1),
  })).min(1, "Pilih minimal satu regu"),
});

const defaultPattern = [1, 1, 0, 0]; // 2K-2L

const ReguRollingGenerateDialog = ({ open, onOpenChange, cabangId, defaultStartDate, defaultEndDate }) => {
  const [step, setStep] = useState(1);
  const [selectedReguIds, setSelectedReguIds] = useState([]);

  const { data: reguData } = useReguList(cabangId === "global" ? {} : { cabangId });
  // const { data: shiftData } = useMasterShiftList({ cabangId: cabangId === "global" ? "" : cabangId });

   const { data: shiftData } = useMasterShiftList();

  const generateMutation = useReguRollingGenerateJadwal();


  const form = useForm({
    resolver: zodResolver(rollingSchema),
    defaultValues: {
      cabangId,
      tanggalMulai: defaultStartDate || format(new Date(), "yyyy-MM-dd"),
      tanggalSelesai: defaultEndDate || format(new Date(), "yyyy-MM-dd"),
      skipExisting: true,
      regu: [],
    },
  });

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setStep(1);
      setSelectedReguIds([]);
      form.reset({
        cabangId,
        tanggalMulai: defaultStartDate || format(new Date(), "yyyy-MM-dd"),
        tanggalSelesai: defaultEndDate || format(new Date(), "yyyy-MM-dd"),
        skipExisting: true,
        regu: [],
      });
    }
  }, [open, defaultStartDate, defaultEndDate, cabangId]);

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "regu",
  });

  const handleReguToggle = (reguId) => {
    if (selectedReguIds.includes(reguId)) {
      setSelectedReguIds(prev => prev.filter(id => id !== reguId));
      const idx = fields.findIndex(f => f.reguId === reguId);
      if (idx !== -1) remove(idx);
    } else {
      setSelectedReguIds(prev => [...prev, reguId]);
      append({
        reguId,
        tanggalMulaiKerjaRegu: form.getValues("tanggalMulai"),
        pola: [...defaultPattern],
        rotasiShift: [],
        hariKerjaPerRotasi: 4,
        startShiftId: "",
      });
    }
  };

  const onSubmit = (data) => {
    generateMutation.mutate(data, {
      onSuccess: () => {
        onOpenChange(false);
        setStep(1);
        setSelectedReguIds([]);
        form.reset();
      },
    });
  };

  // Step 1: Select Regu
  const Step1 = (
    <div className="space-y-4 py-4">
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="outline" className="h-6 w-6 p-0 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 border-blue-200">1</Badge>
        <h3 className="font-semibold text-gray-700">Pilih Regu (Tim)</h3>
      </div>
      <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
        {reguData?.data?.map((r) => (
          <Card 
            key={r.id} 
            className={`cursor-pointer transition-all hover:border-blue-300 ${
              selectedReguIds.includes(r.id) ? "border-blue-500 bg-blue-50/30" : ""
            }`}
            onClick={() => handleReguToggle(r.id)}
          >
            <CardContent className="p-3 flex items-center gap-3">
              <Checkbox checked={selectedReguIds.includes(r.id)} />
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold truncate">{r.nama_regu}</p>
                <p className="text-[10px] text-muted-foreground">{r._count?.regu_member || 0} Anggota</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {fields.length === 0 && <p className="text-xs text-red-500 italic">Pilih minimal satu regu untuk melanjutkan</p>}
    </div>
  );

  // Step 2: Global Date Settings
  const Step2 = (
    <div className="space-y-6 py-4">
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="outline" className="h-6 w-6 p-0 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 border-blue-200">2</Badge>
        <h3 className="font-semibold text-gray-700">Periode Jadwal</h3>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="tanggalMulai"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mulai Tanggal</FormLabel>
              <FormControl><Input type="date" {...field} /></FormControl>
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
              <FormControl><Input type="date" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
       <FormField
            control={form.control}
            name="skipExisting"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-gray-50/50">
                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Skip Duplikat</FormLabel>
                  <FormDescription className="text-[10px]">Jangan timpa jadwal yang sudah ada.</FormDescription>
                </div>
              </FormItem>
            )}
          />
    </div>
  );

  // Step 3: Rolling Configuration per Regu
  const Step3 = (
    <div className="space-y-6 py-4 max-h-[450px] overflow-y-auto pr-2 scrollbar-thin">
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="outline" className="h-6 w-6 p-0 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 border-blue-200">3</Badge>
        <h3 className="font-semibold text-gray-700">Konfigurasi Rolling Regu</h3>
      </div>
      
      {fields.map((field, index) => {
        const regu = reguData?.data?.find(r => r.id === field.reguId);
        return (
          <Card key={field.id} className="border-blue-100 shadow-sm overflow-visible">
            <div className="bg-blue-50/50 p-3 border-b border-blue-100 flex justify-between items-center">
               <h4 className="font-bold text-blue-700 text-sm flex items-center gap-2">
                 <LayoutGrid className="h-4 w-4" /> {regu?.nama_regu || regu?.namaRegu}
               </h4>
            </div>
            <CardContent className="p-4 space-y-4">
              {/* Pattern Builder */}
              <div>
                <Label className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2 block">Pola Kerja (1: Kerja, 0: Libur)</Label>
                <div className="flex gap-1.5 flex-wrap">
                  {field.pola.map((val, pIdx) => (
                    <div 
                      key={pIdx}
                      onClick={() => {
                        const newPola = [...field.pola];
                        newPola[pIdx] = val === 1 ? 0 : 1;
                        update(index, { ...field, pola: newPola });
                      }}
                      className={`h-9 w-9 rounded-md flex items-center justify-center cursor-pointer transition-all border-2 text-xs font-bold ${
                        val === 1 
                          ? "bg-blue-600 border-blue-700 text-white shadow-md scale-105" 
                          : "bg-white border-gray-200 text-gray-400"
                      }`}
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
                  <Label className="text-[11px] text-muted-foreground uppercase">Mulai Kerja Sejak</Label>
                  <Input 
                    type="date" 
                    value={field.tanggalMulaiKerjaRegu}
                    onChange={(e) => update(index, { ...field, tanggalMulaiKerjaRegu: e.target.value })}
                  />
                  <p className="text-[9px] text-muted-foreground italic">Untuk menghitung posisi siklus pola.</p>
                </div>
                <div className="space-y-1.5">
                   <Label className="text-[11px] text-muted-foreground uppercase">Ganti Shift Setiap (Hari Kerja)</Label>
                   <Input 
                    type="number" 
                    value={field.hariKerjaPerRotasi}
                    onChange={(e) => update(index, { ...field, hariKerjaPerRotasi: parseInt(e.target.value) || 1 })}
                   />
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <Label className="text-[11px] text-muted-foreground uppercase">Urutan Rotasi Shift</Label>
                <div className="flex flex-wrap gap-2">
                  {shiftData?.data?.map(s => (
                    <Badge
                      key={s.id}
                      variant={field.rotasiShift.includes(s.id) ? "default" : "outline"}
                      className="cursor-pointer py-1 px-3"
                      onClick={() => {
                        const current = field.rotasiShift;
                        const next = current.includes(s.id) 
                          ? current.filter(id => id !== s.id) 
                          : [...current, s.id];
                        update(index, { ...field, rotasiShift: next });
                      }}
                    >
                      {field.rotasiShift.indexOf(s.id) !== -1 && (
                        <span className="mr-1.5 font-bold text-blue-200">{field.rotasiShift.indexOf(s.id) + 1}</span>
                      )}
                      {s.namaShift}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                 <Label className="text-[11px] text-muted-foreground uppercase">Mulai Dari Shift</Label>
                 {(() => {
                   const rotasiIds = form.watch(`regu.${index}.rotasiShift`) || [];
                   const startShiftId = form.watch(`regu.${index}.startShiftId`);
                   
                   return (
                     <Select 
                      value={startShiftId} 
                      onValueChange={(val) => update(index, { ...form.getValues(`regu.${index}`), startShiftId: val })}
                     >
                       <SelectTrigger>
                         <SelectValue placeholder="Pilih shift pertama pada Mulai Kerja" />
                       </SelectTrigger>
                       <SelectContent>
                         {shiftData?.data?.filter(s => rotasiIds.includes(s.id)).map(s => (
                           <SelectItem key={s.id} value={s.id}>{s.namaShift}</SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   );
                 })()}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  // Step 4: Final Preview
  const Step4 = (
    <div className="space-y-6 py-4">
      <div className="flex flex-col items-center text-center space-y-2 mb-4">
        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-2">
          <RotateCcw className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold">Siap Sinkronisasi?</h3>
        <p className="text-sm text-muted-foreground">Sistem akan melakukan kalkulasi pola rolling untuk setiap regu.</p>
      </div>

      <div className="space-y-3">
        {fields.map((f, i) => {
          const regu = reguData?.data?.find(r => r.id === f.reguId);
          const currentValues = form.watch(`regu.${i}`);
          return (
            <div key={f.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-bold">{regu?.nama_regu || regu?.namaRegu}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Pola: {currentValues.pola.join("-")} | Rotasi: {currentValues.rotasiShift.length} Shift | Setiap {currentValues.hariKerjaPerRotasi} Hari
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100">Siap</Badge>
            </div>
          );
        })}
      </div>

      <div className="p-4 bg-orange-50 rounded-lg border border-orange-200 flex gap-3">
         <Info className="h-5 w-5 text-orange-400 shrink-0 mt-0.5" />
         <p className="text-xs text-orange-700 leading-relaxed">
           Proses ini akan menghitung offset berdasarkan <b>Mulai Kerja</b>. Jika tanggal tersebut jauh di masa lalu, sistem tetap akan memastikan shift pada 
           <b> {format(new Date(form.watch("tanggalMulai")), "d MMMM yyyy", { locale: localeId })}</b> sesuai dengan urutan siklus yang seharusnya.
         </p>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Generate Rolling Regu</DialogTitle>
          <DialogDescription>Automasi jadwal bergilir dengan pola kerja dan rotasi shift kustom.</DialogDescription>
        </DialogHeader>

        <Form onSubmit={form.handleSubmit(onSubmit)}>
            {step === 1 && Step1}
            {step === 2 && Step2}
            {step === 3 && Step3}
            {step === 4 && Step4}

            <DialogFooter className="mt-4 pt-4 border-t flex justify-between sm:justify-end gap-2">
              <div className="flex-1 text-xs text-muted-foreground flex items-center">
                Step {step} of 4
              </div>
              {step > 1 && (
                <Button type="button" variant="ghost" onClick={() => setStep(s => s - 1)} disabled={generateMutation.isLoading}>
                  Kembali
                </Button>
              )}
              {step < 4 ? (
                <Button 
                  type="button" 
                  onClick={() => setStep(s => s + 1)}
                  disabled={(step === 1 && fields.length === 0)}
                >
                  Lanjut <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={generateMutation.isLoading}>
                  {generateMutation.isLoading ? "Membangun Sinkronisasi..." : "Mulai Generate"}
                </Button>
              )}
            </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ReguRollingGenerateDialog;
