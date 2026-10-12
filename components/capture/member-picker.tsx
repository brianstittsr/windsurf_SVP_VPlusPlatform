"use client";

import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { captureJson } from "@/lib/capture/api-client";

export interface CaptureMember {
  id: string;
  name: string;
  email: string;
  role?: string;
  firebaseUid?: string;
}

interface Props {
  value: string;
  onChange: (memberId: string, member?: CaptureMember) => void;
  placeholder?: string;
}

export function MemberPicker({ value, onChange, placeholder = "Assign to..." }: Props) {
  const [members, setMembers] = useState<CaptureMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    captureJson<{ members: CaptureMember[] }>("/api/capture/members")
      .then((d) => setMembers(d.members))
      .catch((e) => console.error("Failed to load members:", e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Select value={value} onValueChange={(v) => onChange(v, members.find((m) => m.id === v))} disabled={loading}>
      <SelectTrigger>
        <SelectValue placeholder={loading ? "Loading..." : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {members.map((m) => (
          <SelectItem key={m.id} value={m.id}>
            {m.name}
            {m.role === "admin" ? " (admin)" : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
