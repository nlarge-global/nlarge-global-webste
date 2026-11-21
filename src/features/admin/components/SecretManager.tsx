"use client";

import dynamic from "next/dynamic";
import { useEffect, useId, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { FiCheck, FiX } from "react-icons/fi";
import { toast } from "sonner";
import { Button } from "./ui/Button";
import { Select } from "@/components/ui/select";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";
import RecordActionsMenu from "./RecordActionsMenu";
import RecordBadge from "./RecordBadge";
import { useDialogEscape } from "./useDialogEscape";
import { getDisplayErrorMessage } from "@/lib/error-message";
import { showOptimisticRecoveryToast } from "./showOptimisticRecoveryToast";
import {
  formatDateTime,
  fromDateTimeLocal,
  toDateTimeLocal,
} from "@/features/admin/services/date-time";
import {
  deleteAdminRecord,
  restoreAdminRecord,
  type DeleteMode,
} from "./admin-delete";
import AdminListFilters from "./AdminListFilters";

type Secret = {
  _id: string;
  label: string;
  type: string;
  expiresAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
};
type SecretFormValues = {
  label: string;
  type: string;
  value: string;
  expiresAt: string | null;
};
const pageSize = 10;
const SecretDetailsDialog = dynamic(() => import("./SecretDetailsDialog"), {
  ssr: false,
  loading: () => (
    <div
      role="dialog"
      aria-modal="true"
      aria-busy="true"
      aria-label="Loading secret details"
      className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4"
    >
      <div className="w-full max-w-lg space-y-3 rounded-2xl bg-[#fffdfb] p-5 shadow-2xl">
        <div className="h-6 w-40 animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
        <div className="h-12 animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
      </div>
    </div>
  ),
});

function csrfHeaders(): Record<string, string> {
  const csrfToken = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("nlarge_admin_csrf="))
    ?.split("=")[1];
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = decodeURIComponent(csrfToken);
  return headers;
}

export default function SecretManager({
  clientId,
  projectId,
}: {
  clientId: string;
  projectId?: string;
}) {
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revealed, setRevealed] = useState("");
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [archive, setArchive] = useState("active");
  const [type, setType] = useState("");
  const [formSecret, setFormSecret] = useState<Secret | null | "new">(null);
  const [detailsTarget, setDetailsTarget] = useState<Secret | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Secret | null>(null);
  const [revealTarget, setRevealTarget] = useState<Secret | null>(null);
  const [revealPassword, setRevealPassword] = useState("");
  const [revealError, setRevealError] = useState("");
  const [copied, setCopied] = useState(false);
  const searchParams = useSearchParams();
  useEffect(() => {
    setArchive(
      searchParams.get("archive") === "archived" ||
        searchParams.get("archive") === "all"
        ? searchParams.get("archive")!
        : "active",
    );
    setType(searchParams.get("type") ?? "");
  }, [searchParams]);
  const isExpandedSecret =
    revealTarget?.type === "recovery-codes" ||
    revealTarget?.type === "environment-file" ||
    revealTarget?.type === "other";
  const revealDialogRef = useDialogEscape(Boolean(revealTarget), () =>
    setRevealTarget(null),
  );

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError("");
    fetch(
      `/api/admin/clients/${clientId}/secrets?${new URLSearchParams({ ...(projectId ? { projectId } : {}), ...(type ? { type } : {}), archive, page: String(page), limit: String(pageSize) })}`,
      { signal: controller.signal },
    )
      .then(async (response) => {
        const result = (await response.json()) as {
          secrets?: Secret[];
          pagination?: { total: number };
          error?: string;
        };
        if (response.ok) {
          setSecrets(result.secrets ?? []);
          setTotal(result.pagination?.total ?? 0);
        } else setError(result.error ?? "Unable to load secrets.");
      })
      .catch(() => {
        if (!controller.signal.aborted) setError("Unable to load secrets.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [clientId, projectId, page, archive, type]);

  async function saveSecret(values: SecretFormValues) {
    const editing = formSecret && formSecret !== "new" ? formSecret : null;
    const previousSecrets = secrets;
    const temporaryId = editing ? null : `optimistic-${crypto.randomUUID()}`;
    if (editing) {
      setSecrets((current) =>
        current.map((secret) =>
          secret._id === editing._id
            ? {
                ...secret,
                label: values.label,
                type: values.type,
                expiresAt: values.expiresAt,
                updatedAt: new Date().toISOString(),
              }
            : secret,
        ),
      );
    } else {
      setSecrets((current) => [
        {
          _id: temporaryId!,
          label: values.label,
          type: values.type,
          expiresAt: values.expiresAt,
          createdAt: new Date().toISOString(),
        },
        ...current,
      ]);
      setTotal((current) => current + 1);
    }
    try {
      const response = await fetch(
        editing
          ? `/api/admin/clients/${clientId}/secrets/${editing._id}`
          : `/api/admin/clients/${clientId}/secrets`,
        {
          method: editing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            ...csrfHeaders(),
          },
          body: JSON.stringify({
            ...values,
            value: editing && !values.value ? undefined : values.value,
            ...(editing ? {} : { projectId }),
          }),
        },
      );
      const result = (await response.json()) as {
        secret?: Secret;
        error?: string;
      };
      if (!response.ok || !result.secret)
        throw new Error(result.error ?? "Unable to save secret.");
      setSecrets((current) =>
        editing
          ? current.map((secret) =>
              secret._id === editing._id ? result.secret! : secret,
            )
          : current.map((secret) =>
              secret._id === temporaryId ? result.secret! : secret,
            ),
      );
      toast.success(editing ? "Secret updated." : "Secret added.");
      setError("");
      setFormSecret(null);
      if (!editing) setPage(1);
      return null;
    } catch (reason) {
      setSecrets(previousSecrets);
      if (!editing) setTotal((current) => Math.max(0, current - 1));
      const message = getDisplayErrorMessage(reason, "Unable to save secret.");
      return message;
    }
  }

  async function remove(secretId: string, mode: DeleteMode) {
    const previousSecrets = secrets;
    const index = secrets.findIndex((secret) => secret._id === secretId);
    setSecrets((current) =>
      current.filter((secret) => secret._id !== secretId),
    );
    setTotal((current) => Math.max(0, current - 1));
    try {
      await deleteAdminRecord(
        `/api/admin/clients/${clientId}/secrets/${secretId}`,
        secretId,
        mode,
        "Unable to delete secret.",
      );
      toast.success(
        mode === "permanent"
          ? "Secret permanently deleted."
          : "Secret archived.",
      );
      const nextTotal = Math.max(0, total - 1);
      const nextPage = Math.min(
        page,
        Math.max(1, Math.ceil(nextTotal / pageSize)),
      );
      setPage(nextPage);
    } catch (reason) {
      setSecrets((current) => {
        const restored = [...current];
        const previous = previousSecrets[index];
        if (previous) restored.splice(Math.max(0, index), 0, previous);
        return restored;
      });
      setTotal((current) => current + 1);
      const message = getDisplayErrorMessage(
        reason,
        "Unable to delete secret.",
      );
      throw new Error(message);
    }
  }

  async function restore(secret: Secret) {
    try {
      await restoreAdminRecord(
        `/api/admin/clients/${clientId}/secrets/${secret._id}`,
        secret._id,
        "Unable to restore secret.",
      );
      if (archive === "archived") {
        setSecrets((current) =>
          current.filter((item) => item._id !== secret._id),
        );
        const nextTotal = Math.max(0, total - 1);
        setTotal(nextTotal);
        const nextPage = Math.min(
          page,
          Math.max(1, Math.ceil(nextTotal / pageSize)),
        );
        if (nextPage !== page) setPage(nextPage);
      } else {
        setSecrets((current) =>
          current.map((item) =>
            item._id === secret._id ? { ...item, deletedAt: undefined } : item,
          ),
        );
      }
      toast.success("Secret restored.");
    } catch (reason) {
      toast.error(getDisplayErrorMessage(reason, "Unable to restore secret."));
    }
  }

  async function reveal(secretId: string, password: string) {
    const csrfToken = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith("nlarge_admin_csrf="))
      ?.split("=")[1];
    const response = await fetch(
      `/api/admin/clients/${clientId}/secrets/${secretId}/reveal`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken
            ? { "x-csrf-token": decodeURIComponent(csrfToken) }
            : {}),
        },
        body: JSON.stringify({ password }),
      },
    );
    const result = (await response.json()) as {
      value?: string;
      error?: string;
    };
    if (!response.ok)
      setRevealError(result.error ?? "Unable to reveal secret.");
    else {
      setRevealed(result.value ?? "");
      setCopied(false);
      setRevealError("");
      setError("");
    }
  }

  async function showDetails(secret: Secret) {
    setDetailsTarget(secret);
    setDetailsLoading(true);
    try {
      const response = await fetch(
        `/api/admin/clients/${clientId}/secrets/${secret._id}`,
      );
      const result = (await response.json()) as {
        secret?: Secret;
        error?: string;
      };
      if (!response.ok || !result.secret) {
        throw new Error(result.error ?? "Unable to load secret details.");
      }
      setDetailsTarget(result.secret);
    } catch (reason) {
      setDetailsTarget(null);
      toast.error(
        getDisplayErrorMessage(reason, "Unable to load secret details."),
      );
    } finally {
      setDetailsLoading(false);
    }
  }

  async function copyRevealedSecret() {
    try {
      await navigator.clipboard.writeText(revealed);
      setCopied(true);
    } catch (error) {
      setRevealError(
        getDisplayErrorMessage(
          error,
          "Could not copy the secret. Check your browser clipboard permissions.",
        ),
      );
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-black/10 bg-white p-5">
      <div className="flex flex-col sm:flex-row sm:items-center items-start justify-between gap-3">
        <div>
          <div className="flex gap-3">
            <h2 className="font-semibold">Encrypted secrets</h2>
            {isLoading ? (
              <span
                aria-hidden="true"
                className="size-6 animate-pulse rounded-full bg-black/10 motion-reduce:animate-none"
              />
            ) : (
              <span className="rounded-full bg-[#f5f3f0] size-6 text-xs font-semibold flex items-center justify-center">
                {total}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-black/50">
            Values stay masked until re-authentication.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-end justify-end gap-3">
          <AdminListFilters
            fields={[
              {
                name: "archive",
                label: "Records",
                value: archive,
                options: [
                  { value: "active", label: "Active" },
                  { value: "archived", label: "Archived" },
                  { value: "all", label: "All records" },
                ],
              },
              {
                name: "type",
                label: "Secret type",
                value: type,
                options: [
                  { value: "", label: "All types" },
                  { value: "username-password", label: "Username password" },
                  { value: "api-key", label: "API key" },
                  { value: "token", label: "Token" },
                  { value: "connection-string", label: "Connection string" },
                  { value: "environment-file", label: "Environment file" },
                  { value: "certificate", label: "Certificate" },
                  { value: "recovery-codes", label: "Recovery codes" },
                  { value: "other", label: "Other" },
                ],
              },
            ]}
          />
        </div>
      </div>
      <div
        aria-busy={isLoading}
        aria-label="Secrets"
        className="mt-4 space-y-3"
        role={isLoading ? "status" : undefined}
      >
        {isLoading ? (
          <>
            <span className="sr-only">Loading secrets</span>
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                aria-hidden="true"
                className="flex items-center justify-between gap-3 py-4"
              >
                <div className="w-full space-y-2">
                  <div className="h-5 w-2/5 animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
                  <div className="h-3 w-1/4 animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
                </div>
                <div className="h-9 w-36 shrink-0 animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
              </div>
            ))}
          </>
        ) : (
          <>
            {secrets.length === 0 && !error && (
              <p className="py-4 text-sm text-black/50">No secrets stored.</p>
            )}
            {secrets.map((secret) => (
              <div
                key={secret._id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 bg-[#fffdfb] px-4 py-4 shadow-sm transition-colors hover:border-[#602329]/25"
              >
                <div className="min-w-0">
                  <p className="font-medium">{secret.label}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <RecordBadge status="low" label={secret.type} />
                    {secret.expiresAt ? (
                      <RecordBadge
                        status={
                          new Date(secret.expiresAt).getTime() <= Date.now()
                            ? "due-overdue"
                            : "due-later"
                        }
                        label={`Expires ${formatDateTime(secret.expiresAt)}`}
                      />
                    ) : (
                      <span className="text-xs text-black/50">No expiry</span>
                    )}
                  </div>
                </div>
                {secret._id.startsWith("optimistic-") ? (
                  <span role="status" className="text-xs text-[#602329]">
                    Saving…
                  </span>
                ) : (
                  <RecordActionsMenu
                    label={`secret ${secret.label}`}
                    reveal={{
                      onSelect: () => {
                        setRevealTarget(secret);
                        setRevealError("");
                        setRevealed("");
                      },
                    }}
                    details={{ onSelect: () => void showDetails(secret) }}
                    edit={{ onSelect: () => setFormSecret(secret) }}
                    restore={
                      secret.deletedAt
                        ? { onSelect: () => void restore(secret) }
                        : undefined
                    }
                    delete={{ onSelect: () => setDeleteTarget(secret) }}
                  />
                )}
              </div>
            ))}
          </>
        )}
      </div>
      {total > pageSize && (
        <div className="mt-4 flex items-center justify-between border-t border-black/10 pt-4 text-sm">
          <span>Page {page}</span>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((value) => value - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={page * pageSize >= total}
              onClick={() => setPage((value) => value + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
      <div className="mt-2">
        <Button type="button" onClick={() => setFormSecret("new")}>
          Add secret
        </Button>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-[#602329]">
          {error}
        </p>
      )}
      {formSecret && (
        <SecretFormDialog
          secret={formSecret === "new" ? undefined : formSecret}
          onSubmit={saveSecret}
          onClose={() => setFormSecret(null)}
        />
      )}
      {detailsTarget && (
        <SecretDetailsDialog
          secret={detailsTarget}
          loading={detailsLoading}
          onClose={() => setDetailsTarget(null)}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmationDialog
          label={`Delete ${deleteTarget.label}`}
          description="Delete this encrypted secret from active records."
          onConfirm={(mode) => remove(deleteTarget._id, mode)}
          modeOptions={deleteTarget.deletedAt ? "permanent-only" : "soft-and-permanent"}
          onRecovery={() => setDeleteTarget(deleteTarget)}
          open
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
          trigger={null}
        />
      )}
      {revealTarget && (
        <div
          ref={revealDialogRef}
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reveal-secret-title"
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void reveal(revealTarget._id, revealPassword);
            }}
            className={`max-h-[90dvh] w-full overflow-y-auto rounded-2xl bg-[#fffdfb] p-5 shadow-2xl ${
              revealed && isExpandedSecret ? "max-w-5xl" : "max-w-lg"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id="reveal-secret-title" className="text-xl font-semibold">
                {revealed ? "Revealed secret" : "Re-authenticate to reveal"}
              </h2>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close reveal secret dialog"
                onClick={() => setRevealTarget(null)}
              >
                <FiX aria-hidden="true" />
              </Button>
            </div>
            {revealed ? (
              <>
                <SecretCodeBlock
                  label={revealTarget.label}
                  value={revealed}
                  isEnvironmentFile={revealTarget.type === "environment-file"}
                  isExpanded={isExpandedSecret}
                  copied={copied}
                  onCopy={() => void copyRevealedSecret()}
                />
                {revealError && (
                  <p role="alert" className="mt-3 text-sm text-[#602329]">
                    {revealError}
                  </p>
                )}
                <div className="mt-5 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRevealTarget(null)}
                  >
                    Close
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm text-black/60">
                  Enter your admin password to reveal this value.
                </p>
                <label className="mt-4 block text-sm font-medium">
                  Admin password
                  <input
                    type="password"
                    autoFocus
                    required
                    maxLength={72}
                    value={revealPassword}
                    onChange={(event) => setRevealPassword(event.target.value)}
                    className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3"
                  />
                </label>
                {revealError && (
                  <p role="alert" className="mt-3 text-sm text-[#602329]">
                    {revealError}
                  </p>
                )}
                <div className="mt-5 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRevealTarget(null)}
                  >
                    Close
                  </Button>
                  <Button type="submit">Reveal secret</Button>
                </div>
              </>
            )}
          </form>
        </div>
      )}
    </section>
  );
}

function SecretCodeBlock({
  label,
  value,
  isEnvironmentFile,
  isExpanded,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  isEnvironmentFile: boolean;
  isExpanded: boolean;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <section className="mt-4 overflow-hidden rounded-xl border border-[#343a40] bg-[#1f2329]">
      <header className="flex items-center justify-between gap-3 border-b border-white/10 bg-[#292e35] px-4 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{label}</p>
          <p className="text-xs text-white/60">
            {isEnvironmentFile ? "Environment file" : "Secret value"}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          aria-label={copied ? "Secret copied" : "Copy secret"}
          onClick={onCopy}
          className="shrink-0 border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
        >
          {copied && <FiCheck aria-hidden="true" />}
          {copied ? "Copied" : "Copy"}
        </Button>
        <span className="sr-only" aria-live="polite" aria-atomic="true">
          {copied ? "Secret copied to clipboard." : ""}
        </span>
      </header>
      <pre
        aria-label={`${isEnvironmentFile ? "Environment file" : "Secret"} contents`}
        className={`overflow-auto p-4 font-mono text-sm leading-6 text-slate-100 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#d6b36a] ${
          isExpanded ? "max-h-[60dvh]" : "max-h-80"
        }`}
        dir="ltr"
        tabIndex={0}
      >
        <code>
          {value.split("\n").map((line, index) => {
            const assignment = isEnvironmentFile
              ? line.match(/^(\s*(?:export\s+)?[A-Za-z_][A-Za-z0-9_]*)(=)(.*)$/)
              : null;
            const isComment = isEnvironmentFile && /^\s*#/.test(line);

            return (
              <span
                key={index}
                className="grid min-w-max grid-cols-[2.5rem_1fr]"
              >
                <span
                  aria-hidden="true"
                  className="select-none pr-4 text-right text-slate-500"
                >
                  {index + 1}
                </span>
                <span className="whitespace-pre">
                  {isComment ? (
                    <span className="text-slate-400">{line || " "}</span>
                  ) : assignment ? (
                    <>
                      <span className="text-sky-300">{assignment[1]}</span>
                      <span className="text-slate-400">{assignment[2]}</span>
                      <span className="text-emerald-200">{assignment[3]}</span>
                    </>
                  ) : (
                    line || " "
                  )}
                </span>
              </span>
            );
          })}
        </code>
      </pre>
    </section>
  );
}

function SecretFormDialog({
  secret,
  onSubmit,
  onClose,
}: {
  secret?: Secret;
  onSubmit: (values: SecretFormValues) => Promise<string | null>;
  onClose: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(true);
  const titleId = useId();
  const dialogRef = useDialogEscape(visible, onClose, pending);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    setVisible(false);
    try {
      const message = await onSubmit({
        label: String(formData.get("label") ?? "").trim(),
        type: String(formData.get("type") ?? "other"),
        value: String(formData.get("value") ?? ""),
        expiresAt: fromDateTimeLocal(formData.get("expiresAt")),
      });
      if (message) {
        showOptimisticRecoveryToast(message, () => setVisible(true));
      }
    } finally {
      setPending(false);
    }
  }
  return (
    <div
      ref={dialogRef}
      onClick={(event) => event.stopPropagation()}
      className={`fixed inset-0 z-50 place-items-center bg-black/40 p-4 ${visible ? "grid" : "hidden"}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <form
        onSubmit={submit}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[90dvh] w-full max-w-lg space-y-3 overflow-y-auto rounded-2xl bg-[#fffdfb] p-5 shadow-2xl"
      >
        <h2 id={titleId} className="text-xl font-semibold">
          {secret ? "Edit secret" : "Add secret"}
        </h2>
        <label className="block text-sm font-medium">
          Label
          <input
            name="label"
            required
            maxLength={150}
            defaultValue={secret?.label}
            className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3"
          />
        </label>
        <label className="block text-sm font-medium">
          Type
          <Select name="type" defaultValue={secret?.type ?? "other"}>
            <option value="username-password">Username/password</option>
            <option value="api-key">API key</option>
            <option value="token">Token</option>
            <option value="connection-string">Connection string</option>
            <option value="environment-file">Environment file</option>
            <option value="certificate">Certificate/private key</option>
            <option value="recovery-codes">Recovery codes</option>
            <option value="other">Other</option>
          </Select>
        </label>
        <label className="block text-sm font-medium">
          Secret value
          <textarea
            name="value"
            required={!secret}
            maxLength={100_000}
            rows={4}
            placeholder={
              secret ? "Leave blank to keep the current value" : undefined
            }
            aria-describedby={secret ? `${titleId}-value-hint` : undefined}
            className="mt-2 w-full rounded-xl border border-black/15 p-3"
          />
          {secret && (
            <span
              id={`${titleId}-value-hint`}
              className="mt-1 block text-xs text-black/55"
            >
              Leave this empty to keep the existing encrypted value.
            </span>
          )}
        </label>
        <label className="block text-sm font-medium">
          Expires at
          <input
            name="expiresAt"
            type="datetime-local"
            step="60"
            defaultValue={toDateTimeLocal(secret?.expiresAt)}
            className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3"
          />
          <span className="mt-1 block text-xs text-black/55">
            Leave blank for no expiry.
          </span>
        </label>
        {error && (
          <p role="alert" className="text-sm text-[#602329]">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending
              ? "Saving..."
              : secret
                ? "Save changes"
                : "Encrypt and save"}
          </Button>
        </div>
      </form>
    </div>
  );
}
