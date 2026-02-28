'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/proofflow/Sidebar';
import ConnectWallet from '@/components/proofflow/ConnectWallet';
import FooterText from '@/components/proofflow/FooterText';

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
        return <>{children}</>;
    }

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col lg:ml-[260px] min-h-screen relative">

                {/* Mobile Header */}
                <div className="lg:hidden flex items-center justify-between p-4 border-b border-border/50 bg-surface/50 backdrop-blur z-20 sticky top-0">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-accent-primary/20 flex items-center justify-center">
                            <div className="w-4 h-4 bg-accent-primary rounded-sm" />
                        </div>
                        <span className="font-display font-bold text-lg text-white tracking-wide">PROOFFLOW</span>
                    </div>
                    <ConnectWallet />
                </div>

                {/* Ambient Background Glows */}
                <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-success/5 rounded-full blur-[120px] pointer-events-none -z-10" />
                <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-surface-elevated/20 rounded-full blur-[120px] pointer-events-none -z-10" />

                <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-32 lg:pb-12 z-10 w-full max-w-7xl mx-auto">
                    {children}
                </main>

                {/* Global Footer */}
                <footer className="w-full border-t border-border bg-surface/50 backdrop-blur-md py-6 z-20 mt-auto">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
                        <FooterText />
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-text-muted">Powered by</span>
                            <svg width="64" height="16" viewBox="0 0 100 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12.42 23H6.7V13.84H-0.02V12.04H6.7V2.88H12.42V12.04H19.14V13.84H12.42V23ZM1.16 3.12H5.56V4.92H1.16V3.12ZM13.58 3.12H17.98V4.92H13.58V3.12ZM1.16 20.96H5.56V22.76H1.16V20.96ZM13.58 20.96H17.98V22.76H13.58V20.96Z" fill="#F8FAFC" />
                                <path d="M33.8 23H28.8L28.66 12.04H23.08L22.94 23H17.94L18.08 2.88H23.08L22.94 10.28H28.66L28.8 2.88H33.8V23Z" fill="#F8FAFC" />
                                <path d="M49 14.88H39.52V19.16H51.08V23H34V2.88H50.84V6.72H39.52V11H49V14.88Z" fill="#F8FAFC" />
                                <path d="M68.78 12.94C68.78 18.8 63.84 23.36 57.06 23.36H49.12V2.88H57.06C63.84 2.88 68.78 7.44 68.78 13.1V12.94ZM54.64 19.34H56.5C60.6 19.34 63.2 16.5 63.2 13.04C63.2 9.4 60.6 6.74 56.5 6.74H54.64V19.34Z" fill="#F8FAFC" />
                                <path d="M84.34 14.88H74.86V19.16H86.42V23H69.34V2.88H86.18V6.72H74.86V11H84.34V14.88Z" fill="#F8FAFC" />
                                <path d="M102.66 23H96.38L92.1 14.88H91.1L89.14 14.84V23H83.62V2.88H92.2C96.9 2.88 100.2 5.56 100.2 9.88C100.2 12.78 98.42 14.52 96.06 15.02L102.66 23ZM89.14 11.24L91.86 11.28C93.7 11.28 94.7 10.38 94.7 8.92C94.7 7.28 93.68 6.64 91.56 6.64H89.14V11.24Z" fill="#F8FAFC" />
                            </svg>
                        </div>
                    </div>
                </footer>

                {/* TEMPORARY DEBUG BANNER */}
                <div className="fixed bottom-0 left-0 w-full bg-red-500/20 text-red-200 text-[10px] font-mono p-1 text-center z-50">
                    DEBUG: {API_URL}
                </div>
            </div>
        </div>
    );
}
