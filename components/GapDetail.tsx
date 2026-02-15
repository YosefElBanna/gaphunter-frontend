
import React, { useState, useEffect, useRef } from 'react';
import { Gap } from '../src/types';
import EvidenceStack from './EvidenceStack';
import {
    Target, FileText, CheckCircle2,
    Zap, Users, Clock,
    Ban, Hammer, Download, Share2, HelpCircle, AlertTriangle, LayoutTemplate, Copy, Link
} from 'lucide-react';

interface GapDetailProps {
    gap: Gap;
}

type Tab = 'thesis' | 'blueprint' | 'evidence';

const GapDetail: React.FC<GapDetailProps> = ({ gap }) => {
    const [activeTab, setActiveTab] = useState<Tab>('thesis');
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Reset tab when gap changes
    useEffect(() => {
        setActiveTab('thesis');
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
        }
    }, [gap.id]);

    const score = gap.scores.overall_score;

    // New Score Color Logic
    const getScoreColor = (s: number) => {
        if (s >= 85) return 'text-brand-accent';
        if (s >= 70) return 'text-emerald-400';
        return 'text-amber-400';
    };

    const getLabelColor = (s: number) => {
        if (s >= 85) return 'bg-brand-accent/10 text-brand-accent border-brand-accent/20';
        if (s >= 70) return 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20';
        return 'bg-amber-400/10 text-amber-400 border-amber-400/20';
    };

    const [copiedGap, setCopiedGap] = useState(false);
    const [copiedEvidence, setCopiedEvidence] = useState(false);

    const copyGap = () => {
        const text = `GAP: ${gap.title}\nCHOKEPOINT: ${gap.chokepoint_statement}\nWHY NOW: ${gap.why_now_statement}`;
        navigator.clipboard.writeText(text);
        setCopiedGap(true);
        setTimeout(() => setCopiedGap(false), 2000);
    };

    const copyEvidence = () => {
        const links = gap.evidence_stack.map(e => `- ${e.url} (${e.source})`).join('\n');
        navigator.clipboard.writeText(links);
        setCopiedEvidence(true);
        setTimeout(() => setCopiedEvidence(false), 2000);
    };

    return (
        <div className="h-full flex flex-col bg-brand-bg relative">

            {/* 1. HEADER (Fixed) */}
            <div className="flex-shrink-0 bg-brand-card/30 border-b border-brand-border/40 p-6 md:p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-brand-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <div className="relative z-10">
                    {/* Meta Tags */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                        {gap.relevant_tags?.map(tag => (
                            <span key={tag} className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wide border border-brand-border/40 bg-brand-bg/50 text-brand-muted">
                                {tag}
                            </span>
                        ))}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wide border ${getLabelColor(score)}`}>
                            {gap.scores.confidence_label}
                        </span>
                    </div>

                    {/* Title */}
                    <h1 className="font-display text-3xl md:text-4xl font-bold text-brand-text leading-[1.1] mb-6 max-w-2xl">
                        {gap.title}
                    </h1>

                    {/* Score Bar */}
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 flex items-center justify-center">
                                <svg className="absolute w-full h-full -rotate-90">
                                    <circle cx="20" cy="20" r="16" className="stroke-brand-border/30" strokeWidth="3" fill="none" />
                                    <circle cx="20" cy="20" r="16" className={`stroke-current ${getScoreColor(score)}`} strokeWidth="3" fill="none" strokeDasharray="100.5" strokeDashoffset={100.5 * (1 - score / 100)} />
                                </svg>
                                <span className="text-xs font-bold font-mono text-brand-text">{score}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-brand-text">Gap Score</span>
                                <div className="flex items-center gap-1 text-[9px] text-brand-muted uppercase tracking-wider group cursor-help relative">
                                    Breakdown <HelpCircle size={8} />
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-brand-card border border-brand-border rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                        <div className="space-y-1">
                                            <div className="flex justify-between"><span>Pain:</span> <span>{gap.scores.pain_rating}/10</span></div>
                                            <div className="flex justify-between"><span>Budget:</span> <span>{gap.scores.budget_rating}/10</span></div>
                                            <div className="flex justify-between"><span>Structure:</span> <span>{gap.scores.structural_rating}/10</span></div>
                                            <div className="flex justify-between border-t border-brand-border/30 pt-1 mt-1"><span>Evidence:</span> <span>{gap.scores.evidence_count} items</span></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="w-px h-8 bg-brand-border/50" />

                        <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-full ${gap.scores.evidence_count >= 2 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                {gap.scores.evidence_count >= 2 ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-brand-text">{gap.scores.evidence_count} Verified Sources</span>
                                <span className="text-[10px] text-brand-muted uppercase tracking-wider">
                                    {gap.scores.evidence_count < 2 ? 'Experimental Signal' : 'Validated Pattern'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. STICKY TABS */}
            <div className="sticky top-0 z-40 bg-brand-bg/95 backdrop-blur border-b border-brand-border/40 px-6 md:px-8">
                <div className="flex items-center gap-6">
                    {[
                        { id: 'thesis', label: 'The Thesis', icon: Zap },
                        { id: 'blueprint', label: 'The Blueprint', icon: LayoutTemplate },
                        { id: 'evidence', label: 'Evidence', icon: Users },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as Tab)}
                            className={`
                        py-3 text-xs font-mono font-bold uppercase tracking-widest flex items-center gap-2 border-b-2 transition-colors
                        ${activeTab === tab.id
                                    ? 'border-brand-accent text-brand-text'
                                    : 'border-transparent text-brand-muted hover:text-brand-text'}
                    `}
                        >
                            <tab.icon size={14} className={activeTab === tab.id ? 'text-brand-accent' : 'text-brand-muted'} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 3. SCROLLABLE CONTENT */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
                <div className="max-w-3xl mx-auto pb-12">

                    {/* TAB: THESIS */}
                    {activeTab === 'thesis' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div>
                                <h3 className="text-sm font-mono font-bold text-brand-muted uppercase tracking-widest mb-3">The Friction Point</h3>
                                <p className="font-display text-xl md:text-2xl font-medium text-brand-text leading-snug">
                                    {gap.chokepoint_statement}
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="bg-brand-card/40 border border-brand-border/50 rounded-xl p-5">
                                    <div className="flex items-center gap-2 mb-2 text-brand-text/90">
                                        <Clock size={16} className="text-brand-accent" />
                                        <span className="font-bold text-sm">Why Build Now?</span>
                                    </div>
                                    <p className="text-sm text-brand-muted leading-relaxed">
                                        {gap.why_now_statement}
                                    </p>
                                </div>
                                <div className="bg-brand-card/40 border border-brand-border/50 rounded-xl p-5">
                                    <div className="flex items-center gap-2 mb-2 text-brand-text/90">
                                        <Hammer size={16} className="text-brand-accent" />
                                        <span className="font-bold text-sm">Validation Step</span>
                                    </div>
                                    <p className="text-sm text-brand-muted leading-relaxed">
                                        {gap.validation_steps_7_day?.[0] || 'No specific validation step available.'}
                                    </p>
                                </div>
                            </div>

                            <div className="border border-brand-border/40 rounded-xl overflow-hidden">
                                <div className="bg-brand-bg/50 px-4 py-3 border-b border-brand-border/40">
                                    <h4 className="text-xs font-mono font-bold text-brand-muted uppercase tracking-widest">Incumbent Failures</h4>
                                </div>
                                <div className="divide-y divide-brand-border/30 bg-brand-card/20">
                                    {gap.structured_failures?.map((fail, idx) => (
                                        <div key={idx} className="p-4 flex gap-4">
                                            <div className="w-6 h-6 rounded-full bg-brand-danger/10 text-brand-danger flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <Ban size={12} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-bold text-brand-text bg-brand-surface/20 px-1.5 py-0.5 rounded border border-brand-surface/30">
                                                        {fail.tool_name}
                                                    </span>
                                                    <span className="text-xs font-bold text-brand-text/80">fails to {fail.attempt}</span>
                                                </div>
                                                <p className="text-sm text-brand-muted mb-1">"{fail.failure}"</p>
                                                <p className="text-xs text-brand-danger/80 flex items-center gap-1 font-mono">
                                                    Root Cause: {fail.root_cause}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: BLUEPRINT */}
                    {activeTab === 'blueprint' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="p-1 rounded-2xl bg-gradient-to-br from-brand-accent/20 to-brand-border/10">
                                <div className="bg-brand-bg rounded-xl p-8 border border-brand-border/50 h-full relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <FileText size={120} />
                                    </div>
                                    <span className="text-xs font-mono font-bold text-brand-accent uppercase tracking-widest mb-4 block">The Mandate</span>
                                    <p className="font-display text-2xl font-bold text-brand-text leading-tight">
                                        {gap.action_plan?.product_concept}
                                    </p>
                                </div>
                            </div>

                            <div className="relative border-l-2 border-brand-border/30 ml-3 space-y-8 pl-8 py-2">
                                {/* Phase 1 */}
                                <div className="relative">
                                    <div className="absolute -left-[41px] top-0 w-6 h-6 rounded-full bg-brand-bg border-2 border-brand-accent flex items-center justify-center z-10">
                                        <span className="text-[10px] font-bold text-brand-accent">1</span>
                                    </div>
                                    <h3 className="text-sm font-bold text-brand-text mb-2 uppercase tracking-wide">The Razor Wedge</h3>
                                    <div className="bg-brand-card/30 border border-brand-border/40 rounded-lg p-5">
                                        <p className="text-sm text-brand-text/90">
                                            {gap.action_plan?.entry_wedge}
                                        </p>
                                    </div>
                                </div>

                                {/* Phase 2 */}
                                <div className="relative">
                                    <div className="absolute -left-[41px] top-0 w-6 h-6 rounded-full bg-brand-bg border-2 border-brand-text/20 flex items-center justify-center z-10">
                                        <span className="text-[10px] font-bold text-brand-muted">2</span>
                                    </div>
                                    <h3 className="text-sm font-bold text-brand-muted mb-2 uppercase tracking-wide">Expansion Path</h3>
                                    <div className="bg-brand-card/30 border border-brand-border/40 rounded-lg p-5">
                                        <p className="text-sm text-brand-muted">
                                            {gap.action_plan?.expansion_path}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-brand-bg border border-brand-border/50 rounded-lg p-4">
                                    <div className="text-[10px] font-mono uppercase text-brand-muted mb-1">Target User</div>
                                    <div className="text-sm font-bold text-brand-text">{gap.action_plan?.target_user}</div>
                                </div>
                                <div className="bg-brand-bg border border-brand-border/50 rounded-lg p-4">
                                    <div className="text-[10px] font-mono uppercase text-brand-muted mb-1">Target Buyer</div>
                                    <div className="text-sm font-bold text-brand-text">{gap.action_plan?.target_buyer}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: EVIDENCE */}
                    {activeTab === 'evidence' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="bg-brand-card/20 border border-brand-border/40 rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-lg font-bold text-brand-text">Raw Signals</h3>
                                        <p className="text-xs text-brand-muted">Verbatim complaints scanned from public forums.</p>
                                    </div>
                                </div>
                                <EvidenceStack evidence={gap.evidence_stack} />
                            </div>
                        </div>
                    )}

                </div>

                {/* FEEDBACK LOOP (Bottom) */}
                <div className="mt-8 pt-8 border-t border-brand-border/30 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-brand-muted font-mono">Was this gap useful?</span>
                        <div className="flex gap-2">
                            <button className="text-[10px] border border-brand-border rounded px-2 py-1 hover:bg-brand-card text-brand-muted hover:text-brand-text">Too Generic</button>
                            <button className="text-[10px] border border-brand-border rounded px-2 py-1 hover:bg-brand-card text-brand-muted hover:text-brand-text">Too Niche</button>
                            <button className="text-[10px] border border-brand-accent/50 rounded px-2 py-1 hover:bg-brand-accent/10 text-brand-accent">Spot On</button>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={copyGap}
                            className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-brand-card rounded text-brand-text transition-colors border border-transparent hover:border-brand-border text-xs"
                            title="Copy Gap Details"
                        >
                            {copiedGap ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
                            {copiedGap ? <span className="text-emerald-500 font-bold">Copied</span> : "Copy Gap"}
                        </button>
                        <button
                            onClick={copyEvidence}
                            className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-brand-card rounded text-brand-text transition-colors border border-transparent hover:border-brand-border text-xs"
                            title="Copy Evidence Links"
                        >
                            {copiedEvidence ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Link size={14} />}
                            {copiedEvidence ? <span className="text-emerald-500 font-bold">Copied</span> : "Evidence"}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default GapDetail;


