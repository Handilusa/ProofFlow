'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, UserPlus, FileUp, Trophy, Activity, Github, Bot, Settings, Award, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWallet } from '@/lib/wallet-context';
import { useLanguage } from '@/lib/language-context';
import { useSidebar } from '@/lib/sidebar-context';
import ConnectWallet from './ConnectWallet';

export default function Sidebar() {
    const pathname = usePathname();
    const { isConnected, network } = useWallet();
    const { t } = useLanguage();
    const { collapsed, toggleCollapsed } = useSidebar();

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
            <aside className={cn(
                "hidden lg:flex fixed left-0 top-0 bottom-0 flex-col bg-surface/20 backdrop-blur-xl border-r border-cyan-500/20 z-40 transition-[width] duration-300 ease-in-out overflow-hidden",
                collapsed ? "w-[72px]" : "w-[260px]"
            )}>
                {/* Logo + Toggle — fixed height so nav icons never shift vertically */}
                <div className="p-4 pb-2 flex flex-col">
                    {/* Logo row — fixed height */}
                    <div className="flex items-center justify-between h-[40px]">
                        {collapsed ? (
                            <button
                                onClick={toggleCollapsed}
                                className="group relative w-full h-10 flex items-center justify-center cursor-pointer rounded-lg hover:bg-cyan-500/10 transition-colors"
                                title="Expand sidebar"
                            >
                                {/* Default Logo (hides on hover) */}
                                <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-200 opacity-100 group-hover:opacity-0">
                                    <Image src="/logo.svg" alt="ProofFlow" width={28} height={28} className="rounded-lg shrink-0" />
                                </div>
                                
                                {/* Hover Icon (shows on hover) */}
                                <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-200 opacity-0 group-hover:opacity-100 text-cyan-400">
                                    <PanelLeftOpen className="w-5 h-5 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                                </div>
                            </button>
                        ) : (
                            <>
                                <Link href="/" className="flex items-center gap-3 min-w-0">
                                    <Image src="/logo.svg" alt="ProofFlow" width={32} height={32} className="rounded-lg shrink-0" />
                                    <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-cyan-500 tracking-tight whitespace-nowrap">ProofFlow</span>
                                </Link>
                                <button
                                    onClick={toggleCollapsed}
                                    className="p-1.5 text-cyan-400/40 hover:text-cyan-400 hover:bg-cyan-500/10 rounded transition-colors shrink-0"
                                    title="Collapse sidebar"
                                >
                                    <PanelLeftClose className="w-4 h-4" />
                                </button>
                            </>
                        )}
                    </div>
                    {/* Network indicator — invisible when collapsed to keep exact same height */}
                    <div className={cn("flex items-center gap-2 pl-2 mt-2 h-[18px]", collapsed && "invisible")}>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                        <span className="text-[10px] font-mono tracking-widest text-emerald-400/50 uppercase whitespace-nowrap">
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
                                title={collapsed ? item.label : undefined}
                                className={cn(
                                    'flex items-center gap-3 text-sm font-medium transition-all duration-200',
                                    collapsed ? 'justify-center px-2 py-2.5' : 'px-4 py-2.5',
                                    isActive || pathname === item.href
                                        ? 'bg-gradient-to-r from-cyan-500/10 to-transparent border-l-2 border-cyan-400 text-cyan-400 shadow-[inset_2px_0_10px_rgba(34,211,238,0.1)]'
                                        : 'text-text-muted border-l-2 border-transparent hover:text-cyan-400 hover:bg-surface-elevated/30'
                                )}
                            >
                                <item.icon className={cn("w-[18px] h-[18px] shrink-0", (isActive || pathname === item.href) ? "drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" : "")} />
                                {!collapsed && <span className="whitespace-nowrap overflow-hidden">{item.label}</span>}
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
                                title={collapsed ? item.label : undefined}
                                className={cn(
                                    'flex items-center gap-3 text-sm font-medium transition-all duration-200 mt-auto',
                                    collapsed ? 'justify-center px-2 py-2.5' : 'px-4 py-2.5',
                                    isActive
                                        ? 'bg-gradient-to-r from-cyan-500/10 to-transparent border-l-2 border-cyan-400 text-cyan-400 shadow-[inset_2px_0_10px_rgba(34,211,238,0.1)]'
                                        : 'text-text-muted border-l-2 border-transparent hover:text-cyan-400 hover:bg-surface-elevated/30'
                                )}
                            >
                                <item.icon className={cn("w-[18px] h-[18px] shrink-0", isActive ? "drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" : "")} />
                                {!collapsed && <span className="whitespace-nowrap overflow-hidden">{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer area & Wallet Connect */}
                <div className={cn("p-4 border-t border-cyan-500/20 flex flex-col gap-3", collapsed && "items-center p-2")}>
                    {!collapsed && <ConnectWallet />}
                    <a
                        href="https://github.com/Handilusa/ProofFlow"
                        target="_blank"
                        rel="noopener noreferrer"
                        title={collapsed ? t('nav_github') : undefined}
                        className={cn(
                            "flex items-center gap-2 text-xs font-medium text-text-muted hover:text-cyan-400 transition-colors rounded-lg hover:bg-surface-elevated/30",
                            collapsed ? "justify-center p-2" : "px-4 py-2"
                        )}
                    >
                        <Github className="w-4 h-4 shrink-0" />
                        {!collapsed && t('nav_github')}
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
