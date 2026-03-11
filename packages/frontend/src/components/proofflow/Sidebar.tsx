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
            <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[260px] flex-col bg-surface/50 backdrop-blur-xl border-r border-border z-40">
                {/* Logo */}
                <div className="p-6 pb-2 flex flex-col gap-1.5">
                    <Link href="/" className="flex items-center gap-3">
                        <Image src="/logo.svg" alt="ProofFlow" width={32} height={32} className="rounded-lg" />
                        <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-cyan-500 tracking-tight">ProofFlow</span>
                    </Link>
                    <div className="flex items-center gap-2 pl-2 mt-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                        <span className="text-[10px] font-mono tracking-widest text-white/40 uppercase">
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
                                    'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                                    isActive || pathname === item.href
                                        ? 'bg-accent-primary/10 text-accent-primary'
                                        : 'text-text-muted hover:text-text-primary hover:bg-surface-elevated/50'
                                )}
                            >
                                <item.icon className="w-[18px] h-[18px]" />
                                {item.label}
                            </Link>
                        );
                    })}

                    <div className="pt-2 mt-2 border-t border-border/50 lg:hidden" />

                    {bottomNavItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 mt-auto',
                                    isActive
                                        ? 'bg-accent-primary/10 text-accent-primary'
                                        : 'text-text-muted hover:text-text-primary hover:bg-surface-elevated/50'
                                )}
                            >
                                <item.icon className="w-[18px] h-[18px]" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer area & Wallet Connect */}
                <div className="p-4 border-t border-border flex flex-col gap-3">

                    <ConnectWallet />
                    <a
                        href="https://github.com/Handilusa/ProofFlow"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 text-xs text-text-muted hover:text-text-primary transition-colors rounded-lg hover:bg-surface-elevated/50"
                    >
                        <Github className="w-4 h-4" />
                        {t('nav_github')}
                    </a>
                </div>
            </aside>

            {/* Mobile Bottom Nav */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface/80 backdrop-blur-xl border-t border-border z-50 w-full">
                <div className="flex items-center justify-evenly py-2 px-1 w-full">
                    {allNavItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-lg text-[10px] font-medium transition-colors flex-1 min-w-0 truncate',
                                    isActive ? 'text-accent-primary' : 'text-text-muted'
                                )}
                            >
                                <item.icon className="w-5 h-5 shrink-0" />
                                <span className="truncate w-full text-center">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
