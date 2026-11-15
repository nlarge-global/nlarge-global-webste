"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-[#602329] focus-visible:ring-3 focus-visible:ring-[#602329]/20 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-red-700 aria-invalid:ring-3 aria-invalid:ring-red-700/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-[#602329] text-white hover:bg-[#4a181d]",
        outline: "border-black/15 bg-white hover:bg-[#f5f3f0] hover:text-black",
        secondary: "bg-[#f5f3f0] text-[#352c29] hover:bg-[#eee6e0]",
        ghost: "hover:bg-[#f5f3f0] hover:text-black",
        destructive: "bg-red-50 text-red-800 hover:bg-red-100",
        link: "text-[#602329] underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-10 gap-1.5 px-3",
        xs: "h-7 gap-1 rounded-lg px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "min-h-9 gap-1 rounded-lg px-2.5 text-[0.8rem]",
        lg: "min-h-11 gap-1.5 px-4",
        icon: "size-10",
        "icon-xs": "size-6 rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9 rounded-lg",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return <ButtonPrimitive data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
