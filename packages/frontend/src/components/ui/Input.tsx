import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode;
    error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, icon, error, ...props }, ref) => {
        return (
            <div className="w-full">
                <div className="relative">
                    {icon && (
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted">
                            {icon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={cn(
                            'w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent-primary/50 focus:ring-1 focus:ring-accent-primary/20 transition-all duration-200',
                            icon && 'pl-11',
                            error && 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20',
                            className
                        )}
                        {...props}
                    />
                </div>
                {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
            </div>
        );
    }
);
Input.displayName = 'Input';
export default Input;
