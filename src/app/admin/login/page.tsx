"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiLock } from "react-icons/fi";
import { Button } from "@/features/admin/components/ui/Button";
import { BCRYPT_PASSWORD_MAX_BYTES } from "@/features/admin/auth/bcrypt-password";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [pending, setPending] = useState(false);
  const [fromShare, setFromShare] = useState(false);

  useEffect(() => {
    setFromShare(new URLSearchParams(window.location.search).get("share") === "signin");
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const emailField = event.currentTarget.elements.namedItem("email");
    if (!(emailField instanceof HTMLInputElement) || !emailField.checkValidity()) {
      setEmailError("Enter a valid email address.");
      return;
    }

    setEmailError("");
    setPending(true);
    const response = await fetch("/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: form.get("password") }),
    });
    const result = await response.json() as { error?: string };
    if (!response.ok) setError(result.error ?? "Unable to sign in.");
    else router.replace(fromShare ? "/admin/prospects?share=signin" : "/admin");
    setPending(false);
  }

  return (
    <div className="grid min-h-screen place-items-center px-4 py-8">
      <form onSubmit={submit} noValidate className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-6 shadow-[0_8px_24px_rgba(0,0,0,0.05)] sm:p-8">
        <div className="grid size-12 place-items-center rounded-xl bg-[#602329] text-white">
          <FiLock aria-hidden="true" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-[-0.04em]">Sign in to admin</h1>
        <p className="mt-2 text-sm leading-6 text-black/55">Use the configured administrator credentials. This session expires automatically.</p>
        {fromShare && <p role="status" className="mt-4 rounded-lg bg-[#f7efed] px-3 py-2 text-sm text-[#602329]">Sign in to save shared links. After signing in, share the link from your phone again.</p>}
        <label htmlFor="admin-email" className="mt-6 block text-sm font-medium">
          Email
          <input
            id="admin-email"
            name="email"
            type="email"
            required
            autoComplete="username"
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError ? "admin-email-error" : undefined}
            onChange={() => emailError && setEmailError("")}
            className={`mt-2 min-h-11 w-full rounded-xl border px-3 outline-none focus:border-[#602329] ${emailError ? "border-red-600 focus:border-red-600" : "border-black/15"}`}
          />
          {emailError && <p id="admin-email-error" role="alert" className="mt-2 text-sm font-normal text-red-700">{emailError}</p>}
        </label>
        <label htmlFor="admin-password" className="mt-4 block text-sm font-medium">
          Password
          <input id="admin-password" name="password" type="password" required maxLength={BCRYPT_PASSWORD_MAX_BYTES} autoComplete="current-password" className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3 outline-none focus:border-[#602329]" />
        </label>
        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
        <Button type="submit" disabled={pending} className="mt-6 w-full">
          {pending ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
