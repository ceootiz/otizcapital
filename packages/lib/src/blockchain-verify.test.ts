import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyTransaction } from "./blockchain-verify";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("verifyTransaction", () => {
  it("does not call a successful receipt verified without destination and amount proof", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ status: "1", result: { status: "1" } }), { status: 200 })));

    const result = await verifyTransaction("0xabc", "USDT ERC20", 100, ["0xotiz"]);

    expect(result.verified).toBe(false);
    expect(result.transactionConfirmed).toBe(true);
    expect(result.error).toContain("destination and amount");
  });

  it("verifies a confirmed TRC20 transfer only when destination and amount match", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            confirmed: true,
            contractRet: "SUCCESS",
            tokenTransferInfo: {
              amount_str: "100000000",
              decimals: 6,
              symbol: "USDT",
              to_address: "TOTIZ"
            }
          }),
          { status: 200 }
        )
      )
    );

    const result = await verifyTransaction("abc", "USDT TRC20", 100, ["TOTIZ"]);

    expect(result).toMatchObject({
      verified: true,
      transactionConfirmed: true,
      destinationMatches: true,
      amountMatches: true,
      amount: 100
    });
  });

  it("rejects a TRC20 amount mismatch", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            confirmed: true,
            contractRet: "SUCCESS",
            tokenTransferInfo: {
              amount_str: "99000000",
              decimals: 6,
              symbol: "USDT",
              to_address: "TOTIZ"
            }
          }),
          { status: 200 }
        )
      )
    );

    const result = await verifyTransaction("abc", "USDT TRC20", 100, ["TOTIZ"]);

    expect(result.verified).toBe(false);
    expect(result.amountMatches).toBe(false);
    expect(result.error).toContain("amount");
  });
});
