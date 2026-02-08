/**
 * Gap Service
 * Handles gap scanning and analysis via backend API
 */

import { Tag, GapScanResult } from "../types";
import api from "./api";

/**
 * Find gaps based on selected tags and exclusions
 * Calls the backend API to perform the scan
 */
export async function findGaps(
  tags: Tag[],
  excludedTerms: string[] = []
): Promise<GapScanResult> {
  const tagNames = tags.map((t) => t.name);

  // Backend expects POST /api/scans
  const response = await api.post<GapScanResult>("/scans", {
    tags: tagNames,
    excludedTerms,
  });

  return response;
}

/**
 * Get scan status by ID
 * NOTE:
 * Backend does NOT have /scans/:id/status
 * It has GET /scans/:id returning the scan object (status + result)
 */
export async function getScanStatus(
  scanId: string
): Promise<{
  status: string;
  progress?: number;
  results?: GapScanResult;
}> {
  const scan = await api.get<{
    id: string;
    status: string;
    result: any | null;
    errorCode?: string | null;
    errorMessage?: string | null;
  }>(`/scans/${scanId}`);

  // Map backend shape -> frontend expected shape
  // If your backend stores results as scan.result (may be null until complete)
  const results: GapScanResult | undefined =
    scan?.result && typeof scan.result === "object"
      ? (scan.result as GapScanResult)
      : undefined;

  // Optional: crude progress mapping from status
  const progress =
    scan.status === "RUNNING" ? 30 :
    scan.status === "SUCCESS" ? 100 :
    scan.status === "FAILED" ? 100 :
    undefined;

  return {
    status: scan.status,
    progress,
    results,
  };
}

/**
 * Cancel an in-progress scan
 * (Only keep this if backend actually supports DELETE /api/scans/:id)
 * If not supported, remove it or implement backend route.
 */
export async function cancelScan(scanId: string): Promise<void> {
  await api.delete(`/scans/${scanId}`);
}
