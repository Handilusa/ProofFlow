'use client';

import { Settings, Globe, Network, Info, User, Loader2, ShieldCheck, Trophy, ChevronRight } from 'lucide-react';
import { Input, Button, ConfirmModal } from '@/components/ui';
import MainnetModal from '@/components/ui/MainnetModal';
import { useLanguage } from '@/lib/language-context';
import { useWallet } from '@/lib/wallet-context';
import { API_URL, cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
    const { language, setLanguage, t } = useLanguage();
    const { account, isConnected, network, setNetwork, userTier, refreshTier } = useWallet();
    const [username, setUsername] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [cooldownDays, setCooldownDays] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showMainnetModal, setShowMainnetModal] = useState(false);

    const tierBenefits = [
        { id: 'bronze', name: 'Bronze', audits: 50, discount: '10%', color: 'text-amber-600', bg: 'bg-amber-600/10' },
        { id: 'silver', name: 'Silver', audits: 250, discount: '20%', color: 'text-slate-400', bg: 'bg-slate-400/10' },
        { id: 'gold', name: 'Gold', audits: 750, discount: 'MAX (Cost Only)', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    ];

    const fetchProfileStatus = async () => {
        if (!account) return;
        try {
            const res = await fetch(`${API_URL}/user/profile/${account}`);
            if (res.ok) {
                const data = await res.json();
                if (data.username) setUsername(data.username);
                if (data.cooldownDaysLeft !== undefined) setCooldownDays(data.cooldownDaysLeft);
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
            const res = await fetch(`${API_URL}/user/profile`, {
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
            await fetchProfileStatus();
            await refreshTier();
        } catch (err) {
            console.error(err);
            toast.error('Could not save profile.');
        } finally {
            setIsSaving(false);
            setIsModalOpen(false);
        }
    };

    const languages = [
        { code: 'en' as const, label: 'English' },
        { code: 'es' as const, label: 'Español' },
    ];

    return (
        <div className="max-w-4xl pb-20 px-4 sm:px-0">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-10 pb-6 border-b border-white/[0.04]"
            >
                <h1 className="text-2xl font-display font-medium text-white flex items-center gap-3">
                    <Settings className="w-5 h-5 text-white/40" />
                    {t('settings_title')}
                </h1>
                <p className="text-white/40 mt-2 text-sm max-w-xl">{t('settings_subtitle')}</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex flex-col space-y-0 divide-y divide-white/[0.04]"
            >
                {/* Language Row */}
                <div className="py-8 flex flex-col sm:flex-row sm:items-start gap-6 sm:gap-24">
                    <div className="sm:w-1/3 shrink-0">
                        <div className="flex items-center gap-2 mb-1">
                            <Globe className="w-4 h-4 text-white/50" />
                            <h2 className="text-sm font-medium text-white/90">{t('settings_language')}</h2>
                        </div>
                        <p className="text-[13px] text-white/40 leading-relaxed">{t('settings_language_desc')}</p>
                    </div>
                    <div className="flex-1">
                        <div className="flex bg-black/40 p-1 rounded-lg border border-white/[0.04] w-fit">
                            {languages.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => setLanguage(lang.code)}
                                    className={cn(
                                        'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                                        language === lang.code
                                            ? 'bg-white/10 text-white shadow-sm'
                                            : 'text-white/40 hover:text-white/80'
                                    )}
                                >
                                    {lang.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Minimal Membership Row (Redirects to Passport) */}
                <div className="py-8 flex flex-col sm:flex-row sm:items-start gap-6 sm:gap-24">
                    <div className="sm:w-1/3 shrink-0">
                        <div className="flex items-center gap-2 mb-1">
                            <Trophy className="w-4 h-4 text-white/50" />
                            <h2 className="text-sm font-medium text-white/90">NFT Passport</h2>
                        </div>
                        <p className="text-[13px] text-white/40 leading-relaxed">Manage your tier progress and NFT rewards.</p>
                    </div>
                    <div className="flex-1 max-w-xl">
                        <button
                            onClick={() => window.location.href = `/${network}/passport`}
                            className="group flex items-center justify-between w-full max-w-sm px-4 py-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] rounded-xl transition-all duration-300"
                        >
                            <div className="flex flex-col items-start gap-0.5">
                                <span className="text-[10px] uppercase font-bold tracking-widest text-white/30 group-hover:text-accent-primary/50 transition-colors">
                                    {t('settings_current_tier')}
                                </span>
                                <span className={cn(
                                    "text-sm font-bold tracking-tight",
                                    userTier?.id === 'gold' ? 'text-yellow-500' :
                                    userTier?.id === 'silver' ? 'text-slate-300' :
                                    userTier?.id === 'bronze' ? 'text-amber-500' :
                                    'text-white/70'
                                )}>
                                    {userTier ? t(`tier_${userTier.id}` as any) : t('tier_free')}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {userTier && userTier.id !== 'free' && (
                                    <div className={cn(
                                        "w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.3)]",
                                        userTier.id === 'gold' ? 'bg-yellow-500' :
                                        userTier.id === 'silver' ? 'bg-slate-300' :
                                        'bg-amber-500'
                                    )} />
                                )}
                                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all" />
                            </div>
                        </button>
                    </div>
                </div>

                {/* Profile Row */}
                <div className="py-8 flex flex-col sm:flex-row sm:items-start gap-6 sm:gap-24">
                    <div className="sm:w-1/3 shrink-0">
                        <div className="flex items-center gap-2 mb-1">
                            <User className="w-4 h-4 text-white/50" />
                            <h2 className="text-sm font-medium text-white/90">{t('settings_profile')}</h2>
                        </div>
                        <p className="text-[13px] text-white/40 leading-relaxed">{t('settings_profile_desc')}</p>
                    </div>
                    <div className="flex-1 max-w-md">
                        <div className="flex flex-col sm:flex-row gap-3">
                            {cooldownDays > 0 ? (
                                <div className="flex-1 flex items-center justify-between h-10 px-3 bg-black/40 border border-white/[0.04] rounded-lg opacity-60 cursor-not-allowed">
                                    <span className="text-sm text-white/70 truncate">{username}</span>
                                    <span className="text-xs text-white/40 font-mono">{cooldownDays}d left</span>
                                </div>
                            ) : (
                                <Input
                                    placeholder={t('settings_username_placeholder')}
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    disabled={!isConnected}
                                    className="flex-1 h-10 text-sm bg-black/20 border-white/[0.08] focus:border-white/20 rounded-lg"
                                    maxLength={20}
                                />
                            )}
                            {cooldownDays === 0 && (
                                <Button
                                    onClick={handleSaveProfile}
                                    disabled={!isConnected || !username.trim() || isSaving}
                                    className="h-10 px-5 rounded-lg bg-white text-black hover:bg-white/90 font-medium text-sm transition-colors"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('settings_save')}
                                </Button>
                            )}
                        </div>
                        {!isConnected && (
                            <p className="text-[11px] text-amber-500/70 mt-3 font-mono">
                                {t('settings_connect_wallet_profile')}
                            </p>
                        )}
                    </div>
                </div>

                {/* Network Row */}
                <div className="py-8 flex flex-col sm:flex-row sm:items-start gap-6 sm:gap-24">
                    <div className="sm:w-1/3 shrink-0">
                        <div className="flex items-center gap-2 mb-1">
                            <Network className="w-4 h-4 text-white/50" />
                            <h2 className="text-sm font-medium text-white/90">{t('settings_network')}</h2>
                        </div>
                        <p className="text-[13px] text-white/40 leading-relaxed">{t('settings_network_desc')}</p>
                    </div>
                    <div className="flex-1 flex flex-col gap-2 max-w-sm">
                        <button
                            onClick={() => setNetwork('testnet')}
                            className={cn(
                                'flex items-center gap-3 px-4 py-3 rounded-lg border text-sm transition-colors text-left',
                                network === 'testnet'
                                    ? 'bg-amber-500/[0.02] border-amber-500/20 text-white shadow-[inset_0_0_20px_rgba(245,158,11,0.02)]'
                                    : 'bg-transparent border-white/[0.04] text-white/40 hover:bg-white/[0.02]'
                            )}
                        >
                            <div className={cn("w-2 h-2 rounded-full", network === 'testnet' ? "bg-amber-500" : "bg-white/20")} />
                            Hedera Testnet
                        </button>
                        <button
                            onClick={() => setShowMainnetModal(true)}
                            className={cn(
                                'flex items-center gap-3 px-4 py-3 rounded-lg border text-sm transition-colors text-left',
                                network === 'mainnet'
                                    ? 'bg-emerald-500/[0.02] border-emerald-500/20 text-white shadow-[inset_0_0_20px_rgba(16,185,129,0.02)]'
                                    : 'bg-transparent border-white/[0.04] text-white/40 hover:bg-white/[0.02]'
                            )}
                        >
                            <div className={cn("w-2 h-2 rounded-full", network === 'mainnet' ? "bg-emerald-500" : "bg-white/20")} />
                            Hedera Mainnet
                        </button>
                    </div>
                </div>

                {/* Version Row */}
                <div className="py-8 flex flex-col sm:flex-row sm:items-start gap-6 sm:gap-24">
                    <div className="sm:w-1/3 shrink-0">
                        <div className="flex items-center gap-2 mb-1">
                            <Info className="w-4 h-4 text-white/50" />
                            <h2 className="text-sm font-medium text-white/90">{t('settings_version')}</h2>
                        </div>
                    </div>
                    <div className="flex-1 flex items-center gap-4">
                        <span className="text-sm text-white/60 font-mono">ProofFlow v1.2.0</span>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-white/10">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            <span className="text-[10px] text-white/50 uppercase tracking-widest font-medium">Hello Future Apex</span>
                        </div>
                    </div>
                </div>
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

            <MainnetModal
                isOpen={showMainnetModal}
                onClose={() => setShowMainnetModal(false)}
                language={language}
            />
        </div>
    );
}
