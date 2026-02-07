import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  AdminOverviewResponse,
  AdminScansListResponse,
  AdminTrendsResponseItem,
} from "../../types";
import { ShieldAlert, KeyRound, RefreshCcw, Trash2 } from "lucide-react";

const RAW_API_BASE =
  (import.meta as any)?.env?.VITE_API_BASE ?? "http://localhost:3001/api";

// normalize: remove trailing slash
const API_BASE = String(RAW_API_BASE).replace(/\/+$/, "");

const LS_ADMIN_KEY = "gaphunter-admin-key";

function formatPct(x: number) {
  if (!Number.isFinite(x)) return "0%";
  return `${x.toFixed(1)}%`;
}

function formatDateTime(isoOrDate: any) {
  try {
    const d = isoOrDate instanceof Date ? isoOrDate : new Date(String(isoOrDate));
    if (Number.isNaN(d.getTime())) return String(isoOrDate);
    return d.toLocaleString();
  } catch {
    return String(isoOrDate);
  }
}

function MiniBarChart({ data }: { data: Array<{ label: string; value: number }> }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <div className="w-28 text-xs text-brand-muted truncate">{d.label}</div>
          <div className="flex-1 h-2 bg-brand-border/40 rounded">
            <div
              className="h-2 bg-brand-accent rounded"
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
          <div className="w-12 text-xs text-brand-text text-right tabular-nums">
            {d.value}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [adminKey, setAdminKey] = useState<string>(() => {
    // safer default: session first, then local
    return (
      sessionStorage.getItem(LS_ADMIN_KEY) ||
      localStorage.getItem(LS_ADMIN_KEY) ||
      ""
    );
  });

  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [scans, setScans] = useState<AdminScansListResponse | null>(null);
  const [trends, setTrends] = useState<AdminTrendsResponseItem[] | null>(null);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const headers = useMemo(() => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    const k = adminKey.trim();
    if (k) h["x-admin-key"] = k;
    return h;
  }, [adminKey]);

  const fetchAll = useCallback(async () => {
    const k = adminKey.trim();
    if (!k) {
      setErr("Enter the Admin Key first.");
      return;
    }

    setLoading(true);
    setErr(null);

    try {
      const [o, s, t] = await Promise.all([
        fetch(`${API_BASE}/admin/analytics/overview`, { headers }),
        fetch(`${API_BASE}/admin/analytics/scans?limit=50`, { headers }),
        fetch(`${API_BASE}/admin/analytics/trends`, { headers }),
      ]);

      // better errors
      if (o.status === 401 || s.status === 401 || t.status === 401) {
        throw new Error("Unauthorized (401). Wrong Admin Key.");
      }
      if (!o.ok) throw new Error(`Overview failed (${o.status})`);
      if (!s.ok) throw new Error(`Scans failed (${s.status})`);
      if (!t.ok) throw new Error(`Trends failed (${t.status})`);

      const oJson = (await o.json()) as AdminOverviewResponse;
      const sJson = (await s.json()) as AdminScansListResponse;
      const tJson = (await t.json()) as AdminTrendsResponseItem[];

      setOverview(oJson);
      setScans(sJson);
      setTrends(tJson);
    } catch (e: any) {
      setErr(e?.message || "Failed to load admin analytics.");
      setOverview(null);
      setScans(null);
      setTrends(null);
    } finally {
      setLoading(false);
    }
  }, [adminKey, headers]);

  useEffect(() => {
    // Auto load if key already exists
    if (adminKey.trim()) fetchAll();
  }, []); // intentional: only first mount

  const saveKey = () => {
    const k = adminKey.trim();
    if (!k) return;

    // ✅ safer default: sessionStorage
    sessionStorage.setItem(LS_ADMIN_KEY, k);

    // ✅ optional convenience: also store in localStorage
    localStorage.setItem(LS_ADMIN_KEY, k);

    setErr(null);
    fetchAll();
  };

  const clearKey = () => {
    sessionStorage.removeItem(LS_ADMIN_KEY);
    localStorage.removeItem(LS_ADMIN_KEY);
    setAdminKey("");
    setOverview(null);
    setScans(null);
    setTrends(null);
    setErr(null);
  };

  const statusBars = useMemo(() => {
    if (!overview) return [];
    const entries = Object.entries(overview.scansByStatus || {});
    return entries
      .map(([k, v]) => ({ label: k, value: Number(v) || 0 }))
      .sort((a, b) => b.value - a.value);
  }, [overview]);

  const topTags = useMemo(() => {
    return (overview?.topTags || []).slice(0, 10).map((x) => ({
      label: x.tag,
      value: x.count,
    }));
  }, [overview]);

  const topPlays = useMemo(() => {
    return (overview?.topProfitPlays || []).slice(0, 10).map((x) => ({
      label: x.profitPlay || "Unknown",
      value: x.count,
    }));
  }, [overview]);

  const trendBars = useMemo(() => {
    if (!trends) return [];
    const last = trends.slice(-14);
    return last.map((x) => ({ label: x.date.slice(5), value: x.count }));
  }, [trends]);

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-brand-muted uppercase tracking-widest">
              Admin Only
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">
              Analytics Dashboard
            </h1>
            <p className="text-sm text-brand-muted mt-1">
              Database-backed metrics from stored scans.
            </p>
            <p className="text-[11px] text-brand-muted mt-1">
              API: <span className="font-mono">{API_BASE}</span>
            </p>
          </div>

          <button
            onClick={fetchAll}
            disabled={loading || !adminKey.trim()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded border border-brand-border bg-brand-card/20 hover:bg-brand-card/40 disabled:opacity-50"
          >
            <RefreshCcw size={16} />
            <span className="text-sm">Refresh</span>
          </button>
        </div>

        {/* Admin Key */}
        <div className="p-4 rounded-xl border border-brand-border bg-brand-card/20">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <KeyRound size={16} className="text-brand-accent" />
              Admin Key
            </div>

            <input
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Enter x-admin-key"
              className="flex-1 px-3 py-2 rounded bg-brand-bg border border-brand-border outline-none"
            />

            <button
              onClick={saveKey}
              className="px-4 py-2 rounded bg-brand-accent text-black font-semibold"
              disabled={!adminKey.trim()}
            >
              Save & Load
            </button>

            <button
              onClick={clearKey}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded border border-brand-border bg-brand-card/10 hover:bg-brand-card/30"
              title="Clear saved key"
            >
              <Trash2 size={16} />
            </button>
          </div>

          {err && (
            <div className="mt-3 flex items-center gap-2 text-sm text-brand-danger">
              <ShieldAlert size={16} />
              <span>{err}</span>
            </div>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-brand-border bg-brand-card/20">
            <div className="text-xs text-brand-muted">Total Scans</div>
            <div className="text-2xl font-bold tabular-nums">
              {overview?.totalScans ?? "—"}
            </div>
          </div>
          <div className="p-4 rounded-xl border border-brand-border bg-brand-card/20">
            <div className="text-xs text-brand-muted">Total Users</div>
            <div className="text-2xl font-bold tabular-nums">
              {overview?.totalUsers ?? "—"}
            </div>
          </div>
          <div className="p-4 rounded-xl border border-brand-border bg-brand-card/20">
            <div className="text-xs text-brand-muted">Success Rate</div>
            <div className="text-2xl font-bold tabular-nums">
              {overview ? formatPct(overview.successRate) : "—"}
            </div>
          </div>
          <div className="p-4 rounded-xl border border-brand-border bg-brand-card/20">
            <div className="text-xs text-brand-muted">Status Mix</div>
            <div className="mt-2">
              {overview ? (
                <MiniBarChart data={statusBars.slice(0, 4)} />
              ) : (
                <div className="text-sm text-brand-muted">—</div>
              )}
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-brand-border bg-brand-card/20">
            <div className="text-sm font-semibold mb-3">Top Tags</div>
            {overview ? <MiniBarChart data={topTags} /> : <div className="text-sm text-brand-muted">—</div>}
          </div>

          <div className="p-4 rounded-xl border border-brand-border bg-brand-card/20">
            <div className="text-sm font-semibold mb-3">Top Profit Plays</div>
            {overview ? <MiniBarChart data={topPlays} /> : <div className="text-sm text-brand-muted">—</div>}
          </div>

          <div className="p-4 rounded-xl border border-brand-border bg-brand-card/20">
            <div className="text-sm font-semibold mb-3">Trends (Last 14 Days)</div>
            {trends ? <MiniBarChart data={trendBars} /> : <div className="text-sm text-brand-muted">—</div>}
          </div>
        </div>

        {/* Recent Scans Table */}
        <div className="p-4 rounded-xl border border-brand-border bg-brand-card/20 overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Recent Scans</div>
            {loading && <div className="text-xs text-brand-muted">Loading…</div>}
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-brand-muted uppercase">
                <tr className="border-b border-brand-border/60">
                  <th className="py-2 pr-3 text-left">Started</th>
                  <th className="py-2 pr-3 text-left">Status</th>
                  <th className="py-2 pr-3 text-left">ProfitPlay</th>
                  <th className="py-2 pr-3 text-right">Tags</th>
                  <th className="py-2 pr-3 text-right">Duration</th>
                  <th className="py-2 pr-3 text-left">Error</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-brand-border/30">
                {(scans?.items || []).map((row) => (
                  <tr key={row.id} className="hover:bg-brand-card/30">
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {formatDateTime(row.startedAt)}
                    </td>
                    <td className="py-2 pr-3">
                      <span className="px-2 py-0.5 rounded border border-brand-border text-xs">
                        {row.status}
                      </span>
                    </td>
                    <td className="py-2 pr-3">{row.profitPlay || "—"}</td>
                    <td className="py-2 pr-3">
                      <div className="flex flex-wrap gap-1 justify-end">
                        {row.tags.slice(0, 3).map((t, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-brand-accent/10 text-brand-accent text-[10px] border border-brand-accent/20 truncate max-w-[100px]">
                            {t}
                          </span>
                        ))}
                        {row.tags.length > 3 && (
                          <span className="text-[10px] text-brand-muted self-center">+{row.tags.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">
                      {row.durationSec != null ? `${row.durationSec}s` : "—"}
                    </td>
                    <td className="py-2 pr-3 text-xs text-brand-muted max-w-[360px] truncate">
                      {row.errorCode || row.errorMessage || "—"}
                    </td>
                  </tr>
                ))}

                {!scans?.items?.length && (
                  <tr>
                    <td className="py-6 text-center text-brand-muted" colSpan={6}>
                      No scans yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-xs text-brand-muted">
          Tip: This page is protected by{" "}
          <code className="px-1 py-0.5 border border-brand-border rounded">x-admin-key</code>.
        </div>
      </div>
    </div>
  );
}
