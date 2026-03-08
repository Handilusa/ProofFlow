# ProofFlow (v1.0.4)

### The Autonomous "Agentic Web3" Trust Layer
> Verifiable reasoning, immutable audit trails, and autonomous settlement on Hedera.

[![Hedera Testnet](https://img.shields.io/badge/Network-Hedera%20Testnet-success?logo=hedera)](https://hashscan.io/testnet/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Built for Hello Future Apex 2026](https://img.shields.io/badge/Hackathon-Hello_Future_Apex_2026-cyan.svg)](#)

---

## 🚀 Overview: The AI & Agents Challenge
**ProofFlow** is an autonomous agent protocol designed for the **Hello Future Apex 2026 Hackathon**. It solves the "Black Box" problem of AI by fusing decentralized infrastructure with autonomous reasoning. 

When a user interacts with ProofFlow, they aren't just talking to a chatbot. They are triggering an **Agentic Workflow** where an off-chain AI agent (powered by Gemini) autonomously manages the entire lifecycle: from picking up the request after a native HBAR micropayment to logging every reasoning step on **HCS**, minting reputation credentials on **HTS**, and settling the final proof on an **EVM Smart Contract**.

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

## 🤖 OpenClaw: Multi-Agent Reasoning Chain

ProofFlow is public infrastructure for autonomous agents. In the OpenClaw vision, agents need to make complex decisions collaboratively. 

ProofFlow acts as a **Verifiable Reasoning Oracle**. With the new **Multi-Agent Chain**, agents can pay for a proof and *cryptographically reference* the proofs of other agents, building an immutable DAG of reasoning.

1. **Bank Agent** pays and requests Risk Analysis → `Proof #1`
2. **Security Agent** passes `Proof #1` hash and requests Audit → `Proof #2 (depends on #1)`
3. **Market Agent** passes `Proof #1, #2` hashes and requests Strategy → `Proof #3 (depends on #1, #2)`

**Run the DAG simulation:**
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
