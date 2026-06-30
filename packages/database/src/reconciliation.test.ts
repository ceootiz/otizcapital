import { describe, expect, it } from "vitest";
import { calculateAllocationReconciliationFromEntries, calculateInvestorReconciliation, createCorrectingLedgerEntry, createLedgerEntry, exportLedgerEntriesToCsv, getLedgerEntriesForAllocation, getLedgerEntryAuditTrail, reverseLedgerEntry } from "./reconciliation";
import { prisma } from "./client";
import { createLedgerCsvExportAuditEvent } from "./audit-logs";

const baseEntries = [
  { ledgerType: "INVENTORY", allocationId: "allocation-a", entryType: "UNITS_PURCHASED", amount: "0", quantity: 10, sourceType: "ALLOCATION", description: "Purchased units" },
  { ledgerType: "INVENTORY", allocationId: "allocation-a", entryType: "UNITS_RECEIVED", amount: "0", quantity: 10, sourceType: "ALLOCATION", description: "Received units" },
  { ledgerType: "INVENTORY", allocationId: "allocation-a", entryType: "UNITS_SOLD", amount: "0", quantity: 10, sourceType: "MARKETPLACE_SETTLEMENT", description: "Sold units" },
  { ledgerType: "CASH", allocationId: "allocation-a", entryType: "INVESTOR_CASH_IN", amount: "10000", sourceType: "ALLOCATION", description: "Investor cash in" },
  { ledgerType: "CASH", allocationId: "allocation-a", entryType: "SUPPLIER_PAYMENT", amount: "9000", sourceType: "ALLOCATION", description: "Supplier payment" },
  { ledgerType: "CASH", allocationId: "allocation-a", entryType: "MARKETPLACE_SETTLEMENT", amount: "11200", sourceType: "MARKETPLACE_SETTLEMENT", description: "Settlement" },
  { ledgerType: "INVESTOR_LIABILITY", allocationId: "allocation-a", entryType: "CAPITAL_ALLOCATED", amount: "10000", sourceType: "ALLOCATION", description: "Capital allocated" },
  { ledgerType: "INVESTOR_LIABILITY", allocationId: "allocation-a", entryType: "PROFIT_ACCRUED", amount: "1200", sourceType: "MONTHLY_REPORT", description: "Profit accrued" },
  { ledgerType: "INVESTOR_LIABILITY", allocationId: "allocation-a", entryType: "PAYOUT_APPROVED", amount: "1200", sourceType: "WITHDRAWAL_REQUEST", description: "Payout approved" },
  { ledgerType: "INVESTOR_LIABILITY", allocationId: "allocation-a", entryType: "PAYOUT_PAID", amount: "1200", sourceType: "WITHDRAWAL_REQUEST", description: "Payout paid" }
];

describe("three-ledger reconciliation", () => {
  it("returns BALANCED for coherent allocation ledgers", () => {
    const result = calculateAllocationReconciliationFromEntries({ allocationId: "allocation-a", entries: baseEntries });

    expect(result.status).toBe("BALANCED");
    expect(result.score).toBe(100);
    expect(result.ledgerSummary.inventory.remaining).toBe(0);
  });

  it("returns BROKEN when sold units exceed received units", () => {
    const result = calculateAllocationReconciliationFromEntries({
      allocationId: "allocation-a",
      entries: [
        { ledgerType: "INVENTORY", allocationId: "allocation-a", entryType: "UNITS_PURCHASED", amount: "0", quantity: 5, sourceType: "ALLOCATION", description: "Purchased" },
        { ledgerType: "INVENTORY", allocationId: "allocation-a", entryType: "UNITS_RECEIVED", amount: "0", quantity: 5, sourceType: "ALLOCATION", description: "Received" },
        { ledgerType: "INVENTORY", allocationId: "allocation-a", entryType: "UNITS_SOLD", amount: "0", quantity: 6, sourceType: "MARKETPLACE_SETTLEMENT", description: "Sold" }
      ]
    });

    expect(result.status).toBe("BROKEN");
    expect(result.blockingIssues.some((issue) => issue.id === "sold-exceeds-available")).toBe(true);
  });

  it("returns BROKEN when payout paid exceeds approved payout", () => {
    const result = calculateAllocationReconciliationFromEntries({
      allocationId: "allocation-a",
      entries: [
        { ledgerType: "INVESTOR_LIABILITY", allocationId: "allocation-a", entryType: "PAYOUT_APPROVED", amount: "100", sourceType: "WITHDRAWAL_REQUEST", description: "Approved" },
        { ledgerType: "INVESTOR_LIABILITY", allocationId: "allocation-a", entryType: "PAYOUT_PAID", amount: "150", sourceType: "WITHDRAWAL_REQUEST", description: "Paid" }
      ]
    });

    expect(result.status).toBe("BROKEN");
    expect(result.blockingIssues.some((issue) => issue.id === "paid-exceeds-approved")).toBe(true);
  });

  it("warns when marketplace settlement exists without sold units", () => {
    const result = calculateAllocationReconciliationFromEntries({
      allocationId: "allocation-a",
      entries: [{ ledgerType: "CASH", allocationId: "allocation-a", entryType: "MARKETPLACE_SETTLEMENT", amount: "5000", sourceType: "MARKETPLACE_SETTLEMENT", description: "Settlement" }]
    });

    expect(result.status).toBe("WARNING");
    expect(result.warnings.some((issue) => issue.id === "settlement-without-sold-units")).toBe(true);
  });

  it("creates ledger entries with an audit event", async () => {
    const suffix = Date.now();
    const investor = await prisma.investor.create({ data: { fullName: "Ledger Test Investor", email: `ledger-${suffix}@example.com`, status: "ACTIVE" } });
    const allocation = await prisma.allocation.create({ data: { investorId: investor.id, supplyCode: `LEDGER-${suffix}`, productName: "Ledger batch", allocationAmount: "5000", status: "SELLING" } });

    const result = await createLedgerEntry({ ledgerType: "INVENTORY", allocationId: allocation.id, entryType: "UNITS_PURCHASED", amount: "0", quantity: 3, occurredAt: new Date("2026-06-01T00:00:00.000Z"), sourceType: "ALLOCATION", description: "Purchased test units", createdBy: "admin" });
    expect(result.ok).toBe(true);

    const audit = await prisma.auditLog.findFirst({ where: { action: "CREATE_LEDGER_ENTRY", entityId: result.ok ? result.entry.id : "missing" } });
    expect(audit?.entityType).toBe("LedgerEntry");
  });

  it("reverses ledger entries with offsetting amount and quantity", async () => {
    const suffix = `${Date.now()}-${Math.round(Math.random() * 100000)}`;
    const investor = await prisma.investor.create({ data: { fullName: "Ledger Reversal Investor", email: `ledger-reversal-${suffix}@example.com`, status: "ACTIVE" } });
    const allocation = await prisma.allocation.create({ data: { investorId: investor.id, supplyCode: `LEDGER-REV-${suffix}`, productName: "Reversal batch", allocationAmount: "5000", status: "RECEIVED" } });

    const original = await createLedgerEntry({ ledgerType: "INVENTORY", allocationId: allocation.id, entryType: "UNITS_RECEIVED", amount: "1250", quantity: 10, occurredAt: new Date("2026-06-01T00:00:00.000Z"), sourceType: "ALLOCATION", description: "Received test units", createdBy: "admin" });
    expect(original.ok).toBe(true);
    if (!original.ok) throw new Error(original.error);

    const reversal = await reverseLedgerEntry({ ledgerEntryId: original.entry.id, allocationId: allocation.id, reversalReason: "Duplicate receiving entry", actor: "admin" });
    expect(reversal.ok).toBe(true);
    if (!reversal.ok) throw new Error(reversal.error);

    expect(reversal.reversal.isReversal).toBe(true);
    expect(reversal.reversal.reversesLedgerEntryId).toBe(original.entry.id);
    expect(reversal.reversal.amount).toBe("-1250");
    expect(reversal.reversal.quantity).toBe(-10);

    const entries = await prisma.ledgerEntry.findMany({ where: { allocationId: allocation.id } });
    const reconciliation = calculateAllocationReconciliationFromEntries({ allocationId: allocation.id, allocationStatus: allocation.status, entries });
    expect(reconciliation.ledgerSummary.inventory.received).toBe(0);

    const audit = await prisma.auditLog.findFirst({ where: { action: "REVERSE_LEDGER_ENTRY", entityId: original.entry.id } });
    expect(audit?.entityType).toBe("LedgerEntry");
  });

  it("blocks reversing reversal entries and duplicate reversals", async () => {
    const suffix = `${Date.now()}-${Math.round(Math.random() * 100000)}`;
    const investor = await prisma.investor.create({ data: { fullName: "Ledger Double Reversal Investor", email: `ledger-double-reversal-${suffix}@example.com`, status: "ACTIVE" } });
    const allocation = await prisma.allocation.create({ data: { investorId: investor.id, supplyCode: `LEDGER-DOUBLE-REV-${suffix}`, productName: "Double reversal batch", allocationAmount: "5000", status: "RECEIVED" } });

    const original = await createLedgerEntry({ ledgerType: "CASH", allocationId: allocation.id, entryType: "SUPPLIER_PAYMENT", amount: "2100", currency: "USD", occurredAt: new Date("2026-06-01T00:00:00.000Z"), sourceType: "ALLOCATION", description: "Supplier payment", createdBy: "admin" });
    expect(original.ok).toBe(true);
    if (!original.ok) throw new Error(original.error);

    const firstReversal = await reverseLedgerEntry({ ledgerEntryId: original.entry.id, allocationId: allocation.id, reversalReason: "Wrong supplier invoice", actor: "admin" });
    expect(firstReversal.ok).toBe(true);
    if (!firstReversal.ok) throw new Error(firstReversal.error);

    const duplicateReversal = await reverseLedgerEntry({ ledgerEntryId: original.entry.id, allocationId: allocation.id, reversalReason: "Second reversal attempt", actor: "admin" });
    expect(duplicateReversal.ok).toBe(false);
    if (!duplicateReversal.ok) expect(duplicateReversal.status).toBe(409);

    const reversalOfReversal = await reverseLedgerEntry({ ledgerEntryId: firstReversal.reversal.id, allocationId: allocation.id, reversalReason: "Reverse reversal attempt", actor: "admin" });
    expect(reversalOfReversal.ok).toBe(false);
    if (!reversalOfReversal.ok) expect(reversalOfReversal.status).toBe(409);
  });

  it("requires reversal reason", async () => {
    const result = await reverseLedgerEntry({ ledgerEntryId: "missing", reversalReason: " ", actor: "admin" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(422);
  });

  it("creates correction flow with reversal and corrected entry", async () => {
    const suffix = `${Date.now()}-${Math.round(Math.random() * 100000)}`;
    const investor = await prisma.investor.create({ data: { fullName: "Ledger Correction Investor", email: `ledger-correction-${suffix}@example.com`, status: "ACTIVE" } });
    const allocation = await prisma.allocation.create({ data: { investorId: investor.id, supplyCode: `LEDGER-CORR-${suffix}`, productName: "Correction batch", allocationAmount: "5000", status: "RECEIVED" } });

    const original = await createLedgerEntry({ ledgerType: "INVESTOR_LIABILITY", allocationId: allocation.id, entryType: "CAPITAL_ALLOCATED", amount: "5000", currency: "USD", occurredAt: new Date("2026-06-01T00:00:00.000Z"), sourceType: "ALLOCATION", description: "Original capital", createdBy: "admin" });
    expect(original.ok).toBe(true);
    if (!original.ok) throw new Error(original.error);

    const correction = await createCorrectingLedgerEntry({
      ledgerEntryId: original.entry.id,
      allocationId: allocation.id,
      reversalReason: "Corrected allocation amount",
      actor: "admin",
      correction: { ledgerType: "INVESTOR_LIABILITY", allocationId: allocation.id, entryType: "CAPITAL_ALLOCATED", amount: "5200", currency: "USD", occurredAt: new Date("2026-06-02T00:00:00.000Z"), sourceType: "MANUAL_ADJUSTMENT", description: "Corrected capital", createdBy: "admin" }
    });
    expect(correction.ok).toBe(true);
    if (!correction.ok) throw new Error(correction.error);

    expect(correction.reversal.amount).toBe("-5000");
    expect(correction.correction.amount).toBe("5200");
    const updatedOriginal = await prisma.ledgerEntry.findUnique({ where: { id: original.entry.id } });
    expect(updatedOriginal?.correctedByLedgerEntryId).toBe(correction.correction.id);

    const audit = await prisma.auditLog.findFirst({ where: { action: "CORRECT_LEDGER_ENTRY", entityId: original.entry.id } });
    expect(audit?.entityType).toBe("LedgerEntry");
  });

  it("returns sanitized audit trail for original, reversal, and correction entries", async () => {
    const suffix = `${Date.now()}-${Math.round(Math.random() * 100000)}`;
    const investor = await prisma.investor.create({ data: { fullName: "Ledger Trail Investor", email: `ledger-trail-${suffix}@example.com`, status: "ACTIVE" } });
    const allocation = await prisma.allocation.create({ data: { investorId: investor.id, supplyCode: `LEDGER-TRAIL-${suffix}`, productName: "Trail batch", allocationAmount: "5000", status: "RECEIVED" } });

    const original = await createLedgerEntry({
      ledgerType: "CASH",
      allocationId: allocation.id,
      entryType: "SUPPLIER_PAYMENT",
      amount: "1000",
      currency: "USD",
      occurredAt: new Date("2026-06-01T00:00:00.000Z"),
      sourceType: "MANUAL_ADJUSTMENT",
      description: "Original supplier payment",
      metadataJson: JSON.stringify({ reference: "masked-source", secretToken: "do-not-leak", bankAccount: "123456789" }),
      createdBy: "admin"
    });
    expect(original.ok).toBe(true);
    if (!original.ok) throw new Error(original.error);

    const correction = await createCorrectingLedgerEntry({
      ledgerEntryId: original.entry.id,
      allocationId: allocation.id,
      reversalReason: "Correct supplier payment",
      actor: "admin",
      correction: { ledgerType: "CASH", allocationId: allocation.id, entryType: "SUPPLIER_PAYMENT", amount: "1100", currency: "USD", occurredAt: new Date("2026-06-02T00:00:00.000Z"), sourceType: "MANUAL_ADJUSTMENT", description: "Corrected supplier payment", metadataJson: JSON.stringify({ reference: "corrected-source" }), createdBy: "admin" }
    });
    expect(correction.ok).toBe(true);
    if (!correction.ok) throw new Error(correction.error);

    const trail = await getLedgerEntryAuditTrail(original.entry.id);
    expect(trail?.originalEntry.id).toBe(original.entry.id);
    expect(trail?.originalEntry.statusFlags.isOriginal).toBe(true);
    expect(trail?.originalEntry.statusFlags.isReversed).toBe(true);
    expect(trail?.originalEntry.statusFlags.isCorrected).toBe(true);
    expect(trail?.reversalEntries).toHaveLength(1);
    expect(trail?.reversalEntries[0]?.statusFlags.isReversal).toBe(true);
    expect(trail?.correctionEntry?.id).toBe(correction.correction.id);
    expect(trail?.auditEvents.some((event) => event.action === "CORRECT_LEDGER_ENTRY")).toBe(true);
    expect(trail?.originalEntry.metadataPreview).toContain("masked-source");
    expect(trail?.originalEntry.metadataPreview).toContain("[redacted]");
    expect(trail?.originalEntry.metadataPreview).not.toContain("do-not-leak");
    expect(trail?.originalEntry).not.toHaveProperty("metadataJson");
  });

  it("filters allocation ledger entries without changing reconciliation calculations", async () => {
    const suffix = `${Date.now()}-${Math.round(Math.random() * 100000)}`;
    const investor = await prisma.investor.create({ data: { fullName: "Ledger Filter Investor", email: `ledger-filter-${suffix}@example.com`, status: "ACTIVE" } });
    const allocation = await prisma.allocation.create({ data: { investorId: investor.id, supplyCode: `LEDGER-FILTER-${suffix}`, productName: "Filter batch", allocationAmount: "5000", status: "SELLING" } });

    await createLedgerEntry({ ledgerType: "INVENTORY", allocationId: allocation.id, entryType: "UNITS_RECEIVED", amount: "0", quantity: 5, occurredAt: new Date("2026-06-01T00:00:00.000Z"), sourceType: "MANUAL_ADJUSTMENT", sourceId: "warehouse-alpha", description: "Warehouse alpha received units", createdBy: "admin" });
    const supplierPayment = await createLedgerEntry({ ledgerType: "CASH", allocationId: allocation.id, entryType: "SUPPLIER_PAYMENT", amount: "1200", currency: "USD", occurredAt: new Date("2026-06-02T00:00:00.000Z"), sourceType: "ALLOCATION", sourceId: "supplier-alpha", description: "Supplier alpha payment", createdBy: "admin" });
    await createLedgerEntry({ ledgerType: "CASH", allocationId: allocation.id, entryType: "MARKETPLACE_SETTLEMENT", amount: "5200", currency: "USD", occurredAt: new Date("2026-06-05T00:00:00.000Z"), sourceType: "MARKETPLACE_SETTLEMENT", sourceId: "settlement-bravo", description: "Marketplace settlement bravo", createdBy: "admin" });
    expect(supplierPayment.ok).toBe(true);
    if (!supplierPayment.ok) throw new Error(supplierPayment.error);
    const correction = await prisma.ledgerEntry.create({ data: { ledgerType: "CASH", allocationId: allocation.id, investorId: investor.id, entryType: "SUPPLIER_PAYMENT", amount: "1300", currency: "USD", occurredAt: new Date("2026-06-03T00:00:00.000Z"), sourceType: "MANUAL_ADJUSTMENT", sourceId: "supplier-alpha-corrected", description: "Corrected supplier alpha payment", createdBy: "admin" } });
    await prisma.ledgerEntry.update({ where: { id: supplierPayment.entry.id }, data: { voidedAt: new Date("2026-06-03T00:00:00.000Z"), voidedBy: "admin", correctedByLedgerEntryId: correction.id } });
    await prisma.ledgerEntry.create({ data: { ledgerType: "CASH", allocationId: allocation.id, investorId: investor.id, entryType: "SUPPLIER_PAYMENT", amount: "-1200", currency: "USD", occurredAt: new Date("2026-06-03T00:00:00.000Z"), sourceType: "MANUAL_ADJUSTMENT", sourceId: "supplier-alpha-reversal", description: "Supplier alpha reversal", createdBy: "admin", isReversal: true, reversesLedgerEntryId: supplierPayment.entry.id, reversalReason: "Correct supplier payment" } });

    const byLedgerType = await getLedgerEntriesForAllocation(allocation.id, { ledgerType: "CASH" });
    expect(byLedgerType.entries.every((entry) => entry.ledgerType === "CASH")).toBe(true);

    const byEntryType = await getLedgerEntriesForAllocation(allocation.id, { entryType: "MARKETPLACE_SETTLEMENT" });
    expect(byEntryType.entries).toHaveLength(1);
    expect(byEntryType.entries[0]?.sourceId).toBe("settlement-bravo");

    const bySourceType = await getLedgerEntriesForAllocation(allocation.id, { sourceType: "ALLOCATION" });
    expect(bySourceType.entries.every((entry) => entry.sourceType === "ALLOCATION")).toBe(true);

    const reversalsOnly = await getLedgerEntriesForAllocation(allocation.id, { reversalStatus: "REVERSALS_ONLY" });
    expect(reversalsOnly.entries).toHaveLength(1);
    expect(reversalsOnly.entries[0]?.isReversal).toBe(true);

    const reversedOnly = await getLedgerEntriesForAllocation(allocation.id, { reversalStatus: "REVERSED_ONLY" });
    expect(reversedOnly.entries).toHaveLength(1);
    expect(reversedOnly.entries[0]?.id).toBe(supplierPayment.entry.id);

    const correctedOnly = await getLedgerEntriesForAllocation(allocation.id, { reversalStatus: "CORRECTED_ONLY" });
    expect(correctedOnly.entries).toHaveLength(1);
    expect(correctedOnly.entries[0]?.correctedByLedgerEntryId).toBe(correction.id);

    const byDateRange = await getLedgerEntriesForAllocation(allocation.id, { dateFrom: "2026-06-04", dateTo: "2026-06-06" });
    expect(byDateRange.entries).toHaveLength(1);
    expect(byDateRange.entries[0]?.entryType).toBe("MARKETPLACE_SETTLEMENT");

    const byAmountRange = await getLedgerEntriesForAllocation(allocation.id, { minAmount: "5000", maxAmount: "5300" });
    expect(byAmountRange.entries).toHaveLength(1);
    expect(byAmountRange.entries[0]?.amount).toBe("5200");

    const byQuery = await getLedgerEntriesForAllocation(allocation.id, { query: "settlement-bravo" });
    expect(byQuery.entries).toHaveLength(1);
    expect(byQuery.entries[0]?.description).toContain("Marketplace settlement");

    const cappedLimit = await getLedgerEntriesForAllocation(allocation.id, { limit: 500 });
    expect(cappedLimit.appliedFilters.limit).toBe(200);

    const allEntries = await prisma.ledgerEntry.findMany({ where: { allocationId: allocation.id } });
    const reconciliation = calculateAllocationReconciliationFromEntries({ allocationId: allocation.id, allocationStatus: allocation.status, entries: allEntries });
    const filtered = await getLedgerEntriesForAllocation(allocation.id, { ledgerType: "INVENTORY" });
    expect(filtered.entries.length).toBeLessThan(allEntries.length);
    expect(reconciliation.metrics.entryCount).toBe(allEntries.length);
  });

  it("exports filtered ledger entries to CSV safely", async () => {
    const suffix = `${Date.now()}-${Math.round(Math.random() * 100000)}`;
    const investor = await prisma.investor.create({ data: { fullName: "Ledger Csv Investor", email: `ledger-csv-${suffix}@example.com`, status: "ACTIVE" } });
    const allocation = await prisma.allocation.create({ data: { investorId: investor.id, supplyCode: `LEDGER-CSV-${suffix}`, productName: "CSV batch", allocationAmount: "5000", status: "SELLING" } });

    await createLedgerEntry({ ledgerType: "CASH", allocationId: allocation.id, entryType: "SUPPLIER_PAYMENT", amount: "1200", currency: "USD", occurredAt: new Date("2026-06-02T00:00:00.000Z"), sourceType: "ALLOCATION", sourceId: "source,with-comma", description: "Supplier \"quoted\" payment\nnext line", metadataJson: JSON.stringify({ secretToken: "do-not-export" }), createdBy: "admin" });
    await createLedgerEntry({ ledgerType: "CASH", allocationId: allocation.id, entryType: "REFUND", amount: "-50", currency: "USD", occurredAt: new Date("2026-06-03T00:00:00.000Z"), sourceType: "MANUAL_ADJUSTMENT", sourceId: "=formula-source", description: "+formula description", createdBy: "admin" });
    await createLedgerEntry({ ledgerType: "INVENTORY", allocationId: allocation.id, entryType: "UNITS_RECEIVED", amount: "0", quantity: 2, occurredAt: new Date("2026-06-01T00:00:00.000Z"), sourceType: "ALLOCATION", description: "Inventory row", createdBy: "admin" });

    const filtered = await getLedgerEntriesForAllocation(allocation.id, { ledgerType: "CASH" });
    const csv = exportLedgerEntriesToCsv(filtered.entries);

    expect(filtered.entries).toHaveLength(2);
    expect(filtered.entries[0]?.entryType).toBe("REFUND");
    expect(csv).toContain("occurredAt,ledgerType,entryType,amount,currency,quantity,unitCost,sourceType,sourceId,description,isReversal,reversesLedgerEntryId,correctedByLedgerEntryId,createdAt");
    expect(csv).toContain("\"source,with-comma\"");
    expect(csv).toContain("\"Supplier \"\"quoted\"\" payment\nnext line\"");
    expect(csv).toContain("'=formula-source");
    expect(csv).toContain("'+formula description");
    expect(csv).toContain("'-50");
    expect(csv).not.toContain("metadataJson");
    expect(csv).not.toContain("do-not-export");
  });

  it("creates sanitized audit metadata for ledger CSV exports", async () => {
    const suffix = `${Date.now()}-${Math.round(Math.random() * 100000)}`;
    const investor = await prisma.investor.create({ data: { fullName: "Ledger Csv Audit Investor", email: `ledger-csv-audit-${suffix}@example.com`, status: "ACTIVE" } });
    const allocation = await prisma.allocation.create({ data: { investorId: investor.id, supplyCode: `LEDGER-CSV-AUDIT-${suffix}`, productName: "CSV audit batch", allocationAmount: "5000", status: "SELLING" } });

    await createLedgerEntry({ ledgerType: "CASH", allocationId: allocation.id, entryType: "MARKETPLACE_SETTLEMENT", amount: "5200", currency: "USD", occurredAt: new Date("2026-06-04T00:00:00.000Z"), sourceType: "MARKETPLACE_SETTLEMENT", sourceId: "settlement-audit", description: "Settlement audit row", metadataJson: JSON.stringify({ secretToken: "csv-audit-secret" }), createdBy: "admin" });
    const filtered = await getLedgerEntriesForAllocation(allocation.id, { ledgerType: "CASH", minAmount: "5000", maxAmount: "5300", query: "settlement-audit" });
    const csv = exportLedgerEntriesToCsv(filtered.entries);

    const audit = await createLedgerCsvExportAuditEvent({
      actor: "admin",
      allocationId: allocation.id,
      appliedFilters: {
        ...filtered.appliedFilters,
        query: "=settlement-audit\nwith hidden details that should be normalized and truncated"
      },
      exportedRowCount: filtered.entries.length,
      reversalEntriesIncluded: filtered.entries.some((entry) => entry.isReversal)
    });

    const metadata = JSON.parse(audit.afterJson || "{}") as {
      allocationId?: string;
      exportedRowCount?: number;
      amountFiltersApplied?: boolean;
      queryFilterApplied?: boolean;
      reversalEntriesIncluded?: boolean;
      filters?: { query?: string | null; ledgerType?: string | null };
    };

    expect(csv).toContain("settlement-audit");
    expect(audit.action).toBe("EXPORT_LEDGER_CSV");
    expect(audit.entityType).toBe("Allocation");
    expect(audit.entityId).toBe(allocation.id);
    expect(metadata.allocationId).toBe(allocation.id);
    expect(metadata.exportedRowCount).toBe(1);
    expect(metadata.filters?.ledgerType).toBe("CASH");
    expect(metadata.filters?.query).toContain("'=settlement-audit with hidden details");
    expect(metadata.amountFiltersApplied).toBe(true);
    expect(metadata.queryFilterApplied).toBe(true);
    expect(metadata.reversalEntriesIncluded).toBe(false);
    expect(audit.afterJson).not.toContain("occurredAt,ledgerType");
    expect(audit.afterJson).not.toContain("metadataJson");
    expect(audit.afterJson).not.toContain("csv-audit-secret");
  });

  it("creates cash and investor liability ledger entries that affect reconciliation summary", async () => {
    const suffix = Date.now();
    const investor = await prisma.investor.create({ data: { fullName: "Ledger Cash Investor", email: `ledger-cash-${suffix}@example.com`, status: "ACTIVE" } });
    const allocation = await prisma.allocation.create({ data: { investorId: investor.id, supplyCode: `LEDGER-CASH-${suffix}`, productName: "Cash ledger batch", allocationAmount: "7000", status: "SELLING" } });

    const cashResult = await createLedgerEntry({ ledgerType: "CASH", allocationId: allocation.id, entryType: "SUPPLIER_PAYMENT", amount: "6200", currency: "USD", occurredAt: new Date("2026-06-01T00:00:00.000Z"), sourceType: "ALLOCATION", description: "Supplier payment", createdBy: "admin" });
    const liabilityResult = await createLedgerEntry({ ledgerType: "INVESTOR_LIABILITY", allocationId: allocation.id, entryType: "CAPITAL_ALLOCATED", amount: "7000", currency: "USD", occurredAt: new Date("2026-06-01T00:00:00.000Z"), sourceType: "ALLOCATION", description: "Capital allocated", createdBy: "admin" });

    expect(cashResult.ok).toBe(true);
    expect(liabilityResult.ok).toBe(true);

    const entries = await prisma.ledgerEntry.findMany({ where: { allocationId: allocation.id } });
    const reconciliation = calculateAllocationReconciliationFromEntries({ allocationId: allocation.id, allocationStatus: allocation.status, entries });

    expect(reconciliation.ledgerSummary.cash.supplierPayments).toBe(6200);
    expect(reconciliation.ledgerSummary.investorLiability.capitalAllocated).toBe(7000);
  });

  it("investor reconciliation includes only that investor's allocations", async () => {
    const suffix = Date.now();
    const firstInvestor = await prisma.investor.create({ data: { fullName: "Ledger Investor A", email: `ledger-a-${suffix}@example.com`, status: "ACTIVE" } });
    const secondInvestor = await prisma.investor.create({ data: { fullName: "Ledger Investor B", email: `ledger-b-${suffix}@example.com`, status: "ACTIVE" } });
    const firstAllocation = await prisma.allocation.create({ data: { investorId: firstInvestor.id, supplyCode: `LEDGER-A-${suffix}`, productName: "A batch", allocationAmount: "5000", status: "SELLING" } });
    const secondAllocation = await prisma.allocation.create({ data: { investorId: secondInvestor.id, supplyCode: `LEDGER-B-${suffix}`, productName: "B batch", allocationAmount: "5000", status: "SELLING" } });
    await prisma.ledgerEntry.createMany({ data: [
      { ledgerType: "INVESTOR_LIABILITY", investorId: firstInvestor.id, allocationId: firstAllocation.id, entryType: "CAPITAL_ALLOCATED", amount: "5000", occurredAt: new Date(), sourceType: "ALLOCATION", description: "A capital", createdBy: "admin" },
      { ledgerType: "INVESTOR_LIABILITY", investorId: secondInvestor.id, allocationId: secondAllocation.id, entryType: "CAPITAL_ALLOCATED", amount: "9000", occurredAt: new Date(), sourceType: "ALLOCATION", description: "B capital", createdBy: "admin" }
    ] });

    const result = await calculateInvestorReconciliation(firstInvestor.id);
    expect(result.allocationCount).toBe(1);
    expect(result.ledgerSummary.investorLiability.capitalAllocated).toBe(5000);
  });
});
