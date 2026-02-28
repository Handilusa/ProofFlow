'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, FileUp, Hash, ExternalLink, ShieldCheck, CheckCircle2, Lock, Loader2, Activity } from 'lucide-react';
import { Card, Button, Skeleton } from '@/components/ui';
import Badge from '@/components/ui/Badge';
import { submitQuestion, getRecentProofs, ReasoningResult, ReasoningStep, StoredProof } from '@/lib/api';
import { useWallet } from '@/lib/wallet-context';
import Link from 'next/link';
import VerificationBadge from '@/components/proofflow/VerificationBadge';
import AuditPassport from '@/components/proofflow/AuditPassport';
import LiveNetworkCounter from '@/components/proofflow/LiveNetworkCounter';
import { useLanguage } from '@/lib/language-context';
import { API_URL } from '@/lib/utils';

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
  const [isPolling, setIsPolling] = useState(false);
  const [randomVectors, setRandomVectors] = useState<string[]>([]);

  // Pick 3 random vectors on mount or language change
  useEffect(() => {
    const vectors = language === 'es' ? ALL_VECTORS_ES : ALL_VECTORS;
    const shuffled = [...vectors].sort(() => 0.5 - Math.random());
    setRandomVectors(shuffled.slice(0, 3));
  }, [language]);

  // Fetch recent audits (including simulation data) on mount
  useEffect(() => {
    let isMounted = true;
    const fetchRecent = async () => {
      try {
        const proofs = await getRecentProofs();
        if (isMounted) {
          setRecentAudits(proofs.slice(0, 3)); // show top 3
        }
      } catch (e) {
        console.error("Failed to load recent audits", e);
      }
    };

    fetchRecent();
    const interval = setInterval(fetchRecent, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Polling logic for active session
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    if (result && result.status !== "CONFIRMED" && result.status !== "VERIFIED") {
      const pollProof = async () => {
        try {
          const latestData = await fetch(`${API_URL}/proof/${result.proofId}`);
          if (latestData.ok) {
            const updatedProof = await latestData.json();
            setResult(updatedProof);

            // Stop polling if complete
            if (updatedProof.status === "CONFIRMED" || updatedProof.status === "VERIFIED") {
              clearInterval(pollInterval);
              setIsPolling(false);
            }
          }
        } catch (e) {
          console.error("Polling error", e);
        }
      };

      setIsPolling(true);
      pollInterval = setInterval(pollProof, 2000);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [result?.proofId, result?.status]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!question.trim()) return;

    setIsLoading(true);
    setResult(null);

    try {
      const res = await submitQuestion(question, account || undefined);
      setResult(res);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('429')) {
        alert("The AI is rate-limited. Please wait about 30 seconds and try again.");
      } else if (err.message?.includes('503') || err.message?.includes('500')) {
        alert("AI service temporarily unavailable. Please wait a moment and try again.");
      } else {
        alert(language === 'es' ? "Error al conectar con el servidor. Por favor, intenta de nuevo más tarde." : "Failed to connect to the backend server. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK || "testnet";

  return (
    <div className="flex flex-col xl:flex-row gap-6 h-[calc(100vh-6rem)] overflow-hidden pb-6">

      {/* LEFT PANEL — Chat & Request */}
      <div className="flex-1 xl:flex-[3] flex flex-col min-w-[320px] overflow-y-auto pr-2 scrollbar-thin">

        {/* Header Stats Counter */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 px-2"
        >
          <Badge className="bg-success/10 text-success border-success/20 inline-flex items-center gap-2 font-mono whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Hedera {network.toUpperCase()} Live
          </Badge>
          <LiveNetworkCounter />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="flex flex-col p-6 sm:p-8 border-border/50 bg-surface/50 backdrop-blur-sm relative overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-primary/10 rounded-full blur-[80px] pointer-events-none" />

            <div className="mb-8 relative z-10">
              <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
                {t('dash_title')} <ShieldCheck className="w-6 h-6 text-accent-primary" />
              </h1>
              <p className="text-text-muted text-sm pr-12">
                {t('dash_subtitle')}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
              <div className="relative">
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
                  placeholder={!account ? (language === 'es' ? 'Conecta tu wallet para preguntar' : 'Connect your wallet to ask a question') : t('dash_placeholder')}
                  className="w-full bg-background border border-border rounded-xl p-4 min-h-[140px] text-white placeholder-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-all resize-none shadow-inner disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isLoading || isPolling || !account}
                />
              </div>

              <Button
                type={!account ? "button" : "submit"}
                onClick={!account ? connect : undefined}
                className="w-full h-12 text-sm font-semibold rounded-xl bg-accent-primary hover:bg-accent-secondary text-black shadow-[0_0_20px_rgba(45,212,191,0.2)] transition-all group disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isLoading || isPolling || (!!account && !question.trim())}
              >
                {isLoading || isPolling ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> {t('dash_loading')}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {!account ? (language === 'es' ? 'Conectar Wallet' : 'Connect Wallet') : t('dash_submit')} <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-8 relative z-10">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">{t('dash_vectors')}</p>
              <div className="flex flex-wrap gap-2">
                {randomVectors.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setQuestion(q)}
                    disabled={isLoading || isPolling || !account}
                    className="px-3 py-1.5 rounded-lg border border-border/50 bg-background/50 text-[11px] text-text-muted hover:text-white hover:border-accent-primary/50 hover:bg-accent-primary/5 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Recent Audits List (from Simulation Data) */}
        {!result && !isLoading && recentAudits.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8 px-2 space-y-4"
          >
            <h3 className="text-sm font-display font-semibold text-text-muted uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4" /> {t('dash_feed')}
            </h3>
            <div className="space-y-3">
              {recentAudits.map((audit) => (
                <Card
                  key={audit.proofId}
                  className="p-4 border-border/30 bg-surface/30 hover:bg-surface/50 hover:border-border transition-all cursor-pointer"
                  onClick={() => setResult(audit)}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-mono text-accent-primary">ID: {audit.proofId.substring(0, 8)}...</span>
                      <div className="flex gap-2 items-center">
                        {audit.hcsTopicId && audit.hcsTopicId !== "pending" && (
                          <a href={`https://hashscan.io/${process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet'}/topic/${audit.hcsTopicId}`} target="_blank" rel="noopener noreferrer" className="text-[10px] flex items-center gap-1 font-mono text-text-muted hover:text-white transition-colors bg-white/5 px-2 py-0.5 rounded border border-white/10" title="Verify Topic on Hashscan">
                            {audit.hcsTopicId} <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        <VerificationBadge status={audit.status || "CONFIRMED"} />
                      </div>
                    </div>
                    <p className="text-sm text-white/90 truncate pr-4">"{audit.question}"</p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                      <span className="text-[10px] text-text-muted flex items-center gap-1">
                        <Hash className="w-3 h-3" /> {audit.totalSteps} {t('dash_hcs_steps')}
                      </span>
                      <span className="text-[10px] text-text-muted">
                        {t('history_time_prefix')}{Math.floor((Date.now() - audit.createdAt) / 60000)}{t('history_ago')}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* RIGHT PANEL — Audit Feed Terminal */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="flex-1 xl:flex-[4] flex flex-col bg-[#0A0D14] border border-border/50 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] relative min-w-[320px] h-full overflow-hidden"
      >

        {/* Header terminal style */}
        <div className="p-4 border-b border-white/5 bg-black/40 flex justify-between items-center z-20">
          <div>
            <h2 className="text-sm font-mono font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> {t('dash_terminal_title')}
            </h2>
            <p className="text-[10px] text-text-muted font-mono mt-1">{t('dash_terminal_listening')} wss://{network}.mirrornode.hedera.com</p>
          </div>
          {result && (
            <VerificationBadge status={result.status} />
          )}
        </div>

        {/* Terminal Window */}
        <div className="flex-1 overflow-y-auto p-6 font-mono text-sm scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          {!result && !isLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
              <Loader2 className="w-8 h-8 mb-4 text-text-muted animate-[spin_3s_linear_infinite]" />
              <p className="font-mono text-xs text-text-muted uppercase tracking-widest">{t('dash_awaiting')}</p>
            </div>
          ) : isLoading ? (
            <div className="space-y-4">
              <div className="text-accent-primary animate-pulse">{t('dash_init')}</div>
              <div className="text-text-muted pl-4">{t('dash_negotiating')}</div>
            </div>
          ) : result ? (
            <div className="space-y-6 pb-8">

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
                          <span className={`text-[11px] font-bold ${isFinal ? 'text-amber-400' : 'text-emerald-400'}`}>
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

                        <div className="text-sm my-2 space-y-3">
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

                        <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-white/5 text-[10px] text-text-muted/70">
                          <span className="text-emerald-500">SHA256:</span>
                          <span className="truncate max-w-[200px]" title={step.hash}>{step.hash}</span>
                        </div>
                      </div>

                      {/* Show the Passport exactly after Final step IF confirmed */}
                      {isFinal && (result.status === "CONFIRMED" || result.status === "VERIFIED") && (result as StoredProof).tokenTxId && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.8 }}
                        >
                          <AuditPassport
                            tokenTxId={(result as StoredProof).tokenTxId!}
                            proofId={result.proofId}
                          />
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
    </div>
  );
}
