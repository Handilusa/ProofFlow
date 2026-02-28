'use client';
import { useLanguage } from '@/lib/language-context';

export default function FooterText() {
    const { t } = useLanguage();
    return (
        <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-xs font-mono text-text-muted">{t('footer_status')}</span>
            </div>
            <span className="text-xs text-border">|</span>
            <span className="text-xs font-medium text-text-muted tracking-wide">{t('footer_tagline')}</span>
            <span className="text-xs text-border">|</span>
            <a href="#" className="text-xs font-mono text-success bg-success/10 px-2 py-1 rounded border border-success/20">
                {t('footer_testnet')}
            </a>
            <span className="text-xs text-border">|</span>
            <a href="https://github.com/handi/proofflow-monorepo" target="_blank" rel="noopener noreferrer" className="text-xs text-text-muted hover:text-white transition-colors">
                {t('footer_github')}
            </a>
            <span className="text-[10px] text-text-muted/60 uppercase tracking-widest hidden sm:inline">{t('footer_built_for')}</span>
        </div>
    );
}
