# ProofFlow (v1.0.1)

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

## 🏗️ Architectural Flow: "The Lifecycle of a Proof"

ProofFlow demonstrates a true **multi-service integration** on Hedera:

1.  **Autonomous Trigger**: User deposits a native HBAR micro-fee ($0.0001 equivalent) into the platform.
2.  **AI Inference**: The Backend Agent detects the payment, fetches live market context, and uses **Gemini 1.5 Pro** to decompose the problem into logical reasoning steps.
3.  **HCS Audit Logging**: Every internal "thought" and step is hashed and published to the **Hedera Consensus Service (HCS)** topic in real-time. This creates an immutable, timestamped trail of *how* the AI reached its conclusion.
4.  **HTS Reputation Minting**: Upon successful completion, the agent mints a **Hedera Token Service (HTS)** NFT/Badge called a "Reputation Passport" to the user's wallet as an on-chain receipt.
5.  **EVM Settlement**: The Agent acts as its own operator, signing a transaction to the `ProofValidator.sol` **EVM Smart Contract** to record the cryptographic hash of the final result, ensuring permanent availability.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Logic** | Gemini 1.5 Pro | Higher-order reasoning and autonomous step decomposition. |
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
**Body**: `{ question: string, requesterAddress?: string, paymentTxHash?: string }`
Triggers the full autonomous pipeline. Returns the reasoning result immediately.

### `GET /api/v1/proof/:id`
Retrieves the full HCS reasoning chain and metadata for a specific proof.

### `GET /api/v1/leaderboard`
Ranks users based on their HTS Reputation Token balances indexed via the Mirror Node.

### `GET /api/v1/user/profile/:address`
Fetches community-defined usernames and reputation levels.

---

## 🎨 Judging Criteria Alignment

*   **Innovation (AI & Agents)**: ProofFlow moves beyond "chat" into "autonomous operation," where the agent handles payments, consensus logging, and contract settlement without human intervention.
*   **Integration**: Combines HCS (real-time audits), HTS (reputation economy), and EVM (permanent settlement) in a single unified flow.
*   **Execution**: Fully functional MVP with support for native Hedera wallets (Hashpack) and EVM wallets (MetaMask/OKX).
*   **Success**: Encourages HBAR micro-transactions and HTS token adoption, increasing network utility and account creation.

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
