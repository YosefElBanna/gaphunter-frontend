
import React, { useEffect, useState } from 'react';
import { Loader2, Radio, Terminal, Wifi, BrainCircuit } from 'lucide-react';

const STEPS = [
  "INITIALIZING DEEP SCAN PROTOCOL...",
  "DECOMPOSING WORKFLOW LAYERS...",
  "SEARCHING GITHUB ISSUES & REPOS...",
  "SCANNING REDDIT THREADS...",
  "PARSING X (TWITTER) DISCUSSIONS...",
  "CROSS-REFERENCING G2 REVIEWS...",
  "ANALYZING STACKOVERFLOW QUERIES...",
  "VALIDATING COMPLAINT PATTERNS...",
  "EVALUATING INCUMBENT DEBT...",
  "CALCULATING WILLINGNESS-TO-PAY...",
  "GENERATING PLAIN-ENGLISH THESES...",
  "SYNTHESIZING FINAL REPORT..."
];

const ScannerHUD: React.FC = () => {
  const [stepIndex, setStepIndex] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // Slower progress to manage expectations for deep scan (~20-30s simulation visually)
    // The actual API might take 20-40s depending on load, this HUD keeps them engaged.
    const interval = setInterval(() => {
      setStepIndex(prev => {
        if (prev >= STEPS.length - 1) return prev;
        return prev + 1;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (STEPS[stepIndex]) {
      setLogs(prev => [STEPS[stepIndex], ...prev].slice(0, 4));
    }
  }, [stepIndex]);

  return (
    <div className="w-full bg-brand-card/90 border border-brand-accent/30 rounded-lg p-4 font-mono text-xs shadow-2xl relative overflow-hidden backdrop-blur-md">
      
      {/* Decorative Header */}
      <div className="flex justify-between items-center mb-3 border-b border-brand-border/50 pb-2">
        <div className="flex items-center gap-2 text-brand-accent animate-pulse">
           <Radio size={14} />
           <span className="font-bold tracking-widest">DEEP REASONING ACTIVE</span>
        </div>
        <div className="flex items-center gap-2 text-brand-muted">
           <span>{Math.min(Math.round(((stepIndex + 1) / STEPS.length) * 100), 99)}%</span>
           <Loader2 size={12} className="animate-spin" />
        </div>
      </div>

      {/* Main Status Display */}
      <div className="space-y-2 mb-4">
         <div className="text-brand-accent font-bold text-sm flex items-center gap-2">
            <BrainCircuit size={14} />
            {STEPS[stepIndex]}
         </div>
         <div className="h-1 w-full bg-brand-border/30 rounded-full overflow-hidden">
            <div 
                className="h-full bg-brand-accent transition-all duration-500 ease-out"
                style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
            ></div>
         </div>
      </div>

      {/* Log Stream */}
      <div className="space-y-1 opacity-70">
        {logs.map((log, idx) => (
            <div key={idx} className={`flex items-center gap-2 ${idx === 0 ? 'text-brand-text' : 'text-brand-muted'}`}>
                <span className="text-[10px] w-8 text-right font-mono opacity-50">{idx > 0 ? `-${idx * 2}s` : 'now'}</span>
                <span>{log}</span>
            </div>
        ))}
      </div>

      {/* Background decoration */}
      <div className="absolute top-0 right-0 p-2 opacity-10">
         <Wifi size={64} />
      </div>
    </div>
  );
};

export default ScannerHUD;
