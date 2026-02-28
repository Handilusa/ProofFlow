'use client';

import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Brain, FileCheck, Award, Github, Globe, Zap, Lock, Activity } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const features = [
  {
    icon: Brain,
    title: 'AI Reasoning Engine',
    description: 'Powered by Gemini 2.5 Flash. Every reasoning step is decomposed, hashed, and made auditable before consensus.',
  },
  {
    icon: ShieldCheck,
    title: 'HCS Audit Trail',
    description: 'Each inference step is published to Hedera Consensus Service with cryptographic integrity — immutable and verifiable.',
  },
  {
    icon: FileCheck,
    title: 'On-Chain Verification',
    description: 'Verify any AI output against its on-chain proof. SHA-256 hashes ensure tamper-proof reasoning chains.',
  },
  {
    icon: Award,
    title: 'Audit Passport NFT',
    description: 'Every verified audit mints an NFT credential — your on-chain proof of trust for autonomous agent economies.',
  },
];

const stats = [
  { label: 'Consensus Finality', value: '3-5s' },
  { label: 'Transaction Cost', value: '$0.0001' },
  { label: 'Carbon Negative', value: '100%' },
  { label: 'Network', value: 'Testnet' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-text-primary">

      {/* ============ HERO ============ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6">

        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-accent-primary/10 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent-primary/5 rounded-full blur-[120px]" />
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-info/5 rounded-full blur-[100px]" />
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

          <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2 text-sm font-medium text-text-muted">
            <Link href="#terminal" className="hover:text-white transition-colors">Terminal</Link>
            <Link href="#lifecycle" className="hover:text-white transition-colors">Lifecycle</Link>
            <Link href="#capabilities" className="hover:text-white transition-colors">Capabilities</Link>
            <Link href="#advantages" className="hover:text-white transition-colors">Advantages</Link>
            <Link href="#use-cases" className="hover:text-white transition-colors">Use Cases</Link>
          </div>

          <div className="flex items-center gap-4">
            <a href="https://github.com/handi/proofflow-monorepo" target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-white transition-colors">
              <Github className="w-5 h-5" />
            </a>
            <Link
              href="/dashboard"
              className="px-5 py-2 text-sm font-semibold rounded-xl bg-accent-primary hover:bg-accent-secondary text-black transition-all shadow-glow-sm"
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
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent-primary/30 bg-accent-primary/5 mb-8">
              <span className="w-2 h-2 rounded-full bg-accent-primary animate-pulse" />
              <span className="text-xs font-mono text-accent-primary tracking-wide">LIVE ON HEDERA TESTNET</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tight mb-6 leading-[1.2]"
          >
            <span className="text-white">Verifiable AI</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-400 italic pr-2">anchored on</span>
            <br />
            <span className="text-white">Any chain</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="text-lg sm:text-xl text-text-muted max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            Every reasoning step is cryptographically hashed, published to Hedera Consensus Service,
            and made immutably verifiable. Zero trust required.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/dashboard"
              className="group flex items-center gap-2 px-8 py-3.5 text-base font-semibold rounded-xl bg-accent-primary hover:bg-accent-secondary text-black transition-all shadow-glow"
            >
              Launch App
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="https://github.com/handi/proofflow-monorepo"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-8 py-3.5 text-base font-semibold rounded-xl border border-border hover:border-accent-primary/50 text-text-muted hover:text-white transition-all"
            >
              <Github className="w-5 h-5" />
              View Source
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

      {/* ============ TERMINAL SIMULATOR ============ */}
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
          className="relative z-10 w-full max-w-2xl mx-auto px-4 hidden sm:block"
        >
          <div className="rounded-2xl border border-white/10 bg-[#0F172A]/80 backdrop-blur-xl shadow-2xl overflow-hidden p-1 relative">
            {/* Mac-like header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-white/[0.02] border-b border-white/5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="ml-4 text-xs font-mono text-text-muted/60">proofflow-agent-cli</span>
            </div>

            {/* Terminal Body */}
            <div className="p-6 font-mono text-sm leading-relaxed text-left">
              <div className="flex items-start gap-3 text-text-muted">
                <span className="text-cyan-400 shrink-0">~ $</span>
                <motion.span
                  initial={{ clipPath: 'inset(0 100% 0 0)' }}
                  whileInView={{ clipPath: 'inset(0 0% 0 0)' }}
                  transition={{ duration: 1.5, ease: 'linear', delay: 0.5 }}
                  viewport={{ once: true }}
                  className="text-white inline-block"
                >
                  analyze-sentiment "The Fed just cut rates by 50bps." --verify<span className="cursor-blink"></span>
                </motion.span>
              </div>
              <div className="mt-4 pl-6 border-l-2 border-accent-primary/20 flex flex-col gap-2">
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  whileInView={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3, delay: 2.5 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-2 text-text-muted overflow-hidden"
                >
                  <Zap className="w-4 h-4 text-yellow-400 shrink-0" />
                  <span className="truncate">Gemini Flash reasoning initiated...</span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  whileInView={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3, delay: 3.5 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-2 text-text-muted overflow-hidden"
                >
                  <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
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
                className="mt-5 flex items-center justify-between bg-black/40 rounded-lg p-3 border border-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
                  <span className="text-xs text-text-muted">Anchored on Hedera Testnet</span>
                </div>
                <Link href="/dashboard" className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
                  View Proof <ArrowRight className="w-3 h-3" />
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ============ HOW IT WORKS TIMELINE ============ */}
      <section id="lifecycle" className="relative py-24 px-6 bg-surface/20 border-t border-border/50">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-4">The Lifecycle of a Proof</h2>
            <p className="text-text-muted max-w-2xl mx-auto">
              From user prompt to immutable cryptographic consensus in seconds.
            </p>
          </motion.div>

          <div className="relative">
            {/* Connection Line */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent-primary/30 to-transparent -translate-y-1/2 hidden md:block" />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

              {[
                {
                  step: '01',
                  title: 'Inference',
                  desc: 'You ping an AI agent via ProofFlow. The agent decomposes its reasoning.',
                  icon: Brain,
                  color: 'text-blue-400',
                  bg: 'bg-blue-400/10'
                },
                {
                  step: '02',
                  title: 'Hashing',
                  desc: 'Every step is compressed into a unique SHA-256 cryptographic hash.',
                  icon: ShieldCheck,
                  color: 'text-purple-400',
                  bg: 'bg-purple-400/10'
                },
                {
                  step: '03',
                  title: 'Consensus',
                  desc: 'Hashes are pushed to Hedera (HCS) for fair ordering and timestamping.',
                  icon: Activity,
                  color: 'text-cyan-400',
                  bg: 'bg-cyan-400/10'
                },
                {
                  step: '04',
                  title: 'Passport NFT',
                  desc: 'A verification NFT is minted, providing a portable trust primitive.',
                  icon: Award,
                  color: 'text-yellow-400',
                  bg: 'bg-yellow-400/10'
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
                  {/* Circle Node */}
                  <div className={`w-16 h-16 rounded-2xl ${item.bg} border border-white/5 flex items-center justify-center mb-6 relative z-10 group-hover:-translate-y-2 transition-transform duration-300 shadow-xl backdrop-blur-md`}>
                    <item.icon className={`w-7 h-7 ${item.color}`} />
                    <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-surface border border-white/10 flex items-center justify-center text-[10px] font-bold text-white">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="text-xl font-display font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-sm text-text-muted leading-relaxed max-w-[200px]">{item.desc}</p>
                </motion.div>
              ))}

            </div>
          </div>
        </div>
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
      <section id="capabilities" className="relative py-24 px-6 border-t border-border/50">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-accent-primary/5 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">Core Capabilities</h2>
            <p className="text-text-muted max-w-xl mx-auto">
              Everything you need to orchestrate trustless AI agent economies.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-6 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm hover:border-accent-primary/30 hover:bg-white/[0.05] transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-surface border border-white/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-5 h-5 text-accent-primary" />
                </div>
                <h3 className="text-base font-display font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ ADVANTAGES BENTO ============ */}
      <section id="advantages" className="relative py-24 px-6 overflow-hidden">
        {/* Subtle background glow for depth */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/50 bg-surface/30 backdrop-blur-sm mb-4">
              <span className="text-xs font-mono text-cyan-400 tracking-wide uppercase">Why Choose ProofFlow</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-4">The ProofFlow Advantage</h2>
            <p className="text-text-muted max-w-2xl mx-auto">
              Built for the next generation of autonomous economies. Equip your Web3 and AI teams with cryptographic certainty.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Card 1: Zero-Trust (Large) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="md:col-span-2 relative group p-8 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl overflow-hidden shadow-2xl transition-all duration-300 hover:border-cyan-500/30 hover:bg-white/[0.04]"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/10 rounded-full blur-[80px] -mr-20 -mt-20 transition-opacity group-hover:opacity-100 opacity-50" />
              <Globe className="w-10 h-10 text-cyan-400 mb-6 relative z-10" />
              <h3 className="text-2xl font-display font-bold text-white mb-3 relative z-10">Zero-Trust Agent Economy</h3>
              <p className="text-text-muted leading-relaxed relative z-10 max-w-md">
                Enable true trustless AI interoperability. Autonomous agents can independently verify cryptographic proofs on Hedera before executing high-stakes smart contracts, eliminating the need for human arbitration.
              </p>
            </motion.div>

            {/* Card 2: Privacy (Small) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.02 }}
              className="relative group p-8 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl overflow-hidden shadow-2xl transition-all duration-300 hover:border-blue-400/30 hover:bg-white/[0.04]"
            >
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-400/10 rounded-full blur-[60px] -ml-10 -mb-10 transition-opacity group-hover:opacity-100 opacity-50" />
              <Lock className="w-10 h-10 text-blue-400 mb-6 relative z-10" />
              <h3 className="text-xl font-display font-bold text-white mb-3 relative z-10">Enterprise Privacy</h3>
              <p className="text-sm text-text-muted leading-relaxed relative z-10">
                Need to prove reasoning without revealing the proprietary model? Our architecture natively supports integration with Zero-Knowledge (zk) proofs.
              </p>
            </motion.div>

            {/* Card 3: Finality (Small) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02 }}
              className="relative group p-8 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl overflow-hidden shadow-2xl transition-all duration-300 hover:border-accent-primary/30 hover:bg-white/[0.04]"
            >
              <div className="absolute top-0 left-0 w-40 h-40 bg-accent-primary/10 rounded-full blur-[60px] -ml-10 -mt-10 transition-opacity group-hover:opacity-100 opacity-50" />
              <Activity className="w-10 h-10 text-accent-primary mb-6 relative z-10" />
              <h3 className="text-xl font-display font-bold text-white mb-3 relative z-10">Sub-Second Finality</h3>
              <p className="text-sm text-text-muted leading-relaxed relative z-10">
                Powered by aBFT consensus, proofs are finalized in 3-5 seconds with 100% deterministic ordering. No more waiting for block confirmations.
              </p>
            </motion.div>

            {/* Card 4: Costs (Large) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.02 }}
              className="md:col-span-2 relative group p-8 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl overflow-hidden shadow-2xl transition-all duration-300 hover:border-cyan-400/30 hover:bg-white/[0.04]"
            >
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-cyan-400/10 rounded-full blur-[80px] -mr-20 -mb-20 transition-opacity group-hover:opacity-100 opacity-50" />
              <Zap className="w-10 h-10 text-cyan-400 mb-6 relative z-10" />
              <h3 className="text-2xl font-display font-bold text-white mb-3 relative z-10">$0.0001 per Proof</h3>
              <p className="text-text-muted leading-relaxed relative z-10 max-w-md">
                High-frequency AI decision making requires micro-transaction feasibility. Hedera&apos;s consensus guarantees predictably low, fixed fiat fees, making verifiable intelligence economically viable at scale.
              </p>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ============ USE CASES (Target Industries) ============ */}
      <section id="use-cases" className="relative py-24 px-6 bg-surface/5">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">Built for High-Stakes Industries</h2>
            <p className="text-text-muted max-w-2xl mx-auto">
              Where AI decisions have real-world consequences, cryptographic proof isn&apos;t optional—it&apos;s required.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'DeFi Auditing',
                desc: 'AI agents evaluating smart contract vulnerabilities can now prove their analysis paths on-chain before protocols upgrade.',
                icon: ShieldCheck,
                color: 'text-green-400',
                bg: 'bg-green-400/10 hover:border-green-400/30 hover:shadow-[0_0_30px_rgba(74,222,128,0.1)]'
              },
              {
                title: 'Medical Diagnostics',
                desc: 'Diagnostic AI models can record immutable reasoning steps to HCS, ensuring full liability trace and FDA compliance.',
                icon: Activity,
                color: 'text-blue-400',
                bg: 'bg-blue-400/10 hover:border-blue-400/30 hover:shadow-[0_0_30px_rgba(96,165,250,0.1)]'
              },
              {
                title: 'Autonomous Supply Chain',
                desc: 'Agents rerouting logistics based on predictive models can provide cryptographic receipts for their automated decisions.',
                icon: Globe,
                color: 'text-amber-400',
                bg: 'bg-amber-400/10 hover:border-amber-400/30 hover:shadow-[0_0_30px_rgba(251,191,36,0.1)]'
              }
            ].map((useCase, i) => (
              <motion.div
                key={useCase.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className={`p-8 rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-sm transition-all duration-300 ${useCase.bg}`}
              >
                <useCase.icon className={`w-8 h-8 ${useCase.color} mb-5`} />
                <h3 className="text-xl font-display font-bold text-white mb-3">{useCase.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{useCase.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="relative py-28 px-6">
        {/* Single subtle glow — not screaming, just presence */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent-primary/5 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-10 sm:p-14 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-sm relative overflow-hidden"
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
                href="/dashboard"
                className="group flex items-center justify-center gap-2 px-10 py-4 text-base font-semibold rounded-xl bg-accent-primary hover:bg-accent-secondary text-black transition-all w-full sm:w-auto"
              >
                Launch App
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="https://github.com/handi/proofflow-monorepo"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-10 py-4 text-base font-semibold rounded-xl border border-white/10 hover:border-white/20 text-text-muted hover:text-white transition-all w-full sm:w-auto"
              >
                <Github className="w-5 h-5" />
                View Source
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
              <a href="https://github.com/handi/proofflow-monorepo" target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-white transition-colors" aria-label="GitHub">
                <Github className="w-5 h-5" />
              </a>
              <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-white transition-colors" aria-label="X (Twitter)">
                {/* X logo */}
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
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

            {/* Powered by */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">Powered by</span>
              <svg width="64" height="16" viewBox="0 0 100 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.42 23H6.7V13.84H-0.02V12.04H6.7V2.88H12.42V12.04H19.14V13.84H12.42V23ZM1.16 3.12H5.56V4.92H1.16V3.12ZM13.58 3.12H17.98V4.92H13.58V3.12ZM1.16 20.96H5.56V22.76H1.16V20.96ZM13.58 20.96H17.98V22.76H13.58V20.96Z" fill="#F8FAFC" />
                <path d="M33.8 23H28.8L28.66 12.04H23.08L22.94 23H17.94L18.08 2.88H23.08L22.94 10.28H28.66L28.8 2.88H33.8V23Z" fill="#F8FAFC" />
                <path d="M49 14.88H39.52V19.16H51.08V23H34V2.88H50.84V6.72H39.52V11H49V14.88Z" fill="#F8FAFC" />
                <path d="M68.78 12.94C68.78 18.8 63.84 23.36 57.06 23.36H49.12V2.88H57.06C63.84 2.88 68.78 7.44 68.78 13.1V12.94ZM54.64 19.34H56.5C60.6 19.34 63.2 16.5 63.2 13.04C63.2 9.4 60.6 6.74 56.5 6.74H54.64V19.34Z" fill="#F8FAFC" />
                <path d="M84.34 14.88H74.86V19.16H86.42V23H69.34V2.88H86.18V6.72H74.86V11H84.34V14.88Z" fill="#F8FAFC" />
                <path d="M102.66 23H96.38L92.1 14.88H91.1L89.14 14.84V23H83.62V2.88H92.2C96.9 2.88 100.2 5.56 100.2 9.88C100.2 12.78 98.42 14.52 96.06 15.02L102.66 23ZM89.14 11.24L91.86 11.28C93.7 11.28 94.7 10.38 94.7 8.92C94.7 7.28 93.68 6.64 91.56 6.64H89.14V11.24Z" fill="#F8FAFC" />
              </svg>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border/30 text-center">
            <p className="text-[11px] text-text-muted/50 uppercase tracking-widest">
              © 2025 ProofFlow — Built for the Hedera Ecosystem
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
