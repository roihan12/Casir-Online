import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  PlusCircle, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  Plus
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@common/components/ui/card";
import { Button } from "@common/components/ui/button";
import { Input } from "@common/components/ui/input";
import { useToast } from "@app/providers/ToastContext";
import { usePermissions, useDeletePermission, useCreatePermission, useUpdatePermission } from "../hooks/usePermissions";
import { Badge } from "@common/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@common/components/ui/tabs";
import { Can } from "@features/common/Can";
import Modal from "@features/common/Modal";
import PermissionForm from "../components/PermissionForm";

const PermissionsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeModule, setActiveModule] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch permissions data
  const { 
    data: permissionsData, 
    isLoading, 
    error 
  } = usePermissions();

  const permissions = permissionsData?.data || [];

  // Mutations
  const createMutation = useCreatePermission();
  const updateMutation = useUpdatePermission();
  const deleteMutation = useDeletePermission();

  // Get unique modules for filtering
  const modules = ["all", ...new Set(permissions.map(permission => permission.module))];

  // Filter permissions based on search term and active module
  const filteredPermissions = permissions.filter(permission => 
    (activeModule === "all" || permission.module === activeModule) &&
    (permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     permission.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
     permission.module.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreate = () => {
    setEditingPermission(null);
    setIsModalOpen(true);
  };

  const handleEdit = (permission) => {
    setEditingPermission(permission);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this permission?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleFormSubmit = (data) => {
    if (editingPermission) {
      updateMutation.mutate({ id: editingPermission.id, data }, {
        onSuccess: () => setIsModalOpen(false)
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => setIsModalOpen(false)
      });
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
          <Can permission="permission:create">
            <Button onClick={handleCreate} className="flex items-center gap-2">
              <Plus size={16} /> Add Permission
            </Button>
          </Can>
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
            <TabsList className="flex flex-wrap gap-2 h-auto justify-start bg-transparent">
              {modules.map(module => (
                <TabsTrigger 
                  key={module} 
                  value={module}
                  className="capitalize border data-[state=active]:bg-slate-900 data-[state=active]:text-white"
                >
                  {module}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50">
                <tr className="border-b">
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Name</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Description</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Module</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Action</th>
                  <th className="py-3 px-4 text-center text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPermissions.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-gray-500">
                      No permissions found
                    </td>
                  </tr>
                ) : (
                  filteredPermissions.map((permission) => (
                    <tr key={permission.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium">{permission.name}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{permission.description}</td>
                      <td className="py-3 px-4 text-sm capitalize">{permission.module}</td>
                      <td className="py-3 px-4">
                        <Badge className={`${getActionBadgeColor(permission.action)} border-none shadow-none`}>
                          {permission.action}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center gap-1">
                          <Can permission="permission:update">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                              onClick={() => handleEdit(permission)}
                            >
                              <Edit size={14} />
                            </Button>
                          </Can>
                          <Can permission="permission:delete">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:bg-red-50"
                              onClick={() => handleDelete(permission.id)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </Can>
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingPermission ? "Edit Permission" : "Add Permission"}>
        <PermissionForm 
          permission={editingPermission}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsModalOpen(false)}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>
    </div>
  );
};

export default PermissionsPage;
