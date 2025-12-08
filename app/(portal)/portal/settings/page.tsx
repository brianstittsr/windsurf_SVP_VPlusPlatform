"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Eye,
  EyeOff,
  Save,
  TestTube,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  Zap,
  Video,
  Brain,
  Server,
  Webhook,
  Key,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ApiKeyConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  keyField: string;
  webhookField?: string;
  additionalFields?: { name: string; label: string; placeholder: string }[];
  status: "connected" | "disconnected" | "error";
  lastTested?: string;
}

const apiConfigs: ApiKeyConfig[] = [
  {
    id: "mattermost",
    name: "Mattermost",
    description: "Team communication and collaboration platform",
    icon: MessageSquare,
    keyField: "Personal Access Token",
    webhookField: "Incoming Webhook URL",
    additionalFields: [
      { name: "serverUrl", label: "Server URL", placeholder: "https://your-mattermost-server.com" },
      { name: "teamId", label: "Team ID", placeholder: "team-id" },
    ],
    status: "disconnected",
  },
  {
    id: "apollo",
    name: "Apollo.AI",
    description: "Sales intelligence and engagement platform",
    icon: Zap,
    keyField: "API Key",
    additionalFields: [
      { name: "accountId", label: "Account ID", placeholder: "your-account-id" },
    ],
    status: "disconnected",
  },
  {
    id: "gohighlevel",
    name: "GoHighLevel",
    description: "All-in-one marketing and CRM platform",
    icon: Zap,
    keyField: "Private API Key",
    additionalFields: [
      { name: "locationId", label: "Location ID", placeholder: "location-id" },
      { name: "agencyId", label: "Agency ID", placeholder: "agency-id" },
    ],
    status: "disconnected",
  },
  {
    id: "zoom",
    name: "Zoom",
    description: "Video conferencing and meetings",
    icon: Video,
    keyField: "API Key",
    additionalFields: [
      { name: "apiSecret", label: "API Secret", placeholder: "your-api-secret" },
      { name: "accountId", label: "Account ID", placeholder: "account-id" },
    ],
    status: "disconnected",
  },
];

const llmProviders = [
  { id: "openai", name: "OpenAI", models: ["gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"] },
  { id: "anthropic", name: "Anthropic", models: ["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"] },
  { id: "google", name: "Google AI", models: ["gemini-pro", "gemini-ultra"] },
  { id: "mistral", name: "Mistral AI", models: ["mistral-large", "mistral-medium", "mistral-small"] },
  { id: "ollama", name: "Ollama (Local)", models: ["llama2", "codellama", "mistral", "mixtral"] },
];

export default function SettingsPage() {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [apiKeys, setApiKeys] = useState<Record<string, Record<string, string>>>({});
  const [testingStatus, setTestingStatus] = useState<Record<string, "testing" | "success" | "error" | null>>({});
  const [llmConfig, setLlmConfig] = useState({
    provider: "openai",
    model: "gpt-4o",
    apiKey: "",
    ollamaUrl: "http://localhost:11434",
    useOllama: false,
  });

  const toggleShowKey = (id: string) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const updateApiKey = (configId: string, field: string, value: string) => {
    setApiKeys(prev => ({
      ...prev,
      [configId]: { ...prev[configId], [field]: value },
    }));
  };

  const testConnection = async (configId: string) => {
    setTestingStatus(prev => ({ ...prev, [configId]: "testing" }));
    // Simulate API test
    await new Promise(resolve => setTimeout(resolve, 2000));
    // Random success/failure for demo
    setTestingStatus(prev => ({ 
      ...prev, 
      [configId]: Math.random() > 0.3 ? "success" : "error" 
    }));
  };

  const saveSettings = () => {
    // In production, this would save to a database
    console.log("Saving settings:", { apiKeys, llmConfig });
    alert("Settings saved successfully!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage API keys, webhooks, and integrations
          </p>
        </div>
        <Button onClick={saveSettings}>
          <Save className="mr-2 h-4 w-4" />
          Save All Settings
        </Button>
      </div>

      <Tabs defaultValue="integrations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="llm">LLM Configuration</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          <div className="grid gap-6">
            {apiConfigs.map((config) => (
              <Card key={config.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <config.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {config.name}
                          <Badge
                            variant={
                              testingStatus[config.id] === "success"
                                ? "default"
                                : testingStatus[config.id] === "error"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {testingStatus[config.id] === "success"
                              ? "Connected"
                              : testingStatus[config.id] === "error"
                              ? "Error"
                              : "Not Connected"}
                          </Badge>
                        </CardTitle>
                        <CardDescription>{config.description}</CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testConnection(config.id)}
                      disabled={testingStatus[config.id] === "testing"}
                    >
                      {testingStatus[config.id] === "testing" ? (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <TestTube className="mr-2 h-4 w-4" />
                      )}
                      Test Connection
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`${config.id}-key`}>{config.keyField}</Label>
                      <div className="relative">
                        <Input
                          id={`${config.id}-key`}
                          type={showKeys[config.id] ? "text" : "password"}
                          placeholder={`Enter your ${config.keyField.toLowerCase()}`}
                          value={apiKeys[config.id]?.key || ""}
                          onChange={(e) => updateApiKey(config.id, "key", e.target.value)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full"
                          onClick={() => toggleShowKey(config.id)}
                        >
                          {showKeys[config.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {config.webhookField && (
                      <div className="space-y-2">
                        <Label htmlFor={`${config.id}-webhook`}>{config.webhookField}</Label>
                        <Input
                          id={`${config.id}-webhook`}
                          placeholder={`Enter your ${config.webhookField.toLowerCase()}`}
                          value={apiKeys[config.id]?.webhook || ""}
                          onChange={(e) => updateApiKey(config.id, "webhook", e.target.value)}
                        />
                      </div>
                    )}

                    {config.additionalFields?.map((field) => (
                      <div key={field.name} className="space-y-2">
                        <Label htmlFor={`${config.id}-${field.name}`}>{field.label}</Label>
                        <Input
                          id={`${config.id}-${field.name}`}
                          placeholder={field.placeholder}
                          value={apiKeys[config.id]?.[field.name] || ""}
                          onChange={(e) => updateApiKey(config.id, field.name, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* LLM Configuration Tab */}
        <TabsContent value="llm" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>LLM Provider Configuration</CardTitle>
                  <CardDescription>
                    Configure your preferred Large Language Model provider
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Server className="h-5 w-5 text-primary" />
                  <div>
                    <Label>Use Ollama (Local LLM)</Label>
                    <p className="text-sm text-muted-foreground">
                      Run models locally without API costs
                    </p>
                  </div>
                </div>
                <Switch
                  checked={llmConfig.useOllama}
                  onCheckedChange={(checked) =>
                    setLlmConfig({ ...llmConfig, useOllama: checked, provider: checked ? "ollama" : "openai" })
                  }
                />
              </div>

              {llmConfig.useOllama ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ollamaUrl">Ollama Server URL</Label>
                    <Input
                      id="ollamaUrl"
                      placeholder="http://localhost:11434"
                      value={llmConfig.ollamaUrl}
                      onChange={(e) => setLlmConfig({ ...llmConfig, ollamaUrl: e.target.value })}
                    />
                    <p className="text-sm text-muted-foreground">
                      Default: http://localhost:11434
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ollamaModel">Model</Label>
                    <Select
                      value={llmConfig.model}
                      onValueChange={(value) => setLlmConfig({ ...llmConfig, model: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a model" />
                      </SelectTrigger>
                      <SelectContent>
                        {llmProviders.find(p => p.id === "ollama")?.models.map((model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Ollama Setup Instructions</h4>
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>Install Ollama from <a href="https://ollama.ai" className="text-primary underline" target="_blank">ollama.ai</a></li>
                      <li>Run: <code className="bg-background px-1 rounded">ollama pull llama2</code></li>
                      <li>Start Ollama: <code className="bg-background px-1 rounded">ollama serve</code></li>
                      <li>Test connection above</li>
                    </ol>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="llmProvider">Provider</Label>
                    <Select
                      value={llmConfig.provider}
                      onValueChange={(value) => {
                        const provider = llmProviders.find(p => p.id === value);
                        setLlmConfig({
                          ...llmConfig,
                          provider: value,
                          model: provider?.models[0] || "",
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {llmProviders.filter(p => p.id !== "ollama").map((provider) => (
                          <SelectItem key={provider.id} value={provider.id}>
                            {provider.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="llmModel">Model</Label>
                    <Select
                      value={llmConfig.model}
                      onValueChange={(value) => setLlmConfig({ ...llmConfig, model: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a model" />
                      </SelectTrigger>
                      <SelectContent>
                        {llmProviders.find(p => p.id === llmConfig.provider)?.models.map((model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="llmApiKey">API Key</Label>
                    <div className="relative">
                      <Input
                        id="llmApiKey"
                        type={showKeys["llm"] ? "text" : "password"}
                        placeholder="Enter your API key"
                        value={llmConfig.apiKey}
                        onChange={(e) => setLlmConfig({ ...llmConfig, apiKey: e.target.value })}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => toggleShowKey("llm")}
                      >
                        {showKeys["llm"] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                onClick={() => testConnection("llm")}
                disabled={testingStatus["llm"] === "testing"}
              >
                {testingStatus["llm"] === "testing" ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : testingStatus["llm"] === "success" ? (
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                ) : testingStatus["llm"] === "error" ? (
                  <XCircle className="mr-2 h-4 w-4 text-red-500" />
                ) : (
                  <TestTube className="mr-2 h-4 w-4" />
                )}
                Test LLM Connection
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Webhook className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Webhook Configuration</CardTitle>
                  <CardDescription>
                    Configure webhooks for real-time event notifications
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhookUrl">Webhook Endpoint URL</Label>
                <Input
                  id="webhookUrl"
                  placeholder="https://your-server.com/webhook"
                  value={apiKeys["webhook"]?.url || ""}
                  onChange={(e) => updateApiKey("webhook", "url", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="webhookSecret">Webhook Secret (for signature verification)</Label>
                <div className="relative">
                  <Input
                    id="webhookSecret"
                    type={showKeys["webhook"] ? "text" : "password"}
                    placeholder="Enter webhook secret"
                    value={apiKeys["webhook"]?.secret || ""}
                    onChange={(e) => updateApiKey("webhook", "secret", e.target.value)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => toggleShowKey("webhook")}
                  >
                    {showKeys["webhook"] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <Label>Events to Send</Label>
                <div className="grid gap-3 md:grid-cols-2">
                  {[
                    "New Lead Created",
                    "Deal Status Changed",
                    "One-to-One Scheduled",
                    "Affiliate Joined",
                    "Meeting Completed",
                    "Document Uploaded",
                  ].map((event) => (
                    <div key={event} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm">{event}</span>
                      <Switch defaultChecked />
                    </div>
                  ))}
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => testConnection("webhook")}
                disabled={testingStatus["webhook"] === "testing"}
              >
                {testingStatus["webhook"] === "testing" ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <TestTube className="mr-2 h-4 w-4" />
                )}
                Send Test Webhook
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
