import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    glow?: boolean;
    interactive?: boolean;
}

export default function Card({ className, glow = false, interactive = false, children, ...props }: CardProps) {
    return (
        <div
            className={cn(
                'bg-surface border border-border shadow-terminal transition-all duration-300',
                glow && 'shadow-glow-sm border-success/30 relative overflow-hidden',
                interactive && 'hover:border-success/30 hover:-translate-y-0.5 hover:shadow-glow-sm cursor-pointer',
                className
            )}
            {...props}
        >
            {/* Optional Top accent line for glow cards */}
            {glow && (
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-success to-transparent opacity-50" />
            )}
            {children}
        </div>
    );
}
