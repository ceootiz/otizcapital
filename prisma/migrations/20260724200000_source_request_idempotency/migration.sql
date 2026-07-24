-- Store the client request identity on source records so legacy and canonical
-- money paths both reject duplicate submissions before a provider is connected.
ALTER TABLE "DepositNotification"
  ADD COLUMN "idempotencyKey" TEXT,
  ADD COLUMN "requestHash" TEXT;

ALTER TABLE "WithdrawalRequest"
  ADD COLUMN "idempotencyKey" TEXT,
  ADD COLUMN "requestHash" TEXT;

CREATE UNIQUE INDEX "DepositNotification_investorId_idempotencyKey_key"
  ON "DepositNotification"("investorId", "idempotencyKey");

CREATE UNIQUE INDEX "WithdrawalRequest_investorId_idempotencyKey_key"
  ON "WithdrawalRequest"("investorId", "idempotencyKey");
