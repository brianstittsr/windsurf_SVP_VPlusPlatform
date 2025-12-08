"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronLeft,
  Check,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { HeroSlide } from "@/components/marketing/hero-carousel";

// Mock data - in production this would come from a database
const initialSlides: HeroSlide[] = [
  {
    id: "1",
    badge: "Introducing EDGE-X™ — Next-Gen Manufacturing Intelligence",
    headline: "Win OEM Contracts.",
    highlightedText: "Transform",
    subheadline: "We help small- and mid-sized U.S. manufacturers become qualified suppliers through ISO certification, operational readiness, and supplier development.",
    benefits: ["OEM Supplier Qualification", "ISO/QMS Certification", "Industry 4.0 Ready"],
    primaryCta: { text: "Get Your Free Assessment", href: "/contact" },
    secondaryCta: { text: "See Success Stories", href: "/case-studies" },
    isPublished: true,
    order: 1,
  },
  {
    id: "2",
    badge: "V+ TwinEDGE™ — Digital Twin Solutions",
    headline: "Visualize Your Factory.",
    highlightedText: "Optimize",
    subheadline: "Create digital replicas of your manufacturing processes to simulate, analyze, and improve operations before making costly physical changes.",
    benefits: ["Real-time Monitoring", "Predictive Analytics", "Process Simulation"],
    primaryCta: { text: "Explore Digital Twins", href: "/services/twinedge" },
    secondaryCta: { text: "Watch Demo", href: "/demo" },
    isPublished: true,
    order: 2,
  },
  {
    id: "3",
    badge: "V+ IntellEDGE™ — AI-Powered Insights",
    headline: "Make Smarter Decisions.",
    highlightedText: "Faster",
    subheadline: "Leverage artificial intelligence to gain actionable insights from your manufacturing data, predict maintenance needs, and optimize production schedules.",
    benefits: ["AI-Driven Analytics", "Predictive Maintenance", "Smart Scheduling"],
    primaryCta: { text: "Discover AI Solutions", href: "/services/intelledge" },
    secondaryCta: { text: "Learn More", href: "/about" },
    isPublished: true,
    order: 3,
  },
  {
    id: "4",
    badge: "Reshoring Initiative Partner",
    headline: "Bring Manufacturing",
    highlightedText: "Home",
    subheadline: "Join the reshoring movement. We help companies navigate the complexities of bringing manufacturing back to the United States with comprehensive support.",
    benefits: ["Supply Chain Security", "Quality Control", "Job Creation"],
    primaryCta: { text: "Start Reshoring", href: "/services/reshoring" },
    secondaryCta: { text: "View Case Studies", href: "/case-studies" },
    isPublished: false,
    order: 4,
  },
];

const wizardSteps = [
  { id: 1, title: "Basic Info", description: "Badge and headline" },
  { id: 2, title: "Content", description: "Subheadline and benefits" },
  { id: 3, title: "Actions", description: "Call-to-action buttons" },
  { id: 4, title: "Review", description: "Preview and publish" },
];

interface SlideFormData {
  badge: string;
  headline: string;
  highlightedText: string;
  subheadline: string;
  benefits: string[];
  primaryCtaText: string;
  primaryCtaHref: string;
  secondaryCtaText: string;
  secondaryCtaHref: string;
  isPublished: boolean;
}

const emptyFormData: SlideFormData = {
  badge: "",
  headline: "",
  highlightedText: "",
  subheadline: "",
  benefits: ["", "", ""],
  primaryCtaText: "",
  primaryCtaHref: "",
  secondaryCtaText: "",
  secondaryCtaHref: "",
  isPublished: false,
};

export default function HeroManagementPage() {
  const [slides, setSlides] = useState<HeroSlide[]>(initialSlides);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [formData, setFormData] = useState<SlideFormData>(emptyFormData);

  const openWizard = (slide?: HeroSlide) => {
    if (slide) {
      setEditingSlide(slide);
      setFormData({
        badge: slide.badge,
        headline: slide.headline,
        highlightedText: slide.highlightedText,
        subheadline: slide.subheadline,
        benefits: [...slide.benefits, "", ""].slice(0, 3),
        primaryCtaText: slide.primaryCta.text,
        primaryCtaHref: slide.primaryCta.href,
        secondaryCtaText: slide.secondaryCta.text,
        secondaryCtaHref: slide.secondaryCta.href,
        isPublished: slide.isPublished,
      });
    } else {
      setEditingSlide(null);
      setFormData(emptyFormData);
    }
    setWizardStep(1);
    setIsWizardOpen(true);
  };

  const closeWizard = () => {
    setIsWizardOpen(false);
    setEditingSlide(null);
    setFormData(emptyFormData);
    setWizardStep(1);
  };

  const handleSave = () => {
    const newSlide: HeroSlide = {
      id: editingSlide?.id || Date.now().toString(),
      badge: formData.badge,
      headline: formData.headline,
      highlightedText: formData.highlightedText,
      subheadline: formData.subheadline,
      benefits: formData.benefits.filter(b => b.trim() !== ""),
      primaryCta: { text: formData.primaryCtaText, href: formData.primaryCtaHref },
      secondaryCta: { text: formData.secondaryCtaText, href: formData.secondaryCtaHref },
      isPublished: formData.isPublished,
      order: editingSlide?.order || slides.length + 1,
    };

    if (editingSlide) {
      setSlides(slides.map(s => s.id === editingSlide.id ? newSlide : s));
    } else {
      setSlides([...slides, newSlide]);
    }
    closeWizard();
  };

  const handleDelete = (id: string) => {
    setSlides(slides.filter(s => s.id !== id));
  };

  const togglePublish = (id: string) => {
    setSlides(slides.map(s => s.id === id ? { ...s, isPublished: !s.isPublished } : s));
  };

  const moveSlide = (id: string, direction: "up" | "down") => {
    const index = slides.findIndex(s => s.id === id);
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === slides.length - 1)
    ) return;

    const newSlides = [...slides];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    [newSlides[index], newSlides[swapIndex]] = [newSlides[swapIndex], newSlides[index]];
    
    // Update order values
    newSlides.forEach((slide, i) => {
      slide.order = i + 1;
    });
    
    setSlides(newSlides);
  };

  const updateBenefit = (index: number, value: string) => {
    const newBenefits = [...formData.benefits];
    newBenefits[index] = value;
    setFormData({ ...formData, benefits: newBenefits });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Hero Carousel Management</h1>
          <p className="text-muted-foreground">
            Manage the rotating hero slides on the homepage
          </p>
        </div>
        <Button onClick={() => openWizard()}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Slide
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Slides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{slides.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {slides.filter(s => s.isPublished).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {slides.filter(s => !s.isPublished).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Slides List */}
      <Card>
        <CardHeader>
          <CardTitle>Hero Slides</CardTitle>
          <CardDescription>
            Drag to reorder slides. Published slides will appear in the carousel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {slides.sort((a, b) => a.order - b.order).map((slide, index) => (
              <div
                key={slide.id}
                className={cn(
                  "flex items-center gap-4 p-4 border rounded-lg",
                  !slide.isPublished && "bg-muted/50"
                )}
              >
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => moveSlide(slide.id, "up")}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => moveSlide(slide.id, "down")}
                    disabled={index === slides.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={slide.isPublished ? "default" : "secondary"}>
                      {slide.isPublished ? "Published" : "Draft"}
                    </Badge>
                    <span className="text-sm text-muted-foreground">Order: {slide.order}</span>
                  </div>
                  <h3 className="font-semibold truncate">
                    {slide.headline} <span className="text-primary">{slide.highlightedText}</span>
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">{slide.badge}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => togglePublish(slide.id)}
                    title={slide.isPublished ? "Unpublish" : "Publish"}
                  >
                    {slide.isPublished ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openWizard(slide)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => handleDelete(slide.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Wizard Dialog */}
      <Dialog open={isWizardOpen} onOpenChange={setIsWizardOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingSlide ? "Edit Hero Slide" : "Create New Hero Slide"}
            </DialogTitle>
            <DialogDescription>
              Step {wizardStep} of {wizardSteps.length}: {wizardSteps[wizardStep - 1].title}
            </DialogDescription>
          </DialogHeader>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-6">
            {wizardSteps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                    wizardStep > step.id
                      ? "bg-primary text-primary-foreground"
                      : wizardStep === step.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {wizardStep > step.id ? <Check className="h-4 w-4" /> : step.id}
                </div>
                {index < wizardSteps.length - 1 && (
                  <div
                    className={cn(
                      "w-12 h-1 mx-2",
                      wizardStep > step.id ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="space-y-4 min-h-[300px]">
            {wizardStep === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="badge">Badge Text</Label>
                  <Input
                    id="badge"
                    placeholder="e.g., Introducing EDGE-X™ — Next-Gen Manufacturing Intelligence"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="headline">Headline</Label>
                  <Input
                    id="headline"
                    placeholder="e.g., Win OEM Contracts."
                    value={formData.headline}
                    onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="highlightedText">Highlighted Text (shown in green)</Label>
                  <Input
                    id="highlightedText"
                    placeholder="e.g., Transform"
                    value={formData.highlightedText}
                    onChange={(e) => setFormData({ ...formData, highlightedText: e.target.value })}
                  />
                </div>
              </>
            )}

            {wizardStep === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="subheadline">Subheadline</Label>
                  <Textarea
                    id="subheadline"
                    placeholder="Describe your value proposition..."
                    value={formData.subheadline}
                    onChange={(e) => setFormData({ ...formData, subheadline: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Key Benefits (up to 3)</Label>
                  {formData.benefits.map((benefit, index) => (
                    <Input
                      key={index}
                      placeholder={`Benefit ${index + 1}`}
                      value={benefit}
                      onChange={(e) => updateBenefit(index, e.target.value)}
                    />
                  ))}
                </div>
              </>
            )}

            {wizardStep === 3 && (
              <>
                <div className="space-y-4">
                  <h4 className="font-medium">Primary Call-to-Action</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primaryCtaText">Button Text</Label>
                      <Input
                        id="primaryCtaText"
                        placeholder="e.g., Get Your Free Assessment"
                        value={formData.primaryCtaText}
                        onChange={(e) => setFormData({ ...formData, primaryCtaText: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="primaryCtaHref">Link URL</Label>
                      <Input
                        id="primaryCtaHref"
                        placeholder="e.g., /contact"
                        value={formData.primaryCtaHref}
                        onChange={(e) => setFormData({ ...formData, primaryCtaHref: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">Secondary Call-to-Action</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="secondaryCtaText">Button Text</Label>
                      <Input
                        id="secondaryCtaText"
                        placeholder="e.g., See Success Stories"
                        value={formData.secondaryCtaText}
                        onChange={(e) => setFormData({ ...formData, secondaryCtaText: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="secondaryCtaHref">Link URL</Label>
                      <Input
                        id="secondaryCtaHref"
                        placeholder="e.g., /case-studies"
                        value={formData.secondaryCtaHref}
                        onChange={(e) => setFormData({ ...formData, secondaryCtaHref: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {wizardStep === 4 && (
              <div className="space-y-4">
                <div className="p-4 bg-black text-white rounded-lg">
                  <Badge variant="outline" className="mb-2 border-primary/50 text-primary">
                    {formData.badge || "Badge text"}
                  </Badge>
                  <h2 className="text-2xl font-bold">
                    {formData.headline || "Headline"}{" "}
                    <span className="text-primary">{formData.highlightedText || "Highlighted"}</span> Your Manufacturing.
                  </h2>
                  <p className="mt-2 text-gray-300 text-sm">
                    {formData.subheadline || "Subheadline text"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {formData.benefits.filter(b => b).map((benefit, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {benefit}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="publish">Publish immediately</Label>
                    <p className="text-sm text-muted-foreground">
                      Make this slide visible on the homepage
                    </p>
                  </div>
                  <Switch
                    id="publish"
                    checked={formData.isPublished}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => wizardStep === 1 ? closeWizard() : setWizardStep(wizardStep - 1)}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              {wizardStep === 1 ? "Cancel" : "Back"}
            </Button>
            {wizardStep < 4 ? (
              <Button onClick={() => setWizardStep(wizardStep + 1)}>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSave}>
                <Check className="mr-2 h-4 w-4" />
                {editingSlide ? "Save Changes" : "Create Slide"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
