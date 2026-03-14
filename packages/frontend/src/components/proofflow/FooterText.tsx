'use client';
import { useLanguage } from '@/lib/language-context';

export default function FooterText() {
    const { t } = useLanguage();
    return (
        <div className="flex justify-center items-center gap-2 sm:gap-4 flex-nowrap whitespace-nowrap overflow-hidden text-center font-mono w-full max-w-full px-4">
            <div className="flex items-center gap-2 shrink-0">
                <div className="w-2 h-2 bg-emerald-400 animate-pulse shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                <span className="text-[10px] sm:text-xs text-cyan-400/50 uppercase tracking-widest shrink-0">{t('footer_status')}</span>
            </div>
            <span className="text-[10px] sm:text-xs text-cyan-500/30 shrink-0">|</span>
            <span className="text-[10px] sm:text-xs text-cyan-400/70 tracking-widest min-w-[50px]">{t('footer_tagline')}</span>
            <span className="hidden sm:inline text-[10px] sm:text-xs text-cyan-500/30 shrink-0">|</span>
            <a href="https://github.com/Handilusa/ProofFlow" target="_blank" rel="noopener noreferrer" className="text-[10px] sm:text-xs text-cyan-400/50 hover:text-cyan-400 transition-colors uppercase tracking-widest">
                {t('footer_github')}
            </a>
            <span className="text-[9px] text-cyan-400/30 uppercase tracking-[0.2em] hidden sm:inline shrink-0">{t('footer_built_for')}</span>
        </div>
    );
}
