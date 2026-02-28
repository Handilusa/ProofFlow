'use client';

import { Settings, Globe, Network, Info, User, Loader2 } from 'lucide-react';
import { Card, Input, Button, ConfirmModal } from '@/components/ui';
import { useLanguage } from '@/lib/language-context';
import { useWallet } from '@/lib/wallet-context';
import { API_URL } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
    const { language, setLanguage, t } = useLanguage();
    const { account, isConnected } = useWallet();
    const [username, setUsername] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [cooldownDays, setCooldownDays] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const fetchProfileStatus = async () => {
        if (!account) return;
        try {
            const res = await fetch(`${API_URL}/api/v1/user/profile/${account}`);
            if (res.ok) {
                const data = await res.json();
                if (data.username) {
                    setUsername(data.username);
                }
                if (data.cooldownDaysLeft !== undefined) {
                    setCooldownDays(data.cooldownDaysLeft);
                }
            }
        } catch (err) {
            console.error('Failed to fetch profile status', err);
        }
    };

    useEffect(() => {
        fetchProfileStatus();
    }, [account]);

    const handleSaveProfile = () => {
        if (!account || !username.trim()) return;
        setIsModalOpen(true);
    };

    const executeSaveProfile = async () => {
        if (!account) return;
        setIsSaving(true);
        try {
            const res = await fetch(`${API_URL}/api/v1/user/profile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: account, username })
            });

            const data = await res.json();

            if (!res.ok) {
                if (res.status === 403 && data.error === 'COOLDOWN_ACTIVE') {
                    toast.error(`${t('settings_cooldown_error')}${data.daysLeft}`);
                    return;
                }
                throw new Error(data.error || 'Failed to save profile');
            }

            toast.success(t('settings_saved'));
            await fetchProfileStatus(); // Refresh the profile to get the new cooldown state
        } catch (err) {
            console.error(err);
            toast.error('Could not save profile.');
        } finally {
            setIsSaving(false);
            setIsModalOpen(false);
        }
    };

    const languages = [
        { code: 'en' as const, label: 'English', prefix: 'EN' },
        { code: 'es' as const, label: 'Español', prefix: 'ES' },
    ];

    return (
        <div className="space-y-8 pb-10 max-w-2xl">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
                    <Settings className="w-8 h-8 text-accent-primary" />
                    {t('settings_title')}
                </h1>
                <p className="text-text-muted mt-2">{t('settings_subtitle')}</p>
            </motion.div>

            {/* Language */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
            >
                <Card className="p-6 border-border/50 bg-surface/50 space-y-4">
                    <div className="flex items-start gap-3">
                        <Globe className="w-5 h-5 text-accent-primary mt-0.5 shrink-0" />
                        <div>
                            <h2 className="text-sm font-semibold text-white">{t('settings_language')}</h2>
                            <p className="text-xs text-text-muted mt-0.5">{t('settings_language_desc')}</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => setLanguage(lang.code)}
                                className={cn(
                                    'flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200',
                                    language === lang.code
                                        ? 'bg-accent-primary/10 border-accent-primary/50 text-accent-primary'
                                        : 'bg-background border-border/50 text-text-muted hover:text-white hover:border-border'
                                )}
                            >
                                <span className={cn(
                                    "text-[10px] font-bold px-1.5 py-0.5 rounded border transition-colors",
                                    language === lang.code
                                        ? "bg-accent-primary text-black border-accent-primary"
                                        : "bg-surface-elevated text-text-muted border-border"
                                )}>
                                    {lang.prefix}
                                </span>
                                {lang.label}
                            </button>
                        ))}
                    </div>
                </Card>
            </motion.div>

            {/* Profile */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
            >
                <Card className="p-6 border-border/50 bg-surface/50 space-y-4">
                    <div className="flex items-start gap-3">
                        <User className="w-5 h-5 text-accent-primary mt-0.5 shrink-0" />
                        <div className="flex-1 w-full">
                            <h2 className="text-sm font-semibold text-white">{t('settings_profile')}</h2>
                            <p className="text-xs text-text-muted mt-0.5">{t('settings_profile_desc')}</p>

                            <div className="mt-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center w-full max-w-sm">
                                {cooldownDays > 0 ? (
                                    <div className="flex items-center justify-between w-full h-10 px-3 bg-background/40 border border-border rounded-md cursor-not-allowed opacity-80">
                                        <span className="font-mono text-sm text-text-muted truncate">{username}</span>
                                        <div
                                            className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 text-xs font-mono cursor-pointer hover:bg-amber-500/20 transition-colors"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                toast(`${t('settings_cooldown_tooltip')} ${cooldownDays} ${t('settings_days')}`, { icon: '⏳' });
                                            }}
                                        >
                                            {cooldownDays}d
                                            <Info className="w-3.5 h-3.5" />
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <Input
                                            placeholder={t('settings_username_placeholder')}
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            disabled={!isConnected}
                                            className="w-full font-mono text-sm"
                                            maxLength={20}
                                        />
                                        <Button
                                            onClick={handleSaveProfile}
                                            disabled={!isConnected || !username.trim() || isSaving}
                                            size="sm"
                                            className="h-10 px-4 whitespace-nowrap bg-accent-primary/20 text-accent-primary hover:bg-accent-primary hover:text-black border-accent-primary/50"
                                        >
                                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('settings_save')}
                                        </Button>
                                    </>
                                )}
                            </div>
                            {!isConnected && (
                                <p className="text-[10px] text-amber-500/80 mt-2 font-mono">
                                    * Connect wallet to set your profile name
                                </p>
                            )}
                        </div>
                    </div>
                </Card>
            </motion.div>

            {/* Network */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <Card className="p-6 border-border/50 bg-surface/50 space-y-3">
                    <div className="flex items-start gap-3">
                        <Network className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                        <div>
                            <h2 className="text-sm font-semibold text-white">{t('settings_network')}</h2>
                            <p className="text-xs text-text-muted mt-0.5">{t('settings_network_desc')}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-background/60 px-3 py-2 rounded-lg border border-border/40 w-fit">
                        <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                        <span className="text-xs font-mono text-success">Hedera Testnet — ONLINE</span>
                    </div>
                </Card>
            </motion.div>

            {/* Version */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
            >
                <Card className="p-6 border-border/50 bg-surface/50 space-y-3">
                    <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-text-muted mt-0.5 shrink-0" />
                        <div>
                            <h2 className="text-sm font-semibold text-white">{t('settings_version')}</h2>
                            <p className="text-xs text-text-muted mt-1 font-mono">ProofFlow v1.0.0 — Hello Future Apex 2026</p>
                        </div>
                    </div>
                </Card>
            </motion.div>

            <ConfirmModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={executeSaveProfile}
                title={t('settings_confirm_title')}
                description={t('settings_confirm_desc')}
                confirmText={t('settings_confirm_yes')}
                cancelText={t('settings_confirm_no')}
                isLoading={isSaving}
            />
        </div>
    );
}
