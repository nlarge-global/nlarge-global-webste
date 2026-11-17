"use client";
import { getDisplayErrorMessage } from "@/lib/error-message";

import { FormEvent, useEffect, useState } from "react";
import { FiCheck, FiX } from "react-icons/fi";
import { Button } from "./ui/Button";
import { Select } from "@/components/ui/select";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";
import { useDialogEscape } from "./useDialogEscape";

type Secret = { _id: string; label: string; type: string; expiresAt?: string };
const pageSize = 10;

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
  const [editing, setEditing] = useState<Secret | null>(null);
  const [revealTarget, setRevealTarget] = useState<Secret | null>(null);
  const [revealPassword, setRevealPassword] = useState("");
  const [revealError, setRevealError] = useState("");
  const [copied, setCopied] = useState(false);
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
      `/api/admin/clients/${clientId}/secrets?${new URLSearchParams({ ...(projectId ? { projectId } : {}), page: String(page), limit: String(pageSize) })}`,
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
  }, [clientId, projectId, page]);

  async function createSecret(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const csrfToken = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith("nlarge_admin_csrf="))
      ?.split("=")[1];
    const response = await fetch(`/api/admin/clients/${clientId}/secrets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken ? { "x-csrf-token": decodeURIComponent(csrfToken) } : {}),
      },
      body: JSON.stringify({
        label: form.get("label"),
        type: form.get("type"),
        value: form.get("value"),
        expiresAt: form.get("expiresAt") || undefined,
        projectId,
      }),
    });
    const result = (await response.json()) as {
      secret?: Secret;
      error?: string;
    };
    if (!response.ok || !result.secret)
      setError(result.error ?? "Unable to save secret.");
    else {
      setSecrets((current) => [result.secret!, ...current]);
      formElement.reset();
      setError("");
    }
  }

  async function remove(secretId: string) {
    if (!window.confirm("Delete this secret permanently?")) return;
    const csrfToken = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith("nlarge_admin_csrf="))
      ?.split("=")[1];
    const response = await fetch(
      `/api/admin/clients/${clientId}/secrets/${secretId}`,
      {
        method: "DELETE",
        headers: {
          "x-confirm-delete": secretId,
          ...(csrfToken
            ? { "x-csrf-token": decodeURIComponent(csrfToken) }
            : {}),
        },
      },
    );
    if (!response.ok) {
      const result = (await response.json()) as { error?: string };
      setError(result.error ?? "Unable to delete secret.");
      return;
    }
    setSecrets((current) =>
      current.filter((secret) => secret._id !== secretId),
    );
  }

  const load = () => {
    setIsLoading(true);
    setError("");
    return fetch(
      `/api/admin/clients/${clientId}/secrets?${new URLSearchParams({ ...(projectId ? { projectId } : {}), page: String(page), limit: String(pageSize) })}`,
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
      .catch(() => setError("Unable to load secrets."))
      .finally(() => setIsLoading(false));
  };

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
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Encrypted secrets</h2>
          <p className="mt-1 text-sm text-black/50">
            Values stay masked until re-authentication.
          </p>
        </div>
        {isLoading ? (
          <span
            aria-hidden="true"
            className="h-6 w-8 animate-pulse rounded-full bg-black/10 motion-reduce:animate-none"
          />
        ) : (
          <span className="rounded-full bg-[#f5f3f0] px-3 py-1 text-xs font-semibold">
            {secrets.length}
          </span>
        )}
      </div>
      <div
        aria-busy={isLoading}
        aria-label="Secrets"
        className="mt-4 divide-y divide-black/10"
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
                className="flex flex-wrap items-center justify-between gap-3 py-4"
              >
                <div>
                  <p className="font-medium">{secret.label}</p>
                  <p className="mt-1 text-xs capitalize text-black/50">
                    {secret.type.replaceAll("-", " ")}
                    {secret.expiresAt
                      ? ` · expires ${new Date(secret.expiresAt).toLocaleDateString()}`
                      : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => {
                      setRevealTarget(secret);
                      setRevealError("");
                      setRevealed("");
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Reveal
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setEditing(secret)}
                    variant="outline"
                    size="sm"
                  >
                    Edit
                  </Button>
                  <DeleteConfirmationDialog
                    label={`Delete ${secret.label}`}
                    description="Archive this encrypted secret from active records."
                    onConfirm={() => remove(secret._id)}
                  />
                </div>
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
      <div className="mt-5 border-t border-black/10 pt-5">
        <SecretCreateDialog onSubmit={createSecret} />
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-[#602329]">
          {error}
        </p>
      )}
      {editing && (
        <SecretEditDialog
          secret={editing}
          clientId={clientId}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void load();
          }}
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
                <input
                  type="password"
                  autoFocus
                  required
                  maxLength={72}
                  value={revealPassword}
                  onChange={(event) => setRevealPassword(event.target.value)}
                  className="mt-4 min-h-11 w-full rounded-xl border border-black/15 px-3"
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
              <span key={index} className="grid min-w-max grid-cols-[2.5rem_1fr]">
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

function SecretCreateDialog({
  onSubmit,
}: {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const [open, setOpen] = useState(false);
  const dialogRef = useDialogEscape(open, () => setOpen(false));
  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        Add secret
      </Button>
      {open && (
        <div
          ref={dialogRef}
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-secret-title"
        >
          <form
            onSubmit={(event) => {
              onSubmit(event);
              setOpen(false);
            }}
            className="w-full max-w-lg rounded-2xl bg-[#fffdfb] p-5 shadow-2xl"
          >
            <h2 id="add-secret-title" className="text-xl font-semibold">
              Add secret
            </h2>
            <label className="mt-4 block text-sm font-medium">
              Label
              <input
                name="label"
                required
                className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3"
              />
            </label>
            <label className="mt-3 block text-sm font-medium">
              Type
              <Select name="type" defaultValue="other">
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
            <label className="mt-3 block text-sm font-medium">
              Secret value
              <textarea
                name="value"
                required
                rows={4}
                className="mt-2 w-full rounded-xl border border-black/15 p-3"
              />
            </label>
            <label className="mt-3 block text-sm font-medium">
              Expires at
              <input
                name="expiresAt"
                type="date"
                className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3"
              />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Encrypt and save</Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function SecretEditDialog({
  secret,
  clientId,
  onClose,
  onSaved,
}: {
  secret: Secret;
  clientId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const dialogRef = useDialogEscape(true, onClose);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(
      new FormData(event.currentTarget).entries(),
    );
    const csrfToken = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith("nlarge_admin_csrf="))
      ?.split("=")[1];
    const response = await fetch(
      `/api/admin/clients/${clientId}/secrets/${secret._id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken
            ? { "x-csrf-token": decodeURIComponent(csrfToken) }
            : {}),
        },
        body: JSON.stringify(data),
      },
    );
    if (response.ok) onSaved();
  }
  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={submit}
        className="w-full max-w-lg rounded-2xl bg-[#fffdfb] p-5 shadow-2xl"
      >
        <h2 className="text-xl font-semibold">Edit secret</h2>
        <input
          name="label"
          required
          defaultValue={secret.label}
          className="mt-4 min-h-11 w-full rounded-xl border border-black/15 px-3"
        />
        <select
          name="type"
          defaultValue={secret.type}
          className="mt-3 min-h-11 w-full rounded-xl border border-black/15 px-3"
        >
          <option value="api-key">API key</option>
          <option value="token">Token</option>
          <option value="other">Other</option>
        </select>
        <textarea
          name="value"
          placeholder="Leave blank to keep the current value"
          className="mt-3 w-full rounded-xl border border-black/15 p-3"
        />
        <input
          name="expiresAt"
          type="date"
          defaultValue={secret.expiresAt?.slice(0, 10)}
          className="mt-3 min-h-11 w-full rounded-xl border border-black/15 px-3"
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save changes</Button>
        </div>
      </form>
    </div>
  );
}
