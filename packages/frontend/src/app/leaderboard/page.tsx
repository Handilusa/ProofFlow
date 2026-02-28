'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Search, ShieldCheck, Shield, Bot } from 'lucide-react';
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
}

export default function LeaderboardPage() {
    const { account } = useWallet();
    const { t } = useLanguage();
    const [data, setData] = useState<LeaderboardEntry[]>([]);
    const [agents, setAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showPersonalOnly, setShowPersonalOnly] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(Date.now());

    const [hederaAccountId, setHederaAccountId] = useState<string | null>(null);

    const fetchLeaderboard = async () => {
        try {
            const res = await fetch(`${API_URL}/leaderboard`);
            if (!res.ok) throw new Error('Failed to fetch leaderboard');
            const result = await res.json();

            const agentRes = await fetch(`${API_URL}/agents`);
            if (agentRes.ok) {
                const agentData = await agentRes.json();
                setAgents(agentData);
            }

            setData(result);
            setLastUpdated(Date.now());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard();
        const interval = setInterval(fetchLeaderboard, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!account) {
            setHederaAccountId(null);
            return;
        }

        const fetchHederaId = async () => {
            try {
                const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK || "testnet";
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
    const secondsAgo = Math.floor((Date.now() - lastUpdated) / 1000);

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
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="flex-1 min-w-[200px] max-w-sm">
                            <Input
                                icon={<Search className="w-4 h-4 text-text-muted" />}
                                placeholder={t('lb_search')}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="font-mono text-sm bg-surface"
                            />
                        </div>
                        <div className="flex p-1 bg-surface border border-border/50 rounded-lg">
                            <button
                                onClick={() => setShowPersonalOnly(false)}
                                className={`px-3 py-1.5 text-xs font-mono rounded-md transition-all ${!showPersonalOnly ? 'bg-accent-primary text-black font-bold' : 'text-text-muted hover:text-white'}`}
                            >
                                {t('lb_global')}
                            </button>
                            <button
                                onClick={() => setShowPersonalOnly(true)}
                                disabled={!account}
                                className={`px-3 py-1.5 text-xs font-mono rounded-md transition-all ${showPersonalOnly ? 'bg-indigo-500 text-white font-bold' : 'text-text-muted hover:text-white'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                title={!account ? "Connect wallet to view personal history" : ""}
                            >
                                {t('lb_my')}
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-text-muted ml-auto sm:ml-0">
                        <Terminal className="w-3 h-3" />
                        <span>{t('lb_sync_ahead')} {secondsAgo}s</span>
                    </div>
                </div>

                {/* Data Dense Table */}
                <Card className="p-0 border-border/50 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm font-mono">
                            <thead>
                                <tr className="bg-surface-elevated/50 border-b border-border/50">
                                    <th className="text-left text-[10px] uppercase tracking-widest text-text-muted py-3 px-6 w-20">POS</th>
                                    <th className="text-left text-[10px] uppercase tracking-widest text-text-muted py-3 px-6">{t('lb_col_identity')}</th>
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
                                                                <CopyHash hash={entry.account} chars={8} className="bg-transparent border-transparent px-0 group-hover:bg-transparent text-text-muted scale-90 origin-left" />
                                                            </div>
                                                        ) : (
                                                            <CopyHash hash={entry.account} chars={12} className="bg-transparent border-transparent px-0 group-hover:bg-transparent" />
                                                        )}
                                                        {isMe && (
                                                            <span className="px-1.5 py-0.5 mt-1 rounded text-[9px] font-bold bg-indigo-500 text-white tracking-widest block w-fit">
                                                                YOU
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className={`py-4 px-6 text-right font-bold ${isMe ? 'text-indigo-300' : 'text-white'}`}>
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
        </Tooltip.Provider>
    );
}
