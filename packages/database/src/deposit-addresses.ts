import type { DepositAddress } from "@prisma/client";
import { prisma } from "./client";

export type SerializedDepositAddress = {
  id: string;
  currency: string;
  network: string;
  address: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export function serializeDepositAddress(record: DepositAddress): SerializedDepositAddress {
  return {
    id: record.id,
    currency: record.currency,
    network: record.network,
    address: record.address,
    isActive: record.isActive,
    sortOrder: record.sortOrder,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

export async function listActiveDepositAddresses() {
  return prisma.depositAddress.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { currency: "asc" }, { createdAt: "asc" }]
  });
}

export async function listAllDepositAddresses() {
  return prisma.depositAddress.findMany({
    orderBy: [{ sortOrder: "asc" }, { currency: "asc" }, { createdAt: "asc" }]
  });
}

export async function createDepositAddress(input: {
  currency: string;
  network: string;
  address: string;
  isActive?: boolean;
  sortOrder?: number;
}) {
  return prisma.depositAddress.create({
    data: {
      currency: input.currency,
      network: input.network,
      address: input.address,
      isActive: input.isActive ?? true,
      sortOrder: input.sortOrder ?? 0
    }
  });
}

export async function updateDepositAddress(
  id: string,
  input: Partial<{ currency: string; network: string; address: string; isActive: boolean; sortOrder: number }>
) {
  return prisma.depositAddress.update({ where: { id }, data: input });
}

export async function deleteDepositAddress(id: string) {
  return prisma.depositAddress.delete({ where: { id } });
}
