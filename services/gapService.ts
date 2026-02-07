/**
 * Gap Service
 * Handles gap scanning and analysis via backend API
 */

import { Tag, GapScanResult } from "../types";
import api from "../src/services/api";

/**
 * Find gaps based on selected tags and exclusions
 * Calls the backend API to perform the scan
 */
export async function findGaps(
    tags: Tag[],
    excludedTerms: string[] = []
): Promise<GapScanResult> {
    const tagNames = tags.map((t) => t.name);

    const response = await api.post<GapScanResult>("/scan", {
        tags: tagNames,
        excludedTerms,
    });

    return response;
}

/**
 * Get scan status by ID
 */
export async function getScanStatus(scanId: string): Promise<{
    status: string;
    progress?: number;
    results?: GapScanResult;
}> {
    return api.get(`/scans/${scanId}/status`);
}

/**
 * Cancel an in-progress scan
 */
export async function cancelScan(scanId: string): Promise<void> {
    await api.delete(`/scans/${scanId}`);
}
