'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Activity, Search, Filter, Hash, ExternalLink, ArrowRight, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
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

export default function HistoryPage() {
    const { account } = useWallet();
    const { t } = useLanguage();
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
            const res = await getRecentProofs(account || undefined);
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

    return (
        <div className="space-y-8 pb-10">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
                        <Activity className="w-8 h-8 text-accent-primary" /> {account ? t('history_title_personal') : t('history_title_global')}
                    </h1>
                    <p className="text-text-muted mt-2">
                        {account
                            ? `${t('history_subtitle_personal')} (${account.substring(0, 8)}...).`
                            : t('history_subtitle_global')}
                    </p>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex items-center gap-2 bg-surface p-1 rounded-xl border border-border/50 w-fit">
                    {([['All', t('history_filter_all')], ['Verified', t('history_filter_verified')], ['Pending', t('history_filter_pending')]] as [string, string][]).map(([val, label]) => (
                        <button
                            key={val}
                            onClick={() => setFilter(val as any)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === val ? 'bg-accent-primary/10 text-accent-primary' : 'text-text-muted hover:text-white'}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('history_search')}
                        className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-accent-primary transition-colors"
                    />
                </div>
            </div>

            {/* Table Area */}
            <Card className="border-border/50 overflow-hidden overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                        <tr className="border-b border-border/50 bg-surface/50 text-xs uppercase tracking-wider text-text-muted font-semibold">
                            <th className="p-4 pl-6">{t('history_col_question')}</th>
                            <th className="p-4">{t('history_col_proof')}</th>
                            <th className="p-4">{t('history_col_steps')}</th>
                            <th className="p-4">{t('history_col_status')}</th>
                            <th className="p-4">{t('history_col_time')}</th>
                            <th className="p-4 pr-6 text-right">{t('history_col_actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i}>
                                    <td className="p-4 pl-6"><Skeleton className="h-5 w-48" /></td>
                                    <td className="p-4"><Skeleton className="h-5 w-24" /></td>
                                    <td className="p-4"><Skeleton className="h-5 w-8" /></td>
                                    <td className="p-4"><Skeleton className="h-5 w-20" /></td>
                                    <td className="p-4"><Skeleton className="h-5 w-16" /></td>
                                    <td className="p-4 pr-6 text-right"><Skeleton className="h-8 w-16 ml-auto" /></td>
                                </tr>
                            ))
                        ) : paginatedProofs.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-10 text-center text-text-muted">
                                    {t('history_empty')}
                                </td>
                            </tr>
                        ) : (
                            paginatedProofs.map((proof, i) => {
                                const isVerified = proof.status === 'CONFIRMED' || proof.status === 'VERIFIED';

                                return (
                                    <motion.tr
                                        key={proof.proofId}
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                        className="hover:bg-surface-elevated/30 transition-colors group"
                                    >
                                        <td className="p-4 pl-6">
                                            <p className="text-sm font-medium text-white max-w-[280px] truncate" title={proof.question}>
                                                {proof.question}
                                            </p>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1.5 text-xs font-mono text-text-muted bg-background w-fit px-2 py-1 rounded border border-border/50">
                                                <Hash className="w-3 h-3" />
                                                <CopyHash hash={proof.proofId} chars={8} className="bg-transparent border-none p-0 h-auto hover:bg-transparent text-text-muted hover:text-white" />
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-sm font-semibold text-white/90">{proof.totalSteps}</span>
                                        </td>
                                        <td className="p-4">
                                            <div className={`flex items-center gap-1.5 text-xs font-medium w-fit px-2.5 py-1 rounded-full border ${isVerified ? 'bg-success/10 text-success border-success/20' : 'bg-amber-400/10 text-amber-400 border-amber-400/20'}`}>
                                                {isVerified ? <ShieldCheck className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5" />}
                                                {isVerified ? t('history_verified') : t('history_pending')}
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-text-muted">
                                            {formatTimeAgoI18n(proof.createdAt, t)}
                                        </td>
                                        <td className="p-4 pr-6 text-right space-x-2">
                                            {proof.explorerUrl && (
                                                <a href={proof.explorerUrl} target="_blank" rel="noopener noreferrer">
                                                    <Button variant="outline" size="sm" className="h-8 text-[11px] px-3 font-mono border-border/50 text-emerald-400 hover:bg-emerald-400/10 hover:border-emerald-400/30">
                                                        {t('history_reward_tx')} <ExternalLink className="w-3 h-3 ml-1" />
                                                    </Button>
                                                </a>
                                            )}
                                            <Link href={`/verify?id=${proof.proofId}`}>
                                                <Button size="sm" className="h-8 text-[11px] px-3 bg-accent-primary/20 text-accent-primary hover:bg-accent-primary hover:text-black hover:border-accent-primary">
                                                    {t('nav_verify')} <ArrowRight className="w-3 h-3 ml-1" />
                                                </Button>
                                            </Link>
                                        </td>
                                    </motion.tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </Card>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border/50 pt-4 mt-4 text-sm">
                    <span className="text-text-muted px-4">
                        {t('history_page')} {currentPage} {t('history_of')} {totalPages}
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === 1}
                            onClick={() => {
                                setCurrentPage(p => Math.max(1, p - 1));
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="bg-surface border-border/50 hover:bg-surface-elevated text-text-muted hover:text-white transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" /> {t('history_prev')}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === totalPages}
                            onClick={() => {
                                setCurrentPage(p => Math.min(totalPages, p + 1));
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="bg-surface border-border/50 hover:bg-surface-elevated text-text-muted hover:text-white transition-colors"
                        >
                            {t('history_next')} <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
