import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@otiz/lib";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium tracking-[0.02em] transition-colors",
  {
    variants: {
      variant: {
        default: "border-gold-300/25 bg-gold-300/10 text-gold-100",
        secondary: "border-white/10 bg-white/[0.05] text-muted-foreground",
        outline: "border-white/15 text-foreground"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
