import { ShieldCheck, ExternalLink, Coins, Hash } from 'lucide-react';
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
            {/* Outer container — matches terminal step style */}
            <div className="border-l-2 border-emerald-500 bg-emerald-500/5 p-4 relative overflow-hidden">

                {/* Subtle glow effect */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] pointer-events-none" />

                {/* Header row */}
                <div className="flex items-center justify-between mb-3 relative z-10">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[11px] font-bold text-emerald-400 font-mono uppercase tracking-wider">
                            AUDIT_PASS : TOKEN_MINTED
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
                        <Coins className="w-3 h-3" />
                        +1 $PFR
                    </div>
                </div>

                {/* Data block */}
                <div className="relative z-10 space-y-1.5 text-xs font-mono">
                    {/* Proof ID */}
                    <div className="flex items-center gap-2 text-text-muted">
                        <Hash className="w-3 h-3 text-emerald-400/60 shrink-0" />
                        <span className="text-emerald-500/70 shrink-0">PROOF:</span>
                        <span className="text-white/80 truncate">{proofId.substring(0, 16)}...</span>
                    </div>

                    {/* Token TXID */}
                    <div className="flex items-center gap-2 text-text-muted">
                        <Hash className="w-3 h-3 text-emerald-400/60 shrink-0" />
                        <span className="text-emerald-500/70 shrink-0">TXID:</span>
                        <span className="text-white/80 truncate">{tokenTxId}</span>
                    </div>
                </div>

                {/* Footer — action link */}
                <div className="relative z-10 mt-3 pt-2.5 border-t border-emerald-500/10">
                    <a
                        href={explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded border border-emerald-500/20 transition-all cursor-pointer group"
                    >
                        <ExternalLink className="w-3 h-3 opacity-70 group-hover:opacity-100 transition-opacity" />
                        VERIFY ON HASHSCAN
                    </a>
                </div>
            </div>
        </motion.div>
    );
}
