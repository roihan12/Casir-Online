import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { importHariLiburSchema } from '../validations/leaveValidation';
import { useImportHariLibur } from '../hooks/useLeaveMutations';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../../common/components/ui/dialog';
import { Button } from '../../../common/components/ui/button';
import { Input } from '../../../common/components/ui/input';
import { Label } from '../../../common/components/ui/label';

const HariLiburImportDialog = ({ open, onOpenChange }) => {
  const { mutate: importHariLibur, isPending } = useImportHariLibur();
  
  const form = useForm({
    resolver: zodResolver(importHariLiburSchema),
  });

  const onSubmit = (data) => {
    // Backend API expects { holidays: [{ tanggal, nama, isRecurring }] } 
    // Wait: If the API expects JSON array `holidays`, parsing CSV on frontend might be needed.
    // If we assume API accepts simply the JSON object, we will rely on an imaginary JSON file for now, 
    // or standard multipart/form-data. The API docs says:
    // Request Body: { "holidays": [ ... ] }
    // Let's read the file and parse it. For simplicity, we can parse JSON file directly or let user just upload JSON.
    // Let's implement reading JSON file and passing its content since the API expects JSON payload.
    
    const file = data.file[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonContent = JSON.parse(e.target.result);
          // Assuming the json file content has formatting: { holidays: [...] } or just [...]
          const payload = Array.isArray(jsonContent) ? { holidays: jsonContent } : jsonContent;
          
          importHariLibur(payload, {
            onSuccess: () => {
              form.reset();
              onOpenChange(false);
            }
          });
        } catch (error) {
          alert('Format file JSON tidak valid. Pastikan formatnya benar.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      onOpenChange(val);
      if (!val) form.reset();
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import Hari Libur</DialogTitle>
          <DialogDescription>
            Upload file JSON dengan struktur data array `holidays`.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="file">File JSON</Label>
            <Input 
              id="file"
              type="file"
              accept=".json,application/json"
              {...form.register('file')}
            />
            {form.formState.errors.file && (
              <span className="text-sm text-red-500">{form.formState.errors.file.message}</span>
            )}
            <p className="text-xs text-muted-foreground">Contoh format: &#123; "holidays": [...] &#125;</p>
          </div>
          
          <div className="flex justify-end pt-6 space-x-2">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={isPending}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isPending ? "Mengimport..." : "Import"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default HariLiburImportDialog;
