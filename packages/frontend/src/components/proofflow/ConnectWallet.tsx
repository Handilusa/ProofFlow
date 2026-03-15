'use client';

import React from 'react';
import { useWallet } from '@/lib/wallet-context';
import { useLanguage } from '@/lib/language-context';
import { Wallet, LogOut, Copy, Check, Loader2, Trophy } from 'lucide-react';
import { Button } from '@/components/ui';

const TIER_COLORS = {
    free: 'text-cyan-400/40 border-cyan-500/10 bg-cyan-500/5',
    bronze: 'text-orange-400 border-orange-500/30 bg-orange-500/10 shadow-[0_0_10px_rgba(251,146,60,0.1)]',
    silver: 'text-slate-200 border-white/20 bg-white/5 shadow-[0_0_10px_rgba(255,255,255,0.05)]',
    gold: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10 shadow-[0_0_10px_rgba(250,204,21,0.1)]'
};

export function ConnectWallet() {
    const { account, username, isConnected, isConnecting, userTier, connect, disconnect } = useWallet();
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

    const displayName = username || truncatedAddress;

    if (isConnected && account) {
        return (
            <div 
                className="flex flex-col gap-3 p-3 bg-surface/20 border border-cyan-500/30 shadow-[inset_0_0_10px_rgba(34,211,238,0.05)]" 
                style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                role="status" aria-label="Connected wallet"
            >
                <div className="flex items-center justify-between">
                    <button
                        onClick={handleCopy}
                        title={copied ? t('wallet_copied') : `Copy: ${account}`}
                        aria-label={copied ? t('wallet_copied') : `Copy wallet address: ${truncatedAddress}`}
                        className="flex items-center gap-2 group cursor-pointer"
                    >
                        <div className="w-2 h-2 bg-emerald-400 animate-pulse shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                        <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 group-hover:text-white transition-colors truncate max-w-[120px]">
                            {displayName}
                        </span>
                    </button>
                    <button
                        onClick={() => disconnect()}
                        className="p-1 text-cyan-400/50 hover:text-red-400 transition-colors hover:bg-red-500/10"
                        title={t('wallet_disconnect')}
                        aria-label="Disconnect wallet"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>

                {userTier && (
                    <div 
                        className={`flex items-center justify-between px-2 py-1.5 border text-[9px] font-mono font-bold uppercase tracking-[0.15em] ${TIER_COLORS[userTier.id as keyof typeof TIER_COLORS] || TIER_COLORS.free}`}
                        style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}
                    >
                        <div className="flex items-center gap-1.5">
                            <Trophy className="w-3 h-3 drop-shadow-[0_0_5px_currentColor]" />
                            <span>{userTier.name}</span>
                        </div>
                        {userTier.discount > 0 && (
                            <span className="opacity-70">-{Math.round(userTier.discount * 100)}% FEE</span>
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
            className="w-full justify-center bg-transparent border border-cyan-500 hover:bg-cyan-500/10 text-cyan-400 font-mono font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(34,211,238,0.1)] transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] rounded-none"
            style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
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
