'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Activity, Search, Filter, Hash, ExternalLink, ArrowRight, ShieldCheck, ChevronLeft, ChevronRight, Fingerprint } from 'lucide-react';
import { Card, Button, Badge, Skeleton } from '@/components/ui';
import { getRecentProofs, StoredProof } from '@/lib/api';
import { motion } from 'framer-motion';
import { useWallet } from '@/lib/wallet-context';
import { useLanguage } from '@/lib/language-context';

import VerificationBadge from '@/components/proofflow/VerificationBadge';
import AuditPassport from '@/components/proofflow/AuditPassport';
import LiveNetworkCounter from '@/components/proofflow/LiveNetworkCounter';
import CopyHash from '@/components/proofflow/CopyHash';
import { formatTimeAgoI18n } from '@/lib/utils';

export default function HistoryPage({ params }: { params: { network: string } }) {
    const { account, network, setNetwork } = useWallet();
    const { t } = useLanguage();

    const urlNetwork = params.network === 'mainnet' ? 'mainnet' : 'testnet';

    useEffect(() => {
        if (network !== urlNetwork && setNetwork) {
            setNetwork(urlNetwork);
        }
    }, [urlNetwork, network, setNetwork]);

    const [proofs, setProofs] = useState<StoredProof[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'All' | 'Verified' | 'Pending'>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    // Reset pagination when filter or search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filter, searchQuery]);

    const fetchProofs = async () => {
        try {
            const res = await getRecentProofs(account || undefined, urlNetwork);
            setProofs(res);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        setLoading(true);
        fetchProofs();
        const interval = setInterval(fetchProofs, 15000);
        return () => clearInterval(interval);
    }, [account]);

    const filteredProofs = proofs.filter(p => {
        const matchesSearch = p.proofId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.question.toLowerCase().includes(searchQuery.toLowerCase());

        if (filter === 'All') return matchesSearch;
        if (filter === 'Verified') return matchesSearch && (p.status === 'CONFIRMED' || p.status === 'VERIFIED');
        if (filter === 'Pending') return matchesSearch && (p.status === 'PUBLISHING' || p.status === 'PUBLISHING_TO_HEDERA');
        return matchesSearch;
    });

    const totalPages = Math.ceil(filteredProofs.length / ITEMS_PER_PAGE);
    const paginatedProofs = filteredProofs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const clipStyle = { clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' };
    const clipStyleSm = { clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' };

    return (
        <div className="space-y-6 pb-8">

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pb-6 border-b border-cyan-500/20">
                <div className="flex items-center gap-3 mb-3">
                    <div
                        className="w-10 h-10 flex items-center justify-center bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.15)]"
                        style={clipStyleSm}
                    >
                        <Fingerprint className="w-5 h-5" />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-wide" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                        {account ? t('history_title_personal') : t('history_title_global')}
                    </h1>
                </div>
                <p className="text-xs font-mono text-white/40 tracking-wide">
                    {account
                        ? `${t('history_subtitle_personal')} (${account.substring(0, 8)}...)`
                        : t('history_subtitle_global')}
                </p>
            </motion.div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 w-full">
                <div
                    className="flex items-center gap-0.5 bg-surface/40 backdrop-blur-sm p-1 border border-cyan-500/20"
                    style={clipStyleSm}
                >
                    {([['All', t('history_filter_all')], ['Verified', t('history_filter_verified')], ['Pending', t('history_filter_pending')]] as [string, string][]).map(([val, label]) => (
                        <button
                            key={val}
                            onClick={() => setFilter(val as any)}
                            className={`px-4 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-all ${filter === val
                                ? 'bg-cyan-500/15 text-cyan-400 font-bold shadow-[0_0_10px_rgba(34,211,238,0.1)]'
                                : 'text-white/40 hover:text-cyan-400/70'
                            }`}
                            style={clipStyleSm}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div className="relative w-full sm:w-64 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-cyan-400/40 group-focus-within:text-cyan-400 transition-colors z-10 pointer-events-none" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('history_search')}
                        className="w-full bg-surface/30 backdrop-blur-sm border border-cyan-500/20 pl-9 pr-4 py-2 text-xs font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-400/50 focus:shadow-[0_0_15px_rgba(34,211,238,0.1)] transition-all"
                        style={clipStyleSm}
                    />
                </div>
            </div>

            {/* Table Area — Desktop only */}
            <div className="hidden lg:block">
                <div
                    className="relative bg-surface/20 backdrop-blur-sm border border-cyan-500/20 overflow-hidden shadow-[0_0_40px_rgba(34,211,238,0.05)]"
                    style={clipStyle}
                >

                    <div className="overflow-x-auto w-full relative z-10">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                                <tr className="border-b border-cyan-500/15 bg-cyan-500/[0.03]">
                                    <th className="text-left text-[9px] font-mono uppercase tracking-[0.2em] text-cyan-400/50 py-3.5 px-6">{t('history_col_question')}</th>
                                    <th className="text-center text-[9px] font-mono uppercase tracking-[0.2em] text-cyan-400/50 py-3.5 pl-4 pr-8">{t('history_col_proof')}</th>
                                    <th className="text-center text-[9px] font-mono uppercase tracking-[0.2em] text-cyan-400/50 py-3.5 px-6">{t('history_col_status')}</th>
                                    <th className="text-left text-[9px] font-mono uppercase tracking-[0.2em] text-cyan-400/50 py-3.5 px-6">{t('history_col_time')}</th>
                                    <th className="text-right text-[9px] font-mono uppercase tracking-[0.2em] text-cyan-400/50 py-3.5 px-6">{t('history_col_actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="border-b border-cyan-500/10">
                                            <td className="p-4 pl-6"><div className="h-4 w-48 bg-white/5 animate-pulse" style={clipStyleSm} /></td>
                                            <td className="p-4"><div className="h-4 w-24 bg-white/5 animate-pulse mx-auto" style={clipStyleSm} /></td>
                                            <td className="p-4"><div className="h-4 w-20 bg-white/5 animate-pulse mx-auto" style={clipStyleSm} /></td>
                                            <td className="p-4"><div className="h-4 w-16 bg-white/5 animate-pulse" style={clipStyleSm} /></td>
                                            <td className="p-4 pr-6 text-right"><div className="h-7 w-16 bg-white/5 animate-pulse ml-auto" style={clipStyleSm} /></td>
                                        </tr>
                                    ))
                                ) : paginatedProofs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-16 text-center">
                                            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-cyan-400/30">
                                                &#x25C8; 0x_NULL_INDEX &#x25C8;
                                            </span>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedProofs.map((proof, i) => {
                                        const isVerified = proof.status === 'CONFIRMED' || proof.status === 'VERIFIED';

                                        return (
                                            <motion.tr
                                                key={proof.proofId}
                                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                                                className="border-b border-cyan-500/10 hover:bg-cyan-500/[0.03] transition-colors group"
                                            >
                                                <td className="p-4 pl-6">
                                                    <p className="text-xs font-mono text-white/70 max-w-[280px] truncate group-hover:text-white transition-colors" title={proof.question}>
                                                        {proof.question}
                                                    </p>
                                                </td>
                                                <td className="pl-4 pr-8 py-4 text-center">
                                                    <div
                                                        className="inline-flex items-center gap-1.5 text-[10px] font-mono text-cyan-400/60 bg-cyan-500/5 border border-cyan-500/15 px-2.5 py-1 mx-auto"
                                                        style={clipStyleSm}
                                                    >
                                                        <Hash className="w-3 h-3" />
                                                        <CopyHash hash={proof.proofId} chars={8} className="bg-transparent border-none p-0 h-auto hover:bg-transparent text-cyan-400/60 hover:text-cyan-400" />
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center align-middle">
                                                    <div
                                                        className={`inline-flex items-center justify-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 border mx-auto ${
                                                            isVerified
                                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                                                                : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                                                        }`}
                                                        style={clipStyleSm}
                                                    >
                                                        {isVerified ? <ShieldCheck className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                                                        {isVerified ? t('history_verified') : t('history_pending')}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-[11px] font-mono text-white/30">
                                                    {formatTimeAgoI18n(proof.createdAt, t)}
                                                </td>
                                                <td className="p-4 pr-6 text-right space-x-2">
                                                    {proof.explorerUrl && (
                                                        <a href={proof.explorerUrl} target="_blank" rel="noopener noreferrer">
                                                            <button
                                                                className="inline-flex items-center gap-1 h-7 text-[10px] px-3 font-mono uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-400/40 transition-all"
                                                                style={clipStyleSm}
                                                            >
                                                                TX <ExternalLink className="w-3 h-3" />
                                                            </button>
                                                        </a>
                                                    )}
                                                    <Link href={`/verify?id=${proof.proofId}`}>
                                                        <button
                                                            className="inline-flex items-center gap-1 h-7 text-[10px] px-3 font-mono uppercase tracking-wider bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-400 hover:text-black hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all"
                                                            style={clipStyleSm}
                                                        >
                                                            {t('nav_verify')} <ArrowRight className="w-3 h-3" />
                                                        </button>
                                                    </Link>
                                                </td>
                                            </motion.tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <div className="h-2"></div>

            {/* Card Layout — Mobile only */}
            <div className="lg:hidden space-y-3">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-surface/20 backdrop-blur-sm border border-cyan-500/15 p-4 space-y-3" style={clipStyleSm}>
                            <div className="h-5 w-3/4 bg-white/5 animate-pulse" style={clipStyleSm} />
                            <div className="flex justify-between">
                                <div className="h-4 w-24 bg-white/5 animate-pulse" style={clipStyleSm} />
                                <div className="h-4 w-16 bg-white/5 animate-pulse" style={clipStyleSm} />
                            </div>
                            <div className="h-8 w-full bg-white/5 animate-pulse" style={clipStyleSm} />
                        </div>
                    ))
                ) : paginatedProofs.length === 0 ? (
                    <div
                        className="p-10 text-center bg-surface/20 border border-dashed border-cyan-500/20"
                        style={clipStyle}
                    >
                        <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-cyan-400/30">
                            &#x25C8; 0x_NULL_INDEX &#x25C8;
                        </span>
                    </div>
                ) : (
                    paginatedProofs.map((proof, i) => {
                        const isVerified = proof.status === 'CONFIRMED' || proof.status === 'VERIFIED';
                        return (
                            <motion.div
                                key={proof.proofId}
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                            >
                                <div
                                    className="relative bg-surface/20 backdrop-blur-sm border border-cyan-500/15 p-4 overflow-hidden group hover:border-cyan-400/30 transition-colors"
                                    style={clipStyleSm}
                                >
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start gap-3 mb-3">
                                            <div
                                                className={`flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 border ${
                                                    isVerified
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                                                        : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                                                }`}
                                                style={clipStyleSm}
                                            >
                                                {isVerified ? <ShieldCheck className="w-2.5 h-2.5" /> : <Activity className="w-2.5 h-2.5" />}
                                                {isVerified ? t('history_verified') : t('history_pending')}
                                            </div>
                                            <span className="text-[9px] font-mono text-white/25">
                                                {formatTimeAgoI18n(proof.createdAt, t)}
                                            </span>
                                        </div>

                                        <h3 className="text-xs font-mono text-white/60 mb-4 line-clamp-2 leading-relaxed group-hover:text-white/80 transition-colors">
                                            {proof.question}
                                        </h3>

                                        <div className="flex items-center justify-between gap-2 pt-3 border-t border-cyan-500/10">
                                            <div className="flex items-center gap-1 min-w-0">
                                                <div
                                                    className="flex items-center gap-1 text-[9px] font-mono text-cyan-400/50 bg-cyan-500/5 border border-cyan-500/10 px-1.5 py-0.5"
                                                    style={clipStyleSm}
                                                >
                                                    <Hash className="w-2.5 h-2.5" />
                                                    <CopyHash hash={proof.proofId} chars={4} className="bg-transparent border-none p-0 h-auto text-cyan-400/50" />
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0">
                                                {proof.explorerUrl && (
                                                    <a href={proof.explorerUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
                                                        <button
                                                            className="w-7 h-7 flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                                                            style={clipStyleSm}
                                                        >
                                                            <ExternalLink className="w-3 h-3" />
                                                        </button>
                                                    </a>
                                                )}
                                                <Link href={`/verify?id=${proof.proofId}`} className="shrink-0">
                                                    <button
                                                        className="h-7 text-[9px] px-3 font-mono uppercase tracking-wider bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 hover:bg-cyan-400 hover:text-black transition-all flex items-center gap-1"
                                                        style={clipStyleSm}
                                                    >
                                                        {t('nav_verify')}
                                                        <ArrowRight className="w-2.5 h-2.5" />
                                                    </button>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div
                    className="flex flex-col sm:flex-row items-center justify-between bg-surface/20 backdrop-blur-sm border border-cyan-500/15 p-4 mt-4"
                    style={clipStyle}
                >
                    <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider mb-3 sm:mb-0">
                        {t('history_page')} <span className="text-cyan-400 font-bold">{currentPage}</span> {t('history_of')} <span className="text-cyan-400 font-bold">{totalPages}</span>
                    </span>
                    <div className="flex gap-1.5 isolate w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 justify-center sm:justify-end">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className="p-1.5 bg-surface/30 border border-cyan-500/15 text-white/30 hover:text-cyan-400 hover:border-cyan-400/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            style={clipStyleSm}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        
                        {Array.from({ length: totalPages }).map((_, idx) => {
                            const pageNum = idx + 1;
                            if (
                                pageNum === 1 ||
                                pageNum === totalPages ||
                                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                            ) {
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-8 h-8 text-[10px] font-mono font-bold transition-all border ${
                                            currentPage === pageNum 
                                            ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40 shadow-[0_0_12px_rgba(34,211,238,0.15)]' 
                                            : 'bg-surface/30 text-white/30 border-cyan-500/10 hover:text-cyan-400 hover:border-cyan-400/30'
                                        }`}
                                        style={clipStyleSm}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                                return <span key={pageNum} className="px-1 text-white/15 font-mono text-xs self-center">··</span>;
                            }
                            return null;
                        })}

                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            className="p-1.5 bg-surface/30 border border-cyan-500/15 text-white/30 hover:text-cyan-400 hover:border-cyan-400/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            style={clipStyleSm}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
