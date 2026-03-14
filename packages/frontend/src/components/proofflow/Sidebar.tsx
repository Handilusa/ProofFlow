'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, UserPlus, FileUp, Trophy, Activity, Github, Bot, Settings, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWallet } from '@/lib/wallet-context';
import { useLanguage } from '@/lib/language-context';
import ConnectWallet from './ConnectWallet';

const defaultNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/verify', label: 'Verify Proof', icon: FileUp },
    { href: '/history', label: 'Audit History', icon: Activity },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy }
];

export default function Sidebar() {
    const pathname = usePathname();
    const { isConnected, network } = useWallet();
    const { t } = useLanguage();

    const mainNavItems = [
        { href: `/${network}/dashboard`, label: t('nav_dashboard'), icon: LayoutDashboard },
        { href: `/verify`, label: t('nav_verify'), icon: FileUp },
        { href: `/${network}/history`, label: t('nav_history'), icon: Activity },
        { href: `/${network}/leaderboard`, label: t('nav_leaderboard'), icon: Trophy },
        { href: `/${network}/passport`, label: t('nav_passport'), icon: Award },
    ];

    const bottomNavItems = [
        { href: '/settings', label: t('nav_settings'), icon: Settings },
    ];

    const allNavItems = [...mainNavItems, ...bottomNavItems];

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[260px] flex-col bg-surface/20 backdrop-blur-xl border-r border-cyan-500/20 z-40">
                {/* Logo */}
                <div className="p-6 pb-2 flex flex-col gap-1.5">
                    <Link href="/" className="flex items-center gap-3">
                        <Image src="/logo.svg" alt="ProofFlow" width={32} height={32} className="rounded-lg" />
                        <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-cyan-500 tracking-tight">ProofFlow</span>
                    </Link>
                    <div className="flex items-center gap-2 pl-2 mt-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                        <span className="text-[10px] font-mono tracking-widest text-emerald-400/50 uppercase">
                            {network === 'mainnet' ? 'Hedera Mainnet' : 'Hedera Testnet'}
                        </span>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
                    {mainNavItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all duration-200',
                                    isActive || pathname === item.href
                                        ? 'bg-gradient-to-r from-cyan-500/10 to-transparent border-l-2 border-cyan-400 text-cyan-400 shadow-[inset_2px_0_10px_rgba(34,211,238,0.1)]'
                                        : 'text-text-muted border-l-2 border-transparent hover:text-cyan-400 hover:bg-surface-elevated/30'
                                )}
                            >
                                <item.icon className={cn("w-[18px] h-[18px]", (isActive || pathname === item.href) ? "drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" : "")} />
                                {item.label}
                            </Link>
                        );
                    })}

                    <div className="pt-2 mt-2 border-t border-cyan-500/10 lg:hidden" />

                    {bottomNavItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all duration-200 mt-auto',
                                    isActive
                                        ? 'bg-gradient-to-r from-cyan-500/10 to-transparent border-l-2 border-cyan-400 text-cyan-400 shadow-[inset_2px_0_10px_rgba(34,211,238,0.1)]'
                                        : 'text-text-muted border-l-2 border-transparent hover:text-cyan-400 hover:bg-surface-elevated/30'
                                )}
                            >
                                <item.icon className={cn("w-[18px] h-[18px]", isActive ? "drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" : "")} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer area & Wallet Connect */}
                <div className="p-4 border-t border-cyan-500/20 flex flex-col gap-3">

                    <ConnectWallet />
                    <a
                        href="https://github.com/Handilusa/ProofFlow"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-text-muted hover:text-cyan-400 transition-colors rounded-lg hover:bg-surface-elevated/30"
                    >
                        <Github className="w-4 h-4" />
                        {t('nav_github')}
                    </a>
                </div>
            </aside>

            {/* Mobile Bottom Nav */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface/80 backdrop-blur-xl border-t border-cyan-500/20 z-50 w-full">
                <div className="flex items-center justify-evenly py-2 px-1 w-full">
                    {allNavItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex flex-col items-center justify-center gap-1 py-1.5 transition-colors flex-1 min-w-0 truncate',
                                    isActive ? 'text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]' : 'text-cyan-400/30'
                                )}
                            >
                                <item.icon className="w-5 h-5 shrink-0" />
                                <span className="truncate w-full text-center font-mono text-[8.5px] font-bold tracking-widest uppercase">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
