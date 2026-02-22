import React, { useState } from 'react';
import { useKomponenGaji } from '../hooks/usePayrollQueries';
import { useDeleteKomponen } from '../hooks/usePayrollMutations';
import KomponenGajiFormDialog from '../components/KomponenGajiFormDialog';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../common/components/ui/card';
import { Button } from '../../../common/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../common/components/ui/select';
import { Plus, Trash2, Edit, Layers, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

const KomponenGajiPage = () => {
  const [tipeFilter, setTipeFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedKomponen, setSelectedKomponen] = useState(null);

  const { data: komponenData, isLoading } = useKomponenGaji({
    tipe: tipeFilter !== 'all' ? tipeFilter : undefined,
    isActive: true
  });
  
  const { mutate: deleteKomponen, isPending: isDeleting } = useDeleteKomponen();

  const handleEdit = (komponen) => {
    setSelectedKomponen(komponen);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setSelectedKomponen(null);
    setIsFormOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus komponen gaji ini?')) {
      deleteKomponen(id);
    }
  };

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(angka);
  };

  const dataList = komponenData?.data || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Komponen Gaji</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola daftar tunjangan dan potongan yang berlaku untuk karyawan.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 shadow-sm text-white">
            <Plus className="w-4 h-4 mr-2" /> Tambah Komponen
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="border-b bg-white pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <Layers className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Daftar Komponen</CardTitle>
                <CardDescription className="text-xs mt-0.5">Master data tunjangan dan potongan</CardDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-full sm:w-48 relative">
                <Select value={tipeFilter} onValueChange={setTipeFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Semua Tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tipe</SelectItem>
                    <SelectItem value="tunjangan">Tunjangan (+)</SelectItem>
                    <SelectItem value="potongan">Potongan (-)</SelectItem>
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
                  <th className="px-6 py-4">Nama Komponen</th>
                  <th className="px-6 py-4">Tipe</th>
                  <th className="px-6 py-4 text-right">Nilai Default</th>
                  <th className="px-6 py-4 hidden sm:table-cell">Keterangan</th>
                  <th className="px-6 py-4 text-center">Prorate</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr><td colSpan={6} className="text-center py-10">Memuat data...</td></tr>
                ) : dataList.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-slate-500">Tidak ada data komponen gaji.</td></tr>
                ) : (
                  dataList.map((item) => {
                    const id = item.komponen_id || item.id;
                    const isTunjangan = item.tipe === 'tunjangan';
                    return (
                      <tr key={id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-semibold text-slate-900">{item.nama}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isTunjangan ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                          }`}>
                            {isTunjangan ? <ArrowUpCircle className="w-3 h-3 mr-1" /> : <ArrowDownCircle className="w-3 h-3 mr-1" />}
                            {item.tipe}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-slate-700">
                          {formatRupiah(item.nilai)}
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs hidden sm:table-cell max-w-[200px] truncate" title={item.keterangan || '-'}>
                          {item.keterangan || '-'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {item.is_prorate || item.isProrate ? (
                            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">Ya</span>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => handleEdit(item)}
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(id)}
                            disabled={isDeleting}
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
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

      <KomponenGajiFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} data={selectedKomponen} />
    </div>
  );
};

export default KomponenGajiPage;
