
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Loader2, Zap, BookOpen, Layers, Cpu, ChevronDown, ArrowUpRight, MinusCircle, BrainCircuit, Lightbulb, HelpCircle } from 'lucide-react';
import { Tag, ProfitPlay } from '../src/types';
import * as tagService from '../src/services/tagService';
import ScannerHUD from './ScannerHUD';

interface SearchSurfaceProps {
    onSearch: (tags: Tag[], excludedTerms: string[]) => void;
    isLoading: boolean;
    scanStage?: string;
}

const SearchSurface: React.FC<SearchSurfaceProps> = ({ onSearch, isLoading, scanStage }) => {
    const [inputValue, setInputValue] = useState('');
    const [activeTags, setActiveTags] = useState<Tag[]>([]);
    const [excludedTerms, setExcludedTerms] = useState<string[]>([]);
    const [suggestions, setSuggestions] = useState<Tag[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Categories State
    const [selectedLevel, setSelectedLevel] = useState<tagService.KnowledgeLevel>('basic');
    const [levelTags, setLevelTags] = useState<Tag[]>([]);
    const [isBrowserOpen, setIsBrowserOpen] = useState(true);
    const [showAllTags, setShowAllTags] = useState(false);

    // Profit Plays State
    const [highlightedPlays, setHighlightedPlays] = useState<ProfitPlay[]>([]);

    // Initialize browser with Basic tags
    useEffect(() => {
        const tags = tagService.getTagsByLevel(selectedLevel);
        setLevelTags(tags);
        setShowAllTags(false);
    }, [selectedLevel]);

    // Update highlighted Profit Plays when tags change
    useEffect(() => {
        const plays = tagService.getRelevantProfitPlays(activeTags);
        setHighlightedPlays(plays);
    }, [activeTags]);

    // If user has active tags, update related suggestions
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (inputValue.trim().length > 0) {
                setIsSuggesting(true);
                const results = await tagService.searchTags(inputValue);
                setSuggestions(results);
                setIsSuggesting(false);
            } else {
                setSuggestions([]);
            }
        }, 350);
        return () => clearTimeout(timer);
    }, [inputValue, activeTags]);

    const handleContainerClick = () => {
        inputRef.current?.focus();
    };

    const handleAddTag = (tag: Tag) => {
        if (activeTags.length < 4 && !activeTags.find(t => t.id === tag.id)) {
            setActiveTags([...activeTags, tag]);
            setInputValue('');
            setSuggestions([]);
            inputRef.current?.focus();
        }
    };

    const removeTag = (tagId: string) => {
        setActiveTags(activeTags.filter(t => t.id !== tagId));
    };

    const handleToggleTag = (tag: Tag) => {
        if (activeTags.find(t => t.id === tag.id)) {
            removeTag(tag.id);
        } else {
            handleAddTag(tag);
        }
    };

    const handleEvaluate = async () => {
        if (!inputValue.trim()) return;
        setIsEvaluating(true);
        try {
            const newTag = await tagService.evaluateTag(inputValue.trim());
            handleAddTag(newTag);
        } catch (e) {
            console.error(e);
        } finally {
            setIsEvaluating(false);
        }
    };

    const handleTryExample = async () => {
        const exampleTag = await tagService.evaluateTag("Creator Workflow Breakpoints");
        handleAddTag(exampleTag);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !inputValue && activeTags.length > 0) {
            e.preventDefault();
            removeTag(activeTags[activeTags.length - 1].id);
        }
        if (e.key === 'Enter') {
            e.preventDefault();
            const topSuggestion = suggestions.length > 0 ? suggestions[0] : null;
            const isRelevantMatch = topSuggestion && topSuggestion.name.toLowerCase().includes(inputValue.toLowerCase());

            if (topSuggestion && isRelevantMatch) {
                handleAddTag(topSuggestion);
            } else if (inputValue.trim()) {
                handleEvaluate();
            }
        }
    };

    const removeExclusion = (term: string) => {
        setExcludedTerms(excludedTerms.filter(t => t !== term));
    };

    const handleRunDiscovery = () => {
        // console.log("[SearchSurface] handleRunDiscovery called", { activeTags, excludedTerms });
        if (activeTags.length > 0) {
            onSearch(activeTags, excludedTerms);
        }
    };

    const getTagStyle = (tag: Tag) => {
        if (tag.metadata.tier === 5) return 'bg-brand-accent/10 text-brand-accent border-brand-accent/30';
        if (tag.metadata.tier === 4) return 'bg-brand-workflow/10 text-brand-workflow border-brand-workflow/20';
        if (tag.metadata.tier === 3) return 'bg-brand-tech/10 text-brand-tech border-brand-tech/20';
        return 'bg-brand-border/30 text-brand-text border-brand-border';
    };

    const CategoryButton = ({ level, icon: Icon, label, desc, recommended }: { level: tagService.KnowledgeLevel, icon: any, label: string, desc: string, recommended?: boolean }) => (
        <button
            onClick={() => { setSelectedLevel(level); setIsBrowserOpen(true); }}
            className={`
            flex-1 p-4 rounded-xl border transition-all duration-300 flex flex-col items-center gap-2 group relative overflow-hidden
            ${selectedLevel === level && isBrowserOpen
                    ? 'bg-brand-card border-brand-accent/60 shadow-[0_0_20px_rgba(var(--accent)/0.15)] ring-1 ring-brand-accent/20'
                    : 'bg-brand-bg/50 border-brand-border hover:border-brand-muted hover:bg-brand-card'}
        `}
        >
            {recommended && (
                <div className={`absolute top-2 right-2 text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded ${selectedLevel === level ? 'bg-brand-accent text-brand-bg' : 'bg-brand-border/50 text-brand-muted'}`}>
                    Start Here
                </div>
            )}
            <div className="relative z-10 flex flex-col items-center gap-2">
                <Icon size={20} className={selectedLevel === level && isBrowserOpen ? 'text-brand-accent' : 'text-brand-muted group-hover:text-brand-text'} />
                <div className="text-center">
                    <div className={`font-display font-bold text-sm ${selectedLevel === level && isBrowserOpen ? 'text-brand-text' : 'text-brand-muted group-hover:text-brand-text'}`}>
                        {label}
                    </div>
                    <div className={`text-[11px] leading-tight font-medium mt-1.5 max-w-[180px] ${selectedLevel === level ? 'text-brand-accent/90' : 'text-brand-muted/60'}`}>
                        {desc}
                    </div>
                </div>
            </div>
        </button>
    );

    const displayedTags = showAllTags ? levelTags : levelTags.slice(0, 16);
    const hiddenCount = levelTags.length - displayedTags.length;

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8">

            {/* Search Input */}
            <div className="relative mt-6">
                {activeTags.length === 0 && !inputValue && (
                    <div className="absolute -top-10 left-1 flex items-center gap-3 animate-in fade-in duration-700">
                        <span className="text-brand-muted text-sm font-medium">Where are we hunting?</span>
                        <button
                            onClick={handleTryExample}
                            className="flex items-center gap-1.5 text-brand-accent hover:text-brand-accent/80 transition-colors bg-brand-accent/5 px-3 py-1 rounded-full border border-brand-accent/20 hover:border-brand-accent/40 shadow-[0_0_10px_rgba(var(--accent)/0.05)]"
                        >
                            <span className="font-mono font-bold text-xs tracking-tight">Try: Creator Workflows</span>
                            <ArrowUpRight size={12} />
                        </button>
                    </div>
                )}

                <div
                    onClick={handleContainerClick}
                    className="bg-brand-card/40 backdrop-blur-md border border-brand-border rounded-xl p-2 shadow-2xl relative overflow-visible cursor-text group focus-within:border-brand-accent/50 focus-within:ring-1 focus-within:ring-brand-accent/20 transition-all duration-300"
                >
                    <div className="flex flex-wrap gap-2 min-h-[52px] items-center px-2 pr-28 relative">
                        {activeTags.map(tag => (
                            <div key={tag.id} className={`group/tag relative inline-flex items-center border rounded px-2.5 py-1.5 animate-in zoom-in-50 duration-200 cursor-default ${getTagStyle(tag)}`}>
                                <span className={`text-sm font-medium flex items-center gap-1 ${tag.status === 'PROVISIONAL' ? 'border-b border-dashed border-current/50' : ''}`}>
                                    {tag.name}
                                </span>

                                <button
                                    onClick={(e) => { e.stopPropagation(); removeTag(tag.id); }}
                                    className="ml-2 opacity-60 hover:opacity-100 focus:outline-none"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}

                        <input
                            ref={inputRef}
                            type="text"
                            className="flex-1 bg-transparent border-none outline-none text-brand-text placeholder-brand-muted/40 min-w-[200px] py-1.5 text-base"
                            placeholder={activeTags.length === 0 ? "Select a market, workflow, or industry... (e.g. Creator Economy)" : "Add more topics... (up to 4)"}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isLoading}
                        />

                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-3">
                            {activeTags.length > 0 && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setActiveTags([]); }}
                                    className="text-[10px] uppercase font-bold text-brand-muted hover:text-brand-danger transition-colors flex items-center gap-1"
                                >
                                    Clear
                                </button>
                            )}
                            <span className={`text-[10px] font-mono transition-colors ${activeTags.length >= 4 ? 'text-brand-danger' : 'text-brand-muted/60'}`}>
                                {activeTags.length}/4
                            </span>
                        </div>
                    </div>

                    {/* Suggestions Dropdown */}
                    {(suggestions.length > 0 || inputValue) && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-brand-card/95 backdrop-blur-xl border border-brand-border rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="max-h-[350px] overflow-y-auto">
                                {suggestions.length > 0 && (
                                    <>
                                        <div className="px-3 py-2 text-[10px] font-mono uppercase text-brand-muted bg-brand-bg/50 sticky top-0 backdrop-blur-sm">
                                            {inputValue && suggestions[0].name.toLowerCase().includes(inputValue.toLowerCase()) ? "Matches" : "Suggested Topics"}
                                        </div>
                                        {suggestions.map((tag, idx) => (
                                            <button
                                                key={tag.id}
                                                onClick={() => handleAddTag(tag)}
                                                className={`w-full text-left px-4 py-3 hover:bg-brand-bg/50 transition-colors flex items-center justify-between group border-b border-brand-border/30 last:border-0 ${idx === 0 ? 'bg-brand-bg/30' : ''}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex flex-col items-center justify-center min-w-[32px]">
                                                        <div className={`text-xs font-bold font-mono ${tag.metadata.tier >= 4 ? 'text-brand-accent' : 'text-brand-muted'}`}>
                                                            {tag.metadata.gap_potential_score}
                                                        </div>
                                                        <div className="text-[9px] text-brand-muted/60 uppercase">
                                                            Pot.
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <div className="text-brand-text font-medium text-sm group-hover:text-brand-accent transition-colors flex items-center gap-2">
                                                            {tag.name}
                                                        </div>
                                                        <div className="text-xs text-brand-muted flex items-center gap-2 mt-0.5">
                                                            <span className="capitalize">{tag.metadata.scope_bias.toLowerCase()}</span>
                                                            <span className="text-brand-border">•</span>
                                                            <span className="flex items-center gap-1">
                                                                Saturation:
                                                                <span className={tag.metadata.saturation_score > 60 ? 'text-brand-danger' : 'text-brand-workflow'}>
                                                                    {tag.metadata.saturation_score > 60 ? 'High' : 'Low'}
                                                                </span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </>
                                )}

                                {inputValue && !suggestions.find(s => s.name.toLowerCase() === inputValue.toLowerCase()) && (
                                    <button
                                        onClick={handleEvaluate}
                                        disabled={isEvaluating}
                                        className="w-full text-left px-4 py-3 hover:bg-brand-bg/50 transition-colors flex items-center gap-3 text-brand-accent border-t border-brand-border/30"
                                    >
                                        {isEvaluating ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                                        <div>
                                            <span className="font-medium text-sm block">
                                                {isEvaluating ? 'Scanning Market...' : `Target new market: "${inputValue}"`}
                                            </span>
                                            <span className="text-xs text-brand-muted">
                                                Analyze potential for structural gaps in this domain
                                            </span>
                                        </div>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Knowledge Level Browser */}
            {!isLoading && !inputValue && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-500 space-y-4">

                    {/* Category Tabs */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <CategoryButton
                            level="basic"
                            icon={BookOpen}
                            label="BASIC"
                            desc="Creator & Workflow Ops"
                            recommended
                        />
                        <CategoryButton
                            level="medium"
                            icon={Layers}
                            label="MEDIUM"
                            desc="Process, Ops & Revenue"
                        />
                        <CategoryButton
                            level="high"
                            icon={Cpu}
                            label="EXPERT"
                            desc="Deep Infrastructure & Systems"
                        />
                    </div>

                    {/* Tag Grid */}
                    {isBrowserOpen && (
                        <div className="bg-brand-card/30 rounded-xl border border-brand-border/50 animate-in fade-in zoom-in-95 duration-300 overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border/30 bg-brand-bg/30">
                                <div className="flex flex-col">
                                    <h3 className="text-xs font-mono uppercase text-brand-muted tracking-widest font-bold">
                                        {selectedLevel === 'basic' && "Industry & Work Topics (Gap-Rich)"}
                                        {selectedLevel === 'medium' && "Operational Processes & Revenue"}
                                        {selectedLevel === 'high' && "Infrastructure, Security & Systems"}
                                    </h3>
                                    <span className="text-[10px] text-brand-muted/60 mt-0.5">
                                        Verified High-Friction Surfaces. Select to Scan.
                                    </span>
                                </div>
                                <button
                                    onClick={() => setIsBrowserOpen(false)}
                                    className="text-brand-muted hover:text-brand-text p-1 hover:bg-brand-bg rounded transition-colors"
                                    title="Close Browser"
                                >
                                    <MinusCircle size={16} />
                                </button>
                            </div>

                            <div className="p-4">
                                <div className="flex flex-wrap gap-2">
                                    {displayedTags.map(tag => (
                                        <button
                                            key={tag.id}
                                            onClick={() => handleToggleTag(tag)}
                                            className={`
                                            px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border flex items-center gap-2 group
                                            ${activeTags.find(t => t.id === tag.id)
                                                    ? 'bg-brand-accent text-brand-bg border-brand-accent shadow-[0_0_10px_rgba(var(--accent)/0.3)]'
                                                    : 'bg-brand-bg/50 border-brand-border/50 text-brand-muted hover:text-brand-text hover:border-brand-muted hover:bg-brand-card'}
                                        `}
                                        >
                                            <span>{tag.name}</span>
                                            {tag.metadata.gap_potential_score > 90 && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-brand-danger animate-pulse" title="Very High Potential" />
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {hiddenCount > 0 && (
                                    <div className="mt-4 flex justify-center">
                                        <button
                                            onClick={() => setShowAllTags(true)}
                                            className="text-xs text-brand-muted hover:text-brand-accent flex items-center gap-1 transition-colors py-1 px-3 rounded-full hover:bg-brand-bg/50 border border-transparent hover:border-brand-border/50"
                                        >
                                            <ChevronDown size={14} />
                                            Show {hiddenCount} more surfaces
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Profit Plays Highlight */}
            {highlightedPlays.length > 0 && !isLoading && (
                <div className="bg-gradient-to-br from-brand-accent/5 to-transparent rounded-xl border border-brand-accent/10 p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-2 mb-3">
                        <Lightbulb size={16} className="text-brand-accent" />
                        <span className="text-xs font-mono font-bold uppercase text-brand-accent tracking-widest">
                            Recommended Profit Plays
                        </span>
                        <span className="text-[10px] text-brand-muted ml-auto">
                            Best business models for selected tags
                        </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {highlightedPlays.map(play => (
                            <div key={play.id} className="group relative bg-brand-card/50 border border-brand-border/40 hover:border-brand-accent/40 rounded-lg p-3 transition-all duration-200 hover:-translate-y-0.5 cursor-help">
                                <div className="text-xs font-bold text-brand-text mb-1 truncate">{play.title}</div>
                                <div className="text-[10px] text-brand-muted line-clamp-2 leading-relaxed opacity-80 group-hover:opacity-100">
                                    {play.one_liner}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {excludedTerms.length > 0 && !isLoading && (
                <div className="flex flex-wrap items-center gap-2 px-1">
                    <span className="text-[10px] font-mono uppercase text-brand-danger/70">Excluding:</span>
                    {excludedTerms.map(term => (
                        <span key={term} className="inline-flex items-center px-2 py-0.5 rounded bg-brand-danger/10 text-brand-danger text-xs border border-brand-danger/20">
                            {term}
                            <button onClick={() => removeExclusion(term)} className="ml-1.5 hover:text-brand-text">
                                <X size={10} />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            <div className="flex flex-col items-center pt-4 gap-3 min-h-[80px]">
                {isLoading ? (
                    <ScannerHUD stage={scanStage} />
                ) : (
                    <>
                        <button
                            onClick={handleRunDiscovery}
                            disabled={isLoading || activeTags.length === 0}
                            className={`
                            px-10 py-4 rounded-lg font-mono font-bold tracking-widest text-sm transition-all duration-300
                            flex items-center gap-3 uppercase w-full md:w-auto justify-center
                            ${isLoading || activeTags.length === 0
                                    ? 'bg-brand-border text-brand-muted cursor-not-allowed opacity-70'
                                    : 'bg-brand-accent text-brand-bg shadow-[0_0_20px_rgba(var(--accent)/0.5)] hover:shadow-[0_0_35px_rgba(var(--accent)/0.7)] hover:-translate-y-0.5 border border-brand-accent'}
                        `}
                        >
                            Initiate Deep Core Scan
                            <Zap size={18} className="fill-current" />
                        </button>

                        <div className="flex flex-col items-center gap-1 animate-in fade-in duration-700">
                            <span className="text-[10px] text-brand-muted/70 font-mono tracking-wide flex items-center gap-2">
                                <BrainCircuit size={10} />
                                POWERED BY GEMINI PRO • DEEP REASONING ACTIVATED
                            </span>
                        </div>
                    </>
                )}
            </div>

        </div>
    );
};

export default SearchSurface;
