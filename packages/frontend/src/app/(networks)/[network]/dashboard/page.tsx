'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Activity, Wallet, PieChart, Info, Map, CheckCircle2,
  ExternalLink, BarChart3, AlertTriangle, Key, Search,
  ArrowUpRight, ArrowDownRight, Clock, ShieldCheck, Zap, Server, Database, Globe,
  Cpu,
  ChevronDown,
  Loader2,
  Terminal,
  Fingerprint, Send, FileUp, Hash, Lock, Trophy
} from "lucide-react";
import { Card, Button, Skeleton } from '@/components/ui';
import Badge from '@/components/ui/Badge';
import { submitQuestion, getRecentProofs, getConfig, getProofTxData, ReasoningResult, ReasoningStep, StoredProof, ProofFlowConfig, ApiError, verifyCaptcha, retryTokenMint } from '@/lib/api';
import { useWallet } from '@/lib/wallet-context';
import { useSendTransaction, useChainId } from 'wagmi';
import { parseEther } from 'viem';
import Link from 'next/link';
import VerificationBadge from '@/components/proofflow/VerificationBadge';
import AuditPassport from '@/components/proofflow/AuditPassport';
import LiveNetworkCounter from '@/components/proofflow/LiveNetworkCounter';
import { useLanguage } from '@/lib/language-context';
import { API_URL, formatTimeAgoI18n, cn } from '@/lib/utils';
import { TransferTransaction, Hbar, TransactionId, AccountId } from "@hashgraph/sdk";
import { getSignClient, initHederaWalletConnect, associatePFRToken } from "@/lib/hedera-walletconnect";
import CaptchaModal from '@/components/ui/CaptchaModal';
import { toast } from 'react-hot-toast';
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

// Custom Minimalist Futuristic Agent Icon
const AgentIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Outer hexagonal/sharp frame */}
    <path
      d="M12 2L20.5 6.5V17.5L12 22L3.5 17.5V6.5L12 2Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="opacity-40"
    />
    {/* Inner AI Core */}
    <path
      d="M12 6L16.5 9V15L12 18L7.5 15V9L12 6Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="opacity-80"
    />
    {/* Center Node / Eye */}
    <circle cx="12" cy="12" r="2" fill="currentColor" />
    {/* Data beams extending out */}
    <path
      d="M12 2V6M12 18V22M3.5 6.5L7.5 9M16.5 15L20.5 17.5M3.5 17.5L7.5 15M16.5 9L20.5 6.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="opacity-50"
    />
  </svg>
);

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

export default function DualPaneDashboard({ params }: { params: { network: string } }) {
  const { account, connect, network, setNetwork, userTier } = useWallet();
  const { t, language } = useLanguage();

  // URL Network
  const urlNetwork = params.network === 'mainnet' ? 'mainnet' : 'testnet';

  // Sync global state with URL
  useEffect(() => {
    if (network !== urlNetwork && setNetwork) {
      setNetwork(urlNetwork);
    }
  }, [urlNetwork, network, setNetwork]);

  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ReasoningResult | null>(null);
  const [recentAudits, setRecentAudits] = useState<StoredProof[]>([]);
  const [globalFeed, setGlobalFeed] = useState<StoredProof[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [randomVectors, setRandomVectors] = useState<string[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'confirming' | 'done' | 'cancelled'>('idle');
  const [pfConfig, setPfConfig] = useState<ProofFlowConfig | null>(null);
  const [isExecutingSwap, setIsExecutingSwap] = useState(false);
  const [swapTxHash, setSwapTxHash] = useState<string | null>(null);
  const [swapError, setSwapError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [forceConfirmStep, setForceConfirmStep] = useState(false);
  const [lastProofId, setLastProofId] = useState<string | null>(null);
  const [isAssociating, setIsAssociating] = useState(false);

  // CAPTCHA State
  const [captchaData, setCaptchaData] = useState<{ token: string; question: string } | null>(null);
  const [isCaptchaOpen, setIsCaptchaOpen] = useState(false);
  const [isVerifyingCaptcha, setIsVerifyingCaptcha] = useState(false);
  const [captchaError, setCaptchaError] = useState<string | undefined>();

  // Wagmi hooks — Native HBAR transfer to bypass WalletConnect contract simulation bugs
  const { sendTransactionAsync, isPending: isSubmittingToContract } = useSendTransaction();
  const walletChainId = useChainId();

  // Network mismatch detection: Hedera Testnet = 296, Hedera Mainnet = 295
  const expectedChainId = network === 'mainnet' ? 295 : 296;
  const isNetworkMismatch = account?.startsWith('0x') && walletChainId && walletChainId !== expectedChainId;
  const walletNetworkName = walletChainId === 295 ? 'Mainnet' : walletChainId === 296 ? 'Testnet' : `Chain ${walletChainId}`;

  const handleExecuteSwap = async () => {
    if (!result?.txData) return;
    setIsExecutingSwap(true);
    setSwapTxHash(null);
    setSwapError(null);
    console.log('[SwapExec] Starting swap execution...', { proofId: result?.proofId, txData: result?.txData });
    try {
      console.log('[SwapExec] Calling sendTransactionAsync with value:', result.txData.value);
      const hash = await sendTransactionAsync({
        to: result.txData.to as `0x${string}`,
        value: BigInt(result.txData.value),
        data: result.txData.data as `0x${string}`,
      });
      console.log('[SwapExec] Transaction hash received:', hash);
      const txHash = typeof hash === 'string' ? hash : String(hash);
      setSwapTxHash(txHash);
      setResult(prev => prev ? { ...prev, status: "PUBLISHING_TO_HEDERA" } : null);

      // Trigger HCS and EVM Core anchoring for the swap
      if (result?.proofId) {
        try {
          console.log('[SwapExec] Calling /swap/anchor with:', { proofId: result.proofId, txHash });
          const anchorRes = await fetch(`${API_URL}/swap/anchor`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'x-network': network 
            },
            body: JSON.stringify({
              proofId: result.proofId,
              txHash,
              swapDetails: result.swapDetails
            })
          });
          console.log('[SwapExec] /swap/anchor response:', anchorRes.status, anchorRes.statusText);
          
          // Force the effect to start polling this proofId to catch the HCS/EVM updates
          setIsPolling(true);
          
        } catch (e) {
          console.error("[SwapExec] Failed to trigger swap anchor", e);
        }
      } else {
        console.warn('[SwapExec] No proofId available, skipping anchor');
      }
    } catch (e: any) {
      console.error("[SwapExec] Swap Execution Failed:", e);
      setSwapError(e?.shortMessage || e?.message || 'Unknown error');
    } finally {
      setIsExecutingSwap(false);
    }
  };

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

  // Fetch platform config on mount — now includes account for tier-specific fees
  useEffect(() => {
    getConfig(network, account || undefined).then(setPfConfig).catch(() => { });
  }, [network, account]);

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
        let proofs = await getRecentProofs(account || undefined, network);

        // Step 2: If personal is empty and we have an account, fallback to global
        if (proofs.length === 0 && account) {
          proofs = await getRecentProofs(undefined, network);
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
        const proofs = await getRecentProofs(undefined, network);
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

    // Keep polling until status is VERIFIED or FAILED (terminal states)
    if (result && result.status !== "VERIFIED" && result.status !== "FAILED") {
      const pollProof = async () => {
        try {
          const latestData = await fetch(`${API_URL}/proof/${result.proofId}`, {
            headers: { 'x-network': network }
          });
          if (latestData.ok) {
            const updatedProof = await latestData.json();

            // ── Smart merge: prevent flickering during HCS publishing ──
            // During the gap between initial response and HCS confirmation,
            // Mirror Node may return empty/fewer steps. We keep the richer
            // data we already have and only update metadata & status.
            // STATUS PRIORITY: Never regress to an earlier status during polling.
            const STATUS_PRIORITY: Record<string, number> = {
              "PENDING_EXECUTION": 0,
              "PUBLISHING_TO_HEDERA": 1,
              "CONFIRMED": 2,
              "VERIFIED": 3,
              "FAILED": 3,
            };

            setResult(prev => {
              if (!prev) return updatedProof;
              const prevSteps = prev.steps || [];
              const newSteps = updatedProof.steps || [];
              const prevPriority = STATUS_PRIORITY[prev.status as string] ?? 0;
              const newPriority = STATUS_PRIORITY[updatedProof.status as string] ?? 0;
              return {
                ...prev,
                ...updatedProof,
                // Preserve existing steps if poll returned fewer (Mirror Node lag)
                steps: newSteps.length >= prevSteps.length ? newSteps : prevSteps,
                // Never regress status (e.g. don't go from PUBLISHING_TO_HEDERA back to PENDING_EXECUTION)
                status: newPriority >= prevPriority ? updatedProof.status : prev.status,
              };
            });

            // Stop polling when fully verified OR if pipeline failed
            if (updatedProof.status === "VERIFIED" || (updatedProof.status as string) === "FAILED") {
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
      // FREE SWAP BYPASS: If the user is asking to execute a DEX swap, we waive the $PFR micropayment. 
      // They will pay gas natively for the swap execution later.
      const isSwapIntent = /^swap\s+(\d+\.?\d*)\s+(\w+)\s+(?:to|for|→)\s+(\w+)/i.test(question.trim());

      // NEW AUTONOMOUS FLOW: Enforce payment if required by config
      if (pfConfig?.paymentRequired && account && !isSwapIntent) {
        setPaymentStatus('pending');
        let paymentTxHash: string | undefined;
        try {
          const feeInWei = parseEther(pfConfig.serviceFeeHbar);

          // ── EVM-First Unified Payment Flow ──
          // For 0x accounts: try EVM first, fallback to native Hedera if provider is incompatible.
          // For native Hedera accounts (0.0.x): go directly to native Hedera transfer.
          let evmFailed = !account?.startsWith('0x'); // Native accounts skip EVM entirely

          if (!evmFailed) {
            try {
              paymentTxHash = await sendTransactionAsync({
                to: pfConfig.operatorEvmAddress as `0x${string}`,
                value: feeInWei,
              });
              console.log('[Payment] EVM transfer succeeded:', paymentTxHash);
              setPaymentStatus('confirming');
              await new Promise(r => setTimeout(r, 3000));
              setPaymentStatus('done');
            } catch (evmErr: any) {
              const msg = (evmErr?.message || evmErr?.shortMessage || '').toLowerCase();
              const isUnsupported = msg.includes('does not support') ||
                msg.includes('not implemented') ||
                msg.includes('method not found') ||
                msg.includes('unsupported method') ||
                msg.includes('not available') ||
                msg.includes('ecdsa') ||
                msg.includes('connector not connected');

              // If user explicitly rejected, don't fallback — just rethrow
              if (msg.includes('rejected') || msg.includes('denied') || msg.includes('cancel')) {
                throw evmErr;
              }

              if (isUnsupported) {
                console.warn('[Payment] EVM provider unsupported, falling back to native Hedera transfer...');
                evmFailed = true;
              } else {
                throw evmErr; // Unknown error — rethrow
              }
            }
          }

          // ── Native Hedera Fallback (Hashpack / WalletConnect) ──
          if (evmFailed) {
            const { signClient: client } = await initHederaWalletConnect();
            if (!client || !account) throw new Error("WalletConnect Client not active. Please reconnect.");

            const hbarFee = parseFloat(pfConfig.serviceFeeHbar);

            if (!pfConfig.operatorAccountId) {
              console.error("[Payment] Config missing operatorAccountId.", pfConfig);
              throw new Error("Missing operator account ID configuration. Please refresh the page.");
            }

            // Derive Hedera account ID from EVM address if needed
            let signerAccountId = account;
            if (account.startsWith('0x')) {
              // When Hashpack connects via EVM, account is 0x address.
              // We need the Hedera account ID for the native transfer.
              // Hashpack exposes this in the WalletConnect session.
              const sessions = client.session.getAll();
              const hederaSession = sessions.find((s: any) => s.namespaces.hedera);
              if (hederaSession?.namespaces?.hedera?.accounts?.[0]) {
                const parts = hederaSession.namespaces.hedera.accounts[0].split(':');
                signerAccountId = parts[parts.length - 1]; // e.g. "0.0.12345"
              } else {
                throw new Error("Could not resolve Hedera account ID from EVM wallet. Please connect via the Hedera option instead.");
              }
            }

            const tx = new TransferTransaction()
              .addHbarTransfer(signerAccountId, new Hbar(-hbarFee))
              .addHbarTransfer(pfConfig.operatorAccountId, new Hbar(hbarFee))
              .setTransactionId(TransactionId.generate(signerAccountId))
              .setNodeAccountIds([AccountId.fromString("0.0.3")]);

            tx.freeze();
            const txBytes = Buffer.from(tx.toBytes()).toString('base64');

            const sessions = client.session.getAll();
            const hederaSession = sessions.find((s: any) => s.namespaces.hedera);
            if (!hederaSession) throw new Error("No active Hedera WalletConnect session found. Please reconnect via the Hedera option.");

            console.log('[Payment] Native Hedera fallback transfer (Hashpack compatibility)...');
            const response = await client.request({
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

            paymentTxHash = response?.transactionId || response?.response?.transactionId;
            console.log('[Payment] Native Hedera fallback succeeded:', paymentTxHash);

            setPaymentStatus('confirming');
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
        const parentIds = lastProofId ? [lastProofId] : undefined;
        const res = await submitQuestion(question, account, paymentTxHash, parentIds, network);
        setResult(res);
        if (res?.proofId) setLastProofId(res.proofId);
        setIsLoading(false);
      } else {
        // If the contract isn't ready or user isn't fully connected, just try the direct API fallback
        let paymentTxHash = undefined;
        const parentIds = lastProofId ? [lastProofId] : undefined;
        const res = await submitQuestion(question, account || undefined, paymentTxHash, parentIds, network);
        setResult(res);
        if (res?.proofId) setLastProofId(res.proofId);
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error(err);

      // Check for CAPTCHA Challenge
      if (err instanceof ApiError && err.data?.captchaRequired) {
        setCaptchaData({ token: err.data.captchaToken, question: err.data.captchaQuestion });
        setIsCaptchaOpen(true);
        setIsLoading(false);
        return;
      }

      if (err.message?.includes('429') || err.message?.includes('RATE_LIMIT') || (err instanceof ApiError && err.data?.reason === 'RATE_LIMIT')) {
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

  const handleVerifyCaptcha = async (solution: string) => {
    if (!captchaData) return;
    setIsVerifyingCaptcha(true);
    setCaptchaError(undefined);

    try {
      const isValid = await verifyCaptcha(captchaData.token, solution, network);
      if (isValid) {
        setIsCaptchaOpen(false);
        setCaptchaData(null);
        // Retry the original question submission now that we have a 15min bypass
        handleSubmit();
      } else {
        setCaptchaError('Incorrect answer. Please try again.');
      }
    } catch (err: any) {
      console.error('Captcha Verification Error:', err);
      // Usually means token expired
      if (err.message?.includes('expired') || err.message?.includes('not found')) {
        setCaptchaError('Captcha expired. Please close this and submit again to get a new challenge.');
      } else {
        setCaptchaError(err.message || 'Verification failed');
      }
    } finally {
      setIsVerifyingCaptcha(false);
    }
  };

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
                  <><CheckCircle2 className="w-4 h-4" /> {language === 'es' ? 'Micropago verificado' : 'Micropayment verified'} ({pfConfig?.serviceFeeHbar} HBAR{userTier && userTier.id !== 'free' ? ` - ${userTier.name} Discount` : ''})</>
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
                  <a href={`https://hashscan.io/${network}/topic/${result.hcsTopicId}`} target="_blank" rel="noopener noreferrer" className="text-white hover:text-accent-primary underline decoration-accent-primary/50 underline-offset-2 flex items-center gap-1 transition-colors">
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

            {/* REMOVED AnimatePresence here to stop it from forcing unmounts when the array reference changes during polling */}
            <div className="flex flex-col">
              {(result.steps || []).map((step, idx) => {
                const isFinal = step.label === "FINAL";

                // If status is CONFIRMED, the seqNum is available if backend passed it,
                // but we can just show "Verified" status for visual impact.
                const seqNum = (result as StoredProof).hcsSequenceNumbers?.[idx];

                return (
                  <motion.div
                    key={step.hash || `step-${idx}`}
                    initial={{ opacity: 0, x: -10, y: 10 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="relative mb-6 last:mb-0"
                  >
                    <div className={`p-4 border-l-2 ${isFinal ? 'border-amber-400 bg-amber-400/5' : 'border-emerald-500 bg-emerald-500/5'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] md:text-[11px] font-bold ${isFinal ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {isFinal ? '> EXECUTION_FINAL' : `> ${step.label}_INFERENCE`}
                        </span>
                        {result.status === "CONFIRMED" || result.status === "VERIFIED" ? (
                          <a
                            href={`https://hashscan.io/${network}/topic/${result.hcsTopicId}?sequenceNumber=${seqNum}`}
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
                  </motion.div>
                );
              })}
            </div>

            {/* --- TOKEN ASSOCIATION PROMPT --- */}
            {(result as StoredProof).needsAssociation && (result as StoredProof).pfrTokenId && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 border border-amber-500/40 bg-amber-500/10 rounded-none relative overflow-hidden"
                style={{ clipPath: "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)" }}
              >
                <div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Key className="w-5 h-5 text-amber-400" />
                    <h4 className="text-sm font-bold text-amber-400 font-mono uppercase tracking-widest">
                      {language === 'es' ? 'Asociación de Token Requerida' : 'Token Association Required'}
                    </h4>
                  </div>
                  <p className="text-xs text-amber-300/80 font-mono mb-3">
                    {language === 'es'
                      ? 'Tu wallet necesita asociar el token PFR (acción única) para recibir recompensas de ProofFlow.'
                      : 'Your wallet needs to associate the PFR token (one-time action) to receive ProofFlow rewards.'}
                  </p>
                  <button
                    onClick={async () => {
                      if (!account || !(result as StoredProof).pfrTokenId) return;
                      setIsAssociating(true);
                      try {
                        const success = await associatePFRToken(account, (result as StoredProof).pfrTokenId!);
                        if (success) {
                          toast.success(language === 'es' ? '✅ Token asociado. Reintentando mint...' : '✅ Token associated. Retrying mint...');
                          const retryRes = await retryTokenMint(result.proofId, network);
                          if (retryRes.success) {
                            toast.success(language === 'es' ? '✅ PFR recibido!' : '✅ PFR received!');
                            setResult(prev => prev ? { ...prev, needsAssociation: false, tokenTxId: retryRes.tokenTxId } as any : null);
                          } else {
                            toast.error(language === 'es' ? 'Mint falló. Intenta de nuevo.' : 'Mint failed. Try again.');
                          }
                        } else {
                          toast.error(language === 'es' ? 'Asociación cancelada.' : 'Association cancelled.');
                        }
                      } catch (err: any) {
                        console.error('[Associate] Error:', err);
                        toast.error(err?.message || 'Association failed');
                      } finally {
                        setIsAssociating(false);
                      }
                    }}
                    disabled={isAssociating}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 font-mono text-xs uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)" }}
                  >
                    {isAssociating ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> {language === 'es' ? 'Procesando...' : 'Processing...'}</>
                    ) : (
                      <><Key className="w-4 h-4" /> {language === 'es' ? 'Asociar Token PFR' : 'Associate PFR Token'}</>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* --- SWAP CONFIRMATION UI --- */}
            {/* --- SWAP CONFIRMATION UI --- */}
            {result.type === "SWAP_PROPOSAL" && result.status === "PENDING_EXECUTION" && result.swapDetails && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6 relative"
              >
                {/* Main Cyber Background with cut corners */}
                <div 
                  className="bg-[#0a0f18] border border-cyan-500/30 p-5 sm:p-6 relative overflow-hidden group shadow-[0_0_20px_rgba(6,182,212,0.15)] rounded-none"
                  style={{
                    clipPath: "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)",
                  }}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
                  
                  {/* Decorative corner accents */}
                  <div className="absolute top-0 left-0 w-8 h-[1px] bg-cyan-500/50 mix-blend-screen" />
                  <div className="absolute bottom-0 right-0 w-8 h-[1px] bg-cyan-500/50 mix-blend-screen" />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-cyan-400 font-bold font-mono uppercase tracking-widest flex items-center gap-2">
                        <Terminal className="w-5 h-5" /> DeFi Execution: Swap Proposal
                      </h3>
                      {result.warnings && result.warnings.length === 0 && (
                        <Badge variant="outline" className="text-emerald-400 font-mono tracking-widest border-emerald-500/30 bg-emerald-500/10 rounded-none uppercase" style={{ clipPath: "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)" }}>
                          <ShieldCheck className="w-3 h-3 mr-1" /> Safe
                        </Badge>
                      )}
                    </div>

                    {/* SAFETY WARNINGS BLOCK */}
                    {result.warnings && result.warnings.length > 0 && (() => {
                      const hasCritical = result.warnings.some(w => w.level === "CRITICAL");
                      const boxBorder = hasCritical ? "border-red-500/50" : "border-amber-500/40";
                      const boxBg = hasCritical ? "bg-red-500/10" : "bg-amber-500/10";
                      const iconColor = hasCritical ? "text-red-500" : "text-amber-500";
                      const titleColor = hasCritical ? "text-red-500" : "text-amber-500";
                      const titleText = hasCritical ? "Critical Safety Warnings Detected" : "Safety Warnings Detected";
                      
                      return (
                        <div 
                          className={`mb-5 p-4 border ${boxBorder} ${boxBg} rounded-none`}
                          style={{ clipPath: "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)" }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className={`w-5 h-5 ${iconColor}`} />
                            <h4 className={`text-sm font-bold ${titleColor} font-mono uppercase tracking-widest`}>{titleText}</h4>
                          </div>
                          <ul className="space-y-2">
                            {result.warnings.map((warning, idx) => (
                              <li key={idx} className={`flex gap-2 text-sm ${hasCritical ? 'text-red-400' : 'text-amber-500/90'} font-mono leading-tight`}>
                                <span className="shrink-0 mt-0.5">•</span>
                                <span>
                                  {warning.type === "TYPO" && <span className={`font-bold mr-1 ${hasCritical ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20'} px-1 py-0.5`} style={{ clipPath: "polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)" }}>[AUTO-CORRECT]</span>}
                                  {warning.level === "CRITICAL" && warning.type !== "TYPO" && <span className="font-bold mr-1 text-red-500 bg-red-500/20 px-1 py-0.5" style={{ clipPath: "polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)" }}>[CRITICAL]</span>}
                                  {warning.message}
                                </span>
                              </li>
                            ))}
                          </ul>
                          {hasCritical ? (
                            <div className="mt-3 text-xs text-red-400 font-mono italic">
                              This transaction may Fail, Return near-zero tokens, or Result in loss due to routing issues. Execution blocked by default.
                            </div>
                          ) : (
                            <p className="mt-3 text-xs text-amber-500/60 font-mono italic">
                              {language === 'es' ? 'El Agente ha intentado ajustar la propuesta, revisa los detalles cuidadosamente.' : 'The Agent has attempted to adjust the proposal, please review the details carefully.'}
                            </p>
                          )}
                        </div>
                      );
                    })()}

                    {/* CONFIDENCE SCORE UI */}
                    {result.confidenceScore !== undefined && result.riskLevel && (() => {
                      const score = result.confidenceScore;
                      const risk = result.riskLevel;
                      
                      let riskColor = "text-emerald-400";
                      let riskBg = "bg-emerald-500/10";
                      let riskBorder = "border-emerald-500/30";
                      let riskDot = "bg-emerald-500";
                      let message = "This transaction appears safe to execute.";
                      let icon = "🟢";

                      if (score < 40) {
                        riskColor = "text-red-500";
                        riskBg = "bg-red-500/10";
                        riskBorder = "border-red-500/40";
                        riskDot = "bg-red-500";
                        message = "This swap is likely to fail or return minimal value.";
                        icon = "🔴";
                      } else if (score < 70) {
                        riskColor = "text-orange-500";
                        riskBg = "bg-orange-500/10";
                        riskBorder = "border-orange-500/40";
                        riskDot = "bg-orange-500";
                        message = "High slippage or low liquidity detected. Proceed with caution.";
                        icon = "🟠";
                      } else if (score < 90) {
                        riskColor = "text-amber-400";
                        riskBg = "bg-amber-500/10";
                        riskBorder = "border-amber-500/30";
                        riskDot = "bg-amber-400";
                        message = "Moderate risk. Double check swap details.";
                        icon = "🟡";
                      }

                      return (
                        <div className="mb-6 flex flex-col gap-2">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-white/50 text-xs tracking-widest uppercase">Confidence Score:</span>
                            <span className={`font-mono font-bold text-lg ${riskColor}`}>{score}/100 {icon}</span>
                          </div>
                          
                          <div 
                            className={`p-3 border ${riskBorder} ${riskBg} rounded-none flex items-start gap-3`}
                            style={{ clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)" }}
                          >
                            <div className="mt-1">
                              <span className={`relative flex h-3 w-3`}>
                                {(score < 70) && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${riskDot} opacity-75`}></span>}
                                <span className={`relative inline-flex rounded-full h-3 w-3 ${riskDot}`}></span>
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-white/60 text-[10px] uppercase tracking-widest block">Risk Level</span>
                                <span className={`text-xs font-bold font-mono tracking-widest uppercase ${riskColor}`}>{risk}</span>
                              </div>
                              <p className="mt-1 text-xs text-white/70 font-mono">
                                {score < 40 ? <AlertTriangle className="w-3 h-3 inline mr-1 -mt-0.5 text-red-500"/> : null}
                                {message}
                              </p>
                              
                              {/* Bonus Actionable Alternative logic */}
                              {(score < 70 && result.swapDetails.tokenOut !== "SAUCE") && (
                                <div className="mt-3 pt-3 border-t border-white/5">
                                  <span className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase flex items-center gap-1.5"><Activity className="w-3 h-3"/> Suggested alternative:</span>
                                  <span className="text-xs text-white/60 font-mono mt-1 block">
                                    → Swap to SAUCE instead (Confidence: 91/100)
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    <div 
                      className="grid grid-cols-2 gap-y-5 gap-x-4 mb-5 text-sm font-mono text-white/80 p-4 bg-black/40 border border-white/5 rounded-none"
                      style={{ clipPath: "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)" }}
                    >
                      <div><span className="text-cyan-500/60 text-[10px] uppercase font-mono tracking-widest block mb-1">Pay</span><span className="font-bold relative text-cyan-100">{result.swapDetails.amountIn} {result.swapDetails.tokenIn}</span></div>
                      <div><span className="text-cyan-500/60 text-[10px] uppercase font-mono tracking-widest block mb-1">Receive (Est.)</span><span className="text-cyan-400 font-bold text-lg leading-tight">{result.swapDetails.estimatedOut}</span></div>
                      <div><span className="text-cyan-500/60 text-[10px] uppercase font-mono tracking-widest block mb-1">DEX Protocol</span><span className="text-cyan-100/80">{result.swapDetails.dex}</span></div>
                      <div><span className="text-cyan-500/60 text-[10px] uppercase font-mono tracking-widest block mb-1">Max Slippage</span><span className="text-cyan-100/80">{result.swapDetails.slippage}</span></div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  {(() => {
                    // CRITICAL BLOCK OVERRIDE STATE
                    if (result.blockExecution) {
                      const score = result.confidenceScore || 0;
                      if (score < 20) {
                        // CRITICALLY DANGEROUS: TEXT INPUT CONFIRM
                        return (
                          <div className="flex flex-col gap-3 w-full">
                            <div className="flex flex-col gap-2 p-3 bg-red-500/5 border border-red-500/20" style={{ clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)" }}>
                              <span className="text-xs text-red-400/80 font-mono tracking-wide uppercase">To execute this extremely dangerous swap, type <strong className="text-red-500">CONFIRM</strong> below:</span>
                              <input 
                                type="text" 
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                placeholder="Type CONFIRM"
                                className="w-full bg-black/50 border border-red-500/30 text-red-500 font-mono text-sm px-3 py-2 outline-none focus:border-red-500/70 transition-colors uppercase rounded-none placeholder:text-red-500/20"
                              />
                            </div>
                            <button
                              onClick={handleExecuteSwap}
                              disabled={isExecutingSwap || !account || confirmText !== "CONFIRM"}
                              className="w-full bg-red-950 text-red-400 border border-red-500/40 font-bold py-2.5 px-3 text-xs sm:text-sm font-mono tracking-wide rounded-none transition-all hover:bg-red-900 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                              style={{ clipPath: "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)" }}
                            >
                              {isExecutingSwap ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                              {isExecutingSwap ? "Forcing Execution..." : "Force Execute Dangerous Swap"}
                            </button>
                          </div>
                        );
                      } else {
                        // DANGEROUS: DOUBLE CLICK CONFIRM (20-39)
                        return (
                          <>
                            {!forceConfirmStep ? (
                              <button
                                onClick={() => setForceConfirmStep(true)}
                                className="flex-1 bg-red-950 text-red-400 border border-red-500/40 font-bold py-2.5 px-3 text-xs sm:text-sm font-mono tracking-wide rounded-none transition-all hover:bg-red-900 hover:text-red-300 flex justify-center items-center gap-2"
                                style={{ clipPath: "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)" }}
                              >
                                <AlertTriangle className="w-4 h-4" />
                                Force Swap Anyway (Advanced)
                              </button>
                            ) : (
                              <button
                                onClick={handleExecuteSwap}
                                disabled={isExecutingSwap || !account}
                                className="flex-1 bg-red-600 animate-pulse text-white border border-red-500 font-bold py-2.5 px-3 text-xs sm:text-sm font-mono tracking-wide rounded-none transition-all hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 hover:animate-none shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                                style={{ clipPath: "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)" }}
                              >
                                {isExecutingSwap ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                                {isExecutingSwap ? "Forcing..." : "Are you sure? Execute Now"}
                              </button>
                            )}
                          </>
                        );
                      }
                    }

                    // Check if there's a typo warning
                    const typoWarning = result.warnings?.find(w => w.type === "TYPO");
                    const hasTypo = !!typoWarning;
                    const suggestedToken = typoWarning?.suggestedToken || result.swapDetails.tokenOut;

                    if (hasTypo) {
                      return (
                        <>
                          <button
                            onClick={handleExecuteSwap}
                            disabled={isExecutingSwap || !account}
                            className="flex-[1.5] bg-emerald-500 text-[#020617] font-bold py-2.5 px-3 text-xs sm:text-sm font-mono tracking-wide transition-all hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)] rounded-none"
                            style={{ clipPath: "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)" }}
                          >
                            {isExecutingSwap ? <Loader2 className="w-4 h-4 animate-spin" /> : <Fingerprint className="w-4 h-4" />}
                            {isExecutingSwap ? (language === 'es' ? "Confirmando..." : "Confirming...") : `Swap to ${suggestedToken} (Safe)`}
                          </button>
                          <button 
                            onClick={() => {
                              // Revert swap details to use the original (uncorrected) token
                              const origToken = typoWarning?.originalToken || result.swapDetails?.originalTokenOut;
                              if (origToken) {
                                setResult(prev => prev ? {
                                  ...prev,
                                  swapDetails: {
                                    ...prev.swapDetails!,
                                    tokenOut: origToken,
                                    estimatedOut: prev.swapDetails!.estimatedOut?.replace(prev.swapDetails!.tokenOut, origToken),
                                  },
                                  warnings: [], // Clear warnings since user chose to proceed
                                } : null);
                              }
                              handleExecuteSwap();
                            }}
                            disabled={isExecutingSwap || !account}
                            className="flex-1 bg-amber-500/10 text-amber-500 border border-amber-500/30 hover:bg-amber-500/20 font-bold font-mono text-xs sm:text-sm tracking-wide py-2.5 px-3 rounded-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                            style={{ clipPath: "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)" }}
                          >
                            {language === 'es' ? `Usar ${typoWarning?.originalToken || result.swapDetails?.originalTokenOut || result.swapDetails?.tokenOut} (Riesgo)` : `Use ${typoWarning?.originalToken || result.swapDetails?.originalTokenOut || result.swapDetails?.tokenOut} anyway`}
                          </button>
                        </>
                      );
                    }

                    // Standard Safe Button
                    return (
                      <button
                        onClick={handleExecuteSwap}
                        disabled={isExecutingSwap || !account}
                        className="flex-1 bg-emerald-500 text-[#020617] font-bold py-2.5 px-3 text-xs sm:text-sm font-mono tracking-wide rounded-none transition-all hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                        style={{ clipPath: "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)" }}
                      >
                        {isExecutingSwap ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                        {isExecutingSwap ? (language === 'es' ? "Confirmando en Wallet..." : "Confirming in Wallet...") : (language === 'es' ? "Confirmar y Ejecutar Swap" : "Confirm & Execute Swap")}
                      </button>
                    );
                  })()}

                  <button 
                    onClick={() => setResult(prev => prev ? { ...prev, status: "FAILED" } : null)}
                    disabled={isExecutingSwap}
                    className="sm:flex-none flex-[0.5] bg-white/5 text-cyan-400 border border-white/10 hover:bg-white/10 font-bold font-mono text-xs sm:text-sm tracking-wide py-2.5 px-4 rounded-none transition-all"
                    style={{ clipPath: "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)" }}
                  >
                    {language === 'es' ? "Cancelar" : "Cancel"}
                  </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* --- SWAP CONFIRMED SUCCESS (COMPACT EMERALD) --- */}
            {result.type === "SWAP_PROPOSAL" && (result.status === "CONFIRMED" || result.status === "VERIFIED") && result.swapDetails && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="mt-6 relative"
              >
                {/* Main Cyber Background with cut corners */}
                <div 
                  className="bg-[#04080e]/80 border border-emerald-500/30 p-6 relative overflow-hidden group"
                  style={{
                    clipPath: "polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)",
                  }}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
                  
                  {/* Decorative corner accents */}
                  <div className="absolute top-0 left-0 w-8 h-[1px] bg-emerald-500/50 mix-blend-screen" />
                  <div className="absolute bottom-0 right-0 w-8 h-[1px] bg-emerald-500/50 mix-blend-screen" />
                  
                  <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                      <motion.div 
                        initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} 
                        transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
                        className="w-10 h-10 rounded-full border border-emerald-500/50 flex flex-shrink-0 items-center justify-center relative bg-[#04080e]"
                      >
                        <div className="absolute inset-0 rounded-full bg-emerald-500/10 blur-[6px]" />
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                      </motion.div>
                      <div>
                        <h3 className="text-emerald-400 font-bold font-mono uppercase tracking-[0.15em] text-sm drop-shadow-[0_0_5px_rgba(52,211,153,0.3)]">
                          {language === 'es' ? 'Swap Ejecutado' : 'Swap Executed'}
                        </h3>
                        <p className="text-white/40 text-[11px] font-mono mt-0.5 tracking-wide">
                          {language === 'es' ? 'Transacción confirmada en Hedera EVM' : 'Transaction confirmed on Hedera EVM'}
                        </p>
                      </div>
                    </div>

                    {/* Compact Details Box */}
                    <div className="border border-emerald-500/20 bg-[#060a12]/50 p-4 transition-colors hover:bg-emerald-500/5 hover:border-emerald-500/30 mb-4">
                      <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                        <div>
                          <span className="text-emerald-500/60 text-[10px] uppercase font-mono tracking-widest block mb-1">
                            {language === 'es' ? 'Enviado' : 'Sent'}
                          </span>
                          <span className="text-white/90 font-mono font-bold text-sm tracking-wide">
                            {result.swapDetails.amountIn} {result.swapDetails.originalTokenIn || result.swapDetails.tokenIn}
                          </span>
                        </div>
                        <div>
                          <span className="text-emerald-500/60 text-[10px] uppercase font-mono tracking-widest block mb-1">
                            {language === 'es' ? 'Recibido (Est.)' : 'Received (Est.)'}
                          </span>
                          <span className="text-emerald-400 font-mono font-bold text-sm tracking-wide drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">
                            ~{result.swapDetails.estimatedOut.replace('~', '').trim()}
                          </span>
                        </div>
                        <div>
                          <span className="text-emerald-500/60 text-[10px] uppercase font-mono tracking-widest block mb-1">DEX</span>
                          <span className="text-white/80 font-mono text-sm tracking-wide">{result.swapDetails.dex}</span>
                        </div>
                        <div>
                          <span className="text-emerald-500/60 text-[10px] uppercase font-mono tracking-widest block mb-1">Network</span>
                          <span className="text-white/80 font-mono text-sm tracking-wide">Hedera Testnet</span>
                        </div>
                      </div>
                    </div>

                    {/* Transaction Hash - Compact */}
                    {swapTxHash && (
                      <div className="border border-emerald-500/20 bg-[#060a12]/50 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors hover:bg-emerald-500/5 hover:border-emerald-500/30">
                        <span className="text-emerald-500/60 text-[10px] uppercase font-mono tracking-widest block">
                          Transaction Hash
                        </span>
                        <a 
                          href={`https://hashscan.io/${network}/transaction/${swapTxHash}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 text-[11px] text-cyan-400/80 hover:text-cyan-300 font-mono transition-colors"
                        >
                          <span className="truncate max-w-[200px] sm:max-w-[300px] text-right">{swapTxHash}</span> 
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* --- SWAP ERROR --- */}
            {result.type === "SWAP_PROPOSAL" && swapError && result.status !== "CONFIRMED" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 border border-red-500/30 rounded-xl p-5 bg-red-500/5"
              >
                <div className="flex items-center gap-3">
                  <div className="text-red-400 text-xl">⚠️</div>
                  <div>
                    <p className="text-sm font-semibold text-red-300 font-mono">
                      {language === 'es' ? 'Error en el Swap' : 'Swap Failed'}
                    </p>
                    <p className="text-[11px] text-text-muted mt-1 font-mono break-all">{swapError}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* --- EVM ANCHORING AND PASSPORT (RENDERED OUTSIDE THE STEPS LOOP) --- */}
            {/* Auto-Suggest Swap Button after analysis */}
            {result.type !== "SWAP_PROPOSAL" && (result.status === "CONFIRMED" || result.status === "VERIFIED") && (() => {
              const finalContent = (result.steps || []).find((s: any) => s.label === "FINAL")?.content?.toLowerCase() || "";
              const mentionsSwap = /\b(swap|sauce|usdc|karate|hbar|whbar|pool|liquidity|yield|apr)\b/i.test(finalContent);
              return mentionsSwap ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-4">
                  <button
                    onClick={() => {
                      setQuestion('swap 5 hbar to sauce');
                      setResult(null);
                      setTimeout(() => {
                        const form = document.querySelector('form');
                        if (form) form.dispatchEvent(new Event('submit', { bubbles: true }));
                      }, 100);
                    }}
                    className="w-full h-12 bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 hover:from-cyan-500/20 hover:to-emerald-500/20 border border-cyan-500/40 hover:border-cyan-400/60 text-cyan-400 font-mono font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-[0_0_25px_rgba(34,211,238,0.1)] group"
                    style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:rotate-180 transition-transform duration-500">
                      <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                    {language === 'es' ? '⚡ Ejecutar Swap Sugerido →' : '⚡ Execute Suggested Swap →'}
                    {lastProofId && (
                      <span className="text-[9px] text-cyan-400/50 ml-2">Chained from {lastProofId.substring(0, 12)}...</span>
                    )}
                  </button>
                </motion.div>
              ) : null;
            })()}

            {(result.steps || []).length > 0 && (result.steps || [])[(result.steps || []).length - 1].label === "FINAL" && result.type !== "SWAP_PROPOSAL" && (
              <div className="mt-6 border-t border-white/5 pt-6">
                {/* FAILED state: show error instead of infinite spinner */}
                {(result.status as string) === "FAILED" && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="border border-red-500/30 rounded-xl p-5 bg-red-500/5 backdrop-blur"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-red-400 text-xl">⚠️</div>
                          <div>
                            <p className="text-sm font-semibold text-red-300 font-mono">
                              {language === 'es' ? 'Error en el anclaje on-chain' : 'On-chain anchoring failed'}
                            </p>
                            <p className="text-[11px] text-text-muted mt-0.5">
                              {language === 'es' ? 'El razonamiento fue generado correctamente pero la publicación en HCS/EVM falló. Tu respuesta sigue siendo válida.' : 'Reasoning was generated successfully but HCS/EVM publishing failed. Your answer is still valid.'}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Loading state 1: HCS Publishing & PFR Minting */}
                    {(result.status as string) !== "FAILED" && !((result.status === "CONFIRMED" || result.status === "VERIFIED") && (result as StoredProof).tokenTxId) && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="relative overflow-hidden bg-[#060a12] border border-cyan-500/20 rounded-sm p-[1px] transition-colors duration-500 hover:border-cyan-500/40"
                        style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
                      >
                        <div className="relative bg-[#0a0f18] w-full p-4 md:p-5"
                             style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}>
                          
                          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-20" />
                          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-[40px] pointer-events-none" />

                          <div className="relative z-10 flex items-center gap-3">
                            <div className="relative">
                              <div className="w-8 h-8 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
                            </div>
                            <div>
                              <p className="text-[11px] font-bold text-cyan-400 font-mono tracking-widest uppercase">
                                {language === 'es' ? 'Asegurando en cadena...' : 'Securing on-chain...'}
                              </p>
                              <p className="text-[10px] text-white/50 font-mono mt-0.5">
                                {language === 'es' ? 'Publicando en HCS → Acuñando $PFR' : 'Publishing to HCS → Minting $PFR'}
                              </p>
                            </div>
                          </div>
                          <div className="relative z-10 mt-4 grid grid-cols-3 gap-2">
                            <div className="h-[2px] rounded-full bg-cyan-500/60 animate-[pulse_1.5s_ease-in-out_infinite]" />
                            <div className="h-[2px] rounded-full bg-cyan-500/30 animate-[pulse_1.5s_ease-in-out_infinite] [animation-delay:0.3s]" />
                            <div className="h-[2px] rounded-full bg-cyan-500/10 animate-[pulse_1.5s_ease-in-out_infinite] [animation-delay:0.6s]" />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Show the Passport exactly after HTS token is minted */}
                    {(result.status === "CONFIRMED" || result.status === "VERIFIED") && (result as StoredProof).tokenTxId && (
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

                        {/* Loading state 2: EVM Anchoring (shows until evmSettled is true) */}
                        <AnimatePresence>
                          {!(result as any).evmSettled && (
                            <motion.div
                              key="evm-loading"
                              initial={{ opacity: 0, y: 10, height: 'auto' }}
                              animate={{ opacity: 1, y: 0, height: 'auto' }}
                              exit={{ opacity: 0, scale: 0.95, height: 0, margin: 0, padding: 0, overflow: 'hidden' }}
                              transition={{ duration: 0.4 }}
                              className="relative overflow-hidden bg-[#060a12] border border-emerald-500/20 rounded-sm p-[1px] transition-colors duration-500 hover:border-emerald-500/40"
                              style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
                            >
                              <div className="relative bg-[#0a0f18] w-full p-4 flex items-center gap-3"
                                   style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
                              >
                                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-20" />
                                  <div className="relative shrink-0 z-10">
                                      <div className="w-6 h-6 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin" />
                                  </div>
                                  <div className="relative z-10 flex-1">
                                      <h4 className="text-[11px] font-bold text-emerald-500 font-mono uppercase tracking-widest flex items-center gap-2">
                                          <Cpu className="w-3.5 h-3.5 text-emerald-500" />
                                          {language === 'es' ? 'Anclaje EVM Autónomo en progreso...' : 'Autonomous EVM Anchor in progress...'}
                                      </h4>
                                      <p className="text-[10px] text-white/40 font-mono mt-0.5 max-w-sm leading-relaxed">
                                          {language === 'es' ? 'El Agente Autónomo está anclando este resultado en el Smart Contract de Hedera EVM.' : 'The Autonomous Agent is anchoring this result on the Hedera EVM Smart Contract.'}
                                      </p>
                                  </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* 5th Pillar: Autonomous Agent EVM Settlement (shows after evmSettled is true) */}
                        {(result as any).evmSettled && (
                          <motion.div
                              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                              className="relative overflow-hidden bg-[#060a12] border border-emerald-500/20 rounded-sm p-[1px] transition-colors duration-500 hover:border-emerald-500/40"
                              style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
                          >
                            <div className="relative bg-[#0a0f18] w-full p-4 md:p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
                                 style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
                            >
                              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-20" />
                              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-[40px] pointer-events-none" />

                              <div className="relative z-10 flex-1">
                                  <div className="flex items-center gap-2 mb-1.5">
                                      <Cpu className="w-4 h-4 text-emerald-500" />
                                      <h4 className="text-[11px] font-bold text-emerald-500 font-mono uppercase tracking-widest">
                                          {language === 'es' ? 'Anclaje EVM Autónomo' : 'Autonomous EVM Anchor'}
                                      </h4>
                                  </div>
                                  <p className="text-[11px] text-white/40 font-mono mt-1 max-w-sm leading-relaxed">
                                      {language === 'es' ? 'El Agente Autónomo ancla este resultado en el Smart Contract de Hedera EVM automáticamente — sin intervención del usuario.' : 'The Autonomous Agent anchors this result on the Hedera EVM Smart Contract automatically — zero user intervention.'}
                                  </p>
                              </div>

                              <div className="relative z-10 shrink-0">
                                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(34,211,238,0.15)]"
                                       style={{ clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)' }}>
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      {language === 'es' ? 'Verificado por Agente' : 'Agent Verified'}
                                  </div>
                              </div>
                            </div>
                            
                            {(result as any).evmTxHash && (
                                <div className="relative z-10 bg-[#060a12]/80 border-t border-emerald-500/10 px-4 py-2 flex items-center justify-between text-[10px] font-mono">
                                    <span className="text-emerald-500/50 font-bold tracking-widest">EVM TX:</span>
                                    <a href={`https://hashscan.io/${network}/tx/${(result as any).evmTxHash}`} target="_blank" rel="noreferrer" 
                                       className="text-emerald-400 hover:text-emerald-300 transition-colors truncate ml-2">
                                        {(result as any).evmTxHash}
                                    </a>
                                </div>
                            )}
                          </motion.div>
                        )}
                      </motion.div>
                    )}
              </div>
            )}
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
        {/* Network Mismatch Warning */}
        {isNetworkMismatch && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-2 mb-4 p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-sm flex items-start gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-300">
                {language === 'es' ? '⚠ Red incorrecta detectada' : '⚠ Wrong Network Detected'}
              </p>
              <p className="text-xs text-amber-200/70 mt-1">
                {language === 'es'
                  ? `Tu wallet está en ${walletNetworkName}, pero la app espera ${network === 'mainnet' ? 'Mainnet' : 'Testnet'}. Cambia la red en tu extensión de wallet y reconecta.`
                  : `Your wallet is on ${walletNetworkName}, but the app expects ${network === 'mainnet' ? 'Mainnet' : 'Testnet'}. Switch the network in your wallet extension and reconnect.`
                }
              </p>
            </div>
          </motion.div>
        )}

        <div className="flex justify-between items-center gap-4 mb-4 lg:mb-8 px-2 w-full min-h-[40px] z-30 min-w-0">
          <div
            className="flex items-center gap-2 px-2.5 py-1 border border-emerald-500/30 bg-emerald-500/10 shrink-0 whitespace-nowrap shadow-[0_0_10px_rgba(16,185,129,0.1)]"
            style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}
          >
            <div className="w-1.5 h-1.5 bg-emerald-400 animate-pulse" />
            <span className="text-[9px] sm:text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
              {network === 'mainnet' ? 'Hedera MAINNET Live' : 'Hedera TESTNET Live'}
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
          <div
            className={`flex flex-col relative overflow-hidden shrink-0 ${isLoading || result ? 'min-h-[60vh] lg:min-h-0' : ''} lg:p-6 lg:border lg:border-cyan-500/20 lg:bg-surface/20 lg:backdrop-blur-sm`}
            style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
          >
            {/* Background glow only on desktop */}
            <div className="hidden lg:block absolute top-0 right-0 w-64 h-64 bg-cyan-400/5 rounded-full blur-[80px] pointer-events-none" />

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
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3 tracking-wide" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                {t('dash_title')} <AgentIcon className="w-7 h-7 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              </h1>
              <p className="text-cyan-400/60 font-mono text-xs pr-0 sm:pr-12">
                {t('dash_subtitle')}
              </p>
            </div>

            {/* MOBILE ONLY: Terminal goes here, between Title and Vectors */}
            {renderTerminal(true)}

            {/* Form was moved to sticky bottom on mobile */}
            <div className="hidden lg:block">
              {/* User Tier Status Info - Before Submit */}
              {account && pfConfig && (
                <div className="mb-4 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "flex items-center gap-1.5 px-2 py-0.5 border text-[10px] font-mono font-bold uppercase tracking-wider",
                      userTier?.id === 'gold' ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-500" :
                        userTier?.id === 'silver' ? "bg-slate-400/10 border-slate-400/30 text-slate-300" :
                          userTier?.id === 'bronze' ? "bg-amber-600/10 border-amber-600/30 text-amber-600" :
                            "bg-white/5 border-white/10 text-white/40"
                    )} style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}>
                      <Trophy className="w-3 h-3" />
                      {userTier?.name || 'Member'}
                    </div>
                    {userTier && userTier.id !== 'free' && (
                      <span className="text-[10px] font-mono text-emerald-400 font-bold tracking-wider">-{Math.round(userTier.discount * 100)}% DISCOUNT APPLIED</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-cyan-400/40 block uppercase font-mono tracking-widest">Current Network Fee</span>
                    <span className="text-xs font-mono font-bold text-white">{pfConfig.serviceFeeHbar} HBAR</span>
                  </div>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div
                  className="relative group overflow-hidden border border-cyan-500/20 bg-surface/30"
                  style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                >
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
                    className="w-full bg-transparent p-5 min-h-[140px] font-mono text-sm text-white placeholder-cyan-400/30 focus:outline-none focus:bg-cyan-500/5 transition-all resize-none shadow-inner disabled:cursor-not-allowed"
                    disabled={isLoading || !account}
                  />

                  {/* Disconnected Overlay - Refined Aesthetics */}
                  {!account && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#060a12]/80 backdrop-blur-sm transition-all duration-500 group-hover:bg-[#060a12]/60">
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="p-3 bg-red-500/10 border border-red-500/30 mb-3"
                        style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}
                      >
                        <Lock className="w-5 h-5 text-red-400" />
                      </motion.div>
                      <p className="text-xs font-mono font-bold text-white/90 px-8 text-center max-w-[280px] leading-relaxed tracking-wider uppercase">
                        {t('dash_connect_first')}
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  type={!account ? "button" : "submit"}
                  onClick={!account ? connect : undefined}
                  className={`w-full h-12 text-sm font-mono font-bold uppercase tracking-widest transition-all group ${!account
                    ? 'bg-transparent hover:bg-white/5 text-white/50 border border-white/20'
                    : 'bg-cyan-500/20 hover:bg-cyan-400 text-cyan-400 hover:text-black border border-cyan-500/50 shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:shadow-[0_0_30px_rgba(34,211,238,0.4)]'
                    }`}
                  style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)', borderRadius: 0 }}
                  disabled={isLoading || (!!account && !question.trim())}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-400" /> {t('dash_loading')}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {!account ? (
                        <>
                          <Lock className="w-4 h-4" /> {t('wallet_connect')}
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
              <p className="text-[10px] font-mono font-bold text-cyan-400/40 uppercase tracking-widest mb-3">{t('dash_vectors')}</p>
              <div className="flex flex-wrap gap-2">
                {randomVectors.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setQuestion(q)}
                    disabled={isLoading || !account}
                    className="px-3 py-1.5 border border-cyan-500/20 bg-surface/20 text-[10px] font-mono text-cyan-400/60 hover:text-cyan-400 hover:border-cyan-400/50 hover:bg-cyan-500/10 transition-colors text-left disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}
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
          <h3 className="text-[10px] font-mono font-bold text-cyan-400/50 uppercase tracking-[0.2em] flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 shrink-0" /> {t('dash_feed_global')}
          </h3>
          <div className="space-y-2">
            {globalFeed.length > 0 ? (
              globalFeed.map((audit) => (
                <div
                  key={audit.proofId}
                  className="p-3 border border-cyan-500/15 bg-surface/20 hover:bg-surface/40 hover:border-cyan-400/30 transition-all cursor-pointer group"
                  style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}
                  onClick={() => setResult(audit)}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-[9px] font-mono text-cyan-400/60 truncate">ID: {audit.proofId.substring(0, 8)}...</span>
                      <VerificationBadge status={audit.status || "CONFIRMED"} size="sm" />
                    </div>
                    <p className="text-[11px] font-mono text-white/70 group-hover:text-white truncate">"{audit.question}"</p>
                    <div className="flex items-center justify-between pt-1.5 border-t border-cyan-500/10">
                      <span className="text-[9px] text-white/30 font-mono flex items-center gap-1.5 min-w-0">
                        <Hash className="w-2.5 h-2.5 text-cyan-400/40 shrink-0" />
                        <span className="text-[7.5px] font-bold uppercase tracking-widest opacity-40 mr-1 shrink-0">HCS</span>
                        <span className="truncate">{audit.totalSteps}</span>
                      </span>
                      <span className="text-[9px] text-white/30 font-mono">
                        {formatTimeAgoI18n(audit.createdAt, t)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div
                className="p-4 text-center border border-dashed border-cyan-500/20 bg-surface/20 text-[9px] font-mono tracking-[0.3em] uppercase text-cyan-400/30"
                style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}
              >
                &#x25C8; 0x_NULL_INDEX &#x25C8;
              </div>
            )}
          </div>
        </motion.div>



      </div>

      {/* RIGHT PANEL (Desktop Only) — Audit Feed Terminal via renderTerminal */}
      {renderTerminal(false)}

      {/* Modals */}
      <CaptchaModal
        isOpen={isCaptchaOpen}
        onClose={() => { setIsCaptchaOpen(false); setCaptchaData(null); }}
        onVerify={handleVerifyCaptcha}
        question={captchaData?.question || ""}
        isLoading={isVerifyingCaptcha}
        error={captchaError}
      />

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
