import { afterEach, describe, expect, it, vi } from "vitest";
import { getAdminTotpConfigurationError } from "./admin-totp";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getAdminTotpConfigurationError", () => {
  it("fails closed when production MFA is not configured", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ADMIN_TOTP_SECRET", "");

    expect(getAdminTotpConfigurationError()).toBe("ADMIN_TOTP_SECRET is required in production.");
  });

  it("accepts a configured production TOTP secret", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ADMIN_TOTP_SECRET", "test-secret");

    expect(getAdminTotpConfigurationError()).toBeNull();
  });

  it("keeps local development password-only when desired", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ADMIN_TOTP_SECRET", "");

    expect(getAdminTotpConfigurationError()).toBeNull();
  });
});
