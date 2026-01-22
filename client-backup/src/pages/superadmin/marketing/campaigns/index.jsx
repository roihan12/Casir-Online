import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { 
  PlusCircle, 
  Edit, 
  Trash2, 
  Search,
  Calendar,
  Users,
  Tag,
  Eye,
  ChevronDown,
  Filter,
  ArrowUpDown,
  Megaphone
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Badge } from "../../../../components/ui/badge";
import { useToast } from "../../../../hooks/useToast";
import { z } from "zod";

// Mock service - replace with actual service
const marketingService = {
  getCampaigns: async () => {
    // Mock data - replace with actual API call
    return [
      {
        id: "1",
        name: "Summer Sale 2025",
        description: "Discount on all summer products",
        status: "ACTIVE",
        type: "DISCOUNT",
        startDate: "2025-06-01T00:00:00.000Z",
        endDate: "2025-06-30T23:59:59.000Z",
        targetAudience: "ALL",
        audienceCount: 2500,
        createdAt: "2025-05-15T00:00:00.000Z",
        updatedAt: "2025-05-15T00:00:00.000Z"
      },
      {
        id: "2",
        name: "New Customer Welcome",
        description: "Welcome message for new customers",
        status: "ACTIVE",
        type: "NOTIFICATION",
        startDate: "2025-01-01T00:00:00.000Z",
        endDate: "2025-12-31T23:59:59.000Z",
        targetAudience: "NEW_CUSTOMERS",
        audienceCount: 150,
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-01T00:00:00.000Z"
      },
      {
        id: "3",
        name: "Back to School Promo",
        description: "Special offers on school supplies",
        status: "DRAFT",
        type: "DISCOUNT",
        startDate: "2025-07-15T00:00:00.000Z",
        endDate: "2025-08-15T23:59:59.000Z",
        targetAudience: "SEGMENT",
        audienceCount: 1200,
        createdAt: "2025-05-20T00:00:00.000Z",
        updatedAt: "2025-05-20T00:00:00.000Z"
      },
      {
        id: "4",
        name: "Loyalty Rewards",
        description: "Special offers for loyal customers",
        status: "SCHEDULED",
        type: "REWARD",
        startDate: "2025-07-01T00:00:00.000Z",
        endDate: "2025-07-31T23:59:59.000Z",
        targetAudience: "LOYAL_CUSTOMERS",
        audienceCount: 850,
        createdAt: "2025-06-01T00:00:00.000Z",
        updatedAt: "2025-06-01T00:00:00.000Z"
      },
      {
        id: "5",
        name: "Flash Sale - Weekend",
        description: "24-hour sale on selected items",
        status: "COMPLETED",
        type: "DISCOUNT",
        startDate: "2025-05-25T00:00:00.000Z",
        endDate: "2025-05-26T23:59:59.000Z",
        targetAudience: "ALL",
        audienceCount: 2500,
        createdAt: "2025-05-20T00:00:00.000Z",
        updatedAt: "2025-05-27T00:00:00.000Z"
      }
    ];
  },
  deleteCampaign: async (id) => {
    // Mock delete - replace with actual API call
    console.log("Deleting campaign:", id);
    return { success: true };
  }
};

const MarketingCampaignsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch campaigns data
  const { 
    data: campaigns = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ["marketingCampaigns"],
    queryFn: marketingService.getCampaigns,
  });

  // Delete campaign mutation
  const deleteCampaignMutation = useMutation({
    mutationFn: marketingService.deleteCampaign,
    onSuccess: () => {
      toast({
        title: "Campaign deleted successfully",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["marketingCampaigns"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete campaign",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter campaigns based on search term and filters
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = 
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || campaign.status === statusFilter;
    const matchesType = typeFilter === "all" || campaign.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Get unique statuses and types for filters
  const statuses = ["all", ...new Set(campaigns.map(campaign => campaign.status))];
  const types = ["all", ...new Set(campaigns.map(campaign => campaign.type))];

  const handleDeleteCampaign = (id) => {
    if (window.confirm("Are you sure you want to delete this campaign?")) {
      deleteCampaignMutation.mutate(id);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-800";
      case "DRAFT": return "bg-gray-100 text-gray-800";
      case "SCHEDULED": return "bg-blue-100 text-blue-800";
      case "COMPLETED": return "bg-purple-100 text-purple-800";
      case "CANCELLED": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeBadgeColor = (type) => {
    switch (type) {
      case "DISCOUNT": return "bg-yellow-100 text-yellow-800";
      case "NOTIFICATION": return "bg-blue-100 text-blue-800";
      case "REWARD": return "bg-purple-100 text-purple-800";
      case "EMAIL": return "bg-indigo-100 text-indigo-800";
      case "SMS": return "bg-teal-100 text-teal-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) return <div className="flex justify-center p-8">Loading campaigns...</div>;
  if (error) return <div className="text-red-500 p-8">Error loading campaigns: {error.message}</div>;

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Megaphone size={24} />
              Marketing Campaigns
            </CardTitle>
            <CardDescription>
              Create and manage marketing campaigns for your customers
            </CardDescription>
          </div>
          <Button 
            onClick={() => navigate("create")} 
            className="flex items-center gap-2"
          >
            <PlusCircle size={16} />
            Create Campaign
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search campaigns..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <div className="relative">
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => document.getElementById('statusDropdown').classList.toggle('hidden')}
                  >
                    <Filter size={16} />
                    Status
                    <ChevronDown size={14} />
                  </Button>
                  <div 
                    id="statusDropdown" 
                    className="absolute right-0 mt-1 w-40 bg-white border rounded-md shadow-lg z-10 hidden"
                  >
                    {statuses.map(status => (
                      <div 
                        key={status}
                        className={`px-4 py-2 hover:bg-gray-100 cursor-pointer capitalize ${
                          statusFilter === status ? 'bg-blue-50 text-blue-600' : ''
                        }`}
                        onClick={() => {
                          setStatusFilter(status);
                          document.getElementById('statusDropdown').classList.add('hidden');
                        }}
                      >
                        {status === "all" ? "All Statuses" : status.toLowerCase()}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="relative">
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => document.getElementById('typeDropdown').classList.toggle('hidden')}
                  >
                    <Tag size={16} />
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
                        {type === "all" ? "All Types" : type.toLowerCase()}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="py-3 px-4 text-left">Campaign</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-left">Type</th>
                  <th className="py-3 px-4 text-left">Date Range</th>
                  <th className="py-3 px-4 text-left">Audience</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-4 text-center text-gray-500">
                      No campaigns found
                    </td>
                  </tr>
                ) : (
                  filteredCampaigns.map((campaign) => (
                    <tr key={campaign.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium">{campaign.name}</div>
                        <div className="text-sm text-gray-500">{campaign.description}</div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusBadgeColor(campaign.status)}>
                          {campaign.status.replace(/_/g, ' ').toLowerCase()}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getTypeBadgeColor(campaign.type)}>
                          {campaign.type.replace(/_/g, ' ').toLowerCase()}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar size={14} />
                          {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <Users size={14} />
                          <span className="text-sm">
                            {campaign.audienceCount.toLocaleString()} 
                            <span className="text-gray-500 ml-1">
                              ({campaign.targetAudience.replace(/_/g, ' ').toLowerCase()})
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`view/${campaign.id}`)}
                            title="View Campaign"
                          >
                            <Eye size={16} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`edit/${campaign.id}`)}
                            title="Edit Campaign"
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCampaign(campaign.id)}
                            className="text-red-500 hover:text-red-700"
                            title="Delete Campaign"
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

export default MarketingCampaignsPage;
