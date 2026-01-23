import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Search,
  Filter,
  Save,
  ShieldCheck,
  Menu as MenuIcon,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Checkbox } from "../../../../components/ui/checkbox";
import { useToast } from "../../../../hooks/useToast";
import { roleService } from "../../../../services/roleService";
import { permissionService } from "../../../../services/permissionService";
import menuService from "../../../../services/menuService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../components/ui/tabs";
import { Badge } from "../../../../components/ui/badge";

const MenuAccessTreeItem = ({ menu, selectedMenus, onToggle, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = menu.children && menu.children.length > 0;
  const isSelected = !!selectedMenus[menu.id];

  const handleToggle = (checked) => {
    onToggle(menu.id, checked, menu.children);
  };

  return (
    <div className="select-none">
      <div 
        className={`flex items-center gap-2 p-2 hover:bg-gray-50 rounded-md border-b border-gray-100 ${level > 0 ? 'ml-6' : ''}`}
      >
        <div className="flex items-center gap-2 flex-1">
           {hasChildren ? (
            <button 
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
              className="p-1 hover:bg-gray-200 rounded-sm"
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : (
            <span className="w-6" /> 
          )}
          
          <Checkbox 
            id={`menu-${menu.id}`}
            checked={isSelected}
            onCheckedChange={handleToggle}
          />
          
          <label 
            htmlFor={`menu-${menu.id}`}
            className="flex flex-col cursor-pointer flex-1"
          >
            <div className="flex items-center gap-2 font-medium text-sm">
              <MenuIcon size={14} className="text-gray-500" />
              {menu.name}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
               <span>{menu.path}</span>
               {menu.permission && (
                <Badge variant="outline" className="text-[10px] py-0 h-4">
                  {menu.permission}
                </Badge>
              )}
            </div>
          </label>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="mt-1">
          {menu.children.map(child => (
            <MenuAccessTreeItem 
              key={child.id} 
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
  const [menuSearchTerm, setMenuSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState(null);
  const [activeModule, setActiveModule] = useState("all");
  const [selectedPermissions, setSelectedPermissions] = useState({});
  const [selectedMenus, setSelectedMenus] = useState({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch roles data
  const { 
    data: roles = [], 
    isLoading: rolesLoading, 
    error: rolesError 
  } = useQuery({
    queryKey: ["roles"],
    queryFn: roleService.getAllRoles,
  });

  // Fetch permissions data
  const { 
    data: permissions = [], 
    isLoading: permissionsLoading, 
    error: permissionsError 
  } = useQuery({
    queryKey: ["permissions"],
    queryFn: permissionService.getAllPermissions,
  });

  // Fetch Menu Hierarchy
  const { 
    data: menuHierarchy = [], 
    isLoading: menuHierarchyLoading 
  } = useQuery({
    queryKey: ["menuHierarchy"],
    queryFn: menuService.getMenuHierarchy
  });

  // Fetch role permissions when a role is selected
  const { 
    data: rolePermissions = [], 
    isLoading: rolePermissionsLoading,
  } = useQuery({
    queryKey: ["rolePermissions", selectedRole?.id],
    queryFn: () => roleService.getRolePermissions(selectedRole?.id),
    enabled: !!selectedRole,
    onSuccess: (data) => {
      const permissionMap = {};
      data.forEach(permission => {
        permissionMap[permission.id] = true;
      });
      setSelectedPermissions(permissionMap);
    }
  });

  // Fetch role menus when a role is selected
  const { 
    data: roleMenus = [], 
    isLoading: roleMenusLoading
  } = useQuery({
    queryKey: ["roleMenus", selectedRole?.id],
    queryFn: () => menuService.getRoleMenus(selectedRole?.id),
    enabled: !!selectedRole,
    onSuccess: (data) => {
        const menuMap = {};
        data.forEach(menu => {
            menuMap[menu.id] = true;
        });
        setSelectedMenus(menuMap);
    }
  });

  // Update role permissions mutation
  const updateRolePermissionsMutation = useMutation({
    mutationFn: (data) => roleService.updateRolePermissions(selectedRole.id, data),
    onSuccess: () => {
      toast({
        title: "Role permissions updated successfully",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["rolePermissions", selectedRole?.id] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update role permissions",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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
  const modules = ["all", ...new Set(permissions.map(permission => permission.module))];

  // Filter permissions based on search term and active module
  const filteredPermissions = permissions.filter(permission => 
    (activeModule === "all" || permission.module === activeModule) &&
    (permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     permission.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
     permission.module.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Filter roles based on search term
  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setSearchTerm("");
    setActiveModule("all");
    // Queries will auto-fetch due to key change
  };

  const handlePermissionToggle = (permissionId) => {
    setSelectedPermissions(prev => ({
      ...prev,
      [permissionId]: !prev[permissionId]
    }));
  };

  const handleMenuToggle = (menuId, checked, children) => {
      setSelectedMenus(prev => {
          const newMenus = { ...prev, [menuId]: checked };
          // Optional: Auto check/uncheck children? For now keeping it simple (manual)
          // To be helpful, if unchecking, maybe uncheck children?
          // Let's stick to simple individual toggle for now to avoid complexity without recursion.
          return newMenus;
      });
  };

  const handleSavePermissions = () => {
    const permissionIds = Object.entries(selectedPermissions)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => id);
    
    updateRolePermissionsMutation.mutate({ permissionIds });
  };

  const handleSaveMenus = () => {
      const menuIds = Object.entries(selectedMenus)
        .filter(([_, isSelected]) => isSelected)
        .map(([id]) => id);
      
      updateRoleMenusMutation.mutate({ roleId: selectedRole.id, menuIds });
  };

  const getActionBadgeColor = (action) => {
    switch (action) {
      case "CREATE": return "bg-green-100 text-green-800";
      case "READ": return "bg-blue-100 text-blue-800";
      case "UPDATE": return "bg-yellow-100 text-yellow-800";
      case "DELETE": return "bg-red-100 text-red-800";
      case "MANAGE": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const isLoading = rolesLoading || permissionsLoading || (selectedRole && rolePermissionsLoading);
  const error = rolesError || permissionsError;

  if (isLoading && !selectedRole) return <div className="flex justify-center p-8">Loading...</div>;
  if (error) return <div className="text-red-500 p-8">Error: {error.message}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Roles Card */}
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Roles</CardTitle>
            <CardDescription>Select a role to manage attributes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search roles..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredRoles.map(role => (
                <div 
                  key={role.id}
                  className={`p-3 rounded-md cursor-pointer flex items-center justify-between ${
                    selectedRole?.id === role.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-gray-200'
                  }`}
                  onClick={() => handleRoleSelect(role)}
                >
                  <div>
                    <div className="font-medium">{role.name}</div>
                    <div className="text-sm text-gray-500">{role.description}</div>
                  </div>
                  {selectedRole?.id === role.id && (
                    <ShieldCheck className="h-5 w-5 text-blue-500" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Access Control Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedRole ? `Access Setup: ${selectedRole.name}` : "Role Access Control"}
            </CardTitle>
            <CardDescription>
              {selectedRole 
                ? `Manage permissions and menu visibility for ${selectedRole.name}` 
                : "Select a role to configure its access."}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
          {!selectedRole ? (
             <div className="flex flex-col items-center justify-center p-8 text-gray-500 min-h-[300px]">
                <ShieldCheck size={48} className="mb-4 text-gray-300" />
                <p>Select a role from the left panel to start editing.</p>
              </div>
          ) : (
            <Tabs defaultValue="permissions" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="permissions">Permissions</TabsTrigger>
                <TabsTrigger value="menus">Menu Assignment</TabsTrigger>
              </TabsList>

              <TabsContent value="permissions" className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Find permission..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                  </div>

                  <Tabs value={activeModule} onValueChange={setActiveModule} className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Filter size={16} />
                      <span className="font-medium">Filter Module:</span>
                    </div>
                    <TabsList className="flex flex-wrap gap-2 h-auto justify-start bg-transparent">
                      {modules.map(module => (
                        <TabsTrigger 
                          key={module} 
                          value={module}
                          className="data-[state=active]:bg-slate-900 data-[state=active]:text-white border"
                        >
                          {module}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>

                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    {rolePermissionsLoading ? (
                      <div className="flex justify-center p-4">Loading permissions...</div>
                    ) : filteredPermissions.length === 0 ? (
                      <div className="text-center text-gray-500 p-4">No matching permissions</div>
                    ) : (
                      filteredPermissions.map(permission => (
                        <div 
                          key={permission.id} 
                          className="flex items-start space-x-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Checkbox 
                            id={`permission-${permission.id}`}
                            checked={!!selectedPermissions[permission.id]}
                            onCheckedChange={() => handlePermissionToggle(permission.id)}
                          />
                          <div className="flex-1">
                            <label 
                              htmlFor={`permission-${permission.id}`}
                              className="font-medium cursor-pointer flex items-center gap-2"
                            >
                              {permission.name}
                              <Badge className={getActionBadgeColor(permission.action)} variant="secondary">
                                {permission.action}
                              </Badge>
                            </label>
                            <p className="text-sm text-gray-500">{permission.description}</p>
                            <div className="text-xs text-indigo-500 font-medium capitalize mt-1">
                               {permission.module} Module
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex justify-end pt-4 border-t">
                    <Button 
                      onClick={handleSavePermissions}
                      disabled={updateRolePermissionsMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      <Save size={16} />
                      {updateRolePermissionsMutation.isPending ? "Saving..." : "Save Permissions"}
                    </Button>
                  </div>
              </TabsContent>

              <TabsContent value="menus" className="space-y-4">
                  <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 text-blue-700 rounded-md text-sm">
                      <MenuIcon size={16} />
                      <p>Check the menus that users with the <strong>{selectedRole.name}</strong> role should see in their sidebar.</p>
                  </div>

                  {menuHierarchyLoading ? (
                      <div className="text-center p-8">Loading menus...</div>
                  ) : (
                      <div className="border rounded-md divide-y max-h-[500px] overflow-y-auto">
                          {menuHierarchy.length === 0 ? (
                              <div className="p-4 text-center text-gray-500">No menus defined. Go to Menu Management to create menus.</div>
                          ) : (
                              menuHierarchy.map(menu => (
                                  <MenuAccessTreeItem 
                                    key={menu.id} 
                                    menu={menu} 
                                    selectedMenus={selectedMenus}
                                    onToggle={handleMenuToggle}
                                  />
                              ))
                          )}
                      </div>
                  )}

                  <div className="flex justify-end pt-4 border-t">
                    <Button 
                      onClick={handleSaveMenus}
                      disabled={updateRoleMenusMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      <Save size={16} />
                      {updateRoleMenusMutation.isPending ? "Saving Menus..." : "Save Menu Assignment"}
                    </Button>
                  </div>
              </TabsContent>
            </Tabs>
          )} 
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RoleManagementPage;
