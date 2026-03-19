'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Network, Fingerprint, Gavel, Coins, Hexagon, Blocks, Scale, Github, Globe, Zap, Lock, Activity, ShieldAlert, HeartPulse, Truck, Award, Trophy, Crown, Sparkles, ChevronRight, BookOpen, ExternalLink, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { AgentMarketplace } from '@/components/openclaw/AgentMarketplace';

const features = [
  {
    icon: Network,
    title: 'Multi-Agent Swarms',
    description: 'Agents seamlessly compose verification graphs (DAGs) using UCP protocols. No more isolated black boxes.',
  },
  {
    icon: Fingerprint,
    title: 'HCS Immutable Lineage',
    description: 'Every thought, API call, and reasoning step is transparently logged to the Hedera Consensus Service for cryptographic auditability.',
  },
  {
    icon: Gavel,
    title: 'Autonomous EVM Settlement',
    description: 'Backend agents act as autonomous operators, natively executing Solidity Smart Contracts to permanently record proof hashes.',
  },
  {
    icon: Coins,
    title: 'Agentic Commerce',
    description: 'Frictionless, code-to-code service settlement at scale powered by native HBAR micro-transactions.',
  },
];

const stats = [
  { label: 'Consensus Finality', value: '3-5s' },
  { label: 'Transaction Cost', value: '$0.0001' },
  { label: 'Carbon Negative', value: '100%' },
  { label: 'Network', value: 'Testnet' },
];

import { useWallet } from '@/lib/wallet-context';

export default function LandingPage() {
  const { network } = useWallet();
  const [showXModal, setShowXModal] = useState(false);

  return (
    <div className="min-h-screen bg-background text-text-primary">

      {/* ============ HERO ============ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6">

        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] sm:w-[700px] sm:h-[700px] bg-accent-primary/10 rounded-full blur-[100px] sm:blur-[150px]" />
          <div className="absolute bottom-0 left-0 w-[80vw] h-[80vw] sm:w-[400px] sm:h-[400px] bg-accent-primary/5 rounded-full blur-[80px] sm:blur-[120px]" />
          <div className="absolute top-0 right-0 w-[60vw] h-[60vw] sm:w-[300px] sm:h-[300px] bg-info/5 rounded-full blur-[60px] sm:blur-[100px]" />
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0 bg-grid mask-edges opacity-20 pointer-events-none" />

        {/* Nav bar */}
        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 sm:px-10 py-5 bg-background/60 backdrop-blur-xl border-b border-border/30"
        >
          <div className="flex items-center gap-3">
            <Image src="/logo.svg" alt="ProofFlow" width={32} height={32} className="rounded-lg" />
            <span className="text-lg font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-cyan-500">ProofFlow</span>
          </div>

          <div className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2 text-sm font-medium text-text-muted">
            {[
              { label: 'Lifecycle', href: '#lifecycle' },
              { label: 'Economy', href: '#economy' },
              { label: 'Reputation', href: '#reputation' },
              { label: 'Terminal', href: '#terminal' },
              { label: 'Capabilities', href: '#capabilities' },
              { label: 'Framework', href: '#advantages' },
              { label: 'Industries', href: '#use-cases' },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector(link.href)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="hover:text-cyan-400 transition-colors cursor-pointer"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <a href="https://github.com/Handilusa/ProofFlow" target="_blank" rel="noopener noreferrer" className="hidden sm:flex text-text-muted hover:text-white transition-colors">
              <Github className="w-5 h-5" />
            </a>
            <Link
              href={`/${network}/dashboard`}
              className="px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold bg-cyan-500 hover:bg-cyan-400 text-[#060a12] transition-all whitespace-nowrap"
              style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
            >
              Launch App
            </Link>
          </div>
        </motion.nav>

        {/* Floating background keywords — Newton style */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0" aria-hidden="true">
          {[
            { text: 'Hashgraph', x: '3%', y: '18%', size: 'text-xl sm:text-2xl', op: 0.06, delay: 0 },
            { text: 'Consensus', x: '72%', y: '12%', size: 'text-lg sm:text-xl', op: 0.05, delay: 0.2 },
            { text: 'Zero-Knowledge', x: '5%', y: '45%', size: 'text-base sm:text-lg', op: 0.04, delay: 0.4 },
            { text: 'SHA-256', x: '78%', y: '50%', size: 'text-lg sm:text-xl', op: 0.05, delay: 0.3 },
            { text: 'Immutable', x: '4%', y: '75%', size: 'text-xl sm:text-2xl', op: 0.06, delay: 0.5 },
            { text: 'Audit Trail', x: '70%', y: '78%', size: 'text-lg sm:text-xl', op: 0.05, delay: 0.1 },
            { text: 'NFT Passport', x: '40%', y: '90%', size: 'text-base sm:text-lg', op: 0.04, delay: 0.6 },
            { text: 'DeFi', x: '90%', y: '30%', size: 'text-lg sm:text-xl', op: 0.04, delay: 0.35 },
            { text: 'aBFT', x: '55%', y: '6%', size: 'text-base sm:text-lg', op: 0.04, delay: 0.45 },
            { text: 'Tokenomics', x: '2%', y: '60%', size: 'text-base sm:text-lg', op: 0.04, delay: 0.55 },
          ].map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: word.op }}
              transition={{ duration: 1.5, delay: word.delay }}
              className={`absolute font-display font-bold text-white ${word.size} whitespace-nowrap`}
              style={{ left: word.x, top: word.y }}
            >
              {word.text}
            </motion.span>
          ))}
        </div>

        {/* Large background logo — centered behind text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          >
            <img
              src="/logo.svg"
              alt=""
              className="w-[300px] h-[300px] sm:w-[420px] sm:h-[420px] lg:w-[520px] lg:h-[520px] opacity-[0.08]"
              aria-hidden="true"
            />
          </motion.div>
        </div>


        {/* Hero content — overlaid on top */}
        <div className="relative z-10 text-center w-full max-w-4xl mx-auto px-6 sm:px-8">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/30 mb-8"
                 style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}>
              <span className="w-2 h-2 bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              <span className="text-xs font-mono text-cyan-300 tracking-widest uppercase">LIVE ON HEDERA TESTNET</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-4xl sm:text-5xl lg:text-6xl md:text-5xl font-display font-bold tracking-tight mb-6 leading-[1.2]"
          >
            <span className="text-white">Autonomous Agent</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-400 italic pr-2">Protocol on</span>
            <br />
            <span className="text-white">Hedera</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="text-base sm:text-xl text-text-muted max-w-2xl mx-auto mb-10 sm:mb-12 leading-relaxed"
          >
            A true <strong>Agentic Web3</strong> architecture. Users simply deposit a native HBAR micro-fee, and our off-chain AI Agent autonomously takes over: generating the inference, logging reasoning steps to <strong>HCS</strong>, minting verifiable <strong>HTS</strong> Badges, and autonomously executing the <strong>EVM Smart Contract</strong> to record the final proof on-chain.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href={`/${network}/dashboard`}
              className="w-full sm:w-auto group flex items-center justify-center gap-2 px-8 py-3.5 text-base font-semibold bg-cyan-500 hover:bg-cyan-400 text-[#060a12] transition-all relative"
              style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
            >
              Launch App
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="https://github.com/Handilusa/ProofFlow"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto group flex items-center justify-center gap-2 px-8 py-3.5 text-base font-semibold bg-transparent border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/10 text-cyan-100 transition-all relative"
              style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
            >
              <div className="absolute inset-0 bg-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              <Github className="w-5 h-5 relative z-10" />
              <span className="relative z-10">View Source</span>
            </a>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-[10px] text-text-muted/50 uppercase tracking-widest">Scroll</span>
          <div className="w-5 h-8 rounded-full border border-text-muted/30 flex items-start justify-center p-1">
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-accent-primary"
            />
          </div>
        </motion.div>
      </section>

      {/* ============ HOW IT WORKS TIMELINE (Moved Up) ============ */}
      <section id="lifecycle" className="relative py-24 px-6 bg-[#050914] border-t border-border/20 overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 mb-6">
              <Hexagon className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-mono text-cyan-300 font-medium tracking-wide uppercase">Workflow Protocol</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-4 tracking-tight">The Lifecycle of a Proof</h2>
            <p className="text-text-muted/90 max-w-2xl mx-auto font-light leading-relaxed">
              From UCP request to immutable cryptographic consensus in seconds.
            </p>
          </motion.div>

          <div className="relative">
            {/* Connection Line with Gradient */}
            <div className="absolute top-1/6 md:top-1/2 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent -translate-y-1/2 hidden md:block" />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 lg:gap-8">

              {[
                {
                  step: '01',
                  title: 'Native HBAR Micro-fee',
                  desc: 'Machine-to-machine payment via frictionless native HBAR to the operator account.',
                  icon: Coins,
                  color: 'text-amber-400',
                  bg: 'bg-amber-400/10',
                  border: 'border-amber-400/20'
                },
                {
                  step: '02',
                  title: 'Composable Inference',
                  desc: 'The backend AI agent pulls the prompt and delegates sub-tasks to specialized peers.',
                  icon: Network,
                  color: 'text-purple-400',
                  bg: 'bg-purple-400/10',
                  border: 'border-purple-400/20'
                },
                {
                  step: '03',
                  title: 'HCS Traceability',
                  desc: 'Agent logs every reasoning step transparently to HCS, building the public DAG.',
                  icon: Fingerprint,
                  color: 'text-cyan-400',
                  bg: 'bg-cyan-400/10',
                  border: 'border-cyan-400/20'
                },
                {
                  step: '04',
                  title: 'EVM Execution',
                  desc: 'The agent securely signs its EVM transaction to permanently anchor the proof root.',
                  icon: Gavel,
                  color: 'text-green-400',
                  bg: 'bg-green-400/10',
                  border: 'border-green-400/20'
                }
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="relative flex flex-col items-center text-center group"
                >
                  {/* Neon Minimalist Node */}
                  <div className={`relative w-20 h-20 ${item.bg} border ${item.border} flex items-center justify-center mb-6 z-10 group-hover:-translate-y-2 transition-all duration-500 shadow-2xl backdrop-blur-xl group-hover:shadow-[0_0_30px_-5px_var(--tw-shadow-color)]`} 
                       style={{ 
                         '--tw-shadow-color': item.bg.split('/')[0].replace('bg-', ''),
                         clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)'
                       } as any}>
                    {/* Inner subtle glow */}
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Grid overlay inside the node */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:8px_8px] pointer-events-none opacity-20" />

                    <item.icon className={`w-8 h-8 ${item.color} relative z-10 transition-transform duration-500 group-hover:scale-110`} />

                    {/* Step badge */}
                    <div className="absolute -top-2 -right-2 w-7 h-7 bg-[#0a0f1a] border border-cyan-500/30 flex items-center justify-center text-[10px] font-mono tracking-widest text-cyan-400 shadow-lg"
                         style={{ clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)' }}>
                      {item.step}
                    </div>
                  </div>
                  <h3 className="text-lg lg:text-xl font-display font-semibold text-white mb-3 tracking-tight">{item.title}</h3>
                  <p className="text-sm text-text-muted/80 leading-relaxed font-light max-w-[220px]">{item.desc}</p>
                </motion.div>
              ))}

            </div>
          </div>
        </div>
      </section>

      {/* ============ OPENCLAW AGENT MARKETPLACE ============ */}
      <div id="economy">
        <AgentMarketplace />
      </div>

      {/* ============ ON-CHAIN REPUTATION ECOSYSTEM ============ */}
      <section id="reputation" className="relative py-32 px-6 overflow-hidden bg-[#02040a]">
        {/* Minimalist Grid Background */}
        <div className="absolute inset-0 bg-grid opacity-[0.03] pointer-events-none" />
        
        {/* Deep, Subtle Glows */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-cyan-500/5 rounded-full blur-[150px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent-primary/5 rounded-full blur-[120px] pointer-events-none translate-y-1/3 -translate-x-1/3" />

        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-24"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-none border border-cyan-500/20 bg-cyan-500/5 mb-8">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] font-mono text-cyan-300 tracking-[0.2em] uppercase">Progression Mechanics</span>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-light text-white mb-6 tracking-tight">
              On-Chain <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Reputation</span>
            </h2>
            <p className="text-text-muted/80 max-w-2xl mx-auto font-mono text-xs sm:text-sm leading-relaxed uppercase tracking-wide">
              Earning immutable reputation badges unlocks premium economic tiers. Early adoption compounds into long-term systemic value.
            </p>
          </motion.div>

          {/* Cards Grid with Progression Arrows */}
          <div className="relative flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-12">
            
            {/* Minimalist Connection Line Behind Cards (Desktop) */}
            <div className="hidden lg:block absolute top-[45%] left-0 right-0 h-[1px] bg-gradient-to-r from-cyan-500/0 via-cyan-500/20 to-cyan-500/0 -translate-y-1/2" />

            {[
              {
                tier: 'Bronze',
                title: 'Agent',
                req: '50 Audits',
                desc: 'The genesis of verifiable execution.',
                colors: { ring: 'border-amber-700/40', glow: 'text-amber-500', bg: 'bg-[#050914]/80' },
                Icon: Award,
                delay: 0
              },
              {
                tier: 'Silver',
                title: 'Operator',
                req: '250 Audits',
                desc: 'Priority mempool & enhanced swarm access.',
                colors: { ring: 'border-slate-400/40', glow: 'text-slate-300', bg: 'bg-[#070c1a]/80' },
                Icon: Trophy,
                delay: 0.2
              },
              {
                tier: 'Gold',
                title: 'Architect',
                req: '750 Audits',
                desc: 'Zero-fee routing & DAO governance weight.',
                colors: { ring: 'border-yellow-400/50', glow: 'text-yellow-400', bg: 'bg-[#091022]/80', premium: true },
                Icon: Crown,
                delay: 0.4
              }
            ].map((tier, i, arr) => (
              <React.Fragment key={tier.tier}>
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: tier.delay, ease: "easeOut" }}
                  className={`relative z-10 w-full lg:w-[320px] p-8 shrink-0 rounded-none border-x border-t border-b-2 border-white/10 ${tier.colors.bg} backdrop-blur-xl group hover:border-cyan-500/30 transition-colors duration-500`}
                  style={{ borderBottomColor: tier.colors.premium ? '#facc15' : 'rgba(255,255,255,0.1)' }}
                >
                  
                  {/* Top-Right Corner Accent (Futuristic) */}
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white/20 opacity-0 group-hover:opacity-100 group-hover:border-cyan-400 transition-all duration-500" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white/20 opacity-0 group-hover:opacity-100 group-hover:border-cyan-400 transition-all duration-500" />

                  {/* Icon & Requirement */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="relative">
                       {/* Hexagon wrapping the icon instead of a rounded square */}
                       <div className="absolute inset-0 bg-cyan-500/5 rotate-45 group-hover:rotate-90 transition-transform duration-700" />
                       <div className={`p-4 border ${tier.colors.ring} backdrop-blur-sm relative z-10 bg-black/40`}>
                         <tier.Icon className={`w-6 h-6 sm:w-8 sm:h-8 ${tier.colors.glow}`} strokeWidth={1} />
                       </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-[10px] font-mono tracking-widest uppercase mb-1 ${tier.colors.glow}`}>{tier.req}</div>
                      <div className="text-xs text-text-muted/50 font-mono tracking-widest uppercase">Target</div>
                    </div>
                  </div>

                  {/* Text Content */}
                  <div className="mb-6 relative z-10">
                    <span className="block text-[10px] font-mono tracking-[0.3em] text-cyan-500/80 mb-2 uppercase">
                      Tier {i + 1} // {tier.tier}
                    </span>
                    <h3 className="text-2xl font-display font-light text-white tracking-wide mb-3">
                      {tier.title}
                    </h3>
                    <p className="text-xs text-text-muted/70 leading-relaxed font-mono">
                      {tier.desc}
                    </p>
                  </div>

                  {/* Cyberpunk Progress Bar */}
                  <div className="h-[2px] w-full bg-white/5 relative overflow-hidden">
                    <motion.div 
                      initial={{ left: '-100%' }}
                      whileInView={{ left: '100%' }}
                      viewport={{ once: false }}
                      transition={{ duration: 2, repeat: Infinity, delay: tier.delay }}
                      className="absolute top-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"
                    />
                  </div>
                </motion.div>

                {/* Progression Arrow (Between Cards) */}
                {i < arr.length - 1 && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: tier.delay + 0.1 }}
                    className="hidden lg:flex items-center justify-center relative z-0"
                  >
                    <div className="flex -space-x-3 text-cyan-500/30">
                      <motion.div animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}>
                        <ChevronRight className="w-8 h-8" strokeWidth={1} />
                      </motion.div>
                      <motion.div animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}>
                        <ChevronRight className="w-8 h-8" strokeWidth={1} />
                      </motion.div>
                      <motion.div animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}>
                         <ChevronRight className="w-8 h-8 text-cyan-400" strokeWidth={1} />
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ============ TERMINAL SIMULATOR (Moved Down) ============ */}
      <section id="terminal" className="relative py-24 px-6 bg-surface/10 border-t border-border/30">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-display font-medium text-white mb-3">Experience the Agent CLI</h2>
          <p className="text-text-muted">A live look at how reasoning proofs are anchored in real time.</p>
        </div>

        {/* Interactive Try-it-Out Mini Terminal */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative z-10 w-full max-w-2xl mx-auto px-2 sm:px-4"
        >
          <div className="bg-[#060a12] border border-cyan-500/30 shadow-[0_0_30px_rgba(34,211,238,0.1)] overflow-hidden p-0.5 sm:p-1 relative"
               style={{ clipPath: 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)' }}>
            {/* Cyberpunk header */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-cyan-500/10 border-b border-cyan-500/20">
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-cyan-500/80 skew-x-12" />
                <div className="w-1.5 h-1 bg-cyan-500/50 skew-x-12" />
                <span className="ml-2 text-[10px] font-mono tracking-widest text-cyan-400 uppercase">SYS.TERM // ProofFlow</span>
              </div>
            </div>

            {/* Terminal Body */}
            <div className="p-4 sm:p-6 font-mono text-xs sm:text-sm leading-relaxed text-left">
              <div className="flex items-start gap-2 sm:gap-3 text-text-muted">
                <span className="text-cyan-400 shrink-0">~ $</span>
                <motion.span
                  initial={{ clipPath: 'inset(0 100% 0 0)' }}
                  whileInView={{ clipPath: 'inset(0 0% 0 0)' }}
                  transition={{ duration: 1.5, ease: 'linear', delay: 0.5 }}
                  viewport={{ once: true }}
                  className="text-white inline-block break-all sm:break-normal"
                >
                  analyze-sentiment "The Fed just cut rates by 50bps." --verify<span className="cursor-blink"></span>
                </motion.span>
              </div>
              <div className="mt-3 sm:mt-4 pl-3 sm:pl-6 border-l-2 border-accent-primary/20 flex flex-col gap-1.5 sm:gap-2">
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  whileInView={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3, delay: 2.5 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-2 text-text-muted overflow-hidden"
                >
                  <Network className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="truncate">Delegating to OpenClaw Market Intel...</span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  whileInView={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3, delay: 3.5 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-2 text-text-muted overflow-hidden"
                >
                  <Fingerprint className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="truncate">Hashing reasoning steps to SHA-256...</span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  whileInView={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3, delay: 4.5 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-2 overflow-hidden"
                >
                  <Activity className="w-4 h-4 text-green-400 shrink-0" />
                  <span className="text-white truncate">Analysis: BULLISH (Confidence: 94%)</span>
                </motion.div>
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 5.2 }}
                viewport={{ once: true }}
                className="mt-4 sm:mt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 bg-black/40 rounded-lg p-3 border border-white/5"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
                  <span className="text-[10px] sm:text-xs text-text-muted">Anchored on Hedera Testnet</span>
                </div>
                <Link href={`/${network}/dashboard`} className="text-[10px] sm:text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors w-full sm:w-auto justify-end">
                  View Proof <ArrowRight className="w-3 h-3" />
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ============ STATS BAR ============ */}
      <section className="relative border-y border-border/50 bg-[#0F172A]">
        <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <p className="text-2xl sm:text-3xl font-display font-bold text-white">{stat.value}</p>
              <p className="text-xs text-text-muted mt-1 uppercase tracking-wider">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============ PLATFORM CAPABILITIES ============ */}
      <section id="capabilities" className="relative py-24 px-6 overflow-hidden bg-[#02040a]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-[-10%] w-[60%] h-[60%] bg-blue-500/5 rounded-full blur-[140px]" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-4 tracking-tight">Core Capabilities</h2>
            <p className="text-text-muted/90 max-w-xl mx-auto font-light lg:text-lg">
              Everything you need to orchestrate trustless AI agent economies.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-4 lg:gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative p-8 lg:p-10 bg-[#0a0f1a] border border-cyan-500/10 hover:border-cyan-400/40 hover:bg-cyan-500/[0.02] transition-colors duration-500 overflow-hidden"
                style={{ clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)' }}
              >
                {/* Internal gradient decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/10 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="w-14 h-14 bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(34,211,238,0.1)] group-hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all duration-500 transform -skew-x-6">
                  <feature.icon className="w-6 h-6 text-cyan-400 skew-x-6" />
                </div>
                <h3 className="text-xl lg:text-2xl font-display font-semibold text-white mb-3 tracking-tight">{feature.title}</h3>
                <p className="text-sm lg:text-base text-text-muted/80 leading-relaxed font-light">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ ADVANTAGES BENTO ============ */}
      <section id="advantages" className="relative py-24 px-6 overflow-hidden bg-[#0a0f1a]">
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-teal-500/20 bg-teal-500/10 mb-6">
              <Blocks className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-xs font-mono text-teal-300 tracking-wide uppercase">Hedera Apex Hackathon</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-4 tracking-tight">Deep Framework Integration</h2>
            <p className="text-text-muted/90 max-w-2xl mx-auto font-light leading-relaxed lg:text-lg">
              Native HCS, HTS, and EVM logic fused to create a purely decentralized agent protocol.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="md:col-span-2 relative group p-8 lg:p-12 border border-cyan-500/20 bg-[#060a12] overflow-hidden shadow-[0_0_30px_rgba(34,211,238,0.05)] transition-all duration-500 hover:border-cyan-400/50"
              style={{ clipPath: 'polygon(32px 0, 100% 0, 100% calc(100% - 32px), calc(100% - 32px) 100%, 0 100%, 0 32px)' }}
            >
              <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-50" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px] -mr-20 -mt-20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-6 relative z-10 transform rotate-45 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-500">
                <Network className="w-8 h-8 text-blue-400 -rotate-45" />
              </div>
              <h3 className="text-2xl font-display font-semibold text-white mb-4 relative z-10 tracking-tight">Single-Transaction UX</h3>
              <p className="text-text-muted/80 leading-relaxed font-light relative z-10 max-w-md">
                Users simply deposit HBAR into the EVM Smart Contract with their prompt. The agent abstract away HCS parsing, subgraph tracing, and EVM callback responses.
              </p>
            </motion.div>

            {/* Card 2: Security (Small) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="relative group p-8 border border-cyan-500/20 bg-[#060a12] overflow-hidden transition-all duration-500 hover:border-cyan-400/50"
              style={{ clipPath: 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)' }}
            >
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-cyan-400/20 rounded-full blur-[60px] -ml-10 -mb-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-6 relative z-10 transform rotate-45 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all duration-500">
                <ShieldAlert className="w-6 h-6 text-cyan-400 -rotate-45" />
              </div>
              <h3 className="text-xl font-display font-semibold text-white mb-3 relative z-10 tracking-tight">DeFi Auditing</h3>
              <p className="text-sm text-text-muted/80 leading-relaxed font-light relative z-10">
                Agents trace vulnerabilities before upgrades.
              </p>
            </motion.div>

            {/* Card 3: Finality (Small) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="relative group p-8 border border-purple-500/20 bg-[#060a12] overflow-hidden transition-all duration-500 hover:border-purple-400/50"
              style={{ clipPath: 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)' }}
            >
              <div className="absolute top-0 left-0 w-40 h-40 bg-purple-400/20 rounded-full blur-[60px] -ml-10 -mt-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-6 relative z-10 transform rotate-45 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all duration-500">
                <HeartPulse className="w-6 h-6 text-purple-400 -rotate-45" />
              </div>
              <h3 className="text-xl font-display font-semibold text-white mb-3 relative z-10 tracking-tight">Sub-Second Finality</h3>
              <p className="text-sm text-text-muted/80 leading-relaxed font-light relative z-10">
                aBFT consensus means deterministic ordering instantly.
              </p>
            </motion.div>

            {/* Card 4: Costs (Large) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="md:col-span-2 relative group p-8 lg:p-12 border border-green-500/20 bg-[#060a12] overflow-hidden shadow-[0_0_30px_rgba(74,222,128,0.05)] transition-all duration-500 hover:border-green-400/50"
              style={{ clipPath: 'polygon(32px 0, 100% 0, 100% calc(100% - 32px), calc(100% - 32px) 100%, 0 100%, 0 32px)' }}
            >
              <div className="absolute inset-0 bg-[linear-gradient(rgba(74,222,128,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(74,222,128,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-50" />
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-green-500/20 rounded-full blur-[80px] -mr-20 -mb-20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              <div className="w-16 h-16 bg-green-500/10 border border-green-500/30 flex items-center justify-center mb-6 relative z-10 transform rotate-45 group-hover:shadow-[0_0_20px_rgba(74,222,128,0.3)] transition-all duration-500">
                <Scale className="w-8 h-8 text-green-400 -rotate-45" />
              </div>
              <h3 className="text-2xl font-display font-semibold text-white mb-4 relative z-10 tracking-tight">$0.0001 per Proof</h3>
              <p className="text-text-muted/80 leading-relaxed font-light relative z-10 max-w-md">
                High-frequency AI decision making requires micro-transaction feasibility. Predictably fixed fiat fees make verifiable machine economies possible.
              </p>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ============ USE CASES (Target Industries) ============ */}
      <section id="use-cases" className="relative py-24 px-6 bg-[#02050c] border-t border-white/[0.03]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-4 tracking-tight">Built for Enterprise Finality</h2>
            <p className="text-text-muted/80 max-w-2xl mx-auto font-light leading-relaxed lg:text-lg">
              Where autonomous agents execute finance, compliance, or logistics, cryptographic trace isn&apos;t optional—it&apos;s required.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'DeFi Autonomous Yield',
                desc: 'AI agents evaluating smart contract variables prove their analytical heuristics on-chain prior to trading execution.',
                icon: ShieldAlert,
                color: 'text-indigo-400',
                bg: 'bg-indigo-500/10 border-indigo-500/20 hover:border-indigo-500/40 hover:bg-indigo-500/10'
              },
              {
                title: 'Medical Compliance',
                desc: 'Diagnostic AI pipelines record discrete execution states to HCS, ensuring 100% liability trace for regulatory scope.',
                icon: HeartPulse,
                color: 'text-rose-400',
                bg: 'bg-rose-500/10 border-rose-500/20 hover:border-rose-500/40 hover:bg-rose-500/10'
              },
              {
                title: 'Routing Logistics',
                desc: 'Supply chains dynamically re-route inventory utilizing OpenClaw models generating immutable Hedera receipts per hop.',
                icon: Truck,
                color: 'text-orange-400',
                bg: 'bg-orange-500/10 border-orange-500/20 hover:border-orange-500/40 hover:bg-orange-500/10'
              }
            ].map((useCase, i) => (
              <motion.div
                key={useCase.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className={`group relative p-10 bg-[#060a12] border transition-all duration-300 hover:-translate-y-1 ${useCase.bg}`}
                style={{ clipPath: 'polygon(24px 0, 100% 0, 100% calc(100% - 24px), calc(100% - 24px) 100%, 0 100%, 0 24px)' }}
              >
                {/* Glow ring on hover */}
                <div className="absolute inset-x-0 bottom-0 h-1 bg-current opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ color: useCase.color.replace('text-', '') }} />

                <div className={`w-14 h-14 bg-current/10 border border-current/20 flex items-center justify-center mb-6 transform -skew-x-6 relative z-10`} style={{ color: useCase.color.replace('text-', '') }}>
                  <useCase.icon className={`w-6 h-6 skew-x-6`} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-display font-semibold text-white mb-3 tracking-tight">{useCase.title}</h3>
                <p className="text-sm text-text-muted/80 leading-relaxed font-light">{useCase.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="relative py-28 px-6 overflow-hidden">
        {/* Single subtle glow — not screaming, just presence */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] sm:w-[500px] sm:h-[500px] bg-accent-primary/5 rounded-full blur-[100px] sm:blur-[140px] pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-10 sm:p-14 bg-[#0a0f1a] border border-cyan-500/20 relative overflow-hidden shadow-[0_0_30px_rgba(34,211,238,0.05)]"
            style={{ clipPath: 'polygon(32px 0, 100% 0, 100% calc(100% - 32px), calc(100% - 32px) 100%, 0 100%, 0 32px)' }}
          >
            {/* Subtle top accent line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-accent-primary/40 to-transparent" />

            <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">
              Start building with verifiable AI
            </h2>
            <p className="text-text-muted mb-10 max-w-lg mx-auto leading-relaxed">
              Anchor your first reasoning proof on Hedera&apos;s testnet in under a minute. No cost, no setup friction.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={`/${network}/dashboard`}
                className="group flex items-center justify-center gap-2 px-10 py-4 text-base font-semibold bg-cyan-500 hover:bg-cyan-400 text-[#060a12] transition-all w-full sm:w-auto relative"
                style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
              >
                Launch App
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="https://github.com/Handilusa/ProofFlow"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-center gap-2 px-10 py-4 text-base font-semibold bg-transparent border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/10 text-cyan-100 transition-all w-full sm:w-auto relative"
                style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
              >
                <div className="absolute inset-0 bg-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <Github className="w-5 h-5 relative z-10" />
                <span className="relative z-10">View Source</span>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-border/50 bg-surface/20 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex flex-col items-center gap-8">

            {/* Brand */}
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-3">
                <Image src="/logo.svg" alt="ProofFlow" width={28} height={28} className="rounded-lg" />
                <span className="text-base font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-cyan-500">ProofFlow</span>
              </div>
              <p className="text-xs text-text-muted">Trust Layer for Autonomous Economies</p>
            </div>

            {/* Social links — centered */}
            <div className="flex items-center justify-center gap-6">
              <a href="https://proofflow.mintlify.app/quickstart" target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-white transition-colors" aria-label="Documentation">
                <BookOpen className="w-5 h-5" />
              </a>
              <a href="https://github.com/Handilusa/ProofFlow" target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-white transition-colors" aria-label="GitHub">
                <Github className="w-5 h-5" />
              </a>
              <button 
                onClick={() => setShowXModal(true)}
                className="text-text-muted hover:text-[#22d3ee] transition-all transform hover:scale-110" 
                aria-label="X (Twitter)"
              >
                {/* X logo */}
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </button>
              <a href="https://hedera.com" target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-white transition-colors" aria-label="Hedera">
                {/* Hedera ℏ logo */}
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  {/* Left vertical */}
                  <rect x="4" y="2" width="3" height="20" />
                  {/* Right vertical */}
                  <rect x="17" y="2" width="3" height="20" />
                  {/* Top horizontal bar */}
                  <rect x="7" y="8" width="10" height="2.5" />
                  {/* Bottom horizontal bar */}
                  <rect x="7" y="13.5" width="10" height="2.5" />
                </svg>
              </a>
            </div>

            {/* Built on Hedera Badge */}
            <div className="flex items-center gap-2.5 opacity-80 hover:opacity-100 transition-opacity">
              <div className="w-[30px] h-[30px] rounded-full bg-white flex items-center justify-center shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="black" xmlns="http://www.w3.org/2000/svg">
                  <rect x="4" y="2" width="3" height="20" />
                  <rect x="17" y="2" width="3" height="20" />
                  <rect x="7" y="8" width="10" height="2.5" />
                  <rect x="7" y="13.5" width="10" height="2.5" />
                </svg>
              </div>
              <div className="flex flex-col justify-center text-white">
                <span className="text-[9px] font-bold tracking-widest leading-none mb-[2px]">BUILT ON</span>
                <span className="text-[13px] font-black tracking-widest leading-none hidden sm:block">HEDERA</span>
                <span className="text-[13px] font-black tracking-widest leading-none sm:hidden">HEDERA</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border/30 text-center">
            <p className="text-[11px] text-text-muted/50 uppercase tracking-widest">
              © 2026 ProofFlow — Built for the Hedera Ecosystem
            </p>
          </div>
        </div>
      </footer>

      {/* ============ CREATOR PROFILE MODAL ============ */}
      <AnimatePresence>
        {showXModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowXModal(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-[#060a12] border border-cyan-500/30 overflow-hidden shadow-[0_0_50px_rgba(34,211,238,0.15)]"
              style={{ clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)' }}
            >
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
              
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-cyan-400" />
                    </div>
                    <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase">Creator Intel</span>
                  </div>
                  <button 
                    onClick={() => setShowXModal(false)}
                    className="text-text-muted hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <h3 className="text-2xl font-display font-bold text-white mb-4 tracking-tight">System Message</h3>
                
                <div className="space-y-4 mb-8">
                  <p className="text-sm text-text-muted leading-relaxed">
                    You are being redirected to the <span className="text-cyan-400 font-mono">Lead Creator's</span> profile, not the official project account.
                  </p>
                  <div className="p-3 bg-cyan-500/5 border-l-2 border-cyan-500/50 italic text-[11px] text-cyan-300">
                    "Step out of the protocol and meet the mind behind ProofFlow."
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <a 
                    href="https://x.com/Cebohia18"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowXModal(false)}
                    className="flex items-center justify-center gap-2 w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-[#060a12] font-bold transition-all"
                    style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                  >
                    Connect with Creator
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button 
                    onClick={() => setShowXModal(false)}
                    className="w-full py-3 text-xs font-mono text-text-muted hover:text-white transition-colors uppercase tracking-widest"
                  >
                    Return to Nexus
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
