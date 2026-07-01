import { generateSecret, generateURI, verifySync } from "otplib";

const ISSUER = "OTIZ CAPITAL";
const ACCOUNT = "admin";

// TOTP-based 2FA for admin login. The secret lives in ADMIN_TOTP_SECRET.
// When it is not set, 2FA is skipped (backward compatibility during setup).
export function isAdminTotpEnabled() {
  return Boolean(process.env.ADMIN_TOTP_SECRET);
}

export function verifyAdminTotp(code: string): boolean {
  const secret = process.env.ADMIN_TOTP_SECRET;
  if (!secret || !code) return false;
  const normalized = code.replace(/[^0-9]/g, "");
  if (normalized.length !== 6) return false;
  try {
    return verifySync({ token: normalized, secret }).valid;
  } catch {
    return false;
  }
}

// Generates a candidate secret + otpauth URI for the setup page (to be scanned
// and then persisted into ADMIN_TOTP_SECRET by an operator).
export function generateAdminTotpSetup() {
  const secret = generateSecret();
  const otpauthUrl = generateURI({ issuer: ISSUER, label: ACCOUNT, secret });
  return { secret, otpauthUrl };
}
