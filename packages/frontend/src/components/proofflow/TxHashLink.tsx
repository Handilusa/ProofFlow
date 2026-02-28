'use client';

import { ExternalLink, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { truncateAddress } from '@/lib/utils';

interface TxHashLinkProps {
    hash: string;
    type?: 'transaction' | 'topic';
    topicId?: string;
    sequenceNumber?: number;
    label?: string;
}

export default function TxHashLink({ hash, type = 'transaction', topicId, sequenceNumber, label }: TxHashLinkProps) {
    const [copied, setCopied] = useState(false);

    const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK || "testnet";
    const url = type === 'topic' && topicId
        ? `https://hashscan.io/${network}/topic/${topicId}`
        : `https://hashscan.io/${network}/transaction/${hash}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(hash);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-accent-primary">{label || truncateAddress(hash, 8)}</span>
            <button onClick={handleCopy} className="text-text-muted hover:text-text-primary transition-colors" aria-label="Copy hash">
                {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-accent-primary transition-colors" aria-label="View on HashScan">
                <ExternalLink className="w-3.5 h-3.5" />
            </a>
        </div>
    );
}
