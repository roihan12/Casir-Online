import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Search,
  Filter,
  Save,
  ShieldCheck
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../components/ui/tabs";
import { Badge } from "../../../../components/ui/badge";

const RoleManagementPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState(null);
  const [activeModule, setActiveModule] = useState("all");
  const [selectedPermissions, setSelectedPermissions] = useState({});
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

  // Fetch role permissions when a role is selected
  const { 
    data: rolePermissions = [], 
    isLoading: rolePermissionsLoading,
    refetch: refetchRolePermissions
  } = useQuery({
    queryKey: ["rolePermissions", selectedRole?.id],
    queryFn: () => roleService.getRolePermissions(selectedRole?.id),
    enabled: !!selectedRole,
    onSuccess: (data) => {
      // Initialize selected permissions based on role's current permissions
      const permissionMap = {};
      data.forEach(permission => {
        permissionMap[permission.id] = true;
      });
      setSelectedPermissions(permissionMap);
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
  };

  const handlePermissionToggle = (permissionId) => {
    setSelectedPermissions(prev => ({
      ...prev,
      [permissionId]: !prev[permissionId]
    }));
  };

  const handleSavePermissions = () => {
    const permissionIds = Object.entries(selectedPermissions)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => id);
    
    updateRolePermissionsMutation.mutate({ permissionIds });
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
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Roles</CardTitle>
            <CardDescription>Select a role to manage its permissions</CardDescription>
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
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
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

        {/* Permissions Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedRole ? `Permissions for ${selectedRole.name}` : "Permissions"}
            </CardTitle>
            <CardDescription>
              {selectedRole 
                ? `Manage permissions for the ${selectedRole.name} role` 
                : "Select a role to manage its permissions"}
            </CardDescription>
          </CardHeader>
          {selectedRole ? (
            <>
              <CardContent>
                <div className="mb-4 relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search permissions..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <Tabs value={activeModule} onValueChange={setActiveModule} className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Filter size={16} />
                    <span className="font-medium">Filter by Module:</span>
                  </div>
                  <TabsList className="flex flex-wrap gap-2">
                    {modules.map(module => (
                      <TabsTrigger 
                        key={module} 
                        value={module}
                        className="capitalize"
                      >
                        {module}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>

                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {rolePermissionsLoading ? (
                    <div className="flex justify-center p-4">Loading permissions...</div>
                  ) : filteredPermissions.length === 0 ? (
                    <div className="text-center text-gray-500 p-4">No permissions found</div>
                  ) : (
                    filteredPermissions.map(permission => (
                      <div 
                        key={permission.id} 
                        className="flex items-start space-x-3 p-3 border border-gray-200 rounded-md"
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
                            <Badge className={getActionBadgeColor(permission.action)}>
                              {permission.action}
                            </Badge>
                          </label>
                          <p className="text-sm text-gray-500">{permission.description}</p>
                          <div className="text-xs text-gray-400 capitalize mt-1">
                            Module: {permission.module}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  onClick={handleSavePermissions}
                  disabled={updateRolePermissionsMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Save size={16} />
                  {updateRolePermissionsMutation.isPending ? "Saving..." : "Save Permissions"}
                </Button>
              </CardFooter>
            </>
          ) : (
            <CardContent>
              <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                <ShieldCheck size={48} className="mb-4 text-gray-300" />
                <p>Select a role from the left panel to manage its permissions</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};

export default RoleManagementPage;
