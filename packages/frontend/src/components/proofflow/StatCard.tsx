'use client';

import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
    icon: LucideIcon;
    label: string;
    value: number;
    suffix?: string;
    delay?: number;
}

export default function StatCard({ icon: Icon, label, value, suffix = '', delay = 0 }: StatCardProps) {
    const count = useMotionValue(0);
    const rounded = useTransform(count, (v) => Math.floor(v));

    useEffect(() => {
        const controls = animate(count, value, {
            duration: 2,
            delay,
            ease: 'easeOut',
        });
        return controls.stop;
    }, [count, value, delay]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            className="h-full"
        >
            <div className="group relative h-full overflow-hidden transition-all duration-500 rounded-3xl border border-border/50 bg-gradient-to-b from-surface to-background/50 hover:bg-surface-elevated/40 flex flex-col items-center justify-center p-8 text-center shadow-lg hover:shadow-success/10 hover:-translate-y-1 cursor-pointer">
                {/* Background ambient glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-success/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                {/* Icon wrapper */}
                <div className="mb-4 relative z-10 font-bold">
                    <div className="absolute inset-0 bg-success/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-surface-elevated to-surface border border-border/50 shadow-inner flex items-center justify-center text-success group-hover:text-success group-hover:scale-110 transition-all duration-500">
                        <Icon strokeWidth={1.5} className="w-7 h-7" />
                    </div>
                </div>

                {/* Number */}
                <div className="flex items-baseline justify-center gap-1 mb-2 relative z-10 w-full">
                    <motion.span className="text-4xl font-display font-bold text-white tracking-tight drop-shadow-sm group-hover:drop-shadow-md transition-all duration-300">
                        {rounded}
                    </motion.span>
                    {suffix && <span className="text-sm text-text-muted font-mono">{suffix}</span>}
                </div>

                {/* Label */}
                <p className="text-xs font-mono font-medium uppercase tracking-widest text-text-muted/80 group-hover:text-text-primary transition-colors duration-300 relative z-10">
                    {label}
                </p>

                {/* Bottom interactive line */}
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-success to-transparent opacity-0 group-hover:opacity-100 scale-x-0 group-hover:scale-x-100 transition-all duration-700 ease-out origin-center" />
            </div>
        </motion.div>
    );
}
