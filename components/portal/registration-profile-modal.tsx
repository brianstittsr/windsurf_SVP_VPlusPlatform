"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, UserCheck } from "lucide-react";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/schema";
import { collection, addDoc, Timestamp } from "firebase/firestore";

export interface RegistrationData {
  firebaseUid: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  accountType: "affiliate" | "strategic_partner" | "client";
}

interface RegistrationProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (teamMemberId: string) => void;
  registrationData: RegistrationData;
}

export function RegistrationProfileModal({
  isOpen,
  onClose,
  onComplete,
  registrationData,
}: RegistrationProfileModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  // Form state - pre-populated from registration + additional fields
  const [formData, setFormData] = useState({
    // From registration (pre-filled)
    firstName: registrationData.firstName,
    lastName: registrationData.lastName,
    emailPrimary: registrationData.email,
    mobile: registrationData.phone,
    company: registrationData.company,
    // Additional enrichment fields
    emailSecondary: "",
    title: "",
    expertise: "",
    linkedIn: "",
    website: "",
    location: "",
    bio: "",
    role: registrationData.accountType === "affiliate" ? "affiliate" : 
          registrationData.accountType === "strategic_partner" ? "consultant" : "team",
    status: "active" as const,
  });

  // Update form when registration data changes
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      firstName: registrationData.firstName,
      lastName: registrationData.lastName,
      emailPrimary: registrationData.email,
      mobile: registrationData.phone,
      company: registrationData.company,
      role: registrationData.accountType === "affiliate" ? "affiliate" : 
            registrationData.accountType === "strategic_partner" ? "consultant" : "team",
    }));
  }, [registrationData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError("First name and last name are required");
      return;
    }
    if (!formData.emailPrimary.trim()) {
      setError("Email is required");
      return;
    }
    if (!formData.expertise.trim()) {
      setError("Please describe your expertise");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      if (!db) {
        throw new Error("Database not initialized");
      }

      // Create the merged team member record with auth linkage
      const teamMemberData = {
        // Link to Firebase Auth
        firebaseUid: registrationData.firebaseUid,
        // Basic info from registration
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        emailPrimary: formData.emailPrimary.trim().toLowerCase(),
        // Enriched info from modal
        emailSecondary: formData.emailSecondary.trim() || null,
        mobile: formData.mobile.trim() || null,
        company: formData.company.trim() || null,
        title: formData.title.trim() || null,
        expertise: formData.expertise.trim(),
        linkedIn: formData.linkedIn.trim() || null,
        website: formData.website.trim() || null,
        location: formData.location.trim() || null,
        bio: formData.bio.trim() || null,
        // Role based on account type
        role: formData.role as "admin" | "team" | "affiliate" | "consultant",
        status: "active" as const,
        // Timestamps
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      // Write single merged record to Firestore
      const docRef = await addDoc(collection(db, COLLECTIONS.TEAM_MEMBERS), teamMemberData);
      
      console.log("Created team member with auth linkage:", docRef.id, "Firebase UID:", registrationData.firebaseUid);

      // Store team member ID in session for immediate use
      sessionStorage.setItem("svp_team_member_id", docRef.id);
      sessionStorage.setItem("svp_user_role", formData.role);

      onComplete(docRef.id);
    } catch (err: any) {
      console.error("Error creating team member:", err);
      setError(err.message || "Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-[#C8A951]" />
            Complete Your Profile
          </DialogTitle>
          <DialogDescription>
            Review and enrich your profile information. This will create your team member record.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Name Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                placeholder="Doe"
              />
            </div>
          </div>

          {/* Email Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emailPrimary">Email (Primary) *</Label>
              <Input
                id="emailPrimary"
                type="email"
                value={formData.emailPrimary}
                onChange={(e) => handleInputChange("emailPrimary", e.target.value)}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailSecondary">Email (Secondary)</Label>
              <Input
                id="emailSecondary"
                type="email"
                value={formData.emailSecondary}
                onChange={(e) => handleInputChange("emailSecondary", e.target.value)}
                placeholder="john@gmail.com"
              />
            </div>
          </div>

          {/* Phone & Role Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile</Label>
              <Input
                id="mobile"
                value={formData.mobile}
                onChange={(e) => handleInputChange("mobile", e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleInputChange("role", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="affiliate">Affiliate</SelectItem>
                  <SelectItem value="consultant">Consultant / Strategic Partner</SelectItem>
                  <SelectItem value="team">Team Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Expertise */}
          <div className="space-y-2">
            <Label htmlFor="expertise">Expertise *</Label>
            <Input
              id="expertise"
              value={formData.expertise}
              onChange={(e) => handleInputChange("expertise", e.target.value)}
              placeholder="e.g., Operations, Six Sigma, Marketing"
            />
          </div>

          {/* Title & Company Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="e.g., Senior Consultant"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleInputChange("company", e.target.value)}
                placeholder="Company name"
              />
            </div>
          </div>

          {/* LinkedIn & Website Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="linkedIn">LinkedIn</Label>
              <Input
                id="linkedIn"
                value={formData.linkedIn}
                onChange={(e) => handleInputChange("linkedIn", e.target.value)}
                placeholder="https://linkedin.com/in/username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleInputChange("website", e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              placeholder="City, State"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleInputChange("bio", e.target.value)}
              placeholder="Tell us about yourself and your experience..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Skip for now
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving}
            className="bg-gradient-to-r from-[#C8A951] to-[#a08840] hover:from-[#b89841] hover:to-[#907830] text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Complete Registration"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
