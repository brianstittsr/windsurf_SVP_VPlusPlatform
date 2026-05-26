"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  FileText, 
  MapPin,
  Eye,
  Download,
  Upload
} from "lucide-react";

interface FieldMapping {
  pdfFieldName: string;
  dataPath: string;
  format?: string;
}

interface FormTemplate {
  id: string;
  name: string;
  description: string;
  category: "required" | "optional";
  triggerCondition?: string;
  pageCount: number;
  pdfFileName: string;
  pdfStorageUrl: string;
  fieldMappings: FieldMapping[];
  status: "active" | "inactive";
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface TemplateFieldMappingEditorProps {
  template: FormTemplate | null;
  onSave: (template: FormTemplate) => void;
  onCancel: () => void;
  onPreview?: (template: FormTemplate) => void;
}

const AVAILABLE_FORMATS = [
  { value: "", label: "None" },
  { value: "firstLast", label: "First Last" },
  { value: "lastFirst", label: "Last, First" },
  { value: "fullAddress", label: "Full Address" },
  { value: "date", label: "Date" },
  { value: "phone", label: "Phone" },
  { value: "currency", label: "Currency" }
];

const COMMON_DATA_PATHS = [
  // Demographics
  "demographics.firstName",
  "demographics.lastName", 
  "demographics.middleInitial",
  "demographics.dateOfBirth",
  "demographics.ssn",
  "demographics.residentialAddress.street",
  "demographics.residentialAddress.apt",
  "demographics.residentialAddress.city",
  "demographics.residentialAddress.zipCode",
  "demographics.cellPhone",
  "demographics.homePhone",
  "demographics.email",
  "demographics.maritalStatus",
  "demographics.race",
  "demographics.ethnicity",
  "demographics.citizenshipStatus",
  
  // Income Info
  "incomeInfo.employmentStatus",
  "incomeInfo.employerName",
  "incomeInfo.employerPhone",
  "incomeInfo.employerAddress",
  "incomeInfo.monthlyTotal",
  "incomeInfo.yearlyTotal",
  "incomeInfo.incomeSources.wages",
  "incomeInfo.incomeSources.selfEmployment",
  "incomeInfo.incomeSources.other",
  "incomeInfo.workDescription",
  
  // Household Info
  "householdInfo.totalMembers",
  "householdInfo.adults",
  "householdInfo.children",
  "householdInfo.dependents",
  
  // Housing Info
  "housingInfo.housingType",
  "housingInfo.monthlyRent",
  "housingInfo.familySupport",
  "housingInfo.supporterName",
  "housingInfo.supporterRelationship",
  
  // Spouse Info
  "spouseInfo.firstName",
  "spouseInfo.lastName",
  "spouseInfo.dateOfBirth",
  "spouseInfo.ssn",
  "spouseInfo.employmentStatus",
  "spouseInfo.employerName",
  "spouseInfo.monthlyIncome",
  
  // Additional Questions
  "additionalQuestions.seenByPcpLastYear",
  "additionalQuestions.pcpWhere",
  "additionalQuestions.pcpWhen",
  "additionalQuestions.educationLevel",
  "additionalQuestions.hasSmartphone",
  "additionalQuestions.textConsent",
  "additionalQuestions.internetAccess",
  
  // System Fields
  "signatureDataUrl",
  "signedAt",
  "createdAt",
  "updatedAt",
  "language"
];

export function TemplateFieldMappingEditor({ 
  template, 
  onSave, 
  onCancel, 
  onPreview 
}: TemplateFieldMappingEditorProps) {
  const [editingTemplate, setEditingTemplate] = useState<FormTemplate | null>(null);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [newMapping, setNewMapping] = useState<FieldMapping>({
    pdfFieldName: "",
    dataPath: "",
    format: ""
  });
  const [showAddMapping, setShowAddMapping] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (template) {
      setEditingTemplate({ ...template });
      setFieldMappings([...template.fieldMappings]);
    }
  }, [template]);

  const addFieldMapping = () => {
    if (!newMapping.pdfFieldName || !newMapping.dataPath) {
      setErrors(["PDF field name and data path are required"]);
      return;
    }

    // Check for duplicate PDF field names
    if (fieldMappings.some(m => m.pdfFieldName === newMapping.pdfFieldName)) {
      setErrors(["PDF field name must be unique"]);
      return;
    }

    setFieldMappings([...fieldMappings, { ...newMapping }]);
    setNewMapping({ pdfFieldName: "", dataPath: "", format: "" });
    setShowAddMapping(false);
    setErrors([]);
  };

  const updateFieldMapping = (index: number, mapping: FieldMapping) => {
    const updated = [...fieldMappings];
    updated[index] = mapping;
    setFieldMappings(updated);
  };

  const removeFieldMapping = (index: number) => {
    setFieldMappings(fieldMappings.filter((_, i) => i !== index));
  };

  const validateTemplate = (): string[] => {
    const validationErrors: string[] = [];
    
    if (!editingTemplate?.name) {
      validationErrors.push("Template name is required");
    }
    
    if (!editingTemplate?.pdfFileName) {
      validationErrors.push("PDF filename is required");
    }
    
    if (fieldMappings.length === 0) {
      validationErrors.push("At least one field mapping is required");
    }
    
    // Check for duplicate PDF field names
    const pdfFieldNames = fieldMappings.map(m => m.pdfFieldName);
    const duplicates = pdfFieldNames.filter((name, index) => pdfFieldNames.indexOf(name) !== index);
    if (duplicates.length > 0) {
      validationErrors.push(`Duplicate PDF field names: ${duplicates.join(", ")}`);
    }
    
    return validationErrors;
  };

  const handleSave = async () => {
    const validationErrors = validateTemplate();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      const updatedTemplate: FormTemplate = {
        ...editingTemplate!,
        fieldMappings,
        updatedAt: new Date().toISOString()
      };
      
      await onSave(updatedTemplate);
    } catch (error) {
      setErrors(["Failed to save template"]);
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    if (editingTemplate && onPreview) {
      onPreview({ ...editingTemplate, fieldMappings });
    }
  };

  if (!editingTemplate) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Template Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Template Information
          </CardTitle>
          <CardDescription>
            Basic template details and settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={editingTemplate.name}
                onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                placeholder="Enter template name"
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={editingTemplate.category}
                onValueChange={(value: "required" | "optional") => 
                  setEditingTemplate({ ...editingTemplate, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="required">Required</SelectItem>
                  <SelectItem value="optional">Optional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={editingTemplate.description}
              onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
              placeholder="Enter template description"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="pageCount">Page Count</Label>
              <Input
                id="pageCount"
                type="number"
                min="1"
                value={editingTemplate.pageCount}
                onChange={(e) => setEditingTemplate({ ...editingTemplate, pageCount: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div>
              <Label htmlFor="pdfFileName">PDF Filename</Label>
              <Input
                id="pdfFileName"
                value={editingTemplate.pdfFileName}
                onChange={(e) => setEditingTemplate({ ...editingTemplate, pdfFileName: e.target.value })}
                placeholder="template.pdf"
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={editingTemplate.status}
                onValueChange={(value: "active" | "inactive") => 
                  setEditingTemplate({ ...editingTemplate, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {editingTemplate.category === "optional" && (
            <div>
              <Label htmlFor="triggerCondition">Trigger Condition (Optional)</Label>
              <Input
                id="triggerCondition"
                value={editingTemplate.triggerCondition || ""}
                onChange={(e) => setEditingTemplate({ ...editingTemplate, triggerCondition: e.target.value })}
                placeholder="e.g., incomeInfo.monthlyTotal === 0"
              />
              <p className="text-xs text-gray-500 mt-1">
                JavaScript expression that evaluates to true to include this template
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Field Mappings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Field Mappings
              </CardTitle>
              <CardDescription>
                Map PDF form fields to application data
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddMapping(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Mapping
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {fieldMappings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No field mappings defined</p>
              <p className="text-sm">Add mappings to connect PDF fields to application data</p>
            </div>
          ) : (
            <div className="space-y-4">
              {fieldMappings.map((mapping, index) => (
                <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs">PDF Field Name</Label>
                      <Input
                        value={mapping.pdfFieldName}
                        onChange={(e) => updateFieldMapping(index, { ...mapping, pdfFieldName: e.target.value })}
                        placeholder="patientName"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Data Path</Label>
                      <Select
                        value={mapping.dataPath}
                        onValueChange={(value) => updateFieldMapping(index, { ...mapping, dataPath: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {COMMON_DATA_PATHS.map((path) => (
                            <SelectItem key={path} value={path}>
                              <div className="flex flex-col">
                                <span className="text-sm">{path}</span>
                                <span className="text-xs text-gray-500">
                                  {path.split(".").pop()}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Format</Label>
                      <Select
                        value={mapping.format || ""}
                        onValueChange={(value) => updateFieldMapping(index, { ...mapping, format: value || undefined })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {AVAILABLE_FORMATS.map((format) => (
                            <SelectItem key={format.value} value={format.value}>
                              {format.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFieldMapping(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Mapping Dialog */}
      <Dialog open={showAddMapping} onOpenChange={setShowAddMapping}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Field Mapping</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newPdfField">PDF Field Name</Label>
              <Input
                id="newPdfField"
                value={newMapping.pdfFieldName}
                onChange={(e) => setNewMapping({ ...newMapping, pdfFieldName: e.target.value })}
                placeholder="patientName"
              />
            </div>
            <div>
              <Label htmlFor="newDataPath">Data Path</Label>
              <Select
                value={newMapping.dataPath}
                onValueChange={(value) => setNewMapping({ ...newMapping, dataPath: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {COMMON_DATA_PATHS.map((path) => (
                    <SelectItem key={path} value={path}>
                      <div className="flex flex-col">
                        <span className="text-sm">{path}</span>
                        <span className="text-xs text-gray-500">
                          {path.split(".").pop()}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="newFormat">Format</Label>
              <Select
                value={newMapping.format || ""}
                onValueChange={(value) => setNewMapping({ ...newMapping, format: value || undefined })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_FORMATS.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMapping(false)}>
              Cancel
            </Button>
            <Button onClick={addFieldMapping}>
              Add Mapping
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Errors */}
      {errors.length > 0 && (
        <Alert>
          <AlertDescription>
            <ul className="list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        {onPreview && (
          <Button variant="outline" onClick={handlePreview}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
        )}
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Template"}
        </Button>
      </div>
    </div>
  );
}
