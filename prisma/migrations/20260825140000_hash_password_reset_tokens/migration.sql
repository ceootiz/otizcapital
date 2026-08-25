-- Existing reset links cannot be transformed safely without retaining their
-- bearer value. Invalidate them before converting the column to digest-only
-- storage; users can request a fresh link after deployment.
DELETE FROM "PasswordResetToken";

ALTER TABLE "PasswordResetToken"
  RENAME COLUMN "token" TO "tokenHash";

ALTER INDEX "PasswordResetToken_token_key"
  RENAME TO "PasswordResetToken_tokenHash_key";

ALTER INDEX "PasswordResetToken_token_idx"
  RENAME TO "PasswordResetToken_tokenHash_idx";
