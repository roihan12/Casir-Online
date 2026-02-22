import React, { useState } from 'react';
import { useHariLibur } from '../hooks/useLeaveQueries';
import { useDeleteHariLibur } from '../hooks/useLeaveMutations';
import HariLiburFormDialog from '../components/HariLiburFormDialog';
import HariLiburImportDialog from '../components/HariLiburImportDialog';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../common/components/ui/card';
import { Button } from '../../../common/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../common/components/ui/select';
import { Calendar, Plus, Upload, Trash2, Search } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const HariLiburPage = () => {
  const currentYear = new Date().getFullYear().toString();
  const [tahun, setTahun] = useState(currentYear);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const { data: hariLiburData, isLoading } = useHariLibur({ tahun });
  const { mutate: deleteHariLibur, isPending: isDeleting } = useDeleteHariLibur();

  const handleDelete = (idLibur) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus hari libur ini?')) {
      deleteHariLibur(idLibur);
    }
  };

  const holidays = hariLiburData?.data || [];
  
  const years = [
    (parseInt(currentYear) - 1).toString(),
    currentYear,
    (parseInt(currentYear) + 1).toString(),
    (parseInt(currentYear) + 2).toString()
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Hari Libur</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola hari libur nasional dan operasional perusahaan.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsImportOpen(true)} className="bg-white">
            <Upload className="w-4 h-4 mr-2" /> Import Bulk
          </Button>
          <Button onClick={() => setIsFormOpen(true)} className="bg-blue-600 hover:bg-blue-700 shadow-sm text-white">
            <Plus className="w-4 h-4 mr-2" /> Tambah Libur
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="border-b bg-white pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Daftar Hari Libur</CardTitle>
                <CardDescription className="text-xs mt-0.5">Tampilan data libur untuk tahun {tahun}</CardDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-full sm:w-40 relative">
                <Select value={tahun} onValueChange={setTahun}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Tahun" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left align-middle border-collapse">
              <thead className="bg-slate-50/80 text-slate-500 border-b text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Tanggal</th>
                  <th className="px-6 py-4">Nama Libur</th>
                  <th className="px-6 py-4 text-center w-32">Status</th>
                  <th className="px-6 py-4 text-right w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                        <span className="text-muted-foreground animate-pulse text-xs">Memuat data...</span>
                      </div>
                    </td>
                  </tr>
                ) : holidays.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
                          <Search className="h-6 w-6 text-slate-400" />
                        </div>
                        <p className="font-medium text-slate-900 mt-2">Tidak ada data</p>
                        <p className="text-xs">Belum ada hari libur di tahun {tahun}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  holidays.map((libur) => {
                    const idLibur = libur.libur_id || libur.id;
                    const dateObj = new Date(libur.tanggal);
                    const isPassed = dateObj < new Date(new Date().setHours(0,0,0,0));
                    
                    return (
                      <tr key={idLibur} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-3.5">
                          <div className="flex flex-col">
                            <span className={`font-semibold ${isPassed ? 'text-slate-500' : 'text-slate-900'}`}>
                              {format(dateObj, 'd MMMM yyyy', { locale: id })}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {format(dateObj, 'EEEE', { locale: id })}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className={`font-medium ${isPassed ? 'text-slate-500' : 'text-slate-800'}`}>
                            {libur.nama}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          {libur.is_recurring ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm">
                              Berulang
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              Sekali
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 bg-white shadow-sm border"
                            onClick={() => handleDelete(idLibur)}
                            disabled={isDeleting}
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <HariLiburFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} />
      <HariLiburImportDialog open={isImportOpen} onOpenChange={setIsImportOpen} />
    </div>
  );
};

export default HariLiburPage;
