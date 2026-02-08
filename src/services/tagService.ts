/**
 * Tag Service
 * Handles tag browsing, searching, and evaluation
 */

import { Tag, ProfitPlay } from "../types";
import api from "./api";

// =============================================================================
// Knowledge Level System
// =============================================================================

export type KnowledgeLevel = "basic" | "medium" | "high";

/**
 * Create a tag with default metadata values
 */
function createTag(
    id: string,
    name: string,
    tier: 1 | 2 | 3 | 4 | 5,
    gapPotential: number,
    saturation: number,
    scopeBias: "SOLO" | "TEAM" | "ENTERPRISE"
): Tag {
    return {
        id,
        name,
        type: "surface",
        status: "ACTIVE",
        selectable: true,
        synonyms: [],
        exclude_terms: [],
        why_gap_rich: "",
        example_complaint_queries: [],
        metadata: {
            tier,
            gap_potential_score: gapPotential,
            gap_density_score: gapPotential - 10,
            saturation_score: saturation,
            wtp_score: 70,
            evidence_volume: 50,
            trend_direction: "RISING",
            scope_bias: scopeBias,
            last_verified_at: new Date().toISOString(),
        },
    };
}

// Pre-defined tags for each knowledge level (curated high-friction surfaces)
const LEVEL_TAGS: Record<KnowledgeLevel, Tag[]> = {
    basic: [
        createTag("creator-economy", "Creator Economy", 5, 95, 45, "SOLO"),
        createTag("content-repurposing", "Content Repurposing", 5, 92, 38, "SOLO"),
        createTag("social-scheduling", "Social Scheduling", 4, 88, 62, "SOLO"),
        createTag("newsletter-ops", "Newsletter Operations", 4, 85, 40, "SOLO"),
        createTag("podcast-workflow", "Podcast Workflow", 4, 87, 35, "SOLO"),
        createTag("video-editing", "Video Editing Automation", 4, 90, 50, "SOLO"),
        createTag("influencer-collabs", "Influencer Collaborations", 3, 78, 55, "TEAM"),
        createTag("monetization-tools", "Monetization Tools", 5, 94, 48, "SOLO"),
        createTag("community-building", "Community Building", 4, 86, 42, "TEAM"),
        createTag("affiliate-tracking", "Affiliate Tracking", 3, 75, 58, "SOLO"),
        createTag("course-creation", "Course Creation", 4, 84, 52, "SOLO"),
        createTag("lead-magnets", "Lead Magnets", 3, 72, 65, "SOLO"),
        createTag("email-sequences", "Email Sequences", 4, 80, 55, "TEAM"),
        createTag("webinar-funnels", "Webinar Funnels", 3, 76, 60, "SOLO"),
        createTag("freelance-ops", "Freelance Operations", 4, 82, 45, "SOLO"),
        createTag("coaching-business", "Coaching Business", 4, 83, 48, "SOLO"),
        createTag("digital-products", "Digital Products", 5, 91, 50, "SOLO"),
        createTag("membership-sites", "Membership Sites", 4, 85, 52, "TEAM"),
    ],
    medium: [
        createTag("revenue-ops", "Revenue Operations", 5, 93, 40, "TEAM"),
        createTag("sales-enablement", "Sales Enablement", 4, 86, 55, "TEAM"),
        createTag("pipeline-management", "Pipeline Management", 4, 84, 58, "TEAM"),
        createTag("contract-lifecycle", "Contract Lifecycle", 4, 88, 35, "ENTERPRISE"),
        createTag("invoice-automation", "Invoice Automation", 3, 75, 62, "TEAM"),
        createTag("expense-tracking", "Expense Tracking", 3, 72, 68, "TEAM"),
        createTag("vendor-management", "Vendor Management", 4, 82, 45, "ENTERPRISE"),
        createTag("procurement-workflow", "Procurement Workflow", 4, 85, 38, "ENTERPRISE"),
        createTag("customer-success", "Customer Success", 5, 90, 48, "TEAM"),
        createTag("churn-prevention", "Churn Prevention", 5, 92, 42, "TEAM"),
        createTag("onboarding-flows", "Onboarding Flows", 4, 87, 50, "TEAM"),
        createTag("support-ticketing", "Support Ticketing", 3, 70, 72, "TEAM"),
        createTag("knowledge-base", "Knowledge Base", 3, 68, 70, "TEAM"),
        createTag("feedback-loops", "Feedback Loops", 4, 80, 45, "TEAM"),
        createTag("nps-tracking", "NPS Tracking", 3, 65, 65, "ENTERPRISE"),
        createTag("product-analytics", "Product Analytics", 4, 83, 55, "TEAM"),
    ],
    high: [
        createTag("data-pipelines", "Data Pipelines", 5, 94, 40, "ENTERPRISE"),
        createTag("etl-orchestration", "ETL Orchestration", 5, 91, 45, "ENTERPRISE"),
        createTag("api-integration", "API Integration", 4, 88, 52, "TEAM"),
        createTag("webhook-management", "Webhook Management", 4, 85, 38, "TEAM"),
        createTag("infrastructure-monitoring", "Infrastructure Monitoring", 4, 82, 58, "ENTERPRISE"),
        createTag("log-aggregation", "Log Aggregation", 3, 75, 62, "ENTERPRISE"),
        createTag("security-compliance", "Security Compliance", 5, 95, 35, "ENTERPRISE"),
        createTag("access-control", "Access Control", 4, 86, 48, "ENTERPRISE"),
        createTag("secrets-management", "Secrets Management", 4, 89, 32, "ENTERPRISE"),
        createTag("ci-cd-pipelines", "CI/CD Pipelines", 4, 80, 60, "TEAM"),
        createTag("deployment-automation", "Deployment Automation", 4, 83, 55, "TEAM"),
        createTag("container-orchestration", "Container Orchestration", 4, 78, 58, "ENTERPRISE"),
        createTag("database-ops", "Database Operations", 4, 84, 50, "ENTERPRISE"),
        createTag("backup-recovery", "Backup & Recovery", 3, 72, 55, "ENTERPRISE"),
        createTag("performance-optimization", "Performance Optimization", 4, 81, 48, "TEAM"),
        createTag("cost-optimization", "Cloud Cost Optimization", 5, 93, 38, "ENTERPRISE"),
    ],
};

// Pre-defined profit plays
const PROFIT_PLAYS: ProfitPlay[] = [
    { id: "pp-saas", title: "Vertical SaaS", one_liner: "Niche-specific software with recurring revenue", category: "BASIC", relevant_keywords: ["creator-economy", "revenue-ops", "customer-success"] },
    { id: "pp-marketplace", title: "Two-Sided Marketplace", one_liner: "Connect supply and demand with transaction fees", category: "BASIC", relevant_keywords: ["influencer-collabs", "freelance-ops", "vendor-management"] },
    { id: "pp-api", title: "API-as-a-Service", one_liner: "Developer tools with usage-based pricing", category: "EXPERT", relevant_keywords: ["api-integration", "data-pipelines", "webhook-management"] },
    { id: "pp-platform", title: "Platform Play", one_liner: "Enable others to build on top of your infrastructure", category: "EXPERT", relevant_keywords: ["etl-orchestration", "ci-cd-pipelines", "infrastructure-monitoring"] },
    { id: "pp-template", title: "Productized Templates", one_liner: "Pre-built solutions for specific workflows", category: "BASIC", relevant_keywords: ["email-sequences", "webinar-funnels", "onboarding-flows"] },
    { id: "pp-agency", title: "Productized Service", one_liner: "Standardized service with software layer", category: "MEDIUM", relevant_keywords: ["content-repurposing", "video-editing", "coaching-business"] },
    { id: "pp-data", title: "Data-as-a-Service", one_liner: "Curated data feeds for specific industries", category: "MEDIUM", relevant_keywords: ["product-analytics", "churn-prevention", "nps-tracking"] },
    { id: "pp-community", title: "Paid Community", one_liner: "Exclusive access with membership model", category: "BASIC", relevant_keywords: ["community-building", "membership-sites", "course-creation"] },
];

// =============================================================================
// Service Functions
// =============================================================================

/**
 * Get tags for a specific knowledge level
 */
export function getTagsByLevel(level: KnowledgeLevel): Tag[] {
    return LEVEL_TAGS[level] || [];
}

/**
 * Search tags by query string (local + API fallback)
 */
export async function searchTags(query: string): Promise<Tag[]> {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    // First search local tags
    const allLocalTags = [
        ...LEVEL_TAGS.basic,
        ...LEVEL_TAGS.medium,
        ...LEVEL_TAGS.high,
    ];

    const localMatches = allLocalTags.filter(
        (tag) =>
            tag.name.toLowerCase().includes(q) ||
            tag.id.toLowerCase().includes(q)
    );

    if (localMatches.length > 0) {
        return localMatches.slice(0, 8);
    }

    // If no local matches, try API
    try {
        const results = await api.get<Tag[]>(`/tags/search?q=${encodeURIComponent(q)}`);
        return results.slice(0, 8);
    } catch {
        return [];
    }
}

/**
 * Evaluate a custom tag input (calls backend)
 */
export async function evaluateTag(input: string): Promise<Tag> {
    try {
        const result = await api.post<Tag>("/tags/evaluate", { query: input });
        return result;
    } catch {
        // Fallback: create a provisional tag locally
        return {
            id: `custom-${Date.now()}`,
            name: input,
            type: "surface",
            status: "PROVISIONAL",
            selectable: true,
            synonyms: [],
            exclude_terms: [],
            why_gap_rich: "",
            example_complaint_queries: [],
            metadata: {
                tier: 3,
                gap_potential_score: 70,
                gap_density_score: 60,
                saturation_score: 50,
                wtp_score: 60,
                evidence_volume: 30,
                trend_direction: "STABLE",
                scope_bias: "TEAM",
                last_verified_at: new Date().toISOString(),
            },
        };
    }
}

/**
 * Get relevant profit plays based on selected tags
 */
export function getRelevantProfitPlays(tags: Tag[]): ProfitPlay[] {
    if (!tags.length) return [];

    const tagIds = tags.map((t) => t.id);

    // Score each play by how many related tags match
    const scored = PROFIT_PLAYS.map((play) => {
        const matchCount = (play.relevant_keywords || []).filter((rt) =>
            tagIds.includes(rt)
        ).length;
        return { play, matchCount };
    });

    // Return top 4 plays that have at least one match, or top 4 if none match
    const matched = scored.filter((s) => s.matchCount > 0);
    if (matched.length > 0) {
        return matched
            .sort((a, b) => b.matchCount - a.matchCount)
            .slice(0, 4)
            .map((s) => s.play);
    }

    // Fallback: return first 4 profit plays
    return PROFIT_PLAYS.slice(0, 4);
}
