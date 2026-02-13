import { Tag, GapScanResult } from "../types";
import api from "./api";

/** Abortable sleep — rejects with AbortError if signal fires */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = setTimeout(resolve, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

type StartScanResponse = {
  scanId: string;
};

type ScanStatusResponse = {
  id: string;
  status: "RUNNING" | "SUCCESS" | "FAILED" | "QUEUED";
  result: any | null;
  errorMessage?: string | null;
  stage?: string; // e.g. "EXPAND", "GENERATE", "RANK", "VERIFY" — optional from backend
};

export interface ScanProgress {
  scanId: string;
  stage?: string;
  status: "RUNNING" | "QUEUED";
  elapsedMs: number;
}

export interface FindGapsOptions {
  signal?: AbortSignal;
  onProgress?: (progress: ScanProgress) => void;
}

/** Configurable polling timeout: VITE_SCAN_POLL_TIMEOUT_MS env var, fallback 300 000 ms (5 min) */
const POLL_TIMEOUT_MS: number = (() => {
  const env = (import.meta as any)?.env?.VITE_SCAN_POLL_TIMEOUT_MS;
  const parsed = env ? parseInt(String(env), 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 300_000;
})();

export async function findGaps(
  tags: Tag[],
  excludedTerms: string[] = [],
  options?: FindGapsOptions
): Promise<GapScanResult & { scanId: string }> {
  const { signal, onProgress } = options ?? {};
  const tagNames = tags.map((t) => t.name);

  // 1) Start scan
  const startResponse = await api.post<StartScanResponse>("/scans", {
    tags: tagNames,
    excludedTerms,
  }, { signal });

  if (!startResponse.scanId) {
    throw new Error("Backend did not return scanId.");
  }

  const scanId = startResponse.scanId;

  // Report scanId immediately so caller can track it
  onProgress?.({ scanId, stage: undefined, status: "QUEUED", elapsedMs: 0 });

  // 2) Poll until finished
  const startedAt = Date.now();
  let delay = 1200;

  while (true) {
    await sleep(delay, signal);

    const elapsed = Date.now() - startedAt;
    if (elapsed > POLL_TIMEOUT_MS) {
      throw new Error(
        `Scan timed out after ${Math.round(POLL_TIMEOUT_MS / 1000)}s. Please try again with fewer topics.`
      );
    }

    const scan = await api.get<ScanStatusResponse>(`/scans/${scanId}`, { signal });

    if (scan.status === "FAILED") {
      throw new Error(scan.errorMessage || "Scan failed.");
    }

    if (scan.status === "SUCCESS") {
      if (!scan.result) {
        throw new Error("Scan finished but result is empty.");
      }
      return { ...(scan.result as GapScanResult), scanId };
    }

    // RUNNING / QUEUED — report progress to caller
    onProgress?.({
      scanId,
      stage: scan.stage,
      status: scan.status,
      elapsedMs: elapsed,
    });

    delay = Math.min(3000, Math.floor(delay * 1.15));
  }
}
