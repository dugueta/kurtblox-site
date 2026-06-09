import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_0_40px_rgba(124,58,237,0.14)] backdrop-blur",
      className,
    )}
    {...props}
  />
));

Card.displayName = "Card";

export { Card };
