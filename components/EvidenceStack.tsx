import React, { useState } from 'react';
import { ExternalLink, MessageCircle, Github, Globe, Star, MessageSquare, Terminal, ChevronUp } from 'lucide-react';
import { EvidenceItem } from '../src/types';

interface EvidenceStackProps {
    evidence: EvidenceItem[];
}

const XLogo = ({ size = 14, className = "" }: { size?: number, className?: string }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

const SourceIcon = ({ source }: { source: string }) => {
    const s = source.toLowerCase();
    if (s.includes('reddit')) return <MessageCircle size={14} className="text-[#ff4500]" />;
    if (s.includes('twitter') || s.includes('x')) return <XLogo size={12} className="text-brand-text" />;
    if (s.includes('github')) return <Github size={14} className="text-brand-text" />;
    if (s.includes('g2') || s.includes('capterra')) return <Star size={14} className="text-yellow-500" />;
    if (s.includes('stackoverflow') || s.includes('stack')) return <Terminal size={14} className="text-orange-500" />;
    return <Globe size={14} className="text-brand-muted" />;
};

const EvidenceCard: React.FC<{ item: EvidenceItem }> = ({ item }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Check if engagement data exists (not null/undefined/empty/None)
    const hasEngagement = item.engagement && item.engagement.toLowerCase() !== 'none';

    return (
        <div
            onClick={() => setIsExpanded(!isExpanded)}
            className={`
                py-4 border-b border-brand-border/30 cursor-pointer group transition-all duration-200
                hover:bg-brand-surface/5 px-2 -mx-2 rounded-lg
            `}
        >
            {/* Header: Source + Context (Bold) */}
            <div className="flex items-center justify-between mb-2 opacity-80 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2.5">
                    <SourceIcon source={item.source} />
                    <span className="text-xs font-bold text-brand-text font-mono tracking-tight truncate max-w-[200px]">
                        {item.context || item.source}
                    </span>
                    <span className="text-[10px] text-brand-muted">• {item.created_at}</span>
                </div>

                {hasEngagement && (
                    <span className="flex items-center gap-1 text-[10px] text-brand-muted/70">
                        <MessageSquare size={10} /> {item.engagement}
                    </span>
                )}
            </div>

            {/* Content: Fast Scan */}
            <div className="relative">
                <p className={`
                    text-brand-muted hover:text-brand-text/90 transition-colors font-sans text-sm leading-relaxed
                    ${isExpanded ? '' : 'line-clamp-2'}
                `}>
                    {/* Visual trick: make quote marks subtle */}
                    <span className="text-brand-muted/40">"</span>
                    {item.raw_text}
                    <span className="text-brand-muted/40">"</span>
                </p>
                {!isExpanded && (
                    <div className="text-[10px] text-brand-accent mt-1 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                        Expand
                    </div>
                )}
            </div>

            {/* Footer: Expanded Actions */}
            {isExpanded && (
                <div className="mt-4 flex items-center justify-between animate-in fade-in pt-2">
                    <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-brand-accent hover:underline font-medium"
                        onClick={(e) => e.stopPropagation()}
                    >
                        View original context <ExternalLink size={12} />
                    </a>
                    <button className="text-brand-muted hover:text-brand-text">
                        <ChevronUp size={14} />
                    </button>
                </div>
            )}
        </div>
    );
};

const EvidenceStack: React.FC<EvidenceStackProps> = ({ evidence }) => {
    const validEvidence = (evidence || []).filter(e => e.raw_text && e.raw_text.length > 5);

    return (
        <div className="h-full flex flex-col">
            {validEvidence.length > 2 && (
                <div className="mb-6 pb-4 border-b border-brand-border/20">
                    <div className="flex items-center gap-2 text-brand-text/80 font-mono text-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        <span>{validEvidence.length} verified user complaints</span>
                    </div>
                    <p className="text-[10px] text-brand-muted mt-1 ml-3.5 max-w-md">
                        Engine scanned sources for repeated pain patterns. All quotes are verbatim.
                    </p>
                </div>
            )}

            <div className="space-y-1 pb-10">
                {validEvidence.map((item, idx) => (
                    <EvidenceCard key={item.id || idx} item={item} />
                ))}
            </div>
        </div>
    );
};

export default EvidenceStack;