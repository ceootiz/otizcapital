"use client";

import * as React from "react";
import { cn } from "@otiz/lib";
import { Button } from "./button";

export type ConfirmTone = "positive" | "destructive";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel: string;
  tone?: ConfirmTone;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// Lightweight modal confirmation (no Radix Dialog in @otiz/ui). Rendered inline
// as a fixed overlay when `open`. Positive actions confirm with the gold button;
// destructive actions (rejections) confirm with a red button. Cancel is outline.
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone = "positive",
  loading = false,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  React.useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, loading, onCancel]);

  if (!open) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label={cancelLabel}
        tabIndex={-1}
        onClick={() => !loading && onCancel()}
        className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm"
      />
      <div className="relative z-10 w-full max-w-md rounded-[1.35rem] border border-border bg-card dark:border-white/10 dark:bg-graphite-900 p-6 shadow-glass">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-gold-400/60 to-transparent dark:via-gold-200/70" />
        <h2 className="mt-5 text-lg font-semibold tracking-[-0.02em] text-foreground">{title}</h2>
        {description ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p> : null}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" size="sm" disabled={loading} onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={loading}
            onClick={onConfirm}
            className={cn(
              tone === "destructive" &&
                "bg-red-600 text-white shadow-none hover:bg-red-500 focus-visible:ring-red-500/50"
            )}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
