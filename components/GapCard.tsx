
import React from 'react';
import { Gap } from '../src/types';
import { CheckCircle2, ChevronRight, BarChart3, AlertCircle, Sparkles, Link, AlertTriangle } from 'lucide-react';

interface GapCardProps {
  gap: Gap;
  onClick: () => void;
  isActive: boolean;
  isPrimary?: boolean;
}

const GapCard: React.FC<GapCardProps> = ({ gap, onClick, isActive, isPrimary }) => {
  const score = gap.scores.overall_score;
  const isExperimental = gap.scores.confidence_label === 'Experimental';

  // Confidence color indicator
  const getBorderColor = () => {
    if (isActive) return 'border-brand-accent';
    if (score >= 80) return 'border-emerald-500/30';
    return 'border-brand-border/50';
  };

  return (
    <div
      onClick={onClick}
      className={`
        group relative w-full rounded-lg p-4 cursor-pointer transition-all duration-200 border
        ${isActive
          ? 'bg-brand-card shadow-lg border-brand-accent ring-1 ring-brand-accent/20 z-10'
          : 'bg-brand-card/40 hover:bg-brand-card hover:border-brand-border border-transparent'}
        ${getBorderColor()}
      `}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          {/* Meta Row */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${score >= 80 ? 'text-brand-accent bg-brand-accent/10' : 'text-amber-500 bg-amber-500/10'
              }`}>
              {score}
            </span>

            {gap.is_verified ? (
              <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-500 uppercase tracking-wider bg-emerald-500/10 px-1.5 py-0.5 rounded">
                <Link size={8} /> Verified
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[9px] font-mono text-amber-500 uppercase tracking-wider bg-amber-500/10 px-1.5 py-0.5 rounded" title="Source unverified">
                <AlertTriangle size={8} /> Unverified
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className={`font-display font-bold text-sm leading-tight mb-1 truncate pr-2 ${isActive ? 'text-brand-text' : 'text-brand-text/80 group-hover:text-brand-text'}`}>
            {gap.title}
          </h3>

          {/* Gist */}
          <p className="text-xs text-brand-muted line-clamp-2 leading-relaxed">
            {gap.chokepoint_statement}
          </p>
        </div>

        {/* Chevron */}
        <div className={`mt-2 text-brand-muted/20 group-hover:text-brand-accent transition-colors ${isActive ? 'text-brand-accent' : ''}`}>
          <ChevronRight size={16} />
        </div>
      </div>
    </div>
  );
};

export default GapCard;
