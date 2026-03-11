'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Activity, Lock, Play, X, ExternalLink, Award, Clock, Sparkles, Zap, History, CheckCircle2 } from 'lucide-react';
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
        gradient: 'from-amber-700 via-amber-500 to-yellow-600',
        glow: 'shadow-[0_0_40px_-10px_rgba(217,119,6,0.5)]',
        ring: 'ring-amber-500/40',
        text: 'text-amber-500',
        bg: 'bg-amber-500',
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
        gradient: 'from-slate-500 via-slate-300 to-slate-400',
        glow: 'shadow-[0_0_40px_-10px_rgba(148,163,184,0.5)]',
        ring: 'ring-slate-400/40',
        text: 'text-slate-300',
        bg: 'bg-slate-400',
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
        gradient: 'from-yellow-600 via-yellow-400 to-amber-300',
        glow: 'shadow-[0_0_40px_-10px_rgba(234,179,8,0.5)]',
        ring: 'ring-yellow-500/40',
        text: 'text-yellow-400',
        bg: 'bg-yellow-500',
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
        const interval = setInterval(fetchSupply, 30000);
        
        if (account) {
            const userClaimed = localStorage.getItem(`genesis_minted_${account}`);
            if (userClaimed === 'true') setHasMinted(true);
            else setHasMinted(false);
        } else {
            setHasMinted(false);
        }

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
            if (account) localStorage.setItem(`genesis_minted_${account}`, 'true');
            
            setGenesisMintedCount(prev => {
                const newCount = prev + 1;
                localStorage.setItem('genesis_global_minted', newCount.toString());
                return newCount;
            });
            
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
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-surface-elevated border border-border">
                            <Award className="w-6 h-6 text-accent-primary" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary">
                            {t('passport_title')}
                        </h1>
                    </div>
                    <p className="text-sm text-text-muted max-w-xl">
                        {t('passport_subtitle_extra')}
                    </p>
                </div>

                {/* Audit counter (Relocated) */}
                {isConnected && (
                    <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-surface-elevated/30 border border-border/40 w-fit backdrop-blur-sm shadow-sm">
                        <History className="w-4 h-4 text-accent-primary/70" />
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted/60 leading-none mb-1">{t('passport_total_audits')}</span>
                            <span className="text-lg font-mono font-bold text-white leading-none">{userCount}</span>
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
                    <div className="flex gap-6 w-max lg:w-full lg:grid lg:grid-cols-3">
                        {ACHIEVEMENTS.map((ach, i) => {
                            const isUnlocked = userCount >= ach.threshold;
                            const prevThreshold = i === 0 ? 0 : ACHIEVEMENTS[i - 1].threshold;
                            const isNext = !isUnlocked && userCount >= prevThreshold;
                            const progress = isUnlocked
                                ? 100
                                : isNext
                                    ? Math.min(100, ((userCount - prevThreshold) / (ach.threshold - prevThreshold)) * 100)
                                    : 0;

                            return (
                                <motion.div
                                    key={ach.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="w-[280px] lg:w-auto flex-shrink-0"
                                >
                                    <button
                                        onClick={() => setSelected(ach)}
                                        className={cn(
                                            "w-full text-left rounded-2xl overflow-hidden border transition-all duration-500 group focus:outline-none",
                                            isUnlocked
                                                ? `border-white/10 ${ach.glow} hover:scale-[1.02]`
                                                : "border-border/50 opacity-70 hover:opacity-90 hover:border-border"
                                        )}
                                    >
                                        {/* ── 1:1 Square Thumbnail ─── */}
                                        <div className="aspect-square w-full relative bg-background overflow-hidden">
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
                                                <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-surface text-text-muted/30">
                                                    <Clock className="w-12 h-12" />
                                                    <span className="text-[10px] uppercase font-mono tracking-[0.2em]">Coming Soon</span>
                                                </div>
                                            )}

                                            {/* Lock overlay */}
                                            {!isUnlocked && (
                                                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                                                    <Lock className="w-8 h-8 text-text-muted/60" />
                                                    <span className="text-xs font-medium text-text-muted">{t('passport_unlock_at')}</span>
                                                    <span className="text-2xl font-mono font-bold text-white">{ach.threshold}</span>
                                                    <span className="text-[10px] text-text-muted/60 uppercase tracking-widest">Audits</span>
                                                </div>
                                            )}

                                            {/* Discount badge */}
                                            <div className={cn(
                                                "absolute top-3 right-3 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest backdrop-blur-md transition-all duration-300 border",
                                                isUnlocked
                                                    ? `bg-gradient-to-r ${ach.gradient} text-black border-transparent shadow-[0_4px_12px_-2px_rgba(0,0,0,0.4)] scale-110`
                                                    : `bg-black/40 ${ach.text} border-white/10 opacity-90`
                                            )}>
                                                -{ach.discount}% {t('passport_discount')}
                                            </div>
                                        </div>

                                        {/* ── Card Info ─── */}
                                        <div className="p-4 bg-surface border-t border-border/50 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h3 className={cn("text-base font-bold tracking-tight", ach.text)}>
                                                    {ach.name}
                                                </h3>
                                                <div className="flex items-center gap-1.5 text-xs font-mono text-text-muted">
                                                    <span className="text-white font-bold">{Math.min(userCount, ach.threshold)}</span>
                                                    <span>/</span>
                                                    <span>{ach.threshold}</span>
                                                </div>
                                            </div>
                                            <p className="text-[11px] text-text-muted/60 leading-relaxed">{ach.desc}</p>

                                            {/* Progress bar */}
                                            <div className="h-1 w-full bg-background rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progress}%` }}
                                                    transition={{ duration: 1, delay: i * 0.15 }}
                                                    className={cn(
                                                        "h-full rounded-full",
                                                        isUnlocked ? `bg-gradient-to-r ${ach.gradient}` : "bg-accent-primary/60"
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </button>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Genesis Section ─────────────────────────── */}
            <div className="pt-8 space-y-6">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-surface-elevated border border-border">
                            <Zap className="w-6 h-6 text-yellow-400" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-text-primary">
                            {t('passport_genesis_title')}
                        </h2>
                    </div>
                    <p className="text-sm text-text-muted max-w-xl">
                        {t('passport_genesis_description')}
                    </p>
                </div>

                {/* Genesis NFT Card */}
                <div className="w-full max-w-sm">
                    <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-2xl relative group">
                        {/* Status overlays */}
                        <AnimatePresence>
                            {mintStatus === 'pending' && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                                    <div className="w-10 h-10 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
                                    <span className="text-sm font-medium text-text-primary animate-pulse">Waiting for signature...</span>
                                </motion.div>
                            )}
                            {mintStatus === 'success' && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-20 bg-emerald-950/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center">
                                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                                    </div>
                                    <span className="text-emerald-400 font-bold tracking-tight">Mint Initiated</span>
                                    <span className="text-xs text-emerald-200/60 max-w-[200px] text-center">Your ProofFlow Agent will airdrop the NFT shortly.</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Video Area */}
                        <div className="aspect-square w-full relative bg-black overflow-hidden">
                            <video
                                src="https://ipfs.io/ipfs/bafybeidbcccvwwgcwphweysyiwaypa3n2g56y63aih6mcrfnczf3jnjzzu"
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                                poster="https://ipfs.io/ipfs/bafybeih2pltdpd7qwzlrzdcdhuj6fe4mdvej52m6hvtwdeuzdyzpawktba"
                            />
                            {/* Metadata link */}
                            <a
                                href="https://ipfs.io/ipfs/bafkreiahvascdldplfsgzqptqphjtsga7djrc7czdy7atu6jx5vpv22nru"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 flex items-center gap-1.5 text-[10px] text-white/70 hover:text-white transition-colors z-10"
                            >
                                <ExternalLink className="w-3 h-3" />
                                HIP-412 Metadata
                            </a>
                        </div>
                        
                        {/* Content Area */}
                        <div className="p-5 space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-electric-blue">ProofFlow Genesis</h3>
                                    <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                                        The elite artifact reserved for pioneers. Electric blue liquid light encased in obsidian.
                                    </p>
                                </div>
                            </div>

                            {/* Progress bar (FCFS) */}
                            <div className="space-y-2 pt-2 border-t border-border/50">
                                <div className="flex justify-between items-center text-xs font-mono">
                                    <span className="text-text-muted">Minted Supply</span>
                                    <span className="text-cyan-400 font-bold">{genesisMintedCount} / {GENESIS_SUPPLY_CAP}</span>
                                </div>
                                <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(genesisMintedCount / GENESIS_SUPPLY_CAP) * 100}%` }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                                    />
                                </div>
                                <div className="text-[10px] text-text-muted/60 text-right uppercase tracking-widest">First Come, First Serve</div>
                            </div>

                            {/* Mint Action */}
                            <Button 
                                onClick={handleMintGenesis}
                                disabled={isMinting || mintStatus !== 'idle' || hasMinted}
                                className={cn(
                                    "w-full h-12 text-sm font-bold rounded-xl gap-2 border-none transition-all",
                                    hasMinted 
                                        ? "bg-white/5 text-white/50 cursor-not-allowed" 
                                        : "bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:opacity-90 hover:scale-[1.01] shadow-[0_0_20px_-5px_rgba(6,182,212,0.4)]"
                                )}
                            >
                                {hasMinted ? (
                                    <>
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        Claimed
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        Mint Genesis • {MINT_FEE_HBAR > 0 ? `${MINT_FEE_HBAR} HBAR` : 'Free'}
                                    </>
                                )}
                            </Button>
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
                                className="relative w-full max-w-md bg-surface rounded-2xl overflow-hidden shadow-2xl border border-border"
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
                                            "px-2.5 py-1 rounded-lg text-xs font-bold",
                                            `bg-gradient-to-r ${selected.gradient} text-black`
                                        )}>
                                            -{selected.discount}%
                                        </div>
                                    </div>

                                    {/* Progress */}
                                    {(() => {
                                        const isUnlocked = userCount >= selected.threshold;
                                        const idx = ACHIEVEMENTS.findIndex(a => a.id === selected.id);
                                        const prev = idx === 0 ? 0 : ACHIEVEMENTS[idx - 1].threshold;
                                        const prog = isUnlocked
                                            ? 100
                                            : Math.min(100, Math.max(0, ((userCount - prev) / (selected.threshold - prev)) * 100));

                                        return (
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-xs font-mono">
                                                    <span className="text-text-muted">{t('passport_times_used')} <span className="text-white font-bold">{Math.min(userCount, selected.threshold)}</span> / {selected.threshold}</span>
                                                    <span className={isUnlocked ? "text-emerald-400 font-bold" : "text-text-muted"}>
                                                        {isUnlocked ? '✓ UNLOCKED' : `${Math.max(0, selected.threshold - userCount)} remaining`}
                                                    </span>
                                                </div>
                                                <div className="h-2 w-full bg-background rounded-full overflow-hidden border border-white/5">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${prog}%` }}
                                                        transition={{ duration: 0.8 }}
                                                        className={cn(
                                                            "h-full rounded-full",
                                                            isUnlocked ? `bg-gradient-to-r ${selected.gradient}` : "bg-accent-primary"
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Mint Button */}
                                    {(() => {
                                        const isUnlocked = userCount >= selected.threshold;
                                        return (
                                            <Button
                                                disabled={!isUnlocked}
                                                className={cn(
                                                    "w-full h-12 text-sm font-bold rounded-xl gap-2 transition-all",
                                                    isUnlocked
                                                        ? `bg-gradient-to-r ${selected.gradient} text-black hover:opacity-90 hover:scale-[1.01]`
                                                        : "bg-white/5 text-white/30 border border-white/10 cursor-not-allowed"
                                                )}
                                            >
                                                {isUnlocked ? (
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
