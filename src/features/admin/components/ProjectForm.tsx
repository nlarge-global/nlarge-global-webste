"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/Button";
import { Select } from "@/components/ui/select";

type ProjectValues = {
  _id?: string;
  clientId: string;
  name: string;
  technicalDetails?: string;
  deliveryDetails?: string;
  repositoryUrl?: string;
  environment?: string;
  productionUrl?: string;
  stagingUrl?: string;
  deadline?: string;
  notes?: string;
};

export default function ProjectForm({
  clients,
  project,
}: {
  clients: Array<{ _id: string; name: string }>;
  project?: ProjectValues;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const csrfToken = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith("nlarge_admin_csrf="))
      ?.split("=")[1];
    const values = Object.fromEntries(form.entries());
    const response = await fetch(
      project ? `/api/admin/projects/${project._id}` : "/api/admin/projects",
      {
        method: project ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken
            ? { "x-csrf-token": decodeURIComponent(csrfToken) }
            : {}),
        },
        body: JSON.stringify(values),
      },
    );
    const result = (await response.json()) as {
      error?: string;
      project?: { _id: string; clientId?: string };
    };
    if (!response.ok) setError(result.error ?? "Unable to save project.");
    else {
      const clientId =
        project?.clientId ?? String(result.project?.clientId ?? "");
      router.push(
        `/admin/clients/${clientId}/projects/${project?._id ?? result.project?._id}`,
      );
    }
    setPending(false);
  }

  return (
    <form
      onSubmit={submit}
      className="grid gap-4 rounded-2xl sm:grid-cols-2"
    >
      {!project && (
        <label className="text-sm font-medium">
          Client
          <Select name="clientId" required>
            <option value="">Select a client</option>
            {clients.map((client) => (
              <option key={client._id} value={client._id}>
                {client.name}
              </option>
            ))}
          </Select>
        </label>
      )}
      <label
        className={`text-sm font-medium ${project ? "sm:col-span-2" : ""}`}
      >
        Project name
        <input
          name="name"
          required
          defaultValue={project?.name}
          className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3"
        />
      </label>
      <label className="text-sm font-medium">
        Environment
        <input
          name="environment"
          defaultValue={project?.environment}
          placeholder="Production, staging..."
          className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3"
        />
      </label>
      <label className="text-sm font-medium">
        Deadline
        <input
          name="deadline"
          type="date"
          defaultValue={project?.deadline}
          className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3"
        />
      </label>
      <label className="text-sm font-medium">
        Repository URL
        <input
          name="repositoryUrl"
          type="url"
          defaultValue={project?.repositoryUrl}
          className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3"
        />
      </label>
      <label className="text-sm font-medium">
        Production URL
        <input
          name="productionUrl"
          type="url"
          defaultValue={project?.productionUrl}
          className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3"
        />
      </label>
      <label className="text-sm font-medium">
        Staging URL
        <input
          name="stagingUrl"
          type="url"
          defaultValue={project?.stagingUrl}
          className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3"
        />
      </label>
      <label className="text-sm font-medium sm:col-span-2">
        Technical details
        <textarea
          name="technicalDetails"
          rows={4}
          defaultValue={project?.technicalDetails}
          className="mt-2 w-full rounded-xl border border-black/15 p-3"
        />
      </label>
      <label className="text-sm font-medium sm:col-span-2">
        Delivery details
        <textarea
          name="deliveryDetails"
          rows={4}
          defaultValue={project?.deliveryDetails}
          className="mt-2 w-full rounded-xl border border-black/15 p-3"
        />
      </label>
      <label className="text-sm font-medium sm:col-span-2">
        Project notes
        <textarea
          name="notes"
          rows={4}
          defaultValue={project?.notes}
          className="mt-2 w-full rounded-xl border border-black/15 p-3"
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-[#602329] sm:col-span-2">
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="sm:col-span-2 mb-2">
        {pending ? "Saving..." : project ? "Save changes" : "Create project"}
      </Button>
    </form>
  );
}
