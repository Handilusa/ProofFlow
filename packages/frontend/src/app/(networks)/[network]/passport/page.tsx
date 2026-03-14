'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Activity, Lock, Play, X, ExternalLink, Award, Clock, Sparkles, Zap, History, CheckCircle2, ChevronRight, QrCode } from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { useWallet } from '@/lib/wallet-context';
import { useLanguage } from '@/lib/language-context';
import { cn } from '@/lib/utils';
import { useSendTransaction } from 'wagmi';
import { parseEther } from 'viem';
import { TransferTransaction, Hbar, TransactionId, AccountId } from "@hashgraph/sdk";
import { initHederaWalletConnect } from '@/lib/hedera-walletconnect';

// ── Tier Data ─────────────────────────────────────────────────────
// Silver & Gold CIDs will be dropped in later — the UI handles null gracefully
const ACHIEVEMENTS = [
    {
        id: 'bronze',
        name: 'Bronze Horizon',
        threshold: 50,
        discount: 10,
        gradient: 'from-orange-500 via-amber-400 to-orange-600',
        glow: 'shadow-[0_0_50px_rgba(245,158,11,0.4)]',
        ring: 'ring-orange-500/50',
        text: 'text-orange-400 drop-shadow-[0_0_8px_rgba(2fb,146,60,0.8)]',
        bg: 'bg-orange-500/10',
        videoCid: 'bafybeihshxad4mhygrbajmhrmfh27xdfv3iqy5pxcxtfbvnexn7afdmr2i',
        thumbnailCid: 'bafybeibhmukkg24hglbwty7kncctoyt7gpmfy5muofa6eeg55wjucgimaq',
        metadataCid: 'bafkreidd27ujrg3cdyzfdarmhgtx6m22svbsgqmkzbcs45vzar6d4dej6q',
        desc: 'Entry-level cryptographic proof of contribution.',
    },
    {
        id: 'silver',
        name: 'Silver Synthesis',
        threshold: 250,
        discount: 20,
        gradient: 'from-slate-300 via-gray-100 to-slate-400',
        glow: 'shadow-[0_0_50px_rgba(203,213,225,0.4)]',
        ring: 'ring-slate-300/50',
        text: 'text-slate-200 drop-shadow-[0_0_8px_rgba(203,213,225,0.8)]',
        bg: 'bg-slate-400/10',
        videoCid: 'bafybeibjbynyeobmv2mzebvge33iy6itamja5uh5piiyio6vhlde2h5exa',
        thumbnailCid: 'bafybeigy5bdxpx3hx2xpy6imxd5rllhbbxl2kqtwwjclv5y2jvjb3ixvbm',
        metadataCid: 'bafkreidd27ujrg3cdyzfdarmhgtx6m22svbsgqmkzbcs45vzar6d4dej6q',
        desc: 'Advanced architectural access.',
    },
    {
        id: 'gold',
        name: 'Gold Genesis',
        threshold: 750,
        discount: 100,
        gradient: 'from-yellow-300 via-amber-200 to-yellow-500',
        glow: 'shadow-[0_0_50px_rgba(253,224,71,0.4)]',
        ring: 'ring-yellow-400/50',
        text: 'text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.8)]',
        bg: 'bg-yellow-400/10',
        videoCid: 'bafybeiasrdbnawa3msbvx5qscgwg4c4bxddiutyf2b72fpgrs6jlkbnszu',
        thumbnailCid: 'bafybeiao5phk6p4w4isxqpaqlctwczioy7tuuw77ko2s5wmwgbrf4ffamq',
        metadataCid: 'bafkreigqsh5cm4aalsnmftbxy5lvbez3dahgwzwwtbvhmeeq2esgk4capy',
        desc: 'Master-level zero-fee privilege.',
    },
];

// ── Utility ───────────────────────────────────────────────────────
type Achievement = (typeof ACHIEVEMENTS)[number];

export default function PassportPage() {
    const { isConnected, userTier, account, network } = useWallet();
    const { t } = useLanguage();
    const [selected, setSelected] = useState<Achievement | null>(null);

    // Genesis Mint State
    const [isMinting, setIsMinting] = useState(false);
    const [mintStatus, setMintStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
    const [hasMinted, setHasMinted] = useState(false);
    const [genesisMintedCount, setGenesisMintedCount] = useState(0);

    // Wagmi for EVM payments
    const { sendTransactionAsync } = useSendTransaction();

    const userCount = userTier?.count ?? 0;
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => { 
        setMounted(true); 
        
        const fetchSupply = async () => {
            try {
                const currentNetwork = network || 'testnet';
                const apiUrl = `https://${currentNetwork}.mirrornode.hedera.com/api/v1/tokens/0.0.8170105`;
                const res = await fetch(apiUrl);
                if (res.ok) {
                    const data = await res.json();
                    setGenesisMintedCount(Number(data.total_supply));
                }
            } catch (err) {
                console.error("Failed to fetch Genesis supply", err);
            }
        };
        fetchSupply();
        // Fallback refresh every 30s
        const checkOwnership = async () => {
            if (!account) {
                setHasMinted(false);
                return;
            }
            try {
                // Use our backend API which queries Hedera consensus nodes via SDK (NOT Mirror Node)
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/genesis/ownership/${account}`, {
                    headers: { 'x-network': network || 'testnet' }
                });
                
                if (res.ok) {
                    const data = await res.json();
                    console.log(`[Genesis] On-chain ownership check:`, data);
                    setHasMinted(!!data.owned);
                } else {
                    console.error(`[Genesis] Ownership API error (${res.status})`);
                    setHasMinted(false);
                }
            } catch (err) {
                console.error("[Genesis] Ownership check failed", err);
                setHasMinted(false);
            }
        };

        fetchSupply();
        checkOwnership();

        const interval = setInterval(() => {
            fetchSupply();
            checkOwnership();
        }, 15000); // Check more frequently (15s) for better UX after minting

        return () => clearInterval(interval);
    }, [account, network]);

    // Simulated Genesis Supply (for hackathon demo)
    const GENESIS_SUPPLY_CAP = 500;
    const MINT_FEE_HBAR = 0; // Free mint

    const handleSuccess = async () => {
        try {
            console.log('[Genesis] Mint fee/tx succeeded. Requesting actual NFT transfer from Backend...');
            
            // Call the backend to execute the physical SDK Mint and Transfer
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/mint-genesis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-network': 'testnet' },
                body: JSON.stringify({ address: account })
            });

            const data = await res.json();
            
            if (!res.ok || !data.success) {
                console.error('[Genesis] Backend Mint Error:', data.error || 'Unknown error');
                setMintStatus('error');
                setIsMinting(false);
                return;
            }

            console.log(`[Genesis] Authentic NFT Minted & Transferred! Serial #${data.serialNumber}`);
            if (data.message) {
                console.warn('[Genesis] Note:', data.message);
            }

            setMintStatus('success');
            setIsMinting(false);
            setHasMinted(true);
            
            setGenesisMintedCount(prev => prev + 1);
            
        } catch (error) {
            console.error('[Genesis] Failed to communicate with mint API:', error);
            setMintStatus('error');
            setIsMinting(false);
        }
    };

    const handleMintGenesis = async () => {
        if (!account || hasMinted) return;
        setIsMinting(true);
        setMintStatus('pending');

        try {
            const feeInWei = parseEther(MINT_FEE_HBAR.toString());
            let evmFailed = !account.startsWith('0x'); // Native accounts skip EVM entirely

            if (!evmFailed) {
                try {
                    // Use the Operator EOA instead of the Smart Contract for 0 value transfers. 
                    // Smart contracts without a receive() function revert 0 value transfers, breaking EVM gas estimation.
                    // 0.0.7986674 -> Hex: 79DD32 -> appended to Hedera EVM zero-address format.
                    const operatorEvm = "0x000000000000000000000000000000000079dd32"; 
                    
                    await sendTransactionAsync({
                        to: operatorEvm as `0x${string}`,
                        value: feeInWei,
                    });
                    
                    
                    await handleSuccess();
                    return;
                } catch (evmErr: any) {
                    const msg = (evmErr?.message || evmErr?.shortMessage || '').toLowerCase();
                    const isUnsupported = msg.includes('does not support') ||
                        msg.includes('not implemented') ||
                        msg.includes('method not found') ||
                        msg.includes('unsupported method') ||
                        msg.includes('not available') ||
                        msg.includes('ecdsa') ||
                        msg.includes('connector not connected');

                    if (msg.includes('rejected') || msg.includes('denied') || msg.includes('cancel')) {
                        throw evmErr;
                    }

                    if (isUnsupported) {
                        console.warn('[Genesis] EVM provider unsupported, falling back to native Hedera transfer...');
                        evmFailed = true;
                    } else {
                        throw evmErr; 
                    }
                }
            }

            // ── Native Hedera Fallback ──
            if (evmFailed) {
                const { signClient: client } = await initHederaWalletConnect();
                if (!client) throw new Error("WalletConnect Client not active.");

                const operatorAccountId = "0.0.7986674"; // Fallback to your testnet operator ID

                let signerAccountId = account;
                if (account.startsWith('0x')) {
                    const sessions = client.session.getAll();
                    const hederaSession = sessions.find((s: any) => s.namespaces.hedera);
                    if (hederaSession?.namespaces?.hedera?.accounts?.[0]) {
                        const parts = hederaSession.namespaces.hedera.accounts[0].split(':');
                        signerAccountId = parts[parts.length - 1]; 
                    } else {
                        throw new Error("Could not resolve Hedera account ID.");
                    }
                }

                // On Hedera, a TransferTransaction must have at least one transfer or an empty payload might fail. 
                // A self transfer of 0 HBAR is a standard way to just "ping" a signature requirement without spending.
                const tx = new TransferTransaction()
                    .setTransactionId(TransactionId.generate(signerAccountId))
                    .setNodeAccountIds([AccountId.fromString("0.0.3")]);
                
                if (MINT_FEE_HBAR > 0) {
                    tx.addHbarTransfer(signerAccountId, new Hbar(-MINT_FEE_HBAR));
                    tx.addHbarTransfer(operatorAccountId, new Hbar(MINT_FEE_HBAR));
                } else {
                    // Send 0 to operator just to have a valid transfer payload
                    tx.addHbarTransfer(signerAccountId, new Hbar(0));
                    tx.addHbarTransfer(operatorAccountId, new Hbar(0));
                }

                tx.freeze();
                const txBytes = Buffer.from(tx.toBytes()).toString('base64');

                const sessions = client.session.getAll();
                const hederaSession = sessions.find((s: any) => s.namespaces.hedera);
                if (!hederaSession) throw new Error("No active Hedera WalletConnect session found.");

                await client.request({
                    topic: hederaSession.topic,
                    chainId: 'hedera:testnet',
                    request: {
                        method: 'hedera_signAndExecuteTransaction',
                        params: {
                            transactionList: txBytes,
                            signerAccountId: `hedera:testnet:${signerAccountId}`
                        }
                    }
                }) as any;

                
                await handleSuccess();
            }

        } catch (error: any) {
            console.error('[Genesis] Mint error:', error);
            setMintStatus('error');
        } finally {
            setIsMinting(false);
            // Revert state back to idle after a few seconds if error to let user retry
            if (mintStatus !== 'success') {
                setTimeout(() => setMintStatus('idle'), 3000);
            }
        }
    };

    // ── Render ────────────────────────────────────────────────────
    return (
        <div className="w-full max-w-7xl mx-auto space-y-8 pb-24 px-4 lg:px-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#0a0f18] border border-white/10 rounded-sm flex items-center justify-center relative overflow-hidden">
                            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                {/* Outer hexagon frame */}
                                <path d="M12 2L20.5 7V17L12 22L3.5 17V7L12 2Z" stroke="rgba(6,182,212,0.8)" strokeWidth="1.2" fill="rgba(6,182,212,0.05)" />
                                {/* Inner diamond */}
                                <path d="M12 6L16.5 9.5V14.5L12 18L7.5 14.5V9.5L12 6Z" stroke="rgba(6,182,212,0.5)" strokeWidth="0.8" fill="none" />
                                {/* Center star burst */}
                                <circle cx="12" cy="12" r="2" fill="rgba(6,182,212,0.6)" />
                                <line x1="12" y1="8" x2="12" y2="10" stroke="rgba(6,182,212,0.4)" strokeWidth="0.6" />
                                <line x1="12" y1="14" x2="12" y2="16" stroke="rgba(6,182,212,0.4)" strokeWidth="0.6" />
                                <line x1="8.5" y1="10" x2="10.2" y2="11" stroke="rgba(6,182,212,0.4)" strokeWidth="0.6" />
                                <line x1="13.8" y1="13" x2="15.5" y2="14" stroke="rgba(6,182,212,0.4)" strokeWidth="0.6" />
                                <line x1="15.5" y1="10" x2="13.8" y2="11" stroke="rgba(6,182,212,0.4)" strokeWidth="0.6" />
                                <line x1="10.2" y1="13" x2="8.5" y2="14" stroke="rgba(6,182,212,0.4)" strokeWidth="0.6" />
                                {/* Corner circuit nodes */}
                                <circle cx="12" cy="2.5" r="0.8" fill="rgba(6,182,212,0.5)" />
                                <circle cx="20" cy="7.2" r="0.6" fill="rgba(6,182,212,0.3)" />
                                <circle cx="20" cy="16.8" r="0.6" fill="rgba(6,182,212,0.3)" />
                            </svg>
                            <div className="absolute inset-0 nft-card-glow rounded-sm pointer-events-none" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-mono font-bold uppercase tracking-[0.25em] text-cyan-400/50">PROOFFLOW // NFT PASSPORT</span>
                            <h1 className="text-2xl md:text-3xl font-bold tracking-wide text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                                {t('passport_title')}
                            </h1>
                        </div>
                    </div>
                    <p className="text-xs text-white/40 max-w-xl font-mono leading-relaxed pl-16">
                        {t('passport_subtitle_extra')}
                    </p>
                </div>

                {/* Audit counter (Relocated) */}
                {isConnected && (
                    <div className="relative overflow-hidden flex items-center gap-4 px-5 py-4 bg-[#0a0f18] border border-white/10 rounded-sm w-fit group animate-pulse" style={{ animationDuration: '3s' }}>
                        {/* Breathing glow border */}
                        <div className="absolute inset-0 rounded-sm border border-cyan-400/20 nft-card-glow pointer-events-none" />
                        {/* Scanning line */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <div className="nft-scanline absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/15 to-transparent" />
                        </div>
                        <History className="w-5 h-5 text-cyan-400/60" />
                        <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-mono font-bold uppercase tracking-[0.25em] text-cyan-400/50 leading-none">{t('passport_total_audits')}</span>
                            <span className="text-2xl font-bold text-white leading-none" style={{ fontFamily: 'Orbitron, sans-serif' }}>{userCount}</span>
                        </div>
                    </div>
                )}
            </div>

            {!isConnected ? (
                <Card className="p-12 border-dashed border-2 flex flex-col items-center justify-center text-center gap-4 bg-surface/30">
                    <ShieldCheck className="w-14 h-14 text-text-muted/20" />
                    <h3 className="font-medium text-text-primary">{t('settings_connect_wallet_profile')}</h3>
                    <p className="text-sm text-text-muted">Connect your wallet to view achievements.</p>
                </Card>
            ) : (
                /* ── Horizontal Scroll Grid ─────────────────────── */
                <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                    <div className="flex gap-4 w-max lg:w-full lg:grid lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:gap-0 lg:items-start">
                        {ACHIEVEMENTS.map((ach, i) => {
                            const isUnlocked = userCount >= ach.threshold;
                            const progress = isUnlocked
                                ? 100
                                : Math.min(100, Math.max(0, (userCount / ach.threshold) * 100));

                            return (
                                <React.Fragment key={ach.id}>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="w-[280px] lg:w-full flex-shrink-0 group"
                                >
                                {/* Border Wrapper for Clip-Path */}
                                <div 
                                    className={cn(
                                        "w-full transition-all duration-500 relative group p-[1px] rounded-sm",
                                        isUnlocked
                                            ? `bg-white/10 hover:bg-white/25`
                                            : "bg-white/[0.04] opacity-70 hover:opacity-100 hover:bg-white/10"
                                    )}
                                    style={{
                                        clipPath: 'polygon(16px 0, calc(100% - 16px) 0, 100% 16px, 100% calc(100% - 16px), calc(100% - 16px) 100%, 16px 100%, 0 calc(100% - 16px), 0 16px)'
                                    }}
                                >
                                    <button
                                        onClick={() => setSelected(ach)}
                                        className="w-full h-full text-left overflow-hidden focus:outline-none bg-[#0a0f18] relative cursor-pointer"
                                        style={{
                                            clipPath: 'polygon(16px 0, calc(100% - 16px) 0, 100% 16px, 100% calc(100% - 16px), calc(100% - 16px) 100%, 16px 100%, 0 calc(100% - 16px), 0 16px)'
                                        }}
                                    >
                                        {/* ── Floating Particles ─── */}
                                        <div className="absolute inset-0 overflow-hidden pointer-events-none z-[5]">
                                            {/* Particle dots — staggered positions & sizes */}
                                            <div className="particle particle-1 w-1 h-1 bg-cyan-400/60" style={{ bottom: '20%', left: '15%' }} />
                                            <div className="particle particle-2 w-1.5 h-1.5 bg-cyan-300/40" style={{ bottom: '10%', left: '70%' }} />
                                            <div className="particle particle-3 w-0.5 h-0.5 bg-white/50" style={{ bottom: '30%', left: '45%' }} />
                                            <div className="particle particle-4 w-1 h-1 bg-cyan-500/50" style={{ bottom: '5%', left: '85%' }} />
                                            <div className="particle particle-5 w-0.5 h-0.5 bg-white/40" style={{ bottom: '25%', left: '30%' }} />
                                            <div className="particle particle-6 w-1 h-1 bg-cyan-400/30" style={{ bottom: '15%', left: '55%' }} />

                                            {/* Scanline sweep */}
                                            <div className="nft-scanline absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
                                        </div>

                                        {/* ── 1:1 Square Thumbnail (LARGE) ─── */}
                                        <div className="aspect-square w-full relative bg-[#060a12] overflow-hidden">
                                            {ach.thumbnailCid ? (
                                                <>
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={`https://ipfs.io/ipfs/${ach.thumbnailCid}`}
                                                        alt={ach.name}
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                    />
                                                    {/* Play overlay on hover */}
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px]">
                                                        <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm">
                                                            <Play className="w-6 h-6 text-white ml-0.5" />
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-[#0a0f18] text-white/20">
                                                    <Clock className="w-12 h-12" />
                                                    <span className="text-[10px] uppercase font-mono tracking-[0.2em]">Coming Soon</span>
                                                </div>
                                            )}

                                            {/* Lock overlay */}
                                            {!isUnlocked && (
                                                <div className="absolute inset-0 bg-[#0a0f18]/85 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                                                    <Lock className="w-8 h-8 text-white/30" />
                                                    <span className="text-xs font-mono text-white/40">{t('passport_unlock_at')}</span>
                                                    <span className="text-2xl font-mono font-bold text-white">{ach.threshold}</span>
                                                    <span className="text-[10px] text-white/30 uppercase tracking-widest font-mono">Audits</span>
                                                </div>
                                            )}

                                            {/* Target badge (top-right) */}
                                            <div className={cn(
                                                "absolute top-3 right-3 px-2.5 py-1 rounded-sm text-[10px] font-mono font-bold uppercase tracking-widest border transition-all duration-500",
                                                isUnlocked
                                                    ? `bg-gradient-to-r ${ach.gradient} text-black border-transparent shadow-[0_0_15px_rgba(255,255,255,0.2)]`
                                                    : "bg-[#0a0f18]/80 text-white/40 border-white/10 backdrop-blur-sm"
                                            )}>
                                                {ach.threshold} AUDITS
                                            </div>
                                        </div>

                                        {/* ── Cyberpunk Card Info ─── */}
                                        <div className="p-4 space-y-2 border-t border-white/[0.04]">
                                            {/* Tier Label */}
                                            <div className={cn(
                                                "text-[9px] font-mono tracking-[0.25em] uppercase font-bold",
                                                isUnlocked ? "text-cyan-400" : "text-cyan-400/30"
                                            )}>
                                                TIER {i + 1} // {ach.id.toUpperCase()}
                                            </div>

                                            {/* Name */}
                                            <h3 className="text-lg font-bold tracking-wide text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                                                {ach.name}
                                            </h3>

                                            {/* Description */}
                                            <p className="text-[11px] text-white/40 leading-relaxed font-mono">
                                                {ach.desc}
                                            </p>

                                            {/* Separator */}
                                            <div className="w-full h-[1px] bg-white/[0.04]" />

                                            {/* Bottom row: discount + progress */}
                                            <div className="flex items-center justify-between pt-1">
                                                <span className={cn(
                                                    "text-[10px] font-bold tracking-widest uppercase font-mono",
                                                    isUnlocked ? ach.text : "text-white/25"
                                                )}>
                                                    -{ach.discount}% {t('passport_discount')}
                                                </span>
                                                <span className="text-[10px] font-mono text-white/30">
                                                    {Math.min(userCount, ach.threshold)} / {ach.threshold}
                                                </span>
                                            </div>

                                            {/* Neon Progress Bar */}
                                            <div className="h-[3px] w-full bg-white/[0.03] overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progress}%` }}
                                                    transition={{ duration: 1.5, ease: "easeOut", delay: i * 0.15 }}
                                                    className={cn(
                                                        "h-full relative",
                                                        isUnlocked
                                                            ? `bg-gradient-to-r ${ach.gradient} shadow-[0_0_10px_rgba(255,255,255,0.4)]`
                                                            : `bg-gradient-to-r ${ach.gradient} opacity-30`
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </button>
                                </div>
                                </motion.div>

                                {/* Connecting Arrows (if not last) */}
                                {i < ACHIEVEMENTS.length - 1 && (
                                    <div className="hidden lg:flex items-center justify-center px-3 self-center">
                                        <div className="flex items-center text-cyan-500/40">
                                            <ChevronRight className="w-4 h-4 -mx-1.5" />
                                            <ChevronRight className="w-4 h-4 -mx-1.5" />
                                            <ChevronRight className="w-4 h-4 -mx-1.5 text-cyan-400/80" />
                                        </div>
                                    </div>
                                )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Genesis Section ─────────────────────────── */}
            <div className="pt-12 space-y-6">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#0a0f18] border border-white/10 rounded-sm flex items-center justify-center relative overflow-hidden">
                            {/* Custom Minimalist Genesis SVG (Data Core / Pyramid shape) */}
                            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L2 20H22L12 2Z" stroke="rgba(96, 165, 250, 0.8)" strokeWidth="1.2" fill="rgba(96, 165, 250, 0.05)" />
                                <path d="M12 2L12 20" stroke="rgba(96, 165, 250, 0.4)" strokeWidth="1" />
                                <path d="M7 11L17 11" stroke="rgba(96, 165, 250, 0.4)" strokeWidth="1" />
                                <circle cx="12" cy="11" r="2" fill="rgba(96, 165, 250, 0.8)" />
                                <circle cx="12" cy="2" r="1.5" fill="rgba(96, 165, 250, 0.8)" />
                                <circle cx="2" cy="20" r="1.5" fill="rgba(96, 165, 250, 0.6)" />
                                <circle cx="22" cy="20" r="1.5" fill="rgba(96, 165, 250, 0.6)" />
                            </svg>
                            <div className="absolute inset-0 nft-card-glow rounded-sm pointer-events-none" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-mono font-bold uppercase tracking-[0.25em] text-blue-400/50">PROOFFLOW // SPECIAL COLLECTION</span>
                            <h2 className="text-xl md:text-2xl font-bold tracking-wide text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                                {t('passport_genesis_title')}
                            </h2>
                        </div>
                    </div>
                    <p className="text-xs text-white/40 max-w-xl font-mono leading-relaxed pl-16">
                        {t('passport_genesis_description')}
                    </p>
                </div>

                {/* Genesis NFT Card */}
                <div className="w-full max-w-sm relative group p-[1px] rounded-sm bg-white/10 hover:bg-white/25 transition-all duration-500"
                    style={{
                        clipPath: 'polygon(16px 0, calc(100% - 16px) 0, 100% 16px, 100% calc(100% - 16px), calc(100% - 16px) 100%, 16px 100%, 0 calc(100% - 16px), 0 16px)'
                    }}
                >
                    <div className="w-full h-full text-left overflow-hidden bg-[#0a0f18] relative"
                        style={{
                            clipPath: 'polygon(16px 0, calc(100% - 16px) 0, 100% 16px, 100% calc(100% - 16px), calc(100% - 16px) 100%, 16px 100%, 0 calc(100% - 16px), 0 16px)'
                        }}
                    >
                        {/* ── Floating Particles ─── */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none z-[5]">
                            {/* Particle dots — staggered positions & sizes */}
                            <div className="particle particle-1 w-1 h-1 bg-blue-400/60" style={{ bottom: '20%', left: '15%' }} />
                            <div className="particle particle-2 w-1.5 h-1.5 bg-blue-300/40" style={{ bottom: '10%', left: '70%' }} />
                            <div className="particle particle-3 w-0.5 h-0.5 bg-white/50" style={{ bottom: '30%', left: '45%' }} />
                            <div className="particle particle-4 w-1 h-1 bg-blue-500/50" style={{ bottom: '5%', left: '85%' }} />
                            <div className="particle particle-5 w-0.5 h-0.5 bg-white/40" style={{ bottom: '25%', left: '30%' }} />
                            <div className="particle particle-6 w-1 h-1 bg-blue-400/30" style={{ bottom: '15%', left: '55%' }} />

                            {/* Scanline sweep */}
                            <div className="nft-scanline absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-400/20 to-transparent" />
                        </div>

                        {/* ── 1:1 Square Thumbnail (LARGE) ─── */}
                        <div className="aspect-square w-full relative bg-[#060a12] overflow-hidden">
                            <video
                                src="https://ipfs.io/ipfs/bafybeidbcccvwwgcwphweysyiwaypa3n2g56y63aih6mcrfnczf3jnjzzu"
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
                            />
                            
                            {/* Target badge (top-right) */}
                            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-sm text-[10px] font-mono font-bold uppercase tracking-widest bg-blue-400/10 text-blue-400 border border-blue-400/30 backdrop-blur-md">
                                EARLY ADOPTER
                            </div>
                        </div>

                        {/* Card Info */}
                        <div className="p-5 border-t border-white/[0.04] flex flex-col gap-4">
                            <div>
                                <div className="text-[9px] font-mono tracking-[0.25em] text-blue-400 uppercase font-bold mb-1">
                                    EXCLUSIVE // COMMEMORATIVE
                                </div>
                                <h3 className="text-xl font-bold tracking-wide text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                                    GENESIS EDITION
                                </h3>
                            </div>

                            <Button
                                onClick={handleMintGenesis}
                                disabled={!isConnected || mintStatus === 'pending' || mintStatus === 'success' || hasMinted}
                                className={cn(
                                    "w-full h-11 font-mono font-bold uppercase tracking-wider rounded-sm transition-all",
                                    hasMinted || mintStatus === 'success'
                                        ? "bg-white/5 text-white/40 border border-white/10 cursor-not-allowed"
                                        : "bg-blue-500 hover:bg-blue-600 text-white border-transparent"
                                )}
                            >
                                {mintStatus === 'pending' ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                        PROCESSING...
                                    </div>
                                ) : (hasMinted || mintStatus === 'success') ? (
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" />
                                        CLAIMED
                                    </div>
                                ) : (
                                    "MINT GENESIS"
                                )}
                            </Button>
                            
                            <p className="text-[9px] text-center text-white/30 uppercase tracking-widest font-mono">
                                Limited supply · 1 per wallet
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Detail / Video Modal (Portal) ──────────────── */}
            {mounted && createPortal(
                <AnimatePresence>
                    {selected && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-md p-4"
                            style={{ background: 'radial-gradient(ellipse at center, rgba(17,17,24,0.97) 0%, rgba(8,8,12,0.99) 100%)' }}
                            onClick={() => setSelected(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.92, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.92, opacity: 0, y: 20 }}
                                transition={{ type: 'spring', damping: 25 }}
                                className="relative w-full max-w-md bg-surface/80 backdrop-blur-2xl rounded-2xl overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)] border border-white/10"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Close */}
                                <button
                                    onClick={() => setSelected(null)}
                                    className="absolute top-3 right-3 p-2 text-white/40 hover:text-white bg-black/30 hover:bg-black/60 rounded-full z-10 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                {/* Video / Thumbnail area (1:1) */}
                                <div className="aspect-square w-full bg-black relative overflow-hidden">
                                    {selected.videoCid ? (
                                        <video
                                            src={`https://ipfs.io/ipfs/${selected.videoCid}`}
                                            autoPlay
                                            loop
                                            muted
                                            playsInline
                                            className="w-full h-full object-cover"
                                        />
                                    ) : selected.thumbnailCid ? (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img
                                            src={`https://ipfs.io/ipfs/${selected.thumbnailCid}`}
                                            alt={selected.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-text-muted/30">
                                            <Clock className="w-16 h-16" />
                                            <span className="text-sm font-mono">Metadata Pending</span>
                                        </div>
                                    )}
                                </div>

                                {/* Info + Mint Section */}
                                <div className="p-5 space-y-4 bg-surface-elevated border-t border-border/50">
                                    {/* Title Row */}
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className={cn("text-xl font-bold", selected.text)}>{selected.name}</h3>
                                            <p className="text-xs text-text-muted mt-1">{selected.desc}</p>
                                        </div>
                                        <div className={cn(
                                            "px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg",
                                            `bg-gradient-to-r ${selected.gradient} text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]`
                                        )}>
                                            -{selected.discount}%
                                        </div>
                                    </div>

                                    {/* Progress */}
                                    {(() => {
                                        const isUnlocked = userCount >= selected.threshold;
                                        const prog = isUnlocked
                                            ? 100
                                            : Math.min(100, Math.max(0, (userCount / selected.threshold) * 100));

                                        return (
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-xs font-mono">
                                                    <span className="text-text-muted">{t('passport_times_used')} <span className="text-white font-bold">{Math.min(userCount, selected.threshold)}</span> / {selected.threshold}</span>
                                                    <span className={isUnlocked ? "text-emerald-400 font-bold" : "text-text-muted"}>
                                                        {isUnlocked ? '✓ UNLOCKED' : `${Math.max(0, selected.threshold - userCount)} remaining`}
                                                    </span>
                                                </div>
                                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${prog}%` }}
                                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                                        className={cn(
                                                            "h-full rounded-full relative",
                                                            isUnlocked 
                                                                ? `bg-gradient-to-r ${selected.gradient} shadow-[0_0_15px_rgba(255,255,255,0.5)]` 
                                                                : `bg-gradient-to-r ${selected.gradient} opacity-40`
                                                        )}
                                                    >
                                                        {isUnlocked && (
                                                            <div className="absolute inset-0 bg-white/20 blur-[2px] animate-pulse" />
                                                        )}
                                                    </motion.div>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Mint Button */}
                                    {(() => {
                                        const isUnlocked = userCount >= selected.threshold;
                                        const tierLevels = ['free', 'bronze', 'silver', 'gold'];
                                        const userTierLevel = tierLevels.indexOf(userTier?.id || 'free');
                                        const selectedTierLevel = tierLevels.indexOf(selected.id);
                                        const isClaimed = selectedTierLevel > 0 && userTierLevel >= selectedTierLevel;

                                        return (
                                            <Button
                                                disabled={!isUnlocked || isClaimed}
                                                className={cn(
                                                    "w-full h-12 text-sm font-bold rounded-xl gap-2 transition-all",
                                                    isClaimed
                                                        ? "bg-white/5 text-emerald-400/70 border border-emerald-500/20 cursor-not-allowed"
                                                        : isUnlocked
                                                            ? `bg-gradient-to-r ${selected.gradient} text-black hover:opacity-90 hover:scale-[1.01]`
                                                            : "bg-white/5 text-white/30 border border-white/10 cursor-not-allowed"
                                                )}
                                            >
                                                {isClaimed ? (
                                                    <>
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                        Claimed On-Chain
                                                    </>
                                                ) : isUnlocked ? (
                                                    <>
                                                        <Sparkles className="w-4 h-4" />
                                                        {t('passport_mint_video')}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Lock className="w-4 h-4" />
                                                        LOCKED — {selected.threshold - userCount} audits to go
                                                    </>
                                                )}
                                            </Button>
                                        );
                                    })()}

                                    {/* IPFS link */}
                                    {selected.videoCid && (
                                        <a
                                            href={`https://ipfs.io/ipfs/${selected.videoCid}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 text-xs text-text-muted/50 hover:text-text-muted transition-colors"
                                        >
                                            <ExternalLink className="w-3 h-3" />
                                            View raw on IPFS
                                        </a>
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
