# ProofFlow (v1.0.4)

### The Autonomous "Agentic Web3" Trust Layer
> Verifiable reasoning, immutable audit trails, and autonomous settlement on Hedera.

[![Hedera Testnet](https://img.shields.io/badge/Network-Hedera%20Testnet-success?logo=hedera)](https://hashscan.io/testnet/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Built for Hello Future Apex 2026](https://img.shields.io/badge/Hackathon-Hello_Future_Apex_2026-cyan.svg)](#)

---

## 📝 Project Description (100 words)

ProofFlow is an autonomous agent protocol that solves the AI "Black Box" problem by creating verifiable, immutable audit trails for every AI reasoning step. When a user pays a native HBAR micro-fee, an off-chain AI agent (Gemini 2.5 Flash) decomposes their query into logical steps, hashes each step onto Hedera Consensus Service (HCS), mints a reputation credential via Hedera Token Service (HTS), and settles the final proof on an EVM smart contract — all autonomously, without human intervention. ProofFlow enables trustless agent-to-agent composability through cryptographically chained proof DAGs, positioning Hedera as the trust backbone for the Agentic Economy.

---

## 🚀 Overview: The AI & Agents Challenge
**ProofFlow** is an autonomous agent protocol designed for the **Hello Future Apex 2026 Hackathon**. It solves the "Black Box" problem of AI by fusing decentralized infrastructure with autonomous reasoning. 

When a user interacts with ProofFlow, they aren't just talking to a chatbot. They are triggering an **Agentic Workflow** where an off-chain AI agent (powered by Gemini) autonomously manages the entire lifecycle: from picking up the request after a native HBAR micropayment to logging every reasoning step on **HCS**, minting reputation credentials on **HTS**, and settling the final proof on an **EVM Smart Contract**.

---

## 🌐 Why This Must Be Web3 (Not Web2)

A centralized server with a database could store AI reasoning logs — but it cannot provide **trustless verification**:

| Requirement | Web2 (Centralized DB) | ProofFlow (Hedera) |
| :--- | :---: | :---: |
| **Tamper-proof audit trail** | ❌ Admin can alter records | ✅ HCS is immutable, timestamped by network consensus |
| **Third-party verifiability** | ❌ Requires trusting the operator | ✅ Anyone can verify via Mirror Node / HashScan |
| **Censorship resistance** | ❌ Single point of failure | ✅ Decentralized Hashgraph consensus |
| **Multi-stakeholder trust** | ❌ Each party must trust the server | ✅ Neutral shared ledger, no trusted intermediary |
| **Autonomous agent settlement** | ❌ Needs custodial banking rails | ✅ Native HBAR micropayments, no intermediary |
| **Cross-platform proof portability** | ❌ Locked in vendor silo | ✅ Proofs are on-chain public goods, composable across dApps |

> **Bottom Line:** ProofFlow's value is *not* the AI reasoning itself — it's the **cryptographic guarantee** that the reasoning hasn't been altered, censored, or fabricated. Only a decentralized ledger provides this.

---

## 🛡️ Enterprise-Grade Protection

ProofFlow incorporates a robust 3-layer security system to protect the autonomous infrastructure:
1. **Hedera Micropayments**: Every request requires an on-chain HBAR fee settlement.
2. **hCaptcha Enterprise**: Prevents bot-net spam while dynamically ignoring valid on-chain agent requests.
3. **Decentralized Rate Limiting**: Request throttling tied to the connected Hedera Wallet Address.

---

## 🏗️ Architectural Flow: "The Lifecycle of a Proof"

ProofFlow demonstrates a true **multi-service integration** on Hedera:

1.  **Autonomous Trigger**: User deposits a native HBAR micro-fee ($0.0001 equivalent) into the platform.
2.  **AI Inference**: The Backend Agent detects the payment, fetches live market context, and uses **Gemini 2.5 Flash** to decompose the problem into logical reasoning steps.
3.  **HCS Audit Logging**: Every internal "thought" and step is hashed and published to the **Hedera Consensus Service (HCS)** topic in real-time. This creates an immutable, timestamped trail of *how* the AI reached its conclusion.
4.  **HTS Reputation Minting**: Upon successful completion, the agent mints a **Hedera Token Service (HTS)** NFT/Badge called a "Reputation Passport" to the user's wallet as an on-chain receipt.
5.  **EVM Settlement**: The Agent acts as its own operator, signing a transaction to the `ProofValidator.sol` **EVM Smart Contract** to record the cryptographic hash of the final result, ensuring permanent availability.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Logic** | Gemini 2.5 Flash | Higher-order reasoning and autonomous step decomposition. |
| **Blockchain** | Hedera (HCS, HTS, EVM) | The backbone for consensus, identity, and settlement. |
| **Frontend** | Next.js 14, Tailwind, Framer Motion | Premium dashboard with interactive terminal and live audit feed. |
| **Backend** | Node.js, Express | Autonomous orchestrator and Hedera service manager. |
| **Connectivity** | WalletConnect / RainbowKit | Multi-ecosystem wallet support (Hashpack, MetaMask, OKX). |
| **Security** | hCaptcha + DDoS Shield + Rate Limiter | 3-layer bot protection tied to wallet addresses. |

---

## 🧠 Key Design Decisions (ADR)

| Decision | Choice | Rationale |
| :--- | :--- | :--- |
| **Why HCS for audit trail?** | Hedera Consensus Service | Sub-second finality (~3-5s), ordered timestamps, and $0.0001/msg makes it viable for per-step logging. No other L1 can do this economically. |
| **Why Gemini 2.5 Flash?** | Google Gemini (thinking mode) | Native "thinking budget" parameter allows explicit multi-step reasoning that maps cleanly to our [STEP N] → [FINAL] structured output format. |
| **Why EVM for settlement?** | Solidity Smart Contract (ProofValidator.sol) | Enables on-chain escrow (users deposit HBAR → agent delivers → contract settles), which is impossible with HCS alone. Also enables future cross-chain bridge verification. |
| **Why fungible tokens for reputation?** | HTS Fungible (PFR) | Fungible tokens allow additive reputation scores queryable via Mirror Node, enabling leaderboards and tiered access without complex NFT metadata. |
| **Why micropayments?** | 0.02 HBAR per query | Creates an economic Sybil barrier, generates sustainable revenue, and proves the "autonomous settlement" thesis. Hedera's $0.0001 tx fee makes sub-cent payments viable. |
| **Why multi-key rotation?** | Round-robin Gemini API keys | Prevents rate limiting from killing the service during high-traffic periods (hackathon demos). Graceful degradation with exponential backoff. |

---

## 📡 API Reference

The ProofFlow backend exposes a robust API for agent coordination:

### `GET /api/v1/config`
Fetch network configuration, contract addresses, and current operator fee (HBAR).

### `POST /api/v1/reason`
**Body**: `{ question: string, requesterAddress?: string, paymentTxHash?: string, parentProofIds?: string[] }`
Triggers the full autonomous pipeline. Accepts optional `parentProofIds` to inject cryptographically verified HCS context from other agents. Returns the reasoning result.

### `GET /api/v1/proof/:id`
Retrieves the full HCS reasoning chain and metadata for a specific proof.

### `GET /api/v1/verify/:proofId`
Returns deep lineage verification data, tracing the full DAG of proof dependencies down to their root EVM transaction hashes.

### `GET /api/v1/leaderboard`
Ranks users based on their HTS Reputation Token balances indexed via the Mirror Node.

---

## 🤖 OpenClaw Bounty: Killer App for the Agentic Society

ProofFlow is **agent-first public infrastructure** — the primary users are autonomous agents, not humans. The human-facing dashboard exists to *observe* agent activity.

### How It Works

ProofFlow acts as a **Verifiable Reasoning Oracle**. Agents can pay for a proof and *cryptographically reference* the proofs of other agents, building an immutable DAG of reasoning:

1. **Bank Agent** pays HBAR and requests Risk Analysis → `Proof #1`
2. **Security Agent** passes `Proof #1` hash and requests Audit → `Proof #2 (depends on #1)`
3. **Market Agent** passes `Proof #1, #2` hashes and requests Strategy → `Proof #3 (depends on #1, #2)`

### OpenClaw Bounty Compliance

| Requirement | Status | Implementation |
| :--- | :---: | :--- |
| App is agent-first (OpenClaw agents are primary users) | ✅ | Agents autonomously pay, query, and chain proofs via REST API |
| Autonomous or semi-autonomous agent behavior | ✅ | Full pipeline runs without human intervention after HBAR payment |
| Clear value in multi-agent environment | ✅ | Proof DAG enables verifiable delegation and composable reasoning |
| Hedera EVM, Token Service, or Consensus Service | ✅ | All three: HCS (audit) + HTS (reputation) + EVM (settlement/escrow) |
| Public repo | ✅ | `github.com/Handilusa/ProofFlow` |
| Live demo URL | ✅ | [INSERT DEMO URL] |
| <3 min demo video | ✅ | [INSERT YOUTUBE LINK] |
| README with setup + walkthrough | ✅ | You're reading it |

### Agent-to-Agent Value Proposition

ProofFlow gets **more valuable as more agents join**:
- Each agent's proof can be referenced by other agents, creating network effects
- Reputation tokens (PFR via HTS) enable trust scoring between agents
- The proof DAG creates a shared knowledge graph that no single agent could build alone
- Hedera's $0.0001 HCS fees make per-step logging economically viable at scale

**Run the live DAG simulation:**
```bash
# Ensure ProofFlow backend is running on localhost:3001
node packages/backend/src/scripts/openclaw-swarm.js
```
This script creates a swarm of autonomous agents that independently pay and query ProofFlow, demonstrating agent-to-agent composability on Hedera.

---

## 📦 Quick Start

```bash
# Clone and install
git clone https://github.com/Handilusa/ProofFlow.git
npm install

# Configure Backend (.env)
HEDERA_ACCOUNT_ID="0.0.xxxx"
HEDERA_PRIVATE_KEY="xxxx"
GEMINI_API_KEY="xxxx"

# Run stack
npm run dev # within packages/frontend
npm start   # within packages/backend
```

---

## ⚖️ License
MIT License - Developed for the **Hedera Apex 2026 Hackathon**.
