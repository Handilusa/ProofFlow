'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, FileUp, Hash, ExternalLink, ShieldCheck, CheckCircle2, Lock, Loader2, Activity } from 'lucide-react';
import { Card, Button, Skeleton } from '@/components/ui';
import Badge from '@/components/ui/Badge';
import { submitQuestion, getRecentProofs, getConfig, getProofTxData, ReasoningResult, ReasoningStep, StoredProof, ProofFlowConfig } from '@/lib/api';
import { useWallet } from '@/lib/wallet-context';
import { useSendTransaction } from 'wagmi';
import { parseEther } from 'viem';
import Link from 'next/link';
import VerificationBadge from '@/components/proofflow/VerificationBadge';
import AuditPassport from '@/components/proofflow/AuditPassport';
import LiveNetworkCounter from '@/components/proofflow/LiveNetworkCounter';
import { useLanguage } from '@/lib/language-context';
import { API_URL, formatTimeAgoI18n } from '@/lib/utils';
import { TransferTransaction, Hbar, TransactionId, AccountId } from "@hashgraph/sdk";
import { getSignClient } from "@/lib/hedera-walletconnect";
const ALL_VECTORS = [
  "Given current BTC volatility, model the short-term correlation and beta of HBAR. Is a decoupling imminent?",
  "Evaluate Hedera's Fully Diluted Valuation (FDV) against its real-world enterprise adoption metrics.",
  "Cross-reference HBAR's 24h trading volume with recent mainnet transaction TPS. Are we seeing artificial volume or utility-driven demand?",
  "Analyze the macroeconomic impact of upcoming US interest rate decisions on Hedera's enterprise DeFi ecosystem.",
  "Construct a risk-adjusted thesis on why a layer 1 with fixed USD fees (Hedera) outperforms dynamic fee models during bull markets.",
  "Fetch exact market caps of SOL and HBAR. Based on Hedera's asynchronous byzantine fault tolerance (aBFT), calculate its fair relative value.",
  "If the total crypto market cap drops by 15% next week, project the specific downside support levels for HBAR using current circulating supply data.",
  "Synthesize the impact of the Hedera Governing Council's recent additions on institutional trust vs. retail token metrics.",
  "Examine the velocity of HBAR in circulation. Does current network utility justify its current price-to-earnings equivalent?",
  "Contrast the security trade-offs of Hedera's hashgraph consensus mechanism against traditional PoS chains for institutional DeFi.",
  "Analyze SaucerSwap's liquidity depth against current HBAR volatility. What is the slippage risk for a 10M HBAR swap?",
  "Develop a bullish and bearish scenario for Hedera based strictly on its current inflation schedule and tokenomics.",
  "Evaluate the probability of HBAR capturing 5% of the tokenized real-world assets (RWA) market, citing specific architectural advantages.",
  "Compare Hedera Consensus Service (HCS) throughput capabilities with Solana's latest update. Which is more suited for high-frequency algorithmic trading?",
  "If enterprise utility burns X amount of HBAR daily, mathematically project the timeline for Hedera to become a deflationary network at current prices.",
  "Analyze the sentiment and on-chain velocity of HBAR during the last 3 major BTC drawdowns.",
  "Assess the systemic risk of Hedera's permissioned nodes transitioning to permissionless community nodes on token price stability.",
  "Calculate the opportunity cost of staking HBAR natively vs providing liquidity in Hedera-native DeFi protocols given current market conditions.",
  "Fetch the real-time price of HBAR. Based solely on the last 24h data, formulate a swing-trading strategy for the next 72 hours.",
  "Critically analyze the narrative that corporate governance on Hedera stifles decentralized retail growth. Provide data-driven counter-arguments."
];

const ALL_VECTORS_ES = [
  "Con la volatilidad actual de BTC, ¿cómo se correlaciona HBAR a corto plazo? ¿Estamos cerca de un desacoplamiento?",
  "Analiza la FDV de Hedera frente a su adopción real por empresas. ¿El mercado la está valorando bien?",
  "Cruza el volumen de trading de HBAR en 24h con las TPS reales de la mainnet. ¿Es volumen orgánico o inflado?",
  "¿Cómo afectarían las próximas decisiones de tipos de interés en EEUU al ecosistema DeFi de Hedera?",
  "Explica por qué una L1 con comisiones fijas en USD (Hedera) puede rendir mejor que modelos de fees dinámicas en mercados alcistas.",
  "Compara los market caps de SOL y HBAR. Teniendo en cuenta el consenso aBFT de Hedera, ¿cuál sería su valor justo relativo?",
  "Si el market cap total de crypto cae un 15% la próxima semana, ¿dónde estarían los soportes clave de HBAR?",
  "¿Qué impacto tienen las últimas incorporaciones al Governing Council de Hedera en la confianza institucional vs. métricas retail?",
  "Analiza la velocidad de circulación de HBAR. ¿El uso real de la red justifica su precio actual?",
  "Compara los trade-offs de seguridad del hashgraph de Hedera contra cadenas PoS tradicionales para DeFi institucional.",
  "¿Qué profundidad de liquidez tiene SaucerSwap frente a la volatilidad actual de HBAR? ¿Cuánto slippage habría con un swap de 10M HBAR?",
  "Plantea un escenario alcista y otro bajista para Hedera basándote solo en su calendario de inflación y tokenomics actual.",
  "¿Qué probabilidades tiene HBAR de capturar un 5% del mercado de activos tokenizados del mundo real (RWA)?",
  "Compara el rendimiento de HCS con la última actualización de Solana. ¿Cuál encaja mejor para trading algorítmico de alta frecuencia?",
  "Si las empresas queman X cantidad de HBAR al día, ¿cuándo podría Hedera volverse una red deflacionaria a precios actuales?",
  "Analiza el sentimiento y la actividad on-chain de HBAR durante las últimas 3 caídas fuertes de Bitcoin.",
  "¿Qué riesgo sistémico tiene la transición de nodos permisionados a nodos comunitarios abiertos en Hedera?",
  "Calcula el coste de oportunidad de hacer staking nativo de HBAR vs. aportar liquidez en protocolos DeFi de Hedera.",
  "Trae el precio actual de HBAR y con los datos de las últimas 24h móntame una estrategia de swing trading para las próximas 72 horas.",
  "Desmonta (o confirma) con datos la narrativa de que la gobernanza corporativa de Hedera frena el crecimiento retail descentralizado."
];

export default function DualPaneDashboard() {
  const { account, connect } = useWallet();
  const { t, language } = useLanguage();
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ReasoningResult | null>(null);
  const [recentAudits, setRecentAudits] = useState<StoredProof[]>([]);
  const [globalFeed, setGlobalFeed] = useState<StoredProof[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [randomVectors, setRandomVectors] = useState<string[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'confirming' | 'done' | 'cancelled'>('idle');
  const [pfConfig, setPfConfig] = useState<ProofFlowConfig | null>(null);

  // Wagmi hooks — Native HBAR transfer to bypass WalletConnect contract simulation bugs
  const { sendTransactionAsync, isPending: isSubmittingToContract } = useSendTransaction();

  // Minimal ABI for the ProofValidator contract (only what the frontend needs)
  const PROOF_VALIDATOR_ABI = [
    {
      "inputs": [{ "internalType": "string", "name": "prompt", "type": "string" }],
      "name": "requestAudit",
      "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "anonymous": false,
      "inputs": [
        { "indexed": true, "internalType": "uint256", "name": "requestId", "type": "uint256" },
        { "indexed": true, "internalType": "address", "name": "requester", "type": "address" },
        { "indexed": false, "internalType": "string", "name": "prompt", "type": "string" },
        { "indexed": false, "internalType": "uint256", "name": "deposit", "type": "uint256" }
      ],
      "name": "AuditRequested",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        { "indexed": true, "internalType": "uint256", "name": "requestId", "type": "uint256" },
        { "indexed": true, "internalType": "address", "name": "requester", "type": "address" },
        { "indexed": false, "internalType": "bytes32", "name": "resultHash", "type": "bytes32" },
        { "indexed": false, "internalType": "uint256", "name": "payout", "type": "uint256" }
      ],
      "name": "AuditCompleted",
      "type": "event"
    }
  ] as const;

  // Fetch platform config on mount
  useEffect(() => {
    getConfig().then(setPfConfig).catch(() => { });
  }, []);

  // Pick 3 random vectors on mount or language change
  useEffect(() => {
    const vectors = language === 'es' ? ALL_VECTORS_ES : ALL_VECTORS;
    const shuffled = [...vectors].sort(() => 0.5 - Math.random());
    setRandomVectors(shuffled.slice(0, 3));
  }, [language]);

  // Fetch recent audits (including simulation data) on mount or account change
  useEffect(() => {
    let isMounted = true;
    const fetchRecent = async () => {
      try {
        // Step 1: Try fetching personal audits
        let proofs = await getRecentProofs(account || undefined);

        // Step 2: If personal is empty and we have an account, fallback to global
        if (proofs.length === 0 && account) {
          proofs = await getRecentProofs();
        }

        if (isMounted) {
          setRecentAudits(proofs.slice(0, 5)); // show top 5
        }
      } catch (e) {
        console.error("Failed to load recent audits", e);
      }
    };

    fetchRecent();
    const interval = setInterval(fetchRecent, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [account]);

  // Global feed — always fetch from all wallets, limit 3, for the visible feed section
  useEffect(() => {
    let isMounted = true;
    const fetchGlobal = async () => {
      try {
        const proofs = await getRecentProofs();
        if (isMounted) setGlobalFeed(proofs.slice(0, 3));
      } catch (e) {
        console.error("Failed to load global feed", e);
      }
    };

    fetchGlobal();
    const interval = setInterval(fetchGlobal, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Polling logic for active session
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    let pollTimeout: NodeJS.Timeout;

    // Keep polling until status is VERIFIED (full pipeline: HCS + HTS + EVM)
    if (result && result.status !== "VERIFIED") {
      const pollProof = async () => {
        try {
          const latestData = await fetch(`${API_URL}/proof/${result.proofId}`);
          if (latestData.ok) {
            const updatedProof = await latestData.json();
            setResult(updatedProof);

            // Stop polling only when fully verified (HCS + HTS + EVM all done)
            if (updatedProof.status === "VERIFIED") {
              clearInterval(pollInterval);
              clearTimeout(pollTimeout);
              setIsPolling(false);
            }
          }
        } catch (e) {
          console.error("Polling error", e);
        }
      };

      setIsPolling(true);
      pollInterval = setInterval(pollProof, 2000);

      // Safety timeout: stop polling after 120s to prevent infinite loops
      pollTimeout = setTimeout(() => {
        clearInterval(pollInterval);
        setIsPolling(false);
        console.log("[Polling] Timed out after 120s — stopping.");
      }, 120000);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (pollTimeout) clearTimeout(pollTimeout);
    };
  }, [result?.proofId, result?.status]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!question.trim()) return;

    setIsLoading(true);
    setResult(null);
    setPaymentStatus('idle');

    try {
      // NEW AUTONOMOUS FLOW: Call Smart Contract requestAudit() if available
      if (pfConfig?.contractReady && pfConfig?.contractAddress && account) {
        setPaymentStatus('pending');
        let paymentTxHash: string | undefined;
        try {
          const feeInWei = parseEther(pfConfig.serviceFeeHbar);

          if (account?.startsWith('0x')) {
            // MetaMask / OKX / injected EVM: Send native HBAR transfer
            // We use standard EVM transfer to bypass the `eth_estimateGas` 'null fee' 
            // WalletConnect parsing bug on Hedera Testnet RPC.
            // EVM Smart Contract logging is deferred to the Backend Agent.
            paymentTxHash = await sendTransactionAsync({
              to: pfConfig.operatorEvmAddress as `0x${string}`,
              value: feeInWei,
            });
            console.log('[Payment] Native EVM transfer sent for audit request:', paymentTxHash);
            setPaymentStatus('confirming');

            // Wait for mirror node indexing before submitting to backend
            await new Promise(r => setTimeout(r, 3000));
            setPaymentStatus('done');
          } else {
            // Hashpack / Native Hedera via WalletConnect
            // Hashpack WC bridge currently drops `payableAmount` on ContractExecutions.
            // Workaround: Send standard HBAR transfer to Operator, then Operator automatically
            // proxies the `requestAudit` execution on the Smart Contract.
            const client = getSignClient();
            if (!client || !account) throw new Error("WalletConnect Client not active. Please reconnect.");

            const hbarFee = parseFloat(pfConfig.serviceFeeHbar);

            if (!pfConfig.operatorAccountId) {
              console.error("[Payment] Config missing operatorAccountId. Ensure backend is running and config endpoint is not cached.", pfConfig);
              throw new Error("Missing operator account ID configuration. Please refresh the page.");
            }

            const tx = new TransferTransaction()
              .addHbarTransfer(account, new Hbar(-hbarFee))
              .addHbarTransfer(pfConfig.operatorAccountId, new Hbar(hbarFee))
              .setTransactionId(TransactionId.generate(account))
              .setNodeAccountIds([AccountId.fromString("0.0.3")]);

            tx.freeze();
            const txBytes = Buffer.from(tx.toBytes()).toString('base64');

            const sessions = client.session.getAll();
            const hederaSession = sessions.find(s => s.namespaces.hedera);
            if (!hederaSession) throw new Error("No active Hedera WalletConnect session found.");

            console.log('[Payment] Triggering native Hedera transfer request (Hashpack compatibility)...');
            const response = await client.request({
              topic: hederaSession.topic,
              chainId: 'hedera:testnet',
              request: {
                method: 'hedera_signAndExecuteTransaction',
                params: {
                  transactionList: txBytes,
                  signerAccountId: `hedera:testnet:${account}`
                }
              }
            }) as any;

            paymentTxHash = response?.transactionId || response?.response?.transactionId;
            console.log('[Payment] Micropayment sent natively:', paymentTxHash);

            setPaymentStatus('confirming');
            // Brief wait for mirror node indexing
            await new Promise(r => setTimeout(r, 2000));
            setPaymentStatus('done');
          }
        } catch (payErr: any) {
          console.error('[Autonomous] Contract or Transfer call failed:', payErr);
          if (payErr?.message?.includes('User rejected') || payErr?.message?.includes('denied') || payErr?.message?.includes('Cancel')) {
            setPaymentStatus('cancelled');
            setTimeout(() => {
              setPaymentStatus('idle');
              setIsLoading(false);
            }, 2000);
            return;
          }
          setPaymentStatus('idle');
          setIsLoading(false);
          const errorMsg = payErr?.shortMessage || payErr?.message || 'Unknown error';
          alert(language === 'es' ? `Error en micropago: ${errorMsg}` : `Payment failed: ${errorMsg}`);
          return;
        }

        // Submit question AFTER payment succeeds — errors here go to the general catch
        const res = await submitQuestion(question, account, paymentTxHash);
        setResult(res);
        setIsLoading(false);
      } else {
        // If the contract isn't ready or user isn't fully connected, just try the direct API fallback
        let paymentTxHash = undefined;
        const res = await submitQuestion(question, account || undefined, paymentTxHash);
        setResult(res);
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('429')) {
        const detail = err.message.replace('API Error: ', '');
        alert(language === 'es'
          ? `Límite de capacidad IA: ${detail}. Por favor, espera unos segundos.`
          : `AI Capacity Limit: ${detail}. Please wait a few seconds.`);
      } else if (err.message?.includes('503') || err.message?.includes('500')) {
        alert(language === 'es'
          ? 'El Agente IA no pudo completar el razonamiento. Por favor, intenta de nuevo.'
          : 'The AI Agent could not complete its reasoning. Please try again.');
      } else if (err.message?.includes('402') || err.message?.includes('Payment Required')) {
        alert(language === 'es' ? 'Verificación de pago fallida o requerida. Por favor, conecta tu wallet e inténtalo de nuevo.' : 'Payment verification failed or required. Please connect your wallet and try again.');
      } else {
        const errorDetail = err.message || 'Unknown error';
        alert(language === 'es'
          ? `Error al conectar con el servidor: ${errorDetail}`
          : `Failed to connect to the backend server: ${errorDetail}`);
      }
      setIsLoading(false);
      setPaymentStatus('idle');
    }
    // We intentionally removed the finally block here to prevent it from resetting
    // the UI state immediately while the 2-second 'cancelled' timeout is running.
  };

  const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK || "testnet";

  const renderTerminal = (isMobile: boolean) => (
    <motion.div
      initial={isMobile ? { opacity: 0, y: 20 } : { opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className={`flex flex-col bg-transparent lg:bg-[#0A0D14] relative overflow-hidden ${isMobile
        ? "block lg:hidden my-0 -mx-4 sm:-mx-6 w-[100vw] min-h-[400px] border-y border-white/10 shadow-none rounded-none"
        : "hidden lg:flex w-full flex-1 lg:flex-[4] lg:min-w-[320px] lg:h-full border border-border/50 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] " + (isLoading || result ? 'min-h-[calc(100vh-14rem)]' : 'min-h-[500px]')
        }`}
    >
      {/* Header terminal style */}
      <div className={isMobile ? "m-4 mb-2 p-3 sm:p-4 border border-white/10 rounded-2xl bg-white/[0.03] flex flex-wrap gap-3 justify-between items-start sm:items-center z-20 shadow-sm" : "p-4 border-b border-white/5 bg-black/40 flex justify-between items-center z-20"}>
        <div className="min-w-0">
          <h2 className="text-sm font-mono font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> {t('dash_terminal_title')}
          </h2>
          <p className="text-[10px] text-text-muted font-mono mt-1">{t('dash_terminal_listening')} wss://{network}.mirrornode.hedera.com</p>
        </div>
        {result && (
          <VerificationBadge status={result.status} />
        )}
      </div>

      {/* Terminal Window - Extra padding bottom on mobile for safe area / sticky input */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-4 lg:pb-6 font-mono text-xs md:text-sm scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {!result && !isLoading ? (
          <div className={`h-full w-full min-h-[300px] flex flex-col items-center justify-center text-center relative ${isMobile && !account ? '' : 'opacity-30'}`}>
            {isMobile && !account ? (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center overflow-hidden">
                {/* Ghost Logs Background */}
                <div className="absolute inset-0 flex flex-col gap-2 p-4 pb-12 opacity-[0.06] text-[10px] text-emerald-500 font-mono pointer-events-none select-none text-left z-0">
                  <p>{`> init.sh --auth-required`}</p>
                  <p>{`> [sys] establishing secure wss connection...`}</p>
                  <p>{`> [sys] awaiting cryptographic signature from client`}</p>
                  <p>{`> [net] connecting to mirror node... OK [14ms]`}</p>
                  <p>{`> [auth] WARN: no active wallet session detected`}</p>
                  <p>{`> [proc] suspend execution until auth event`}</p>
                  <p className="animate-pulse">{`> _`}</p>
                </div>

                <div className="z-10 flex flex-col items-center mt-[-20px]">
                  <div className="p-4 bg-accent-primary/10 rounded-full border border-accent-primary/30 mb-4 shadow-[0_0_30px_rgba(6,182,212,0.25)] relative animate-pulse">
                    <div className="absolute inset-0 rounded-full border-[3px] border-accent-primary animate-heartbeat-ripple pointer-events-none" />
                    <div className="absolute inset-0 rounded-full border-[3px] border-accent-primary/70 animate-heartbeat-ripple pointer-events-none" style={{ animationDelay: '0.4s' }} />
                    <Lock className="w-6 h-6 text-accent-primary" />
                  </div>
                  <p className="text-xs font-mono font-medium text-accent-primary px-8 text-center max-w-[280px] leading-relaxed tracking-widest uppercase">
                    {t('dash_connect_first')}<span className="inline-block animate-pulse ml-0.5 relative top-0.5">_</span>
                  </p>
                </div>
              </div>
            ) : (
              <>
                <Loader2 className="w-8 h-8 mb-4 text-text-muted animate-[spin_3s_linear_infinite]" />
                <p className="font-mono text-[10px] sm:text-xs text-text-muted uppercase tracking-widest px-4 break-words text-center">
                  {t('dash_awaiting')}
                </p>
              </>
            )}
          </div>
        ) : isLoading ? (
          <div className="space-y-4">
            {paymentStatus !== 'idle' && (
              <div className={`flex items-center gap-2 ${paymentStatus === 'done' ? 'text-emerald-400' : paymentStatus === 'cancelled' ? 'text-red-400' : 'text-amber-400 animate-pulse'}`}>
                {paymentStatus === 'done' ? (
                  <><CheckCircle2 className="w-4 h-4" /> {language === 'es' ? 'Micropago verificado' : 'Micropayment verified'} ({pfConfig?.serviceFeeHbar} HBAR)</>
                ) : paymentStatus === 'cancelled' ? (
                  <><Lock className="w-4 h-4" /> {language === 'es' ? 'Transacción cancelada' : 'Transaction cancelled'}</>
                ) : paymentStatus === 'confirming' ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {language === 'es' ? 'Confirmando pago en Mirror Node...' : 'Confirming payment on Mirror Node...'}</>
                ) : (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {language === 'es' ? 'Esperando firma del micropago...' : 'Awaiting micropayment signature...'}</>
                )}
              </div>
            )}
            <div className="text-accent-primary animate-pulse">{t('dash_init')}</div>
            <div className="text-text-muted pl-4">{t('dash_negotiating')}</div>
          </div>
        ) : result ? (
          <div className="space-y-6 pb-4 md:pb-8">

            {/* The Initialization Log */}
            <div className="bg-white/5 border border-white/10 rounded p-3 text-xs text-text-muted">
              <div><span className="text-emerald-400">SESSION ID:</span> <span className="text-white">{result.proofId}</span></div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">TOPIC ID:</span>
                {result.hcsTopicId !== "pending" ? (
                  <a href={`https://hashscan.io/${process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet'}/topic/${result.hcsTopicId}`} target="_blank" rel="noopener noreferrer" className="text-white hover:text-accent-primary underline decoration-accent-primary/50 underline-offset-2 flex items-center gap-1 transition-colors">
                    {result.hcsTopicId} <ExternalLink className="w-3 h-3" />
                  </a>
                ) : "Awaiting assignment..."}
              </div>
              {(result as any).dataSources && (result as any).dataSources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-white/5">
                  <span className="text-purple-400">{t('dash_live_data')}</span>{' '}
                  {(result as any).dataSources.map((src: string, i: number) => (
                    <span key={i} className="inline-flex items-center text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20 px-1.5 py-0.5 rounded mr-1">
                      {src}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <AnimatePresence>
              {result.steps.map((step, idx) => {
                const isFinal = step.label === "FINAL";

                // If status is CONFIRMED, the seqNum is available if backend passed it,
                // but we can just show "Verified" status for visual impact.
                const seqNum = (result as StoredProof).hcsSequenceNumbers?.[idx];

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10, y: 10 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    transition={{ delay: idx * 0.4 }}
                    className="relative mb-6 last:mb-0"
                  >
                    <div className={`p-4 border-l-2 ${isFinal ? 'border-amber-400 bg-amber-400/5' : 'border-emerald-500 bg-emerald-500/5'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] md:text-[11px] font-bold ${isFinal ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {isFinal ? '> EXECUTION_FINAL' : `> ${step.label}_INFERENCE`}
                        </span>
                        {result.status === "CONFIRMED" || result.status === "VERIFIED" ? (
                          <a
                            href={`https://hashscan.io/${process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet'}/topic/${result.hcsTopicId}?sequenceNumber=${seqNum}`}
                            target="_blank" rel="noopener noreferrer"
                            className="text-[10px] text-emerald-400 flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30 transition-colors group cursor-pointer"
                            title="Verify on HashScan"
                          >
                            ✓ SEQ: {seqNum || 'SYNCED'} <ExternalLink className="w-2.5 h-2.5 opacity-70 group-hover:opacity-100" />
                          </a>
                        ) : (
                          <span className="text-[10px] text-amber-500 flex items-center gap-1 animate-pulse">
                            <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
                            {t('dash_publishing')}
                          </span>
                        )}
                      </div>

                      <div className="text-xs md:text-sm my-2 space-y-3">
                        {step.content.split(/\n{2,}/).map((block, bIdx) => {
                          const trimmed = block.trim();
                          if (!trimmed) return null;
                          // Bullet list block
                          if (trimmed.split('\n').some(l => l.trim().match(/^[\*\-]\s/))) {
                            return (
                              <ul key={bIdx} className="list-disc list-outside pl-5 space-y-1.5">
                                {trimmed.split('\n').filter(l => l.trim()).map((line, lIdx) => (
                                  <li key={lIdx} className="text-white/80 leading-relaxed" dangerouslySetInnerHTML={{ __html: line.replace(/^[\*\-]\s+/, '').replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>') }} />
                                ))}
                              </ul>
                            );
                          }
                          // Normal paragraph
                          return (
                            <p key={bIdx} className="text-white/80 leading-relaxed" dangerouslySetInnerHTML={{ __html: trimmed.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>').replace(/\n/g, ' ') }} />
                          );
                        })}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-white/5 text-[9px] md:text-[10px] text-text-muted/70">
                        <span className="text-emerald-500 shrink-0">SHA256:</span>
                        <span className="truncate max-w-[150px] sm:max-w-[300px]" title={step.hash}>{step.hash}</span>
                      </div>
                    </div>

                    {/* Loading state: show until Audit Passport is ready to render */}
                    {isFinal && !((result.status === "CONFIRMED" || result.status === "VERIFIED") && (result as StoredProof).tokenTxId) && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="mt-6 border border-border/40 rounded-xl p-5 bg-surface/30 backdrop-blur"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white font-mono">
                              {language === 'es' ? 'Asegurando en cadena...' : 'Securing on-chain...'}
                            </p>
                            <p className="text-[11px] text-text-muted mt-0.5">
                              {language === 'es' ? 'Publicando en HCS → Acuñando $PFR → Anclando en EVM' : 'Publishing to HCS → Minting $PFR → Anchoring to EVM'}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-2">
                          <div className="h-1 rounded-full bg-emerald-500/40 animate-pulse" />
                          <div className="h-1 rounded-full bg-emerald-500/20 animate-pulse [animation-delay:0.3s]" />
                          <div className="h-1 rounded-full bg-emerald-500/10 animate-pulse [animation-delay:0.6s]" />
                        </div>
                      </motion.div>
                    )}

                    {/* Show the Passport exactly after Final step IF confirmed */}
                    {isFinal && (result.status === "CONFIRMED" || result.status === "VERIFIED") && (result as StoredProof).tokenTxId && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.8 }}
                        className="space-y-4"
                      >
                        <AuditPassport
                          tokenTxId={(result as StoredProof).tokenTxId!}
                          proofId={result.proofId}
                        />

                        {/* 5th Pillar: Autonomous Agent EVM Settlement */}
                        <div className="bg-surface/50 border border-border/50 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div>
                            <h4 className="text-white text-sm font-semibold flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-accent-primary" /> {language === 'es' ? 'Anclaje EVM Autónomo' : 'Autonomous EVM Anchor'}
                            </h4>
                            <p className="text-xs text-text-muted mt-1 max-w-sm">
                              {language === 'es' ? 'El Agente Autónomo ancla este resultado en el Smart Contract de Hedera EVM automáticamente — sin intervención del usuario.' : 'The Autonomous Agent anchors this result on the Hedera EVM Smart Contract automatically — zero user intervention.'}
                            </p>
                          </div>

                          {result.status === 'VERIFIED' || (result as any).evmSettled ? (
                            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 whitespace-nowrap">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> {language === 'es' ? 'Verificado por Agente' : 'Agent Verified'}
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 whitespace-nowrap animate-pulse">
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" /> {language === 'es' ? 'Agente procesando...' : 'Agent processing...'}
                            </Badge>
                          )}
                        </div>

                        {(result as any).evmTxHash && (
                          <div className="text-[10px] text-text-muted text-center font-mono break-all px-4">
                            EVM Tx: <a href={`https://hashscan.io/${network}/tx/${(result as any).evmTxHash}`} target="_blank" rel="noreferrer" className="text-accent-primary hover:underline">{(result as any).evmTxHash}</a>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : null}
      </div>
    </motion.div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-6rem)] lg:overflow-hidden pb-6 w-full max-w-full overflow-x-hidden">

      {/* LEFT PANEL — Chat & Request */}
      <div className="flex-1 lg:flex-[3] flex flex-col min-w-0 sm:min-w-[320px] overflow-x-hidden overflow-y-auto pr-0 lg:pr-2 scrollbar-thin pb-6 lg:pb-0">

        {/* FIXED HEADER ROW — ALWAYS VISIBLE ON DESKTOP */}
        <div className="flex justify-between items-center gap-4 mb-4 lg:mb-8 px-2 w-full min-h-[40px] z-30 min-w-0">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full border border-success/30 bg-success/5 shrink-0 whitespace-nowrap">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[9px] sm:text-[10px] font-mono font-bold text-success uppercase tracking-wider">
              Hedera {network.toUpperCase()} Live
            </span>
          </div>
          <div className="min-w-0 flex-1 flex justify-end overflow-hidden">
            <LiveNetworkCounter />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="block"
        >
          {/* Note: In mobile view, this behaves as a plain div (no border/padding). On desktop (lg:), it has Card styles. */}
          <div className={`flex flex-col relative overflow-hidden shrink-0 ${isLoading || result ? 'min-h-[60vh] lg:min-h-0' : ''} lg:p-6 lg:border lg:border-border/50 lg:bg-surface/50 lg:backdrop-blur-sm lg:rounded-xl`}>
            {/* Background glow only on desktop */}
            <div className="hidden lg:block absolute top-0 right-0 w-64 h-64 bg-accent-primary/10 rounded-full blur-[80px] pointer-events-none" />

            {/* Header Content Wrapper: Adding px-4 on mobile to compensate for removed card padding */}
            <div className={`mb-4 px-4 lg:px-0 relative z-10 ${isLoading || result ? 'hidden lg:block' : 'block'}`}>
              {!account && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="inline-flex items-center gap-2 px-2 py-0.5 rounded border border-amber-500/20 bg-amber-500/5 mb-3"
                >
                  <Lock className="w-3 h-3 text-amber-500" />
                  <span className="text-[9px] font-mono font-bold text-amber-500 tracking-widest uppercase">
                    LOCKED_SESSION
                  </span>
                </motion.div>
              )}
              <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
                {t('dash_title')} <ShieldCheck className="w-6 h-6 text-accent-primary" />
              </h1>
              <p className="text-text-muted text-sm pr-0 sm:pr-12">
                {t('dash_subtitle')}
              </p>
            </div>

            {/* MOBILE ONLY: Terminal goes here, between Title and Vectors */}
            {renderTerminal(true)}

            {/* Form was moved to sticky bottom on mobile */}
            <div className="hidden lg:block">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative group overflow-hidden rounded-xl border border-border/50">
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (!account) return;
                        handleSubmit(e);
                      }
                    }}
                    placeholder={t('dash_placeholder')}
                    className="w-full bg-background/30 p-5 min-h-[140px] text-white placeholder-text-muted/20 focus:outline-none focus:ring-1 focus:ring-accent-primary/30 transition-all resize-none shadow-inner disabled:cursor-not-allowed"
                    disabled={isLoading || !account}
                  />

                  {/* Disconnected Overlay - Refined Aesthetics */}
                  {!account && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-md transition-all duration-500 group-hover:bg-black/20">
                      {/* Sub-glow effect */}
                      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent-primary/20 to-transparent" />

                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="p-3 bg-accent-primary/5 rounded-full border border-accent-primary/20 mb-3 shadow-[0_0_20px_rgba(45,212,191,0.1)]"
                      >
                        <Lock className="w-5 h-5 text-accent-primary" />
                      </motion.div>
                      <p className="text-xs font-display font-medium text-white/90 px-8 text-center max-w-[280px] leading-relaxed tracking-wide">
                        {t('dash_connect_first')}
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  type={!account ? "button" : "submit"}
                  onClick={!account ? connect : undefined}
                  className={`w-full h-12 text-sm font-semibold rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all group ${!account
                    ? 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                    : 'bg-accent-primary hover:bg-accent-secondary text-black shadow-accent-primary/20'
                    }`}
                  disabled={isLoading || (!!account && !question.trim())}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> {t('dash_loading')}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {!account ? (
                        <>
                          <Activity className="w-4 h-4 text-accent-primary" /> {t('wallet_connect')}
                        </>
                      ) : (
                        <>
                          {t('dash_submit')} <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </span>
                  )}
                </Button>
              </form>
            </div>

            {/* VECTORS MUST BE OUTSIDE hidden lg:block TO SHOW ON MOBILE, BUT INSIDE CARD */}
            <div className={`mt-4 px-4 lg:px-0 relative z-10 w-full lg:mt-6 ${isLoading || result ? 'hidden lg:block' : 'block'}`}>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">{t('dash_vectors')}</p>
              <div className="flex flex-wrap gap-2">
                {randomVectors.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setQuestion(q)}
                    disabled={isLoading || !account}
                    className="px-3 py-1.5 rounded-lg border border-border/50 bg-background/50 text-[11px] text-text-muted hover:text-white hover:border-accent-primary/50 hover:bg-accent-primary/5 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* GLOBAL RECENT FEED — Always visible on desktop & mobile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mt-4 lg:mt-6 px-2 space-y-3 max-w-full overflow-hidden shrink-0"
        >
          <h3 className="text-xs font-display font-semibold text-text-muted uppercase tracking-widest flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 shrink-0" /> {t('dash_feed_global')}
          </h3>
          <div className="space-y-2">
            {globalFeed.length > 0 ? (
              globalFeed.map((audit) => (
                <Card
                  key={audit.proofId}
                  className="p-3 border-border/30 bg-surface/30 hover:bg-surface/50 hover:border-border transition-all cursor-pointer group"
                  onClick={() => setResult(audit)}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-[10px] font-mono text-accent-primary truncate">ID: {audit.proofId.substring(0, 8)}...</span>
                      <VerificationBadge status={audit.status || "CONFIRMED"} />
                    </div>
                    <p className="text-xs text-white/90 truncate">"{audit.question}"</p>
                    <div className="flex items-center justify-between pt-1.5 border-t border-border/50">
                      <span className="text-[9px] text-text-muted flex items-center gap-1.5 min-w-0">
                        <Hash className="w-2.5 h-2.5 text-accent-primary/60 shrink-0" />
                        <span className="text-[7.5px] font-bold uppercase tracking-widest opacity-40 mr-1 shrink-0">HCS</span>
                        <span className="truncate text-white/80">{audit.totalSteps}</span>
                      </span>
                      <span className="text-[9px] text-text-muted">
                        {formatTimeAgoI18n(audit.createdAt, t)}
                      </span>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="p-4 text-center border border-dashed border-white/5 rounded-xl opacity-30 text-[9px] font-mono tracking-widest uppercase">
                {language === 'es' ? 'Sin actividad reciente' : 'No recent activity'}
              </div>
            )}
          </div>
        </motion.div>



      </div>

      {/* RIGHT PANEL (Desktop Only) — Audit Feed Terminal via renderTerminal */}
      {renderTerminal(false)}

      {/* MOBILE STICKY INPUT FORM (Hidden on Desktop) */}
      <div className="lg:hidden fixed bottom-[4.8rem] left-0 right-0 p-4 bg-gradient-to-t from-background via-background/95 to-transparent z-50 pointer-events-none">
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-full mx-auto relative items-end pointer-events-auto">
          <div className={`relative flex-1 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${!account ? 'bg-surface-elevated/40 border border-white/5' : 'bg-[#0F131D]/80 border border-accent-primary/20 backdrop-blur-xl group-focus-within:border-accent-primary/50 group-focus-within:shadow-[0_0_20px_rgba(45,212,191,0.1)]'}`}>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (!account) return;
                  handleSubmit(e);
                }
              }}
              placeholder={account ? "Type your query here..." : ""}
              className={`w-full bg-transparent py-4 px-5 min-h-[56px] max-h-[120px] text-white placeholder-text-muted/40 focus:outline-none transition-all resize-none disabled:cursor-not-allowed text-sm ${!account ? 'opacity-0' : ''}`}
              disabled={isLoading || !account}
              rows={1}
            />
            {/* Si no hay cuenta, usamos el área como botón para conectar la wallet */}
            {!account && (
              <div
                className="absolute inset-0 flex items-center gap-2 cursor-pointer z-10 px-5 bg-transparent"
                onClick={connect}
              >
                <Lock className="w-4 h-4 text-accent-primary shrink-0 opacity-80" />
                <span className="text-sm font-medium text-white/90 truncate pr-4 opacity-80">Connect wallet to type...</span>
              </div>
            )}
          </div>
          <Button
            type={!account ? "button" : "submit"}
            onClick={!account ? connect : undefined}
            className={`h-[56px] w-[56px] shrink-0 rounded-2xl shadow-xl flex items-center justify-center p-0 transition-all pointer-events-auto ${!account || (!question.trim() && !isLoading)
              ? 'bg-surface-elevated/40 text-white/30 border border-white/5 cursor-not-allowed backdrop-blur-md'
              : isLoading ? 'bg-accent-primary/50 text-black' : 'bg-accent-primary hover:bg-accent-secondary text-black'
              }`}
            disabled={isLoading || (!!account && !question.trim())}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5 ml-0.5" />
            )}
          </Button>
        </form>
      </div>

    </div >
  );
}
