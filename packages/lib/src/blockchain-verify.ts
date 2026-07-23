// Automatic on-chain verification for investor deposit claims.
//
// Uses free public block-explorer APIs (no key strictly required; Etherscan /
// BSCScan accept an optional key to lift rate limits). Every path is
// best-effort: a network error, timeout, non-200, or unknown network resolves
// to a non-throwing VerificationResult so a failed lookup can never block the
// admin from confirming manually.

export type VerificationResult = {
  verified: boolean;
  transactionConfirmed?: boolean;
  destinationMatches?: boolean;
  amountMatches?: boolean;
  // On-chain transferred amount in the asset's native unit (BTC, or the token
  // amount for USDT). Undefined when the chosen API does not expose an amount.
  amount?: number;
  // Symbol/unit for `amount` (e.g. "BTC", "USDT") — for display.
  assetSymbol?: string;
  confirmations?: number;
  error?: string;
  explorerUrl: string;
};

const REQUEST_TIMEOUT_MS = 10_000;

// Canonical deposit networks (mirror DEPOSIT_NETWORKS in @otiz/database).
export type DepositNetwork = "BTC" | "ETH" | "USDT TRC20" | "USDT ERC20" | "USDT BEP20";

// Human-facing explorer link for a tx on a given network. Always defined so the
// admin UI can offer a link even when the API lookup fails.
export function explorerUrlFor(network: string, txHash: string): string {
  const hash = encodeURIComponent(txHash.trim());
  switch (network) {
    case "BTC":
      return `https://blockstream.info/tx/${hash}`;
    case "ETH":
    case "USDT ERC20":
      return `https://etherscan.io/tx/${hash}`;
    case "USDT TRC20":
      return `https://tronscan.org/#/transaction/${hash}`;
    case "USDT BEP20":
      return `https://bscscan.com/tx/${hash}`;
    default:
      return "";
  }
}

// fetch with a hard timeout; throws on timeout/network error (caught by callers).
// Two layers: an AbortController cancels the request, and a Promise.race gives a
// guaranteed resolution ceiling in case the abort fails to interrupt a stalled
// socket — so verifyTransaction can never hang the confirm request.
async function fetchJson(url: string): Promise<{ ok: boolean; status: number; json: any }> {
  const controller = new AbortController();
  const abortTimer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let raceTimer: ReturnType<typeof setTimeout> | undefined;
  try {
    const response = (await Promise.race([
      fetch(url, { signal: controller.signal, headers: { accept: "application/json" } }),
      new Promise<never>((_resolve, reject) => {
        raceTimer = setTimeout(() => reject(new Error("timeout")), REQUEST_TIMEOUT_MS + 500);
      })
    ])) as Response;
    let json: any = null;
    try {
      json = await response.json();
    } catch {
      json = null;
    }
    return { ok: response.ok, status: response.status, json };
  } finally {
    clearTimeout(abortTimer);
    if (raceTimer) clearTimeout(raceTimer);
  }
}

// --- BTC (Blockstream) -----------------------------------------------------
async function verifyBtc(txHash: string, explorerUrl: string, expectedAddresses: string[]): Promise<VerificationResult> {
  const { ok, status, json } = await fetchJson(`https://blockstream.info/api/tx/${encodeURIComponent(txHash)}`);
  if (status === 404) return { verified: false, error: "Transaction not found", explorerUrl };
  if (!ok || !json || typeof json !== "object") return { verified: false, error: "API unavailable", explorerUrl };

  const confirmed = Boolean(json.status?.confirmed);
  const addressSet = new Set(expectedAddresses.map((address) => address.trim()).filter(Boolean));
  const matchedSats = Array.isArray(json.vout)
    ? json.vout.reduce(
        (sum: number, out: any) =>
          addressSet.has(String(out?.scriptpubkey_address || "").trim()) ? sum + (Number(out?.value) || 0) : sum,
        0
      )
    : 0;
  const destinationMatches = matchedSats > 0;
  return {
    verified: false,
    transactionConfirmed: confirmed,
    destinationMatches,
    amount: matchedSats > 0 ? matchedSats / 1e8 : undefined,
    assetSymbol: "BTC",
    error: !confirmed
      ? "Transaction not yet confirmed"
      : !destinationMatches
        ? "OTIZ deposit address was not found in transaction outputs"
        : "BTC amount cannot be compared with the USD deposit claim automatically",
    explorerUrl
  };
}

// --- Etherscan / BSCScan (EVM receipt status) ------------------------------
// gettxreceiptstatus returns only execution status (1 = success). It exposes no
// amount or confirmation count, so verified == the tx executed successfully.
async function verifyEvm(txHash: string, apiBase: string, apiKey: string | undefined, explorerUrl: string): Promise<VerificationResult> {
  const keyParam = apiKey ? `&apikey=${encodeURIComponent(apiKey)}` : "";
  const { ok, json } = await fetchJson(`${apiBase}?module=transaction&action=gettxreceiptstatus&txhash=${encodeURIComponent(txHash)}${keyParam}`);
  if (!ok || !json || typeof json !== "object") return { verified: false, error: "API unavailable", explorerUrl };

  // Explorer signals a key/rate problem via status "0" + a NOTOK message.
  if (json.status === "0" && typeof json.result === "string" && /api key|rate limit|max rate/i.test(json.result)) {
    return { verified: false, error: "API rate limited (set API key)", explorerUrl };
  }
  const receiptStatus = json.result?.status;
  if (receiptStatus === "1") {
    return {
      verified: false,
      transactionConfirmed: true,
      error: "Transaction succeeded, but destination and amount were not verified",
      explorerUrl
    };
  }
  if (receiptStatus === "0") return { verified: false, error: "Transaction failed on-chain", explorerUrl };
  // No receipt yet / unknown hash.
  return { verified: false, error: "Transaction not found or pending", explorerUrl };
}

// --- TronScan (TRC20) ------------------------------------------------------
function amountsMatch(actual: number | undefined, expected: number | undefined) {
  if (actual === undefined || expected === undefined || !Number.isFinite(actual) || !Number.isFinite(expected)) return false;
  return Math.abs(actual - expected) <= Math.max(0.01, expected * 0.000001);
}

async function verifyTron(
  txHash: string,
  explorerUrl: string,
  expectedAmount: number | undefined,
  expectedAddresses: string[]
): Promise<VerificationResult> {
  const { ok, json } = await fetchJson(`https://apilist.tronscanapi.com/api/transaction-info?hash=${encodeURIComponent(txHash)}`);
  if (!ok || !json || typeof json !== "object" || Object.keys(json).length === 0) {
    return { verified: false, error: "Transaction not found", explorerUrl };
  }

  const confirmed = Boolean(json.confirmed);
  const success = json.contractRet === "SUCCESS" || json.result === "SUCCESS";
  // TRC20 transfer amount, if present (token units via decimals).
  const transfer = json.tokenTransferInfo || (Array.isArray(json.trc20TransferInfo) ? json.trc20TransferInfo[0] : undefined);
  let amount: number | undefined;
  let assetSymbol: string | undefined;
  if (transfer && transfer.amount_str != null) {
    const decimals = Number(transfer.decimals ?? 6);
    const raw = Number(transfer.amount_str);
    if (Number.isFinite(raw)) amount = raw / 10 ** decimals;
    assetSymbol = typeof transfer.symbol === "string" ? transfer.symbol : "USDT";
  }
  const destination = String(transfer?.to_address || transfer?.toAddress || "").trim();
  const destinationMatches = expectedAddresses.some((address) => address.trim() === destination);
  const amountMatches = amountsMatch(amount, expectedAmount);
  const transactionConfirmed = confirmed && success;
  return {
    verified: transactionConfirmed && destinationMatches && amountMatches,
    transactionConfirmed,
    destinationMatches,
    amountMatches,
    amount,
    assetSymbol,
    error: !transactionConfirmed
      ? "Transaction not confirmed or unsuccessful"
      : !destinationMatches
        ? "Transaction destination does not match an active OTIZ deposit address"
        : !amountMatches
          ? "Transaction amount does not match the deposit claim"
          : undefined,
    explorerUrl
  };
}

// verifyTransaction — the single entry point used by the confirm route.
// Never throws: any failure resolves to { verified: false, error, explorerUrl }.
export async function verifyTransaction(
  txHash: string,
  network: string,
  expectedAmount?: number,
  expectedAddresses: string[] = []
): Promise<VerificationResult> {
  const explorerUrl = explorerUrlFor(network, txHash);
  const trimmed = (txHash || "").trim();
  if (!trimmed) return { verified: false, error: "No transaction hash provided", explorerUrl };

  try {
    switch (network) {
      case "BTC":
        return await verifyBtc(trimmed, explorerUrl, expectedAddresses);
      case "ETH":
      case "USDT ERC20":
        return await verifyEvm(trimmed, "https://api.etherscan.io/api", process.env.ETHERSCAN_API_KEY, explorerUrl);
      case "USDT BEP20":
        return await verifyEvm(trimmed, "https://api.bscscan.com/api", process.env.BSCSCAN_API_KEY, explorerUrl);
      case "USDT TRC20":
        return await verifyTron(trimmed, explorerUrl, expectedAmount, expectedAddresses);
      default:
        return { verified: false, error: `Unsupported network: ${network}`, explorerUrl };
    }
  } catch (error) {
    // Timeout (AbortError or the race guard) or any network failure lands here.
    const timedOut = error instanceof Error && (error.name === "AbortError" || error.message === "timeout");
    return { verified: false, error: timedOut ? "Verification timed out" : "API unavailable", explorerUrl };
  }
}
