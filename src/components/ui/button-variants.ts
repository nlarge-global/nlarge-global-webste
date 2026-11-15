import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-transparent text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:border-[#602329] focus-visible:ring-3 focus-visible:ring-[#602329]/20 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-[#602329] text-white hover:bg-[#48151a]",
        outline: "border-black/15 bg-white hover:bg-[#f5f3f0]",
        secondary: "bg-[#f5f3f0] text-[#352c29] hover:bg-[#eee6e0]",
        ghost: "hover:bg-[#f5f3f0]",
        destructive: "bg-red-600 text-white hover:bg-red-500",
        link: "text-[#602329] underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-10 px-3",
        sm: "min-h-9 px-2.5 text-xs",
        lg: "min-h-11 px-4",
        icon: "size-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);
