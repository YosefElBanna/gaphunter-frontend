import { useEffect, useMemo, useState } from "react";
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

  const handleSearch = async (tags: Tag[], excludedTerms: string[]) => {
    setStatus("scanning");
    setErrorMsg(null);
    setGaps([]);
    setScanAnalysis(null);
    setSelectedGapId(null);
    setCurrentScanId(null);

    try {
      const results = await findGaps(tags, excludedTerms);

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
      console.error(err);
      setStatus("error");
      setErrorMsg(
        err?.message || "Failed to connect to GapHunter Engine. Please try again."
      );
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

      <main className="flex-1 overflow-hidden relative">
        {/* UI unchanged */}
      </main>

      <DevTools scanId={currentScanId} />
    </div>
  );
};

export default App;
