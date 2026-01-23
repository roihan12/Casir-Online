import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as LucideIcons from "lucide-react";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  ChevronRight,
  ChevronDown,
  Save,
  FolderTree,
  MoreVertical,
  GripVertical
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription
} from "@common/components/ui/card";
import { Button } from "@common/components/ui/button";
import { Input } from "@common/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@common/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@common/components/ui/select";
import { Badge } from "@common/components/ui/badge";
import { useToast } from "@app/providers/ToastContext";
import menuService from "@services/menuService";
import permissionService  from "@services/permissionService";

import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@common/components/ui/dropdown-menu";
import { Switch } from "@common/components/ui/switch";

// Dynamic Icon Component
const DynamicIcon = ({ name, size = 16, className = "" }) => {
  const IconComponent = LucideIcons[name];
  if (!IconComponent) return <LucideIcons.CircleDashed size={size} className={className} />;
  return <IconComponent size={size} className={className} />;
};

// ... imports
import { updateMenuStatus } from "@services/menuService"; // Make sure to import this

// ...
// Tree Item Component
const MenuTreeItem = ({ menu, level = 0, onEdit, onDelete, onAddChild, onToggleStatus }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = menu.children && menu.children.length > 0;

  return (
    <div className="select-none">
      <div 
        className={`group flex items-center justify-between p-3 hover:bg-slate-50 border-b border-gray-100 transition-colors ${level > 0 ? 'ml-8 border-l-2 border-l-gray-200' : ''}`}
      >
        <div className="flex items-center gap-3 flex-1 overflow-hidden">
          <div className="flex items-center gap-1 min-w-[24px]">
            {hasChildren ? (
              <button 
                onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                className="p-1 hover:bg-slate-200 rounded-md text-gray-500 transition-colors"
              >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            ) : (
                <div className="w-6" />
            )}
          </div>
          
          <div className={`flex items-center justify-center h-10 w-10 rounded-md ${level === 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
            <DynamicIcon name={menu.icon} size={20} />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className={`font-medium truncate ${level === 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                {menu.name}
              </span>
              {menu.permission && (
                <Badge variant="secondary" className="text-[10px] px-1.5 h-5 font-normal bg-slate-100 text-slate-600 hover:bg-slate-200">
                  {menu.permission}
                </Badge>
              )}
               {menu.is_active === false && (
                <Badge variant="outline" className="text-[10px] px-1.5 h-5 font-normal text-gray-400 border-gray-200">
                  Inactive
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="truncate max-w-[200px]">{menu.path}</span>
              <span className="text-gray-300">•</span>
              <span>Order: {menu.order}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
             <div onClick={(e) => e.stopPropagation()}>
               <Switch 
                  checked={menu.is_active !== false}
                  onCheckedChange={(checked) => onToggleStatus(menu, checked)}
                  className="scale-75" 
               />
             </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 text-gray-500">
                <MoreVertical size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onAddChild(menu)}>
                <Plus size={14} className="mr-2 text-green-600" /> Add Submenu
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(menu)}>
                <Edit size={14} className="mr-2 text-blue-600" /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(menu)} className="text-red-600 focus:text-red-700 focus:bg-red-50">
                <Trash2 size={14} className="mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="">
          {menu.children.map(child => (
            <MenuTreeItem 
              key={child.id} 
              menu={child} 
              level={level + 1} 
              onEdit={onEdit} 
              onDelete={onDelete} 
              onAddChild={onAddChild}
              onToggleStatus={onToggleStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const MenuManagementPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [parentForNewMenu, setParentForNewMenu] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    path: "",
    icon: "",
    permission: "",
    parent_id: "null", // String "null" for Select handling
    order: 0,
    is_active: true
  });

  // Status Update Mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }) => menuService.updateMenuStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries(["menuHierarchy"]);
      queryClient.invalidateQueries(["allMenus"]);
      toast({ title: "Status updated", variant: "success" });
    },
    onError: (err) => {
      toast({ title: "Failed to update status", description: err.message, variant: "destructive" });
    }
  });

  const handleToggleStatus = (menu, isActive) => {
    statusMutation.mutate({ id: menu.id || menu.menu_id, isActive });
  };

  // Helper to transformation flat hierarchy to tree
  const buildMenuTree = (flatMenus) => {
    const menuMap = {};
    const tree = [];
    
    // First pass: Create map and normalize keys
    flatMenus.forEach(menu => {
      // Handle both camelCase and snake_case inputs
      const id = menu.id || menu.menu_id;
      const parentId = menu.parentId || menu.parent_id;
      const name = menu.name || menu.menu_name;
      const order = menu.order || menu.orderIndex || menu.order_index;
      
      menuMap[id] = {
        ...menu,
        id,
        name,
        // Ensure standard keys for the UI
        path: menu.path, 
        icon: menu.icon,
        permission: menu.permission || menu.requiredPermission || "",
        order: order,
        children: []
      };
    });
    
    // Second pass: Build tree
    Object.values(menuMap).forEach(menu => {
      // Determine parent ID (handle both camelCase and snake_case from input)
      const parentId = menu.parentId || menu.parent_id;
      
      if (parentId && menuMap[parentId]) {
        menuMap[parentId].children.push(menu);
      } else {
        tree.push(menu);
      }
    });

    // Sort by order
    const sortMenus = (items) => {
      return items.sort((a, b) => (a.order || 0) - (b.order || 0))
        .map(item => ({
          ...item,
          children: sortMenus(item.children)
        }));
    };
    
    return sortMenus(tree);
  };
  
  // Fetch Menu Hierarchy
  const { data: menuHierarchy = [], isLoading: isMenuLoading } = useQuery({
    queryKey: ["menuHierarchy"],
    queryFn: menuService.getMenuHierarchy,
    select: (data) => {
        // If data is already nested (has children), use it, otherwise build tree
        if (data.length > 0 && data[0].children) return data;
        return buildMenuTree(data);
    }
  });

  // Fetch All Menus (for Parent Selection)
  // hierarchy might be enough if we flatten it or if the API provides a flat list too.
  // Let's use menuService.getAllMenus for flat list parent selection
  const { data: allMenus = [] } = useQuery({
    queryKey: ["allMenus"],
    queryFn: menuService.getAllMenus,
    select: (data) => data.map(menu => ({
        ...menu,
        id: menu.id || menu.menu_id,
        name: menu.name || menu.menu_name
    }))
  });

  // Fetch Permissions
  const { data: permissions = [] } = useQuery({
    queryKey: ["permissions"],
    queryFn: permissionService.getAllPermissions,
    select: (data) => data || [] // handle potential null/undefined
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: menuService.createMenu,
    onSuccess: () => {
      queryClient.invalidateQueries(["menuHierarchy"]);
      queryClient.invalidateQueries(["allMenus"]);
      toast({ title: "Menu created successfully", variant: "success" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (err) => {
      toast({ title: "Failed to create menu", description: err.message, variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => menuService.updateMenu(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["menuHierarchy"]);
      queryClient.invalidateQueries(["allMenus"]);
      toast({ title: "Menu updated successfully", variant: "success" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (err) => {
      toast({ title: "Failed to update menu", description: err.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: menuService.deleteMenu,
    onSuccess: () => {
      queryClient.invalidateQueries(["menuHierarchy"]);
      queryClient.invalidateQueries(["allMenus"]);
      toast({ title: "Menu deleted successfully", variant: "success" });
    },
    onError: (err) => {
      toast({ title: "Failed to delete menu", description: err.message, variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      path: "",
      icon: "",
      permission: "",
      parent_id: "null",
      order: 0,
      is_active: true
    });
    setEditingMenu(null);
    setParentForNewMenu(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleAddChild = (parent) => {
    resetForm();
    setParentForNewMenu(parent);
    setFormData(prev => ({
      ...prev,
      parent_id: String(parent.id)
    }));
    setIsDialogOpen(true);
  };

  const handleEdit = (menu) => {
    setEditingMenu(menu);
    setFormData({
      name: menu.name,
      path: menu.path,
      icon: menu.icon || "",
      permission: menu.permission || "",
      parent_id: menu.parent_id ? String(menu.parent_id) : "null",
      order: menu.order || 0,
      is_active: menu.is_active
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (menu) => {
    if (window.confirm(`Are you sure you want to delete menu "${menu.name}"?`)) {
      deleteMutation.mutate(menu.id);
    }
  };

  const handleSubmit = () => {
    // Map form data to backend expected schema
    // Validation schema provided: name, path, icon, parentId, displayOrder, isActive, description
    const payload = {
      name: formData.name,
      path: formData.path,
      icon: formData.icon,
      permission: formData.permission || null,
      parentId: formData.parent_id === "null" ? null : formData.parent_id,
      displayOrder: formData.order, 
      isActive: formData.is_active
    };

    if (editingMenu) {
      updateMutation.mutate({ id: editingMenu.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };
  // Filter parents to avoid circular dependency (basic: don't select self as parent)
  const availableParents = allMenus.filter(m => editingMenu ? m.id !== editingMenu.id : true);

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Menu Management</h1>
          <p className="text-gray-500">Manage application sidebar menus and structure.</p>
        </div>
        <Button onClick={handleOpenCreate} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700">
          <Plus size={16} /> Add Root Menu
        </Button>
      </div>

      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FolderTree size={20} className="text-indigo-600" />
            Menu Structure
          </CardTitle>
          <CardDescription>
            Configure the hierarchy, icons, and permissions for navigation.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isMenuLoading ? (
            <div className="flex justify-center p-12">
              <div className="animate-pulse flex flex-col items-center gap-2 text-gray-400">
                 <LucideIcons.Loader2 size={32} className="animate-spin" />
                 <span>Loading menus...</span>
              </div>
            </div>
          ) : menuHierarchy.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-gray-500">
                <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <FolderTree size={24} className="text-gray-400" />
                </div>
                <h3 className="font-medium text-gray-900">No menus found</h3>
                <p className="max-w-xs mx-auto mb-4">Get started by creating your first menu item.</p>
                <Button variant="outline" onClick={handleOpenCreate}>Create Menu</Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {menuHierarchy.map(menu => (
                <MenuTreeItem 
                  key={menu.menu_id || menu.id} 
                  menu={menu} 
                  onEdit={handleEdit} 
                  onDelete={handleDelete} 
                  onAddChild={handleAddChild}
                  onToggleStatus={handleToggleStatus}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{editingMenu ? "Edit Menu" : "Create Menu"}</DialogTitle>
            <DialogDescription>
              {editingMenu 
                ? "Update existing menu details." 
                : parentForNewMenu 
                  ? `Add a submenu under "${parentForNewMenu.name}".`
                  : "Add a new top-level menu item to the sidebar."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-5 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium text-gray-700">Name</label>
              <Input 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="col-span-3" 
                placeholder="e.g. Dashboard"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium text-gray-700">Path</label>
              <Input 
                value={formData.path} 
                onChange={e => setFormData({...formData, path: e.target.value})}
                className="col-span-3" 
                placeholder="e.g. /dashboard"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium text-gray-700">Icon</label>
              <div className="col-span-3 flex items-center gap-2">
                 <div className="relative flex-1">
                    <Input 
                        value={formData.icon} 
                        onChange={e => setFormData({...formData, icon: e.target.value})}
                        className="pl-9" 
                        placeholder="Lucide Icon Name (e.g. Home)"
                    />
                    <div className="absolute left-3 top-2.5 text-gray-500">
                        <DynamicIcon name={formData.icon || "CircleDashed"} size={16} />
                    </div>
                 </div>
                 <a 
                    href="https://lucide.dev/icons" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-xs text-blue-600 hover:underline shrink-0"
                 >
                    Browse Icons
                 </a>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium text-gray-700">Parent</label>
              <div className="col-span-3">
                <Select 
                  value={formData.parent_id} 
                  onValueChange={val => setFormData({...formData, parent_id: val})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Parent (Optional)" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[250px]">
                    <SelectItem value="null">No Parent (Root)</SelectItem>
                    {availableParents.map(p => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        <div className="flex items-center gap-2">
                            <DynamicIcon name={p.icon} size={14} className="text-gray-400" />
                            {p.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium text-gray-700">Permission</label>
              <div className="col-span-3">
                <Select 
                  value={formData.permission} 
                  onValueChange={val => setFormData({...formData, permission: val})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Required Permission" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[250px]">
                    <SelectItem value="">No Specific Permission</SelectItem>
                    {permissions.map(p => (
                      <SelectItem key={p.id} value={p.name}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium text-gray-700">Order</label>
              <Input 
                type="number"
                value={formData.order} 
                onChange={e => setFormData({...formData, order: parseInt(e.target.value) || 0})}
                className="col-span-3" 
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium text-gray-700">Status</label>
              <div className="col-span-3 flex items-center gap-2">
                <Switch 
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                />
                <span className={`text-sm ${formData.is_active ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                  {formData.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700">
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MenuManagementPage;
