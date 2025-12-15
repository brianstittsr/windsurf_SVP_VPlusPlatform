"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Upload,
  Plus,
  Trash2,
  Edit,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  Sparkles,
  Building,
  Calendar,
  DollarSign,
  Users,
  Target,
  ClipboardList,
  BarChart3,
  FileSignature,
  Download,
  Eye,
  Send,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type Proposal,
  type CollaboratingEntity,
  type DataCollectionMethod,
  type ProjectMilestone,
  type FormTemplate,
  type DashboardMetric,
  type DocumentAnalysisResult,
  PROPOSAL_TYPES,
  ENTITY_ROLES,
  COLLECTION_FREQUENCIES,
  MILESTONE_STATUSES,
  FORM_PURPOSES,
  FUNDING_SOURCES,
  FIELD_TYPES,
} from "@/lib/types/proposal";

const WIZARD_STEPS = [
  { id: 1, title: "Basic Info", icon: FileText, description: "Document upload & basic details" },
  { id: 2, title: "Entities", icon: Building, description: "Collaborating organizations" },
  { id: 3, title: "Data Collection", icon: ClipboardList, description: "Data collection methods" },
  { id: 4, title: "Milestones", icon: Target, description: "Project timeline" },
  { id: 5, title: "Review", icon: Eye, description: "Review & analysis" },
  { id: 6, title: "Forms", icon: FileText, description: "Form generator" },
  { id: 7, title: "Dashboard", icon: BarChart3, description: "AI dashboard config" },
  { id: 8, title: "Export", icon: FileSignature, description: "Export & signature" },
];

const emptyProposal: Partial<Proposal> = {
  name: "",
  description: "",
  type: "grant",
  startDate: "",
  endDate: "",
  fundingSource: "",
  referenceNumber: "",
  totalBudget: 0,
  status: "draft",
  collaboratingEntities: [],
  dataCollectionMethods: [],
  projectMilestones: [],
  analysisRecommendations: [],
  formTemplates: [],
  datasets: [],
  dashboardMetrics: [],
  documents: [],
  entityRelationshipNotes: "",
};

export default function ProposalsPage() {
  const [showWizard, setShowWizard] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [proposalData, setProposalData] = useState<Partial<Proposal>>(emptyProposal);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<DocumentAnalysisResult | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);

  // File upload handler
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", "auto");

      const response = await fetch("/api/ai/analyze-document", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setAnalysisResult(result);
        // Auto-populate proposal data from analysis
        setProposalData((prev) => ({
          ...prev,
          name: result.data.title || prev.name,
          description: result.data.description || prev.description,
          type: result.detectedType || prev.type,
          startDate: result.data.startDate || prev.startDate,
          endDate: result.data.endDate || prev.endDate,
          fundingSource: result.data.fundingSource || prev.fundingSource,
          referenceNumber: result.data.referenceNumber || prev.referenceNumber,
          totalBudget: result.data.totalBudget || prev.totalBudget,
          collaboratingEntities: result.data.entities?.map((e: any, i: number) => ({
            id: `entity-${i}`,
            name: e.name,
            role: e.role,
            description: e.responsibilities,
            contactName: e.contactInfo?.split(",")[0] || "",
            contactEmail: e.contactInfo?.split(",")[1]?.trim() || "",
            responsibilities: [e.responsibilities],
          })) || prev.collaboratingEntities,
          dataCollectionMethods: result.data.dataCollectionMethods?.map((m: any, i: number) => ({
            id: `method-${i}`,
            name: m.name,
            description: m.description,
            frequency: m.frequency,
            responsibleEntity: m.responsibleEntity,
            dataPoints: m.dataPoints || [],
            tools: m.tools ? [m.tools] : [],
          })) || prev.dataCollectionMethods,
          projectMilestones: result.data.milestones?.map((m: any, i: number) => ({
            id: `milestone-${i}`,
            name: m.name,
            description: m.description,
            dueDate: m.dueDate,
            status: "not_started",
            responsibleParties: m.responsibleParties || [],
            dependencies: m.dependencies || [],
          })) || prev.projectMilestones,
          formTemplates: result.data.forms?.map((f: any, i: number) => ({
            id: `form-${i}`,
            name: f.name,
            description: f.description,
            purpose: f.category,
            sections: [{ id: `section-${i}`, title: "Main", fields: f.fields || [] }],
            entityResponsible: f.linkedDataCollectionMethod,
          })) || prev.formTemplates,
          dashboardMetrics: result.data.dashboard?.metrics || prev.dashboardMetrics,
        }));
      }
    } catch (error) {
      console.error("Analysis error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 8));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const saveProposal = () => {
    const newProposal: Proposal = {
      ...emptyProposal,
      ...proposalData,
      id: `proposal-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Proposal;
    setProposals((prev) => [newProposal, ...prev]);
    setShowWizard(false);
    setCurrentStep(1);
    setProposalData(emptyProposal);
    setAnalysisResult(null);
    setUploadedFile(null);
  };

  const startNewProposal = () => {
    setProposalData(emptyProposal);
    setAnalysisResult(null);
    setUploadedFile(null);
    setCurrentStep(1);
    setShowWizard(true);
  };

  // Add entity
  const addEntity = () => {
    const newEntity: CollaboratingEntity = {
      id: `entity-${Date.now()}`,
      name: "",
      role: "partner",
      description: "",
      contactName: "",
      contactEmail: "",
      responsibilities: [],
    };
    setProposalData((prev) => ({
      ...prev,
      collaboratingEntities: [...(prev.collaboratingEntities || []), newEntity],
    }));
  };

  // Add data collection method
  const addDataMethod = () => {
    const newMethod: DataCollectionMethod = {
      id: `method-${Date.now()}`,
      name: "",
      description: "",
      frequency: "monthly",
      responsibleEntity: "",
      dataPoints: [],
      tools: [],
    };
    setProposalData((prev) => ({
      ...prev,
      dataCollectionMethods: [...(prev.dataCollectionMethods || []), newMethod],
    }));
  };

  // Add milestone
  const addMilestone = () => {
    const newMilestone: ProjectMilestone = {
      id: `milestone-${Date.now()}`,
      name: "",
      description: "",
      dueDate: "",
      status: "not_started",
      responsibleParties: [],
      dependencies: [],
    };
    setProposalData((prev) => ({
      ...prev,
      projectMilestones: [...(prev.projectMilestones || []), newMilestone],
    }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline"><Edit className="h-3 w-3 mr-1" />Draft</Badge>;
      case "pending_signature":
        return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "active":
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-700"><Check className="h-3 w-3 mr-1" />Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Proposal Creator
          </h1>
          <p className="text-muted-foreground">
            AI-powered document analysis and proposal management
          </p>
        </div>
        <Button onClick={startNewProposal}>
          <Plus className="mr-2 h-4 w-4" />
          New Proposal
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Proposals</p>
                <p className="text-2xl font-bold">{proposals.length}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {proposals.filter((p) => p.status === "active").length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Signature</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {proposals.filter((p) => p.status === "pending_signature").length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Budget</p>
                <p className="text-2xl font-bold">
                  ${proposals.reduce((sum, p) => sum + (p.totalBudget || 0), 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Proposals List */}
      {proposals.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Your Proposals</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Funding Source</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proposals.map((proposal) => (
                  <TableRow key={proposal.id}>
                    <TableCell className="font-medium">{proposal.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {PROPOSAL_TYPES.find((t) => t.value === proposal.type)?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>{proposal.fundingSource}</TableCell>
                    <TableCell>${proposal.totalBudget?.toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(proposal.status)}</TableCell>
                    <TableCell>{new Date(proposal.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Proposals Yet</h3>
            <p className="text-muted-foreground mb-4 text-center max-w-md">
              Create your first proposal by uploading a document for AI analysis or start from scratch.
            </p>
            <Button onClick={startNewProposal}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Proposal
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Wizard Dialog */}
      <Dialog open={showWizard} onOpenChange={setShowWizard}>
        <DialogContent className="max-w-[90vw] w-[1200px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Proposal Creator Wizard
            </DialogTitle>
            <DialogDescription>
              Step {currentStep} of 8: {WIZARD_STEPS[currentStep - 1].description}
            </DialogDescription>
          </DialogHeader>

          {/* Progress Steps */}
          <div className="flex items-center justify-between px-2 py-4 border-b">
            {WIZARD_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex flex-col items-center gap-1 cursor-pointer transition-colors",
                    isActive && "text-primary",
                    isCompleted && "text-green-600",
                    !isActive && !isCompleted && "text-muted-foreground"
                  )}
                  onClick={() => setCurrentStep(step.id)}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center border-2",
                      isActive && "border-primary bg-primary/10",
                      isCompleted && "border-green-600 bg-green-100",
                      !isActive && !isCompleted && "border-muted-foreground/30"
                    )}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className="text-xs font-medium hidden md:block">{step.title}</span>
                </div>
              );
            })}
          </div>

          {/* Step Content */}
          <ScrollArea className="flex-1 px-1">
            <div className="py-4 space-y-4">
              {/* Step 1: Basic Info & Document Upload */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  {/* File Upload */}
                  <Card className="border-dashed">
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center justify-center py-8">
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                            <p className="text-lg font-medium">Analyzing document...</p>
                            <p className="text-sm text-muted-foreground">AI is extracting information</p>
                          </>
                        ) : uploadedFile ? (
                          <>
                            <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
                            <p className="text-lg font-medium">{uploadedFile.name}</p>
                            <p className="text-sm text-muted-foreground mb-4">
                              {analysisResult ? "Analysis complete - data populated below" : "File uploaded"}
                            </p>
                            <Button variant="outline" onClick={() => { setUploadedFile(null); setAnalysisResult(null); }}>
                              Upload Different File
                            </Button>
                          </>
                        ) : (
                          <>
                            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-lg font-medium mb-2">Upload Document for AI Analysis</p>
                            <p className="text-sm text-muted-foreground mb-4">
                              PDF, Word, or text files supported
                            </p>
                            <label className="cursor-pointer">
                              <Input
                                type="file"
                                accept=".pdf,.doc,.docx,.txt"
                                className="hidden"
                                onChange={handleFileUpload}
                              />
                              <Button asChild>
                                <span><Upload className="mr-2 h-4 w-4" />Select File</span>
                              </Button>
                            </label>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Basic Info Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Proposal Name *</Label>
                      <Input
                        placeholder="Enter proposal name"
                        value={proposalData.name || ""}
                        onChange={(e) => setProposalData({ ...proposalData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Document Type *</Label>
                      <Select
                        value={proposalData.type}
                        onValueChange={(v) => setProposalData({ ...proposalData, type: v as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PROPOSAL_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Brief description of the proposal"
                      value={proposalData.description || ""}
                      onChange={(e) => setProposalData({ ...proposalData, description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Funding Source</Label>
                      <Select
                        value={proposalData.fundingSource}
                        onValueChange={(v) => setProposalData({ ...proposalData, fundingSource: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select funding source" />
                        </SelectTrigger>
                        <SelectContent>
                          {FUNDING_SOURCES.map((source) => (
                            <SelectItem key={source} value={source}>
                              {source}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Reference Number</Label>
                      <Input
                        placeholder="Grant/Contract number"
                        value={proposalData.referenceNumber || ""}
                        onChange={(e) => setProposalData({ ...proposalData, referenceNumber: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={proposalData.startDate || ""}
                        onChange={(e) => setProposalData({ ...proposalData, startDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={proposalData.endDate || ""}
                        onChange={(e) => setProposalData({ ...proposalData, endDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Total Budget ($)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={proposalData.totalBudget || ""}
                        onChange={(e) => setProposalData({ ...proposalData, totalBudget: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Entities */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Collaborating Organizations</h3>
                      <p className="text-sm text-muted-foreground">Add organizations involved in this proposal</p>
                    </div>
                    <Button onClick={addEntity}>
                      <Plus className="mr-2 h-4 w-4" />Add Organization
                    </Button>
                  </div>

                  {proposalData.collaboratingEntities?.map((entity, index) => (
                    <Card key={entity.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-4">
                          <Badge variant="outline">Organization {index + 1}</Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setProposalData({
                                ...proposalData,
                                collaboratingEntities: proposalData.collaboratingEntities?.filter((e) => e.id !== entity.id),
                              });
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Organization Name</Label>
                            <Input
                              value={entity.name}
                              onChange={(e) => {
                                const updated = proposalData.collaboratingEntities?.map((ent) =>
                                  ent.id === entity.id ? { ...ent, name: e.target.value } : ent
                                );
                                setProposalData({ ...proposalData, collaboratingEntities: updated });
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Role</Label>
                            <Select
                              value={entity.role}
                              onValueChange={(v) => {
                                const updated = proposalData.collaboratingEntities?.map((ent) =>
                                  ent.id === entity.id ? { ...ent, role: v as any } : ent
                                );
                                setProposalData({ ...proposalData, collaboratingEntities: updated });
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ENTITY_ROLES.map((role) => (
                                  <SelectItem key={role.value} value={role.value}>
                                    {role.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Contact Name</Label>
                            <Input
                              value={entity.contactName}
                              onChange={(e) => {
                                const updated = proposalData.collaboratingEntities?.map((ent) =>
                                  ent.id === entity.id ? { ...ent, contactName: e.target.value } : ent
                                );
                                setProposalData({ ...proposalData, collaboratingEntities: updated });
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Contact Email</Label>
                            <Input
                              type="email"
                              value={entity.contactEmail}
                              onChange={(e) => {
                                const updated = proposalData.collaboratingEntities?.map((ent) =>
                                  ent.id === entity.id ? { ...ent, contactEmail: e.target.value } : ent
                                );
                                setProposalData({ ...proposalData, collaboratingEntities: updated });
                              }}
                            />
                          </div>
                        </div>
                        <div className="mt-4 space-y-2">
                          <Label>Description / Responsibilities</Label>
                          <Textarea
                            value={entity.description}
                            onChange={(e) => {
                              const updated = proposalData.collaboratingEntities?.map((ent) =>
                                ent.id === entity.id ? { ...ent, description: e.target.value } : ent
                              );
                              setProposalData({ ...proposalData, collaboratingEntities: updated });
                            }}
                            rows={2}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {(!proposalData.collaboratingEntities || proposalData.collaboratingEntities.length === 0) && (
                    <Card className="border-dashed">
                      <CardContent className="flex flex-col items-center justify-center py-8">
                        <Building className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No organizations added yet</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Step 3: Data Collection */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Data Collection Methods</h3>
                      <p className="text-sm text-muted-foreground">Define how data will be collected</p>
                    </div>
                    <Button onClick={addDataMethod}>
                      <Plus className="mr-2 h-4 w-4" />Add Method
                    </Button>
                  </div>

                  {proposalData.dataCollectionMethods?.map((method, index) => (
                    <Card key={method.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-4">
                          <Badge variant="outline">Method {index + 1}</Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setProposalData({
                                ...proposalData,
                                dataCollectionMethods: proposalData.dataCollectionMethods?.filter((m) => m.id !== method.id),
                              });
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Method Name</Label>
                            <Input
                              value={method.name}
                              onChange={(e) => {
                                const updated = proposalData.dataCollectionMethods?.map((m) =>
                                  m.id === method.id ? { ...m, name: e.target.value } : m
                                );
                                setProposalData({ ...proposalData, dataCollectionMethods: updated });
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Frequency</Label>
                            <Select
                              value={method.frequency}
                              onValueChange={(v) => {
                                const updated = proposalData.dataCollectionMethods?.map((m) =>
                                  m.id === method.id ? { ...m, frequency: v as any } : m
                                );
                                setProposalData({ ...proposalData, dataCollectionMethods: updated });
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {COLLECTION_FREQUENCIES.map((freq) => (
                                  <SelectItem key={freq.value} value={freq.value}>
                                    {freq.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="mt-4 space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            value={method.description}
                            onChange={(e) => {
                              const updated = proposalData.dataCollectionMethods?.map((m) =>
                                m.id === method.id ? { ...m, description: e.target.value } : m
                              );
                              setProposalData({ ...proposalData, dataCollectionMethods: updated });
                            }}
                            rows={2}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {(!proposalData.dataCollectionMethods || proposalData.dataCollectionMethods.length === 0) && (
                    <Card className="border-dashed">
                      <CardContent className="flex flex-col items-center justify-center py-8">
                        <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No data collection methods added yet</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Step 4: Milestones */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Project Milestones</h3>
                      <p className="text-sm text-muted-foreground">Define key project milestones and timeline</p>
                    </div>
                    <Button onClick={addMilestone}>
                      <Plus className="mr-2 h-4 w-4" />Add Milestone
                    </Button>
                  </div>

                  {proposalData.projectMilestones?.map((milestone, index) => (
                    <Card key={milestone.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-4">
                          <Badge variant="outline">Milestone {index + 1}</Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setProposalData({
                                ...proposalData,
                                projectMilestones: proposalData.projectMilestones?.filter((m) => m.id !== milestone.id),
                              });
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Milestone Name</Label>
                            <Input
                              value={milestone.name}
                              onChange={(e) => {
                                const updated = proposalData.projectMilestones?.map((m) =>
                                  m.id === milestone.id ? { ...m, name: e.target.value } : m
                                );
                                setProposalData({ ...proposalData, projectMilestones: updated });
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Due Date</Label>
                            <Input
                              type="date"
                              value={milestone.dueDate}
                              onChange={(e) => {
                                const updated = proposalData.projectMilestones?.map((m) =>
                                  m.id === milestone.id ? { ...m, dueDate: e.target.value } : m
                                );
                                setProposalData({ ...proposalData, projectMilestones: updated });
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Status</Label>
                            <Select
                              value={milestone.status}
                              onValueChange={(v) => {
                                const updated = proposalData.projectMilestones?.map((m) =>
                                  m.id === milestone.id ? { ...m, status: v as any } : m
                                );
                                setProposalData({ ...proposalData, projectMilestones: updated });
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {MILESTONE_STATUSES.map((status) => (
                                  <SelectItem key={status.value} value={status.value}>
                                    {status.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="mt-4 space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            value={milestone.description}
                            onChange={(e) => {
                              const updated = proposalData.projectMilestones?.map((m) =>
                                m.id === milestone.id ? { ...m, description: e.target.value } : m
                              );
                              setProposalData({ ...proposalData, projectMilestones: updated });
                            }}
                            rows={2}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {(!proposalData.projectMilestones || proposalData.projectMilestones.length === 0) && (
                    <Card className="border-dashed">
                      <CardContent className="flex flex-col items-center justify-center py-8">
                        <Target className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No milestones added yet</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Step 5: Review */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Proposal Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-muted-foreground">Name</Label>
                          <p className="font-medium">{proposalData.name || "Not specified"}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Type</Label>
                          <p className="font-medium">
                            {PROPOSAL_TYPES.find((t) => t.value === proposalData.type)?.label}
                          </p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Funding Source</Label>
                          <p className="font-medium">{proposalData.fundingSource || "Not specified"}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Total Budget</Label>
                          <p className="font-medium">${proposalData.totalBudget?.toLocaleString() || 0}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Start Date</Label>
                          <p className="font-medium">{proposalData.startDate || "Not specified"}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">End Date</Label>
                          <p className="font-medium">{proposalData.endDate || "Not specified"}</p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Description</Label>
                        <p className="font-medium">{proposalData.description || "Not specified"}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Building className="h-5 w-5 text-primary" />
                          <span className="font-medium">Organizations</span>
                        </div>
                        <p className="text-2xl font-bold">{proposalData.collaboratingEntities?.length || 0}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <ClipboardList className="h-5 w-5 text-primary" />
                          <span className="font-medium">Data Methods</span>
                        </div>
                        <p className="text-2xl font-bold">{proposalData.dataCollectionMethods?.length || 0}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="h-5 w-5 text-primary" />
                          <span className="font-medium">Milestones</span>
                        </div>
                        <p className="text-2xl font-bold">{proposalData.projectMilestones?.length || 0}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {analysisResult && (
                    <Card className="border-green-200 bg-green-50">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="h-5 w-5 text-green-600" />
                          <span className="font-medium text-green-700">AI Analysis Complete</span>
                        </div>
                        <p className="text-sm text-green-600">
                          Document analyzed and data auto-populated. Review and adjust as needed.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Step 6: Forms */}
              {currentStep === 6 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Generated Forms</h3>
                      <p className="text-sm text-muted-foreground">Forms auto-generated from data collection methods</p>
                    </div>
                  </div>

                  {proposalData.formTemplates?.map((form, index) => (
                    <Card key={form.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{form.name}</CardTitle>
                          <Badge>{FORM_PURPOSES.find((p) => p.value === form.purpose)?.label}</Badge>
                        </div>
                        <CardDescription>{form.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground">Fields ({form.sections?.[0]?.fields?.length || 0})</Label>
                          <div className="flex flex-wrap gap-2">
                            {form.sections?.[0]?.fields?.map((field) => (
                              <Badge key={field.id} variant="outline">
                                {field.label}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {(!proposalData.formTemplates || proposalData.formTemplates.length === 0) && (
                    <Card className="border-dashed">
                      <CardContent className="flex flex-col items-center justify-center py-8">
                        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No forms generated yet</p>
                        <p className="text-sm text-muted-foreground">Add data collection methods to auto-generate forms</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Step 7: Dashboard */}
              {currentStep === 7 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Dashboard Configuration</h3>
                      <p className="text-sm text-muted-foreground">AI-generated metrics and visualizations</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {proposalData.dashboardMetrics?.map((metric) => (
                      <Card key={metric.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">{metric.name}</span>
                            <Badge variant="outline">{metric.visualization}</Badge>
                          </div>
                          <p className="text-2xl font-bold">
                            {metric.unit === "$" && "$"}
                            {metric.value}
                            {metric.unit === "%" && "%"}
                          </p>
                          {metric.target && (
                            <p className="text-sm text-muted-foreground">
                              Target: {metric.target}{metric.unit}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {(!proposalData.dashboardMetrics || proposalData.dashboardMetrics.length === 0) && (
                    <Card className="border-dashed">
                      <CardContent className="flex flex-col items-center justify-center py-8">
                        <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No dashboard metrics configured</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Step 8: Export & Signature */}
              {currentStep === 8 && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Export Options</CardTitle>
                      <CardDescription>Generate and export your proposal documents</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Button variant="outline" className="h-24 flex-col">
                          <FileText className="h-8 w-8 mb-2" />
                          <span>Export as Markdown</span>
                        </Button>
                        <Button variant="outline" className="h-24 flex-col">
                          <Download className="h-8 w-8 mb-2" />
                          <span>Export as PDF</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileSignature className="h-5 w-5" />
                        Digital Signature
                      </CardTitle>
                      <CardDescription>Send for signature via DocuSeal</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          Configure DocuSeal integration in Settings to enable digital signatures.
                        </p>
                      </div>
                      <Button disabled>
                        <Send className="mr-2 h-4 w-4" />
                        Send for Signature
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <CheckCircle className="h-12 w-12 text-green-600" />
                        <div>
                          <h3 className="text-lg font-semibold text-green-700">Ready to Save</h3>
                          <p className="text-sm text-green-600">
                            Your proposal is complete. Click &quot;Save Proposal&quot; to finish.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer Navigation */}
          <DialogFooter className="border-t pt-4">
            <div className="flex items-center justify-between w-full">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowWizard(false)}>
                  Cancel
                </Button>
                {currentStep === 8 ? (
                  <Button onClick={saveProposal}>
                    <Check className="mr-2 h-4 w-4" />
                    Save Proposal
                  </Button>
                ) : (
                  <Button onClick={nextStep}>
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
