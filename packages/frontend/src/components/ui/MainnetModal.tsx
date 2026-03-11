"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { X, Rocket, Trophy, Clock, Sparkles } from 'lucide-react';

interface MainnetModalProps {
    isOpen: boolean;
    onClose: () => void;
    language?: 'en' | 'es';
}

const content = {
    en: {
        badge: 'COMING SOON',
        title: 'Mainnet is Not Yet Live',
        subtitle: 'ProofFlow is currently running on Hedera Testnet for the Hello Future Apex 2026 Hackathon.',
        winTitle: 'If This Project Wins...',
        winDesc: 'ProofFlow Mainnet on Hedera will be publicly available in',
        timeline: 'Q2 2026',
        features: [
            'Full HCS audit trails on Mainnet',
            'Real HBAR micropayments',
            'Production-grade smart contracts',
            'Enterprise API access',
        ],
        cta: 'Continue on Testnet',
        footer: 'Built for Hedera Hello Future Apex 2026',
    },
    es: {
        badge: 'PRÓXIMAMENTE',
        title: 'Mainnet Aún No Está Activa',
        subtitle: 'ProofFlow opera actualmente en Hedera Testnet para el hackathon Hello Future Apex 2026.',
        winTitle: 'Si Este Proyecto Gana...',
        winDesc: 'ProofFlow Mainnet en Hedera estará disponible públicamente en',
        timeline: 'Q2 2026',
        features: [
            'Auditorías HCS completas en Mainnet',
            'Micropagos reales con HBAR',
            'Smart contracts de producción',
            'Acceso a API empresarial',
        ],
        cta: 'Continuar en Testnet',
        footer: 'Creado para Hedera Hello Future Apex 2026',
    },
};

export default function MainnetModal({ isOpen, onClose, language = 'en' }: MainnetModalProps) {
    const t = content[language] ?? content.en;

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto overflow-x-hidden p-6 sm:p-8"
                    onClick={onClose}
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-md"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-[420px] flex flex-col rounded-3xl border border-white/[0.08] bg-gradient-to-b from-[#0d1117] to-[#161b22] shadow-[0_0_80px_rgba(0,255,170,0.08)] overflow-hidden shrink-0"
                    >
                        {/* Decorative top gradient line */}
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />

                        {/* Floating particles effect */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <motion.div
                                animate={{ y: [-20, -60], opacity: [0.3, 0] }}
                                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                                className="absolute top-1/2 left-1/4 w-1 h-1 rounded-full bg-emerald-400"
                            />
                            <motion.div
                                animate={{ y: [-10, -50], opacity: [0.2, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: 'linear', delay: 1 }}
                                className="absolute top-2/3 right-1/3 w-0.5 h-0.5 rounded-full bg-cyan-400"
                            />
                            <motion.div
                                animate={{ y: [-15, -55], opacity: [0.25, 0] }}
                                transition={{ duration: 3.5, repeat: Infinity, ease: 'linear', delay: 2 }}
                                className="absolute top-1/2 right-1/4 w-1 h-1 rounded-full bg-emerald-300"
                            />
                        </div>

                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-10 p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-all"
                        >
                        </button>

                        <div className="relative p-6 flex flex-col items-center text-center gap-4 overflow-y-auto no-scrollbar">
                            {/* Icon with glow */}
                            <div className="relative shrink-0">
                                <div className="absolute inset-0 blur-2xl bg-emerald-500/20 rounded-full scale-150" />
                                <motion.div
                                    animate={{ rotate: [0, 5, -5, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                                    className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 border border-emerald-500/20 flex items-center justify-center"
                                >
                                    <Rocket className="w-7 h-7 text-emerald-400" />
                                </motion.div>
                            </div>

                            {/* Badge */}
                            <motion.div
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: 'spring' }}
                                className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25"
                            >
                                <span className="text-[10px] font-bold tracking-[0.2em] text-emerald-400 flex items-center gap-1.5">
                                    <Sparkles className="w-3 h-3" />
                                    {t.badge}
                                </span>
                            </motion.div>

                            {/* Title */}
                            <div className="space-y-1.5">
                                <h2 className="text-lg font-bold text-white tracking-tight">
                                    {t.title}
                                </h2>
                                <p className="text-xs text-white/40 leading-relaxed max-w-xs mx-auto">
                                    {t.subtitle}
                                </p>
                            </div>

                            {/* Win section */}
                            <div className="w-full rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-3">
                                <div className="flex items-center justify-center gap-1.5 text-amber-400">
                                    <Trophy className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-bold tracking-wider uppercase">
                                        {t.winTitle}
                                    </span>
                                </div>

                                <p className="text-xs text-white/50">
                                    {t.winDesc}
                                </p>

                                {/* Timeline badge */}
                                <motion.div
                                    animate={{ boxShadow: ['0 0 15px rgba(16,185,129,0.1)', '0 0 30px rgba(16,185,129,0.2)', '0 0 15px rgba(16,185,129,0.1)'] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30"
                                >
                                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                                    <span className="text-base font-bold text-emerald-400 tracking-wide font-mono">
                                        {t.timeline}
                                    </span>
                                </motion.div>
                            </div>

                            {/* Features list */}
                            <div className="w-full space-y-2">
                                {t.features.map((feature, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 + i * 0.08 }}
                                        className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-white/[0.02] text-left"
                                    >
                                        <div className="w-1 h-1 rounded-full bg-emerald-500/60 shrink-0" />
                                        <span className="text-[11px] text-white/50">{feature}</span>
                                    </motion.div>
                                ))}
                            </div>

                            {/* CTA Button */}
                            <button
                                onClick={onClose}
                                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/30 text-amber-400 text-[13px] font-bold tracking-wide hover:from-amber-500/30 hover:to-amber-600/20 hover:border-amber-500/50 transition-all active:scale-[0.98]"
                            >
                                {t.cta}
                            </button>

                            {/* Footer */}
                            <p className="text-[10px] text-white/20 tracking-wider">
                                {t.footer}
                            </p>
                        </div>
                    </motion.div>
                </div>
            )
            }
        </AnimatePresence >
    );
}
