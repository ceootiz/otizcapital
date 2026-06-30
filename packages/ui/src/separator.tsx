import * as React from "react";
import { cn } from "@otiz/lib";

function Separator({ className, decorative = true, ...props }: React.HTMLAttributes<HTMLDivElement> & { decorative?: boolean }) {
  return <div role={decorative ? "none" : "separator"} className={cn("h-px w-full bg-white/10", className)} {...props} />;
}

export { Separator };
