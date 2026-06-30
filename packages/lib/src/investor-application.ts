import { type Locale } from "./i18n";

export type PreferredContactMethod = "telegram" | "email";
export type PreferredDepositMethod = "usdt" | "btc" | "cash" | "bank_transfer";
export type InvestorType = "individual" | "company";
export type ReinvestInterest = "yes" | "no" | "not_sure";

export type InvestorApplicationStatus = "received";

export type InvestorApplication = {
  id: string;
  locale: Locale;
  fullName: string;
  telegram: string;
  email: string;
  country: string;
  preferredContactMethod: PreferredContactMethod;
  plannedAllocationAmount: string;
  preferredDepositMethod: PreferredDepositMethod;
  investorType: InvestorType;
  reinvestInterest: ReinvestInterest;
  heardFrom: string;
  message: string;
  consent: boolean;
  status: InvestorApplicationStatus;
  createdAt: string;
};

export type InvestorApplicationDraft = Omit<InvestorApplication, "id" | "status" | "createdAt">;

export type InvestorApplicationResult = {
  ok: true;
  id: string;
};

export interface InvestorApplicationSubmitter {
  submit(application: InvestorApplication): Promise<InvestorApplicationResult>;
}

export const applicationFlowSteps = [
  "Application",
  "Review",
  "Approval",
  "KYC",
  "Agreement",
  "Allocation",
  "Reporting",
  "Payout / Reinvest"
] as const;

export const applyTrustSignals = [
  "Real commerce operations",
  "Manual review",
  "Monthly reporting",
  "Proof-based transparency",
  "Managed allocation"
] as const;

export function createInvestorApplication(draft: InvestorApplicationDraft): InvestorApplication {
  const id = `OTIZ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

  return {
    ...draft,
    id,
    status: "received",
    createdAt: new Date().toISOString()
  };
}
