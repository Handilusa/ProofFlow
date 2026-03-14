'use client';

import { useEffect, useState } from 'react';
import { Activity, Users, Database, Loader2 } from 'lucide-react';
import { getNetworkStats, NetworkStats } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/lib/language-context';

export default function LiveNetworkCounter() {
    const [stats, setStats] = useState<NetworkStats | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const { t } = useLanguage();

    useEffect(() => {
        console.log("LIVE_NETWORK_COUNTER_MOUNTED");
    }, []);

    useEffect(() => {
        if (stats) console.log("LIVE_NETWORK_COUNTER_STATS_RECEIVED:", stats);
    }, [stats]);

    useEffect(() => {
        let isMounted = true;
        const fetchStats = async () => {
            try {
                const data = await getNetworkStats();
                if (isMounted) setStats(data);
            } catch (err) {
                console.error("Failed to fetch Live Network Counters", err);
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 10000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        if (!stats) return;
        const cycleInterval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % 3);
        }, 3000); // Rotate every 3 seconds
        return () => clearInterval(cycleInterval);
    }, [stats]);

    // Use fallback data if fetch fails or is loading
    const displayStats: NetworkStats = stats || {
        totalProofs: 0,
        totalAgents: 0,
        totalTokensMinted: 0,
        lastActivity: null
    };

    const items = [
        {
            id: 'hcs',
            icon: <Database className="w-3.5 h-3.5 text-purple-400 shrink-0" />,
            label: t('net_hcs_msgs'),
            value: displayStats.totalProofs.toLocaleString()
        },
        {
            id: 'wallets',
            icon: <Users className="w-3.5 h-3.5 text-accent-primary shrink-0" />,
            label: t('net_wallets_created'),
            value: displayStats.totalAgents.toLocaleString()
        },
        {
            id: 'pfr',
            icon: <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />,
            label: t('net_pfr_minted'),
            value: displayStats.totalTokensMinted.toLocaleString()
        }
    ];

    return (
        <div className="h-10 w-full sm:w-[240px] flex items-center justify-center sm:justify-end shrink-0 relative px-2">
            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={items[currentIndex].id}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                        opacity: { duration: 0.2 }
                    }}
                    className="flex items-center justify-center gap-1.5 sm:gap-2 bg-surface/30 px-2.5 sm:px-3 py-1.5 border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.05)] cursor-default hover:border-cyan-400/50 hover:bg-cyan-500/10 transition-colors min-w-0 max-w-full"
                    style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}
                >
                    {items[currentIndex].icon}
                    <span className="text-text-muted text-[9px] sm:text-[10px] font-mono font-medium truncate shrink">{items[currentIndex].label}</span>
                    <span className="text-white text-[9px] sm:text-[10px] font-bold font-mono text-right shrink-0">{items[currentIndex].value}</span>
                </motion.div>
            </AnimatePresence>

            {!stats && (
                <div className="absolute -bottom-2 right-2 flex items-center gap-1.5 px-1 bg-surface rounded text-[8px] font-bold text-accent-primary uppercase tracking-widest border border-accent-primary/20 z-10">
                    <span className="w-1 h-1 bg-accent-primary rounded-full animate-ping" />
                    SYNCING
                </div>
            )}
        </div>
    );
}
