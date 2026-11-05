"use client";

import { useEffect, useState } from "react";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/schema";
import { useRequireAuth } from "@/lib/hooks/use-auth";
import { useUserProfile } from "@/contexts/user-profile-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

export default function ProfilePage() {
  const { isLoading: authLoading, isAuthenticated, profile } = useRequireAuth();
  const { updateProfile } = useUserProfile();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    company: "",
    location: "",
    bio: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      phone: profile.phone || "",
      company: profile.company || "",
      location: profile.location || "",
      bio: profile.bio || "",
    });
  }, [profile]);

  const save = async () => {
    if (!db || !profile.id) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, COLLECTIONS.TEAM_MEMBERS, profile.id), {
        firstName: form.firstName,
        lastName: form.lastName,
        mobile: form.phone,
        company: form.company,
        location: form.location,
        bio: form.bio,
        updatedAt: Timestamp.now(),
      });
      updateProfile({ ...form });
      toast.success("Profile updated");
    } catch {
      toast.error("Unable to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !isAuthenticated) {
    return <Skeleton className="h-96 w-full" />;
  }

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold font-display">Profile</h1>
        <Badge variant="secondary" className="capitalize">
          {profile.role}
        </Badge>
        {profile.isVeteran && (
          <Badge className="bg-[#1478ac]">
            <ShieldCheck className="h-3 w-3 mr-1" /> Veteran
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Used on certificates and enrollment records
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" {...field("firstName")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" {...field("lastName")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" {...field("phone")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Organization</Label>
              <Input id="company" {...field("company")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" {...field("location")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio / Notes</Label>
            <Textarea id="bio" rows={4} {...field("bio")} />
          </div>
          <Button
            onClick={save}
            disabled={saving}
            className="bg-[#1478ac] hover:bg-[#318dc1]"
          >
            {saving ? "Saving…" : "Save Profile"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
