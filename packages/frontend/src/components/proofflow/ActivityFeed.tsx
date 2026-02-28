'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { truncateAddress, timeAgo } from '@/lib/utils';

interface ActivityItem {
    id: string;
    agentId: string;
    taskId: string;
    timestamp: number;
}

interface ActivityFeedProps {
    items: ActivityItem[];
}

const COLORS = ['#06b6d4', '#0891b2', '#8b5cf6', '#f59e0b', '#ec4899', '#6366f1'];

export default function ActivityFeed({ items }: ActivityFeedProps) {
    return (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            <AnimatePresence mode="popLayout">
                {items.map((item, i) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20, height: 0 }}
                        animate={{ opacity: 1, x: 0, height: 'auto' }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface/50 hover:bg-surface-elevated/50 transition-colors"
                    >
                        <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        />
                        <div className="flex-1 min-w-0">
                            <span className="text-xs font-mono text-text-primary">{truncateAddress(item.agentId, 4)}</span>
                            <span className="text-xs text-text-muted mx-1.5">submitted proof</span>
                        </div>
                        <span className="text-[10px] text-text-muted shrink-0">{timeAgo(item.timestamp)}</span>
                    </motion.div>
                ))}
            </AnimatePresence>
            {items.length === 0 && (
                <div className="text-center py-8 text-text-muted text-sm">No activity yet</div>
            )}
        </div>
    );
}
