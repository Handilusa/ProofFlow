'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Sidebar from '@/components/proofflow/Sidebar';
import ConnectWallet from '@/components/proofflow/ConnectWallet';
import FooterText from '@/components/proofflow/FooterText';
import { WalletSelector } from '@/components/proofflow/WalletSelector';

import { API_URL } from '@/lib/utils';
import { useEffect } from 'react';

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLanding = pathname === '/';

    useEffect(() => {
        console.log("APP_SHELL_MOUNTED: API_URL =", API_URL);
    }, []);

    // Landing page renders without sidebar/footer
    if (isLanding) {
        return <>{children}<WalletSelector /></>;
    }

    return (
        <div className="flex min-h-screen">
            {/* Skip to content link for keyboard navigation */}
            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent-primary focus:text-background focus:rounded-lg focus:outline-none" tabIndex={0}>
                Skip to main content
            </a>
            <Sidebar />
            <div className="flex-1 flex flex-col lg:ml-[260px] min-h-screen relative overflow-x-hidden" role="region" aria-label="Main application area">

                {/* Mobile Header */}
                <header className="lg:hidden flex items-center justify-between p-4 border-b border-border/50 bg-surface/50 backdrop-blur z-20 sticky top-0 gap-3" role="banner">
                    <Link href="/" className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity" aria-label="ProofFlow home">
                        <Image src="/logo.svg" alt="ProofFlow logo" width={28} height={28} className="rounded-lg shrink-0" />
                        <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-cyan-500 tracking-tight" aria-hidden="true">ProofFlow</span>
                    </Link>
                    <div className="w-fit shrink-0">
                        <ConnectWallet />
                    </div>
                </header>

                {/* Ambient Background Glows */}
                <div className="fixed top-0 left-1/4 w-[80vw] h-[80vw] sm:w-[500px] sm:h-[500px] bg-success/5 rounded-full blur-[80px] sm:blur-[120px] pointer-events-none -z-10" />
                <div className="fixed bottom-0 right-1/4 w-[80vw] h-[80vw] sm:w-[500px] sm:h-[500px] bg-surface-elevated/20 rounded-full blur-[80px] sm:blur-[120px] pointer-events-none -z-10" />

                <main id="main-content" className="flex-1 p-4 sm:p-6 lg:p-8 pb-10 lg:pb-12 w-full max-w-7xl mx-auto overflow-x-hidden" role="main" aria-label="ProofFlow dashboard content">
                    {children}
                </main>

                {/* Global Footer */}
                <footer className="w-full border-t border-border bg-surface/50 backdrop-blur-md py-6 z-20 mt-auto pb-32 lg:pb-6" role="contentinfo" aria-label="Application footer">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-center lg:justify-between gap-4 text-center lg:text-left">
                        <FooterText />
                        {/* Built on Hedera Badge */}
                        <div className="flex items-center gap-2.5 opacity-80 hover:opacity-100 transition-opacity">
                            <div className="w-[30px] h-[30px] rounded-full bg-white flex items-center justify-center shrink-0">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="black" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="4" y="2" width="3" height="20" />
                                    <rect x="17" y="2" width="3" height="20" />
                                    <rect x="7" y="8" width="10" height="2.5" />
                                    <rect x="7" y="13.5" width="10" height="2.5" />
                                </svg>
                            </div>
                            <div className="flex flex-col justify-center text-white">
                                <span className="text-[9px] font-bold tracking-widest leading-none mb-[2px]">BUILT ON</span>
                                <span className="text-[13px] font-black tracking-widest leading-none hidden sm:block">HEDERA</span>
                                <span className="text-[13px] font-black tracking-widest leading-none sm:hidden">HEDERA</span>
                            </div>
                        </div>
                    </div>
                </footer>

                {/* Global Wallet Selector Modal */}
                <WalletSelector />
            </div>
        </div>
    );
}
