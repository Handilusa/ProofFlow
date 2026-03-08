"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Send, Loader2, X } from 'lucide-react';
import { Button, Input } from '@/components/ui';

interface CaptchaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onVerify: (solution: string) => void;
    question: string;
    isLoading: boolean;
    error?: string;
}

export default function CaptchaModal({ isOpen, onClose, onVerify, question, isLoading, error }: CaptchaModalProps) {
    const [solution, setSolution] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!solution.trim() || isLoading) return;
        onVerify(solution.trim());
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={!isLoading ? onClose : undefined}
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-sm bg-[#0A0D14] border border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.15)] rounded-2xl overflow-hidden"
                    >
                        {/* Header Stripe */}
                        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500" />

                        <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3 text-amber-500">
                                    <ShieldAlert className="w-6 h-6" />
                                    <h2 className="text-lg font-display font-bold">Security Challenge</h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-1 rounded-full hover:bg-white/5 text-slate-400 transition-colors disabled:opacity-50"
                                    disabled={isLoading}
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                                Unusual traffic detected. Please solve this quick math problem to verify you are human and continue your request.
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-center">
                                    <p className="text-2xl font-mono text-white tracking-widest">{question} = ?</p>
                                </div>

                                <div>
                                    <Input
                                        type="number"
                                        placeholder="Enter your answer"
                                        value={solution}
                                        onChange={(e) => setSolution(e.target.value)}
                                        className="w-full text-center text-lg font-mono relative z-20"
                                        autoFocus
                                        disabled={isLoading}
                                    />
                                    {error && (
                                        <p className="text-red-400 text-xs mt-2 text-center">{error}</p>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    disabled={!solution.trim() || isLoading}
                                    className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-black border-amber-500/50"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            Verify <Send className="w-3 h-3" />
                                        </span>
                                    )}
                                </Button>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
