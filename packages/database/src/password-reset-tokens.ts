import type { Investor, PasswordResetToken } from "@prisma/client";
import { prisma } from "./client";

// Single-use, time-limited password reset tokens for the investor forgot/reset
// flow. Token strings are generated in the app layer (crypto.randomBytes).

export async function createPasswordResetToken(input: {
  investorId: string;
  token: string;
  expiresAt: Date;
}) {
  return prisma.passwordResetToken.create({ data: input });
}

// Returns the token row (with its investor) or null. The caller decides the
// specific failure (expired / used / invalid) from usedAt + expiresAt.
export async function getPasswordResetToken(
  token: string
): Promise<(PasswordResetToken & { investor: Investor }) | null> {
  return prisma.passwordResetToken.findUnique({
    where: { token },
    include: { investor: true }
  });
}

// Atomically sets the investor's new password hash, marks the used token, and
// invalidates every other still-unused token for the same investor (so no other
// outstanding reset link stays live after a successful reset).
export async function consumePasswordResetToken(input: {
  investorId: string;
  token: string;
  passwordHash: string;
}) {
  return prisma.$transaction(async (transaction) => {
    const usedAt = new Date();
    const consumed = await transaction.passwordResetToken.updateMany({
      where: {
        token: input.token,
        investorId: input.investorId,
        usedAt: null,
        expiresAt: { gt: usedAt }
      },
      data: { usedAt }
    });
    if (consumed.count !== 1) return false;

    await transaction.investor.update({
      where: { id: input.investorId },
      data: { passwordHash: input.passwordHash }
    });
    await transaction.passwordResetToken.updateMany({
      where: { investorId: input.investorId, usedAt: null },
      data: { usedAt }
    });
    await transaction.investorSession.updateMany({
      where: { investorId: input.investorId, isActive: true },
      data: { isActive: false }
    });
    await transaction.auditLog.create({
      data: {
        actor: `investor:${input.investorId}`,
        action: "RESET_INVESTOR_PASSWORD",
        entityType: "Investor",
        entityId: input.investorId,
        afterJson: JSON.stringify({ sessionsRevoked: true })
      }
    });
    return true;
  });
}
