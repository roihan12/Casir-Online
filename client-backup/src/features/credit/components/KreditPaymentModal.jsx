import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Loader2, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { formatRupiah } from "../../utils/formatter";
import { useKreditPaymentRecommendation, useCreateKreditTransaction } from "../../hooks/useKreditRekomendasiQueries";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Input } from "../ui/input";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { toast } from "react-hot-toast";
import { Alert, AlertDescription } from "../ui/alert";

const kreditTransactionSchema = z.object({
  transaksi_id: z.string(),
  rekomendasi_id: z.string(),
  opsi_pembayaran_id: z.string(),
  uang_muka: z.string().optional(),
  metode_pembayaran_dp: z.string().optional(),
});

const KreditPaymentModal = ({ isOpen, onClose, transaksiId, onSuccess }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  
  const form = useForm({
    resolver: zodResolver(kreditTransactionSchema),
    defaultValues: {
      transaksi_id: transaksiId,
      rekomendasi_id: "",
      opsi_pembayaran_id: "",
      uang_muka: "0",
      metode_pembayaran_dp: "TUNAI",
    },
  });

  const { 
    data: recommendationData, 
    isLoading: isLoadingRecommendation, 
    error: recommendationError 
  } = useKreditPaymentRecommendation(transaksiId, {
    enabled: isOpen && !!transaksiId,
  });

  const { 
    mutate: createKreditTransaction, 
    isPending: isCreatingTransaction 
  } = useCreateKreditTransaction();

  useEffect(() => {
    if (recommendationData?.data) {
      form.setValue("rekomendasi_id", recommendationData.data.rekomendasi_id);
    }
  }, [recommendationData, form]);

  const handleSelectOption = (option) => {
    setSelectedOption(option);
    form.setValue("opsi_pembayaran_id", option.id);
  };

  const onSubmit = (data) => {
    // Convert uang_muka to number
    if (data.uang_muka) {
      data.uang_muka = parseFloat(data.uang_muka);
    }

    createKreditTransaction(data, {
      onSuccess: (response) => {
        toast.success("Transaksi kredit berhasil dibuat");
        if (onSuccess) {
          onSuccess(response.data);
        }
        onClose();
      },
    });
  };

  const renderContent = () => {
    if (isLoadingRecommendation) {
      return (
        <div className="flex flex-col items-center justify-center py-10">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-sm text-gray-500">
            Menganalisis kelayakan kredit pelanggan...
          </p>
        </div>
      );
    }

    if (recommendationError) {
      return (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {recommendationError.response?.data?.message || 
              "Gagal mendapatkan rekomendasi kredit. Silakan coba lagi."}
          </AlertDescription>
        </Alert>
      );
    }

    if (!recommendationData?.data) {
      return (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Data rekomendasi kredit tidak tersedia.
          </AlertDescription>
        </Alert>
      );
    }

    const { data } = recommendationData;

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Skor Kredit</p>
              <div className="flex items-center">
                <Badge 
                  variant={data.credit_score >= 70 ? "success" : data.credit_score >= 50 ? "warning" : "destructive"}
                  className="text-lg py-1 px-3"
                >
                  {data.credit_score}
                </Badge>
                <span className="ml-2 text-sm text-gray-500">
                  {data.credit_score >= 70 
                    ? "Sangat Baik" 
                    : data.credit_score >= 50 
                    ? "Cukup Baik" 
                    : "Perlu Perhatian"}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Batas Kredit</p>
              <p className="text-lg font-semibold">{formatRupiah(data.credit_limit)}</p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-medium">Opsi Pembayaran Kredit</p>
            <div className="grid grid-cols-1 gap-4">
              {data.opsi_pembayaran.map((option) => (
                <Card 
                  key={option.id}
                  className={`cursor-pointer transition-all ${
                    selectedOption?.id === option.id 
                      ? "border-primary ring-2 ring-primary/20" 
                      : "hover:border-gray-300"
                  }`}
                  onClick={() => handleSelectOption(option)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex justify-between">
                      <span>{option.jumlah_cicilan}x Cicilan</span>
                      <Badge variant="outline" className="ml-2">
                        {option.durasi_bulan} bulan
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500">Total Bayar</p>
                        <p className="font-semibold">{formatRupiah(option.total_pembayaran)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Cicilan per Bulan</p>
                        <p className="font-semibold">{formatRupiah(option.cicilan_per_bulan)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Bunga</p>
                        <p className="font-semibold">{option.bunga_persen}%</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Biaya Admin</p>
                        <p className="font-semibold">{formatRupiah(option.biaya_admin)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {selectedOption && (
            <>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="uang_muka"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Uang Muka (opsional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="metode_pembayaran_dp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Metode Pembayaran Uang Muka</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex space-x-4"
                        >
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <RadioGroupItem value="TUNAI" />
                            </FormControl>
                            <FormLabel className="font-normal">Tunai</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <RadioGroupItem value="TRANSFER" />
                            </FormControl>
                            <FormLabel className="font-normal">Transfer</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <RadioGroupItem value="QRIS" />
                            </FormControl>
                            <FormLabel className="font-normal">QRIS</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between text-sm mb-2">
                  <span>Total Transaksi</span>
                  <span className="font-semibold">{formatRupiah(data.total_transaksi)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Bunga + Biaya Admin</span>
                  <span className="font-semibold">
                    {formatRupiah(
                      parseFloat(selectedOption.total_pembayaran) - parseFloat(data.total_transaksi)
                    )}
                  </span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total Pembayaran</span>
                  <span>{formatRupiah(selectedOption.total_pembayaran)}</span>
                </div>
              </div>
            </>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isCreatingTransaction}
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={!selectedOption || isCreatingTransaction}
            >
              {isCreatingTransaction ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses
                </>
              ) : (
                "Buat Transaksi Kredit"
              )}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Rekomendasi Pembayaran Kredit</DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};

export default KreditPaymentModal;
