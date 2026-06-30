export type CrmWorkflowFilter =
  | "needs-first-contact"
  | "due-today"
  | "ready-for-agreement"
  | "waiting-decision"
  | "high-value"
  | "stale";

export type CrmViewKey =
  | "all"
  | "new"
  | "contacted"
  | "approved"
  | "vip"
  | "high-priority"
  | "overdue"
  | "reinvest-interested"
  | "needs-first-contact"
  | "due-today"
  | "ready-for-agreement"
  | "waiting-decision"
  | "high-value"
  | "stale";

export type CrmViewFilters = {
  status?: "NEW" | "CONTACTED" | "APPROVED";
  priority?: "HIGH" | "VIP";
  overdueOnly?: boolean;
  reinvestInterest?: "yes";
  workflow?: CrmWorkflowFilter;
};

export type CrmSavedView = {
  key: CrmViewKey;
  label: string;
  description: string;
  filters: CrmViewFilters;
};

export const DEFAULT_CRM_VIEW_KEY: CrmViewKey = "all";

export const CRM_VIEWS: CrmSavedView[] = [
  { key: "all", label: "All", description: "Full CRM queue", filters: {} },
  { key: "new", label: "New", description: "Fresh applications", filters: { status: "NEW" } },
  { key: "contacted", label: "Contacted", description: "Manager touched", filters: { status: "CONTACTED" } },
  { key: "approved", label: "Approved", description: "Ready to progress", filters: { status: "APPROVED" } },
  { key: "vip", label: "VIP", description: "Top priority", filters: { priority: "VIP" } },
  { key: "high-priority", label: "High Priority", description: "Needs attention", filters: { priority: "HIGH" } },
  { key: "overdue", label: "Overdue", description: "Past next action", filters: { overdueOnly: true } },
  { key: "reinvest-interested", label: "Reinvest Interested", description: "Compounding intent", filters: { reinvestInterest: "yes" } },
  { key: "needs-first-contact", label: "Needs first contact", description: "New and untouched", filters: { status: "NEW", workflow: "needs-first-contact" } },
  { key: "due-today", label: "Due today", description: "Open work due now", filters: { workflow: "due-today" } },
  { key: "ready-for-agreement", label: "Ready for agreement", description: "Approved agreement prep", filters: { status: "APPROVED", workflow: "ready-for-agreement" } },
  { key: "waiting-decision", label: "Waiting decision", description: "Contacted, not overdue", filters: { workflow: "waiting-decision" } },
  { key: "high-value", label: "High value leads", description: "$25k+ planned", filters: { workflow: "high-value" } },
  { key: "stale", label: "Stale leads", description: "7+ days inactive", filters: { workflow: "stale" } }
];

export function getCrmViewKey(value: string | null | undefined): CrmViewKey {
  return CRM_VIEWS.some((view) => view.key === value) ? (value as CrmViewKey) : DEFAULT_CRM_VIEW_KEY;
}

export function getCrmView(key: CrmViewKey) {
  return CRM_VIEWS.find((view) => view.key === key) ?? CRM_VIEWS[0];
}
