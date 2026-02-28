import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { AlertCircle, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isLoading = false
}: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/60 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="relative w-full max-w-md bg-surface-elevated border border-border/50 rounded-2xl shadow-2xl p-6"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-text-muted hover:text-white transition-colors"
                            disabled={isLoading}
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3 text-amber-500">
                                <AlertCircle className="w-6 h-6" />
                                <h3 className="text-lg font-bold text-white">{title}</h3>
                            </div>

                            <p className="text-sm text-text-muted leading-relaxed">
                                {description}
                            </p>

                            <div className="flex gap-3 mt-4 w-full justify-end">
                                <Button
                                    onClick={onClose}
                                    disabled={isLoading}
                                    className="bg-background hover:bg-surface border border-border text-white px-4 py-2"
                                >
                                    {cancelText}
                                </Button>
                                <Button
                                    onClick={onConfirm}
                                    disabled={isLoading}
                                    className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-4 py-2"
                                >
                                    {isLoading ? '...' : confirmText}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
