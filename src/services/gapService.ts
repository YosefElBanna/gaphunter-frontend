import { Tag, GapScanResult } from "../types";
import api from "./api";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type StartScanResponse = {
  scanId: string;
};

type ScanStatusResponse = {
  id: string;
  status: "RUNNING" | "SUCCESS" | "FAILED" | "QUEUED";
  result: any | null;
  errorMessage?: string | null;
};

export async function findGaps(
  tags: Tag[],
  excludedTerms: string[] = []
): Promise<GapScanResult & { scanId: string }> {
  const tagNames = tags.map((t) => t.name);

  // 1) Start scan - api client returns response directly (no .data wrapper)
  const startResponse = await api.post<StartScanResponse>("/scans", {
    tags: tagNames,
    excludedTerms,
  });

  if (!startResponse.scanId) {
    throw new Error("Backend did not return scanId.");
  }

  const scanId = startResponse.scanId;

  // 2) Poll until finished
  const TIMEOUT_MS = 120_000; // 2 minutes
  const startedAt = Date.now();
  let delay = 1200; // Start at 1.2s

  while (true) {
    // Wait before polling (prevents immediate hammering)
    await sleep(delay);

    // Check timeout AFTER sleep to prevent hanging on last request
    if (Date.now() - startedAt > TIMEOUT_MS) {
      throw new Error("Scan timed out after 2 minutes. Please try again.");
    }

    // api client returns response directly (no .data wrapper)
    const scan = await api.get<ScanStatusResponse>(`/scans/${scanId}`);

    if (scan.status === "FAILED") {
      throw new Error(scan.errorMessage || "Scan failed.");
    }

    if (scan.status === "SUCCESS") {
      if (!scan.result) {
        throw new Error("Scan finished but result is empty.");
      }

      // Return the result with scanId attached
      return { ...(scan.result as GapScanResult), scanId };
    }

    // RUNNING / QUEUED - increase delay exponentially up to 3s
    delay = Math.min(3000, Math.floor(delay * 1.15));
  }
}
