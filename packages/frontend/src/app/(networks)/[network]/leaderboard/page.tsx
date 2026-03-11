'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Search, ShieldCheck, Shield, Bot, Sparkles } from 'lucide-react';
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

const GenesisBadge = () => (
    <div className="flex items-center gap-2 border border-cyan-500/30 bg-transparent px-2.5 py-1 rounded-md transition-all hover:border-cyan-400/50 hover:bg-cyan-500/5 cursor-default w-fit mx-auto" title="Genesis Verified">
        <Sparkles className="w-3 h-3 text-cyan-400" />
        <span className="text-[10px] font-medium text-white tracking-widest uppercase">Genesis</span>
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

    const [hederaAccountId, setHederaAccountId] = useState<string | null>(null);

    const fetchLeaderboard = async () => {
        try {
            const res = await fetch(`${API_URL}/leaderboard`, {
                headers: { 'x-network': urlNetwork }
            });
            if (!res.ok) throw new Error('Failed to fetch leaderboard');
            const result = await res.json();
            setData(result);
            setLastUpdated(Date.now());
            setNow(Date.now());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard();
        const fetchInterval = setInterval(fetchLeaderboard, 30000);
        const displayInterval = setInterval(() => setNow(Date.now()), 1000);
        return () => {
            clearInterval(fetchInterval);
            clearInterval(displayInterval);
        };
    }, []);

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
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pb-4 border-b border-border/50">
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-display font-bold text-white">{t('lb_title')}</h1>
                        <Badge variant="success" className="h-6">LIVE</Badge>
                    </div>
                    <p className="text-text-muted font-sans text-sm">{t('lb_subtitle')}</p>
                </motion.div>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 w-full">
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                        <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-border/50 w-fit shrink-0">
                            <button
                                onClick={() => setShowPersonalOnly(false)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-mono transition-all ${!showPersonalOnly ? 'bg-accent-primary/10 text-accent-primary shadow-glow-sm font-bold' : 'text-text-muted hover:text-white'}`}
                            >
                                {t('lb_global')}
                            </button>
                            <button
                                onClick={() => setShowPersonalOnly(true)}
                                disabled={!account}
                                className={`px-4 py-1.5 rounded-lg text-xs font-mono transition-all ${showPersonalOnly ? 'bg-accent-primary/10 text-accent-primary shadow-glow-sm font-bold' : 'text-text-muted hover:text-white'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                title={!account ? "Connect wallet to view personal history" : ""}
                            >
                                {t('lb_my')}
                            </button>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] font-mono text-text-muted shrink-0 ml-auto sm:ml-0 hidden sm:flex">
                            <Terminal className="w-3 h-3" />
                            <span>{t('lb_sync_ahead')} {secondsAgo}s</span>
                        </div>
                    </div>

                    <div className="relative w-full sm:w-64 group shrink-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent-primary/60 group-focus-within:text-accent-primary transition-colors z-10 pointer-events-none" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t('lb_search')}
                            className="w-full bg-surface/40 backdrop-blur-md border border-border/50 rounded-xl pl-9 pr-4 py-2 text-xs font-mono text-white placeholder:text-text-muted/40 focus:outline-none focus:border-accent-primary/50 transition-all shadow-inner"
                        />
                    </div>

                    {/* Make Sync appear correctly on mobile down here if needed, or leave it hidden as I did with `hidden sm:flex` */}
                </div>

                {/* Table Area — Desktop only */}
                <div className="hidden lg:block">
                    <Card className="p-0 border-border/50 overflow-hidden w-full max-w-full">
                        <div className="overflow-x-auto w-full">
                            <table className="w-full text-sm font-mono min-w-max md:min-w-full">
                                <thead>
                                    <tr className="bg-surface-elevated/50 border-b border-border/50">
                                        <th className="text-left text-[10px] uppercase tracking-widest text-text-muted py-3 px-6 w-20">POS</th>
                                        <th className="text-left text-[10px] uppercase tracking-widest text-text-muted py-3 px-6">{t('lb_col_identity')}</th>
                                        <th className="text-center text-[10px] uppercase tracking-widest text-text-muted py-3 px-6 w-28">Tier</th>
                                        <th className="text-right text-[10px] uppercase tracking-widest text-text-muted py-3 px-6 w-32">{t('lb_col_tokens')}</th>
                                        <th className="text-left text-[10px] uppercase tracking-widest text-text-muted py-3 px-6 hidden md:table-cell">{t('lb_col_dominance')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading
                                        ? Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={i} className="border-b border-border/30">
                                                <td className="py-4 px-6"><Skeleton className="h-4 w-6 bg-surface-elevated" /></td>
                                                <td className="py-4 px-6"><Skeleton className="h-4 w-32 bg-surface-elevated" /></td>
                                                <td className="py-4 px-6"><Skeleton className="h-4 w-16 bg-surface-elevated mx-auto" /></td>
                                                <td className="py-4 px-6"><Skeleton className="h-4 w-12 bg-surface-elevated float-right" /></td>
                                                <td className="py-4 px-6 hidden md:table-cell"><Skeleton className="h-2 w-full bg-surface-elevated" /></td>
                                            </tr>
                                        ))
                                        : filtered.map((entry, i) => {
                                            const rank = data.indexOf(entry) + 1;
                                            const progress = (entry.balance / totalNetworkTokens) * 100;
                                            const isMe = targetAccountId && entry.account.toLowerCase() === targetAccountId;

                                            return (
                                                <motion.tr
                                                    key={entry.account}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    className={`border-b group transition-colors ${isMe
                                                        ? 'bg-indigo-500/10 border-indigo-500/30 hover:bg-indigo-500/20'
                                                        : 'border-border/30 hover:bg-surface-elevated/30'
                                                        }`}
                                                >
                                                    <td className="py-4 px-6">
                                                        <span className={`text-xs ${rank <= 3 ? 'text-success font-bold' : isMe ? 'text-indigo-400 font-bold' : 'text-text-muted'}`}>
                                                            {rank.toString().padStart(2, '0')}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 flex items-center gap-3">
                                                        <div>
                                                            {entry.username ? (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-white">{entry.username}</span>
                                                                    {isMe && (
                                                                        <CopyHash hash={entry.account} chars={8} className="bg-transparent border-transparent px-0 group-hover:bg-transparent text-text-muted scale-90 origin-left" />
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-2">
                                                                    {isMe ? (
                                                                        <CopyHash hash={entry.account} chars={12} className="bg-transparent border-transparent px-0 group-hover:bg-transparent" />
                                                                    ) : (
                                                                        <span className="text-text-muted font-mono">{entry.account.slice(0, 6)}...{entry.account.slice(-4)}</span>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {isMe && (
                                                                <span className="px-1.5 py-0.5 mt-1 rounded text-[9px] font-bold bg-indigo-500 text-white tracking-widest block w-fit">
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
                                                    <td className={`py-4 px-6 text-right font-bold align-middle ${isMe ? 'text-indigo-300' : 'text-white'}`}>
                                                        {entry.balance.toLocaleString()}
                                                    </td>
                                                    <td className="py-4 px-6 hidden md:table-cell">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-full bg-background border border-border/50 rounded-full h-1.5 overflow-hidden">
                                                                <motion.div
                                                                    className={`${isMe ? 'bg-indigo-500' : 'bg-success'} h-full`}
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${progress}%` }}
                                                                    transition={{ duration: 1, delay: 0.2 + (i * 0.05) }}
                                                                />
                                                            </div>
                                                            <span className="text-[10px] text-text-muted w-8">{progress.toFixed(0)}%</span>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>
                        {!loading && filtered.length === 0 && (
                            <div className="text-center py-16 text-text-muted text-xs font-mono uppercase tracking-widest border-t border-border/50 bg-background/50">
                                <span className="cursor-blink" /> 0x_NULL_INDEX
                            </div>
                        )}
                    </Card>
                </div>

                {/* Card Layout — Mobile only */}
                <div className="lg:hidden space-y-4">
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <Card key={i} className="p-5 border-border/50 space-y-4">
                                <div className="flex justify-between items-center">
                                    <Skeleton className="h-5 w-8 rounded-md" />
                                    <Skeleton className="h-4 w-24 rounded-full" />
                                </div>
                                <div className="flex justify-between items-center">
                                    <Skeleton className="h-8 w-32" />
                                    <Skeleton className="h-6 w-16" />
                                </div>
                                <Skeleton className="h-2 w-full rounded-full" />
                            </Card>
                        ))
                    ) : filtered.length === 0 ? (
                        <div className="p-10 text-center text-text-muted bg-surface/30 rounded-2xl border border-dashed border-border/50 font-mono text-xs uppercase tracking-widest">
                            <span className="cursor-blink" /> 0x_NULL_INDEX
                        </div>
                    ) : (
                        filtered.map((entry, i) => {
                            const rank = data.indexOf(entry) + 1;
                            const progress = (entry.balance / totalNetworkTokens) * 100;
                            const isMe = targetAccountId && entry.account.toLowerCase() === targetAccountId;

                            return (
                                <motion.div
                                    key={entry.account}
                                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                                >
                                    <Card className={`p-4 border transition-all relative overflow-hidden group ${isMe ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-surface/40 hover:bg-surface-elevated/30 border-border/40 hover:border-accent-primary/30 backdrop-blur-sm'}`}>
                                        <div className="flex justify-between items-start gap-3 mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs ${rank <= 3 ? 'text-success font-bold' : isMe ? 'text-indigo-400 font-bold' : 'text-text-muted'}`}>
                                                    #{rank.toString().padStart(2, '0')}
                                                </span>
                                                {isMe && (
                                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500 text-white tracking-widest">
                                                        YOU
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[10px] font-mono text-text-muted bg-background/50 px-2 py-0.5 rounded border border-border/30">
                                                {progress.toFixed(1)}% DOMINANCE
                                            </span>
                                        </div>

                                        <div className="flex flex-col gap-1 mb-4">
                                            {entry.username ? (
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-white text-base">{entry.username}</span>
                                                    </div>
                                                    {isMe && <CopyHash hash={entry.account} chars={8} className="bg-transparent border-transparent px-0 text-text-muted scale-90 origin-right" />}
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        {isMe ? (
                                                            <CopyHash hash={entry.account} chars={12} className="bg-transparent border-transparent px-0 text-white font-mono text-sm" />
                                                        ) : (
                                                            <span className="text-white font-mono text-sm">{entry.account.length > 15 ? `${entry.account.slice(0, 8)}...${entry.account.slice(-6)}` : `${entry.account.slice(0, 5)}***${entry.account.slice(-2)}`}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between gap-4 pt-4 border-t border-border/20">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] uppercase font-bold text-text-muted tracking-widest">{t('lb_col_tokens')}</span>
                                                {entry.isGenesis && <GenesisBadge />}
                                            </div>
                                            <div className={`text-lg font-bold ${isMe ? 'text-indigo-300' : 'text-white'}`}>
                                                {entry.balance.toLocaleString()}
                                            </div>
                                        </div>

                                        <div className="mt-4 flex items-center gap-3">
                                            <div className="w-full bg-background border border-border/50 rounded-full h-1.5 overflow-hidden">
                                                <motion.div
                                                    className={`${isMe ? 'bg-indigo-500' : 'bg-success'} h-full`}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progress}%` }}
                                                    transition={{ duration: 1, delay: 0.2 + (i * 0.05) }}
                                                />
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </div>
        </Tooltip.Provider>
    );
}
