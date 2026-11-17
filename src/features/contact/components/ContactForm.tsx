"use client";

import Footer from "@/components/layout/Footer";
import Navigation from "@/components/layout/Navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { FiArrowUpRight } from "react-icons/fi";

import {
  contactSchema,
  type ContactFormData,
  type ContactFormInput,
} from "@/features/contact/schemas/contact";

const queryTypes = [
  {
    value: "business",
    label: "Discuss a project",
    email: "info@nlargecorp.com",
  },
  { value: "general", label: "General inquiry", email: "info@nlargecorp.com" },
  {
    value: "support",
    label: "Technical support",
    email: "support@nlargecorp.com",
  },
  {
    value: "privacy",
    label: "Privacy or data request",
    email: "support@nlargecorp.com",
  },
];

export default function ContactForm({
  privacyPolicyVersion,
  privacyPolicyHash,
  privacyAcknowledgement,
  marketingConsentText,
  marketingConsentVersion,
}: {
  privacyPolicyVersion: string;
  privacyPolicyHash: string;
  privacyAcknowledgement: { text: string; href?: string }[];
  marketingConsentText: string;
  marketingConsentVersion: string;
}) {
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error" | "stale"
  >("idle");
  const submissionRef = useRef<{ key: string; payload: string } | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    reset,
  } = useForm<ContactFormInput, unknown, ContactFormData>({
    resolver: zodResolver(contactSchema),
    mode: "onChange",
    defaultValues: { marketingConsent: false },
  });

  const onSubmit = async (data: ContactFormData) => {
    setSubmitStatus("idle");
    const submission = {
      ...data,
      privacyPolicyVersion,
      privacyPolicyHash,
      marketingConsentVersion,
    };
    const payload = JSON.stringify(submission);
    if (submissionRef.current?.payload !== payload) {
      submissionRef.current = { key: crypto.randomUUID(), payload };
    }
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": submissionRef.current.key,
        },
        body: payload,
      });
      const result = await response.json();
      if (response.status === 409) {
        setSubmitStatus("stale");
        return;
      }
      if (!response.ok)
        throw new Error(result.error || "Failed to save inquiry");
      submissionRef.current = null;
      setSubmitStatus("success");
      reset();
    } catch (error) {
      console.error("Contact form error:", error);
      setSubmitStatus("error");
    }
  };
  const fieldClass =
    "w-full border-0 border-b border-black/20 bg-transparent px-0 py-4 text-base outline-none transition-colors placeholder:text-black/60 focus:border-[#602329] focus:ring-0";

  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation />
      <main id="main-content">
        <section className="px-4 pb-8 pt-28 sm:px-8 sm:pt-32 lg:px-12 lg:pb-12">
          <div className="grid min-h-[calc(100svh-10rem)] overflow-hidden rounded-[1.75rem] bg-[#602329] lg:grid-cols-[0.82fr_1.18fr]">
            <div className="flex flex-col justify-between px-6 py-8 text-white sm:px-10 lg:px-12 lg:py-12">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                Start a conversation
              </p>
              <div>
                <h1 className="max-w-[8ch] text-[3.5rem] lg:text-[clamp(4rem,9vw,8rem)] leading-[0.84] tracking-[-0.055em] mt-5">
                  Let’s build what’s next.
                </h1>
                <p className="mt-7 max-w-md text-lg leading-8 text-white/70">
                  Whether you have a project in mind, need support, or have a
                  general question, tell us how we can help.
                </p>
              </div>
              <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {queryTypes.map((type) => (
                  <a
                    key={type.value}
                    href={`mailto:${type.email}`}
                    className="border-t border-white/25 pt-4 text-sm"
                  >
                    <span className="block text-white/75">{type.label}</span>
                    <span className="mt-1 block font-semibold">
                      {type.email}
                    </span>
                  </a>
                ))}
              </div>
            </div>

            <div className="bg-[#f1efea] px-6 py-8 sm:px-10 lg:px-12 lg:py-12">
              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="grid gap-8 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="text-sm font-semibold">
                      Your name
                    </label>
                    <input
                      id="name"
                      autoComplete="name"
                      placeholder="Jane Smith"
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={errors.name ? "name-error" : undefined}
                      {...register("name")}
                      className={fieldClass}
                    />
                    {errors.name && (
                      <p
                        id="name-error"
                        className="mt-2 text-sm text-[#602329]"
                        role="alert"
                      >
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="email" className="text-sm font-semibold">
                      Email address
                    </label>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="jane@company.com"
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={
                        errors.email ? "email-error" : undefined
                      }
                      {...register("email")}
                      className={fieldClass}
                    />
                    {errors.email && (
                      <p
                        id="email-error"
                        className="mt-2 text-sm text-[#602329]"
                        role="alert"
                      >
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-8 grid gap-8 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="queryType"
                      className="text-sm font-semibold"
                    >
                      What can we help with?
                    </label>
                    <select
                      id="queryType"
                      aria-invalid={Boolean(errors.queryType)}
                      aria-describedby={
                        errors.queryType ? "queryType-error" : undefined
                      }
                      {...register("queryType")}
                      className={`${fieldClass} cursor-pointer`}
                    >
                      <option value="">Select one</option>
                      {queryTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    {errors.queryType && (
                      <p
                        id="queryType-error"
                        className="mt-2 text-sm text-[#602329]"
                        role="alert"
                      >
                        {errors.queryType.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="subject" className="text-sm font-semibold">
                      Subject
                    </label>
                    <input
                      id="subject"
                      placeholder="A short summary"
                      aria-invalid={Boolean(errors.subject)}
                      aria-describedby={
                        errors.subject ? "subject-error" : undefined
                      }
                      {...register("subject")}
                      className={fieldClass}
                    />
                    {errors.subject && (
                      <p
                        id="subject-error"
                        className="mt-2 text-sm text-[#602329]"
                        role="alert"
                      >
                        {errors.subject.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-8">
                  <label htmlFor="message" className="text-sm font-semibold">
                    Your message
                  </label>
                  <textarea
                    id="message"
                    rows={6}
                    placeholder="What would you like to ask or tell us?"
                    aria-invalid={Boolean(errors.message)}
                    aria-describedby={
                      errors.message ? "message-error" : undefined
                    }
                    {...register("message")}
                    className={`${fieldClass} resize-none`}
                  />
                  {errors.message && (
                    <p
                      id="message-error"
                      className="mt-2 text-sm text-[#602329]"
                      role="alert"
                    >
                      {errors.message.message}
                    </p>
                  )}
                </div>

                <div className="mt-8 space-y-5">
                  <div>
                    <label className="flex cursor-pointer items-start gap-4 rounded-xl border border-black/15 bg-white/70 p-4 text-sm leading-6 text-black/75 transition-colors hover:border-[#602329]/50 has-[:checked]:border-[#602329] has-[:checked]:bg-[#602329]/[0.04]">
                      <input
                        type="checkbox"
                        required
                        className="mt-1 size-5 shrink-0 cursor-pointer accent-[#602329] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#602329]"
                        aria-invalid={Boolean(errors.privacyAcknowledgement)}
                        aria-describedby={
                          errors.privacyAcknowledgement
                            ? "privacy-acknowledgement-error"
                            : undefined
                        }
                        {...register("privacyAcknowledgement")}
                      />
                      <span>
                        <span className="ml-1 text-xl font-semibold uppercase tracking-wide text-[#602329]">
                          *
                        </span>
                        {privacyAcknowledgement.map((segment, index) =>
                          segment.href ? (
                            <a
                              key={`${segment.href}-${index}`}
                              href={segment.href}
                              className="font-semibold text-[#602329] underline underline-offset-4"
                            >
                              {segment.text}
                            </a>
                          ) : (
                            <span key={index}>{segment.text}</span>
                          ),
                        )}
                      </span>
                    </label>
                    {errors.privacyAcknowledgement && (
                      <p
                        id="privacy-acknowledgement-error"
                        className="mt-2 text-sm text-[#602329]"
                        role="alert"
                      >
                        {errors.privacyAcknowledgement.message}
                      </p>
                    )}
                  </div>
                  <label className="flex cursor-pointer items-start gap-4 rounded-xl border border-black/15 bg-white/70 p-4 text-sm leading-6 text-black/75 transition-colors hover:border-[#602329]/50 has-[:checked]:border-[#602329] has-[:checked]:bg-[#602329]/[0.04]">
                    <input
                      type="checkbox"
                      className="mt-1 size-5 shrink-0 cursor-pointer accent-[#602329] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#602329]"
                      {...register("marketingConsent")}
                    />
                    <span>{marketingConsentText}</span>
                  </label>
                  <p className="mt-3 text-sm leading-6 text-black/65">
                    Submitting this form saves your inquiry in our Admin
                    dashboard; it does not send an email. See our{" "}
                    <a
                      href="/terms-of-service"
                      className="font-semibold text-[#602329] underline underline-offset-4"
                    >
                      Terms of Service
                    </a>{" "}
                    or visit{" "}
                    <a
                      href="/support"
                      className="font-semibold text-[#602329] underline underline-offset-4"
                    >
                      Support
                    </a>{" "}
                    to email us or submit a privacy request.
                  </p>
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-5">
                  <button
                    type="submit"
                    disabled={!isValid || isSubmitting}
                    className="group inline-flex items-center gap-8 rounded-full bg-[#602329] py-4 pl-6 pr-4 text-sm font-semibold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:bg-[#d7d4cf] disabled:text-black/70 disabled:hover:bg-[#d7d4cf]"
                  >
                    {isSubmitting ? "Submitting…" : "Submit inquiry"}
                    <span className="grid size-9 place-items-center rounded-full bg-white text-[#602329] transition-transform group-hover:rotate-45 group-disabled:bg-white/70 group-disabled:text-black/40">
                      <FiArrowUpRight aria-hidden="true" />
                    </span>
                  </button>
                  {!isValid && (
                    <p className="text-sm text-black/60">
                      Complete the required fields and acknowledge the Privacy
                      Policy to send.
                    </p>
                  )}
                  {submitStatus === "success" && (
                    <p
                      className="text-sm font-semibold text-[#602329]"
                      role="status"
                    >
                      Your inquiry has been saved in our Admin dashboard. No
                      email was sent.
                    </p>
                  )}
                  {submitStatus === "error" && (
                    <p
                      className="text-sm font-semibold text-[#602329]"
                      role="alert"
                    >
                      Something went wrong. Please try again.
                    </p>
                  )}
                  {submitStatus === "stale" && (
                    <p
                      className="text-sm font-semibold text-[#602329]"
                      role="alert"
                    >
                      The policy or consent wording has changed. Reload this
                      page to review the current wording, then submit again.
                    </p>
                  )}
                </div>
              </form>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
