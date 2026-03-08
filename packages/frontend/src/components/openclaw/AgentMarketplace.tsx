'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Activity, Globe, Database, GitBranch, Search, Zap, Boxes, Star } from 'lucide-react';

// --- AGENT CONFIG ---
const AGENTS = [
    {
        id: 'agent-defi',
        name: 'DeFi Risk Analyst',
        icon: Activity,
        color: '#a78bfa',        // purple-400
        bgClass: 'bg-purple-500/15',
        borderClass: 'border-purple-400/40',
        mockQuery: 'Analyzing SaucerSwap pool risk...',
        parentDeps: ['🌱 DAG Origin — Step 1/3'], // Root
    },
    {
        id: 'agent-security',
        name: 'Security Auditor',
        icon: ShieldCheck,
        color: '#60a5fa',        // blue-400
        bgClass: 'bg-blue-500/15',
        borderClass: 'border-blue-400/40',
        mockQuery: 'Verifying DAO treasury contracts...',
        parentDeps: ['#1 Risk Analysis'], // Depends on DeFi Analyst
        dagStep: 'Step 2/3',
    },
    {
        id: 'agent-market',
        name: 'Market Intel',
        icon: Globe,
        color: '#4ade80',        // green-400
        bgClass: 'bg-green-500/15',
        borderClass: 'border-green-400/40',
        mockQuery: 'Evaluating HBAR entry strategy...',
        parentDeps: ['#1 Risk', '#2 Audit'], // Depends on both
        dagStep: 'Step 3/3',
    }
];

// Equilateral triangle positions (120° apart) on a circle
// Angles: -90° (top), 30° (bottom-right), 150° (bottom-left)
const ORBIT_RADIUS = 175; // px from center
const AGENT_ANGLES = [-150, -30, 90]; // Top-left, Top-right, Bottom-center

function getAgentPosition(angleDeg: number) {
    const rad = (angleDeg * Math.PI) / 180;
    return {
        x: Math.cos(rad) * ORBIT_RADIUS,
        y: Math.sin(rad) * ORBIT_RADIUS,
    };
}

const LOG_MESSAGES = [
    { text: "🏦 [DeFi Analyst] Paying 0.02 HBAR → ProofFlow...", type: "agent" },
    { text: "[Sys] Payment 0.0.798...confirmed ✓", type: "sys" },
    { text: "🏦 [DeFi Analyst] POST /reason (root proof)", type: "agent" },
    { text: "[ProofFlow] Gemini → HCS → Proof #1: pf-8a3f...", type: "proof" },
    { text: "[HCS] 5 msgs → Topic 0.0.1234  rootHash: 0xab3f...", type: "hcs" },
    { text: "─────────────────────────────────────", type: "sep" },
    { text: "🔐 [Security Auditor] Paying 0.02 HBAR...", type: "agent" },
    { text: "🔐 [Security Auditor] POST /reason", type: "agent" },
    { text: "   🔗 parentProofIds: [\"pf-8a3f...\"]", type: "hcs" },
    { text: "[ProofFlow] Injecting 1 parent proof as context...", type: "proof" },
    { text: "[ProofFlow] Gemini → HCS → Proof #2: pf-c71b...", type: "proof" },
    { text: "─────────────────────────────────────", type: "sep" },
    { text: "📊 [Market Strategist] POST /reason", type: "agent" },
    { text: "   🔗 parents: [\"pf-8a3f\", \"pf-c71b\"]", type: "hcs" },
    { text: "[ProofFlow] Injecting 2 parent proofs...", type: "proof" },
    { text: "[ProofFlow] Gemini → HCS → Proof #3: pf-e40d...", type: "proof" },
    { text: "─────────────────────────────────────", type: "sep" },
    { text: "✅ DAG: #1→#2→#3 | Depth: 3 | All verified", type: "sys" },
];

export function AgentMarketplace() {
    const [activeIdx, setActiveIdx] = useState(0);
    const [logs, setLogs] = useState<typeof LOG_MESSAGES>([]);
    const [logPtr, setLogPtr] = useState(0);

    useEffect(() => {
        const iv = setInterval(() => setActiveIdx((p) => (p + 1) % AGENTS.length), 4500);
        return () => clearInterval(iv);
    }, []);

    useEffect(() => {
        const iv = setInterval(() => {
            setLogs((prev) => {
                const next = [...prev, LOG_MESSAGES[logPtr]];
                return next.length > 6 ? next.slice(next.length - 6) : next;
            });
            setLogPtr((p) => (p + 1) % LOG_MESSAGES.length);
        }, 900);
        return () => clearInterval(iv);
    }, [logPtr]);

    return (
        <section className="relative py-24 px-6 overflow-hidden bg-surface/10 border-t border-border/30">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-cyan-900/8 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/30 bg-teal-500/10 mb-4">
                        <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                        <span className="text-xs font-mono text-teal-300 tracking-wide uppercase">OpenClaw Bounty: Agent-to-Agent Economy</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-4">
                        The Verifiable Reasoning Oracle
                    </h2>
                    <p className="text-text-muted max-w-2xl mx-auto leading-relaxed">
                        ProofFlow isn&apos;t just for humans. In the <strong>Agentic Society</strong>, autonomous agents can programmatically pay ProofFlow via native HBAR to delegate complex decisions and receive cryptographically verifiable answers anchored on Hedera.
                    </p>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-12 items-center">

                    {/* LEFT: Orbital Visualizer */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative w-full aspect-square max-w-[480px] mx-auto lg:ml-0 lg:mr-auto lg:-translate-x-[42px]"
                    >
                        {/* Animated Orbit Rings */}
                        <motion.div
                            className="absolute inset-0 pointer-events-none"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                        >
                            {/* Inner Ring (Aligned with agents) */}
                            <div
                                className="absolute border border-white/[0.1] rounded-full"
                                style={{
                                    width: ORBIT_RADIUS * 2,
                                    height: ORBIT_RADIUS * 2,
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    borderStyle: 'dashed',
                                    borderWidth: '1px',
                                }}
                            />
                        </motion.div>

                        <motion.div
                            className="absolute inset-0 pointer-events-none"
                            animate={{ rotate: -360 }}
                            transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
                        >
                            {/* Outer Subtle Ring */}
                            <div
                                className="absolute border border-white/[0.05] rounded-full"
                                style={{
                                    width: ORBIT_RADIUS * 2 + 120,
                                    height: ORBIT_RADIUS * 2 + 120,
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                }}
                            />
                        </motion.div>

                        {/* Center: ProofFlow */}
                        <motion.div
                            className="absolute z-20 flex flex-col items-center justify-center w-[100px] h-[100px] rounded-full bg-cyan-500/10 border border-cyan-400/40 backdrop-blur-xl"
                            style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                            animate={{
                                boxShadow: [
                                    '0 0 20px rgba(34,211,238,0.15)',
                                    '0 0 40px rgba(34,211,238,0.3)',
                                    '0 0 20px rgba(34,211,238,0.15)',
                                ],
                            }}
                            transition={{ duration: 3, repeat: Infinity }}
                        >
                            <img src="/logo.svg" alt="ProofFlow" className="w-9 h-9 mb-1 opacity-90" />
                            <span className="text-[9px] font-bold text-cyan-300 font-mono tracking-wide">ORACLE</span>
                        </motion.div>

                        {/* Agents Orbit Container */}
                        <motion.div
                            className="absolute inset-0 z-10 pointer-events-none"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                        >
                            {AGENTS.map((agent, i) => {
                                const pos = getAgentPosition(AGENT_ANGLES[i]);
                                const isActive = i === activeIdx;

                                return (
                                    <div key={agent.id} className="absolute inset-0 pointer-events-auto">
                                        {/* S-curved Connection line & Particle */}
                                        {(() => {
                                            const angleRad = (AGENT_ANGLES[i] * Math.PI) / 180;
                                            const curveOffset = 0.8; // Control point spread
                                            const cp1x = Math.cos(angleRad + curveOffset) * (ORBIT_RADIUS * 0.35);
                                            const cp1y = Math.sin(angleRad + curveOffset) * (ORBIT_RADIUS * 0.35);
                                            const cp2x = Math.cos(angleRad - curveOffset) * (ORBIT_RADIUS * 0.65);
                                            const cp2y = Math.sin(angleRad - curveOffset) * (ORBIT_RADIUS * 0.65);

                                            // Path from center to agent
                                            const pathD = `M 0 0 C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${pos.x} ${pos.y}`;
                                            // Reverse path from agent to center for the particle
                                            const reversePathD = `M ${pos.x} ${pos.y} C ${cp2x} ${cp2y}, ${cp1x} ${cp1y}, 0 0`;

                                            return (
                                                <svg className="absolute top-1/2 left-1/2 overflow-visible pointer-events-none" style={{ zIndex: 5 }}>
                                                    <path
                                                        d={pathD}
                                                        fill="none"
                                                        stroke={isActive ? agent.color : 'rgba(255,255,255,0.15)'}
                                                        strokeWidth={isActive ? 1.5 : 1}
                                                        strokeDasharray={isActive ? 'none' : '4 6'}
                                                        className="transition-all duration-500"
                                                    />

                                                    {/* Particle traveling along the path */}
                                                    {isActive && (
                                                        <g>
                                                            {/* Glow */}
                                                            <circle r="8" fill={agent.color} opacity="0.4">
                                                                <animateMotion dur="1.2s" repeatCount="indefinite" path={reversePathD} />
                                                                <animate attributeName="opacity" values="0.4;0" dur="1.2s" repeatCount="indefinite" />
                                                                <animate attributeName="r" values="8;3" dur="1.2s" repeatCount="indefinite" />
                                                            </circle>
                                                            {/* Core */}
                                                            <circle r="3" fill="#fff">
                                                                <animateMotion dur="1.2s" repeatCount="indefinite" path={reversePathD} />
                                                                <animate attributeName="opacity" values="1;0" dur="1.2s" repeatCount="indefinite" />
                                                                <animate attributeName="r" values="3;1" dur="1.2s" repeatCount="indefinite" />
                                                            </circle>
                                                        </g>
                                                    )}
                                                </svg>
                                            );
                                        })()}

                                        {/* Agent Node */}
                                        <motion.div
                                            className="absolute z-20"
                                            style={{
                                                top: '50%',
                                                left: '50%',
                                                x: pos.x - 32, // Exact center of icon is end of line
                                                y: pos.y - 32,
                                                width: 64,
                                                height: 64,
                                            }}
                                        >
                                            {/* Permanent Counter-rotation Layer */}
                                            <motion.div
                                                className="absolute inset-0"
                                                animate={{ rotate: -360 }}
                                                transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
                                            >
                                                {/* State-driven Animation Layer (Opacity/Scale) */}
                                                <motion.div
                                                    className="w-full h-full"
                                                    animate={{
                                                        opacity: isActive ? 1 : 0.6,
                                                        scale: isActive ? 1.05 : 0.9,
                                                    }}
                                                    transition={{ duration: 0.4 }}
                                                >
                                                    {/* Icon */}
                                                    <div
                                                        className={`flex items-center justify-center w-full h-full rounded-2xl border backdrop-blur-md transition-all duration-500 ${isActive ? `${agent.bgClass} ${agent.borderClass}` : 'bg-white/[0.05] border-white/[0.15]'
                                                            }`}
                                                    >
                                                        <agent.icon
                                                            className="w-6 h-6 transition-colors duration-500"
                                                            style={{ color: isActive ? agent.color : 'rgba(255,255,255,0.5)' }}
                                                        />
                                                    </div>

                                                    {/* Label (Absolute below) */}
                                                    <span
                                                        className="absolute top-[calc(100%+6px)] left-1/2 -translate-x-1/2 text-[9px] font-mono tracking-wide transition-colors duration-500 whitespace-nowrap"
                                                        style={{ color: isActive ? agent.color : 'rgba(255,255,255,0.4)' }}
                                                    >
                                                        {agent.name}
                                                    </span>
                                                </motion.div>
                                            </motion.div>
                                        </motion.div>

                                        {/* Query Bubble (Radial Outwards & Counter-Rotating) */}
                                        <div
                                            className="absolute z-30"
                                            style={{
                                                top: `calc(50% + ${pos.y * 1.55}px)`,
                                                left: `calc(50% + ${pos.x * 1.55}px)`,
                                                pointerEvents: 'none',
                                            }}
                                        >
                                            <motion.div
                                                className="absolute"
                                                style={{ x: '-50%', y: '-50%' }}
                                                animate={{ rotate: -360 }}
                                                transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
                                            >
                                                <AnimatePresence>
                                                    {isActive && (
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 0.95 }}
                                                            transition={{ duration: 0.4 }}
                                                            className="flex flex-col items-center gap-1"
                                                        >
                                                            <div className="whitespace-nowrap px-3 py-1.5 rounded-md bg-black/80 border text-[9px] text-white font-mono shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                                                                style={{ borderColor: `${agent.color}50` }}>
                                                                {agent.mockQuery}
                                                            </div>
                                                            {agent.parentDeps.length > 0 && (
                                                                <div className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[8px] text-white/50 font-mono flex items-center gap-1">
                                                                    {agent.dagStep ? (
                                                                        <>
                                                                            <span style={{ color: '#a1a1aa' }}>{agent.dagStep}</span>
                                                                            <span className="text-white/20">|</span>
                                                                            <span>↳</span>
                                                                            <span style={{ color: agent.color }}>{agent.parentDeps.join(', ')}</span>
                                                                        </>
                                                                    ) : (
                                                                        <span style={{ color: '#a1a1aa' }}>{agent.parentDeps[0]}</span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                        </div>
                                    </div>
                                );
                            })}
                        </motion.div>
                    </motion.div>

                    {/* RIGHT: Console + Explanation */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="flex flex-col justify-center"
                    >
                        <h3 className="text-2xl font-display font-semibold text-white mb-3 flex items-center gap-2">
                            <Database className="w-5 h-5 text-accent-primary" />
                            Live Network Console
                        </h3>
                        <p className="text-sm text-text-muted mb-6 leading-relaxed">
                            External agents use UCP-compatible JSON payloads and native HBAR micropayments to request proofs entirely code-to-code, settling immediately on Hashgraph.
                        </p>

                        {/* Terminal */}
                        <div className="w-full rounded-xl border border-white/10 bg-[#0a0f1a] overflow-hidden shadow-2xl">
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.02] border-b border-white/5">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                                <span className="ml-3 text-[10px] font-mono text-text-muted/40">openclaw-swarm.js</span>
                            </div>
                            <div className="p-4 h-56 overflow-hidden font-mono text-[11px] leading-[1.8] flex flex-col justify-end">
                                <AnimatePresence initial={false}>
                                    {logs.map((log, idx) => (
                                        <motion.div
                                            key={idx + log.text}
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className={
                                                log.type === 'sys' ? 'text-green-400' :
                                                    log.type === 'hcs' ? 'text-cyan-400' :
                                                        log.type === 'proof' ? 'text-purple-300/80' :
                                                            log.type === 'sep' ? 'text-white/10' :
                                                                'text-text-muted/70'
                                            }
                                        >
                                            {log.text}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                <div className="flex items-center mt-1.5">
                                    <span className="text-cyan-400/60 mr-2 text-xs">❯</span>
                                    <span className="w-1.5 h-3.5 bg-white/80 animate-pulse" />
                                </div>
                            </div>
                        </div>

                        {/* CTA */}
                        <div className="mt-6">
                            <a
                                href="https://github.com/Handilusa/ProofFlow/blob/main/packages/backend/src/scripts/openclaw-swarm.js"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white transition-all"
                            >
                                <span>View Integration Script →</span>
                            </a>
                        </div>
                    </motion.div>

                </div >

                {/* PROTOCOL ADVANTAGES */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    {[
                        {
                            icon: GitBranch,
                            title: 'Composable DAG',
                            desc: 'Agents quote each other via Parent IDs, building an immutable Directed Acyclic Graph of reasoning.',
                            color: 'text-purple-400'
                        },
                        {
                            icon: Search,
                            title: 'Trustless Lineage',
                            desc: 'Recursive verification traces every "thought" back to its HCS origin and EVM settlement.',
                            color: 'text-blue-400'
                        },
                        {
                            icon: Zap,
                            title: 'Agentic Commerce',
                            desc: 'Native HBAR micro-fees enable autonomous, code-to-code service settlement at enterprise scale.',
                            color: 'text-yellow-400'
                        },
                        {
                            icon: Boxes,
                            title: 'Verifiable Oracle',
                            desc: 'ProofFlow removes the "Black Box" of AI, acting as a secure reasoning layer for the Agentic Society.',
                            color: 'text-teal-400'
                        }
                    ].map((feature, i) => (
                        <div key={i} className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all group">
                            <feature.icon className={`w-6 h-6 ${feature.color} mb-4 group-hover:scale-110 transition-transform`} />
                            <h4 className="text-white font-semibold mb-2 text-sm uppercase tracking-wider">{feature.title}</h4>
                            <p className="text-xs text-text-muted leading-relaxed">
                                {feature.desc}
                            </p>
                        </div>
                    ))}
                </motion.div>

                {/* THE KILLER EDGE / COMPARISON */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-24 p-8 lg:p-12 rounded-3xl bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10 border border-white/10 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Star className="w-32 h-32 text-cyan-400 rotate-12" />
                    </div>

                    <div className="relative z-10 max-w-3xl">
                        <h3 className="text-2xl lg:text-3xl font-display font-bold text-white mb-6 flex items-center gap-3">
                            <span className="px-2 py-1 rounded bg-cyan-500 text-black text-xs uppercase tracking-tighter">Killer Edge</span>
                            Why ProofFlow?
                        </h3>

                        <div className="space-y-6 text-sm lg:text-base text-text-muted leading-relaxed">
                            <p>
                                Traditional AI agents (AutoGPT, LangChain) operate in a <strong className="text-white">Black Box</strong>. You have to trust the developer, the server, and the state. In high-stakes environments like DeFi or Enterprise Security, "trust" is a vulnerability.
                            </p>

                            <div className="grid sm:grid-cols-2 gap-8 mt-8">
                                <div className="space-y-3">
                                    <h5 className="text-white font-semibold flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                        Professional Agents
                                    </h5>
                                    <ul className="space-y-2 text-xs opacity-70 list-disc ml-4">
                                        <li>Centralized API dependencies</li>
                                        <li>Private, opaque reasoning logs</li>
                                        <li>No cross-agent verification</li>
                                        <li>Web2 subscription models (Credit Cards)</li>
                                    </ul>
                                </div>
                                <div className="space-y-3">
                                    <h5 className="text-cyan-400 font-semibold flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                        ProofFlow (The Killer Edge)
                                    </h5>
                                    <ul className="space-y-2 text-xs text-cyan-100/80 list-disc ml-4">
                                        <li><strong>Verifiable DAG</strong>: Inmutable reasoning chain</li>
                                        <li><strong>On-Chain Proofs</strong> (HCS + EVM settlement)</li>
                                        <li><strong>Protocol Native</strong>: HBAR micro-fees per step</li>
                                        <li><strong>Audit-First</strong>: Every "thought" is a public hash</li>
                                    </ul>
                                </div>
                            </div>

                            <p className="mt-8 italic text-xs border-l-2 border-cyan-500/30 pl-4 bg-cyan-500/5 py-3 rounded-r-lg">
                                "ProofFlow is the <strong>Git of Reasoning</strong>. It transforms AI from a chat interface into a verifiable infrastructure for the Agentic Society."
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
