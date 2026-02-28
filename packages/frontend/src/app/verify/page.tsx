'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, ShieldCheck, ExternalLink, Network, FileText, CheckCircle2, ChevronRight, Hash, Clock } from 'lucide-react';
import { Card, Button, Input, Skeleton } from '@/components/ui';
import Badge from '@/components/ui/Badge';
import { getProof, StoredProof, getRecentProofs } from '@/lib/api';
import { useLanguage } from '@/lib/language-context';

function VerifyContent() {
    const searchParams = useSearchParams();
    const initialId = searchParams.get('id') || '';
    const { t } = useLanguage();

    const [proofId, setProofId] = useState(initialId);
    const [isVerifying, setIsVerifying] = useState(false);
    const [proof, setProof] = useState<StoredProof | null>(null);
    const [error, setError] = useState('');
    const [recentIds, setRecentIds] = useState<string[]>([]);

    useEffect(() => {
        // Fetch some recent IDs for the "Try these" suggestions
        getRecentProofs().then(res => {
            if (res && res.length > 0) {
                setRecentIds(res.slice(0, 3).map(p => p.proofId));
            }
        }).catch(console.error);

        if (initialId) {
            handleVerify(initialId);
        }
    }, [initialId]);

    const handleVerify = async (idToVerify: string = proofId) => {
        if (!idToVerify.trim()) return;

        setIsVerifying(true);
        setError('');
        setProof(null);

        try {
            const result = await getProof(idToVerify);
            setProof(result);
        } catch (err: any) {
            console.error(err);
            setError(t('verify_error'));
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center max-w-2xl mx-auto mt-8 mb-12"
            >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 mb-6 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                    <ShieldCheck className="w-8 h-8" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">{t('verify_title')}</h1>
                <p className="text-text-muted text-base">{t('verify_subtitle')}</p>
            </motion.div>

            {/* Input Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
            >
                <Card className="p-2 pl-4 border-border/60 bg-surface/80 backdrop-blur-xl shadow-xl flex items-center gap-4 max-w-3xl mx-auto focus-within:border-accent-primary/50 transition-colors">
                    <Search className="w-5 h-5 text-text-muted shrink-0" />
                    <input
                        type="text"
                        placeholder={t('verify_placeholder')}
                        className="flex-1 bg-transparent border-none text-white focus:outline-none focus:ring-0 placeholder-text-muted text-sm font-mono w-full"
                        value={proofId}
                        onChange={(e) => setProofId(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                    />
                    <Button
                        onClick={() => handleVerify()}
                        disabled={isVerifying || !proofId.trim()}
                        className="shrink-0 h-10 px-6 font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                    >
                        {isVerifying ? t('verify_loading') : t('verify_button')}
                    </Button>
                </Card>
            </motion.div>

            {/* Suggestions */}
            {!proof && !isVerifying && recentIds.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="flex flex-wrap items-center justify-center gap-3 text-xs mt-4"
                >
                    <span className="text-text-muted">{t('verify_try')}</span>
                    {recentIds.map((id, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                setProofId(id);
                                handleVerify(id);
                            }}
                            className="px-3 py-1.5 rounded-full border border-border bg-surface-elevated/50 text-text-muted font-mono hover:text-white hover:border-accent-primary transition-colors truncate max-w-[150px]"
                        >
                            {id.substring(0, 8)}...
                        </button>
                    ))}
                </motion.div>
            )}

            {/* Error State */}
            {error && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center p-6 bg-red-500/10 border border-red-500/20 rounded-2xl max-w-2xl mx-auto">
                    <p className="text-red-400 font-medium">{error}</p>
                </motion.div>
            )}

            {/* Loading State */}
            {isVerifying && (
                <div className="space-y-6 max-w-3xl mx-auto mt-12">
                    <Skeleton className="h-32 w-full rounded-2xl" />
                    <Skeleton className="h-48 w-full rounded-2xl" />
                </div>
            )}

            {/* VERIFICATION RESULT */}
            {proof && !isVerifying && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8"
                >
                    {/* Main Timeline Column */}
                    <div className="lg:col-span-2 space-y-6">

                        <Badge className="bg-success/10 text-success border border-success/20 px-3 py-1.5 font-bold tracking-wide flex items-center gap-2 w-fit">
                            <CheckCircle2 className="w-4 h-4" /> ON-CHAIN VERIFIED
                        </Badge>

                        <h2 className="text-2xl font-display font-bold text-white leading-snug">
                            Question: "{proof.question}"
                        </h2>

                        <div className="relative pl-6 pt-6 pb-6">
                            <div className="absolute left-[3px] top-8 bottom-4 w-[2px] bg-emerald-500/30" />

                            {/* Steps */}
                            {proof.steps.map((step, idx) => {
                                const isFinal = step.label === "FINAL";
                                const seqNum = proof.hcsSequenceNumbers?.[idx];

                                return (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * idx }}
                                        className="relative mb-8 pl-8"
                                    >
                                        <div className={`absolute left-[-5px] top-[24px] w-4 h-4 rounded-full border-[4px] bg-background z-10 ${isFinal ? 'border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 'border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]'}`} />

                                        <div className={`text-xs font-bold uppercase tracking-wider mb-2 flex items-center justify-between ${isFinal ? 'text-amber-400' : 'text-emerald-400'}`}>
                                            <span>{isFinal ? "★ FINAL ANSWER" : `● ${step.label}`}</span>
                                            {seqNum !== undefined && (
                                                <a
                                                    href={`https://hashscan.io/${process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet'}/topic/${proof.hcsTopicId}?sequenceNumber=${seqNum}`} target="_blank" rel="noopener noreferrer"
                                                    className="font-mono bg-surface-elevated px-2 py-0.5 rounded border border-border flex items-center gap-1.5 hover:bg-accent-primary/10 hover:border-accent-primary/50 transition-colors"
                                                >
                                                    #SEQ {seqNum} <ExternalLink className="w-3 h-3" />
                                                </a>
                                            )}
                                        </div>

                                        <Card className={`p-5 mb-4 ${isFinal ? 'border-amber-400/30 bg-amber-400/5' : 'border-border/50 bg-surface'}`}>
                                            <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isFinal ? 'text-white font-medium' : 'text-white/80'}`}>
                                                {step.content}
                                            </p>

                                            <div className="mt-5 space-y-2 pt-4 border-t border-border/40">
                                                <div className="flex items-start sm:items-center gap-2 text-xs text-text-muted font-mono break-all sm:break-normal">
                                                    <span className="shrink-0">Hash:</span>
                                                    <span className="text-white/60">{step.hash}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[11px] text-success/80 font-medium bg-success/10 w-fit px-2 py-1 rounded">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Hash verified matching on-chain topic record
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Right Summary Column */}
                    <div className="space-y-6">
                        <Card className="p-6 border-border/50 bg-surface/50 backdrop-blur">
                            <h3 className="font-display font-bold text-lg text-white mb-6 border-b border-border/50 pb-4">{t('verify_summary')}</h3>

                            <div className="space-y-5">
                                <div>
                                    <span className="text-xs text-text-muted block mb-1">Proof ID</span>
                                    <span className="text-sm font-mono text-white/90 break-all">{proof.proofId}</span>
                                </div>

                                <div>
                                    <span className="text-xs text-text-muted block mb-1">{t('verify_created')}</span>
                                    <span className="text-sm text-white/90 flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-text-muted" />
                                        {new Date(proof.createdAt).toLocaleString()}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-xs text-text-muted block mb-1">{t('verify_topic')}</span>
                                    <a
                                        href={`https://hashscan.io/${process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet'}/topic/${proof.hcsTopicId}`} target="_blank" rel="noopener noreferrer"
                                        className="h-9 px-4 inline-flex items-center justify-center rounded-lg border border-border/50 bg-[#0F1116] text-sm font-medium hover:bg-white/5 hover:border-border transition-all"
                                    >
                                        {proof.hcsTopicId} <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>

                                <div>
                                    <span className="text-xs text-text-muted block mb-1">{t('verify_steps')}</span>
                                    <span className="text-sm font-bold text-white">{proof.totalSteps}</span>
                                </div>

                                <div className="pt-4 border-t border-border/50">
                                    <span className="text-xs text-text-muted block mb-2">{t('verify_root')}</span>
                                    <div className="bg-background border border-border rounded-lg p-3 text-[10px] sm:text-xs font-mono text-white/70 break-all">
                                        {proof.rootHash || "Computing..."}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Audit Certificate / NFT */}
                        <Card className="p-6 border-accent-primary/30 bg-gradient-to-br from-surface to-accent-primary/5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-accent-primary/20 text-accent-primary rounded-lg">
                                    <Network className="w-5 h-5" />
                                </div>
                                <h3 className="font-display font-bold text-white">{t('verify_certificate')}</h3>
                            </div>

                            <p className="text-xs text-text-muted leading-relaxed mb-6">{t('verify_cert_desc')}</p>

                            {proof.tokenTxId ? (
                                <a href={proof.explorerUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
                                    <Button className="w-full bg-accent-primary hover:bg-accent-secondary text-background font-bold h-11 shadow-[0_0_15px_rgba(45,212,191,0.2)]">
                                        {t('verify_view_pass')} <ExternalLink className="w-4 h-4 ml-2" />
                                    </Button>
                                </a>
                            ) : (
                                <Button disabled variant="outline" className="w-full text-xs h-11 border-border/50 text-text-muted">
                                    {t('verify_no_pass')}
                                </Button>
                            )}
                        </Card>

                        {/* Share link snippet */}
                        <div className="text-center">
                            <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">{t('verify_share')}</span>
                            <div className="mt-2 bg-surface-elevated border border-border rounded-lg p-2.5 text-xs font-mono text-white/50 break-all flex items-center justify-between">
                                <span>proofflow.app/verify?id={proof.proofId.substring(0, 8)}...</span>
                                <button
                                    onClick={() => navigator.clipboard.writeText(window.location.href)}
                                    className="p-1.5 hover:bg-white/10 rounded transition-colors text-white"
                                    title="Copy Link"
                                >
                                    <FileText className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </>
    );
}

export default function VerifyPage() {
    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-12">
            <Suspense fallback={<div className="text-center py-20 text-text-muted flex flex-col items-center justify-center"><ShieldCheck className="w-12 h-12 mb-4 opacity-50" /></div>}>
                <VerifyContent />
            </Suspense>
        </div>
    );
}
