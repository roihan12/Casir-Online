import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  PlusCircle, 
  Edit, 
  Trash2, 
  Search,
  MessageSquare,
  Copy,
  Tag,
  Filter,
  ChevronDown,
  Check,
  Eye
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../components/ui/tabs";
import { Badge } from "../../../../components/ui/badge";
import { useToast } from "../../../../hooks/useToast";

// Mock service - replace with actual service
const templateService = {
  getTemplates: async () => {
    // Mock data - replace with actual API call
    return [
      {
        id: "1",
        name: "Welcome Message",
        content: "Halo {{customerName}}, terima kasih telah menghubungi Casir-Online. Ada yang bisa kami bantu?",
        type: "GREETING",
        variables: ["customerName"],
        isActive: true,
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-01T00:00:00.000Z"
      },
      {
        id: "2",
        name: "Order Confirmation",
        content: "Pesanan #{{orderNumber}} telah dikonfirmasi. Total pembayaran: Rp {{amount}}. Metode pembayaran: {{paymentMethod}}. Terima kasih telah berbelanja di Casir-Online.",
        type: "ORDER",
        variables: ["orderNumber", "amount", "paymentMethod"],
        isActive: true,
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-01T00:00:00.000Z"
      },
      {
        id: "3",
        name: "Shipping Notification",
        content: "Pesanan #{{orderNumber}} telah dikirim melalui {{courier}}. Nomor resi: {{trackingNumber}}. Estimasi tiba: {{estimatedArrival}}.",
        type: "SHIPPING",
        variables: ["orderNumber", "courier", "trackingNumber", "estimatedArrival"],
        isActive: true,
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-01T00:00:00.000Z"
      },
      {
        id: "4",
        name: "Product Inquiry Response",
        content: "Terima kasih atas pertanyaan tentang {{productName}}. Produk tersebut {{availability}}. Harga: Rp {{price}}. Ada pertanyaan lain?",
        type: "PRODUCT",
        variables: ["productName", "availability", "price"],
        isActive: true,
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-01T00:00:00.000Z"
      },
      {
        id: "5",
        name: "Promo Notification",
        content: "PROMO SPESIAL! {{promoName}} - {{promoDescription}}. Berlaku hingga {{endDate}}. Gunakan kode: {{promoCode}}. Jangan lewatkan!",
        type: "MARKETING",
        variables: ["promoName", "promoDescription", "endDate", "promoCode"],
        isActive: true,
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-01T00:00:00.000Z"
      }
    ];
  },
  deleteTemplate: async (id) => {
    // Mock delete - replace with actual API call
    console.log("Deleting template:", id);
    return { success: true };
  }
};

// Form validation schema
const templateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  content: z.string().min(10, "Template content is required"),
  type: z.string().min(1, "Template type is required"),
  isActive: z.boolean().optional()
});

const WhatsAppTemplatesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch templates data
  const { 
    data: templates = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ["whatsappTemplates"],
    queryFn: templateService.getTemplates,
  });

  // Form setup
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isDirty },
    reset,
    setValue
  } = useForm({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      content: "",
      type: "GREETING",
      isActive: true
    }
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: templateService.deleteTemplate,
    onSuccess: () => {
      toast({
        title: "Template deleted successfully",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["whatsappTemplates"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete template",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter templates based on search term and type filter
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === "all" || template.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  // Get unique types for filter
  const types = ["all", ...new Set(templates.map(template => template.type))];

  const handleDeleteTemplate = (id) => {
    if (window.confirm("Are you sure you want to delete this template?")) {
      deleteTemplateMutation.mutate(id);
    }
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setShowCreateForm(true);
    setValue("name", template.name);
    setValue("content", template.content);
    setValue("type", template.type);
    setValue("isActive", template.isActive);
  };

  const handleCopyTemplate = (content) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Template copied to clipboard",
      variant: "success",
    });
  };

  const onSubmit = (data) => {
    console.log("Form data:", data);
    // Mock form submission - replace with actual API call
    toast({
      title: editingTemplate ? "Template updated successfully" : "Template created successfully",
      variant: "success",
    });
    setShowCreateForm(false);
    setEditingTemplate(null);
    reset();
  };

  const highlightVariables = (content) => {
    // Replace {{variable}} with highlighted spans
    return content.replace(/\{\{([^}]+)\}\}/g, '<span class="bg-blue-100 text-blue-800 px-1 rounded">{{$1}}</span>');
  };

  if (isLoading) return <div className="flex justify-center p-8">Loading templates...</div>;
  if (error) return <div className="text-red-500 p-8">Error loading templates: {error.message}</div>;

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare size={24} />
              WhatsApp Templates
            </CardTitle>
            <CardDescription>
              Create and manage message templates for your WhatsApp bot
            </CardDescription>
          </div>
          <Button 
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              setEditingTemplate(null);
              reset();
            }} 
            className="flex items-center gap-2"
          >
            {showCreateForm ? "Cancel" : (
              <>
                <PlusCircle size={16} />
                Create Template
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          {showCreateForm ? (
            <div className="mb-6 border rounded-md p-4">
              <h3 className="text-lg font-medium mb-4">
                {editingTemplate ? "Edit Template" : "Create New Template"}
              </h3>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Template Name</label>
                    <Input 
                      {...register("name")}
                      placeholder="Enter template name" 
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Template Type</label>
                    <select
                      {...register("type")}
                      className="w-full rounded-md border border-gray-300 p-2"
                    >
                      <option value="GREETING">Greeting</option>
                      <option value="ORDER">Order</option>
                      <option value="SHIPPING">Shipping</option>
                      <option value="PRODUCT">Product</option>
                      <option value="MARKETING">Marketing</option>
                      <option value="CUSTOMER_SERVICE">Customer Service</option>
                      <option value="PAYMENT">Payment</option>
                      <option value="OTHER">Other</option>
                    </select>
                    {errors.type && (
                      <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Template Content</label>
                  <textarea
                    {...register("content")}
                    placeholder="Enter template content. Use {{variableName}} for dynamic variables."
                    className="w-full rounded-md border border-gray-300 p-2 h-32"
                  />
                  {errors.content && (
                    <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Use {{variableName}} syntax for variables that will be replaced with actual values.
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    {...register("isActive")}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium">
                    Active (Available for use)
                  </label>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingTemplate(null);
                      reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="flex items-center gap-2"
                  >
                    <Save size={16} />
                    {editingTemplate ? "Update Template" : "Save Template"}
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="mb-6 flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search templates..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="relative">
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => document.getElementById('typeDropdown').classList.toggle('hidden')}
                >
                  <Filter size={16} />
                  Type
                  <ChevronDown size={14} />
                </Button>
                <div 
                  id="typeDropdown" 
                  className="absolute right-0 mt-1 w-40 bg-white border rounded-md shadow-lg z-10 hidden"
                >
                  {types.map(type => (
                    <div 
                      key={type}
                      className={`px-4 py-2 hover:bg-gray-100 cursor-pointer capitalize ${
                        typeFilter === type ? 'bg-blue-50 text-blue-600' : ''
                      }`}
                      onClick={() => {
                        setTypeFilter(type);
                        document.getElementById('typeDropdown').classList.add('hidden');
                      }}
                    >
                      {type === "all" ? "All Types" : type.toLowerCase().replace(/_/g, ' ')}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!showCreateForm && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.length === 0 ? (
                <div className="md:col-span-2 text-center text-gray-500 p-8">
                  No templates found
                </div>
              ) : (
                filteredTemplates.map((template) => (
                  <Card key={template.id} className="overflow-hidden">
                    <CardHeader className="bg-gray-50 p-4 flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <Badge className="mt-1">
                          {template.type.replace(/_/g, ' ').toLowerCase()}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyTemplate(template.content)}
                          className="h-8 w-8 p-0"
                          title="Copy Template"
                        >
                          <Copy size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTemplate(template)}
                          className="h-8 w-8 p-0"
                          title="Edit Template"
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="h-8 w-8 p-0 text-red-500"
                          title="Delete Template"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div 
                        className="text-sm"
                        dangerouslySetInnerHTML={{ __html: highlightVariables(template.content) }}
                      />
                    </CardContent>
                    <CardFooter className="bg-gray-50 p-3 flex justify-between text-xs text-gray-500">
                      <div>
                        Variables: {template.variables.map(v => `{{${v}}}`).join(", ")}
                      </div>
                      <div className="flex items-center">
                        {template.isActive ? (
                          <span className="flex items-center text-green-600">
                            <Check size={14} className="mr-1" /> Active
                          </span>
                        ) : (
                          <span className="text-gray-500">Inactive</span>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppTemplatesPage;
