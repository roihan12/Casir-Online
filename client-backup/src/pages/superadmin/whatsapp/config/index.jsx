import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Save, 
  Smartphone, 
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings,
  Battery,
  Clock
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
import { useToast } from "../../../../hooks/useToast";
import { Badge } from "../../../../components/ui/badge";
import whatsappService from "../../../../services/whatsappService";

// Form validation schema
const botConfigSchema = z.object({
  name: z.string().min(1, "Bot name is required"),
  apiKey: z.string().min(1, "API key is required"),
  apiUrl: z.string().url("Must be a valid URL"),
  phoneNumber: z.string().min(10, "Valid phone number required"),
  webhookUrl: z.string().url("Must be a valid URL"),
  isActive: z.boolean().optional()
});

const WhatsAppConfigPage = () => {
  const [activeTab, setActiveTab] = useState("general");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch bot configuration
  const { 
    data: botConfig, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ["botConfig"],
    queryFn: whatsappService.getBotConfig,
  });

  // Status check query
  const { 
    data: botStatus, 
    isLoading: statusLoading, 
    error: statusError,
    refetch: refetchStatus 
  } = useQuery({
    queryKey: ["botStatus"],
    queryFn: whatsappService.getBotStatus,
    refetchInterval: 60000, // Refresh every minute
  });

  // Form setup
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isDirty },
    reset
  } = useForm({
    resolver: zodResolver(botConfigSchema),
    defaultValues: {
      name: "",
      apiKey: "",
      apiUrl: "",
      phoneNumber: "",
      webhookUrl: "",
      isActive: false
    }
  });

  // Update form values when data is loaded
  React.useEffect(() => {
    if (botConfig) {
      reset({
        name: botConfig.name,
        apiKey: botConfig.apiKey,
        apiUrl: botConfig.apiUrl,
        phoneNumber: botConfig.phoneNumber,
        webhookUrl: botConfig.webhookUrl,
        isActive: botConfig.isActive
      });
    }
  }, [botConfig, reset]);

  // Update bot config mutation
  const updateBotConfigMutation = useMutation({
    mutationFn: whatsappService.updateBotConfig,
    onSuccess: () => {
      toast({
        title: "Configuration updated successfully",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["botConfig"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update configuration",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  // Restart bot mutation
  const restartBotMutation = useMutation({
    mutationFn: whatsappService.restartBot,
    onSuccess: () => {
      toast({
        title: "Bot restarted successfully",
        description: "The WhatsApp bot is restarting. This may take a few moments.",
        variant: "success",
      });
      // Refetch status after a short delay to allow the bot to restart
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["botStatus"] });
      }, 5000);
    },
    onError: (error) => {
      toast({
        title: "Failed to restart bot",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data) => {
    updateBotConfigMutation.mutate(data);
  };

  if (isLoading) return (
    <div className="flex justify-center items-center p-8 h-64">
      <div className="animate-pulse flex flex-col items-center">
        <Settings className="h-12 w-12 text-gray-400 animate-spin" />
        <p className="mt-4 text-gray-500">Loading configuration...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="p-8 border border-red-200 rounded-lg bg-red-50">
      <div className="flex items-center text-red-600 mb-2">
        <AlertTriangle className="h-5 w-5 mr-2" />
        <h3 className="font-medium">Error loading configuration</h3>
      </div>
      <p className="text-red-500">{error.message || "An unexpected error occurred"}</p>
      <Button 
        variant="outline" 
        className="mt-4" 
        onClick={() => queryClient.invalidateQueries({ queryKey: ["botConfig"] })}
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Retry
      </Button>
    </div>
  );

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Configuration Card */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">WhatsApp Bot Configuration</CardTitle>
              <CardDescription>
                Configure your WhatsApp bot settings and API credentials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="api">API Settings</TabsTrigger>
                  <TabsTrigger value="webhook">Webhook</TabsTrigger>
                </TabsList>
                
                <form id="configForm" onSubmit={handleSubmit(onSubmit)}>
                  <TabsContent value="general" className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Bot Name</label>
                      <Input 
                        {...register("name")}
                        placeholder="Enter bot name" 
                      />
                      {errors.name && (
                        <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Phone Number</label>
                      <Input 
                        {...register("phoneNumber")}
                        placeholder="Enter phone number with country code" 
                      />
                      {errors.phoneNumber && (
                        <p className="text-red-500 text-sm mt-1">{errors.phoneNumber.message}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isActive"
                        {...register("isActive")}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="isActive" className="text-sm font-medium">
                        Active (Enable bot to respond to messages)
                      </label>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="api" className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">API URL</label>
                      <Input 
                        {...register("apiUrl")}
                        placeholder="Enter API URL" 
                      />
                      {errors.apiUrl && (
                        <p className="text-red-500 text-sm mt-1">{errors.apiUrl.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">API Key</label>
                      <Input 
                        {...register("apiKey")}
                        type="password"
                        placeholder="Enter API key" 
                      />
                      {errors.apiKey && (
                        <p className="text-red-500 text-sm mt-1">{errors.apiKey.message}</p>
                      )}
                    </div>
                    
                    <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
                      <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> Keep your API key secure. It provides full access to your WhatsApp account.
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="webhook" className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Webhook URL</label>
                      <Input 
                        {...register("webhookUrl")}
                        placeholder="Enter webhook URL" 
                      />
                      {errors.webhookUrl && (
                        <p className="text-red-500 text-sm mt-1">{errors.webhookUrl.message}</p>
                      )}
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                      <p className="text-sm text-gray-600">
                        The webhook URL will receive events from WhatsApp. Make sure it's publicly accessible and properly secured.
                      </p>
                    </div>
                    
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Webhook Events</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="event-message" checked disabled />
                          <label htmlFor="event-message" className="text-sm">Messages</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="event-status" checked disabled />
                          <label htmlFor="event-status" className="text-sm">Status Updates</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="event-delivery" checked disabled />
                          <label htmlFor="event-delivery" className="text-sm">Delivery Reports</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="event-read" checked disabled />
                          <label htmlFor="event-read" className="text-sm">Read Receipts</label>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </form>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                type="submit" 
                form="configForm" 
                className="w-full" 
                disabled={!isDirty || updateBotConfigMutation.isPending}
              >
                {updateBotConfigMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Configuration
                  </>
                )}
              </Button>
              {updateBotConfigMutation.isError && (
                <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded text-red-600 text-sm">
                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                  {updateBotConfigMutation.error?.message || "Failed to save configuration"}
                </div>
              )}
            </CardFooter>
          </Card>
        </div>
        
        {/* Status Card */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Smartphone className="h-5 w-5 mr-2" />
                Bot Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statusLoading ? (
                <div className="flex justify-center p-4 animate-pulse">
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin text-gray-400" />
                  <span className="text-gray-500">Checking status...</span>
                </div>
              ) : statusError ? (
                <div className="p-4 border border-red-100 rounded-md bg-red-50">
                  <div className="flex items-center text-red-600 mb-2">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">Error checking status</span>
                  </div>
                  <p className="text-red-500 text-xs">{statusError.message || "An unexpected error occurred"}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Connection Status:</span>
                    {botStatus?.connected ? (
                      <Badge variant="success" className="flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="flex items-center">
                        <XCircle className="h-3 w-3 mr-1" />
                        Disconnected
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Phone Number:</span>
                    <span className="font-medium text-sm">{botStatus?.phoneNumber}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Battery Level:</span>
                    <div className="flex items-center">
                      <Battery className="h-4 w-4 mr-1 text-gray-600" />
                      <span className="font-medium text-sm">
                        {botStatus?.batteryLevel}%
                        {botStatus?.batteryLevel < 20 && (
                          <span className="ml-1 text-red-500">(Low)</span>
                        )}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Last Seen:</span>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-gray-600" />
                      <span className="font-medium text-sm">
                        {botStatus?.lastSeen ? new Date(botStatus.lastSeen).toLocaleString() : "Unknown"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => refetchStatus()}
                disabled={statusLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${statusLoading ? "animate-spin" : ""}`} />
                Refresh Status
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => restartBotMutation.mutate()}
                disabled={restartBotMutation.isPending}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${restartBotMutation.isPending ? "animate-spin" : ""}`} />
                Restart Bot
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppConfigPage;
