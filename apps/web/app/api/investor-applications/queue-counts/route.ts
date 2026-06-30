import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-session";
import { APPLICATION_SLA_FILTERS, CRM_VIEWS, getCrmConfig, type CrmViewFilters } from "@otiz/lib";
import {
  countInvestorApplicationRecords,
  type ApplicationPriority,
  type ApplicationStatus,
  type CrmWorkflowFilter,
  type InvestorApplicationListOptions,
  type ReinvestInterest
} from "@otiz/database";

export const dynamic = "force-dynamic";

function toListOptions(filters: CrmViewFilters): InvestorApplicationListOptions {
  return {
    status: filters.status as ApplicationStatus | undefined,
    priority: filters.priority as ApplicationPriority | undefined,
    reinvestInterest: filters.reinvestInterest as ReinvestInterest | undefined,
    workflow: filters.workflow as CrmWorkflowFilter | undefined,
    overdueNextActionOnly: filters.overdueOnly === true
  };
}

export async function GET() {
  const session = getAdminSession();

  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  try {
    const entries = await Promise.all(
      CRM_VIEWS.map(async (view) => {
        const count = await countInvestorApplicationRecords(toListOptions(view.filters));
        return [view.key, count] as const;
      })
    );
    const slaEntries = await Promise.all(
      APPLICATION_SLA_FILTERS.map(async (sla) => {
        const count = await countInvestorApplicationRecords({ sla });
        return [sla, count] as const;
      })
    );

    return NextResponse.json({ ok: true, data: { views: Object.fromEntries(entries), sla: Object.fromEntries(slaEntries), config: getCrmConfig() } });
  } catch {
    return NextResponse.json({ ok: false, error: "Unable to load queue counts." }, { status: 500 });
  }
}
