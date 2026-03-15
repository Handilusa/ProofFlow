import { Fingerprint, ExternalLink, Coins, Hash } from 'lucide-react';
import { motion } from 'framer-motion';

interface AuditPassportProps {
    tokenTxId: string;
    proofId: string;
}

export default function AuditPassport({ tokenTxId, proofId }: AuditPassportProps) {
    const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK || "testnet";
    const explorerUrl = `https://hashscan.io/${network}/transaction/${tokenTxId}`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-6 relative"
        >
            {/* Outer container — matches neon minimalist style */}
            <div className="relative overflow-hidden bg-[#060a12] border border-emerald-500/20 rounded-sm p-[1px] transition-colors duration-500 hover:border-emerald-500/40"
                 style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
            >
                <div className="relative bg-[#0a0f18] w-full p-4 md:p-5"
                     style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
                >
                    {/* Background Grid Pattern (Subtle) */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-20" />
                    
                    {/* Subtle glow effect */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] pointer-events-none" />

                    {/* Header row */}
                    <div className="flex items-center justify-between mb-4 relative z-10 border-b border-emerald-500/10 pb-3">
                        <div className="flex items-center gap-2">
                            <Fingerprint className="w-4 h-4 text-emerald-400" />
                            <span className="text-[11px] font-bold text-emerald-400 font-mono uppercase tracking-widest">
                                AUDIT_PASS : TOKEN_MINTED
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 font-mono shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                             style={{ clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)' }}>
                            <Coins className="w-3 h-3" />
                            +1 $PFR
                        </div>
                    </div>

                    {/* Data block */}
                    <div className="relative z-10 space-y-3 mt-4">
                        {/* Proof ID */}
                        <div className="bg-[#060a12] border border-emerald-500/15 p-2 flex items-center justify-between"
                             style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}>
                            <div className="flex items-center gap-2">
                                <Hash className="w-3.5 h-3.5 text-emerald-400/60 shrink-0" />
                                <span className="text-[10px] font-mono tracking-widest text-emerald-400/60 uppercase font-bold shrink-0">PROOF:</span>
                            </div>
                            <span className="text-xs font-mono text-white/90 truncate max-w-[150px] sm:max-w-[200px]">{proofId.substring(0, 16)}...</span>
                        </div>

                        {/* Token TXID */}
                        <div className="bg-[#060a12] border border-emerald-500/15 p-2 flex items-center justify-between gap-4"
                             style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}>
                            <div className="flex items-center gap-2">
                                <Hash className="w-3.5 h-3.5 text-emerald-400/60 shrink-0" />
                                <span className="text-[10px] font-mono tracking-widest text-emerald-400/60 uppercase font-bold shrink-0">TXID:</span>
                            </div>
                            <span className="text-[11px] font-mono text-white/90 truncate">{tokenTxId}</span>
                        </div>
                    </div>

                    {/* Footer — action link */}
                    <div className="relative z-10 mt-5 pt-1">
                        <a
                            href={explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full h-9 bg-emerald-500/5 hover:bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.08)] group"
                            style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}
                        >
                            VERIFY ON HASHSCAN <ExternalLink className="w-3 h-3 group-hover:scale-110 transition-transform" />
                        </a>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
