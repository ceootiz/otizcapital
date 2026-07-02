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
  passwordHash: string;
}) {
  await prisma.$transaction([
    prisma.investor.update({
      where: { id: input.investorId },
      data: { passwordHash: input.passwordHash }
    }),
    prisma.passwordResetToken.updateMany({
      where: { investorId: input.investorId, usedAt: null },
      data: { usedAt: new Date() }
    })
  ]);
}
