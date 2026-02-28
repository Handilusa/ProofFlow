'use client';

import { useEffect, useState } from 'react';
import { Activity, Users, Database } from 'lucide-react';
import { getNetworkStats, NetworkStats } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/lib/language-context';

export default function LiveNetworkCounter() {
    const [stats, setStats] = useState<NetworkStats | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const { t } = useLanguage();

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

    if (!stats) return <div className="h-10 w-[240px] shrink-0" />;

    const items = [
        {
            id: 'hcs',
            icon: <Database className="w-3.5 h-3.5 text-purple-400 shrink-0" />,
            label: t('net_hcs_msgs'),
            value: stats.totalProofs.toLocaleString()
        },
        {
            id: 'wallets',
            icon: <Users className="w-3.5 h-3.5 text-accent-primary shrink-0" />,
            label: t('net_wallets_created'),
            value: stats.totalAgents.toLocaleString()
        },
        {
            id: 'pfr',
            icon: <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />,
            label: t('net_pfr_minted'),
            value: stats.totalTokensMinted.toLocaleString()
        }
    ];

    return (
        <div className="relative overflow-hidden h-10 w-[240px] flex items-center shrink-0">
            <AnimatePresence>
                <motion.div
                    key={items[currentIndex].id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-x-0 mx-auto flex items-center gap-1.5 bg-surface/80 px-3 py-1.5 rounded-lg border border-border/50 whitespace-nowrap w-fit max-w-full"
                >
                    {items[currentIndex].icon}
                    <span className="text-text-muted text-[11px] font-mono shrink-0">{items[currentIndex].label}</span>
                    <span className="text-white text-[11px] font-bold font-mono truncate">{items[currentIndex].value}</span>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
