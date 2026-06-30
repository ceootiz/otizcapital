import { prisma } from "./client";
import { getActiveReadinessPolicy, getSafeDefaultReadinessPolicy, type SerializedReadinessPolicy } from "./readiness-policies";

export const PROOF_COMPLETENESS_STATES = ["VERIFIED", "PARTIAL", "INCOMPLETE", "HIGH_RISK"] as const;
export type ProofCompletenessState = (typeof PROOF_COMPLETENESS_STATES)[number];

export type ProofCompletenessProofInput = {
  id?: string;
  type: string;
  status: string;
};

export type ProofCompletenessComponent = {
  id: string;
  label: string;
  categories: string[];
  present: boolean;
};

export type ProofCompletenessBreakdown = {
  allocationId: string;
  score: number;
  state: ProofCompletenessState;
  presentCategories: string[];
  missingRequiredCategories: string[];
  missingRecommendedCategories: string[];
  hiddenProofCount: number;
  rejectedProofCount: number;
  unreviewedProofCount: number;
  supersededProofCount: number;
  investorSafeSummary: string;
  adminWarnings: string[];
  policyThreshold: number;
  components: ProofCompletenessComponent[];
};

export type InvestorSafeProofHealth = {
  score: number;
  state: ProofCompletenessState;
  investorSafeSummary: string;
  presentCategories: string[];
};

type AllocationProofCompletenessInput = {
  allocationId: string;
  investorId?: string;
  proofs: ProofCompletenessProofInput[];
  monthlyReportLinkCount?: number;
  policy?: SerializedReadinessPolicy;
};

type PortfolioProofCompletenessInput = {
  investorId: string;
  allocations: Array<AllocationProofCompletenessInput & { investorId: string }>;
  policy?: SerializedReadinessPolicy;
};

const INVESTOR_VISIBLE_PROOF_STATUSES = new Set(["AVAILABLE", "VERIFIED"]);
const UNREVIEWED_PROOF_STATUSES = new Set(["PENDING"]);
const HIDDEN_PROOF_STATUSES = new Set(["HIDDEN"]);
const REJECTED_PROOF_STATUSES = new Set(["REJECTED"]);
const SUPERSEDED_PROOF_STATUSES = new Set(["SUPERSEDED"]);
const CRITICAL_PROOF_TYPES = new Set(["SHIPMENT_PROOF", "MARKETPLACE_REPORT", "PAYOUT_PROOF", "PURCHASE_INVOICE"]);

const PROOF_COMPONENTS: Array<Omit<ProofCompletenessComponent, "present"> & { reportLinkage?: boolean }> = [
  { id: "INVOICE_PROOF", label: "Invoice proof", categories: ["PURCHASE_INVOICE"] },
  { id: "SUPPLIER_PAYMENT_PROOF", label: "Supplier payment proof", categories: ["PURCHASE_INVOICE", "OTHER"] },
  { id: "WAREHOUSE_INTAKE_PROOF", label: "Warehouse intake proof", categories: ["WAREHOUSE_MEDIA"] },
  { id: "SERIAL_MANIFEST_PROOF", label: "Serial manifest proof", categories: ["SERIAL_VERIFICATION"] },
  { id: "LOGISTICS_PROOF", label: "Logistics / shipment proof", categories: ["SHIPMENT_PROOF"] },
  { id: "MARKETPLACE_SETTLEMENT_PROOF", label: "Marketplace settlement proof", categories: ["MARKETPLACE_REPORT"] },
  { id: "PAYOUT_PROOF", label: "Payout proof", categories: ["PAYOUT_PROOF"] },
  { id: "MONTHLY_REPORT_LINKAGE", label: "Monthly report linkage", categories: ["MONTHLY_REPORT_LINKAGE"], reportLinkage: true }
];

export const PROOF_REQUIREMENT_COMPONENTS = PROOF_COMPONENTS.map((component) => ({
  id: component.id,
  label: component.label,
  categories: [...component.categories],
  reportLinkage: Boolean(component.reportLinkage)
}));

export type ProofRequirementPolicyStatus = "Required" | "Recommended" | "Optional";

export type ProofRequirementGuideItem = {
  componentKey: string;
  displayName: string;
  acceptedProofTypes: string[];
  policyStatus: ProofRequirementPolicyStatus;
  investorVisibleExplanation: string;
  adminInstruction: string;
  acceptableMetadataExamples: string[];
  commonMistakes: string[];
};

const PROOF_REQUIREMENT_GUIDE_COPY: Record<string, Omit<ProofRequirementGuideItem, "componentKey" | "displayName" | "acceptedProofTypes" | "policyStatus">> = {
  INVOICE_PROOF: {
    investorVisibleExplanation: "Purchase documentation confirms the product batch was sourced through documented commerce operations.",
    adminInstruction: "Create a PURCHASE_INVOICE proof with supplier, invoice reference, product count, amount, and invoice date. Keep sensitive payment credentials out of the description.",
    acceptableMetadataExamples: ["Supplier name", "Invoice reference", "Product model and quantity", "Invoice amount and date"],
    commonMistakes: ["Using a marketplace sale report as the purchase invoice", "Adding full banking or wallet details", "Leaving quantity or product model unclear"]
  },
  SUPPLIER_PAYMENT_PROOF: {
    investorVisibleExplanation: "Supplier payment metadata helps confirm that procurement moved from approval to operational execution.",
    adminInstruction: "Use PURCHASE_INVOICE when payment confirmation is on the invoice, or OTHER for a masked supplier payment confirmation. Include reference, amount, date, and supplier name.",
    acceptableMetadataExamples: ["Masked payment reference", "Supplier name", "Paid amount and date", "Related invoice reference"],
    commonMistakes: ["Uploading unmasked payment credentials", "Using a generic note without a reference", "Mixing supplier payment proof with investor payout proof"]
  },
  WAREHOUSE_INTAKE_PROOF: {
    investorVisibleExplanation: "Warehouse intake evidence confirms the batch reached operational handling before sale activity.",
    adminInstruction: "Create WAREHOUSE_MEDIA proof with intake date, location label, visible batch context, and counted units. Use metadata placeholders only until real media storage exists.",
    acceptableMetadataExamples: ["Intake date", "Warehouse/location label", "Unit count", "Batch or supply code"],
    commonMistakes: ["Using promotional product images", "Omitting batch or supply code", "Marking intake proof verified before operational review"]
  },
  SERIAL_MANIFEST_PROOF: {
    investorVisibleExplanation: "Serial verification metadata supports device-level traceability without exposing sensitive identifiers.",
    adminInstruction: "Create SERIAL_VERIFICATION proof with masked serial manifest details, unit count, verification method, and review date.",
    acceptableMetadataExamples: ["Masked serial range or count", "Verification method", "Reviewed unit count", "Reviewer note"],
    commonMistakes: ["Publishing full serial numbers", "Using unverifiable free text", "Not matching the manifest count to the allocation quantity"]
  },
  LOGISTICS_PROOF: {
    investorVisibleExplanation: "Shipment evidence documents movement through the supply cycle without implying trading or speculative activity.",
    adminInstruction: "Create SHIPMENT_PROOF with carrier, masked tracking/reference, shipment milestone, origin/destination region, and delivery status.",
    acceptableMetadataExamples: ["Carrier", "Masked tracking reference", "Shipment milestone", "Delivery or intake date"],
    commonMistakes: ["Using a vague delivery note", "Including full recipient address", "Marking shipment verified before delivery evidence is reviewed"]
  },
  MARKETPLACE_SETTLEMENT_PROOF: {
    investorVisibleExplanation: "Marketplace reporting evidence connects the allocation to real commerce sale activity.",
    adminInstruction: "Create MARKETPLACE_REPORT proof with marketplace, settlement/order reference, period, units sold, and settlement amount if available.",
    acceptableMetadataExamples: ["Marketplace name", "Order or settlement reference", "Reporting period", "Units sold"],
    commonMistakes: ["Using screenshots without period context", "Combining multiple allocations without notes", "Presenting projected sales as settled sales"]
  },
  PAYOUT_PROOF: {
    investorVisibleExplanation: "Payout proof records completion of a distribution or reinvestment step once it is operationally ready.",
    adminInstruction: "Create PAYOUT_PROOF only when payout/reinvest state is ready. Include payout batch ID, masked destination, paid/reinvested date, and amount.",
    acceptableMetadataExamples: ["Payout batch ID", "Masked destination", "Amount", "Paid or reinvested date"],
    commonMistakes: ["Adding full payment destination details", "Creating payout proof before approval", "Treating expected payout as paid payout"]
  },
  MONTHLY_REPORT_LINKAGE: {
    investorVisibleExplanation: "Monthly report linkage places this allocation into a frozen reporting snapshot for investor review.",
    adminInstruction: "Link the allocation to a draft monthly report, then explicitly regenerate the report snapshot. This is a report linkage requirement, not a proof placeholder type.",
    acceptableMetadataExamples: ["Draft report period", "Linked allocation note", "Snapshot generated timestamp", "Report allocation relation"],
    commonMistakes: ["Expecting live proofs to appear after publish", "Changing linkage after report publication", "Forgetting to regenerate the snapshot after linking"]
  }
};

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function getRequirementPolicyStatus(categories: string[], policy: SerializedReadinessPolicy): ProofRequirementPolicyStatus {
  const requiredCategories = new Set<string>(policy.requiredProofCategories);
  const warningCategories = new Set<string>(policy.warningProofCategories);
  if (categories.some((category) => requiredCategories.has(category))) return "Required";
  if (categories.some((category) => warningCategories.has(category))) return "Recommended";
  return "Optional";
}

export function getProofRequirementsGuide(policy?: SerializedReadinessPolicy): ProofRequirementGuideItem[] {
  const activePolicy = policy ?? getSafeDefaultReadinessPolicy();

  return PROOF_REQUIREMENT_COMPONENTS.map((component) => {
    const copy = PROOF_REQUIREMENT_GUIDE_COPY[component.id];

    return {
      componentKey: component.id,
      displayName: component.label,
      acceptedProofTypes: component.reportLinkage ? [] : [...component.categories],
      policyStatus: getRequirementPolicyStatus(component.categories, activePolicy),
      investorVisibleExplanation: copy?.investorVisibleExplanation ?? "Evidence metadata supports allocation review without exposing internal operations.",
      adminInstruction: copy?.adminInstruction ?? "Use an existing proof placeholder type that matches the operational evidence category.",
      acceptableMetadataExamples: copy?.acceptableMetadataExamples ?? ["Reference", "Date", "Amount or quantity", "Operational note"],
      commonMistakes: copy?.commonMistakes ?? ["Using unsupported proof categories", "Including sensitive raw credentials", "Marking evidence verified before review"]
    };
  });
}

function getInvestorSafeSummary(state: ProofCompletenessState, score: number) {
  if (state === "VERIFIED") {
    return `Evidence coverage is verified for this allocation (${score}%).`;
  }
  if (state === "PARTIAL") {
    return `Evidence coverage is partially available and remains under operational review (${score}%).`;
  }
  return `Evidence coverage is still under manager review (${score}%).`;
}

export function getInvestorSafeProofHealth(completeness: ProofCompletenessBreakdown): InvestorSafeProofHealth {
  return {
    score: completeness.score,
    state: completeness.state,
    investorSafeSummary: completeness.investorSafeSummary,
    presentCategories: completeness.presentCategories.filter((category) => category !== "MONTHLY_REPORT_LINKAGE")
  };
}

export function calculateAllocationProofCompletenessFromInput(input: AllocationProofCompletenessInput): ProofCompletenessBreakdown {
  const policy = input.policy ?? getSafeDefaultReadinessPolicy();
  const visibleProofs = input.proofs.filter((proof) => INVESTOR_VISIBLE_PROOF_STATUSES.has(proof.status));
  const presentProofCategories = unique(visibleProofs.map((proof) => proof.type));
  const monthlyReportLinked = (input.monthlyReportLinkCount ?? 0) > 0;
  const presentCategories = unique([...presentProofCategories, ...(monthlyReportLinked ? ["MONTHLY_REPORT_LINKAGE"] : [])]);
  const components = PROOF_COMPONENTS.map((component) => ({
    id: component.id,
    label: component.label,
    categories: [...component.categories],
    present: component.reportLinkage ? monthlyReportLinked : component.categories.some((category) => presentProofCategories.includes(category))
  }));
  const score = Math.round((components.filter((component) => component.present).length / components.length) * 100);
  const hiddenProofCount = input.proofs.filter((proof) => HIDDEN_PROOF_STATUSES.has(proof.status)).length;
  const rejectedProofCount = input.proofs.filter((proof) => REJECTED_PROOF_STATUSES.has(proof.status)).length;
  const unreviewedProofCount = input.proofs.filter((proof) => UNREVIEWED_PROOF_STATUSES.has(proof.status)).length;
  const supersededProofCount = input.proofs.filter((proof) => SUPERSEDED_PROOF_STATUSES.has(proof.status)).length;
  const unreviewedCriticalProofCount = input.proofs.filter((proof) => UNREVIEWED_PROOF_STATUSES.has(proof.status) && CRITICAL_PROOF_TYPES.has(proof.type)).length;
  const missingRequiredCategories = policy.requiredProofCategories.filter((category) => !presentProofCategories.includes(category));
  const missingPolicyWarningCategories = policy.warningProofCategories.filter((category) => !presentProofCategories.includes(category));
  const missingComponentCategories = components.filter((component) => !component.present).map((component) => component.id);
  const missingRecommendedCategories = unique([...missingPolicyWarningCategories, ...missingComponentCategories]);
  const adminWarnings: string[] = [];

  if (missingRequiredCategories.length) adminWarnings.push(`Missing required policy proof categories: ${missingRequiredCategories.join(", ")}.`);
  if (missingPolicyWarningCategories.length) adminWarnings.push(`Missing warning policy proof categories: ${missingPolicyWarningCategories.join(", ")}.`);
  if (score < policy.minimumProofCompletenessScore) adminWarnings.push(`Proof completeness score ${score}% is below policy threshold ${policy.minimumProofCompletenessScore}%.`);
  if (hiddenProofCount > 0) adminWarnings.push(`${hiddenProofCount} hidden proof artifact(s) excluded from investor-visible evidence.`);
  if (rejectedProofCount > 0) adminWarnings.push(`${rejectedProofCount} rejected proof artifact(s) ignored.`);
  if (supersededProofCount > 0) adminWarnings.push(`${supersededProofCount} superseded proof artifact(s) ignored.`);
  if (unreviewedProofCount > 0) adminWarnings.push(`${unreviewedProofCount} unreviewed proof artifact(s) pending review.`);
  if (!monthlyReportLinked) adminWarnings.push("Allocation is not linked to a monthly report yet.");

  const state: ProofCompletenessState =
    rejectedProofCount > 0 || (policy.blockOnUnreviewedCriticalArtifacts && unreviewedCriticalProofCount > 0)
      ? "HIGH_RISK"
      : missingRequiredCategories.length > 0 || score < policy.minimumProofCompletenessScore
        ? "INCOMPLETE"
        : missingRecommendedCategories.length > 0 || hiddenProofCount > 0 || unreviewedProofCount > 0 || supersededProofCount > 0
          ? "PARTIAL"
          : "VERIFIED";

  return {
    allocationId: input.allocationId,
    score,
    state,
    presentCategories,
    missingRequiredCategories,
    missingRecommendedCategories,
    hiddenProofCount,
    rejectedProofCount,
    unreviewedProofCount,
    supersededProofCount,
    investorSafeSummary: getInvestorSafeSummary(state, score),
    adminWarnings,
    policyThreshold: policy.minimumProofCompletenessScore,
    components
  };
}

export function calculatePortfolioProofCompletenessFromInput(input: PortfolioProofCompletenessInput) {
  const allocations = input.allocations
    .filter((allocation) => allocation.investorId === input.investorId)
    .map((allocation) => calculateAllocationProofCompletenessFromInput({ ...allocation, policy: input.policy }));
  const averageScore = allocations.length === 0 ? 0 : Math.round(allocations.reduce((sum, allocation) => sum + allocation.score, 0) / allocations.length);

  return {
    investorId: input.investorId,
    score: averageScore,
    allocationCount: allocations.length,
    verifiedCount: allocations.filter((allocation) => allocation.state === "VERIFIED").length,
    partialCount: allocations.filter((allocation) => allocation.state === "PARTIAL").length,
    incompleteCount: allocations.filter((allocation) => allocation.state === "INCOMPLETE").length,
    highRiskCount: allocations.filter((allocation) => allocation.state === "HIGH_RISK").length,
    allocations
  };
}

export async function calculateAllocationProofCompleteness(allocationId: string, options: { policy?: SerializedReadinessPolicy } = {}) {
  const [allocation, policy] = await Promise.all([
    prisma.allocation.findUnique({
      where: { id: allocationId },
      select: {
        id: true,
        investorId: true,
        proofs: { select: { id: true, type: true, status: true } },
        monthlyReports: { select: { id: true } }
      }
    }),
    options.policy ? Promise.resolve(options.policy) : getActiveReadinessPolicy()
  ]);

  if (!allocation) return null;

  return calculateAllocationProofCompletenessFromInput({
    allocationId: allocation.id,
    investorId: allocation.investorId,
    proofs: allocation.proofs,
    monthlyReportLinkCount: allocation.monthlyReports.length,
    policy
  });
}

export async function getProofCompletenessBreakdown(allocationId: string, options: { policy?: SerializedReadinessPolicy } = {}) {
  return calculateAllocationProofCompleteness(allocationId, options);
}

export async function calculatePortfolioProofCompleteness(investorId: string, options: { policy?: SerializedReadinessPolicy } = {}) {
  const [allocations, policy] = await Promise.all([
    prisma.allocation.findMany({
      where: { investorId },
      select: {
        id: true,
        investorId: true,
        proofs: { select: { id: true, type: true, status: true } },
        monthlyReports: { select: { id: true } }
      }
    }),
    options.policy ? Promise.resolve(options.policy) : getActiveReadinessPolicy()
  ]);

  return calculatePortfolioProofCompletenessFromInput({
    investorId,
    allocations: allocations.map((allocation) => ({
      allocationId: allocation.id,
      investorId: allocation.investorId,
      proofs: allocation.proofs,
      monthlyReportLinkCount: allocation.monthlyReports.length
    })),
    policy
  });
}
