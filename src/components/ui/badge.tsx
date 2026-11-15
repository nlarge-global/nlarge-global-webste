import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeVariants = cva("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold capitalize", {
  variants: {
    variant: {
      default: "border-transparent bg-[#602329] text-white",
      secondary: "border-transparent bg-[#f5f3f0] text-[#5b4d47]",
      outline: "border-black/10 text-[#5b4d47]",
      success: "border-emerald-200 bg-emerald-50 text-emerald-800",
      warning: "border-amber-200 bg-amber-50 text-amber-800",
      destructive: "border-red-200 bg-red-50 text-red-800",
    },
  },
  defaultVariants: { variant: "default" },
});

function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant, className }))} {...props} />;
}

export { Badge, badgeVariants };
