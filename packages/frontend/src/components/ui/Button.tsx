import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', loading = false, children, disabled, ...props }, ref) => {

        // Strict terminal aesthetics
        const variants = {
            primary: 'bg-success text-surface-elevated font-bold hover:bg-success/90 shadow-glow-sm hover:shadow-glow',
            secondary: 'bg-surface-elevated text-text-primary hover:bg-border',
            outline: 'border-2 border-border bg-transparent text-text-primary hover:border-text-muted',
            ghost: 'bg-transparent text-text-muted hover:text-text-primary hover:bg-surface-elevated/50',
            danger: 'bg-error text-white hover:bg-error/90',
        };

        const sizes = {
            sm: 'h-8 px-3 text-xs',
            md: 'h-10 px-4 py-2 text-sm',
            lg: 'h-12 px-6 text-base',
            icon: 'h-10 w-10 justify-center p-2',
        };

        return (
            <button
                ref={ref}
                className={cn(
                    'inline-flex items-center justify-center rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-success/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer uppercase tracking-wider',
                    variants[variant],
                    sizes[size],
                    className
                )}
                disabled={disabled || loading}
                {...props}
            >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';

export default Button;
