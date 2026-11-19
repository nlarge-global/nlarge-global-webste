"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "./ui/Button";
import { Select } from "@/components/ui/select";
import { getDisplayErrorMessage } from "@/lib/error-message";
import {
  fromDateTimeLocal,
  toDateTimeLocal,
} from "@/features/admin/services/date-time";

type ProjectValues = {
  _id?: string;
  clientId: string;
  name: string;
  status?: "todo" | "in-progress" | "done";
  technicalDetails?: string;
  deliveryDetails?: string;
  repositoryUrl?: string;
  environment?: string;
  productionUrl?: string;
  stagingUrl?: string;
  deadline?: string;
  deliveredAt?: string;
  notes?: string;
};

type ProjectStatus = "todo" | "in-progress" | "done";

export default function ProjectForm({
  clients,
  project,
  onDirtyChange,
  onSaved,
}: {
  clients: Array<{ _id: string; name: string }>;
  project?: ProjectValues;
  onDirtyChange?: (dirty: boolean) => void;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? "todo");
  const [dates, setDates] = useState({
    deadline: toDateTimeLocal(project?.deadline),
    deliveredAt: toDateTimeLocal(project?.deliveredAt),
  });
  const initialValues: Record<string, string> = {
    clientId: "",
    name: project?.name ?? "",
    status: project?.status ?? "todo",
    environment: project?.environment ?? "",
    deadline: toDateTimeLocal(project?.deadline),
    deliveredAt: toDateTimeLocal(project?.deliveredAt),
    repositoryUrl: project?.repositoryUrl ?? "",
    productionUrl: project?.productionUrl ?? "",
    stagingUrl: project?.stagingUrl ?? "",
    technicalDetails: project?.technicalDetails ?? "",
    deliveryDetails: project?.deliveryDetails ?? "",
    notes: project?.notes ?? "",
  };

  function updateDirty(form: HTMLFormElement) {
    const values = new FormData(form);
    const changed =
      Object.entries(initialValues).some(
        ([name, value]) =>
          name !== "deadline" &&
          name !== "deliveredAt" &&
          String(values.get(name) ?? "") !== value,
      ) ||
      String(values.get("deadline") ?? dates.deadline) !== initialValues.deadline ||
      String(values.get("deliveredAt") ?? dates.deliveredAt) !==
        initialValues.deliveredAt;
    setDirty(changed);
    onDirtyChange?.(changed);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const form = new FormData(event.currentTarget);
      const csrfToken = document.cookie
        .split("; ")
        .find((cookie) => cookie.startsWith("nlarge_admin_csrf="))
        ?.split("=")[1];
      const values = {
        ...Object.fromEntries(form.entries()),
        deadline: fromDateTimeLocal(dates.deadline) ?? "",
        deliveredAt: fromDateTimeLocal(dates.deliveredAt) ?? "",
      };
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
        project: { _id: string; clientId: string };
      };
      if (!response.ok) {
        const message = result.error ?? "Unable to save project.";
        setError(message);
        toast.error(message);
        return;
      }

      toast.success(project ? "Project updated." : "Project created.");
      onSaved?.();
      if (project) {
        router.refresh();
      } else {
        router.push(
          `/admin/clients/${result.project.clientId}/projects/${result.project._id}`,
        );
      }
    } catch (error) {
      const message = getDisplayErrorMessage(
        error,
        "Unable to save project. Check your connection and try again.",
      );
      setError(message);
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onChange={(event) => updateDirty(event.currentTarget)}
      onReset={() => {
        setStatus(project?.status ?? "todo");
        setDates({
          deadline: initialValues.deadline,
          deliveredAt: initialValues.deliveredAt,
        });
        setDirty(false);
        onDirtyChange?.(false);
      }}
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
      <label className="text-sm font-medium">
        Project status
        <Select
          name="status"
          value={status}
          onChange={(event) => setStatus(event.target.value as ProjectStatus)}
          className="mt-2"
        >
          <option value="todo">To do</option>
          <option value="in-progress">In progress</option>
          <option value="done">Complete</option>
        </Select>
      </label>
      <label
        className="text-sm font-medium"
      >
        Project name
        <input
          name="name"
          required
          maxLength={150}
          defaultValue={project?.name}
          className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3"
        />
      </label>
      <label className="text-sm font-medium">
        Environment
        <input
          name="environment"
          maxLength={100}
          defaultValue={project?.environment}
          placeholder="Production, staging..."
          className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3"
        />
      </label>
      <label className="text-sm font-medium">
        Deadline date and time
        <input
          name="deadline"
          type="datetime-local"
          step="60"
          value={dates.deadline}
          disabled={status === "done"}
          onChange={(event) =>
            setDates((current) => ({ ...current, deadline: event.target.value }))
          }
          className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3 disabled:cursor-not-allowed disabled:bg-black/5 disabled:text-black/45"
        />
        <span className="mt-1 block text-xs font-normal text-black/50">
          Optional — used while the project is To do or In progress.
        </span>
      </label>
      <label className="text-sm font-medium">
        Delivered date and time
        <input
          name="deliveredAt"
          type="datetime-local"
          step="60"
          value={dates.deliveredAt}
          disabled={status !== "done"}
          onChange={(event) =>
            setDates((current) => ({ ...current, deliveredAt: event.target.value }))
          }
          className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3 disabled:cursor-not-allowed disabled:bg-black/5 disabled:text-black/45"
        />
        <span className="mt-1 block text-xs font-normal text-black/50">
          Optional — used when the project is Complete.
        </span>
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
          maxLength={5000}
          rows={4}
          defaultValue={project?.technicalDetails}
          className="mt-2 w-full rounded-xl border border-black/15 p-3"
        />
      </label>
      <label className="text-sm font-medium sm:col-span-2">
        Delivery details
        <textarea
          name="deliveryDetails"
          maxLength={5000}
          rows={4}
          defaultValue={project?.deliveryDetails}
          className="mt-2 w-full rounded-xl border border-black/15 p-3"
        />
      </label>
      <label className="text-sm font-medium sm:col-span-2">
        Project notes
        <textarea
          name="notes"
          maxLength={5000}
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
      <Button
        type="submit"
        disabled={pending || (Boolean(project) && !dirty)}
        className="sm:col-span-2 mb-2"
      >
        {pending ? "Saving..." : project ? "Save changes" : "Create project"}
      </Button>
    </form>
  );
}
