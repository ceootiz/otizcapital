import { prisma } from "./client";

export const INVESTOR_ONBOARDING_STEP_KEYS = ["application", "approval", "agreement", "deposit", "allocation", "report"] as const;

export type InvestorOnboardingStepKey = (typeof INVESTOR_ONBOARDING_STEP_KEYS)[number];

export type InvestorOnboardingStep = {
  key: InvestorOnboardingStepKey;
  complete: boolean;
  completedAt: string | null;
};

export type InvestorOnboardingStatus = {
  steps: InvestorOnboardingStep[];
  completedSteps: number;
  totalSteps: number;
  nextStep: InvestorOnboardingStepKey | null;
};

type InvestorOnboardingInput = {
  investorStatus: string;
  accountCreatedAt: Date;
  applicationCreatedAt?: Date | null;
  approvedAt?: Date | null;
  agreementSignedAt?: Date | null;
  depositConfirmedAt?: Date | null;
  firstAllocationAt?: Date | null;
  firstReportPublishedAt?: Date | null;
};

function toIso(value?: Date | null) {
  return value?.toISOString() ?? null;
}

export function buildInvestorOnboardingStatus(input: InvestorOnboardingInput): InvestorOnboardingStatus {
  const hasAllocation = Boolean(input.firstAllocationAt);
  const steps: InvestorOnboardingStep[] = [
    {
      key: "application",
      complete: true,
      completedAt: toIso(input.applicationCreatedAt ?? input.accountCreatedAt)
    },
    {
      key: "approval",
      complete: input.investorStatus === "ACTIVE",
      completedAt: input.investorStatus === "ACTIVE" ? toIso(input.approvedAt ?? input.accountCreatedAt) : null
    },
    {
      key: "agreement",
      complete: Boolean(input.agreementSignedAt),
      completedAt: toIso(input.agreementSignedAt)
    },
    {
      key: "deposit",
      complete: Boolean(input.depositConfirmedAt) || hasAllocation,
      completedAt: toIso(input.depositConfirmedAt ?? input.firstAllocationAt)
    },
    {
      key: "allocation",
      complete: hasAllocation,
      completedAt: toIso(input.firstAllocationAt)
    },
    {
      key: "report",
      complete: Boolean(input.firstReportPublishedAt),
      completedAt: toIso(input.firstReportPublishedAt)
    }
  ];

  return {
    steps,
    completedSteps: steps.filter((step) => step.complete).length,
    totalSteps: steps.length,
    nextStep: steps.find((step) => !step.complete)?.key ?? null
  };
}

export async function getInvestorOnboardingStatus(investorId: string): Promise<InvestorOnboardingStatus | null> {
  const investor = await prisma.investor.findUnique({
    where: { id: investorId },
    select: {
      status: true,
      createdAt: true,
      applications: {
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { createdAt: true, approvedAt: true }
      },
      documents: {
        where: { type: "AGREEMENT", status: "SIGNED" },
        orderBy: { signedAt: "asc" },
        take: 1,
        select: { signedAt: true }
      },
      depositNotifications: {
        where: { status: "CONFIRMED" },
        orderBy: { reviewedAt: "asc" },
        take: 1,
        select: { reviewedAt: true, createdAt: true }
      },
      allocations: {
        where: { status: { not: "CANCELED" } },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { createdAt: true }
      },
      monthlyReports: {
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "asc" },
        take: 1,
        select: { publishedAt: true }
      }
    }
  });

  if (!investor) return null;

  const application = investor.applications[0];
  const deposit = investor.depositNotifications[0];

  return buildInvestorOnboardingStatus({
    investorStatus: investor.status,
    accountCreatedAt: investor.createdAt,
    applicationCreatedAt: application?.createdAt,
    approvedAt: application?.approvedAt,
    agreementSignedAt: investor.documents[0]?.signedAt,
    depositConfirmedAt: deposit?.reviewedAt ?? deposit?.createdAt,
    firstAllocationAt: investor.allocations[0]?.createdAt,
    firstReportPublishedAt: investor.monthlyReports[0]?.publishedAt
  });
}
