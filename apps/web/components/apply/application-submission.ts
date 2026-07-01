import type { InvestorApplication, InvestorApplicationResult, InvestorApplicationSubmitter } from "@otiz/lib";

const STORAGE_KEY = "otiz.investorApplications";

type ApiInvestorApplicationResponse = {
  ok: boolean;
  data?: {
    id: string;
  };
  errors?: Record<string, string>;
  error?: string;
};

function readStoredApplications(): InvestorApplication[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const localStorageInvestorApplicationSubmitter: InvestorApplicationSubmitter = {
  async submit(application: InvestorApplication): Promise<InvestorApplicationResult> {
    const existing = readStoredApplications();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([application, ...existing]));

    return {
      ok: true,
      id: application.id
    };
  }
};

export const apiInvestorApplicationSubmitter: InvestorApplicationSubmitter = {
  async submit(application: InvestorApplication): Promise<InvestorApplicationResult> {
    const response = await fetch("/api/investor-applications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fullName: application.fullName,
        telegram: application.telegram,
        email: application.email,
        country: application.country,
        preferredContactMethod: application.preferredContactMethod,
        plannedAllocationAmount: application.plannedAllocationAmount,
        preferredDepositMethod: application.preferredDepositMethod,
        investorType: application.investorType,
        reinvestInterest: application.reinvestInterest,
        heardFrom: application.heardFrom,
        message: application.message,
        consentAccepted: application.consent
      })
    });
    const payload = (await response.json()) as ApiInvestorApplicationResponse;

    if (!response.ok || !payload.ok || !payload.data?.id) {
      throw new Error(payload.error || Object.values(payload.errors || {})[0] || "Application submission failed.");
    }

    return {
      ok: true,
      id: payload.data.id
    };
  }
};

export const investorApplicationSubmitter: InvestorApplicationSubmitter = {
  async submit(application: InvestorApplication): Promise<InvestorApplicationResult> {
    // Always go through the API so submissions reach the admin CRM. Failures are
    // surfaced to the user (see onSubmit) rather than silently saved to
    // localStorage, where they would never reach an admin.
    return apiInvestorApplicationSubmitter.submit(application);
  }
};
