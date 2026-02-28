'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'es';

const translations = {
    en: {
        // Sidebar
        nav_dashboard: 'Dashboard',
        nav_verify: 'Verify Proof',
        nav_history: 'Audit History',
        nav_leaderboard: 'Leaderboard',
        nav_settings: 'Settings',
        nav_github: 'View on GitHub',

        // ConnectWallet
        wallet_connect: 'Connect Wallet',
        wallet_copied: '✓ Address copied to clipboard',
        wallet_testnet: 'Hedera Testnet',
        wallet_disconnect: 'Disconnect Wallet',

        // Dashboard
        dash_title: 'ProofFlow Core Agent',
        dash_subtitle: 'Ask for verifiable AI reasoning. Every thought process is immutably anchored to Hedera HCS. Upon success, a $PFR Audit Pass Token is minted directly to your connected wallet as cryptographic proof.',
        dash_placeholder: 'e.g. Analyze the APY trends for Stader xHBAR staking this week. Is it safe to auto-compound?',
        dash_submit: 'Initialize Audit Session',
        dash_loading: 'Processing Blockchain Transaction...',
        dash_vectors: 'Suggested Vectors:',
        dash_feed: 'Live Network Feed (Recent)',
        dash_awaiting: 'Awaiting execution matrix...',
        dash_init: '] Initializing connection to Gemini 2.5 Flash...',
        dash_negotiating: 'Negotiating consensus on HCS...',
        dash_live_data: 'LIVE DATA:',
        dash_terminal_title: 'HCS AUDIT TERMINAL',
        dash_terminal_listening: 'Listening to Mirror Node:',
        dash_publishing: 'Publishing...',
        dash_hcs_steps: 'HCS Steps',

        // Verify Page
        verify_title: 'Proof Verification',
        verify_subtitle: 'Reconstruct any AI reasoning session from the Hedera Consensus Service. Every execution is hashed, timestamped, and immutable.',
        verify_placeholder: 'Enter Proof ID (e.g. 550e8400-e29b-41d4-a716-446655440000)',
        verify_button: 'Reconstruct Audit Trail',
        verify_loading: 'Reconstructing...',
        verify_try: 'Try a recent proof:',
        verify_error: 'Proof not found or network error. Please check the ID.',
        verify_summary: 'Audit Summary',
        verify_created: 'Created At',
        verify_topic: 'HCS Topic ID',
        verify_steps: 'Total Verified Steps',
        verify_root: 'Cryptographic Root Hash',
        verify_certificate: 'Audit Certificate',
        verify_cert_desc: 'This AI reasoning session is permanently anchored to the Hedera network as a verifiable cryptographic proof.',
        verify_view_pass: 'View Audit Pass Token',
        verify_no_pass: 'No Audit Pass Minted',
        verify_share: 'Share this Verification',
        verify_loading_ui: 'Loading Validator...',
        verify_hcs_pending: 'HCS SYNC PENDING',
        verify_hcs_confirmed: 'CONFIRMED ON HEDERA',

        // History Page
        history_title_personal: 'My Audit History',
        history_title_global: 'Global Audit History',
        history_subtitle_personal: 'Viewing reasoning sessions anchored to your connected Hedera wallet',
        history_subtitle_global: 'A public ledger of all verifiable AI reasoning sessions anchored to Hedera.',
        history_filter_all: 'All',
        history_filter_verified: 'Verified',
        history_filter_pending: 'Pending',
        history_search: 'Search Proof ID...',
        history_col_question: 'Question / Topic',
        history_col_proof: 'Proof ID',
        history_col_steps: 'Steps',
        history_col_status: 'Status',
        history_col_time: 'Time',
        history_col_actions: 'Actions',
        history_empty: 'No proofs found for this filter.',
        history_verified: 'Verified',
        history_pending: 'Pending',
        history_time_prefix: '',
        history_ago: 'm ago',
        history_reward_tx: 'Reward Tx',

        // Leaderboard
        lb_title: 'Most Active Reasoning Sessions',
        lb_subtitle: 'Wallets ranked by verifiable (Audit Pass / PFR) tokens earned through anchoring reasoning sessions.',
        lb_global: 'GLOBAL',
        lb_my: 'MY HISTORY',
        lb_search: 'SEARCH_BY_WALLET()',
        lb_col_identity: 'WALLET_IDENTITY',
        lb_col_tokens: 'AUDIT_PASS (PFR)',
        lb_col_dominance: 'NETWORK_DOMINANCE',
        lb_sync_ahead: 'SYNC AHEAD:',

        // Network Stats
        net_hcs_msgs: 'HCS Messages:',
        net_wallets_created: 'Wallets Created:',
        net_pfr_minted: '$PFR Minted:',

        // Footer
        footer_status: 'STATUS: ONLINE',
        footer_tagline: 'TRUST LAYER FOR AUTONOMOUS ECONOMIES',
        footer_testnet: 'TESTNET EXCLUSIVE',
        footer_github: 'GitHub Protocol',
        footer_built_for: 'Built for Hello Future Apex 2026',

        // Settings
        settings_title: 'Settings',
        settings_subtitle: 'Configure your ProofFlow experience.',
        settings_language: 'Language',
        settings_language_desc: 'Choose the display language for the interface.',
        settings_profile: 'Profile',
        settings_profile_desc: 'Set a display name for the leaderboard.',
        settings_username_placeholder: 'Enter username (max 20 chars)',
        settings_save: 'Save Changes',
        settings_saved: 'Profile updated successfully',
        settings_cooldown_error: 'You can only change your username every 90 days. Days left: ',
        settings_cooldown_tooltip: 'Wait time remaining: ',
        settings_days: 'days',
        settings_confirm_title: 'Are you sure?',
        settings_confirm_desc: 'Once you set your username, you will not be able to change it again for the next 90 days. Please double-check for typos.',
        settings_confirm_yes: 'Yes, lock it in',
        settings_confirm_no: 'Cancel',
        settings_network: 'Network',
        settings_network_desc: 'Currently connected to Hedera Testnet.',
        settings_version: 'Version',
    },
    es: {
        // Sidebar
        nav_dashboard: 'Dashboard',
        nav_verify: 'Verificar Auditoría',
        nav_history: 'Historial',
        nav_leaderboard: 'Clasificación',
        nav_settings: 'Ajustes',
        nav_github: 'Ver en GitHub',

        // ConnectWallet
        wallet_connect: 'Conectar Wallet',
        wallet_copied: '✓ Copiado al portapapeles',
        wallet_testnet: 'Hedera Testnet',
        wallet_disconnect: 'Desconectar',

        // Dashboard
        dash_title: 'Agente ProofFlow',
        dash_subtitle: 'Solicita razonamiento de IA verificable. Cada análisis queda anclado de forma inmutable en Hedera HCS. Al finalizar, recibirás un Token $PFR como prueba criptográfica.',
        dash_placeholder: 'ej. ¿Cuál es el riesgo de liquidez en SaucerSwap hoy?',
        dash_submit: 'Iniciar Sesión de Auditoría',
        dash_loading: 'Confirmando en Blockchain...',
        dash_vectors: 'Vectores de análisis:',
        dash_feed: 'Últimas Auditorías',
        dash_awaiting: 'ESPERANDO MATRIZ DE RAZONAMIENTO...',
        dash_init: '] Conectando con Gemini 2.5 Flash...',
        dash_negotiating: '] Negociando consenso en HCS...',
        dash_live_data: 'DATOS EN VIVO:',
        dash_terminal_title: 'TERMINAL DE AUDITORÍA HCS',
        dash_terminal_listening: 'Sincronizado con Mirror Node:',
        dash_publishing: 'Publicando...',
        dash_hcs_steps: 'Pasos HCS',

        // Verify Page
        verify_title: 'Verificar Auditoría',
        verify_subtitle: 'Reconstruye el razonamiento original desde Hedera. Cada paso es inmutable y está sellado por consenso.',
        verify_placeholder: 'Introduce el ID de la prueba (Proof ID)...',
        verify_button: 'Verificar Auditoría',
        verify_loading: 'Reconstruyendo...',
        verify_try: 'Pruebas recientes:',
        verify_error: 'No se encontró la prueba o hay error de red.',
        verify_summary: 'Resumen del Rastro',
        verify_created: 'Fecha de creación',
        verify_topic: 'ID de Topic (HCS)',
        verify_steps: 'Pasos verificados',
        verify_root: 'Hash Raíz (Merkle)',
        verify_certificate: 'Certificado de Integridad',
        verify_cert_desc: 'Este análisis está anclado permanentemente en la red de Hedera como una prueba criptográfica real.',
        verify_view_pass: 'Ver Token de Auditoría',
        verify_no_pass: 'Sin Token acuñado',
        verify_share: 'Compartir validación',
        verify_loading_ui: 'Cargando validador...',
        verify_hcs_pending: 'SINCRONIZANDO HCS',
        verify_hcs_confirmed: 'CONFIRMADO EN HEDERA',

        // History Page
        history_title_personal: 'Mi Historial',
        history_title_global: 'Historial Global',
        history_subtitle_personal: 'Sesiones de razonamiento vinculadas a tu wallet.',
        history_subtitle_global: 'Registro público de auditorías IA ancladas en Hedera.',
        history_filter_all: 'Todas',
        history_filter_verified: 'Verificadas',
        history_filter_pending: 'Pendientes',
        history_search: 'Buscar por Proof ID...',
        history_col_question: 'Tema / Pregunta',
        history_col_proof: 'ID',
        history_col_steps: 'Pasos',
        history_col_status: 'Estado',
        history_col_time: 'Hace',
        history_col_actions: 'Acciones',
        history_empty: 'No hay resultados.',
        history_verified: 'Confirmado',
        history_pending: 'Procesando',
        history_time_prefix: 'hace ',
        history_ago: ' min',
        history_reward_tx: 'Tx Reward',

        // Leaderboard
        lb_title: 'Ranking de Actividad',
        lb_subtitle: 'Billeteras con más Tokens de Auditoría ($PFR) generados.',
        lb_global: 'GLOBAL',
        lb_my: 'MI HISTORIAL',
        lb_search: 'BUSCAR_POR_WALLET()',
        lb_col_identity: 'DIRECCIÓN_WALLET',
        lb_col_tokens: 'BALANCE_$PFR',
        lb_col_dominance: 'CUOTA_DE_RED',
        lb_sync_ahead: 'SINCRONIZACIÓN:',

        // Network Stats
        net_hcs_msgs: 'Mensajes HCS:',
        net_wallets_created: 'Wallets Creadas:',
        net_pfr_minted: '$PFR Emitidos:',

        // Footer
        footer_status: 'ESTADO: ONLINE',
        footer_tagline: 'CAPA DE CONFIANZA PARA ECONOMÍAS AUTÓNOMAS',
        footer_testnet: 'EXCLUSIVO TESTNET',
        footer_github: 'Protocolo GitHub',
        footer_built_for: 'Creado para Hello Future Apex 2026',

        // Settings
        settings_title: 'Ajustes',
        settings_subtitle: 'Configura tu cuenta y preferencias.',
        settings_language: 'Idioma',
        settings_language_desc: 'Selecciona el idioma de la interfaz.',
        settings_profile: 'Perfil',
        settings_profile_desc: 'Establece un nombre de usuario para la clasificación (leaderboard).',
        settings_username_placeholder: 'Nombre de usuario (máx. 20 carácteres)',
        settings_save: 'Guardar Cambios',
        settings_saved: 'Perfil actualizado con éxito',
        settings_cooldown_error: 'Solo puedes cambiar tu nombre cada 90 días. Faltan: ',
        settings_cooldown_tooltip: 'Para volver a cambiar faltan: ',
        settings_days: 'días',
        settings_confirm_title: '¿Estás seguro?',
        settings_confirm_desc: 'Una vez que guardes tu nombre, no podrás volver a cambiarlo durante los próximos 90 días. Verifica que esté bien escrito.',
        settings_confirm_yes: 'Sí, guardarlo',
        settings_confirm_no: 'Cancelar',
        settings_network: 'Red',
        settings_network_desc: 'Conectado a Hedera Testnet.',
        settings_version: 'Versión',
    }
};

type TranslationKey = keyof typeof translations.en;

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
    language: 'en',
    setLanguage: () => { },
    t: (key) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = useState<Language>('en');

    useEffect(() => {
        const stored = localStorage.getItem('proofflow_lang') as Language;
        if (stored === 'en' || stored === 'es') setLanguageState(stored);
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('proofflow_lang', lang);
    };

    const t = (key: TranslationKey): string => translations[language][key] ?? translations.en[key] ?? key;

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => useContext(LanguageContext);
