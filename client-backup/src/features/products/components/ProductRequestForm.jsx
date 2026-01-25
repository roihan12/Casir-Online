import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Plus, 
  Trash2, 
  AlertCircle, 
  Package, 
  PlusCircle, 
  Loader2 
} from "lucide-react";
import { Button } from "@common/components/ui/button";
import { Input } from "@common/components/ui/input";
import { Label } from "@common/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@common/components/ui/select";
import { Badge } from "@common/components/ui/badge";
import productRequestService from "../services/productRequestService";
import produkMasterService from "../services/produkMasterService";

const productRequestSchema = z.object({
  requestType: z.enum(["new_product", "restock"]),
  cabangId: z.string().min(1, "Cabang wajib dipilih"),
  prioritas: z.enum(["normal", "urgent", "critical"]),
  alasan: z.string().optional().nullable(),
  catatan: z.string().optional().nullable(),
  items: z.array(z.object({
    produkMasterId: z.string().optional().nullable(),
    namaProduk: z.string().optional().nullable(),
    sku: z.string().optional().nullable(),
    jumlahDiminta: z.number().int().min(1, "Jumlah minimal 1"),
    hargaBeli: z.number().min(0).optional().nullable(),
    hargaJual: z.number().min(0).optional().nullable(),
    hargaGrosir: z.number().min(0).optional().nullable(),
    catatan: z.string().optional().nullable(),
    barcode: z.string().optional().nullable(),
    deskripsi: z.string().optional().nullable(),
    kategoriId: z.string().optional().nullable(),
    brand: z.string().optional().nullable(),
    satuan: z.string().optional().nullable(),
    berat: z.number().optional().nullable(),
    dimensiP: z.number().optional().nullable(),
    dimensiL: z.number().optional().nullable(),
    dimensiT: z.number().optional().nullable(),
    isManagedStock: z.boolean().optional().nullable(),
    hasExpired: z.boolean().optional().nullable(),
  })).min(1, "Minimal 1 item")
}).refine(data => {
  return data.items.every(item => {
    if (data.requestType === "restock") {
      return !!item.produkMasterId;
    } else {
      return !!item.namaProduk && !!item.sku;
    }
  });
}, {
  message: "Semua item harus memiliki data yang lengkap sesuai tipe request",
  path: ["items"]
});

const ProductRequestForm = ({ requestList, branchList, userList, onSubmitSuccess, onCancel }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [produkMasterList, setProdukMasterList] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productRequestSchema),
    defaultValues: {
      requestType: "restock",
      prioritas: "normal",
      items: [{ jumlahDiminta: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const requestType = watch("requestType");

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [masterData, categories] = await Promise.all([
          produkMasterService.getAllProdukMaster(),
          produkMasterService.getCategories()
        ]);
        setProdukMasterList(masterData.data || masterData || []);
        setKategoriList(categories || []);
      } catch (error) {
        console.error("Error loading master data:", error);
      }
    };
    loadMasterData();
  }, []);

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      const response = await productRequestService.createRequest(data);
      // If the page expects the whole list back, we might need to refetch
      // but usually onSubmitSuccess just triggers a refresh or close
      onSubmitSuccess(response);
    } catch (error) {
      console.error("Error creating request:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipe Request</Label>
          <Select 
            onValueChange={(val) => setValue("requestType", val)} 
            defaultValue="restock"
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih Tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="restock">Restock Produk</SelectItem>
              <SelectItem value="new_product">Produk Baru</SelectItem>
            </SelectContent>
          </Select>
          {errors.requestType && <p className="text-red-500 text-xs">{errors.requestType.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Cabang</Label>
          <Select 
            onValueChange={(val) => setValue("cabangId", val)}
            value={watch("cabangId")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih Cabang" />
            </SelectTrigger>
            <SelectContent>
              {branchList.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.namaCabang || branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.cabangId && <p className="text-red-500 text-xs">{errors.cabangId.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Prioritas</Label>
          <Select 
            onValueChange={(val) => setValue("prioritas", val)} 
            defaultValue="normal"
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih Prioritas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Alasan Request</Label>
        <Input {...register("alasan")} placeholder="Contoh: Stok menipis, permintaan pelanggan" />
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Item Request</h3>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={() => append({ jumlahDiminta: 1 })}
          >
            <Plus className="h-4 w-4 mr-1" /> Tambah Item
          </Button>
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="p-4 border rounded-lg bg-gray-50 relative group">
              <button
                type="button"
                onClick={() => remove(index)}
                className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {requestType === "restock" ? (
                  <div className="md:col-span-2 space-y-2">
                    <Label>Pilih Produk</Label>
                    <Select 
                      onValueChange={(val) => setValue(`items.${index}.produkMasterId`, val)}
                      value={watch(`items.${index}.produkMasterId`)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Cari Produk..." />
                      </SelectTrigger>
                      <SelectContent>
                        {produkMasterList.map((produk) => (
                          <SelectItem key={produk.id} value={produk.id}>
                            {produk.namaProduk} ({produk.sku})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Nama Produk</Label>
                      <Input {...register(`items.${index}.namaProduk`)} placeholder="Nama Produk Baru" />
                    </div>
                    <div className="space-y-2">
                      <Label>SKU</Label>
                      <Input {...register(`items.${index}.sku`)} placeholder="SKU" />
                    </div>
                  </>
                )}
                
                <div className="space-y-2">
                  <Label>Jumlah</Label>
                  <Input 
                    type="number" 
                    {...register(`items.${index}.jumlahDiminta`, { valueAsNumber: true })} 
                  />
                  {errors.items?.[index]?.jumlahDiminta && (
                    <p className="text-red-500 text-xs">{errors.items[index].jumlahDiminta.message}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        {errors.items && <p className="text-red-500 text-sm mt-2">{errors.items.message}</p>}
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Kirim Request
        </Button>
      </div>
    </form>
  );
};

export default ProductRequestForm;
