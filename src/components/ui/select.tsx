import * as React from "react";
import { FiChevronDown } from "react-icons/fi";
import { cn } from "@/lib/cn";

const Select = React.forwardRef<HTMLSelectElement, React.ComponentProps<"select">>(
  ({ className, children, ...props }, ref) => (
    <span className="relative mt-2 block">
      <select
        ref={ref}
        className={cn(
          "min-h-11 w-full cursor-pointer appearance-none rounded-xl border border-black/15 bg-white px-3 pr-10 text-sm outline-none transition-colors focus:border-[#602329] focus:ring-3 focus:ring-[#602329]/10 disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <FiChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-black/45"
      />
    </span>
  ),
);

Select.displayName = "Select";

export { Select };
