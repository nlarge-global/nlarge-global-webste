"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import { FiArrowUpRight } from "react-icons/fi";

export type DevelopmentService = {
  number: string;
  name: string;
  summary: string;
  text: string;
  includes: string[];
};

type SelectedService = {
  service: DevelopmentService;
  origin: { x: number; y: number };
};

const ServiceDetailDialog = dynamic(
  () => import("./ServiceDetailDialog"),
  {
    ssr: false,
    loading: () => (
      <div
        className="fixed inset-0 z-[100] grid place-items-center bg-black/55 p-5"
        role="status"
      >
        <p className="rounded-xl bg-white px-5 py-4 text-sm font-medium">
          Opening service details…
        </p>
      </div>
    ),
  },
);

export default function ServiceExplorer({
  services,
}: {
  services: DevelopmentService[];
}) {
  const [selectedService, setSelectedService] = useState<SelectedService | null>(
    null,
  );
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeDialog = useCallback(() => {
    setSelectedService(null);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  return (
    <>
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[1.25rem] bg-black/10 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <button
            key={service.name}
            type="button"
            aria-haspopup="dialog"
            aria-label={`View details for ${service.name}`}
            onClick={(event) => {
              triggerRef.current = event.currentTarget;
              const bounds = event.currentTarget.getBoundingClientRect();
              setSelectedService({
                service,
                origin: {
                  x: bounds.left + bounds.width / 2,
                  y: bounds.top + bounds.height / 2,
                },
              });
            }}
            className="group flex min-h-36 min-w-0 flex-col justify-between gap-8 bg-[#f1efea] p-5 text-left transition-colors hover:bg-white focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-white sm:min-h-44 cursor-pointer"
          >
            <span className="flex w-full items-start justify-between gap-3">
              <span className="text-xs text-black/60">{service.number}</span>
              <FiArrowUpRight
                aria-hidden="true"
                className="size-4 shrink-0 text-[#602329] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none"
              />
            </span>
            <span>
              <span className="block text-lg font-semibold tracking-[-0.03em] sm:text-xl">
                {service.name}
              </span>
              <span className="mt-2 block text-xs leading-5 text-black/65">
                {service.summary}
              </span>
            </span>
          </button>
        ))}
      </div>
      {selectedService && (
        <ServiceDetailDialog
          service={selectedService.service}
          origin={selectedService.origin}
          onClose={closeDialog}
        />
      )}
    </>
  );
}
