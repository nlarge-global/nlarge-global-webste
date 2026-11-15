"use client";

import { useState } from "react";
import { Select } from "@/components/ui/select";

export default function InquiryClientLink({ inquiryId, currentClientId, clients }: { inquiryId: string; currentClientId?: string; clients: Array<{ _id: string; name: string }> }) {
  const [value, setValue] = useState(currentClientId ?? "");
  const [message, setMessage] = useState("");

  async function update(clientId: string) {
    const csrfToken = document.cookie.split("; ").find((cookie) => cookie.startsWith("nlarge_admin_csrf="))?.split("=")[1];
    const response = await fetch(`/api/admin/inquiries/${inquiryId}/client`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(csrfToken ? { "x-csrf-token": decodeURIComponent(csrfToken) } : {}) },
      body: JSON.stringify({ clientId: clientId || null }),
    });
    const result = await response.json() as { error?: string; message?: string };
    setMessage(response.ok ? result.message ?? "Updated." : result.error ?? "Unable to update.");
    if (response.ok) setValue(clientId);
  }

  return (
    <div className="mt-6 rounded-xl bg-[#f5f3f0] p-4">
      <label className="text-sm font-semibold">Linked client
        <Select value={value} onChange={(event) => void update(event.target.value)}>
          <option value="">No client linked</option>
          {clients.map((client) => <option key={client._id} value={client._id}>{client.name}</option>)}
        </Select>
      </label>
      {message && <p role="status" className="mt-2 text-xs text-black/55">{message}</p>}
    </div>
  );
}
