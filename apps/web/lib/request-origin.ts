export function isTrustedRequestOrigin(origin: string | null, host: string | null, forwardedProto: string | null) {
  if (!origin) return true;
  if (!host) return false;

  try {
    const parsed = new URL(origin);
    const expectedHost = host.split(",")[0]?.trim();
    const expectedProtocol = (forwardedProto?.split(",")[0]?.trim() || "https").replace(/:$/u, "");
    return parsed.host === expectedHost && parsed.protocol === `${expectedProtocol}:`;
  } catch {
    return false;
  }
}
