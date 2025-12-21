# OEM Supplier Readiness - Deep Research Feature Specification

**Document Type:** Feature Specification / Development Prompt  
**Author:** Strategic Value Plus Solutions, LLC  
**Date:** December 19, 2025  
**Version:** 1.0

---

## 1. Executive Overview

### 1.1 Purpose
Add a "Deep Research" step to the Proposal Creator Wizard that enables comprehensive company research and analysis for OEM Supplier Readiness assessments. This feature will crawl company websites, analyze uploaded documents, and generate professional deliverables including executive briefs, presentations, and editable strategic documents.

### 1.2 Trigger Condition
This feature is **ONLY activated** when the Document Type is set to **"OEM Supplier Readiness"** in the Proposal Creator Wizard.

### 1.3 Key Deliverables
When the OEM Supplier Readiness workflow is complete, the following artifacts will be available for download:

1. **Company Dossier** - Complete research compilation
2. **Executive Brief** - Structured strategic document (PDF/Markdown)
3. **PowerPoint Presentation** - SVP-branded web and PDF presentation
4. **Editable Strategic Document** - Version-controlled, section-based editor
5. **Value Optimization Dashboard** - Variable sliders for scenario modeling
6. **Vector Datastore** - PGVector-based knowledge base for conversational research chat

### 1.4 PGVector Integration
All research data (crawled websites, uploaded documents, generated analyses) will be converted to vector embeddings and stored in a PGVector database. This enables:
- **Conversational Research Chat** - Ask questions about the research data
- **Semantic Search** - Find relevant information across all sources
- **Context-Aware Generation** - Use RAG for document generation
- **Exportable Knowledge Base** - Connection settings included in exports

---

## 2. System Architecture

### 2.1 New Document Type Addition

Add to `lib/types/proposal.ts`:

```typescript
// Add to PROPOSAL_TYPES array
{ value: 'oem_supplier_readiness', label: 'OEM Supplier Readiness' },

// Add new type to ProposalType union
export type ProposalType = 
  | 'grant' 
  | 'nda' 
  | 'rfp_response' 
  | 'rfi_response' 
  | 'contract' 
  | 'agreement' 
  | 'mou'
  | 'oem_supplier_readiness';  // NEW
```

### 2.2 Conditional Wizard Steps

When `proposalData.type === 'oem_supplier_readiness'`, inject the Deep Research step after Basic Info:

```typescript
const OEM_WIZARD_STEPS = [
  { id: 1, title: "Basic Info", icon: FileText, description: "Document upload & basic details" },
  { id: 2, title: "Deep Research", icon: Search, description: "Company research & analysis" },  // NEW
  { id: 3, title: "Entities", icon: Building, description: "Collaborating organizations" },
  { id: 4, title: "Certifications", icon: Shield, description: "Certification requirements" },  // NEW
  { id: 5, title: "Opportunity Matrix", icon: Grid, description: "Supplier opportunities" },  // NEW
  { id: 6, title: "Review", icon: Eye, description: "Review & analysis" },
  { id: 7, title: "Documents", icon: FileText, description: "Generate deliverables" },  // MODIFIED
  { id: 8, title: "Presentation", icon: Presentation, description: "Web & PDF presentation" },  // NEW
  { id: 9, title: "Value Optimizer", icon: Sliders, description: "Scenario modeling" },  // NEW
  { id: 10, title: "Export", icon: Download, description: "Export & download" },
];
```

---

## 3. Deep Research Step (Step 2)

### 3.1 UI Components

#### 3.1.1 Website Crawler Section

```tsx
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Globe className="h-5 w-5" />
      Website Research
    </CardTitle>
    <CardDescription>
      Add company websites to crawl for capabilities, certifications, and business information
    </CardDescription>
  </CardHeader>
  <CardContent>
    {/* URL Input with Add Button */}
    <div className="flex gap-2 mb-4">
      <Input 
        placeholder="https://company-website.com" 
        value={newUrl}
        onChange={(e) => setNewUrl(e.target.value)}
      />
      <Button onClick={addWebsite}>
        <Plus className="mr-2 h-4 w-4" />
        Add Website
      </Button>
    </div>
    
    {/* Website List with Crawl Status */}
    <div className="space-y-2">
      {websites.map((site) => (
        <div key={site.id} className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span>{site.url}</span>
            <Badge variant={site.status === 'crawled' ? 'success' : 'secondary'}>
              {site.status}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => crawlWebsite(site.id)}>
              <Search className="mr-2 h-3 w-3" />
              Crawl
            </Button>
            <Button variant="ghost" size="icon" onClick={() => removeWebsite(site.id)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
      ))}
    </div>
    
    {/* Bulk Crawl Button */}
    <Button className="mt-4" onClick={crawlAllWebsites} disabled={isCrawling}>
      {isCrawling ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="mr-2 h-4 w-4" />
      )}
      Crawl All Websites with AI
    </Button>
  </CardContent>
</Card>
```

#### 3.1.2 Document Upload Section

```tsx
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <FileUp className="h-5 w-5" />
      Research Documents
    </CardTitle>
    <CardDescription>
      Upload meeting notes, company documents, RFPs, or any relevant files for analysis
    </CardDescription>
  </CardHeader>
  <CardContent>
    {/* Multi-file Upload Zone */}
    <div 
      className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
      onDrop={handleFileDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
      <p className="text-lg font-medium mb-2">Drop files here or click to upload</p>
      <p className="text-sm text-muted-foreground mb-4">
        PDF, Word, Excel, Text, Markdown files supported
      </p>
      <input
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.txt,.md,.xlsx,.xls,.csv"
        className="hidden"
        id="file-upload"
        onChange={handleFileSelect}
      />
      <label htmlFor="file-upload">
        <Button asChild>
          <span><Upload className="mr-2 h-4 w-4" />Select Files</span>
        </Button>
      </label>
    </div>
    
    {/* Uploaded Files List */}
    <div className="mt-4 space-y-2">
      {uploadedFiles.map((file) => (
        <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
            </div>
            <Badge variant={file.analyzed ? 'success' : 'secondary'}>
              {file.analyzed ? 'Analyzed' : 'Pending'}
            </Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={() => removeFile(file.id)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ))}
    </div>
  </CardContent>
</Card>
```

#### 3.1.3 AI Research Analysis Button

```tsx
<Card className="border-primary">
  <CardContent className="pt-6">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Deep Research Analysis
        </h3>
        <p className="text-sm text-muted-foreground">
          Analyze all websites and documents to extract company capabilities, 
          certifications, and OEM readiness assessment
        </p>
      </div>
      <Button 
        size="lg" 
        onClick={runDeepResearch}
        disabled={isAnalyzing || (websites.length === 0 && uploadedFiles.length === 0)}
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-5 w-5" />
            Run Deep Research
          </>
        )}
      </Button>
    </div>
    
    {/* Progress Indicator */}
    {isAnalyzing && (
      <div className="mt-4">
        <Progress value={analysisProgress} className="h-2" />
        <p className="text-sm text-muted-foreground mt-2">{analysisStatus}</p>
      </div>
    )}
  </CardContent>
</Card>
```

### 3.2 Data Models

```typescript
// New interfaces for Deep Research
interface ResearchWebsite {
  id: string;
  url: string;
  status: 'pending' | 'crawling' | 'crawled' | 'error';
  crawledAt?: string;
  pagesCrawled?: number;
  extractedData?: WebsiteCrawlResult;
}

interface WebsiteCrawlResult {
  companyName: string;
  description: string;
  capabilities: string[];
  certifications: string[];
  locations: string[];
  keyContacts: { name: string; title: string; email?: string }[];
  industries: string[];
  products: string[];
  services: string[];
  rawContent: string;
}

interface ResearchDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  analyzed: boolean;
  extractedData?: DocumentAnalysisResult;
}

interface DeepResearchResult {
  companyProfile: CompanyProfile;
  capabilities: CapabilityAssessment;
  certifications: CertificationAnalysis;
  opportunities: OpportunityMatrix;
  gaps: GapAnalysis;
  recommendations: string[];
  sources: { type: 'website' | 'document'; name: string; url?: string }[];
}

interface CompanyProfile {
  name: string;
  headquarters: string;
  founded?: string;
  employees?: string;
  revenue?: string;
  description: string;
  ownership?: string;
  certifications: string[];
  industries: string[];
  locations: Location[];
  keyContacts: Contact[];
}

interface CapabilityAssessment {
  primaryCapabilities: Capability[];
  secondaryCapabilities: Capability[];
  equipmentAndFacilities: string[];
  technologyStack: string[];
  qualityMetrics: { metric: string; value: string }[];
}

interface Capability {
  name: string;
  description: string;
  relevanceScore: number; // 1-5
  evidence: string[];
}

interface CertificationAnalysis {
  current: Certification[];
  required: Certification[];
  gaps: CertificationGap[];
  timeline: { certification: string; estimatedMonths: number; estimatedCost: string }[];
}

interface Certification {
  name: string;
  status: 'has' | 'required' | 'recommended' | 'not_applicable';
  description: string;
  applicability: string;
  expirationDate?: string;
}

interface CertificationGap {
  certification: string;
  currentStatus: string;
  requiredStatus: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedCost: string;
  estimatedTimeline: string;
  remediation: string;
}

interface OpportunityMatrix {
  opportunities: Opportunity[];
  totalEstimatedValue: { low: number; high: number };
  readinessScore: number; // 0-100
}

interface Opportunity {
  id: string;
  name: string;
  description: string;
  estimatedAnnualValue: { low: number; high: number };
  readiness: 'ready' | 'needs_certification' | 'needs_development' | 'not_applicable';
  requirements: string[];
  timeline: string;
}

interface GapAnalysis {
  certificationGaps: CertificationGap[];
  capabilityGaps: { capability: string; gap: string; remediation: string }[];
  documentationGaps: { document: string; status: string; priority: string }[];
  systemGaps: { system: string; gap: string; recommendation: string }[];
}
```

### 3.3 API Endpoints

#### 3.3.1 Website Crawler API

```typescript
// POST /api/research/crawl-website
interface CrawlWebsiteRequest {
  url: string;
  depth?: number; // Default 2 levels
  maxPages?: number; // Default 50
}

interface CrawlWebsiteResponse {
  success: boolean;
  data?: WebsiteCrawlResult;
  error?: string;
  pagesCrawled: number;
  duration: number;
}
```

#### 3.3.2 Deep Research Analysis API

```typescript
// POST /api/research/deep-analysis
interface DeepResearchRequest {
  websites: ResearchWebsite[];
  documents: ResearchDocument[];
  targetOEM: string; // e.g., "Toyota Battery Manufacturing NC"
  analysisType: 'oem_supplier_readiness';
}

interface DeepResearchResponse {
  success: boolean;
  result?: DeepResearchResult;
  error?: string;
  processingTime: number;
}
```

---

## 4. Certifications Step (Step 4)

### 4.1 UI Components

Display certification requirements matrix with current status vs. required status:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Certification Requirements Matrix</CardTitle>
    <CardDescription>
      Based on OEM requirements and company analysis
    </CardDescription>
  </CardHeader>
  <CardContent>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Certification</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Required For</TableHead>
          <TableHead>Current Status</TableHead>
          <TableHead>Gap</TableHead>
          <TableHead>Priority</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {certifications.map((cert) => (
          <TableRow key={cert.name}>
            <TableCell className="font-medium">{cert.name}</TableCell>
            <TableCell className="max-w-xs">{cert.description}</TableCell>
            <TableCell>{cert.applicability}</TableCell>
            <TableCell>
              <Badge variant={cert.status === 'has' ? 'success' : 'destructive'}>
                {cert.status === 'has' ? 'Certified' : 'Gap'}
              </Badge>
            </TableCell>
            <TableCell>{cert.gap?.remediation || 'N/A'}</TableCell>
            <TableCell>
              <Badge variant={getPriorityVariant(cert.gap?.priority)}>
                {cert.gap?.priority || 'N/A'}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </CardContent>
</Card>
```

---

## 5. Opportunity Matrix Step (Step 5)

### 5.1 UI Components

Interactive opportunity matrix with filtering and sorting:

```tsx
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <div>
        <CardTitle>Supplier Opportunity Matrix</CardTitle>
        <CardDescription>
          Identified opportunities based on capabilities and OEM requirements
        </CardDescription>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Total Estimated Value</p>
          <p className="text-2xl font-bold text-primary">
            ${formatCurrency(totalValue.low)} - ${formatCurrency(totalValue.high)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Readiness Score</p>
          <p className="text-2xl font-bold">{readinessScore}%</p>
        </div>
      </div>
    </div>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      {opportunities.map((opp) => (
        <Card key={opp.id} className={cn(
          "border-l-4",
          opp.readiness === 'ready' && "border-l-green-500",
          opp.readiness === 'needs_certification' && "border-l-yellow-500",
          opp.readiness === 'needs_development' && "border-l-red-500"
        )}>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold">{opp.name}</h4>
                <p className="text-sm text-muted-foreground">{opp.description}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">
                  ${formatCurrency(opp.estimatedAnnualValue.low)} - 
                  ${formatCurrency(opp.estimatedAnnualValue.high)}
                </p>
                <p className="text-xs text-muted-foreground">annually</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Badge variant={getReadinessVariant(opp.readiness)}>
                {formatReadiness(opp.readiness)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Timeline: {opp.timeline}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </CardContent>
</Card>
```

---

## 6. Documents Generation Step (Step 7)

### 6.1 Generated Deliverables

#### 6.1.1 Company Dossier

Complete research compilation including:
- Company profile and overview
- Organizational structure
- Capabilities assessment
- Certification status
- Financial overview (if available)
- Key contacts
- All source materials

#### 6.1.2 Executive Brief

Structured document following the template from `RedArts-TBMNC-ProjectBrief.md`:

**Document Structure:**
1. Executive Summary
   - Key Opportunity
   - Strategic Advantage
2. Company/Portfolio Overview
   - Parent Company Profile
   - Subsidiary/Division Summary
3. OEM Supplier Certification Requirements
   - Certification Requirements Matrix
   - Certification Applicability
   - Detailed Certification Descriptions
4. Deliverables Requirements
   - Required Documentation Categories
5. Supplier Opportunity Matrix
   - High-Priority Opportunities by Company/Division
   - Gap Analysis
6. Key Business Drivers
   - Identified drivers from meeting notes/documents
   - Solutions and recommendations
7. Implementation Roadmap
   - Phased approach with timelines
8. Investment Summary
   - Estimated Costs
   - Expected Returns
   - ROI Analysis
9. Appendices
   - Key Contacts
   - Reference Documents

### 6.2 Editable Document Interface

```tsx
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <div>
        <CardTitle>Executive Brief Editor</CardTitle>
        <CardDescription>
          Edit sections to customize the brief before generating final documents
        </CardDescription>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline">Version {currentVersion}</Badge>
        <Button variant="outline" size="sm" onClick={viewVersionHistory}>
          <History className="mr-2 h-4 w-4" />
          Version History
        </Button>
        <Button variant="outline" size="sm" onClick={saveVersion}>
          <Save className="mr-2 h-4 w-4" />
          Save Version
        </Button>
      </div>
    </div>
  </CardHeader>
  <CardContent>
    <Tabs defaultValue="executive-summary">
      <TabsList className="grid grid-cols-4 lg:grid-cols-9 mb-4">
        <TabsTrigger value="executive-summary">Summary</TabsTrigger>
        <TabsTrigger value="company-overview">Overview</TabsTrigger>
        <TabsTrigger value="certifications">Certifications</TabsTrigger>
        <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
        <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
        <TabsTrigger value="drivers">Drivers</TabsTrigger>
        <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
        <TabsTrigger value="investment">Investment</TabsTrigger>
        <TabsTrigger value="appendices">Appendices</TabsTrigger>
      </TabsList>
      
      {/* Each tab contains an editable section */}
      <TabsContent value="executive-summary">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Executive Summary</Label>
            <Button variant="outline" size="sm" onClick={() => enhanceSection('executive-summary')}>
              <Sparkles className="mr-2 h-3 w-3" />
              Enhance with AI
            </Button>
          </div>
          <Textarea
            value={sections.executiveSummary}
            onChange={(e) => updateSection('executiveSummary', e.target.value)}
            rows={10}
            className="font-mono text-sm"
          />
        </div>
      </TabsContent>
      
      {/* ... other tabs ... */}
    </Tabs>
  </CardContent>
</Card>
```

### 6.3 Version Control System

```typescript
interface DocumentVersion {
  id: string;
  version: number;
  createdAt: string;
  createdBy: string;
  changeLog: string;
  sections: DocumentSections;
  isPublished: boolean;
}

interface DocumentSections {
  executiveSummary: string;
  companyOverview: string;
  certifications: string;
  deliverables: string;
  opportunities: string;
  businessDrivers: string;
  implementationRoadmap: string;
  investmentSummary: string;
  appendices: string;
}

// Version history stored in database
interface VersionHistory {
  documentId: string;
  versions: DocumentVersion[];
  currentVersion: number;
}
```

---

## 7. Presentation Step (Step 8)

### 7.0 McKinsey Slide Framework Integration

The presentation generation system uses the **MOVIE Framework** (McKinsey-style) to transform deep research output into professional slides:

#### MOVIE Framework Steps:
1. **M - Message**: Each slide has a clear, actionable title stating the key insight
2. **O - Organize**: Supporting data categorized into 2-3 logical groups
3. **V - Visualize**: Charts, tables, and visuals that explain data better than text
4. **I - Insight**: Direct statements of what the audience should know, with highlights
5. **E - Extras**: Alignment, formatting, and professional polish

#### Deep Research → Slide Mapping

The system automatically transforms deep research sections into McKinsey-style slides:

| Deep Research Section | Slide Type | Message Format |
|----------------------|------------|----------------|
| Executive Summary | Title + Key Points | "[Company] is positioned for [Opportunity] with [Value]" |
| Company Profile | Two-Column | "[Company] brings [X] years experience across [Y] facilities" |
| Capabilities Assessment | Chart + Bullets | "[Company] excels in [Top 3 Capabilities]" |
| Certification Analysis | Matrix Table | "[X] certifications required; [Y] gaps identified" |
| Gap Analysis | Visual Matrix | "Critical gaps in [Areas] require [Timeline] to close" |
| Opportunity Matrix | Value Chart | "$[X-Y]M annual opportunity across [N] service categories" |
| Implementation Roadmap | Timeline Visual | "[N]-phase approach delivers results in [Timeline]" |
| Investment & ROI | Financial Chart | "[X]% ROI with [Y]-month payback period" |
| Risk Mitigation | Risk Matrix | "[N] risks identified with mitigation strategies" |

#### Slide Generation API

```typescript
// POST /api/presentation/generate-from-research
interface GeneratePresentationRequest {
  projectId: string;
  deepResearchData: DeepResearchResult;
  executiveBrief: DocumentSections;
  style: 'mckinsey' | 'minimal' | 'detailed';
  branding: PresentationBranding;
}

// The system uses the deep research output as the primary data source
// Each slide is generated following the MOVIE framework:
const generateSlideFromSection = (section: ResearchSection): PresentationSlide => {
  return {
    title: extractInsightAsTitle(section), // M - Message (insight as title)
    content: organizeIntoGroups(section.data), // O - Organize (2-3 groups)
    visualizations: selectBestVisualization(section), // V - Visualize
    highlights: identifyKeyInsights(section), // I - Insight callouts
    formatting: applyProfessionalPolish(section), // E - Extras
  };
};
```

### 7.1 Web Presentation Builder

Interactive presentation with AI enhancement capabilities:

```tsx
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Presentation className="h-5 w-5" />
      SVP Branded Presentation
    </CardTitle>
    <CardDescription>
      Generate a professional web and PDF presentation
    </CardDescription>
  </CardHeader>
  <CardContent>
    {/* Presentation Preview */}
    <div className="border rounded-lg overflow-hidden mb-4">
      <div className="bg-muted p-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={prevSlide}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">Slide {currentSlide} of {totalSlides}</span>
          <Button variant="ghost" size="icon" onClick={nextSlide}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={toggleFullscreen}>
            <Maximize className="mr-2 h-3 w-3" />
            Fullscreen
          </Button>
          <Button variant="outline" size="sm" onClick={openPresentationEditor}>
            <Edit className="mr-2 h-3 w-3" />
            Edit
          </Button>
        </div>
      </div>
      <div className="aspect-video bg-white">
        {/* Slide Preview */}
        <PresentationSlide slide={slides[currentSlide - 1]} />
      </div>
    </div>
    
    {/* AI Enhancement Options */}
    <Card className="border-primary">
      <CardContent className="pt-4">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Enhance with AI
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => enhancePresentation('style')}>
            <Palette className="mr-2 h-4 w-4" />
            Enhance Style
          </Button>
          <Button variant="outline" onClick={() => enhancePresentation('layout')}>
            <Layout className="mr-2 h-4 w-4" />
            Improve Layout
          </Button>
          <Button variant="outline" onClick={() => enhancePresentation('transitions')}>
            <Shuffle className="mr-2 h-4 w-4" />
            Add Transitions
          </Button>
          <Button variant="outline" onClick={() => enhancePresentation('navigation')}>
            <Navigation className="mr-2 h-4 w-4" />
            Enhance Navigation
          </Button>
        </div>
        
        {/* Custom AI Prompt */}
        <div className="mt-4">
          <Label>Custom Enhancement Prompt</Label>
          <div className="flex gap-2 mt-2">
            <Input 
              placeholder="e.g., Make the charts more visually appealing..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
            />
            <Button onClick={applyCustomEnhancement}>
              <Sparkles className="mr-2 h-4 w-4" />
              Apply
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
    
    {/* Export Options */}
    <div className="flex gap-3 mt-4">
      <Button onClick={exportWebPresentation}>
        <Globe className="mr-2 h-4 w-4" />
        Export Web Presentation
      </Button>
      <Button onClick={exportPDFPresentation}>
        <Download className="mr-2 h-4 w-4" />
        Export PDF
      </Button>
      <Button variant="outline" onClick={exportPowerPoint}>
        <FileText className="mr-2 h-4 w-4" />
        Export PowerPoint
      </Button>
    </div>
  </CardContent>
</Card>
```

### 7.2 Complete Slide Generation from Deep Research

The presentation generator takes the deep research output and creates a complete McKinsey-style slide deck:

```typescript
// Slide generation function that uses deep research as input
async function generatePresentationFromDeepResearch(
  deepResearch: DeepResearchResult,
  executiveBrief: DocumentSections,
  branding: PresentationBranding
): Promise<Presentation> {
  const slides: PresentationSlide[] = [];
  
  // Slide 1: Title Slide
  slides.push({
    id: 'title',
    type: 'title',
    title: `${deepResearch.companyProfile.name} - OEM Supplier Readiness`,
    content: {
      text: `Strategic Assessment for ${deepResearch.targetOEM}`,
      bullets: [`Prepared by Strategic Value+ Solutions`, `${new Date().toLocaleDateString()}`]
    }
  });
  
  // Slide 2: Executive Summary (from deep research)
  slides.push({
    id: 'exec-summary',
    type: 'content',
    title: `${deepResearch.companyProfile.name} is positioned for $${formatRange(deepResearch.opportunities.totalEstimatedValue)}M opportunity`,
    content: {
      bullets: [
        `**The Opportunity:** ${executiveBrief.executiveSummary.keyOpportunity}`,
        `**Strategic Advantage:** ${executiveBrief.executiveSummary.strategicAdvantage}`,
        `**Readiness Score:** ${deepResearch.opportunities.readinessScore}%`
      ]
    }
  });
  
  // Slide 3: Company Profile (from deep research companyProfile)
  slides.push({
    id: 'company-profile',
    type: 'two-column',
    title: `${deepResearch.companyProfile.name} brings ${deepResearch.companyProfile.employees} employees across ${deepResearch.companyProfile.locations.length} facilities`,
    content: {
      columns: {
        left: formatCompanyOverview(deepResearch.companyProfile),
        right: formatKeyMetrics(deepResearch.companyProfile)
      }
    }
  });
  
  // Slide 4: Capabilities Assessment (from deep research capabilities)
  slides.push({
    id: 'capabilities',
    type: 'chart',
    title: `${deepResearch.companyProfile.name} excels in ${deepResearch.capabilities.primaryCapabilities.slice(0, 3).map(c => c.name).join(', ')}`,
    content: {
      chart: {
        type: 'radar',
        data: deepResearch.capabilities.primaryCapabilities.map(c => ({
          label: c.name,
          value: c.relevanceScore
        }))
      },
      bullets: deepResearch.capabilities.primaryCapabilities.map(c => c.description)
    }
  });
  
  // Slide 5: Certification Gap Analysis (from deep research certifications)
  slides.push({
    id: 'cert-gaps',
    type: 'table',
    title: `${deepResearch.certifications.required.length} certifications required; ${deepResearch.certifications.gaps.length} gaps identified`,
    content: {
      table: {
        headers: ['Certification', 'Status', 'Gap', 'Priority', 'Timeline'],
        rows: deepResearch.certifications.gaps.map(g => [
          g.certification,
          g.currentStatus,
          g.requiredStatus,
          g.priority,
          g.estimatedTimeline
        ])
      }
    }
  });
  
  // Slide 6: Opportunity Matrix (from deep research opportunities)
  slides.push({
    id: 'opportunities',
    type: 'chart',
    title: `$${formatRange(deepResearch.opportunities.totalEstimatedValue)}M annual opportunity across ${deepResearch.opportunities.opportunities.length} service categories`,
    content: {
      chart: {
        type: 'bar',
        data: deepResearch.opportunities.opportunities.map(o => ({
          label: o.name,
          value: (o.estimatedAnnualValue.low + o.estimatedAnnualValue.high) / 2
        }))
      }
    }
  });
  
  // Slide 7: Implementation Roadmap (from deep research)
  slides.push({
    id: 'roadmap',
    type: 'content',
    title: `4-phase approach delivers results in 12 months`,
    content: {
      bullets: [
        '**Phase 0:** Discovery & Scoping (Weeks 1-2)',
        '**Phase 1:** Foundation - ISO 9001, Hazmat, ESG (Months 1-6)',
        '**Phase 2:** Automotive Qualification - IATF 16949 (Months 4-12)',
        '**Phase 3:** Toyota Qualification & Onboarding (Months 6-12)'
      ]
    }
  });
  
  // Slide 8: Investment & ROI (from deep research)
  slides.push({
    id: 'investment',
    type: 'chart',
    title: `${calculateROI(deepResearch)}% ROI with ${calculatePayback(deepResearch)}-month payback period`,
    content: {
      chart: {
        type: 'waterfall',
        data: [
          { label: 'Investment', value: -deepResearch.investment.total },
          { label: 'Year 1 Revenue', value: deepResearch.projections.year1 },
          { label: 'Year 2 Revenue', value: deepResearch.projections.year2 },
          { label: 'Year 3 Revenue', value: deepResearch.projections.year3 }
        ]
      }
    }
  });
  
  // Slide 9: Next Steps
  slides.push({
    id: 'next-steps',
    type: 'content',
    title: 'Recommended Next Steps',
    content: {
      bullets: deepResearch.recommendations.slice(0, 5)
    }
  });
  
  return {
    id: generateId(),
    title: `${deepResearch.companyProfile.name} - OEM Supplier Readiness`,
    subtitle: `Strategic Assessment for ${deepResearch.targetOEM}`,
    branding,
    slides,
    transitions: { defaultTransition: 'fade', duration: 300, autoAdvance: false, autoAdvanceDelay: 0 },
    navigation: { showProgress: true, showSlideNumbers: true, showThumbnails: true, keyboardNavigation: true, swipeNavigation: true },
    metadata: { createdAt: new Date().toISOString(), sourceProjectId: deepResearch.projectId }
  };
}
```

### 7.3 Presentation Data Model

```typescript
interface Presentation {
  id: string;
  title: string;
  subtitle: string;
  branding: PresentationBranding;
  slides: PresentationSlide[];
  transitions: TransitionConfig;
  navigation: NavigationConfig;
  metadata: PresentationMetadata;
}

interface PresentationBranding {
  logo: string; // SVP logo
  primaryColor: string; // #1a365d (navy)
  accentColor: string; // #c8a951 (gold)
  fontFamily: string;
  headerStyle: 'modern' | 'classic' | 'minimal';
}

interface PresentationSlide {
  id: string;
  type: 'title' | 'content' | 'two-column' | 'chart' | 'table' | 'image' | 'quote';
  title: string;
  content: SlideContent;
  notes?: string;
  transition?: TransitionType;
}

interface SlideContent {
  text?: string;
  bullets?: string[];
  table?: TableData;
  chart?: ChartConfig;
  image?: ImageConfig;
  columns?: { left: string; right: string };
}

type TransitionType = 'fade' | 'slide' | 'zoom' | 'flip' | 'cube' | 'none';

interface TransitionConfig {
  defaultTransition: TransitionType;
  duration: number; // ms
  autoAdvance: boolean;
  autoAdvanceDelay: number; // ms
}

interface NavigationConfig {
  showProgress: boolean;
  showSlideNumbers: boolean;
  showThumbnails: boolean;
  keyboardNavigation: boolean;
  swipeNavigation: boolean;
}
```

---

## 8. Value Optimizer Step (Step 9)

### 8.1 Variable Sliders Interface

Interactive scenario modeling with real-time document regeneration:

```tsx
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Sliders className="h-5 w-5" />
      Value Optimization Dashboard
    </CardTitle>
    <CardDescription>
      Adjust variables to explore different scenarios and maximize value
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-2 gap-6">
      {/* Customer Value Optimization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Customer Value Drivers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Certification Investment Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Certification Investment</Label>
              <span className="font-mono text-sm">${formatCurrency(certificationInvestment)}</span>
            </div>
            <Slider
              value={[certificationInvestment]}
              onValueChange={([v]) => setCertificationInvestment(v)}
              min={100000}
              max={2000000}
              step={50000}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Higher investment = faster qualification timeline
            </p>
          </div>
          
          {/* Facilities in Scope Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Facilities in Scope</Label>
              <span className="font-mono text-sm">{facilitiesInScope} facilities</span>
            </div>
            <Slider
              value={[facilitiesInScope]}
              onValueChange={([v]) => setFacilitiesInScope(v)}
              min={1}
              max={25}
              step={1}
            />
            <p className="text-xs text-muted-foreground mt-1">
              More facilities = higher capacity but higher cost
            </p>
          </div>
          
          {/* Timeline Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Implementation Timeline</Label>
              <span className="font-mono text-sm">{timeline} months</span>
            </div>
            <Slider
              value={[timeline]}
              onValueChange={([v]) => setTimeline(v)}
              min={6}
              max={24}
              step={1}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Shorter timeline = higher cost, faster revenue
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* SVP Profit Optimization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">SVP Profit Drivers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Consulting Rate Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Consulting Rate</Label>
              <span className="font-mono text-sm">${consultingRate}/hour</span>
            </div>
            <Slider
              value={[consultingRate]}
              onValueChange={([v]) => setConsultingRate(v)}
              min={150}
              max={500}
              step={25}
            />
          </div>
          
          {/* Retainer Percentage Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Success Fee Percentage</Label>
              <span className="font-mono text-sm">{successFee}%</span>
            </div>
            <Slider
              value={[successFee]}
              onValueChange={([v]) => setSuccessFee(v)}
              min={0}
              max={10}
              step={0.5}
            />
          </div>
          
          {/* Ongoing Support Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Ongoing Support (months)</Label>
              <span className="font-mono text-sm">{supportMonths} months</span>
            </div>
            <Slider
              value={[supportMonths]}
              onValueChange={([v]) => setSupportMonths(v)}
              min={0}
              max={24}
              step={1}
            />
          </div>
        </CardContent>
      </Card>
    </div>
    
    {/* Real-time Results */}
    <Card className="mt-6 border-primary">
      <CardContent className="pt-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Customer Investment</p>
            <p className="text-2xl font-bold">${formatCurrency(calculatedCustomerInvestment)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Customer ROI</p>
            <p className="text-2xl font-bold text-green-600">{customerROI}%</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">SVP Revenue</p>
            <p className="text-2xl font-bold">${formatCurrency(svpRevenue)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">SVP Margin</p>
            <p className="text-2xl font-bold text-primary">{svpMargin}%</p>
          </div>
        </div>
        
        <div className="mt-4 flex justify-center gap-3">
          <Button onClick={applyOptimization}>
            <Check className="mr-2 h-4 w-4" />
            Apply to Documents
          </Button>
          <Button variant="outline" onClick={resetToDefaults}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset to Defaults
          </Button>
          <Button variant="outline" onClick={saveScenario}>
            <Save className="mr-2 h-4 w-4" />
            Save Scenario
          </Button>
        </div>
      </CardContent>
    </Card>
  </CardContent>
</Card>
```

### 8.2 Optimization Data Model

```typescript
interface OptimizationVariables {
  // Customer Value Variables
  certificationInvestment: number;
  facilitiesInScope: number;
  implementationTimeline: number; // months
  certificationScope: 'minimal' | 'standard' | 'comprehensive';
  systemsIntegration: boolean;
  wellnessProgramIncluded: boolean;
  
  // SVP Profit Variables
  consultingRate: number;
  successFeePercentage: number;
  ongoingSupportMonths: number;
  travelExpenseMarkup: number;
  subcontractorMarkup: number;
}

interface OptimizationResults {
  customerMetrics: {
    totalInvestment: number;
    annualRevenueOpportunity: { low: number; high: number };
    paybackPeriodMonths: number;
    threeYearROI: number;
    riskScore: number; // 1-10
  };
  svpMetrics: {
    totalRevenue: number;
    grossMargin: number;
    netMargin: number;
    projectDurationMonths: number;
    resourceRequirements: { role: string; hours: number }[];
  };
  tradeoffs: {
    description: string;
    impact: 'positive' | 'negative' | 'neutral';
  }[];
}

interface SavedScenario {
  id: string;
  name: string;
  createdAt: string;
  variables: OptimizationVariables;
  results: OptimizationResults;
  notes: string;
}
```

---

## 9. Export Step (Step 10)

### 9.1 Download Center

```tsx
<Card>
  <CardHeader>
    <CardTitle>Download Center</CardTitle>
    <CardDescription>
      Download all generated deliverables
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-2 gap-4">
      {/* Company Dossier */}
      <Card className="border-2 hover:border-primary transition-colors cursor-pointer">
        <CardContent className="pt-6 text-center">
          <FileText className="h-12 w-12 mx-auto text-primary mb-4" />
          <h4 className="font-semibold">Company Dossier</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Complete research compilation
          </p>
          <div className="flex justify-center gap-2">
            <Button size="sm" onClick={() => download('dossier', 'pdf')}>
              <Download className="mr-2 h-3 w-3" />
              PDF
            </Button>
            <Button size="sm" variant="outline" onClick={() => download('dossier', 'md')}>
              Markdown
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Executive Brief */}
      <Card className="border-2 hover:border-primary transition-colors cursor-pointer">
        <CardContent className="pt-6 text-center">
          <FileSignature className="h-12 w-12 mx-auto text-primary mb-4" />
          <h4 className="font-semibold">Executive Brief</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Strategic analysis document
          </p>
          <div className="flex justify-center gap-2">
            <Button size="sm" onClick={() => download('brief', 'pdf')}>
              <Download className="mr-2 h-3 w-3" />
              PDF
            </Button>
            <Button size="sm" variant="outline" onClick={() => download('brief', 'html')}>
              HTML
            </Button>
            <Button size="sm" variant="outline" onClick={() => download('brief', 'md')}>
              Markdown
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Web Presentation */}
      <Card className="border-2 hover:border-primary transition-colors cursor-pointer">
        <CardContent className="pt-6 text-center">
          <Presentation className="h-12 w-12 mx-auto text-primary mb-4" />
          <h4 className="font-semibold">Presentation</h4>
          <p className="text-sm text-muted-foreground mb-4">
            SVP-branded presentation
          </p>
          <div className="flex justify-center gap-2">
            <Button size="sm" onClick={() => download('presentation', 'web')}>
              <Globe className="mr-2 h-3 w-3" />
              Web
            </Button>
            <Button size="sm" variant="outline" onClick={() => download('presentation', 'pdf')}>
              PDF
            </Button>
            <Button size="sm" variant="outline" onClick={() => download('presentation', 'pptx')}>
              PPTX
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* All Documents Bundle */}
      <Card className="border-2 border-primary bg-primary/5">
        <CardContent className="pt-6 text-center">
          <Package className="h-12 w-12 mx-auto text-primary mb-4" />
          <h4 className="font-semibold">Complete Bundle</h4>
          <p className="text-sm text-muted-foreground mb-4">
            All documents in one ZIP
          </p>
          <Button onClick={() => downloadBundle()}>
            <Download className="mr-2 h-4 w-4" />
            Download All
          </Button>
        </CardContent>
      </Card>
    </div>
  </CardContent>
</Card>
```

---

## 10. Database Schema

### 10.1 New Tables

```sql
-- Enable PGVector extension (run once per database)
CREATE EXTENSION IF NOT EXISTS vector;

-- OEM Supplier Readiness Projects
CREATE TABLE oem_supplier_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES proposals(id),
  target_oem VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  research_data JSONB,
  certification_analysis JSONB,
  opportunity_matrix JSONB,
  optimization_variables JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Research Websites
CREATE TABLE research_websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES oem_supplier_projects(id),
  url VARCHAR(500) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  crawl_data JSONB,
  crawled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Research Documents
CREATE TABLE research_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES oem_supplier_projects(id),
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50),
  file_size INTEGER,
  storage_path VARCHAR(500),
  analysis_data JSONB,
  analyzed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Document Versions
CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES oem_supplier_projects(id),
  document_type VARCHAR(50) NOT NULL, -- 'brief', 'dossier', 'presentation'
  version_number INTEGER NOT NULL,
  content JSONB NOT NULL,
  change_log TEXT,
  created_by UUID REFERENCES users(id),
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Saved Scenarios
CREATE TABLE optimization_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES oem_supplier_projects(id),
  name VARCHAR(255) NOT NULL,
  variables JSONB NOT NULL,
  results JSONB NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Vector Embeddings for Research Data (PGVector)
CREATE TABLE research_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES oem_supplier_projects(id) ON DELETE CASCADE,
  source_type VARCHAR(50) NOT NULL, -- 'website', 'document', 'analysis', 'brief'
  source_id UUID NOT NULL, -- Reference to research_websites, research_documents, etc.
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB, -- source URL, page number, section name, etc.
  embedding vector(1536), -- OpenAI ada-002 dimension, adjust for other models
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Index for similarity search
  CONSTRAINT unique_chunk UNIQUE (source_id, chunk_index)
);

-- Create HNSW index for fast similarity search
CREATE INDEX ON research_embeddings USING hnsw (embedding vector_cosine_ops);

-- Chat History for Research Conversations
CREATE TABLE research_chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES oem_supplier_projects(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  role VARCHAR(20) NOT NULL, -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  sources JSONB, -- Referenced chunks used for RAG
  created_at TIMESTAMP DEFAULT NOW()
);

-- PGVector Connection Settings (stored per project for export)
CREATE TABLE vector_store_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES oem_supplier_projects(id) ON DELETE CASCADE,
  connection_name VARCHAR(255) NOT NULL,
  embedding_model VARCHAR(100) DEFAULT 'text-embedding-ada-002',
  embedding_dimension INTEGER DEFAULT 1536,
  chunk_size INTEGER DEFAULT 1000,
  chunk_overlap INTEGER DEFAULT 200,
  total_chunks INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_project_config UNIQUE (project_id)
);
```

### 10.2 PGVector Configuration Table (Platform Settings)

```sql
-- Platform-level PGVector configuration (stored in platform_settings or separate table)
CREATE TABLE pgvector_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_name VARCHAR(255) NOT NULL DEFAULT 'default',
  host VARCHAR(255) NOT NULL,
  port INTEGER NOT NULL DEFAULT 5432,
  database_name VARCHAR(255) NOT NULL,
  username VARCHAR(255) NOT NULL,
  password_encrypted TEXT NOT NULL, -- Encrypted with platform key
  ssl_mode VARCHAR(50) DEFAULT 'require',
  pool_size INTEGER DEFAULT 10,
  embedding_provider VARCHAR(50) DEFAULT 'openai', -- 'openai', 'cohere', 'local'
  embedding_model VARCHAR(100) DEFAULT 'text-embedding-ada-002',
  is_active BOOLEAN DEFAULT TRUE,
  last_tested_at TIMESTAMP,
  test_status VARCHAR(50), -- 'success', 'error', 'pending'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 11. PGVector Settings UI (Settings Page)

### 11.1 New Settings Tab

Add a new "Vector Database" tab to the Settings page (`app/(portal)/portal/settings/page.tsx`):

```tsx
// Add to TabsList
<TabsTrigger value="vectordb">Vector Database</TabsTrigger>

// Add to TabsContent
<TabsContent value="vectordb" className="space-y-6">
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Database className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="flex items-center gap-2">
              PGVector Configuration
              <Badge variant={pgvectorStatus === 'connected' ? 'default' : 'secondary'}>
                {pgvectorStatus === 'connected' ? 'Connected' : 'Not Connected'}
              </Badge>
            </CardTitle>
            <CardDescription>
              Configure PostgreSQL with PGVector for AI-powered research chat
            </CardDescription>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => testPgVectorConnection()}
          disabled={testingPgVector}
        >
          {testingPgVector ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <TestTube className="mr-2 h-4 w-4" />
          )}
          Test Connection
        </Button>
      </div>
    </CardHeader>
    <CardContent className="space-y-6">
      {/* Connection Settings */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pgvector-host">Host</Label>
          <Input
            id="pgvector-host"
            placeholder="localhost or your-db-host.com"
            value={pgvectorConfig.host}
            onChange={(e) => setPgvectorConfig({ ...pgvectorConfig, host: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pgvector-port">Port</Label>
          <Input
            id="pgvector-port"
            type="number"
            placeholder="5432"
            value={pgvectorConfig.port}
            onChange={(e) => setPgvectorConfig({ ...pgvectorConfig, port: parseInt(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pgvector-database">Database Name</Label>
          <Input
            id="pgvector-database"
            placeholder="svp_vectors"
            value={pgvectorConfig.database}
            onChange={(e) => setPgvectorConfig({ ...pgvectorConfig, database: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pgvector-username">Username</Label>
          <Input
            id="pgvector-username"
            placeholder="postgres"
            value={pgvectorConfig.username}
            onChange={(e) => setPgvectorConfig({ ...pgvectorConfig, username: e.target.value })}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="pgvector-password">Password</Label>
          <div className="relative">
            <Input
              id="pgvector-password"
              type={showKeys['pgvector'] ? 'text' : 'password'}
              placeholder="Enter database password"
              value={pgvectorConfig.password}
              onChange={(e) => setPgvectorConfig({ ...pgvectorConfig, password: e.target.value })}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full"
              onClick={() => toggleShowKey('pgvector')}
            >
              {showKeys['pgvector'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* SSL Mode */}
      <div className="space-y-2">
        <Label htmlFor="pgvector-ssl">SSL Mode</Label>
        <Select
          value={pgvectorConfig.sslMode}
          onValueChange={(value) => setPgvectorConfig({ ...pgvectorConfig, sslMode: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select SSL mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="disable">Disable</SelectItem>
            <SelectItem value="allow">Allow</SelectItem>
            <SelectItem value="prefer">Prefer</SelectItem>
            <SelectItem value="require">Require</SelectItem>
            <SelectItem value="verify-ca">Verify CA</SelectItem>
            <SelectItem value="verify-full">Verify Full</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Embedding Configuration */}
      <div className="border-t pt-4">
        <h4 className="font-medium mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Embedding Configuration
        </h4>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="embedding-provider">Embedding Provider</Label>
            <Select
              value={pgvectorConfig.embeddingProvider}
              onValueChange={(value) => setPgvectorConfig({ ...pgvectorConfig, embeddingProvider: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="cohere">Cohere</SelectItem>
                <SelectItem value="huggingface">HuggingFace</SelectItem>
                <SelectItem value="ollama">Ollama (Local)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="embedding-model">Embedding Model</Label>
            <Select
              value={pgvectorConfig.embeddingModel}
              onValueChange={(value) => setPgvectorConfig({ ...pgvectorConfig, embeddingModel: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {pgvectorConfig.embeddingProvider === 'openai' && (
                  <>
                    <SelectItem value="text-embedding-ada-002">text-embedding-ada-002 (1536 dim)</SelectItem>
                    <SelectItem value="text-embedding-3-small">text-embedding-3-small (1536 dim)</SelectItem>
                    <SelectItem value="text-embedding-3-large">text-embedding-3-large (3072 dim)</SelectItem>
                  </>
                )}
                {pgvectorConfig.embeddingProvider === 'cohere' && (
                  <>
                    <SelectItem value="embed-english-v3.0">embed-english-v3.0 (1024 dim)</SelectItem>
                    <SelectItem value="embed-multilingual-v3.0">embed-multilingual-v3.0 (1024 dim)</SelectItem>
                  </>
                )}
                {pgvectorConfig.embeddingProvider === 'ollama' && (
                  <>
                    <SelectItem value="nomic-embed-text">nomic-embed-text (768 dim)</SelectItem>
                    <SelectItem value="mxbai-embed-large">mxbai-embed-large (1024 dim)</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="chunk-size">Chunk Size (tokens)</Label>
            <Input
              id="chunk-size"
              type="number"
              placeholder="1000"
              value={pgvectorConfig.chunkSize}
              onChange={(e) => setPgvectorConfig({ ...pgvectorConfig, chunkSize: parseInt(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="chunk-overlap">Chunk Overlap (tokens)</Label>
            <Input
              id="chunk-overlap"
              type="number"
              placeholder="200"
              value={pgvectorConfig.chunkOverlap}
              onChange={(e) => setPgvectorConfig({ ...pgvectorConfig, chunkOverlap: parseInt(e.target.value) })}
            />
          </div>
        </div>
      </div>

      {/* Connection String Preview */}
      <div className="p-4 bg-muted rounded-lg">
        <Label className="text-muted-foreground text-xs">Connection String Preview</Label>
        <code className="block mt-1 text-sm break-all">
          postgresql://{pgvectorConfig.username}:****@{pgvectorConfig.host}:{pgvectorConfig.port}/{pgvectorConfig.database}?sslmode={pgvectorConfig.sslMode}
        </code>
      </div>

      {/* Setup Instructions */}
      <div className="p-4 bg-muted rounded-lg">
        <h4 className="font-medium mb-2">PGVector Setup Instructions</h4>
        <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
          <li>Install PostgreSQL 15+ with PGVector extension</li>
          <li>Run: <code className="bg-background px-1 rounded">CREATE EXTENSION vector;</code></li>
          <li>Create a dedicated database for vector storage</li>
          <li>Configure connection settings above</li>
          <li>Test connection to verify setup</li>
        </ol>
      </div>
    </CardContent>
  </Card>
</TabsContent>
```

### 11.2 PGVector State and Types

```typescript
// Add to settings page state
const [pgvectorConfig, setPgvectorConfig] = useState({
  host: '',
  port: 5432,
  database: 'svp_vectors',
  username: 'postgres',
  password: '',
  sslMode: 'require',
  embeddingProvider: 'openai',
  embeddingModel: 'text-embedding-ada-002',
  chunkSize: 1000,
  chunkOverlap: 200,
});
const [pgvectorStatus, setPgvectorStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
const [testingPgVector, setTestingPgVector] = useState(false);

// Add to PlatformSettingsDoc interface in lib/schema.ts
interface PlatformSettingsDoc {
  // ... existing fields
  pgvectorConfig?: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string; // Encrypted
    sslMode: string;
    embeddingProvider: string;
    embeddingModel: string;
    chunkSize: number;
    chunkOverlap: number;
    status: 'connected' | 'disconnected' | 'error';
    lastTestedAt?: Timestamp;
  };
}
```

---

## 12. Chat with Research Feature

### 12.1 Research Chat Interface

Add a chat panel to the Deep Research step and a dedicated chat page:

```tsx
// components/research/ResearchChat.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Send, 
  Loader2, 
  FileText, 
  Globe, 
  Sparkles,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RotateCcw
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: {
    type: 'website' | 'document';
    name: string;
    url?: string;
    snippet: string;
    relevance: number;
  }[];
  timestamp: Date;
}

interface ResearchChatProps {
  projectId: string;
  onSourceClick?: (sourceId: string) => void;
}

export function ResearchChat({ projectId, onSourceClick }: ResearchChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/research/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          message: input,
          history: messages.slice(-10), // Last 10 messages for context
        }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.response,
          sources: data.sources,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const suggestedQuestions = [
    "What certifications does this company have?",
    "Summarize the company's key capabilities",
    "What are the main gaps for OEM readiness?",
    "What opportunities exist for this supplier?",
    "What is the estimated investment required?",
  ];

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="border-b py-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="h-5 w-5 text-primary" />
          Chat with Research
          <Badge variant="outline" className="ml-auto">
            <Sparkles className="h-3 w-3 mr-1" />
            RAG Enabled
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">Ask questions about your research</h3>
            <p className="text-sm text-muted-foreground mb-4">
              I can help you explore the crawled websites and uploaded documents
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestedQuestions.map((q, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  onClick={() => setInput(q)}
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  
                  {/* Sources */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <p className="text-xs font-medium mb-2 opacity-70">Sources:</p>
                      <div className="space-y-1">
                        {message.sources.map((source, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 text-xs p-1.5 rounded bg-background/50 cursor-pointer hover:bg-background"
                            onClick={() => onSourceClick?.(source.url || source.name)}
                          >
                            {source.type === 'website' ? (
                              <Globe className="h-3 w-3" />
                            ) : (
                              <FileText className="h-3 w-3" />
                            )}
                            <span className="truncate flex-1">{source.name}</span>
                            <Badge variant="secondary" className="text-[10px]">
                              {Math.round(source.relevance * 100)}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Message Actions */}
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/50">
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <ThumbsUp className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <ThumbsDown className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
      
      {/* Input */}
      <div className="p-4 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-2"
        >
          <Input
            ref={inputRef}
            placeholder="Ask about the research data..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </Card>
  );
}
```

### 12.2 Chat API Endpoint

```typescript
// app/api/research/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import OpenAI from 'openai';

const openai = new OpenAI();

export async function POST(request: NextRequest) {
  try {
    const { projectId, message, history } = await request.json();

    // Get PGVector connection from settings
    const pgConfig = await getPgVectorConfig();
    const pool = new Pool(pgConfig);

    // 1. Generate embedding for the user's question
    const embeddingResponse = await openai.embeddings.create({
      model: pgConfig.embeddingModel || 'text-embedding-ada-002',
      input: message,
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    // 2. Search for relevant chunks using cosine similarity
    const searchQuery = `
      SELECT 
        id,
        source_type,
        source_id,
        content,
        metadata,
        1 - (embedding <=> $1::vector) as similarity
      FROM research_embeddings
      WHERE project_id = $2
      ORDER BY embedding <=> $1::vector
      LIMIT 5
    `;
    
    const searchResult = await pool.query(searchQuery, [
      JSON.stringify(queryEmbedding),
      projectId,
    ]);

    const relevantChunks = searchResult.rows;

    // 3. Build context from relevant chunks
    const context = relevantChunks
      .map((chunk) => `[Source: ${chunk.metadata?.source_name || 'Unknown'}]\n${chunk.content}`)
      .join('\n\n---\n\n');

    // 4. Generate response using LLM with RAG context
    const systemPrompt = `You are an AI assistant helping analyze research data for OEM Supplier Readiness assessments. 
Use the following context from the research data to answer the user's question. 
If the answer cannot be found in the context, say so clearly.
Always cite your sources when providing information.

Context:
${context}`;

    const chatHistory = history.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...chatHistory,
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const response = completion.choices[0].message.content;

    // 5. Format sources for response
    const sources = relevantChunks.map((chunk) => ({
      type: chunk.source_type,
      name: chunk.metadata?.source_name || 'Unknown',
      url: chunk.metadata?.url,
      snippet: chunk.content.substring(0, 150) + '...',
      relevance: chunk.similarity,
    }));

    // 6. Save to chat history
    await pool.query(`
      INSERT INTO research_chat_history (project_id, session_id, role, content, sources)
      VALUES ($1, $2, 'user', $3, NULL),
             ($1, $2, 'assistant', $4, $5)
    `, [projectId, 'default', message, response, JSON.stringify(sources)]);

    await pool.end();

    return NextResponse.json({
      success: true,
      response,
      sources,
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
```

---

## 13. Vector Store Creation & Data Ingestion

### 13.1 Embedding Pipeline

```typescript
// lib/vector-store/embeddings.ts
import OpenAI from 'openai';
import { Pool } from 'pg';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

const openai = new OpenAI();

interface EmbeddingConfig {
  model: string;
  chunkSize: number;
  chunkOverlap: number;
}

export async function createEmbeddingsForProject(
  projectId: string,
  pgPool: Pool,
  config: EmbeddingConfig
) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: config.chunkSize,
    chunkOverlap: config.chunkOverlap,
  });

  // 1. Get all websites for the project
  const websites = await pgPool.query(
    'SELECT * FROM research_websites WHERE project_id = $1 AND status = $2',
    [projectId, 'crawled']
  );

  for (const website of websites.rows) {
    const content = website.crawl_data?.rawContent || '';
    const chunks = await splitter.splitText(content);

    for (let i = 0; i < chunks.length; i++) {
      const embedding = await generateEmbedding(chunks[i], config.model);
      
      await pgPool.query(`
        INSERT INTO research_embeddings 
        (project_id, source_type, source_id, chunk_index, content, metadata, embedding)
        VALUES ($1, 'website', $2, $3, $4, $5, $6)
        ON CONFLICT (source_id, chunk_index) 
        DO UPDATE SET content = $4, metadata = $5, embedding = $6
      `, [
        projectId,
        website.id,
        i,
        chunks[i],
        JSON.stringify({
          source_name: website.url,
          url: website.url,
          chunk_index: i,
          total_chunks: chunks.length,
        }),
        JSON.stringify(embedding),
      ]);
    }
  }

  // 2. Get all documents for the project
  const documents = await pgPool.query(
    'SELECT * FROM research_documents WHERE project_id = $1 AND analyzed_at IS NOT NULL',
    [projectId]
  );

  for (const doc of documents.rows) {
    const content = doc.analysis_data?.extractedText || '';
    const chunks = await splitter.splitText(content);

    for (let i = 0; i < chunks.length; i++) {
      const embedding = await generateEmbedding(chunks[i], config.model);
      
      await pgPool.query(`
        INSERT INTO research_embeddings 
        (project_id, source_type, source_id, chunk_index, content, metadata, embedding)
        VALUES ($1, 'document', $2, $3, $4, $5, $6)
        ON CONFLICT (source_id, chunk_index) 
        DO UPDATE SET content = $4, metadata = $5, embedding = $6
      `, [
        projectId,
        doc.id,
        i,
        chunks[i],
        JSON.stringify({
          source_name: doc.file_name,
          file_type: doc.file_type,
          chunk_index: i,
          total_chunks: chunks.length,
        }),
        JSON.stringify(embedding),
      ]);
    }
  }

  // 3. Update vector store config with stats
  const stats = await pgPool.query(`
    SELECT COUNT(*) as total_chunks, SUM(LENGTH(content)) as total_chars
    FROM research_embeddings WHERE project_id = $1
  `, [projectId]);

  await pgPool.query(`
    INSERT INTO vector_store_configs (project_id, connection_name, embedding_model, chunk_size, chunk_overlap, total_chunks, last_sync_at)
    VALUES ($1, 'default', $2, $3, $4, $5, NOW())
    ON CONFLICT (project_id) 
    DO UPDATE SET total_chunks = $5, last_sync_at = NOW(), updated_at = NOW()
  `, [
    projectId,
    config.model,
    config.chunkSize,
    config.chunkOverlap,
    stats.rows[0].total_chunks,
  ]);

  return {
    totalChunks: parseInt(stats.rows[0].total_chunks),
    totalCharacters: parseInt(stats.rows[0].total_chars),
  };
}

async function generateEmbedding(text: string, model: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model,
    input: text,
  });
  return response.data[0].embedding;
}
```

### 13.2 API Endpoint for Vector Store Creation

```typescript
// app/api/research/create-vector-store/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { createEmbeddingsForProject } from '@/lib/vector-store/embeddings';

export async function POST(request: NextRequest) {
  try {
    const { projectId } = await request.json();

    // Get PGVector config from platform settings
    const pgConfig = await getPgVectorConfig();
    const pool = new Pool(pgConfig);

    // Create embeddings for all research data
    const result = await createEmbeddingsForProject(projectId, pool, {
      model: pgConfig.embeddingModel,
      chunkSize: pgConfig.chunkSize,
      chunkOverlap: pgConfig.chunkOverlap,
    });

    await pool.end();

    return NextResponse.json({
      success: true,
      message: 'Vector store created successfully',
      stats: result,
    });
  } catch (error) {
    console.error('Vector store creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create vector store' },
      { status: 500 }
    );
  }
}
```

---

## 14. Export with Vector Store Connection

### 14.1 Export Data Model

When exporting a project, include the vector store connection settings:

```typescript
interface ExportedProject {
  // ... existing fields
  vectorStoreConfig: {
    connectionName: string;
    embeddingModel: string;
    embeddingDimension: number;
    chunkSize: number;
    chunkOverlap: number;
    totalChunks: number;
    totalTokens: number;
    lastSyncAt: string;
    // Connection details (for re-import)
    connectionSettings: {
      host: string;
      port: number;
      database: string;
      // Note: password not included for security
      sslMode: string;
    };
    // Instructions for reconnecting
    reconnectionInstructions: string;
  };
}
```

### 14.2 Export Function Update

```typescript
// Add to export functionality
async function exportProjectWithVectorConfig(projectId: string) {
  const pgPool = await getPgPool();
  
  // Get vector store config
  const configResult = await pgPool.query(
    'SELECT * FROM vector_store_configs WHERE project_id = $1',
    [projectId]
  );
  
  const vectorConfig = configResult.rows[0];
  
  // Get platform PGVector settings (without password)
  const platformConfig = await getPgVectorConfig();
  
  return {
    vectorStoreConfig: {
      connectionName: vectorConfig?.connection_name || 'default',
      embeddingModel: vectorConfig?.embedding_model,
      embeddingDimension: vectorConfig?.embedding_dimension,
      chunkSize: vectorConfig?.chunk_size,
      chunkOverlap: vectorConfig?.chunk_overlap,
      totalChunks: vectorConfig?.total_chunks,
      lastSyncAt: vectorConfig?.last_sync_at,
      connectionSettings: {
        host: platformConfig.host,
        port: platformConfig.port,
        database: platformConfig.database,
        sslMode: platformConfig.sslMode,
      },
      reconnectionInstructions: `
To reconnect to the vector store:
1. Ensure PGVector is installed on your PostgreSQL instance
2. Configure connection in Settings > Vector Database
3. Host: ${platformConfig.host}
4. Port: ${platformConfig.port}
5. Database: ${platformConfig.database}
6. SSL Mode: ${platformConfig.sslMode}
7. Enter your credentials and test connection
      `.trim(),
    },
  };
}
```

---

## 15. Implementation Checklist

### Phase 1: Foundation (Week 1-2)
- [ ] Add `oem_supplier_readiness` document type to proposal types
- [ ] Create conditional wizard step logic
- [ ] Design and implement database schema
- [ ] Create basic UI components for Deep Research step

### Phase 2: Research Engine (Week 2-3)
- [ ] Implement website crawler API
- [ ] Implement multi-file upload with analysis
- [ ] Create AI deep research analysis endpoint
- [ ] Build research results display components

### Phase 3: Analysis Steps (Week 3-4)
- [ ] Implement Certifications step with matrix display
- [ ] Implement Opportunity Matrix step
- [ ] Create gap analysis visualization
- [ ] Build readiness scoring algorithm

### Phase 4: Document Generation (Week 4-5)
- [ ] Create executive brief template engine
- [ ] Implement section-based editor with version control
- [ ] Build company dossier generator
- [ ] Create PDF export functionality

### Phase 5: Presentation Builder (Week 5-6)
- [ ] Design SVP-branded presentation templates
- [ ] Implement slide editor with AI enhancement
- [ ] Add transition and navigation controls
- [ ] Create web presentation export
- [ ] Implement PDF/PPTX export

### Phase 6: Value Optimizer (Week 6-7)
- [ ] Build variable slider interface
- [ ] Implement real-time calculation engine
- [ ] Create scenario save/load functionality
- [ ] Connect optimization to document regeneration

### Phase 7: PGVector Integration (Week 7-8)
- [ ] Add PGVector Settings tab to Settings page
- [ ] Implement connection testing
- [ ] Create embedding pipeline
- [ ] Build vector store creation API
- [ ] Implement chat with research feature
- [ ] Add RAG-powered responses

### Phase 8: Export & Polish (Week 8-9)
- [ ] Implement download center
- [ ] Create bundle export functionality
- [ ] Include vector store config in exports
- [ ] Add loading states and error handling
- [ ] Performance optimization
- [ ] Testing and bug fixes

---

## 16. API Reference Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/research/crawl-website` | POST | Crawl a single website |
| `/api/research/crawl-batch` | POST | Crawl multiple websites |
| `/api/research/analyze-document` | POST | Analyze uploaded document |
| `/api/research/deep-analysis` | POST | Run comprehensive AI analysis |
| `/api/research/generate-brief` | POST | Generate executive brief |
| `/api/research/generate-dossier` | POST | Generate company dossier |
| `/api/research/generate-presentation` | POST | Generate presentation |
| `/api/research/enhance-section` | POST | AI enhance document section |
| `/api/research/enhance-presentation` | POST | AI enhance presentation |
| `/api/research/calculate-optimization` | POST | Calculate optimization results |
| `/api/research/save-version` | POST | Save document version |
| `/api/research/save-scenario` | POST | Save optimization scenario |
| `/api/research/export` | POST | Export documents |
| `/api/research/create-vector-store` | POST | Create PGVector embeddings for project |
| `/api/research/chat` | POST | RAG-powered chat with research data |
| `/api/pgvector/test-connection` | POST | Test PGVector database connection |
| `/api/pgvector/config` | GET/PUT | Get or update PGVector configuration |

---

## 17. Success Criteria

1. **Deep Research** successfully crawls websites and extracts relevant company information
2. **Document Upload** supports multiple file types with AI analysis
3. **Certification Matrix** accurately identifies gaps and requirements
4. **Opportunity Matrix** provides actionable revenue estimates
5. **Executive Brief** follows the established template structure
6. **Version Control** tracks all document changes with rollback capability
7. **Presentation Builder** generates professional SVP-branded slides
8. **AI Enhancement** improves document quality on demand
9. **Value Optimizer** provides real-time scenario modeling
10. **PGVector Integration** successfully stores embeddings and enables semantic search
11. **Chat with Research** provides accurate RAG-powered responses with source citations
12. **Export** includes vector store connection settings for data portability
13. **Export** delivers all formats (PDF, HTML, Markdown, PPTX, Web)

---

*This specification document serves as the development guide for implementing the OEM Supplier Readiness Deep Research feature in the SVP Platform Proposal Creator.*
