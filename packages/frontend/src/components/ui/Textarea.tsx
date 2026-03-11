import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, error, ...props }, ref) => {
        return (
            <div className="w-full">
                <textarea
                    ref={ref}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${props.id || props.name}-error` : undefined}
                    className={cn(
                        'w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm font-mono text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent-primary/50 focus:ring-1 focus:ring-accent-primary/20 transition-all duration-200 resize-none min-h-[120px]',
                        error && 'border-red-500/50',
                        className
                    )}
                    {...props}
                />
                {error && <p id={`${props.id || props.name}-error`} className="mt-1.5 text-xs text-red-400" role="alert">{error}</p>}
            </div>
        );
    }
);
Textarea.displayName = 'Textarea';
export default Textarea;
