import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { 
  PlusCircle, 
  Edit, 
  Trash2, 
  Search,
  ShieldCheck,
  UserCheck
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
import { roleService } from "../../../../services/roleService";

const RolesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch roles data
  const { 
    data: roles = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ["roles"],
    queryFn: roleService.getAllRoles,
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: roleService.deleteRole,
    onSuccess: () => {
      toast({
        title: "Role deleted successfully",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete role",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter roles based on search term
  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteRole = (id) => {
    if (window.confirm("Are you sure you want to delete this role?")) {
      deleteRoleMutation.mutate(id);
    }
  };

  if (isLoading) return <div className="flex justify-center p-8">Loading roles...</div>;
  if (error) return <div className="text-red-500 p-8">Error loading roles: {error.message}</div>;

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-bold">Roles Management</CardTitle>
          <Button 
            onClick={() => navigate("create")} 
            className="flex items-center gap-2"
          >
            <PlusCircle size={16} />
            Add New Role
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search roles..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="py-2 px-4 text-left">Name</th>
                  <th className="py-2 px-4 text-left">Description</th>
                  <th className="py-2 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoles.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="py-4 text-center text-gray-500">
                      No roles found
                    </td>
                  </tr>
                ) : (
                  filteredRoles.map((role) => (
                    <tr key={role.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4">{role.name}</td>
                      <td className="py-2 px-4">{role.description}</td>
                      <td className="py-2 px-4">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`${role.id}/permissions`)}
                            title="Manage Permissions"
                          >
                            <ShieldCheck size={16} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`${role.id}/users`)}
                            title="Manage Users"
                          >
                            <UserCheck size={16} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`edit/${role.id}`)}
                            title="Edit Role"
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteRole(role.id)}
                            className="text-red-500 hover:text-red-700"
                            title="Delete Role"
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

export default RolesPage;
