import { ShieldCheck, ExternalLink, ArrowRight } from 'lucide-react';

interface AuditPassportProps {
    tokenTxId: string;
    proofId: string;
}

export default function AuditPassport({ tokenTxId, proofId }: AuditPassportProps) {
    const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK || "testnet";
    const explorerUrl = `https://hashscan.io/${network}/transaction/${tokenTxId}`;

    return (
        <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-surface to-accent-primary/10 border border-accent-primary/20 shadow-[0_0_30px_rgba(45,212,191,0.15)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-accent-primary/20 rounded-full blur-[50px] pointer-events-none group-hover:bg-accent-primary/30 transition-colors" />

            <div className="relative z-10 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                <div className="p-4 rounded-xl bg-surface border border-border shrink-0">
                    <ShieldCheck className="w-8 h-8 text-accent-primary mb-2" />
                    <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider text-center">
                        Audit<br />Pass
                    </div>
                </div>

                <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white px-2 py-0.5 bg-accent-primary/20 text-accent-primary rounded">
                            $PFR Minted
                        </span>
                        <span className="text-xs text-text-muted">Reputation Token Awarded</span>
                    </div>

                    <h3 className="text-lg font-display font-medium text-white truncate">
                        Session Proof: {proofId.substring(0, 8)}...
                    </h3>

                    <div className="flex items-center gap-2 text-xs text-text-muted font-mono bg-background/50 px-3 py-1.5 rounded-lg border border-border/50 block w-full truncate">
                        <span className="text-accent-primary shrink-0">TXID:</span> {tokenTxId}
                    </div>
                </div>

                <div className="shrink-0 w-full sm:w-auto mt-4 sm:mt-0">
                    <a
                        href={explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-lg bg-surface border border-accent-primary/50 text-accent-primary hover:bg-accent-primary hover:text-black transition-all font-semibold text-sm"
                    >
                        View HashScan <ExternalLink className="w-4 h-4" />
                    </a>
                </div>
            </div>
        </div>
    );
}
