import React, { useState, useMemo } from "react";
import { Plus, Trash2, UserPlus, ArrowRightLeft, Users, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../common/components/ui/dialog";
import { Button } from "../../../common/components/ui/button";
import { Input } from "../../../common/components/ui/input";
import { Label } from "../../../common/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../common/components/ui/tabs";
import { Card, CardContent } from "../../../common/components/ui/card";
import { Badge } from "../../../common/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../common/components/ui/select";
import { useReguList } from "../hooks/useRegu";
import {
  useCreateRegu,
  useUpdateRegu,
  useDeleteRegu,
  useAddReguMembers,
  useRemoveReguMembers,
  useMoveReguMembers,
} from "../hooks/useReguMutation";
import { useUsers } from "../../users/hooks/useUsers";

const ReguManagementDialog = ({ open, onOpenChange, cabangId }) => {
  const [activeTab, setActiveTab] = useState("list");
  const [newReguName, setNewReguName] = useState("");
  const [editingRegu, setEditingRegu] = useState(null);
  const [selectedReguId, setSelectedReguId] = useState("");

  // Data Fetching
  const { data: reguData, isLoading: isLoadingRegu } = useReguList(
    cabangId === "global" ? {} : { cabangId }
  );
  const { getUsersQuery } = useUsers({ cabangId: cabangId === "global" ? "" : cabangId, limit: 200 });
  const allUsers = getUsersQuery?.data?.data ?? [];

  // Mutations
  const createRegu = useCreateRegu();
  const updateRegu = useUpdateRegu();
  const deleteRegu = useDeleteRegu();
  const addMembers = useAddReguMembers();
  const removeMembers = useRemoveReguMembers();
  const moveMembers = useMoveReguMembers();

  // Derived Data
  const reguList = reguData?.data ?? [];
  const selectedRegu = useMemo(
    () => reguList.find((r) => r.id === selectedReguId),
    [reguList, selectedReguId]
  );

  // Handlers
  const handleCreateRegu = () => {
    if (!newReguName.trim()) return;
    createRegu.mutate({ namaRegu: newReguName, cabangId }, {
      onSuccess: () => setNewReguName(""),
    });
  };

  const handleUpdateRegu = () => {
    if (!editingRegu?.namaRegu.trim()) return;
    updateRegu.mutate({ id: editingRegu.id, data: { namaRegu: editingRegu.namaRegu } }, {
      onSuccess: () => setEditingRegu(null),
    });
  };

  const handleDeleteRegu = (id) => {
    if (confirm("Hapus regu ini? Anggota harus dikosongkan terlebih dahulu.")) {
      deleteRegu.mutate(id);
    }
  };

  const handleAddMember = (userId) => {
    if (!selectedReguId || !userId) return;
    addMembers.mutate({ reguId: selectedReguId, userIds: [userId] });
  };

  const handleRemoveMember = (userId) => {
    if (!selectedReguId || !userId) return;
    removeMembers.mutate({ reguId: selectedReguId, userIds: [userId] });
  };

  const handleMoveMember = (userId, toReguId) => {
    if (!selectedReguId || !toReguId || !userId) return;
    moveMembers.mutate({ userIds: [userId], fromReguId: selectedReguId, toReguId });
  };

  // Helper filter users who are not in any regu (simplified for now)
  const usersInAnyReguIds = useMemo(() => {
    const ids = new Set();
    reguList.forEach((r) => r.regu_member?.forEach((m) => ids.add(m.id)));
    return ids;
  }, [reguList]);

  const availableUsers = useMemo(
    () => allUsers.filter((u) => !usersInAnyReguIds.has(u.id)),
    [allUsers, usersInAnyReguIds]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Users className="text-blue-600" /> Kelola Regu (Tim)
          </DialogTitle>
          <DialogDescription>
            Kelola regu kerja dan distribusikan karyawan ke masing-masing regu.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden p-6 pt-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="list">Daftar Regu</TabsTrigger>
              <TabsTrigger value="members">Kelola Anggota</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="flex-1 overflow-y-auto pr-2 space-y-4">
              {/* Create New Regu */}
              <Card className="border-dashed border-2 bg-gray-50/50">
                <CardContent className="p-4 flex items-end gap-3">
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor="newRegu">Nama Regu Baru</Label>
                    <Input
                      id="newRegu"
                      placeholder="Contoh: Regu A, Tim Pagi, dsb"
                      value={newReguName}
                      onChange={(e) => setNewReguName(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleCreateRegu} disabled={createRegu.isLoading}>
                    <Plus className="h-4 w-4 mr-2" /> Buat
                  </Button>
                </CardContent>
              </Card>

              {/* Regu List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isLoadingRegu ? (
                  [...Array(4)].map((_, i) => (
                    <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-lg" />
                  ))
                ) : reguList.length === 0 ? (
                  <div className="col-span-full py-10 text-center text-muted-foreground">
                    Belum ada regu. Silakan buat regu pertama Anda.
                  </div>
                ) : (
                  reguList.map((regu) => (
                    <Card key={regu.id} className="relative group overflow-hidden border-blue-100 hover:border-blue-300 transition-all">
                      <CardContent className="p-4">
                        {editingRegu?.id === regu.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editingRegu.namaRegu}
                              onChange={(e) => setEditingRegu({ ...editingRegu, namaRegu: e.target.value })}
                              autoFocus
                            />
                            <Button size="sm" onClick={handleUpdateRegu}>Simpan</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingRegu(null)}>Batal</Button>
                          </div>
                        ) : (
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold text-gray-800">{regu.nama_regu}</h3>
                              <p className="text-xs text-muted-foreground mt-1">
                                {regu._count?.regu_member ?? 0} Anggota
                              </p>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-blue-600"
                                onClick={() => setEditingRegu(regu)}
                              >
                                <Info className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-red-500"
                                onClick={() => handleDeleteRegu(regu.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                        <div className="mt-4 flex flex-wrap gap-1">
                          {regu.regu_member?.slice(0, 3).map((m) => (
                            <Badge key={m.userId} variant="secondary" className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700">
                              {m.user?.namaLengkap || m.user?.email.split('@')[0]}
                            </Badge>
                          ))}
                          {(regu._count?.members > 3) && (
                            <span className="text-[10px] text-muted-foreground">+{regu._count.members - 3} lainnya</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="members" className="flex-1 overflow-hidden flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4 h-full">
                {/* Left: Regu Selector & Current Members */}
                <div className="w-full md:w-1/2 flex flex-col gap-3">
                  <div className="space-y-1.5">
                    <Label>Pilih Regu</Label>
                    <Select value={selectedReguId} onValueChange={setSelectedReguId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Regu untuk dikelola" />
                      </SelectTrigger>
                      <SelectContent>
                        {reguList.map((r) => (
                          <SelectItem key={r.id} value={r.id}>{`${r.nama_regu} - ${r.cabang_id}`}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1 border rounded-lg bg-gray-50/30 overflow-hidden flex flex-col">
                    <div className="p-3 border-b bg-white flex justify-between items-center">
                      <span className="text-sm font-semibold">Anggota Terdaftar</span>
                      <Badge variant="outline">{selectedRegu?.regu_member?.length ?? 0}</Badge>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                      {!selectedReguId ? (
                        <div className="h-full flex items-center justify-center text-sm text-muted-foreground italic">
                          Pilih regu di atas
                        </div>
                      ) : selectedRegu?.regu_member?.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-sm text-muted-foreground italic">
                          Belum ada anggota
                        </div>
                      ) : (
                        selectedRegu?.regu_member?.map((m) => (
                          <div key={m.userId} className="p-2 bg-white border rounded-md flex justify-between items-center shadow-sm">
                            <div className="overflow-hidden">
                              <p className="text-sm font-medium truncate">{m.user?.namaLengkap || m.user?.email}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{m.user?.email}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              {/* Move to another regu dropdown (simplified icon for UI check) */}
                              <Select onValueChange={(val) => handleMoveMember(m.userId, val)}>
                                <SelectTrigger className="h-7 w-7 p-0 border-none shadow-none bg-transparent hover:bg-gray-100 rounded-full">
                                  <ArrowRightLeft className="h-3 w-3 text-blue-600" />
                                </SelectTrigger>
                                <SelectContent>
                                  {reguList.filter(r => r.id !== selectedReguId).map(r => (
                                    <SelectItem key={r.id} value={r.id}>Pindah ke {r.namaRegu}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleRemoveMember(m.userId)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Available Users */}
                <div className="w-full md:w-1/2 flex flex-col gap-3">
                  <div className="space-y-1.5 h-full flex flex-col">
                    <Label>Karyawan Tanpa Regu</Label>
                    <div className="flex-1 border rounded-lg overflow-hidden flex flex-col">
                      <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-gray-50/30">
                        {availableUsers.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-sm text-muted-foreground italic">
                            Semua karyawan sudah memiliki regu
                          </div>
                        ) : (
                          availableUsers.map((u) => (
                            <div key={u.id} className="p-2 bg-white border rounded-md flex justify-between items-center shadow-sm">
                              <div className="overflow-hidden pr-2">
                                <p className="text-sm font-medium truncate">{u.namaLengkap || u.email}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50"
                                onClick={() => handleAddMember(u.id)}
                                disabled={!selectedReguId}
                              >
                                <UserPlus className="h-3 w-3 mr-1" /> Tambah
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReguManagementDialog;
