import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Save, 
  Brain, 
  Sparkles,
  MessageSquare,
  BarChart,
  Settings,
  Zap,
  Sliders,
  Database,
  RefreshCw
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

// Mock service - replace with actual service
const aiAgentService = {
  getAIConfig: async () => {
    // Mock data - replace with actual API call
    return {
      id: "1",
      name: "Casir AI Assistant",
      provider: "OPENAI",
      model: "gpt-4",
      apiKey: "********",
      temperature: 0.7,
      maxTokens: 1000,
      personality: "Friendly and helpful sales assistant",
      contextLength: 10,
      isActive: true,
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:00:00.000Z"
    };
  },
  updateAIConfig: async (data) => {
    // Mock update - replace with actual API call
    console.log("Updating AI config:", data);
    return { ...data, updatedAt: new Date().toISOString() };
  },
  getAIStats: async () => {
    // Mock stats - replace with actual API call
    return { 
      totalInteractions: 1245,
      successfulResponses: 1180,
      handoffs: 65,
      averageResponseTime: 1.8,
      topIntents: [
        { name: "Product Inquiry", count: 450 },
        { name: "Order Status", count: 320 },
        { name: "Price Check", count: 280 },
        { name: "Complaint", count: 120 },
        { name: "Return", count: 75 }
      ],
      sentiment: {
        positive: 65,
        neutral: 30,
        negative: 5
      }
    };
  }
};

// Form validation schema
const aiConfigSchema = z.object({
  name: z.string().min(1, "AI name is required"),
  provider: z.string().min(1, "Provider is required"),
  model: z.string().min(1, "Model is required"),
  apiKey: z.string().min(1, "API key is required"),
  temperature: z.coerce.number().min(0).max(1),
  maxTokens: z.coerce.number().min(100).max(8000),
  personality: z.string().min(10, "Personality description should be detailed"),
  contextLength: z.coerce.number().min(1).max(20),
  isActive: z.boolean().optional()
});

const AIAgentPage = () => {
  const [activeTab, setActiveTab] = useState("general");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch AI configuration
  const { 
    data: aiConfig, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ["aiConfig"],
    queryFn: aiAgentService.getAIConfig,
  });

  // Fetch AI stats
  const { 
    data: aiStats, 
    isLoading: statsLoading
  } = useQuery({
    queryKey: ["aiStats"],
    queryFn: aiAgentService.getAIStats,
  });

  // Form setup
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isDirty },
    reset,
    watch
  } = useForm({
    resolver: zodResolver(aiConfigSchema),
    defaultValues: {
      name: "",
      provider: "OPENAI",
      model: "gpt-4",
      apiKey: "",
      temperature: 0.7,
      maxTokens: 1000,
      personality: "",
      contextLength: 10,
      isActive: false
    }
  });

  // Update form values when data is loaded
  React.useEffect(() => {
    if (aiConfig) {
      reset({
        name: aiConfig.name,
        provider: aiConfig.provider,
        model: aiConfig.model,
        apiKey: aiConfig.apiKey,
        temperature: aiConfig.temperature,
        maxTokens: aiConfig.maxTokens,
        personality: aiConfig.personality,
        contextLength: aiConfig.contextLength,
        isActive: aiConfig.isActive
      });
    }
  }, [aiConfig, reset]);

  // Watch temperature value for slider
  const temperature = watch("temperature");
  const maxTokens = watch("maxTokens");
  const contextLength = watch("contextLength");

  // Update AI config mutation
  const updateAIConfigMutation = useMutation({
    mutationFn: aiAgentService.updateAIConfig,
    onSuccess: () => {
      toast({
        title: "AI configuration updated successfully",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["aiConfig"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update AI configuration",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data) => {
    updateAIConfigMutation.mutate(data);
  };

  if (isLoading) return <div className="flex justify-center p-8">Loading AI configuration...</div>;
  if (error) return <div className="text-red-500 p-8">Error loading AI configuration: {error.message}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Configuration Card */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Brain className="h-6 w-6" />
                AI Agent Configuration
              </CardTitle>
              <CardDescription>
                Configure your AI agent for WhatsApp to handle customer inquiries automatically
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="model">Model Settings</TabsTrigger>
                  <TabsTrigger value="personality">Personality</TabsTrigger>
                  <TabsTrigger value="context">Context</TabsTrigger>
                </TabsList>
                
                <form id="aiConfigForm" onSubmit={handleSubmit(onSubmit)}>
                  <TabsContent value="general" className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">AI Name</label>
                      <Input 
                        {...register("name")}
                        placeholder="Enter AI assistant name" 
                      />
                      {errors.name && (
                        <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">AI Provider</label>
                      <select
                        {...register("provider")}
                        className="w-full rounded-md border border-gray-300 p-2"
                      >
                        <option value="OPENAI">OpenAI</option>
                        <option value="ANTHROPIC">Anthropic</option>
                        <option value="GOOGLE">Google AI</option>
                        <option value="AZURE">Azure OpenAI</option>
                      </select>
                      {errors.provider && (
                        <p className="text-red-500 text-sm mt-1">{errors.provider.message}</p>
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
                        Active (Enable AI to respond to messages)
                      </label>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="model" className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Model</label>
                      <select
                        {...register("model")}
                        className="w-full rounded-md border border-gray-300 p-2"
                      >
                        <option value="gpt-4">GPT-4</option>
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                        <option value="claude-3-opus">Claude 3 Opus</option>
                        <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                        <option value="gemini-pro">Gemini Pro</option>
                      </select>
                      {errors.model && (
                        <p className="text-red-500 text-sm mt-1">{errors.model.message}</p>
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
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="block text-sm font-medium">Temperature: {temperature}</label>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        {...register("temperature")}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>More Focused</span>
                        <span>More Creative</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="block text-sm font-medium">Max Tokens: {maxTokens}</label>
                      </div>
                      <input
                        type="range"
                        min="100"
                        max="8000"
                        step="100"
                        {...register("maxTokens")}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Shorter</span>
                        <span>Longer</span>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="personality" className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">AI Personality</label>
                      <textarea
                        {...register("personality")}
                        placeholder="Describe how the AI should behave and respond to customers"
                        className="w-full rounded-md border border-gray-300 p-2 h-32"
                      />
                      {errors.personality && (
                        <p className="text-red-500 text-sm mt-1">{errors.personality.message}</p>
                      )}
                    </div>
                    
                    <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                      <p className="text-sm text-blue-800">
                        <strong>Tip:</strong> Be specific about tone, knowledge areas, and how to handle different customer situations.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        type="button" 
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          reset({
                            ...watch(),
                            personality: "Friendly and helpful sales assistant who knows all about our products and can assist customers with finding the right items based on their needs. Always polite and patient."
                          });
                        }}
                      >
                        Sales Assistant
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          reset({
                            ...watch(),
                            personality: "Technical support specialist who can troubleshoot issues with our products and services. Explains technical concepts in simple terms and guides customers through solutions step by step."
                          });
                        }}
                      >
                        Support Specialist
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="context" className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="block text-sm font-medium">Context Length: {contextLength} messages</label>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        step="1"
                        {...register("contextLength")}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Less Context</span>
                        <span>More Context</span>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
                      <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> Higher context length allows the AI to remember more of the conversation history, but uses more tokens and may increase costs.
                      </p>
                    </div>
                    
                    <div className="border rounded-md p-3">
                      <h3 className="text-sm font-medium mb-2">Knowledge Integration</h3>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="product-knowledge"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                            defaultChecked
                          />
                          <label htmlFor="product-knowledge" className="text-sm">
                            Product Catalog
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="faq-knowledge"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                            defaultChecked
                          />
                          <label htmlFor="faq-knowledge" className="text-sm">
                            FAQs
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="policy-knowledge"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                            defaultChecked
                          />
                          <label htmlFor="policy-knowledge" className="text-sm">
                            Store Policies
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="promo-knowledge"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                            defaultChecked
                          />
                          <label htmlFor="promo-knowledge" className="text-sm">
                            Current Promotions
                          </label>
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
                form="aiConfigForm"
                disabled={!isDirty || updateAIConfigMutation.isPending}
                className="flex items-center gap-2"
              >
                <Save size={16} />
                {updateAIConfigMutation.isPending ? "Saving..." : "Save Configuration"}
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Stats Card */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <BarChart size={18} />
                  AI Performance
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => queryClient.invalidateQueries({ queryKey: ["aiStats"] })}
                  disabled={statsLoading}
                  className="h-8 w-8 p-0"
                >
                  <RefreshCw size={16} />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex justify-center p-4">
                  <RefreshCw className="animate-spin h-6 w-6 text-gray-500" />
                </div>
              ) : aiStats ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-3 rounded-md text-center">
                      <div className="text-2xl font-bold text-blue-700">{aiStats.totalInteractions}</div>
                      <div className="text-xs text-blue-600">Total Interactions</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-md text-center">
                      <div className="text-2xl font-bold text-green-700">{Math.round((aiStats.successfulResponses / aiStats.totalInteractions) * 100)}%</div>
                      <div className="text-xs text-green-600">Success Rate</div>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-md text-center">
                      <div className="text-2xl font-bold text-yellow-700">{aiStats.handoffs}</div>
                      <div className="text-xs text-yellow-600">Human Handoffs</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-md text-center">
                      <div className="text-2xl font-bold text-purple-700">{aiStats.averageResponseTime}s</div>
                      <div className="text-xs text-purple-600">Avg. Response Time</div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Top Intents</h3>
                    <div className="space-y-2">
                      {aiStats.topIntents.map((intent, index) => (
                        <div key={index} className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${(intent.count / aiStats.topIntents[0].count) * 100}%` }}
                            ></div>
                          </div>
                          <div className="ml-2 text-xs w-32 flex justify-between">
                            <span>{intent.name}</span>
                            <span className="text-gray-500">{intent.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Sentiment Analysis</h3>
                    <div className="flex h-4 rounded-full overflow-hidden">
                      <div 
                        className="bg-green-500" 
                        style={{ width: `${aiStats.sentiment.positive}%` }}
                        title={`Positive: ${aiStats.sentiment.positive}%`}
                      ></div>
                      <div 
                        className="bg-gray-300" 
                        style={{ width: `${aiStats.sentiment.neutral}%` }}
                        title={`Neutral: ${aiStats.sentiment.neutral}%`}
                      ></div>
                      <div 
                        className="bg-red-500" 
                        style={{ width: `${aiStats.sentiment.negative}%` }}
                        title={`Negative: ${aiStats.sentiment.negative}%`}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-green-600">Positive</span>
                      <span className="text-gray-500">Neutral</span>
                      <span className="text-red-600">Negative</span>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <Zap size={16} />
                      View Detailed Analytics
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 p-4">
                  Performance data not available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AIAgentPage;
