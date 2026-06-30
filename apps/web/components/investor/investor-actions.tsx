"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@otiz/lib";
import { Button } from "@otiz/ui";

export function InvestorLogoutButton({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  async function logout() {
    setIsLoggingOut(true);
    await fetch("/api/investor/logout", { method: "POST" }).catch(() => undefined);
    router.push(`/${locale}/investor/login`);
    router.refresh();
  }

  return (
    <Button type="button" variant="outline" size="sm" disabled={isLoggingOut} onClick={logout}>
      {isLoggingOut ? "Closing..." : "Logout"}
    </Button>
  );
}

export function ReinvestPreferenceControl({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = React.useState(initialEnabled);

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Current preference</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{enabled ? "Reinvest enabled" : "Reinvest disabled"}</p>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        This MVP stores the preference locally in the interface only. A manager review step should confirm any permanent instruction.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button type="button" size="sm" disabled={enabled} onClick={() => setEnabled(true)}>
          Enable reinvest
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={!enabled} onClick={() => setEnabled(false)}>
          Disable reinvest
        </Button>
      </div>
    </div>
  );
}

export function WithdrawalRequestBox() {
  const [requested, setRequested] = React.useState(false);

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Request withdrawal</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Submit a manager-reviewed withdrawal request. No real payment processing is connected in this MVP.
      </p>
      {requested ? (
        <p className="mt-4 rounded-2xl border border-gold-200/20 bg-gold-200/10 p-4 text-sm text-gold-100">
          Withdrawal request recorded locally for review. A manager confirmation workflow should be connected next.
        </p>
      ) : null}
      <Button type="button" className="mt-5" disabled={requested} onClick={() => setRequested(true)}>
        {requested ? "Request recorded" : "Request withdrawal"}
      </Button>
    </div>
  );
}
