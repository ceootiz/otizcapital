import { findInvestorById } from "@otiz/database";
import { clearInvestorSession, getValidatedInvestorSession } from "@/lib/investor-session";

// Shared gate for investor API routes: DB-validated session + active investor.
export async function requireInvestorApi() {
  const session = await getValidatedInvestorSession();
  if (!session) return { ok: false as const, status: 401 as const, error: "Unauthorized." };

  const investor = await findInvestorById(session.investorId);
  if (!investor || investor.email !== session.email || investor.status !== "ACTIVE") {
    clearInvestorSession();
    return { ok: false as const, status: 401 as const, error: "Unauthorized." };
  }

  return { ok: true as const, investor, session };
}
