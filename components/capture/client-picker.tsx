"use client";

import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { captureJson } from "@/lib/capture/api-client";
import type { CustomerDoc } from "@/lib/schema";

interface Props {
  value: string;
  onChange: (clientId: string, client?: CustomerDoc) => void;
  placeholder?: string;
}

export function ClientPicker({ value, onChange, placeholder = "Select a client" }: Props) {
  const [clients, setClients] = useState<CustomerDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    captureJson<{ clients: CustomerDoc[] }>("/api/capture/clients")
      .then((d) => setClients(d.clients))
      .catch((e) => console.error("Failed to load clients:", e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Select value={value} onValueChange={(v) => onChange(v, clients.find((c) => c.id === v))} disabled={loading}>
      <SelectTrigger>
        <SelectValue placeholder={loading ? "Loading clients..." : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {clients.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
