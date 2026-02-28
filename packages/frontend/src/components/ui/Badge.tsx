import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline';
}

export default function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
    const variants = {
        default: 'bg-surface-elevated text-text-muted border-border',
        success: 'bg-success/10 text-success border-success/20',
        warning: 'bg-warning/10 text-warning border-warning/20',
        error: 'bg-error/10 text-error border-error/20',
        info: 'bg-info/10 text-info border-info/20',
        outline: 'bg-transparent border-border text-text-primary'
    };

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-medium rounded-full border tracking-wide',
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </span>
    );
}
