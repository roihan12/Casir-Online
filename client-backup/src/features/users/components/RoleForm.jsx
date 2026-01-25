import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@common/components/ui/button";
import { Input } from "@common/components/ui/input";
import { Label } from "@common/components/ui/label";
import { Loader2 } from "lucide-react";

const roleSchema = z.object({
  namaRole: z.string().min(3, "Nama role minimal 3 karakter").max(50, "Nama role maksimal 50 karakter"),
  deskripsi: z.string().max(200, "Deskripsi maksimal 200 karakter").optional().nullable().or(z.literal("")),
});

const RoleForm = ({ role, onSubmit, onCancel, isLoading }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      namaRole: "",
      deskripsi: "",
    },
  });

  useEffect(() => {
    if (role) {
      reset({
        namaRole: role.namaRole || role.name || "",
        deskripsi: role.deskripsi || "",
      });
    } else {
      reset({
        namaRole: "",
        deskripsi: "",
      });
    }
  }, [role, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-2">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="namaRole" className="text-sm font-semibold text-slate-700">
            Nama Role <span className="text-red-500">*</span>
          </Label>
          <Input
            id="namaRole"
            placeholder="Misal: Administrator, Kasir, Manager"
            className={`h-11 border-slate-200 focus:ring-2 focus:ring-indigo-500/20 transition-all ${
              errors.namaRole ? "border-red-500 bg-red-50/30" : "hover:border-slate-300"
            }`}
            {...register("namaRole")}
          />
          {errors.namaRole && (
            <p className="text-xs font-medium text-red-500 animate-in fade-in slide-in-from-top-1">
              {errors.namaRole.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="deskripsi" className="text-sm font-semibold text-slate-700">
            Deskripsi
          </Label>
          <Input
            id="deskripsi"
            placeholder="Berikan penjelasan singkat fungsi role ini"
            className="h-11 border-slate-200 focus:ring-2 focus:ring-indigo-500/20 hover:border-slate-300 transition-all"
            {...register("deskripsi")}
          />
          {errors.deskripsi && (
            <p className="text-xs font-medium text-red-500 animate-in fade-in slide-in-from-top-1">
              {errors.deskripsi.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
        <Button 
          type="button" 
          variant="ghost" 
          onClick={onCancel}
          className="px-6 hover:bg-slate-100 text-slate-600 font-medium"
        >
          Batal
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading || (role && !isDirty)}
          className={`px-8 font-semibold shadow-md transition-all ${
            role 
              ? "bg-indigo-600 hover:bg-indigo-700 text-white" 
              : "bg-emerald-600 hover:bg-emerald-700 text-white"
          }`}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : role ? (
            "Simpan Perubahan"
          ) : (
            "Buat Role Baru"
          )}
        </Button>
      </div>
    </form>
  );
};

export default RoleForm;
