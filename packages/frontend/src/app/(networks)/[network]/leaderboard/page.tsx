'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Search, ShieldCheck, Shield, Bot, Sparkles, ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import { Card, Skeleton, Input, Button } from '@/components/ui';
import Badge from '@/components/ui/Badge';
import Link from 'next/link';
import CopyHash from '@/components/proofflow/CopyHash';
import { API_URL } from '@/lib/utils';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useWallet } from '@/lib/wallet-context';
import { useLanguage } from '@/lib/language-context';

interface LeaderboardEntry {
    account: string;
    balance: number;
    username?: string;
    isGenesis?: boolean;
}

const clipStyle = { clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' };
const clipStyleSm = { clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' };

const GenesisBadge = () => (
    <div
        className="flex items-center gap-1.5 border border-cyan-500/30 bg-cyan-500/5 px-2 py-0.5 transition-all hover:border-cyan-400/50 hover:bg-cyan-500/10 cursor-default w-fit mx-auto"
        style={clipStyleSm}
        title="Genesis Verified"
    >
        <Sparkles className="w-3 h-3 text-cyan-400" />
        <span className="text-[9px] font-mono font-bold text-cyan-400 tracking-widest uppercase">Genesis</span>
    </div>
);

export default function LeaderboardPage({ params }: { params: { network: string } }) {
    const { account, network, setNetwork } = useWallet();
    const { t } = useLanguage();

    const urlNetwork = params.network === 'mainnet' ? 'mainnet' : 'testnet';

    useEffect(() => {
        if (network !== urlNetwork && setNetwork) {
            setNetwork(urlNetwork);
        }
    }, [urlNetwork, network, setNetwork]);

    const [data, setData] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showPersonalOnly, setShowPersonalOnly] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(Date.now());
    const [now, setNow] = useState(Date.now());
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalEntries, setTotalEntries] = useState(0);
    const ITEMS_PER_PAGE = 20;

    const [hederaAccountId, setHederaAccountId] = useState<string | null>(null);

    const fetchLeaderboard = async (p: number = page) => {
        try {
            const res = await fetch(`${API_URL}/leaderboard?page=${p}&limit=${ITEMS_PER_PAGE}`, {
                headers: { 'x-network': urlNetwork }
            });
            if (!res.ok) throw new Error('Failed to fetch leaderboard');
            const result = await res.json();
            setData(result.data || result);
            setTotalPages(result.totalPages || 1);
            setTotalEntries(result.total || 0);
            setLastUpdated(Date.now());
            setNow(Date.now());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard(page);
        const fetchInterval = setInterval(() => fetchLeaderboard(page), 30000);
        const displayInterval = setInterval(() => setNow(Date.now()), 1000);
        return () => {
            clearInterval(fetchInterval);
            clearInterval(displayInterval);
        };
    }, [page]);

    const goToPage = (p: number) => {
        if (p < 1 || p > totalPages) return;
        setLoading(true);
        setPage(p);
    };

    useEffect(() => {
        if (!account) {
            setHederaAccountId(null);
            return;
        }

        const fetchHederaId = async () => {
            try {
                const res = await fetch(`https://${network}.mirrornode.hedera.com/api/v1/accounts/${account}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.account) {
                        setHederaAccountId(data.account);
                    }
                }
            } catch (err) {
                console.error("Failed to map EVM address to Hedera ID", err);
            }
        };

        fetchHederaId();
    }, [account]);

    let filtered = data.filter((e) =>
        e.account.toLowerCase().includes(search.toLowerCase())
    );

    const targetAccountId = hederaAccountId?.toLowerCase() || account?.toLowerCase();

    if (showPersonalOnly && targetAccountId) {
        filtered = filtered.filter((e) => e.account.toLowerCase() === targetAccountId);
    }

    const totalNetworkTokens = data.reduce((acc, curr) => acc + curr.balance, 0) || 1;
    const secondsAgo = Math.max(0, Math.floor((now - lastUpdated) / 1000));

    return (
        <Tooltip.Provider>
            <div className="space-y-6">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pb-6 border-b border-cyan-500/20">
                    <div className="flex items-center gap-3 mb-3">
                        <div
                            className="w-10 h-10 flex items-center justify-center bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.15)]"
                            style={clipStyleSm}
                        >
                            <Trophy className="w-5 h-5" />
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-wide" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                            {t('lb_title')}
                        </h1>
                        <div
                            className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400"
                            style={clipStyleSm}
                        >
                            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                            <span className="text-[9px] font-mono font-bold uppercase tracking-widest">LIVE</span>
                        </div>
                    </div>
                    <p className="text-xs font-mono text-white/40 tracking-wide">{t('lb_subtitle')}</p>
                </motion.div>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 w-full">
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                        <div
                            className="flex items-center gap-0.5 bg-surface/40 backdrop-blur-sm p-1 border border-cyan-500/20"
                            style={clipStyleSm}
                        >
                            <button
                                onClick={() => setShowPersonalOnly(false)}
                                className={`px-4 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-all ${!showPersonalOnly
                                    ? 'bg-cyan-500/15 text-cyan-400 font-bold shadow-[0_0_10px_rgba(34,211,238,0.1)]'
                                    : 'text-white/40 hover:text-cyan-400/70'
                                }`}
                                style={clipStyleSm}
                            >
                                {t('lb_global')}
                            </button>
                            <button
                                onClick={() => setShowPersonalOnly(true)}
                                disabled={!account}
                                className={`px-4 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-all ${showPersonalOnly
                                    ? 'bg-cyan-500/15 text-cyan-400 font-bold shadow-[0_0_10px_rgba(34,211,238,0.1)]'
                                    : 'text-white/40 hover:text-cyan-400/70'
                                } disabled:opacity-30 disabled:cursor-not-allowed`}
                                style={clipStyleSm}
                                title={!account ? "Connect wallet to view personal history" : ""}
                            >
                                {t('lb_my')}
                            </button>
                        </div>

                        <div className="flex items-center gap-2 text-[9px] font-mono text-white/25 shrink-0 ml-auto sm:ml-0 hidden sm:flex">
                            <Terminal className="w-3 h-3 text-cyan-400/40" />
                            <span>{t('lb_sync_ahead')} {secondsAgo}s</span>
                        </div>
                    </div>

                    <div className="relative w-full sm:w-64 group shrink-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-cyan-400/40 group-focus-within:text-cyan-400 transition-colors z-10 pointer-events-none" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t('lb_search')}
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
                        <div className="overflow-x-auto w-full">
                            <table className="w-full text-sm font-mono min-w-max md:min-w-full">
                                <thead>
                                    <tr className="border-b border-cyan-500/15 bg-cyan-500/[0.03]">
                                        <th className="text-left text-[9px] font-mono uppercase tracking-[0.2em] text-cyan-400/50 py-3.5 px-6 w-20">POS</th>
                                        <th className="text-left text-[9px] font-mono uppercase tracking-[0.2em] text-cyan-400/50 py-3.5 px-6">{t('lb_col_identity')}</th>
                                        <th className="text-center text-[9px] font-mono uppercase tracking-[0.2em] text-cyan-400/50 py-3.5 px-6 w-28">Tier</th>
                                        <th className="text-right text-[9px] font-mono uppercase tracking-[0.2em] text-cyan-400/50 py-3.5 px-6 w-32">{t('lb_col_tokens')}</th>
                                        <th className="text-left text-[9px] font-mono uppercase tracking-[0.2em] text-cyan-400/50 py-3.5 px-6 hidden md:table-cell">{t('lb_col_dominance')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading
                                        ? Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={i} className="border-b border-cyan-500/10">
                                                <td className="py-4 px-6"><div className="h-4 w-6 bg-white/5 animate-pulse" style={clipStyleSm} /></td>
                                                <td className="py-4 px-6"><div className="h-4 w-32 bg-white/5 animate-pulse" style={clipStyleSm} /></td>
                                                <td className="py-4 px-6"><div className="h-4 w-16 bg-white/5 animate-pulse mx-auto" style={clipStyleSm} /></td>
                                                <td className="py-4 px-6"><div className="h-4 w-12 bg-white/5 animate-pulse float-right" style={clipStyleSm} /></td>
                                                <td className="py-4 px-6 hidden md:table-cell"><div className="h-2 w-full bg-white/5 animate-pulse" style={clipStyleSm} /></td>
                                            </tr>
                                        ))
                                        : filtered.map((entry, i) => {
                                            const rank = (page - 1) * ITEMS_PER_PAGE + data.indexOf(entry) + 1;
                                            const progress = (entry.balance / totalNetworkTokens) * 100;
                                            const isMe = targetAccountId && entry.account.toLowerCase() === targetAccountId;

                                            return (
                                                <motion.tr
                                                    key={entry.account}
                                                    initial={{ opacity: 0, y: 8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.04 }}
                                                    className={`border-b group transition-colors ${isMe
                                                        ? 'bg-cyan-500/[0.06] border-cyan-500/20 hover:bg-cyan-500/[0.1]'
                                                        : 'border-cyan-500/10 hover:bg-cyan-500/[0.03]'
                                                    }`}
                                                >
                                                    <td className="py-4 px-6">
                                                        <span className={`text-[11px] font-mono font-bold ${rank <= 3 ? 'text-cyan-400' : isMe ? 'text-cyan-400/80' : 'text-white/30'}`}>
                                                            {rank.toString().padStart(2, '0')}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 flex items-center gap-3">
                                                        <div>
                                                            {entry.username ? (
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`font-bold text-xs ${isMe ? 'text-cyan-400' : 'text-white/80'}`}>{entry.username}</span>
                                                                    {isMe && (
                                                                        <CopyHash hash={entry.account} chars={8} className="bg-transparent border-transparent px-0 group-hover:bg-transparent text-white/30 scale-90 origin-left" />
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-2">
                                                                    {isMe ? (
                                                                        <CopyHash hash={entry.account} chars={12} className="bg-transparent border-transparent px-0 group-hover:bg-transparent text-cyan-400/70" />
                                                                    ) : (
                                                                        <span className="text-white/40 font-mono text-xs">{entry.account.slice(0, 6)}...{entry.account.slice(-4)}</span>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {isMe && (
                                                                <span
                                                                    className="px-1.5 py-0.5 mt-1 text-[8px] font-mono font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 tracking-widest block w-fit"
                                                                    style={clipStyleSm}
                                                                >
                                                                    YOU
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 align-middle">
                                                        <div className="flex justify-center w-full">
                                                            {entry.isGenesis && <GenesisBadge />}
                                                        </div>
                                                    </td>
                                                    <td className={`py-4 px-6 text-right font-bold align-middle text-xs ${isMe ? 'text-cyan-400' : 'text-white/70'}`}>
                                                        {entry.balance.toLocaleString()}
                                                    </td>
                                                    <td className="py-4 px-6 hidden md:table-cell">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-full bg-white/5 border border-cyan-500/10 h-1.5 overflow-hidden" style={clipStyleSm}>
                                                                <motion.div
                                                                    className={`${isMe ? 'bg-cyan-400' : 'bg-cyan-400/50'} h-full`}
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${progress}%` }}
                                                                    transition={{ duration: 1, delay: 0.2 + (i * 0.05) }}
                                                                />
                                                            </div>
                                                            <span className="text-[10px] font-mono text-white/25 w-8">{progress.toFixed(0)}%</span>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>
                        {!loading && filtered.length === 0 && (
                            <div className="text-center py-16 border-t border-cyan-500/10">
                                <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-cyan-400/30">
                                    &#x25C8; 0x_NULL_INDEX &#x25C8;
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Pagination Bar — Desktop */}
                    {!loading && totalPages > 0 && (
                        <div
                            className="flex items-center justify-between mt-4 bg-surface/20 backdrop-blur-sm border border-cyan-500/15 p-3"
                            style={clipStyleSm}
                        >
                            <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">
                                {totalEntries} wallets · Page <span className="text-cyan-400">{page}</span>/<span className="text-cyan-400">{totalPages}</span>
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => goToPage(page - 1)}
                                    disabled={page <= 1}
                                    className="p-1.5 bg-surface/30 border border-cyan-500/15 text-white/30 hover:text-cyan-400 hover:border-cyan-400/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                    style={clipStyleSm}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => goToPage(p)}
                                        className={`w-8 h-8 text-[10px] font-mono font-bold transition-all border ${
                                            p === page
                                                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40 shadow-[0_0_12px_rgba(34,211,238,0.15)]'
                                                : 'bg-surface/30 text-white/30 border-cyan-500/10 hover:text-cyan-400 hover:border-cyan-400/30'
                                        }`}
                                        style={clipStyleSm}
                                    >
                                        {p}
                                    </button>
                                ))}
                                <button
                                    onClick={() => goToPage(page + 1)}
                                    disabled={page >= totalPages}
                                    className="p-1.5 bg-surface/30 border border-cyan-500/15 text-white/30 hover:text-cyan-400 hover:border-cyan-400/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                    style={clipStyleSm}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Card Layout — Mobile only */}
                <div className="lg:hidden space-y-3">
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="bg-surface/20 backdrop-blur-sm border border-cyan-500/15 p-4 space-y-3" style={clipStyleSm}>
                                <div className="flex justify-between items-center">
                                    <div className="h-5 w-8 bg-white/5 animate-pulse" style={clipStyleSm} />
                                    <div className="h-4 w-24 bg-white/5 animate-pulse" style={clipStyleSm} />
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="h-6 w-32 bg-white/5 animate-pulse" style={clipStyleSm} />
                                    <div className="h-6 w-16 bg-white/5 animate-pulse" style={clipStyleSm} />
                                </div>
                                <div className="h-2 w-full bg-white/5 animate-pulse" style={clipStyleSm} />
                            </div>
                        ))
                    ) : filtered.length === 0 ? (
                        <div
                            className="p-10 text-center bg-surface/20 border border-dashed border-cyan-500/20"
                            style={clipStyle}
                        >
                            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-cyan-400/30">
                                &#x25C8; 0x_NULL_INDEX &#x25C8;
                            </span>
                        </div>
                    ) : (
                        filtered.map((entry, i) => {
                            const rank = (page - 1) * ITEMS_PER_PAGE + data.indexOf(entry) + 1;
                            const progress = (entry.balance / totalNetworkTokens) * 100;
                            const isMe = targetAccountId && entry.account.toLowerCase() === targetAccountId;

                            return (
                                <motion.div
                                    key={entry.account}
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                                >
                                    <div
                                        className={`relative bg-surface/20 backdrop-blur-sm border p-4 overflow-hidden group transition-colors ${
                                            isMe
                                                ? 'border-cyan-500/30 hover:border-cyan-400/50'
                                                : 'border-cyan-500/15 hover:border-cyan-400/30'
                                        }`}
                                        style={clipStyleSm}
                                    >
                                        <div className="flex justify-between items-start gap-3 mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[11px] font-mono font-bold ${rank <= 3 ? 'text-cyan-400' : isMe ? 'text-cyan-400/80' : 'text-white/30'}`}>
                                                    #{rank.toString().padStart(2, '0')}
                                                </span>
                                                {isMe && (
                                                    <span
                                                        className="px-1.5 py-0.5 text-[8px] font-mono font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 tracking-widest"
                                                        style={clipStyleSm}
                                                    >
                                                        YOU
                                                    </span>
                                                )}
                                            </div>
                                            <span
                                                className="text-[9px] font-mono text-white/25 bg-white/5 border border-cyan-500/10 px-2 py-0.5"
                                                style={clipStyleSm}
                                            >
                                                {progress.toFixed(1)}%
                                            </span>
                                        </div>

                                        <div className="flex flex-col gap-1 mb-4">
                                            {entry.username ? (
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`font-bold text-sm ${isMe ? 'text-cyan-400' : 'text-white/70'}`}>{entry.username}</span>
                                                    </div>
                                                    {isMe && <CopyHash hash={entry.account} chars={8} className="bg-transparent border-transparent px-0 text-white/30 scale-90 origin-right" />}
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        {isMe ? (
                                                            <CopyHash hash={entry.account} chars={12} className="bg-transparent border-transparent px-0 text-cyan-400/70 font-mono text-sm" />
                                                        ) : (
                                                            <span className="text-white/40 font-mono text-sm">{entry.account.length > 15 ? `${entry.account.slice(0, 8)}...${entry.account.slice(-6)}` : `${entry.account.slice(0, 5)}***${entry.account.slice(-2)}`}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between gap-4 pt-3 border-t border-cyan-500/10">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[9px] uppercase font-mono font-bold text-white/25 tracking-widest">{t('lb_col_tokens')}</span>
                                                {entry.isGenesis && <GenesisBadge />}
                                            </div>
                                            <div className={`text-base font-bold font-mono ${isMe ? 'text-cyan-400' : 'text-white/70'}`}>
                                                {entry.balance.toLocaleString()}
                                            </div>
                                        </div>

                                        <div className="mt-3 flex items-center gap-3">
                                            <div className="w-full bg-white/5 border border-cyan-500/10 h-1.5 overflow-hidden" style={clipStyleSm}>
                                                <motion.div
                                                    className={`${isMe ? 'bg-cyan-400' : 'bg-cyan-400/50'} h-full`}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progress}%` }}
                                                    transition={{ duration: 1, delay: 0.2 + (i * 0.05) }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}

                    {/* Pagination Bar — Mobile */}
                    {!loading && totalPages > 0 && (
                        <div
                            className="flex items-center justify-between mt-4 bg-surface/20 backdrop-blur-sm border border-cyan-500/15 p-3"
                            style={clipStyleSm}
                        >
                            <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">
                                P<span className="text-cyan-400">{page}</span>/<span className="text-cyan-400">{totalPages}</span>
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => goToPage(page - 1)}
                                    disabled={page <= 1}
                                    className="p-1.5 bg-surface/30 border border-cyan-500/15 text-white/30 hover:text-cyan-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                    style={clipStyleSm}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => goToPage(p)}
                                        className={`w-8 h-8 text-[10px] font-mono font-bold transition-all border ${
                                            p === page
                                                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                                                : 'bg-surface/30 text-white/30 border-cyan-500/10 hover:text-cyan-400'
                                        }`}
                                        style={clipStyleSm}
                                    >
                                        {p}
                                    </button>
                                ))}
                                <button
                                    onClick={() => goToPage(page + 1)}
                                    disabled={page >= totalPages}
                                    className="p-1.5 bg-surface/30 border border-cyan-500/15 text-white/30 hover:text-cyan-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                    style={clipStyleSm}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Tooltip.Provider>
    );
}
