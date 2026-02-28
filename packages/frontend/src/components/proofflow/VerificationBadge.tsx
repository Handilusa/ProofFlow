import { CheckCircle2, Loader2 } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';

export default function VerificationBadge({ status }: { status: string }) {
    const isPending = status === "PUBLISHING_TO_HEDERA" || status === "PUBLISHING";
    const { t } = useLanguage();

    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${isPending ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'}`}>
            {isPending ? (
                <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{t('verify_hcs_pending')}</span>
                </>
            ) : (
                <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t('verify_hcs_confirmed')}</span>
                </>
            )}
        </div>
    );
}
