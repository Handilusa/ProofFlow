'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, ShieldCheck, ExternalLink, Network, FileText, CheckCircle2, ChevronRight, Hash, Clock, Loader2 } from 'lucide-react';
import { Card, Button, Input, Skeleton } from '@/components/ui';
import Badge from '@/components/ui/Badge';
import AuditPassport from '@/components/proofflow/AuditPassport';
import VerifyOnChainButton from '@/components/proofflow/VerifyOnChainButton';
import { getProof, StoredProof, getRecentProofs } from '@/lib/api';
import { useLanguage } from '@/lib/language-context';
import { useWallet } from '@/lib/wallet-context';

function VerifyContent() {
    const searchParams = useSearchParams();
    const initialId = searchParams.get('id') || '';
    const { t, language } = useLanguage();
    const { network } = useWallet();

    const [proofId, setProofId] = useState(initialId);
    const [isVerifying, setIsVerifying] = useState(false);
    const [proof, setProof] = useState<StoredProof | null>(null);
    const [error, setError] = useState('');
    const [recentIds, setRecentIds] = useState<string[]>([]);

    useEffect(() => {
        // Fetch some recent IDs for the "Try these" suggestions
        getRecentProofs(undefined, network).then(res => {
            if (res && res.length > 0) {
                setRecentIds(res.slice(0, 3).map(p => p.proofId));
            }
        }).catch(console.error);

        if (initialId) {
            handleVerify(initialId);
        }
    }, [initialId, network]);

    const handleVerify = async (idToVerify: string = proofId) => {
        if (!idToVerify.trim()) return;

        setIsVerifying(true);
        setError('');
        setProof(null);

        try {
            const result = await getProof(idToVerify, network);
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
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-sm bg-cyan-500/10 text-cyan-400 mb-6 border border-cyan-500/30 shadow-[0_0_30px_rgba(34,211,238,0.15)] relative"
                     style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                >
                    {/* Custom Proof/Node Icon */}
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                        <path d="M21 3v5h-5" />
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 9v-2" />
                        <path d="M12 15v2" />
                        <path d="M9 12H7" />
                        <path d="M15 12h2" />
                    </svg>
                </div>
                <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4 tracking-wide" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    {t('verify_title')}
                </h1>
                <p className="text-cyan-400/60 font-mono text-sm max-w-lg mx-auto leading-relaxed">
                    {t('verify_subtitle')}
                </p>
            </motion.div>

            {/* Input Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="relative max-w-3xl mx-auto group"
            >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" 
                     style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }} />
                
                <div className="p-1.5 pl-4 border border-cyan-500/30 bg-[#0a0f18] shadow-[0_0_20px_rgba(34,211,238,0.05)] flex items-center gap-4 relative z-10 transition-colors hover:border-cyan-400/50"
                     style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
                >
                    <Search className="w-5 h-5 text-cyan-500/60 shrink-0" />
                    <input
                        type="text"
                        placeholder={t('verify_placeholder')}
                        className="flex-1 bg-transparent border-none text-white focus:outline-none focus:ring-0 placeholder-cyan-500/30 text-sm font-mono w-full"
                        value={proofId}
                        onChange={(e) => setProofId(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                    />
                    <button
                        onClick={() => handleVerify()}
                        disabled={isVerifying || !proofId.trim()}
                        className="shrink-0 h-10 px-6 font-mono font-bold text-xs tracking-widest uppercase bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}
                    >
                        {isVerifying ? (
                            <span className="flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('verify_loading')}</span>
                        ) : t('verify_button')}
                    </button>
                </div>
            </motion.div>

            {/* Suggestions */}
            {!proof && !isVerifying && recentIds.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="flex flex-wrap items-center justify-center gap-3 mt-6"
                >
                    <span className="text-[10px] text-cyan-400/60 uppercase tracking-widest font-mono font-bold">{t('verify_try')}</span>
                    {recentIds.map((id, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                setProofId(id);
                                handleVerify(id);
                            }}
                            className="px-2 py-1 border border-cyan-500/20 bg-cyan-500/5 text-cyan-400/80 font-mono text-[9px] uppercase tracking-wider hover:text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-400/50 transition-all shadow-[0_0_10px_rgba(34,211,238,0.05)] w-auto max-w-[100px] truncate"
                            style={{ clipPath: 'polygon(3px 0, 100% 0, 100% calc(100% - 3px), calc(100% - 3px) 100%, 0 100%, 0 3px)' }}
                        >
                            {id.substring(0, 8)}
                        </button>
                    ))}
                </motion.div>
            )}

            {/* Error State */}
            {error && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
                            className="text-center p-4 bg-red-500/10 border border-red-500/30 max-w-2xl mx-auto shadow-[0_0_20px_rgba(239,68,68,0.15)]"
                            style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}>
                    <p className="text-red-400 font-mono text-xs uppercase tracking-widest font-bold font-display flex items-center justify-center gap-2">
                        <div className="w-1.5 h-1.5 bg-red-500 animate-pulse" /> {error}
                    </p>
                </motion.div>
            )}

            {/* Loading State */}
            {isVerifying && (
                <div className="space-y-6 max-w-3xl mx-auto mt-12">
                    <div className="h-32 w-full bg-[#0a0f18] border border-cyan-500/20 relative overflow-hidden"
                         style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent animate-[shimmer_1.5s_infinite]" />
                    </div>
                    <div className="h-48 w-full bg-[#0a0f18] border border-cyan-500/20 relative overflow-hidden"
                         style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent animate-[shimmer_1.5s_infinite_0.5s]" />
                    </div>
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

                        <div className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-3 py-1.5 font-mono font-bold text-[10px] tracking-widest flex items-center gap-2 w-fit"
                             style={{ clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)' }}>
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" /> ON-CHAIN ANCHORED
                        </div>

                        <h2 className="text-2xl font-display font-bold text-white leading-snug">
                            Question: "{proof.question}"
                        </h2>

                        <VerifyOnChainButton 
                            steps={proof.steps} 
                            providedRootHash={proof.rootHash || ""} 
                            topicId={proof.hcsTopicId} 
                        />

                        {/* ═══ HCS ANCHOR DETAILS ═══ */}
                        <motion.div
                            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                            className="relative overflow-hidden bg-[#060a12] border border-cyan-500/20 rounded-sm p-[1px] transition-colors duration-500 hover:border-cyan-500/40"
                            style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
                        >
                            <div className="relative bg-[#0a0f18] w-full p-5 md:p-6"
                                 style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
                            >
                                {/* Background Grid */}
                                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-20" />

                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Hash className="w-3.5 h-3.5 text-cyan-400/60" />
                                        <span className="text-[10px] font-mono tracking-[0.25em] text-cyan-400/60 uppercase font-bold">
                                            {t('verify_anchor_title')}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-white/40 font-mono mb-5 leading-relaxed max-w-xl">
                                        {t('verify_anchor_subtitle')}
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Network */}
                                        <div className="bg-[#060a12] border border-cyan-500/15 p-3"
                                             style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}>
                                            <span className="text-[9px] text-cyan-400/50 uppercase tracking-widest font-mono font-bold block mb-1">{t('verify_anchor_network')}</span>
                                            <span className="text-sm font-mono text-white/90 flex items-center gap-2">
                                                <Network className="w-3.5 h-3.5 text-cyan-400/60" />
                                                {network.toUpperCase()}
                                            </span>
                                        </div>

                                        {/* Topic ID */}
                                        <div className="bg-[#060a12] border border-cyan-500/15 p-3"
                                             style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}>
                                            <span className="text-[9px] text-cyan-400/50 uppercase tracking-widest font-mono font-bold block mb-1">{t('verify_anchor_consensus_topic')}</span>
                                            <a href={`https://hashscan.io/${network}/topic/${proof.hcsTopicId}`} target="_blank" rel="noopener noreferrer"
                                               className="text-sm font-mono text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                                                {proof.hcsTopicId} <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>

                                        {/* Sequence Range */}
                                        {proof.hcsSequenceNumbers && proof.hcsSequenceNumbers.length > 0 && (
                                            <div className="bg-[#060a12] border border-cyan-500/15 p-3"
                                                 style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}>
                                                <span className="text-[9px] text-cyan-400/50 uppercase tracking-widest font-mono font-bold block mb-1">{t('verify_anchor_seq_range')}</span>
                                                <span className="text-sm font-mono text-white/90">
                                                    SEQ #{proof.hcsSequenceNumbers[0]} — #{proof.hcsSequenceNumbers[proof.hcsSequenceNumbers.length - 1]}
                                                </span>
                                            </div>
                                        )}

                                        {/* Merkle Root */}
                                        <div className="bg-[#060a12] border border-cyan-500/15 p-3 sm:col-span-2"
                                             style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}>
                                            <span className="text-[9px] text-cyan-400/50 uppercase tracking-widest font-mono font-bold block mb-1">{t('verify_anchor_merkle_root')}</span>
                                            <span className="text-[11px] font-mono text-cyan-400/80 break-all">{proof.rootHash || '—'}</span>
                                        </div>
                                    </div>

                                    {/* Explorer Button */}
                                    <a href={`https://hashscan.io/${network}/topic/${proof.hcsTopicId}`} target="_blank" rel="noopener noreferrer"
                                       className="mt-5 w-full h-10 bg-cyan-500/5 hover:bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 font-mono font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(34,211,238,0.08)]"
                                       style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}
                                    >
                                        {t('verify_anchor_explorer')} <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                </div>
                            </div>
                        </motion.div>

                        {/* ═══ AI COURT EVIDENCE ═══ */}
                        <motion.div
                            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                            className="relative overflow-hidden bg-[#060a12] border border-emerald-500/20 rounded-sm p-[1px] transition-colors duration-500 hover:border-emerald-500/40"
                            style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
                        >
                            <div className="relative bg-[#0a0f18] w-full px-5 py-4 md:px-6 flex flex-col sm:flex-row items-start sm:items-center gap-4"
                                 style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
                            >
                                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-20" />

                                <div className="flex-1 relative z-10">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400/70" />
                                        <span className="text-[10px] font-mono tracking-[0.25em] text-emerald-400/70 uppercase font-bold">
                                            {t('verify_court_evidence')}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-white/40 font-mono leading-relaxed max-w-lg">
                                        {t('verify_court_desc')}
                                    </p>
                                </div>

                                <div className="shrink-0 relative z-10 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-emerald-400 font-mono font-bold text-[10px] tracking-widest uppercase"
                                     style={{ clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)' }}>
                                    <ShieldCheck className="w-3.5 h-3.5" /> COMPLIANT
                                </div>
                            </div>
                        </motion.div>

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
                                                    href={`https://hashscan.io/${network}/topic/${proof.hcsTopicId}?sequenceNumber=${seqNum}`} target="_blank" rel="noopener noreferrer"
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

                        {/* Audit Passport & EVM Anchor Status */}
                        {(proof.status === "CONFIRMED" || proof.status === "VERIFIED") && proof.tokenTxId && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.4 }}
                                className="space-y-4 mt-8"
                            >
                                <AuditPassport
                                    tokenTxId={proof.tokenTxId}
                                    proofId={proof.proofId}
                                />

                                {/* 5th Pillar: Autonomous Agent EVM Settlement */}
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                                    className="relative overflow-hidden bg-[#060a12] border border-amber-500/20 rounded-sm p-[1px] transition-colors duration-500 hover:border-amber-500/40"
                                    style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
                                >
                                    <div className="relative bg-[#0a0f18] w-full p-4 md:p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
                                         style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
                                    >
                                        {/* Background Grid Pattern (Subtle) */}
                                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-20" />
                                        
                                        {/* Subtle amber glow effect */}
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-[40px] pointer-events-none" />

                                        <div className="relative z-10 flex-1">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <ShieldCheck className="w-4 h-4 text-amber-500" />
                                                <h4 className="text-[11px] font-bold text-amber-500 font-mono uppercase tracking-widest">
                                                    {language === 'es' ? 'Anclaje EVM Autónomo' : 'Autonomous EVM Anchor'}
                                                </h4>
                                            </div>
                                            <p className="text-[11px] text-white/40 font-mono mt-1 max-w-sm leading-relaxed">
                                                {language === 'es' ? 'El Agente Autónomo ancló este resultado en el Smart Contract de Hedera EVM automáticamente.' : 'The Autonomous Agent anchored this result on the Hedera EVM Smart Contract automatically.'}
                                            </p>
                                        </div>

                                        <div className="relative z-10 shrink-0">
                                            {proof.status === 'VERIFIED' || (proof as any).evmSettled ? (
                                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                                                     style={{ clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)' }}>
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    {language === 'es' ? 'Verificado por Agente' : 'Agent Verified'}
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold tracking-widest uppercase animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                                                     style={{ clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)' }}>
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    {language === 'es' ? 'Agente procesando...' : 'Agent processing...'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* EVM Tx Footer integrated natively */}
                                    {(proof as any).evmTxHash && (
                                        <div className="relative z-10 bg-[#060a12]/80 border-t border-amber-500/10 px-4 py-2 flex items-center justify-between text-[10px] font-mono">
                                            <span className="text-amber-500/50 font-bold tracking-widest">EVM TX:</span>
                                            <a href={`https://hashscan.io/${network}/tx/${(proof as any).evmTxHash}`} target="_blank" rel="noreferrer" 
                                               className="text-amber-400 hover:text-amber-300 transition-colors truncate ml-2">
                                                {(proof as any).evmTxHash}
                                            </a>
                                        </div>
                                    )}
                                </motion.div>
                            </motion.div>
                        )}
                    </div>

                    {/* Right Summary Column */}
                    <div className="space-y-6">
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-br from-cyan-500/20 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" 
                                 style={{ clipPath: 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)' }} />
                            
                            <div className="relative p-6 bg-[#0a0f18] border border-cyan-500/30 transition-colors hover:border-cyan-400/50"
                                 style={{ clipPath: 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)' }}>
                                {/* Background Grid */}
                                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-20" />

                                <div className="relative z-10">
                                    <h3 className="font-display font-bold text-lg text-white mb-6 border-b border-cyan-500/20 pb-4 tracking-wide" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                                        {t('verify_summary')}
                                    </h3>

                                    <div className="space-y-6">
                                        <div>
                                            <span className="text-[10px] text-cyan-400/60 uppercase tracking-widest font-mono font-bold block mb-1">Proof ID</span>
                                            <span className="text-sm font-mono text-white/90 break-all">{proof.proofId}</span>
                                        </div>

                                        <div>
                                            <span className="text-[10px] text-cyan-400/60 uppercase tracking-widest font-mono font-bold block mb-1">{t('verify_created')}</span>
                                            <span className="text-sm text-white/90 flex items-center gap-2 font-mono">
                                                <Clock className="w-4 h-4 text-cyan-400/50" />
                                                {new Date(proof.createdAt).toLocaleString()}
                                            </span>
                                        </div>

                                        <div>
                                            <span className="text-[10px] text-cyan-400/60 uppercase tracking-widest font-mono font-bold block mb-2">{t('verify_topic')}</span>
                                            <a
                                                href={`https://hashscan.io/${network}/topic/${proof.hcsTopicId}`} target="_blank" rel="noopener noreferrer"
                                                className="h-9 px-4 inline-flex items-center justify-center border border-cyan-500/30 bg-cyan-500/5 text-sm font-mono text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-400/50 transition-all shadow-[0_0_15px_rgba(34,211,238,0.1)]"
                                                style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}
                                            >
                                                {proof.hcsTopicId} <ExternalLink className="w-3.5 h-3.5 ml-2" />
                                            </a>
                                        </div>

                                        <div>
                                            <span className="text-[10px] text-cyan-400/60 uppercase tracking-widest font-mono font-bold block mb-1">{t('verify_steps')}</span>
                                            <span className="text-sm font-bold text-white font-mono">{proof.totalSteps}</span>
                                        </div>

                                        <div className="pt-5 border-t border-cyan-500/20">
                                            <span className="text-[10px] text-cyan-400/60 uppercase tracking-widest font-mono font-bold block mb-2">{t('verify_root')}</span>
                                            <div className="bg-[#060a12] border border-cyan-500/30 p-3 text-[10px] sm:text-xs font-mono text-cyan-400 break-all shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]"
                                                 style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}>
                                                {proof.rootHash || "Computing..."}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Audit Certificate / NFT */}
                        <div className="relative group mt-8">
                            <div className="absolute -inset-0.5 bg-gradient-to-br from-cyan-500/20 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" 
                                 style={{ clipPath: 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)' }} />
                            
                            <div className="relative p-6 bg-[#0a0f18] border border-cyan-500/30 transition-colors hover:border-cyan-400/50"
                                 style={{ clipPath: 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)' }}>
                                {/* Background Grid */}
                                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-20" />

                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-4 border-b border-cyan-500/20 pb-4">
                                        <div className="p-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono text-[10px] tracking-widest flex items-center justify-center shrink-0"
                                             style={{ clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)' }}>
                                            <Network className="w-4 h-4" />
                                        </div>
                                        <h3 className="font-display font-bold text-white tracking-wide" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                                            {t('verify_certificate')}
                                        </h3>
                                    </div>

                                    <p className="text-xs text-white/50 leading-relaxed font-mono mb-6">
                                        {t('verify_cert_desc')}
                                    </p>

                                    {proof.tokenTxId ? (
                                        <a href={proof.explorerUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
                                            <button className="w-full h-11 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 font-mono font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.15)]"
                                                style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                                            >
                                                {t('verify_view_pass')} <ExternalLink className="w-4 h-4 ml-2" />
                                            </button>
                                        </a>
                                    ) : (
                                        <button disabled className="w-full h-11 text-white/30 border border-white/10 font-mono text-xs uppercase tracking-widest cursor-not-allowed"
                                                style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}>
                                            {t('verify_no_pass')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Share link snippet */}
                        <div className="pt-8 text-center">
                            <span className="text-[10px] text-cyan-400/60 uppercase tracking-widest font-mono font-bold">{t('verify_share')}</span>
                            <div className="mt-3 bg-[#0a0f18] border border-cyan-500/30 p-2.5 text-xs font-mono text-cyan-400/80 break-all flex items-center justify-between transition-colors hover:border-cyan-400/50"
                                 style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}>
                                <span className="pl-2">proofflow.app/verify?id={proof.proofId.substring(0, 8)}...</span>
                                <button
                                    onClick={() => navigator.clipboard.writeText(window.location.href)}
                                    className="p-1.5 hover:bg-cyan-500/20 text-cyan-400 transition-colors border border-transparent hover:border-cyan-500/30"
                                    style={{ clipPath: 'polygon(3px 0, 100% 0, 100% calc(100% - 3px), calc(100% - 3px) 100%, 0 100%, 0 3px)' }}
                                    title="Copy Link"
                                >
                                    <FileText className="w-4 h-4" />
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
            <Suspense fallback={
                <div className="text-center py-20 text-cyan-500/30 flex flex-col items-center justify-center">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-4 animate-pulse">
                        <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                        <path d="M21 3v5h-5" />
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 9v-2" />
                        <path d="M12 15v2" />
                        <path d="M9 12H7" />
                        <path d="M15 12h2" />
                    </svg>
                </div>
            }>
                <VerifyContent />
            </Suspense>
        </div>
    );
}
