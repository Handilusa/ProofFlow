'use client';

import React from 'react';
import { useWallet } from '@/lib/wallet-context';
import { useLanguage } from '@/lib/language-context';
import { Wallet, LogOut, Loader2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui';

export function ConnectWallet() {
    const { account, isConnected, connect, disconnect } = useWallet();
    const { t } = useLanguage();
    const [isConnecting, setIsConnecting] = React.useState(false);
    const [copied, setCopied] = React.useState(false);

    const handleConnect = async () => {
        setIsConnecting(true);
        try {
            await connect();
        } finally {
            setIsConnecting(false);
        }
    };

    const handleCopy = () => {
        if (!account) return;
        navigator.clipboard.writeText(account);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Format address: 0.0.12345 → 0.0...2345
    const truncatedAddress = account
        ? `${account.slice(0, 6)}...${account.slice(-4)}`
        : '';

    if (isConnected && account) {
        return (
            <div className="flex flex-col gap-2 p-3 bg-surface-elevated rounded-xl border border-border">
                <div className="flex items-center justify-between">
                    <button
                        onClick={handleCopy}
                        title={copied ? t('wallet_copied') : `Copy: ${account}`}
                        className="flex items-center gap-2 group cursor-pointer"
                    >
                        <div className="w-2.5 h-2.5 rounded-full bg-success animate-pulse shrink-0" />
                        <span className="text-sm font-mono font-medium text-text-primary group-hover:text-accent-primary transition-colors">
                            {truncatedAddress}
                        </span>
                        {copied
                            ? <Check className="w-3.5 h-3.5 text-success shrink-0" />
                            : <Copy className="w-3.5 h-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        }
                    </button>
                    <button
                        onClick={disconnect}
                        className="p-1.5 text-text-muted hover:text-error transition-colors rounded-lg hover:bg-surface/50"
                        title={t('wallet_disconnect')}
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
                {copied && (
                    <div className="text-[10px] text-success font-mono px-1 animate-pulse">
                        {t('wallet_copied')}
                    </div>
                )}
                {!copied && (
                    <div className="text-[10px] font-medium text-text-muted uppercase tracking-wider px-1">
                        {t('wallet_testnet')}
                    </div>
                )}
            </div>
        );
    }

    return (
        <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full justify-center bg-accent-primary hover:bg-accent-secondary text-background font-semibold"
        >
            {isConnecting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
                <Wallet className="w-4 h-4 mr-2" />
            )}
            {t('wallet_connect')}
        </Button>
    );
}

export default ConnectWallet;
