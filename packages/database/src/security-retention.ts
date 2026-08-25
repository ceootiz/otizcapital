import { prisma } from "./client";

const DAY_MS = 24 * 60 * 60 * 1000;

export function securityRetentionCutoffs(now = new Date()) {
  return {
    resetTokensBefore: new Date(now.getTime() - 7 * DAY_MS),
    sessionsBefore: new Date(now.getTime() - 30 * DAY_MS)
  };
}

export async function runSecurityRetention(now = new Date()) {
  const cutoffs = securityRetentionCutoffs(now);

  return prisma.$transaction(async (transaction) => {
    const [resetTokens, sessions] = await Promise.all([
      transaction.passwordResetToken.deleteMany({
        where: { expiresAt: { lt: cutoffs.resetTokensBefore } }
      }),
      transaction.investorSession.deleteMany({
        where: { expiresAt: { lt: cutoffs.sessionsBefore } }
      })
    ]);

    const summary = {
      resetTokensDeleted: resetTokens.count,
      sessionsDeleted: sessions.count,
      resetTokensBefore: cutoffs.resetTokensBefore.toISOString(),
      sessionsBefore: cutoffs.sessionsBefore.toISOString()
    };

    await transaction.auditLog.create({
      data: {
        actor: "system:security-retention",
        action: "RUN_SECURITY_RETENTION",
        entityType: "SecurityRetention",
        entityId: now.toISOString().slice(0, 10),
        afterJson: JSON.stringify(summary)
      }
    });

    return summary;
  });
}
