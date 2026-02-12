import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@common/components/ui/dialog";
import { Button } from "@common/components/ui/button";
import { Input } from "@common/components/ui/input";
import { Label } from "@common/components/ui/label";
import { Loader2, CreditCard } from "lucide-react";
import { formatRupiah } from "@common/utils/formatter";
import api from "@common/utils/api";
import toast from "react-hot-toast";

const METODE_PEMBAYARAN = [
  { value: "TUNAI", label: "Tunai" },
  { value: "TRANSFER", label: "Transfer Bank" },
  { value: "KARTU_DEBIT", label: "Kartu Debit" },
  { value: "KARTU_KREDIT", label: "Kartu Kredit" },
  { value: "QRIS", label: "QRIS" },
  { value: "E_WALLET", label: "E-Wallet" },
];

const PelunasanModal = ({ 
  isOpen, 
  onClose, 
  transaksiId, 
  totalTagihan = 0,
  sisaTagihan = 0,
  onSuccess 
}) => {
  const [jumlahBayar, setJumlahBayar] = useState("");
  const [metodePembayaran, setMetodePembayaran] = useState("TUNAI");
  const [referensiPembayaran, setReferensiPembayaran] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setJumlahBayar(sisaTagihan || totalTagihan || "");
      setMetodePembayaran("TUNAI");
      setReferensiPembayaran("");
      setKeterangan("");
    }
  }, [isOpen, sisaTagihan, totalTagihan]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const amount = parseFloat(jumlahBayar) || 0;
    if (amount <= 0) {
      toast.error("Masukkan jumlah pembayaran yang valid");
      return;
    }

    const currentSisa = sisaTagihan > 0 ? sisaTagihan : totalTagihan;
    const isLunas = amount >= currentSisa;
    
    // Calculate kembalian for payload
    const kembalianAmount = amount > currentSisa ? amount - currentSisa : 0;

    setIsSubmitting(true);
    try {
      const payload = {
        transaksi_id: transaksiId,
        jumlah_bayar: amount,
        metode_pembayaran: metodePembayaran,
        status_pembayaran: isLunas ? "LUNAS" : "BELUM_LUNAS",
        nomor_referensi: referensiPembayaran || null,
        provider: "", // backend validation allows allow(null, "")
        jumlah_kembali: kembalianAmount,
        keterangan: keterangan || "Pelunasan via Web",
        bukti_bayar_url: null,
        generate_receipt: true
      };

      const response = await api.post("/transaksi/payment", payload);

      toast.success("Pembayaran berhasil ditambahkan");
      
      if (onSuccess) {
        onSuccess(response.data);
      }
      onClose();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error.response?.data?.errors || "Gagal menambahkan pembayaran");
    } finally {
      setIsSubmitting(false);
    }
  };

  const kembalian = Math.max(0, parseFloat(jumlahBayar || 0) - (sisaTagihan || totalTagihan));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Pelunasan Pembayaran
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Info tagihan */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Tagihan</span>
              <span className="font-medium">{formatRupiah(totalTagihan)}</span>
            </div>
            {sisaTagihan > 0 && sisaTagihan !== totalTagihan && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Sisa Tagihan</span>
                <span className="font-semibold text-orange-600">{formatRupiah(sisaTagihan)}</span>
              </div>
            )}
          </div>

          {/* Jumlah Bayar */}
          <div className="space-y-2">
            <Label htmlFor="jumlahBayar">Jumlah Bayar</Label>
            <Input
              id="jumlahBayar"
              type="number"
              value={jumlahBayar}
              onChange={(e) => setJumlahBayar(e.target.value)}
              placeholder="Masukkan jumlah bayar"
              min="1"
              required
              className="text-lg font-semibold"
            />
          </div>

          {/* Metode Pembayaran */}
          <div className="space-y-2">
            <Label htmlFor="metodePembayaran">Metode Pembayaran</Label>
            <select
              id="metodePembayaran"
              value={metodePembayaran}
              onChange={(e) => setMetodePembayaran(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              {METODE_PEMBAYARAN.map((metode) => (
                <option key={metode.value} value={metode.value}>
                  {metode.label}
                </option>
              ))}
            </select>
          </div>

            {/* Referensi (for non-cash payments) */}
          {metodePembayaran !== "TUNAI" && (
            <div className="space-y-2">
              <Label htmlFor="referensi">Nomor Referensi (opsional)</Label>
              <Input
                id="referensi"
                type="text"
                value={referensiPembayaran}
                onChange={(e) => setReferensiPembayaran(e.target.value)}
                placeholder="No. Kartu / No. Transaksi / ID"
              />
            </div>
          )}

          {/* Keterangan */}
          <div className="space-y-2">
            <Label htmlFor="keterangan">Keterangan (opsional)</Label>
            <Input
              id="keterangan"
              type="text"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Catatan pelunasan"
            />
          </div>

          {/* Kembalian */}
          {kembalian > 0 && metodePembayaran === "TUNAI" && (
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex justify-between">
                <span className="text-green-700 font-medium">Kembalian</span>
                <span className="text-green-700 font-bold text-lg">
                  {formatRupiah(kembalian)}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Bayar Sekarang"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PelunasanModal;
