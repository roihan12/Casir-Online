import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/common/utils/api';
import { useGajiPegawai } from '../hooks/usePayrollQueries';
import * as payrollMutations from '../hooks/usePayrollMutations';
import { GajiFormDialog } from '../components/GajiFormDialog';
import { TunjanganFormDialog } from '../components/TunjanganFormDialog';
import { RiwayatGajiDialog } from '../components/RiwayatGajiDialog';
import { useCabang } from '../../cabang/context/CabangContext';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../common/components/ui/card';
import { Button } from '../../../common/components/ui/button';
import { Input } from '../../../common/components/ui/input';
import { UserCircle, Wallet, History, Trash2, Plus, Edit, Search } from 'lucide-react';

const PegawaiPayrollPage = () => {
  const { selectedCabang } = useCabang();
  const cabangId = selectedCabang?.id === 'global' ? '' : (selectedCabang?.id || '');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  // Dialog states
  const [isGajiOpen, setIsGajiOpen] = useState(false);
  const [isTunjanganOpen, setIsTunjanganOpen] = useState(false);
  const [isRiwayatOpen, setIsRiwayatOpen] = useState(false);
  const [selectedTunjangan, setSelectedTunjangan] = useState(null);

  // Fetch employees
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users', 'karyawan', cabangId],
    queryFn: async () => {
      const res = await api.get('/users', { params: { cabangId, role: 'karyawan' } });
      return res.data;
    }
  });

  const users = usersData?.data || [];
  const filteredUsers = users.filter(u => 
    u.nama_lengkap?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fetch selected user's payroll data
  const { data: gajiData, isLoading: isLoadingGaji } = useGajiPegawai(selectedUser?.id);
  const { mutate: deleteTunjangan, isPending: isDeletingTunjangan } = payrollMutations.useDeleteTunjangan();

  const handleEditGaji = () => {
    setIsGajiOpen(true);
  };

  const handleAddTunjangan = () => {
    setSelectedTunjangan(null);
    setIsTunjanganOpen(true);
  };

  const handleEditTunjangan = (t) => {
    setSelectedTunjangan(t);
    setIsTunjanganOpen(true);
  };

  const handleDeleteTunjangan = (id) => {
    if (window.confirm('Hapus tunjangan karyawan ini?')) {
      deleteTunjangan(id);
    }
  };

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(angka || 0);
  };

  const gaji = gajiData?.data;
  const tunjanganList = gaji?.tunjangan || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Data Gaji Karyawan</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola gaji pokok dan assign tunjangan per karyawan.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar: User List */}
        <div className="lg:col-span-1 border rounded-xl bg-white shadow-sm flex flex-col h-[calc(100vh-12rem)] min-h-[500px]">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Cari nama karyawan..." 
                className="pl-9 h-9 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {isLoadingUsers ? (
              <div className="text-center py-10 text-slate-500 text-sm">Memuat karyawan...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">Karyawan tidak ditemukan.</div>
            ) : (
              <div className="space-y-1">
                {filteredUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                      selectedUser?.id === user.id 
                        ? 'bg-blue-50 border-blue-200 border text-blue-900' 
                        : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                    }`}
                  >
                    <div className={`p-2 rounded-full ${selectedUser?.id === user.id ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                      <UserCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{user.nama_lengkap || user.username}</div>
                      <div className="text-[10px] text-slate-500">{user.email || '-'}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content: Payroll Details */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedUser ? (
            <Card className="h-full border-dashed shadow-none border-2 flex items-center justify-center min-h-[500px] bg-slate-50/50">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center text-slate-500">
                <Wallet className="w-12 h-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-1">Pilih Karyawan</h3>
                <p className="max-w-xs text-sm">Pilih karyawan dari daftar di sebelah kiri untuk melihat dan mengelola data gajinya.</p>
              </CardContent>
            </Card>
          ) : isLoadingGaji ? (
            <Card className="min-h-[500px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </Card>
          ) : (
            <>
              {/* Card Gaji Pokok */}
              <Card className="border-none shadow-sm bg-white overflow-hidden relative">
                <div className="absolute top-0 right-0 -tr-translate-x-4 -mt-4 w-32 h-32 rounded-full bg-blue-50/50 blur-3xl z-0 pointer-events-none"></div>
                <CardHeader className="border-b bg-white pb-4 relative z-10 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-blue-600" /> Detail Gaji
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Informasi gaji pokok untuk <strong>{selectedUser.nama_lengkap}</strong>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsRiwayatOpen(true)} className="h-8">
                      <History className="w-4 h-4 mr-2" /> Riwayat
                    </Button>
                    <Button size="sm" onClick={handleEditGaji} className="h-8 bg-blue-600 hover:bg-blue-700 text-white">
                      <Edit className="w-4 h-4 mr-2" /> Update Gaji
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6 relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <div className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-semibold">Gaji Pokok</div>
                      <div className="text-2xl font-black text-slate-900">{formatRupiah(gaji?.gaji_pokok)}</div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <div className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-semibold">Tarif Lembur / Jam</div>
                      <div className="text-xl font-bold text-slate-800">{formatRupiah(gaji?.tarif_lembur)}</div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <div className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-semibold">Tipe Pembayaran</div>
                      <div className="text-lg font-bold text-slate-800 capitalize">{gaji?.tipe_gaji || 'Bulanan'}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card Tunjangan Aktif */}
              <Card className="border-none shadow-sm bg-white">
                <CardHeader className="border-b bg-white pb-4 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Tunjangan & Potongan Aktif</CardTitle>
                    <CardDescription className="mt-1">Daftar komponen tambahan yang di-assign ke karyawan ini</CardDescription>
                  </div>
                  <Button size="sm" onClick={handleAddTunjangan} variant="outline" className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50">
                    <Plus className="w-4 h-4 mr-1" /> Assign Tunjangan
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left align-middle border-collapse">
                      <thead className="bg-slate-50/80 text-slate-500 border-b text-[11px] font-bold uppercase tracking-wider">
                        <tr>
                          <th className="px-6 py-4">Komponen</th>
                          <th className="px-6 py-4 text-right">Nilai</th>
                          <th className="px-6 py-4 text-center">Masa Berlaku</th>
                          <th className="px-6 py-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {tunjanganList.length === 0 ? (
                          <tr><td colSpan={4} className="text-center py-10 text-slate-500">Belum ada tunjangan/potongan yang di-assign.</td></tr>
                        ) : (
                          tunjanganList.map((t) => {
                            const isPotongan = t.komponen?.tipe === 'potongan';
                            const nilai = Number(t.nilai_override) > 0 ? t.nilai_override : t.komponen?.nilai;
                            
                            return (
                              <tr key={t.tunjangan_id || t.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="font-semibold text-slate-900">{t.komponen_gaji?.nama || 'Unknown'}</div>
                                  <div className={`text-[10px] font-bold uppercase mt-1 ${isPotongan ? 'text-red-500' : 'text-emerald-500'}`}>
                                    {isPotongan ? 'Potongan' : 'Tunjangan'}
                                    {Number(t.nilai_override) > 0 && ' (Override)'}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-right font-bold text-slate-700">
                                  {isPotongan && '-'} {formatRupiah(nilai)}
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <div className="text-[11px] text-slate-600">
                                    {new Date(t.berlaku_dari).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'})} 
                                    {' - '} 
                                    {t.berlaku_sampai ? new Date(t.berlaku_sampai).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'}) : 'Seterusnya'}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-right space-x-1">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    onClick={() => handleEditTunjangan(t)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleDeleteTunjangan(t.tunjangan_id || t.id)}
                                    disabled={isDeletingTunjangan}
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
            </>
          )}
        </div>
      </div>

      <GajiFormDialog
        open={isGajiOpen}
        onOpenChange={setIsGajiOpen}
        data={gaji}
        userId={selectedUser?.id}
        userName={selectedUser?.nama_lengkap}
      />

      <TunjanganFormDialog
        open={isTunjanganOpen}
        onOpenChange={setIsTunjanganOpen}
        data={selectedTunjangan}
        userId={selectedUser?.id}
      />

      <RiwayatGajiDialog
        open={isRiwayatOpen}
        onOpenChange={setIsRiwayatOpen}
        userId={selectedUser?.id}
        userName={selectedUser?.nama_lengkap}
      />
    </div>
  );
};

export default PegawaiPayrollPage;
