'use client';

import React from 'react';
import { useWallet } from '@/lib/wallet-context';
import { useLanguage } from '@/lib/language-context';
import { Wallet, LogOut, Copy, Check, Loader2, Trophy } from 'lucide-react';
import { Button } from '@/components/ui';

const TIER_COLORS = {
    free: 'text-text-muted border-border bg-surface',
    bronze: 'text-amber-600 border-amber-500/30 bg-amber-500/10',
    silver: 'text-slate-400 border-slate-300/30 bg-slate-400/10',
    gold: 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10'
};

export function ConnectWallet() {
    const { account, isConnected, isConnecting, userTier, connect, disconnect } = useWallet();
    const { t } = useLanguage();
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        if (!account) return;
        navigator.clipboard.writeText(account);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const truncatedAddress = account
        ? `${account.slice(0, 6)}...${account.slice(-4)}`
        : '';

    if (isConnected && account) {
        return (
            <div className="flex flex-col gap-3 p-3 bg-surface-elevated rounded-xl border border-border shadow-sm" role="status" aria-label="Connected wallet">
                <div className="flex items-center justify-between">
                    <button
                        onClick={handleCopy}
                        title={copied ? t('wallet_copied') : `Copy: ${account}`}
                        aria-label={copied ? t('wallet_copied') : `Copy wallet address: ${truncatedAddress}`}
                        className="flex items-center gap-2 group cursor-pointer"
                    >
                        <div className="w-2 h-2 rounded-full bg-success animate-pulse shrink-0" />
                        <span className="text-xs font-mono font-medium text-text-primary group-hover:text-accent-primary transition-colors">
                            {truncatedAddress}
                        </span>
                    </button>
                    <button
                        onClick={() => disconnect()}
                        className="p-1 text-text-muted hover:text-error transition-colors rounded-md hover:bg-error/10"
                        title={t('wallet_disconnect')}
                        aria-label="Disconnect wallet"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>

                {userTier && (
                    <div className={`flex items-center justify-between px-2 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${TIER_COLORS[userTier.id as keyof typeof TIER_COLORS] || TIER_COLORS.free}`}>
                        <div className="flex items-center gap-1.5">
                            <Trophy className="w-3 h-3" />
                            <span>{userTier.name} Tier</span>
                        </div>
                        {userTier.discount > 0 && (
                            <span className="opacity-80">-{Math.round(userTier.discount * 100)}% Fee</span>
                        )}
                    </div>
                )}
            </div>
        );
    }

    return (
        <Button
            onClick={connect}
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
