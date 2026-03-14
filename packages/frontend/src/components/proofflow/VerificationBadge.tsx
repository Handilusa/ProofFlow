import { CheckCircle2, Loader2 } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';

export default function VerificationBadge({ status, size = 'default' }: { status: string, size?: 'default' | 'sm' }) {
    const isPending = status === "PUBLISHING_TO_HEDERA" || status === "PUBLISHING";
    const isVerified = status === "VERIFIED";
    const { t } = useLanguage();

    const paddingClasses = size === 'sm' ? "px-1.5 py-0.5" : "px-2.5 sm:px-3 py-1 sm:py-1.5";
    const textClasses = size === 'sm' ? "text-[8px]" : "text-[10px] sm:text-xs";
    const iconSize = size === 'sm' ? "w-2.5 h-2.5" : "w-3.5 h-3.5";

    return (
        <div
            className={`flex items-center gap-1 sm:gap-1.5 ${paddingClasses} border ${textClasses} font-mono font-bold uppercase tracking-widest whitespace-nowrap ${isPending ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'}`}
            style={{ clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)' }}
        >
            {isPending ? (
                <>
                    <Loader2 className={`${iconSize} animate-spin`} />
                    <span>{t('verify_hcs_pending')}</span>
                </>
            ) : isVerified ? (
                <>
                    <CheckCircle2 className={iconSize} />
                    <span>{t('verify_hcs_evm_confirmed') || 'HCS & EVM VERIFIED'}</span>
                </>
            ) : (
                <>
                    <CheckCircle2 className={iconSize} />
                    <span>{t('verify_hcs_confirmed')}</span>
                </>
            )}
        </div>
    );
}
