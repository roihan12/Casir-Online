import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@common/components/ui/button";
import { Input } from "@common/components/ui/input";
import { Label } from "@common/components/ui/label";
import { Loader2 } from "lucide-react";

const permissionSchema = z.object({
  name: z.string().min(3, "Nama permission minimal 3 karakter"),
  description: z.string().min(5, "Deskripsi minimal 5 karakter"),
  module: z.string().min(2, "Module minimal 2 karakter"),
  action: z.enum(["CREATE", "READ", "UPDATE", "DELETE", "MANAGE"]),
});

const PermissionForm = ({ permission, onSubmit, onCancel, isLoading }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(permissionSchema),
    defaultValues: {
      name: "",
      description: "",
      module: "",
      action: "READ",
    },
  });

  useEffect(() => {
    if (permission) {
      reset({
        name: permission.name || "",
        description: permission.description || "",
        module: permission.module || "",
        action: permission.action || "READ",
      });
    }
  }, [permission, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nama Permission</Label>
        <Input
          id="name"
          placeholder="Contoh: user:create"
          {...register("name")}
        />
        {errors.name && (
          <p className="text-xs text-red-500">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Deskripsi</Label>
        <Input
          id="description"
          placeholder="Deskripsi detail permission"
          {...register("description")}
        />
        {errors.description && (
          <p className="text-xs text-red-500">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="module">Module</Label>
          <Input
            id="module"
            placeholder="Contoh: users"
            {...register("module")}
          />
          {errors.module && (
            <p className="text-xs text-red-500">{errors.module.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="action">Action</Label>
          <select
            id="action"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            {...register("action")}
          >
            <option value="READ">READ</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="MANAGE">MANAGE</option>
          </select>
          {errors.action && (
            <p className="text-xs text-red-500">{errors.action.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {permission ? "Update Permission" : "Tambah Permission"}
        </Button>
      </div>
    </form>
  );
};

export default PermissionForm;
