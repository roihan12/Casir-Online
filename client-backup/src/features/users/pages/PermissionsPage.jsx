import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  PlusCircle, 
  Edit, 
  Trash2, 
  Search,
  Filter
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { useToast } from "../../../../hooks/useToast";
import { permissionService } from "../../../../services/permissionService";
import { Badge } from "../../../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../components/ui/tabs";

const PermissionsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeModule, setActiveModule] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch permissions data
  const { 
    data: permissions = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ["permissions"],
    queryFn: permissionService.getAllPermissions,
  });

  // Delete permission mutation
  const deletePermissionMutation = useMutation({
    mutationFn: permissionService.deletePermission,
    onSuccess: () => {
      toast({
        title: "Permission deleted successfully",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete permission",
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

  const handleDeletePermission = (id) => {
    if (window.confirm("Are you sure you want to delete this permission?")) {
      deletePermissionMutation.mutate(id);
    }
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

  if (isLoading) return <div className="flex justify-center p-8">Loading permissions...</div>;
  if (error) return <div className="text-red-500 p-8">Error loading permissions: {error.message}</div>;

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-bold">Permissions Management</CardTitle>
          <Button 
            onClick={() => window.location.href = "permissions/create"} 
            className="flex items-center gap-2"
          >
            <PlusCircle size={16} />
            Add New Permission
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search permissions..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
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

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="py-2 px-4 text-left">Name</th>
                  <th className="py-2 px-4 text-left">Description</th>
                  <th className="py-2 px-4 text-left">Module</th>
                  <th className="py-2 px-4 text-left">Action</th>
                  <th className="py-2 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPermissions.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-4 text-center text-gray-500">
                      No permissions found
                    </td>
                  </tr>
                ) : (
                  filteredPermissions.map((permission) => (
                    <tr key={permission.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4">{permission.name}</td>
                      <td className="py-2 px-4">{permission.description}</td>
                      <td className="py-2 px-4 capitalize">{permission.module}</td>
                      <td className="py-2 px-4">
                        <Badge className={getActionBadgeColor(permission.action)}>
                          {permission.action}
                        </Badge>
                      </td>
                      <td className="py-2 px-4">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.location.href = `permissions/edit/${permission.id}`}
                            title="Edit Permission"
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeletePermission(permission.id)}
                            className="text-red-500 hover:text-red-700"
                            title="Delete Permission"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PermissionsPage;
