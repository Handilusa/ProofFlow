'use client';

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useWallet } from '@/lib/wallet-context';
import { useLanguage } from '@/lib/language-context';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

export function WalletSelector() {
    const {
        isSelectorOpen,
        closeSelector,
        connectEVM,
        connectHedera
    } = useWallet();

    const { t } = useLanguage();

    return (
        <Dialog.Root open={isSelectorOpen} onOpenChange={closeSelector}>
            <AnimatePresence>
                {isSelectorOpen && (
                    <Dialog.Portal forceMount>
                        <Dialog.Overlay asChild>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
                            />
                        </Dialog.Overlay>
                        <Dialog.Content asChild>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: '-48%', x: '-50%' }}
                                animate={{ opacity: 1, scale: 1, y: '-50%', x: '-50%' }}
                                exit={{ opacity: 0, scale: 0.95, y: '-48%', x: '-50%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                className="fixed left-[50%] top-[50%] w-[90vw] max-w-md bg-neutral-950/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-0 overflow-hidden z-[9999]"
                            >
                                <div className="p-6">
                                    <div className="mb-6">
                                        <Dialog.Title className="text-2xl font-bold text-center text-white tracking-tight">
                                            {t('wallet_selector_title')}
                                        </Dialog.Title>
                                        <Dialog.Description className="text-center text-neutral-400 mt-2">
                                            {t('wallet_selector_subtitle')}
                                        </Dialog.Description>
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        {/* Hedera Ecosystem Button */}
                                        <motion.button
                                            initial={{ opacity: 0, y: 15, scale: 0.98 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                            onClick={() => {
                                                closeSelector();
                                                setTimeout(connectHedera, 300); // Wait for modal exit animation
                                            }}
                                            className="group relative flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300 overflow-hidden text-left"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-neutral-300/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                            <div className="flex items-center gap-4 relative z-10 w-full">
                                                <div className="w-12 h-12 rounded-lg bg-black/50 p-2 flex items-center justify-center border border-white/10 shadow-inner flex-shrink-0">
                                                    <svg className="w-6 h-6 text-neutral-400 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                                        {/* Left vertical */}
                                                        <rect x="4" y="2" width="3" height="20" />
                                                        {/* Right vertical */}
                                                        <rect x="17" y="2" width="3" height="20" />
                                                        {/* Top horizontal bar */}
                                                        <rect x="7" y="8" width="10" height="2.5" />
                                                        {/* Bottom horizontal bar */}
                                                        <rect x="7" y="13.5" width="10" height="2.5" />
                                                    </svg>
                                                </div>
                                                <div className="flex flex-col flex-1">
                                                    <span className="text-lg font-semibold text-white group-hover:text-neutral-200 transition-colors">Hedera Ecosystem</span>
                                                    <span className="text-sm text-neutral-400">Hashpack, Blade, Kabila</span>
                                                </div>
                                                <div className="text-neutral-500 group-hover:text-white transition-colors relative z-10 ml-auto transform group-hover:translate-x-1 duration-300">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                                                </div>
                                            </div>
                                        </motion.button>

                                        {/* EVM Ecosystem Button */}
                                        <motion.button
                                            initial={{ opacity: 0, y: 15, scale: 0.98 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            transition={{ delay: 0.15, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                            onClick={() => {
                                                closeSelector();
                                                setTimeout(connectEVM, 300); // Wait for modal exit animation
                                            }}
                                            className="group relative flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300 overflow-hidden text-left"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                            <div className="flex items-center gap-4 relative z-10 w-full">
                                                <div className="w-12 h-12 rounded-lg bg-black/50 p-2 flex items-center justify-center border border-white/10 shadow-inner flex-shrink-0">
                                                    <svg viewBox="0 0 256 417" className="w-6 h-6 text-blue-400" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid">
                                                        <path d="M127.961 0l-2.795 9.5v275.668l2.795 2.79 127.962-75.638z" fill="#343434" /><path d="M127.962 0L0 212.32l127.962 75.639V154.158z" fill="#8C8C8C" /><path d="M127.961 312.187l-1.575 1.92v98.199l1.575 4.6L256 236.587z" fill="#3C3C3B" /><path d="M127.962 416.905v-104.72L0 236.585z" fill="#8C8C8C" /><path d="M127.961 287.958l127.96-75.637-127.96-58.162z" fill="#141414" /><path d="M0 212.32l127.96 75.638v-133.8z" fill="#393939" />
                                                    </svg>
                                                </div>
                                                <div className="flex flex-col flex-1">
                                                    <span className="text-lg font-semibold text-white group-hover:text-blue-200 transition-colors">EVM Ecosystem</span>
                                                    <span className="text-sm text-neutral-400">MetaMask, OKX Wallet, Coinbase Wallet</span>
                                                </div>
                                                <div className="text-neutral-500 group-hover:text-blue-400 transition-colors relative z-10 ml-auto transform group-hover:translate-x-1 duration-300">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                                                </div>
                                            </div>
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        </Dialog.Content>
                    </Dialog.Portal>
                )}
            </AnimatePresence>
        </Dialog.Root>
    );
}
