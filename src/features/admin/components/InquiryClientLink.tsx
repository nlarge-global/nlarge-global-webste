"use client";

import Link from "next/link";
import { useState } from "react";
import { Select } from "@/components/ui/select";

type ClientOption = { _id: string; name: string };

export default function InquiryClientLink({
  inquiryId,
  currentClientId,
  currentClientName,
}: {
  inquiryId: string;
  currentClientId?: string;
  currentClientName?: string;
}) {
  const [value, setValue] = useState(currentClientId ?? "");
  const [clientName, setClientName] = useState(currentClientName ?? "");
  const [message, setMessage] = useState("");
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [clientsLoaded, setClientsLoaded] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);
  const [pending, setPending] = useState(false);

  async function loadClients() {
    setLoadingClients(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/inquiries/${inquiryId}/client`);
      const result = await response.json() as { clients?: ClientOption[]; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to load clients.");
      setClients(result.clients ?? []);
      setClientsLoaded(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load clients.");
    } finally {
      setLoadingClients(false);
    }
  }

  async function update(clientId: string) {
    const csrfToken = document.cookie.split("; ").find((cookie) => cookie.startsWith("nlarge_admin_csrf="))?.split("=")[1];
    setPending(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/inquiries/${inquiryId}/client`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "x-csrf-token": decodeURIComponent(csrfToken) } : {}),
        },
        body: JSON.stringify({ clientId: clientId || null }),
      });
      const result = await response.json() as { error?: string; message?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to update client link.");
      setMessage(result.message ?? "Updated.");
      setValue(clientId);
      setClientName(clients.find((client) => client._id === clientId)?.name ?? "");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update client link.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-6 rounded-xl bg-[#f5f3f0] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Linked client</h2>
        {value && clientName && (
          <Link
            href={`/admin/clients/${value}`}
            className="text-sm font-semibold text-[#602329] underline underline-offset-4"
          >
            Open {clientName}
          </Link>
        )}
      </div>
      {!clientsLoaded ? (
        <button
          type="button"
          disabled={loadingClients}
          onClick={() => void loadClients()}
          className="mt-3 min-h-10 rounded-lg border border-black/15 bg-white px-3 text-sm font-medium hover:bg-black/[0.03] focus-visible:outline-2 focus-visible:outline-[#602329] disabled:opacity-60 cursor-pointer"
        >
          {loadingClients ? "Loading clients…" : "Load clients to link"}
        </button>
      ) : (
        <label className="mt-3 block text-sm font-medium">
          Choose a client
          <Select
            disabled={pending}
            value={value}
            onChange={(event) => void update(event.target.value)}
          >
            <option value="">No client linked</option>
            {value && clientName && !clients.some((client) => client._id === value) && (
              <option value={value}>{clientName}</option>
            )}
            {clients.map((client) => (
              <option key={client._id} value={client._id}>{client.name}</option>
            ))}
          </Select>
        </label>
      )}
      {message && <p role="status" className="mt-2 text-xs text-black/55">{message}</p>}
    </div>
  );
}
