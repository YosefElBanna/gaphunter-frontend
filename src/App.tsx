import { useEffect, useMemo, useRef, useState } from "react";
import type { Gap, GapStatus, Tag, ScanAnalysis } from "./types";

import SearchSurface from "../components/SearchSurface";
import GapCard from "../components/GapCard";
import GapDetail from "../components/GapDetail";
import ThemeSwitcher, { Theme } from "../components/ThemeSwitcher";
import Stepper from "../components/Stepper";
import DevTools from "../components/DevTools";

import AdminDashboard from "./pages/AdminDashboard";

import { findGaps } from "./services/gapService";
import * as tagService from "./services/tagService";

import {
  ArrowLeft,
  Home,
  Info,
  Loader2,
  Radar,
  Search,
  Shield,
  ShieldAlert,
  Target,
  X,
  CheckCircle2,
} from "lucide-react";

const App: React.FC = () => {
  const [path, setPath] = useState<string>(() => window.location.pathname);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const go = (to: string) => {
    if (window.location.pathname === to) return;
    window.history.pushState({}, "", to);
    setPath(to);
  };

  const isAdminRoute = useMemo(() => path === "/admin", [path]);

  const [theme, setTheme] = useState<Theme>("midnight");

  useEffect(() => {
    const savedTheme = localStorage.getItem("gaphunter-theme") as Theme | null;
    if (savedTheme && ["midnight", "ivory", "dawn"].includes(savedTheme)) {
      setTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "midnight" : "dawn");
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("gaphunter-theme", theme);
  }, [theme]);

  const [gaps, setGaps] = useState<Gap[]>([]);
  const [scanAnalysis, setScanAnalysis] = useState<ScanAnalysis | null>(null);
  const [selectedGapId, setSelectedGapId] = useState<string | null>(null);
  const [status, setStatus] = useState<GapStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [viewState, setViewState] = useState<"search" | "results">("search");
  const [currentScanId, setCurrentScanId] = useState<string | null>(null);
  const [scanStage, setScanStage] = useState<string | undefined>(undefined);

  // Toast State
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'error' | 'success' | 'info' }>>([]);

  const showToast = (message: string, type: 'error' | 'success' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  // Concurrency guard: abort previous scan, prevent stale state updates
  const scanAbortRef = useRef<AbortController | null>(null);
  const scanGenRef = useRef(0);

  // Cleanup: abort in-flight scan on unmount
  useEffect(() => {
    return () => { scanAbortRef.current?.abort(); };
  }, []);

  const handleSearch = async (tags: Tag[], excludedTerms: string[]) => {
    // console.log("[App] handleSearch triggered", { tags, excludedTerms });

    // Abort any in-flight scan
    scanAbortRef.current?.abort();
    const controller = new AbortController();
    scanAbortRef.current = controller;
    const thisGen = ++scanGenRef.current;
    const isStale = () => scanGenRef.current !== thisGen || controller.signal.aborted;

    setStatus("scanning");
    setErrorMsg(null);
    setGaps([]);
    setScanAnalysis(null);
    setSelectedGapId(null);
    setCurrentScanId(null);
    setScanStage(undefined);

    try {
      const results = await findGaps(tags, excludedTerms, {
        signal: controller.signal,
        onProgress: (p) => {
          if (isStale()) return;
          setScanStage(p.stage);
          setCurrentScanId(p.scanId);
        },
      });

      // Guard: ignore results from a superseded scan
      if (isStale()) return;

      if ((results as any).scanId) {
        setCurrentScanId((results as any).scanId);
      }

      setScanAnalysis(results.analysis || null);

      if (!results.gaps?.length) {
        setStatus("empty");
        return;
      }

      setGaps(results.gaps);
      setStatus("complete");
      setViewState("results");

      if (window.innerWidth >= 1024) {
        setSelectedGapId(results.gaps[0].id);
      }
    } catch (err: any) {
      // Silently ignore aborted scans (superseded by a new scan)
      if (isStale()) return;
      if (err instanceof DOMException && err.name === "AbortError") return;

      console.error(err);
      setStatus("error");

      let msg = err?.message || "Failed to connect to GapHunter Engine.";

      // User-friendly error mapping
      if (msg.includes("429") || msg.includes("quota")) {
        msg = "System is experiencing high traffic. Please try again in a moment.";
      } else if (msg.includes("500") || msg.includes("503")) {
        msg = "Engine is temporarily unavailable. We're working on it.";
      } else if (msg.includes("timed out")) {
        msg = "The analysis took too long. Try narrowing your topic.";
      }

      setErrorMsg(msg);
      showToast(msg, 'error');
    }
  };

  const handlePivot = async (surface: string) => {
    setStatus("scanning");
    try {
      const newTag = await tagService.evaluateTag(surface);
      await handleSearch([newTag], []);
    } catch {
      setStatus("idle");
    }
  };

  const selectedGap = useMemo(
    () => gaps.find((g) => g.id === selectedGapId) || null,
    [gaps, selectedGapId]
  );

  const getCurrentStep = () => {
    if (status === "idle") return 1;
    if (status === "scanning") return 2;
    if (status === "complete") return 3;
    return 1;
  };

  const resetSearch = () => {
    setStatus("idle");
    setViewState("search");
    setSelectedGapId(null);
    setGaps([]);
    setScanAnalysis(null);
    go("/");
  };

  if (isAdminRoute) {
    return (
      <div className="h-screen flex flex-col bg-brand-bg font-body text-brand-text overflow-hidden">
        <header className="flex-shrink-0 h-16 border-b border-brand-border/40 bg-brand-bg/80 backdrop-blur-md z-50">
          <div className="h-full px-4 md:px-6 flex items-center justify-between">
            <button
              onClick={() => go("/")}
              className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-brand-muted hover:text-brand-text transition-colors px-3 py-1.5 rounded border border-transparent hover:border-brand-border"
            >
              <Home size={14} /> Back to App
            </button>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 text-xs font-mono text-brand-muted">
                <Shield size={14} className="text-brand-accent" />
                Admin
              </div>
              <div className="h-6 w-px bg-brand-border hidden md:block" />
              <ThemeSwitcher currentTheme={theme} onThemeChange={setTheme} />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <AdminDashboard />
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-brand-bg font-body text-brand-text overflow-hidden">
      <header className="flex-shrink-0 h-16 border-b border-brand-border/40 bg-brand-bg/80 backdrop-blur-md z-50">
        <div className="h-full px-4 md:px-6 flex items-center justify-between">
          <div
            className="flex items-center gap-2 group cursor-pointer"
            onClick={() => window.location.reload()}
          >
            <Radar className="text-brand-accent group-hover:rotate-180 transition-transform duration-700" />
            <span className="font-display font-bold text-lg tracking-tighter text-brand-text">
              GAP
              <span className="text-brand-accent drop-shadow-[0_0_8px_rgba(var(--accent)/0.5)]">
                HUNTER
              </span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => go("/admin")}
              className="hidden md:flex items-center gap-2 text-xs font-mono font-bold uppercase text-brand-muted hover:text-brand-text transition-colors px-3 py-1.5 rounded border border-transparent hover:border-brand-border"
            >
              <Shield size={14} /> Admin
            </button>

            {viewState === "results" && (
              <button
                onClick={resetSearch}
                className="hidden md:flex items-center gap-2 text-xs font-mono font-bold uppercase text-brand-muted hover:text-brand-text transition-colors px-3 py-1.5 rounded border border-transparent hover:border-brand-border"
              >
                <Search size={14} /> New Search
              </button>
            )}

            <div className="h-6 w-px bg-brand-border hidden md:block" />
            <ThemeSwitcher currentTheme={theme} onThemeChange={setTheme} />
          </div>
        </div>
      </header>

      {/* Toasts */}
      <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border border-brand-border/50 backdrop-blur-md animate-in slide-in-from-right-full duration-300 ${t.type === "error"
              ? "bg-brand-danger/10 text-brand-danger"
              : "bg-brand-card text-brand-text"
              }`}
          >
            {t.type === "error" ? <ShieldAlert size={18} /> : <CheckCircle2 size={18} />}
            <span className="text-sm font-medium">{t.message}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
              className="ml-2 opacity-50 hover:opacity-100"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Main */}
      <main className="flex-1 overflow-hidden relative">
        {/* VIEW 1: SEARCH */}
        {viewState === "search" && (
          <div className="h-full overflow-y-auto custom-scrollbar">
            <div className="max-w-7xl mx-auto px-4 py-12">
              <Stepper currentStep={getCurrentStep()} />

              {/* Hero */}
              <div className="text-center mb-12">
                {status === "idle" && (
                  <div className="space-y-8 animate-in fade-in zoom-in-95 duration-700">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-accent/20 bg-brand-accent/5 backdrop-blur-sm mb-4">
                      <Target size={12} className="text-brand-accent" />
                      <span className="text-[10px] font-mono text-brand-accent font-bold tracking-widest uppercase">
                        Intelligent Market Research
                      </span>
                    </div>

                    <h1 className="font-display text-4xl md:text-5xl lg:text-7xl font-bold tracking-tighter text-brand-text leading-[1.0] max-w-4xl mx-auto">
                      Stop Guessing.
                      <br />
                      <span className="text-brand-accent">Build What's Missing.</span>
                    </h1>

                    <p className="text-brand-text/90 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-light">
                      Stop brainstorming. GapHunter scans millions of complaints to uncover{" "}
                      <strong className="text-brand-text font-semibold underline decoration-brand-accent/50 underline-offset-4">
                        structural failures
                      </strong>{" "}
                      and missing features.
                    </p>
                  </div>
                )}
              </div>

              <SearchSurface onSearch={handleSearch} isLoading={status === "scanning"} scanStage={scanStage} />

              {/* Loading */}
              {status === "scanning" && (
                <div className="flex flex-col items-center justify-center py-20 animate-in fade-in">
                  <Loader2 size={40} className="text-brand-accent animate-spin mb-4" />
                  <p className="font-mono text-brand-accent animate-pulse text-sm tracking-widest">
                    CONNECTING TO LIVE SOURCES...
                  </p>
                </div>
              )}

              {/* Empty / Error */}
              {(status === "empty" || status === "error") && (
                <div className="max-w-2xl mx-auto mt-8 p-8 border border-dashed border-brand-border rounded-xl bg-brand-card/20 text-center animate-in fade-in duration-500">
                  {status === "error" ? (
                    <>
                      <ShieldAlert size={40} className="text-brand-danger mx-auto mb-4" />
                      <p className="font-bold text-brand-danger">Analysis Interrupted</p>
                      <p className="text-sm text-brand-muted mt-2">{errorMsg}</p>
                    </>
                  ) : (
                    <>
                      {/* Empty State with Actionable Advice */}
                      <Info size={40} className="text-brand-muted mx-auto mb-4" />
                      <p className="font-bold text-brand-text text-lg">No Strong Gaps Detected</p>
                      <p className="text-sm text-brand-muted mt-2 max-w-md mx-auto">
                        The AI analyzed this topic but didn't find high-confidence structural failures. This usually means the market is satisfied or the topic is too narrow.
                      </p>

                      <div className="mt-6 flex flex-col items-center gap-2">
                        <span className="text-[10px] font-mono uppercase text-brand-muted font-bold">Suggested Actions</span>
                        <div className="flex flex-wrap gap-2 justify-center">
                          <button onClick={() => handlePivot("Broader Market")} className="px-3 py-1.5 bg-brand-bg border border-brand-border rounded text-xs hover:border-brand-accent transition-colors">
                            Try Broader Topic
                          </button>
                          <button onClick={() => handlePivot("Competitor Weaknesses")} className="px-3 py-1.5 bg-brand-bg border border-brand-border rounded text-xs hover:border-brand-accent transition-colors">
                            Scan Competitors
                          </button>
                        </div>
                      </div>

                      {scanAnalysis?.suggested_pivot && (
                        <button
                          onClick={() => handlePivot(scanAnalysis.suggested_pivot!)}
                          className="mt-4 text-brand-accent hover:underline text-sm font-medium"
                        >
                          Pivot to "{scanAnalysis.suggested_pivot}" →
                        </button>
                      )}
                    </>
                  )}

                  <button
                    onClick={resetSearch}
                    className="mt-8 px-6 py-2 bg-brand-text text-brand-bg font-bold rounded hover:bg-white/90 transition-colors text-sm"
                  >
                    Start New Search
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: RESULTS */}
        {viewState === "results" && (
          <div className="h-full flex animate-in fade-in duration-500">
            {/* Left list */}
            <div
              className={`${selectedGapId ? "hidden lg:flex" : "flex"
                } w-full lg:w-[420px] flex-col border-r border-brand-border bg-brand-bg/50 backdrop-blur-xl z-10`}
            >
              <div className="flex-shrink-0 p-4 border-b border-brand-border/40 flex justify-between items-center bg-brand-bg">
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono text-brand-muted uppercase tracking-widest font-bold">
                    Market Opportunities
                  </span>
                  <span className="text-xs text-brand-text font-medium">
                    {gaps.length} Structural Gaps Detected
                  </span>
                </div>

                <button
                  onClick={resetSearch}
                  className="lg:hidden p-2 text-brand-muted hover:text-brand-text"
                >
                  <Search size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3 bg-brand-bg/30">
                {gaps.map((gap, idx) => (
                  <GapCard
                    key={gap.id}
                    gap={gap}
                    isActive={selectedGapId === gap.id}
                    isPrimary={idx === 0}
                    onClick={() => setSelectedGapId(gap.id)}
                  />
                ))}

                <div className="p-4 mt-8 text-center">
                  <p className="text-xs text-brand-muted mb-3">Not seeing what you expected?</p>
                  <button
                    onClick={resetSearch}
                    className="text-xs font-mono font-bold text-brand-accent hover:underline uppercase tracking-wide"
                  >
                    Refine Scan Parameters
                  </button>
                </div>
              </div>
            </div>

            {/* Right detail */}
            <div
              className={`${!selectedGapId ? "hidden lg:flex" : "flex"
                } flex-1 bg-brand-card/20 flex-col relative overflow-hidden`}
            >
              <div className="lg:hidden absolute top-4 left-4 z-50">
                <button
                  onClick={() => setSelectedGapId(null)}
                  className="bg-brand-bg border border-brand-border rounded-full p-2 text-brand-text shadow-lg"
                >
                  <ArrowLeft size={20} />
                </button>
              </div>

              {selectedGap ? (
                <GapDetail gap={selectedGap} />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-brand-muted p-8 text-center opacity-60">
                  <Radar size={64} className="mb-6 opacity-20" />
                  <h3 className="text-xl font-display font-bold text-brand-text mb-2">
                    Select a Gap
                  </h3>
                  <p className="text-sm max-w-xs">
                    Review the dossier on the left to analyze specific chokepoints and evidence.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-brand-border/40 bg-brand-bg/80 backdrop-blur py-4 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-brand-muted font-mono uppercase tracking-wider">
          <div>
            © 2026 GAPHUNTER INTELLIGENCE. ALL RIGHTS RESERVED.
          </div>
          <div className="flex items-center gap-6">
            <span className="hover:text-brand-text cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-brand-text cursor-pointer transition-colors">Terms of Service</span>
            <span className="hover:text-brand-text cursor-pointer transition-colors">Contact Support</span>
          </div>
        </div>
      </footer>

      <DevTools scanId={currentScanId} />
    </div>
  );
};

export default App;
