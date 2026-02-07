import React, { useState } from "react";
import { Bug, CheckCircle, XCircle, Copy, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import api from "../src/services/api";

interface DevToolsProps {
    scanId: string | null;
    onScanComplete?: () => void;
    onScanFail?: () => void;
}

/**
 * DevTools panel for testing scan lifecycle (dev only)
 * Only visible when import.meta.env.DEV is true
 */
const DevTools: React.FC<DevToolsProps> = ({ scanId, onScanComplete, onScanFail }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState<"complete" | "fail" | null>(null);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [copied, setCopied] = useState(false);

    // Only render in development
    if (!(import.meta as any).env?.DEV) {
        return null;
    }

    const handleCopyScanId = async () => {
        if (!scanId) return;
        try {
            await navigator.clipboard.writeText(scanId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setMessage({ type: "error", text: "Failed to copy" });
        }
    };

    const handleComplete = async () => {
        if (!scanId) return;
        setLoading("complete");
        setMessage(null);
        try {
            await api.put(`/scans/${scanId}/complete`, {
                results: { devTools: true, completedAt: new Date().toISOString() },
            });
            setMessage({ type: "success", text: "Scan marked complete" });
            onScanComplete?.();
        } catch (err: any) {
            setMessage({ type: "error", text: err?.message || "Failed to complete scan" });
        } finally {
            setLoading(null);
        }
    };

    const handleFail = async () => {
        if (!scanId) return;
        setLoading("fail");
        setMessage(null);
        try {
            await api.put(`/scans/${scanId}/fail`, {
                error: "Manually failed via DevTools",
                errorCode: "DEV_TOOLS_FAIL",
            });
            setMessage({ type: "success", text: "Scan marked failed" });
            onScanFail?.();
        } catch (err: any) {
            setMessage({ type: "error", text: err?.message || "Failed to fail scan" });
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <div className="bg-brand-card border border-brand-border rounded-lg shadow-2xl overflow-hidden min-w-[280px]">
                {/* Header */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center justify-between px-4 py-2 bg-yellow-500/10 border-b border-brand-border hover:bg-yellow-500/20 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Bug size={16} className="text-yellow-500" />
                        <span className="text-xs font-mono font-bold text-yellow-500 uppercase tracking-wide">
                            Dev Tools
                        </span>
                    </div>
                    {isOpen ? (
                        <ChevronDown size={16} className="text-brand-muted" />
                    ) : (
                        <ChevronUp size={16} className="text-brand-muted" />
                    )}
                </button>

                {/* Content */}
                {isOpen && (
                    <div className="p-4 space-y-4">
                        {/* Scan ID */}
                        <div>
                            <div className="text-[10px] font-mono uppercase text-brand-muted mb-1">
                                Current Scan ID
                            </div>
                            {scanId ? (
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 text-xs bg-brand-bg px-2 py-1.5 rounded border border-brand-border font-mono truncate">
                                        {scanId}
                                    </code>
                                    <button
                                        onClick={handleCopyScanId}
                                        className="p-1.5 rounded border border-brand-border hover:bg-brand-bg transition-colors"
                                        title="Copy to clipboard"
                                    >
                                        {copied ? (
                                            <CheckCircle size={14} className="text-green-500" />
                                        ) : (
                                            <Copy size={14} className="text-brand-muted" />
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <div className="text-xs text-brand-muted italic">No active scan</div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="space-y-2">
                            <div className="text-[10px] font-mono uppercase text-brand-muted">
                                Lifecycle Actions
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={handleComplete}
                                    disabled={!scanId || loading !== null}
                                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded border border-green-500/30 bg-green-500/10 text-green-500 hover:bg-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {loading === "complete" ? (
                                        <Loader2 size={12} className="animate-spin" />
                                    ) : (
                                        <CheckCircle size={12} />
                                    )}
                                    Complete
                                </button>
                                <button
                                    onClick={handleFail}
                                    disabled={!scanId || loading !== null}
                                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded border border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {loading === "fail" ? (
                                        <Loader2 size={12} className="animate-spin" />
                                    ) : (
                                        <XCircle size={12} />
                                    )}
                                    Fail
                                </button>
                            </div>
                        </div>

                        {/* Message */}
                        {message && (
                            <div
                                className={`text-xs px-3 py-2 rounded border ${message.type === "success"
                                    ? "bg-green-500/10 border-green-500/30 text-green-500"
                                    : "bg-red-500/10 border-red-500/30 text-red-500"
                                    }`}
                            >
                                {message.text}
                            </div>
                        )}

                        {/* Env Info */}
                        <div className="pt-2 border-t border-brand-border/50">
                            <div className="text-[10px] text-brand-muted/60 font-mono">
                                API: {(import.meta as any).env?.VITE_API_BASE || "localhost:3001"}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DevTools;
