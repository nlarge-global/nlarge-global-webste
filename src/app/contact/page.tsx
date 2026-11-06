"use client";

import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FiArrowUpRight } from "react-icons/fi";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(50, "Name must be less than 50 characters"),
  email: z.string().email("Enter a valid email address"),
  queryType: z.string().min(1, "Select a query type"),
  subject: z.string().trim().min(5, "Add a subject").max(100, "Subject must be less than 100 characters"),
  message: z.string().trim().min(10, "Tell us a little more").max(1000, "Message must be less than 1000 characters"),
});

type ContactFormData = z.infer<typeof contactSchema>;

const queryTypes = [
  { value: "general", label: "General inquiry", email: "info@nlargecorp.com" },
  { value: "support", label: "Technical support", email: "support@nlargecorp.com" },
];

export default function ContactPage() {
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormData>({ resolver: zodResolver(contactSchema), mode: "onBlur" });

  const onSubmit = async (data: ContactFormData) => {
    setSubmitStatus("idle");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to send message");
      setSubmitStatus("success");
      reset();
    } catch (error) {
      console.error("Contact form error:", error);
      setSubmitStatus("error");
    }
  };

  const fieldClass = "w-full border-0 border-b border-black/20 bg-transparent px-0 py-4 text-base outline-none transition-colors placeholder:text-black/35 focus:border-[#602329] focus:ring-0";

  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation />
      <main id="main-content">
        <section className="px-4 pb-8 pt-28 sm:px-8 sm:pt-32 lg:px-12 lg:pb-12">
          <div className="grid min-h-[calc(100svh-10rem)] overflow-hidden rounded-[1.75rem] bg-[#602329] lg:grid-cols-[0.82fr_1.18fr]">
            <div className="flex flex-col justify-between px-6 py-8 text-white sm:px-10 lg:px-12 lg:py-12">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Start a conversation</p>
              <div>
                <h1 className="max-w-[8ch] text-[clamp(4rem,9vw,8rem)] leading-[0.84] tracking-[-0.055em]">Let’s build what’s next.</h1>
                <p className="mt-7 max-w-md text-lg leading-8 text-white/70">
                  Tell us where you are, where you want to go, and what needs to change.
                </p>
              </div>
              <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {queryTypes.map((type) => (
                  <a key={type.value} href={`mailto:${type.email}`} className="border-t border-white/25 pt-4 text-sm">
                    <span className="block text-white/55">{type.label}</span>
                    <span className="mt-1 block font-semibold">{type.email}</span>
                  </a>
                ))}
              </div>
            </div>

            <div className="bg-[#f1efea] px-6 py-8 sm:px-10 lg:px-12 lg:py-12">
              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="grid gap-x-8 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="text-sm font-semibold">Your name</label>
                    <input id="name" autoComplete="name" placeholder="Jane Smith" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "name-error" : undefined} {...register("name")} className={fieldClass} />
                    {errors.name && <p id="name-error" className="mt-2 text-sm text-[#602329]" role="alert">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="email" className="text-sm font-semibold">Email address</label>
                    <input id="email" type="email" autoComplete="email" placeholder="jane@company.com" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "email-error" : undefined} {...register("email")} className={fieldClass} />
                    {errors.email && <p id="email-error" className="mt-2 text-sm text-[#602329]" role="alert">{errors.email.message}</p>}
                  </div>
                </div>

                <div className="mt-8 grid gap-x-8 sm:grid-cols-2">
                  <div>
                    <label htmlFor="queryType" className="text-sm font-semibold">What can we help with?</label>
                      <select id="queryType" aria-invalid={Boolean(errors.queryType)} aria-describedby={errors.queryType ? "queryType-error" : undefined} {...register("queryType")} className={`${fieldClass} cursor-pointer`}>
                      <option value="">Select one</option>
                      {queryTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                    </select>
                    {errors.queryType && <p id="queryType-error" className="mt-2 text-sm text-[#602329]" role="alert">{errors.queryType.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="subject" className="text-sm font-semibold">Subject</label>
                    <input id="subject" placeholder="A short summary" aria-invalid={Boolean(errors.subject)} aria-describedby={errors.subject ? "subject-error" : undefined} {...register("subject")} className={fieldClass} />
                    {errors.subject && <p id="subject-error" className="mt-2 text-sm text-[#602329]" role="alert">{errors.subject.message}</p>}
                  </div>
                </div>

                <div className="mt-8">
                  <label htmlFor="message" className="text-sm font-semibold">Tell us about the project</label>
                  <textarea id="message" rows={6} placeholder="What are you trying to build or improve?" aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? "message-error" : undefined} {...register("message")} className={`${fieldClass} resize-none`} />
                  {errors.message && <p id="message-error" className="mt-2 text-sm text-[#602329]" role="alert">{errors.message.message}</p>}
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-5">
                  <button type="submit" disabled={isSubmitting} className="group inline-flex items-center gap-8 rounded-full bg-[#602329] py-4 pl-6 pr-4 text-sm font-semibold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60">
                    {isSubmitting ? "Sending…" : "Send inquiry"}
                    <span className="grid size-9 place-items-center rounded-full bg-white text-[#602329] transition-transform group-hover:rotate-45"><FiArrowUpRight aria-hidden="true" /></span>
                  </button>
                  {submitStatus === "success" && <p className="text-sm font-semibold text-[#602329]" role="status">Thanks—your message is on its way.</p>}
                  {submitStatus === "error" && <p className="text-sm font-semibold text-[#602329]" role="alert">Something went wrong. Please try again.</p>}
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
