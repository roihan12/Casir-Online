import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Search,
  Filter,
  Save,
  ShieldCheck,
  Menu as MenuIcon,
  ChevronRight,
  ChevronDown,
  Plus,
  Edit,
  Trash2,
  Lock,
  Layers,
  Settings,
  MoreVertical,
  AlertCircle
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
} from "@common/components/ui/card";
import { Button } from "@common/components/ui/button";
import { Input } from "@common/components/ui/input";
import { Checkbox } from "@common/components/ui/checkbox";
import { useToast } from "@app/providers/ToastContext";
import { usePermissions, useRolePermissions, useBulkAssignPermissions } from "../hooks/usePermissions";
import menuService from "@services/menuService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@common/components/ui/tabs";
import { Badge } from "@common/components/ui/badge";
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole } from "../hooks/useRoles";
import { Can } from "@features/common/Can";
import Modal from "@features/common/Modal";
import RoleForm from "../components/RoleForm";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@common/components/ui/dropdown-menu";

const MenuAccessTreeItem = ({ menu, selectedMenus, onToggle, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = menu.children && menu.children.length > 0;
  const menuId = menu.menu_id || menu.id;
  const isSelected = !!selectedMenus[menuId];

  const handleToggle = (checked) => {
    onToggle(menuId, checked, menu.children);
  };

  return (
    <div className="select-none animate-in fade-in slide-in-from-left-2 duration-300">
      <div 
        className={`flex items-center gap-3 p-3 transition-all hover:bg-slate-50/80 rounded-xl group ${
          level > 0 ? "ml-8 border-l-2 border-slate-100 pl-4" : ""
        }`}
      >
        <div className="flex items-center gap-3 flex-1">
           {hasChildren ? (
            <button 
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"
            >
              {isExpanded ? <ChevronDown size={14} className="stroke-[3]" /> : <ChevronRight size={14} className="stroke-[3]" />}
            </button>
          ) : (
            <div className="w-[30px] h-[30px] flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            </div>
          )}
          
          <Checkbox 
            id={`menu-${menuId}`}
            checked={isSelected}
            onCheckedChange={handleToggle}
            className="w-5 h-5 rounded-md border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
          />
          
          <label 
            htmlFor={`menu-${menuId}`}
            className="flex flex-col cursor-pointer flex-1 py-1"
          >
            <div className="flex items-center gap-2 font-semibold text-slate-700">
              <div className={`p-1.5 rounded-lg bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors`}>
                <MenuIcon size={14} />
              </div>
              <span className="text-sm">{menu.menu_name || menu.name}</span>
            </div>
          </label>
        </div>
        
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
           {menu.permission && (
            <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100 font-bold text-[10px] px-2 py-0">
              {menu.permission}
            </Badge>
          )}
          <span className="text-[11px] text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded-md">{menu.path}</span>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="mt-1">
          {menu.children.map(child => (
            <MenuAccessTreeItem 
              key={child.menu_id || child.id} 
              menu={child} 
              selectedMenus={selectedMenus}
              onToggle={onToggle}
              level={level + 1} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

const RoleManagementPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState(null);
  const [activeModule, setActiveModule] = useState("all");
  const [selectedPermissions, setSelectedPermissions] = useState({});
  const [selectedMenus, setSelectedMenus] = useState({});
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch roles data
  const { 
    data: roles, 
    isLoading: rolesLoading,
    error: rolesError
  } = useRoles();

  // Mutations
  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();
  const deleteRoleMutation = useDeleteRole();

  // Fetch permissions data
  const { 
    data: permissionsData, 
    isLoading: permissionsLoading, 
    error: permissionsError 
  } = usePermissions();

  const permissions = permissionsData?.data || [];

  // Fetch Menu Hierarchy
  const { 
    data: menuHierarchy = [], 
    isLoading: menuHierarchyLoading 
  } = useQuery({
    queryKey: ["menuHierarchy"],
    queryFn: menuService.getMenuHierarchy
  });

  const { 
    data: rolePermissionsData, 
    isLoading: rolePermissionsLoading,
  } = useRolePermissions(selectedRole?.id);

  const rolePermissions = rolePermissionsData?.data;

  // Watch for rolePermissions change to update state
  useEffect(() => {
    if (Array.isArray(rolePermissions)) {
      const permissionMap = {};
      rolePermissions.forEach(permission => {
        permissionMap[permission.id] = true;
      });
      setSelectedPermissions(permissionMap);
    }
  }, [rolePermissions]);

  // Fetch role menus when a role is selected
  const { 
    data: roleMenusData, 
    isLoading: roleMenusLoading
  } = useQuery({
    queryKey: ["roleMenus", selectedRole?.id],
    queryFn: () => menuService.getRoleMenus(selectedRole?.id),
    enabled: !!selectedRole,
  });

  const roleMenus = roleMenusData?.data;

  useEffect(() => {
    if (Array.isArray(roleMenus)) {
        const menuMap = {};
        
        const flattenMenus = (menus) => {
            menus.forEach(menu => {
                menuMap[menu.id || menu.menu_id] = true;
                if (menu.children && menu.children.length > 0) {
                    flattenMenus(menu.children);
                }
            });
        };
        
        flattenMenus(roleMenus);
        setSelectedMenus(menuMap);
    }
  }, [roleMenus]);

  // Update role permissions mutation
  const updateRolePermissionsMutation = useBulkAssignPermissions();

  // Update role menus mutation
  const updateRoleMenusMutation = useMutation({
    mutationFn: ({ roleId, menuIds }) => menuService.bulkAssignMenusToRole(roleId, menuIds),
    onSuccess: () => {
      toast({
        title: "Role menu capability updated successfully",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["roleMenus", selectedRole?.id] });
    },
    onError: (error) => {
        toast({
            title: "Failed to update role menus",
            description: error.message,
            variant: "destructive",
        });
    }
  });

  // Get unique modules for filtering
  const modules = ["all", ...new Set((permissions || []).map(permission => permission.module))];

  // Filter permissions based on search term and active module
  const filteredPermissions = (permissions || []).filter(permission => 
    (activeModule === "all" || permission.module === activeModule) &&
    (permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     permission.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
     permission.module.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Filter roles based on search term
  const filteredRoles = (roles || []).filter(role => 
    (role.namaRole || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setSearchTerm("");
    setActiveModule("all");
    setSelectedPermissions({});
    setSelectedMenus({});
  };

  const handlePermissionToggle = (permissionId) => {
    setSelectedPermissions(prev => ({
      ...prev,
      [permissionId]: !prev[permissionId]
    }));
  };

  const handleMenuToggle = (menuId, checked) => {
      setSelectedMenus(prev => ({
        ...prev,
        [menuId]: checked
      }));
  };

  const handleSavePermissions = () => {
    const permissionIds = Object.entries(selectedPermissions)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => id);
    
    updateRolePermissionsMutation.mutate({ roleId: selectedRole.id, permissionIds });
  };

  const handleSaveMenus = () => {
      const menuIds = Object.entries(selectedMenus)
        .filter(([_, isSelected]) => isSelected)
        .map(([id]) => id);
      
      updateRoleMenusMutation.mutate({ roleId: selectedRole.id, menuIds });
  };

  const getActionBadgeColor = (action) => {
    switch (action) {
      case "CREATE": return "bg-emerald-50 text-emerald-700 border-emerald-100 ring-emerald-500/10";
      case "READ": return "bg-sky-50 text-sky-700 border-sky-100 ring-sky-500/10";
      case "UPDATE": return "bg-amber-50 text-amber-700 border-amber-100 ring-amber-500/10";
      case "DELETE": return "bg-rose-50 text-rose-700 border-rose-100 ring-rose-500/10";
      case "MANAGE": return "bg-violet-50 text-violet-700 border-violet-100 ring-violet-500/10";
      default: return "bg-slate-50 text-slate-700 border-slate-100 ring-slate-500/10";
    }
  };

  const isLoading = rolesLoading || permissionsLoading || (selectedRole && rolePermissionsLoading);
  const error = rolesError || permissionsError;

  if (isLoading && !selectedRole) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium animate-pulse">Memuat data akses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 flex items-start gap-4">
          <AlertCircle className="text-rose-600 shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-rose-900 text-lg">Sepertinya ada masalah</h3>
            <p className="text-rose-700 mt-1">{error.message}</p>
            <Button variant="outline" className="mt-4 border-rose-300 text-rose-700 hover:bg-rose-100" onClick={() => queryClient.invalidateQueries(["roles"])}>
              Coba Lagi
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Manajemen Role & Akses</h1>
          <p className="text-slate-500 mt-1">Atur hak akses pengguna dan visibilitas menu berdasarkan peran bisnis.</p>
        </div>
        <Can permission="role:create">
          <Button 
            onClick={() => { setEditingRole(null); setIsRoleModalOpen(true); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 px-6 rounded-xl shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5"
          >
            <Plus className="mr-2 h-5 w-5 stroke-[3]" />
            Tambah Role Baru
          </Button>
        </Can>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Roles List Pane */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-slate-200/60 shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden border-0">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Layers className="text-indigo-600 w-5 h-5" />
                    Daftar Role
                  </CardTitle>
                  <CardDescription>Pilih role untuk konfigurasi</CardDescription>
                </div>
                <Badge variant="outline" className="bg-white border-slate-200 rounded-lg px-2 text-slate-500">
                  {filteredRoles.length} Role
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="relative mb-6">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Cari nama role..."
                  className="pl-10 h-11 border-slate-200/80 rounded-2xl focus:ring-2 focus:ring-indigo-600/10 hover:border-slate-300 bg-slate-50/30 transition-all font-medium"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="space-y-3 max-h-[calc(100vh-450px)] overflow-y-auto pr-2 pb-20 custom-scrollbar">
                {filteredRoles.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Search className="text-slate-300 w-8 h-8" />
                    </div>
                    <p className="text-slate-400 font-medium">Role tidak ditemukan</p>
                  </div>
                ) : (
                  filteredRoles.map(role => (
                    <div 
                      key={role.id}
                      className={`group p-4 rounded-2xl cursor-pointer flex items-center justify-between transition-all duration-300 relative ${
                        selectedRole?.id === role.id 
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-[1.02] z-20' 
                          : 'bg-white hover:bg-slate-50 border border-slate-100 hover:z-10'
                      }`}
                      onClick={() => handleRoleSelect(role)}
                    >
                      {/* Clipping wrapper for background effects only */}
                      <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                        {selectedRole?.id === role.id && (
                          <div className="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 overflow-hidden relative z-10">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 transition-colors ${
                          selectedRole?.id === role.id ? 'bg-white/20' : 'bg-indigo-50 text-indigo-600'
                        }`}>
                          <ShieldCheck size={20} />
                        </div>
                        <div className="truncate">
                          <div className={`font-bold transition-colors ${selectedRole?.id === role.id ? 'text-white' : 'text-slate-800'}`}>
                            {role.namaRole}
                          </div>
                          <div className={`text-xs truncate transition-colors ${selectedRole?.id === role.id ? 'text-indigo-100' : 'text-slate-500'}`}>
                            {role.deskripsi || "Tidak ada deskripsi"}
                          </div>
                        </div>
                      </div>

                      <div className="relative z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className={`h-8 w-8 rounded-lg ${selectedRole?.id === role.id ? 'text-white hover:bg-white/20' : 'text-slate-400'}`}>
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl border-slate-100 shadow-xl z-50">
                            <Can permission="role:update">
                              <DropdownMenuItem 
                                className="flex items-center gap-2 cursor-pointer text-slate-700 py-2.5 px-4 focus:bg-indigo-50"
                                onClick={(e) => { e.stopPropagation(); setEditingRole(role); setIsRoleModalOpen(true); }}
                              >
                                <Edit size={14} className="text-indigo-600" />
                                <span className="font-semibold">Ubah Role</span>
                              </DropdownMenuItem>
                            </Can>
                            <Can permission="role:delete">
                              <DropdownMenuItem 
                                className="flex items-center gap-2 cursor-pointer text-rose-600 py-2.5 px-4 focus:bg-rose-50"
                                onClick={(e) => { e.stopPropagation(); if(confirm(`Hapus role ${role.namaRole}?`)) deleteRoleMutation.mutate(role.id); }}
                              >
                                <Trash2 size={14} />
                                <span className="font-semibold">Hapus Role</span>
                              </DropdownMenuItem>
                            </Can>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="mt-6 pt-6 border-t border-slate-100">
                <Button 
                  variant="outline" 
                  className="w-full h-11 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50 gap-2"
                  onClick={() => window.location.href='/users/permissions'}
                >
                  <Settings size={16} />
                  Kelola Master Permission
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Setup Pane */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <Card className="border-slate-200/60 shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden flex-1 flex flex-col border-0">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-indigo-600 border border-slate-100">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold">
                    {selectedRole ? `Konfigurasi Akses: ${selectedRole.namaRole}` : "Pengaturan Hak Akses"}
                  </CardTitle>
                  <CardDescription>
                    {selectedRole 
                      ? `Kelola izin fitur dan visibilitas menu sidebar untuk role ini.` 
                      : "Pilih salah satu role di sebelah kiri untuk mengatur aksesnya."}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
            {!selectedRole ? (
              <div className="flex flex-col items-center justify-center p-12 text-slate-400 min-h-[400px] flex-1">
                <div className="relative mb-6">
                 <ShieldCheck size={80} className="text-slate-100" />
                 <ShieldCheck size={40} className="text-indigo-100 absolute bottom-0 right-0" />
                </div>
                <p className="text-lg font-bold text-slate-400">Belum ada role yang dipilih</p>
                <p className="text-sm mt-1 max-w-[280px] text-center">Silahkan pilih role dari daftar di sebelah kiri untuk mengatur izin akses.</p>
              </div>
            ) : (
              <Tabs defaultValue="permissions" className="w-full flex-1 flex flex-col overflow-hidden">
                <div className="px-6 pt-4 bg-white sticky top-0 z-10">
                  <TabsList className="grid w-full grid-cols-2 p-1 bg-slate-100/80 rounded-2xl h-14">
                    <TabsTrigger 
                      value="permissions" 
                      className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-md font-bold text-slate-500 transition-all"
                    >
                      <Lock size={16} className="mr-2" />
                      Hak Permission
                    </TabsTrigger>
                    <TabsTrigger 
                      value="menus"
                      className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-md font-bold text-slate-500 transition-all"
                    >
                      <MenuIcon size={16} className="mr-2" />
                      Akses Menu
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                  <TabsContent value="permissions" className="space-y-6 mt-0 animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="relative flex-1 w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Cari izin fitur..."
                            className="pl-10 h-11 border-slate-200/80 rounded-2xl focus:ring-2 focus:ring-indigo-600/10 hover:border-slate-300 bg-slate-50/20 transition-all font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Filter size={16} className="text-indigo-600" />
                        <span className="font-bold text-slate-700 text-sm">Filter Modul:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {modules.map(module => (
                          <button 
                            key={module} 
                            onClick={() => setActiveModule(module)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                              activeModule === module 
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100' 
                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            <span className="capitalize">{module}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {rolePermissionsLoading ? (
                        <div className="col-span-2 flex justify-center py-12">
                          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : filteredPermissions.length === 0 ? (
                        <div className="col-span-2 text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                          <AlertCircle className="mx-auto text-slate-300 w-10 h-10 mb-2" />
                          <p className="text-slate-400 font-medium font-bold">Tidak ada permission ditemukan</p>
                        </div>
                      ) : (
                        filteredPermissions.map(permission => (
                          <div 
                            key={permission.id} 
                            className={`flex items-start gap-4 p-4 border border-slate-100 rounded-3xl transition-all duration-300 hover:shadow-lg hover:shadow-slate-100 hover:border-indigo-100 group ${
                              selectedPermissions[permission.id] ? 'bg-slate-50/50' : 'bg-white'
                            }`}
                          >
                            <Checkbox 
                              id={`perm-${permission.id}`}
                              checked={!!selectedPermissions[permission.id]}
                              onCheckedChange={() => handlePermissionToggle(permission.id)}
                              className="mt-1 w-5 h-5 rounded-md border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                            />
                            <div className="flex-1 space-y-1">
                              <label 
                                htmlFor={`perm-${permission.id}`}
                                className="font-bold text-slate-800 cursor-pointer flex items-center flex-wrap gap-2 group-hover:text-indigo-600 transition-colors"
                              >
                                {permission.name}
                                <Badge className={`${getActionBadgeColor(permission.action)} rounded-lg border-0 px-2 py-0.5 font-bold shadow-sm ring-1 ring-inset`} variant="secondary">
                                  {permission.action}
                                </Badge>
                              </label>
                              <p className="text-xs text-slate-400 font-medium leading-relaxed">{permission.description}</p>
                              <div className="pt-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-500 uppercase tracking-widest">
                                  Modul {permission.module}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="menus" className="space-y-6 mt-0 animate-in fade-in zoom-in-95 duration-300">
                    <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-3xl flex items-start gap-4 mb-6">
                      <div className="p-2 bg-white rounded-2xl text-indigo-600 shadow-sm border border-indigo-50 shrink-0">
                        <ShieldCheck size={20} />
                      </div>
                      <p className="text-sm text-indigo-800 leading-relaxed font-medium">
                        Centang menu yang ingin ditampilkan di sidebar untuk role <strong>{selectedRole.namaRole}</strong>. Pengguna hanya bisa melihat menu yang dipilih.
                      </p>
                    </div>

                    {menuHierarchyLoading ? (
                        <div className="flex justify-center py-12">
                           <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden divide-y divide-slate-50 shadow-sm">
                            {menuHierarchy.length === 0 ? (
                                <div className="p-12 text-center text-slate-400">
                                   <MenuIcon size={48} className="mx-auto text-slate-100 mb-4" />
                                   <p className="font-bold">Belum ada menu yang dibuat</p>
                                   <p className="text-sm mt-1">Silahkan buat menu di Menu Management terlebih dahulu.</p>
                                </div>
                            ) : (
                                menuHierarchy.map(menu => (
                                    <MenuAccessTreeItem 
                                      key={menu.menu_id || menu.id} 
                                      menu={menu} 
                                      selectedMenus={selectedMenus}
                                      onToggle={handleMenuToggle}
                                    />
                                ))
                            )}
                        </div>
                    )}
                  </TabsContent>
                </div>

                <div className="p-6 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400">
                      <ShieldCheck size={16} />
                      <span className="text-xs font-semibold">Tersimpan secara manual</span>
                    </div>
                    <div className="flex gap-4">
                      {/* Check if current tab to show correct save button */}
                      <TabsContent value="permissions" className="m-0 mt-0">
                        <Button 
                          onClick={handleSavePermissions}
                          disabled={updateRolePermissionsMutation.isPending}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 px-8 rounded-2xl shadow-lg shadow-indigo-100 transition-all active:scale-95"
                        >
                          {updateRolePermissionsMutation.isPending ? (
                             <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> Menyimpan...</>
                          ) : (
                            <><Save size={18} className="mr-2" /> Simpan Hak Akses</>
                          )}
                        </Button>
                      </TabsContent>
                      <TabsContent value="menus" className="m-0 mt-0">
                        <Button 
                          onClick={handleSaveMenus}
                          disabled={updateRoleMenusMutation.isPending}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 px-8 rounded-2xl shadow-lg shadow-indigo-100 transition-all active:scale-95"
                        >
                          {updateRoleMenusMutation.isPending ? (
                             <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> Menyimpan...</>
                          ) : (
                            <><Save size={18} className="mr-2" /> Simpan Akses Menu</>
                          )}
                        </Button>
                      </TabsContent>
                    </div>
                </div>
              </Tabs>
            )} 
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal 
        isOpen={isRoleModalOpen} 
        onClose={() => setIsRoleModalOpen(false)} 
        title={editingRole ? "Ubah Detail Role" : "Tambah Role Baru"}
        maxWidth="sm"
      >
        <div className="p-1">
          <RoleForm 
              role={editingRole} 
              onSubmit={(data) => {
                  if (editingRole) {
                      updateRoleMutation.mutate({ id: editingRole.id, data }, { onSuccess: () => setIsRoleModalOpen(false) });
                  } else {
                      createRoleMutation.mutate(data, { onSuccess: () => setIsRoleModalOpen(false) });
                  }
              }}
              onCancel={() => setIsRoleModalOpen(false)}
              isLoading={createRoleMutation.isPending || updateRoleMutation.isPending}
          />
        </div>
      </Modal>
    </div>
  );
};

export default RoleManagementPage;
