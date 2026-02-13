
import React, { useEffect, useState } from 'react';
import { Loader2, Radio, Wifi, BrainCircuit } from 'lucide-react';

interface ScannerHUDProps {
  stage?: string;
}

/** Human-readable labels for known backend pipeline stages */
const STAGE_LABELS: Record<string, string> = {
  EXPAND: "Expanding search topics",
  GENERATE: "Generating gap hypotheses",
  RANK: "Ranking and scoring gaps",
  VERIFY: "Verifying evidence quality",
};

/** Flavor text cycled when no real stage info is available from backend */
const FLAVOR_MESSAGES = [
  "INITIALIZING DEEP SCAN PROTOCOL",
  "DECOMPOSING WORKFLOW LAYERS",
  "SEARCHING LIVE SOURCES",
  "ANALYZING COMPLAINT PATTERNS",
  "CROSS-REFERENCING EVIDENCE",
  "SYNTHESIZING INSIGHTS",
];

const ScannerHUD: React.FC<ScannerHUDProps> = ({ stage }) => {
  const [elapsedSec, setElapsedSec] = useState(0);
  const [flavorIdx, setFlavorIdx] = useState(0);

  // Elapsed timer — resets each mount (new scan)
  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Cycle flavor messages only when backend hasn't reported a real stage
  useEffect(() => {
    if (stage) return;
    const interval = setInterval(() => {
      setFlavorIdx((prev) => (prev + 1) % FLAVOR_MESSAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [stage]);

  const stageLabel = stage
    ? STAGE_LABELS[stage] || `Processing: ${stage}`
    : FLAVOR_MESSAGES[flavorIdx];

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  return (
    <div className="w-full bg-brand-card/90 border border-brand-accent/30 rounded-lg p-4 font-mono text-xs shadow-2xl relative overflow-hidden backdrop-blur-md">

      {/* Header */}
      <div className="flex justify-between items-center mb-3 border-b border-brand-border/50 pb-2">
        <div className="flex items-center gap-2 text-brand-accent">
          <Radio size={14} className="animate-pulse" />
          <span className="font-bold tracking-widest">DEEP REASONING ACTIVE</span>
        </div>
        <div className="flex items-center gap-2 text-brand-muted">
          <span>{formatTime(elapsedSec)}</span>
          <Loader2 size={12} className="animate-spin" />
        </div>
      </div>

      {/* Current stage */}
      <div className="space-y-2 mb-3">
        <div className="text-brand-accent font-bold text-sm flex items-center gap-2">
          <BrainCircuit size={14} />
          <span>{stageLabel}</span>
          <span className="animate-pulse">...</span>
        </div>
        {/* Indeterminate progress bar — pulsing, never shows a fake % */}
        <div className="h-1 w-full bg-brand-border/30 rounded-full overflow-hidden">
          <div className="h-full w-full bg-brand-accent/60 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Stage badge when backend reports a real stage */}
      {stage && (
        <div className="flex items-center gap-2 text-brand-muted text-[10px]">
          <span>Stage: <span className="text-brand-text font-bold">{stage}</span></span>
          <span className="text-brand-border">•</span>
          <span>Elapsed: {formatTime(elapsedSec)}</span>
        </div>
      )}

      {/* Background decoration */}
      <div className="absolute top-0 right-0 p-2 opacity-10">
        <Wifi size={64} />
      </div>
    </div>
  );
};

export default ScannerHUD;
