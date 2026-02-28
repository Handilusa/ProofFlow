'use client';
import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CopyHashProps {
    hash: string;
    label?: string;
    className?: string;
    chars?: number;
}

export default function CopyHash({ hash, label, className, chars = 14 }: CopyHashProps) {
    const [copied, setCopied] = useState(false);

    const displayLabel = label || `${hash.slice(0, Math.floor(chars / 2))}...${hash.slice(-Math.ceil(chars / 2))}`;

    const copyToClipboard = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(hash);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    return (
        <button
            onClick={copyToClipboard}
            className={cn(
                "group inline-flex items-center gap-2 bg-surface-elevated/50 hover:bg-surface-elevated border border-border/50 hover:border-success/30 rounded-lg px-2.5 py-1 transition-all duration-200 cursor-pointer",
                className
            )}
            title={hash}
        >
            <span className="font-mono text-sm text-text-primary group-hover:text-success transition-colors">
                {displayLabel}
            </span>
            {copied ? (
                <Check className="w-3.5 h-3.5 text-success" />
            ) : (
                <Copy className="w-3.5 h-3.5 text-text-muted group-hover:text-success transition-colors" />
            )}
        </button>
    );
}
