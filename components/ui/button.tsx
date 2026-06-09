import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold outline-none transition duration-200 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05040a] disabled:pointer-events-none disabled:opacity-50 active:scale-[.98]",
  {
    variants: {
      variant: {
        default:
          "bg-violet-600 text-white shadow-[0_12px_32px_rgba(124,58,237,.32)] hover:bg-violet-500",
        premium:
          "bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-700 text-white shadow-[0_14px_36px_rgba(124,58,237,.42)] hover:brightness-110",
        outline:
          "border border-white/10 bg-white/[.04] text-zinc-100 hover:border-violet-400/60 hover:bg-white/[.07]",
        ghost: "text-zinc-300 hover:bg-white/[.06] hover:text-white",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-4 text-xs",
        lg: "h-13 px-7 text-base",
        icon: "h-11 w-11 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
