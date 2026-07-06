import { type InvestorWallet } from "@prisma/client";
import { prisma } from "./client";

// Saved withdrawal destinations. An investor may keep up to 5; exactly one is
// the default. Networks reuse the deposit network vocabulary.
export const MAX_WALLETS_PER_INVESTOR = 5;

export type SerializedInvestorWallet = {
  id: string;
  label: string;
  network: string;
  address: string;
  isDefault: boolean;
  createdAt: string;
};

export function serializeInvestorWallet(wallet: InvestorWallet): SerializedInvestorWallet {
  return {
    id: wallet.id,
    label: wallet.label,
    network: wallet.network,
    address: wallet.address,
    isDefault: wallet.isDefault,
    createdAt: wallet.createdAt.toISOString()
  };
}

export async function listInvestorWallets(investorId: string) {
  return prisma.investorWallet.findMany({
    where: { investorId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }]
  });
}

export async function getInvestorWalletById(investorId: string, id: string) {
  return prisma.investorWallet.findFirst({ where: { id, investorId } });
}

export type CreateWalletResult =
  | { ok: true; wallet: InvestorWallet }
  | { ok: false; status: number; error: string };

export async function createInvestorWallet(input: {
  investorId: string;
  label: string;
  network: string;
  address: string;
}): Promise<CreateWalletResult> {
  if (!input.label || !input.network || !input.address) {
    return { ok: false, status: 422, error: "MISSING_FIELDS" };
  }
  const count = await prisma.investorWallet.count({ where: { investorId: input.investorId } });
  if (count >= MAX_WALLETS_PER_INVESTOR) {
    return { ok: false, status: 409, error: "WALLET_LIMIT_REACHED" };
  }
  // The first wallet added becomes the default automatically.
  const wallet = await prisma.investorWallet.create({
    data: {
      investorId: input.investorId,
      label: input.label,
      network: input.network,
      address: input.address,
      isDefault: count === 0
    }
  });
  return { ok: true, wallet };
}

export async function deleteInvestorWallet(investorId: string, id: string): Promise<boolean> {
  const wallet = await prisma.investorWallet.findFirst({ where: { id, investorId } });
  if (!wallet) return false;
  await prisma.investorWallet.delete({ where: { id } });
  // Deleting the default promotes the most recently added remaining wallet so
  // an investor always has a default while any wallet exists.
  if (wallet.isDefault) {
    const next = await prisma.investorWallet.findFirst({ where: { investorId }, orderBy: { createdAt: "desc" } });
    if (next) await prisma.investorWallet.update({ where: { id: next.id }, data: { isDefault: true } });
  }
  return true;
}

export async function setDefaultInvestorWallet(investorId: string, id: string): Promise<boolean> {
  const wallet = await prisma.investorWallet.findFirst({ where: { id, investorId } });
  if (!wallet) return false;
  await prisma.$transaction([
    prisma.investorWallet.updateMany({ where: { investorId }, data: { isDefault: false } }),
    prisma.investorWallet.update({ where: { id }, data: { isDefault: true } })
  ]);
  return true;
}
