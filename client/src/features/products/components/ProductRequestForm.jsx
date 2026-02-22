import React, { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
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


import { useCreateProductRequest } from "../hooks/useProductRequest";
import { useProdukMasterList, useCategories } from "../hooks/useProdukMasterQueries";

const productRequestSchema = z.object({
  requestType: z.enum(["new_product", "restock"], {
    required_error: "Tipe request wajib dipilih",
  }),
  cabangId: z.string().min(1, "Cabang wajib dipilih"),
  prioritas: z.enum(["normal", "urgent", "critical"]).default("normal"),
  alasan: z.string().optional().nullable(),
  catatan: z.string().optional().nullable(),
  items: z.array(z.object({
    // Shared fields
    jumlahDiminta: z.number({ 
      invalid_type_error: "Jumlah harus berupa angka" 
    }).int().min(1, "Jumlah minimal 1"),
    catatan: z.string().optional().nullable(),
    
    // Prices
    hargaBeli: z.number().min(0).optional().nullable(),
    hargaJual: z.number().min(0).optional().nullable(),
    hargaGrosir: z.number().min(0).optional().nullable(),

    // Restock specific
    produkMasterId: z.string().optional().nullable(),

    // New Product specific
    namaProduk: z.string().max(100, "Nama produk maksimal 100 karakter").optional().nullable(),
    sku: z.string().max(50, "SKU maksimal 50 karakter").optional().nullable(),
    barcode: z.string().max(50, "Barcode maksimal 50 karakter").optional().nullable(),
    deskripsi: z.string().optional().nullable(),
    kategoriId: z.string().optional().nullable(),
    brand: z.string().max(100, "Brand maksimal 100 karakter").optional().nullable(),
    satuan: z.string().max(50, "Satuan maksimal 50 karakter").optional().nullable(),
    
    // Dimensions & Specs
    berat: z.number().min(0).optional().nullable(),
    dimensiP: z.number().min(0).optional().nullable(),
    dimensiL: z.number().min(0).optional().nullable(),
    dimensiT: z.number().min(0).optional().nullable(),
    isManagedStock: z.boolean().optional().nullable(),
    hasExpired: z.boolean().optional().nullable(),
  })).min(1, "Minimal 1 item")
}).superRefine((data, ctx) => {
  data.items.forEach((item, index) => {
    if (data.requestType === "restock") {
      if (!item.produkMasterId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Produk wajib dipilih untuk restock request",
          path: ["items", index, "produkMasterId"],
        });
      }
    } else { // new_product
      if (!item.namaProduk) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Nama produk wajib diisi untuk produk baru",
          path: ["items", index, "namaProduk"],
        });
      }
      if (!item.sku) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "SKU wajib diisi untuk produk baru",
          path: ["items", index, "sku"],
        });
      }
    }
  });
});

const ProductRequestForm = ({ requestList, branchList, userList, onSubmitSuccess, onCancel }) => {
  const { data: produkMasterListResponse } = useProdukMasterList();
  const produkMasterList = Array.isArray(produkMasterListResponse) 
    ? produkMasterListResponse 
    : (produkMasterListResponse?.data || []);
    
  // While useCategories from useProdukMasterQueries might work, checking if we need explicit mapping
  const { data: kategoriListResponse } = useCategories();
  const kategoriList = Array.isArray(kategoriListResponse)
    ? kategoriListResponse
    : (kategoriListResponse?.data || []);

  const createMutation = useCreateProductRequest();
  const isLoading = createMutation.isPending;

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

  const onSubmit = (data) => {
    console.log("Form submitting with data:", data);
    
    try {
      createMutation.mutate(data, {
        onSuccess: (response) => {
          console.log("Product request created successfully:", response);
          // Call parent's success handler to close modal and refresh data
          onSubmitSuccess(response);
        },
        onError: (error) => {
          // Error is already handled in the hook with toast notification
          console.error("Product request creation failed:", error);
          console.error("Error details:", error.response?.data);
        },
      });
    } catch (error) {
      console.error("Unexpected error during form submission:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
      <div className="overflow-y-auto max-h-[60vh] sm:max-h-[70vh] px-1 -mx-1 py-1 space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm">Tipe Request</Label>
            <Controller
              name="requestType"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="h-9 sm:h-10 text-sm">
                    <SelectValue placeholder="Pilih Tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="restock">Restock Produk</SelectItem>
                    <SelectItem value="new_product">Produk Baru</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.requestType && <p className="text-red-500 text-xs">{errors.requestType.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Cabang</Label>
            <Controller
              name="cabangId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="h-9 sm:h-10 text-sm">
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
              )}
            />
            {errors.cabangId && <p className="text-red-500 text-xs">{errors.cabangId.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm">Prioritas</Label>
            <Controller
              name="prioritas"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="h-9 sm:h-10 text-sm">
                    <SelectValue placeholder="Pilih Prioritas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Alasan Request</Label>
          <Input 
            {...register("alasan")} 
            placeholder="Contoh: Stok menipis, permintaan pelanggan" 
            className="h-9 sm:h-10 text-sm"
          />
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-medium">Item Request</h3>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => append({ jumlahDiminta: 1 })}
              className="h-8 sm:h-9 text-xs sm:text-sm"
            >
              <Plus className="h-4 w-4 mr-1" /> Tambah Item
            </Button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="p-3 sm:p-4 border rounded-lg bg-gray-50 relative group">
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="absolute top-2 right-2 text-red-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                <div className="grid grid-cols-1 gap-4">
                  {requestType === "restock" ? (
                    <div className="space-y-2">
                      <Label className="text-sm">Pilih Produk</Label>
                      <Controller
                        name={`items.${index}.produkMasterId`}
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="h-9 text-sm">
                              <SelectValue placeholder="Cari Produk..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-48 overflow-y-auto">
                              {produkMasterList.map((produk) => (
                                <SelectItem key={produk.id} value={produk.id}>
                                  {produk.namaProduk} ({produk.sku})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.items?.[index]?.produkMasterId && (
                        <p className="text-red-500 text-xs mt-1">{errors.items[index].produkMasterId.message}</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Basic Info */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-sm">Nama Produk</Label>
                          <Input 
                            {...register(`items.${index}.namaProduk`)} 
                            placeholder="Nama Produk Baru" 
                            className="h-9 text-sm"
                          />
                          {errors.items?.[index]?.namaProduk && (
                            <p className="text-red-500 text-xs">{errors.items[index].namaProduk.message}</p>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                          <div className="space-y-2">
                             <Label className="text-sm">SKU</Label>
                             <Input 
                               {...register(`items.${index}.sku`)} 
                               placeholder="SKU" 
                               className="h-9 text-sm"
                             />
                             {errors.items?.[index]?.sku && (
                               <p className="text-red-500 text-xs">{errors.items[index].sku.message}</p>
                             )}
                          </div>
                          <div className="space-y-2">
                             <Label className="text-sm">Barcode</Label>
                             <Input 
                               {...register(`items.${index}.barcode`)} 
                               placeholder="Barcode" 
                               className="h-9 text-sm"
                             />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                           <div className="space-y-2">
                             <Label className="text-sm">Kategori</Label>
                             <Controller
                               name={`items.${index}.kategoriId`}
                               control={control}
                               render={({ field }) => (
                                 <Select onValueChange={field.onChange} value={field.value}>
                                   <SelectTrigger className="h-9 text-sm">
                                     <SelectValue placeholder="Pilih Kategori" />
                                   </SelectTrigger>
                                   <SelectContent>
                                     {kategoriList.map((kat) => (
                                       <SelectItem key={kat.id} value={kat.id}>{kat.namaKategori}</SelectItem>
                                     ))}
                                   </SelectContent>
                                 </Select>
                               )}
                             />
                           </div>
                           <div className="space-y-2">
                             <Label className="text-sm">Brand</Label>
                             <Input 
                               {...register(`items.${index}.brand`)} 
                               placeholder="Brand" 
                               className="h-9 text-sm"
                             />
                           </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm">Satuan</Label>
                            <Input 
                              {...register(`items.${index}.satuan`)} 
                              placeholder="Pcs, Box, dll" 
                              className="h-9 text-sm"
                            />
                        </div>
                      </div>

                      {/* Prices & Specs */}
                      <div className="space-y-4">
                         <div className="grid grid-cols-2 gap-3 sm:gap-4">
                           <div className="space-y-2">
                             <Label className="text-sm">Harga Beli</Label>
                             <Input 
                               type="number"
                               {...register(`items.${index}.hargaBeli`, { valueAsNumber: true })} 
                               placeholder="0"
                               className="h-9 text-sm"
                             />
                           </div>
                           <div className="space-y-2">
                             <Label className="text-sm">Harga Jual</Label>
                             <Input 
                               type="number"
                               {...register(`items.${index}.hargaJual`, { valueAsNumber: true })} 
                               placeholder="0"
                               className="h-9 text-sm"
                             />
                           </div>
                         </div>
                         
                         <div className="space-y-2">
                             <Label className="text-sm">Deskripsi</Label>
                             <Input 
                               {...register(`items.${index}.deskripsi`)} 
                               placeholder="Deskripsi singkat produk" 
                               className="h-9 text-sm"
                             />
                         </div>

                         <div className="grid grid-cols-4 gap-2">
                           <div className="space-y-1">
                             <Label className="text-[10px] uppercase font-bold text-gray-500">Berat (g)</Label>
                             <Input 
                               type="number" 
                               className="text-xs px-2 h-8"
                               {...register(`items.${index}.berat`, { valueAsNumber: true })} 
                               placeholder="0" 
                             />
                           </div>
                           <div className="space-y-1">
                             <Label className="text-[10px] uppercase font-bold text-gray-500">P (cm)</Label>
                             <Input 
                               type="number" 
                               className="text-xs px-2 h-8"
                               {...register(`items.${index}.dimensiP`, { valueAsNumber: true })} 
                               placeholder="0" 
                             />
                           </div>
                           <div className="space-y-1">
                             <Label className="text-[10px] uppercase font-bold text-gray-500">L (cm)</Label>
                             <Input 
                               type="number" 
                               className="text-xs px-2 h-8"
                               {...register(`items.${index}.dimensiL`, { valueAsNumber: true })} 
                               placeholder="0" 
                             />
                           </div>
                           <div className="space-y-1">
                             <Label className="text-[10px] uppercase font-bold text-gray-500">T (cm)</Label>
                             <Input 
                               type="number" 
                               className="text-xs px-2 h-8"
                               {...register(`items.${index}.dimensiT`, { valueAsNumber: true })} 
                               placeholder="0" 
                             />
                           </div>
                         </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4 border-dashed">
                     <div className="space-y-2">
                        <Label className="text-sm">Jumlah Diminta</Label>
                        <Input 
                          type="number" 
                          {...register(`items.${index}.jumlahDiminta`, { valueAsNumber: true })} 
                          className="h-9 text-sm"
                        />
                        {errors.items?.[index]?.jumlahDiminta && (
                          <p className="text-red-500 text-xs">{errors.items[index].jumlahDiminta.message}</p>
                        )}
                     </div>
                     <div className="space-y-2">
                        <Label className="text-sm">Catatan Item</Label>
                        <Input 
                          {...register(`items.${index}.catatan`)} 
                          placeholder="Catatan khusus" 
                          className="h-9 text-sm"
                        />
                     </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {errors.items && <p className="text-red-500 text-sm mt-2">{errors.items.message}</p>}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 sm:pt-6 border-t bg-white">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="h-9 sm:h-10 text-sm px-4"
        >
          Batal
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading}
          className="h-9 sm:h-10 text-sm px-4"
        >
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Kirim Request
        </Button>
      </div>
    </form>
  );
};

export default ProductRequestForm;