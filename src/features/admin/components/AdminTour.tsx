"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { FiArrowLeft, FiArrowRight, FiHelpCircle, FiX } from "react-icons/fi";

const TOUR_STORAGE_KEY = "nlarge-admin-tour-complete";
const TOUR_CHOICE_KEY = "nlarge-admin-tour-choice";

const tourSteps = [
  {
    title: "Your admin workspace",
    description: "Use this private workspace to review client work, communication, payments, documents, and system status.",
    target: "admin-main",
  },
  {
    title: "Move between work areas",
    description: "The sidebar keeps each operational area one tap away. It remains available through the menu on narrow screens.",
    target: "admin-navigation",
  },
  {
    title: "Start with the overview",
    description: "The Overview will bring together the most useful current signals without replacing the detailed pages.",
    target: "admin-overview",
  },
];

export default function AdminTour() {
  const [phase, setPhase] = useState<"closed" | "intro" | "tour">("closed");
  const [showReminder, setShowReminder] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const [step, setStep] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPortalReady(true);
    const choice = window.localStorage.getItem(TOUR_CHOICE_KEY);
    if (choice !== "accepted" && choice !== "declined" && window.localStorage.getItem(TOUR_STORAGE_KEY) !== "true") {
      setPhase("intro");
    }
  }, []);

  useEffect(() => {
    if (phase === "closed") return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (phase === "intro") {
          window.localStorage.setItem(TOUR_CHOICE_KEY, "declined");
          window.localStorage.setItem(TOUR_STORAGE_KEY, "true");
          setShowReminder(true);
          window.setTimeout(() => setShowReminder(false), 7000);
        }
        setPhase("closed");
      }
      if (phase === "tour" && event.key === "ArrowRight") setStep((current) => Math.min(current + 1, tourSteps.length - 1));
      if (phase === "tour" && event.key === "ArrowLeft") setStep((current) => Math.max(current - 1, 0));
    };
    document.addEventListener("keydown", handleKeyDown);
    dialogRef.current?.focus();
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [phase]);

  const finish = () => {
    window.localStorage.setItem(TOUR_STORAGE_KEY, "true");
    setPhase("closed");
  };

  const restart = () => {
    setStep(0);
    setShowReminder(false);
    window.localStorage.setItem(TOUR_CHOICE_KEY, "accepted");
    window.localStorage.setItem(TOUR_STORAGE_KEY, "true");
    setPhase("tour");
  };

  const decline = () => {
    window.localStorage.setItem(TOUR_CHOICE_KEY, "declined");
    window.localStorage.setItem(TOUR_STORAGE_KEY, "true");
    setPhase("closed");
    setShowReminder(true);
    window.setTimeout(() => setShowReminder(false), 7000);
  };

  const currentStep = tourSteps[step];

  useEffect(() => {
    if (phase !== "tour") return;
    const target = document.querySelector<HTMLElement>(`[data-tour="${currentStep.target}"]`);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    target.classList.add("relative", "z-[61]", "rounded-xl", "ring-4", "ring-[#602329]", "ring-offset-4");
    return () => target.classList.remove("relative", "z-[61]", "rounded-xl", "ring-4", "ring-[#602329]", "ring-offset-4");
  }, [currentStep.target, phase]);

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={restart}
          data-tour="admin-help"
          className={`inline-flex min-h-11 items-center gap-2 rounded-xl border border-black/10 bg-white px-3 text-sm font-semibold text-black/70 hover:border-[#602329] hover:text-[#602329] ${
            showReminder ? "relative z-[61] ring-4 ring-[#602329] ring-offset-4" : ""
          }`}
        >
          <FiHelpCircle aria-hidden="true" className="size-4" />
          Help / Tour
        </button>
      </div>
      {portalReady && phase !== "closed" && createPortal(
        <div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto p-4 sm:p-6">
          <button type="button" aria-label="Close tour" onClick={phase === "intro" ? decline : finish} className="absolute inset-0 bg-black/45" />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-tour-title"
            tabIndex={-1}
            className="relative my-auto max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-black/10 bg-white p-5 shadow-2xl sm:max-h-[calc(100vh-3rem)] sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#602329]">
                  {phase === "intro" ? "Optional walkthrough" : `Step ${step + 1} of ${tourSteps.length}`}
                </p>
                <h2 id="admin-tour-title" className="mt-2 text-xl font-semibold tracking-[-0.03em]">
                  {phase === "intro" ? "Would you like a quick tour?" : currentStep.title}
                </h2>
              </div>
              <button type="button" onClick={phase === "intro" ? decline : finish} aria-label="Close tour" className="grid size-9 place-items-center rounded-lg hover:bg-black/[0.05]">
                <FiX aria-hidden="true" />
              </button>
            </div>
            {phase === "intro" ? (
              <>
                <p className="mt-3 text-sm leading-6 text-black/60">Learn where to find inquiries, clients, projects, and system controls. You can start this tour again anytime from the Help / Tour button in the navbar.</p>
                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button type="button" onClick={decline} className="min-h-10 rounded-lg px-3 text-sm font-medium text-black/55 hover:text-black">Not now</button>
                  <button type="button" onClick={restart} className="min-h-10 rounded-lg bg-[#602329] px-4 text-sm font-semibold text-white hover:bg-black">Start tour</button>
                </div>
              </>
            ) : (
              <>
                <p className="mt-3 text-sm leading-6 text-black/60">{currentStep.description}</p>
                <p className="mt-3 rounded-lg bg-[#f5f3f0] px-3 py-2 text-xs text-black/55">
                  Highlighted area: <span className="font-semibold text-black/75">{currentStep.target.replace("admin-", "")}</span>
                </p>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <button type="button" onClick={finish} className="min-h-10 rounded-lg px-2 text-sm font-medium text-black/55 hover:text-black">Skip</button>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setStep((current) => Math.max(current - 1, 0))} disabled={step === 0} aria-label="Previous tour step" className="grid size-10 place-items-center rounded-lg border border-black/10 disabled:opacity-35">
                      <FiArrowLeft aria-hidden="true" />
                    </button>
                    {step === tourSteps.length - 1 ? (
                      <button type="button" onClick={finish} className="min-h-10 rounded-lg bg-[#602329] px-4 text-sm font-semibold text-white hover:bg-black">Finish</button>
                    ) : (
                      <button type="button" onClick={() => setStep((current) => Math.min(current + 1, tourSteps.length - 1))} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#602329] px-4 text-sm font-semibold text-white hover:bg-black">
                        Next <FiArrowRight aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body,
      )}
      {portalReady && showReminder && phase === "closed" && createPortal(
        <div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto p-4 sm:p-6">
          <button type="button" aria-label="Close tour reminder" onClick={() => setShowReminder(false)} className="absolute inset-0 bg-black/45" />
          <div role="status" className="relative w-full max-w-md rounded-2xl border border-black/10 bg-white p-5 text-center shadow-2xl sm:p-6">
            <h2 className="text-xl font-semibold tracking-[-0.03em]">Tour skipped for now</h2>
            <p className="mt-3 text-sm leading-6 text-black/60">
              You can start the help tour anytime from the highlighted Help / Tour button in the navbar.
            </p>
            <button type="button" onClick={() => setShowReminder(false)} className="mt-5 min-h-10 rounded-lg bg-[#602329] px-4 text-sm font-semibold text-white hover:bg-black">
              Continue to admin
            </button>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
