# ProofFlow — Business Plan & Strategy

> **"Verifiable Reasoning as a Service"** — Bringing trust, transparency, and accountability to AI-driven decisions using Hedera's decentralized infrastructure.

---

## 📊 Lean Canvas

| Block | Details |
| :--- | :--- |
| **Problem** | AI systems are "black boxes." Users, enterprises, and autonomous agents cannot verify *how* an AI reached a conclusion. This erodes trust and limits adoption in high-stakes domains. Real examples: COMPAS recidivism algorithm showed racial bias with Black defendants 45% more likely to be flagged high-risk (ProPublica, 2016). IBM Watson for Oncology recommended unsafe cancer treatments due to opaque training data (STAT News, 2018). |
| **Customer Segments** | 1. **DeFi Protocols & DAOs** needing auditable AI governance decisions. 2. **Autonomous Agents** (OpenClaw ecosystem) requiring verifiable sub-task delegation. 3. **Enterprises** needing compliant, auditable AI outputs for EU AI Act requirements (entered force Aug 2024). |
| **Unique Value Proposition** | ProofFlow is the only platform that creates an **immutable, step-by-step audit trail** of AI reasoning on Hedera (HCS), issues **on-chain reputation credentials** (HTS), and **settles cryptographic proof hashes** on an EVM smart contract — all triggered by a single HBAR micropayment. |
| **Solution** | An autonomous agent protocol where every AI "thought" is hashed and published to HCS in real-time, creating a tamper-proof chain of reasoning. The final result is anchored on-chain via an EVM smart contract for permanent verifiability. |
| **Channels** | Hedera developer community, Web3 hackathons, DeFi protocol partnerships, OpenClaw agent marketplace, developer documentation & SDK. |
| **Revenue Streams** | **Tiered micro-fees** per reasoning request. Current MVP: 0.02 HBAR. At scale: Enterprise API subscriptions ($99-499/mo) with volume discounts. SDK licensing for dApp integrations. |
| **Cost Structure** | 1. **Gemini 2.5 Flash API** (~$0.005/query at ~1K input + 2K output tokens). 2. **Hedera network fees** (~$0.003/query for 4 HCS msgs at $0.0008 each). 3. **EVM gas** (~$0.05–0.08/tx). 4. **Infrastructure** (cloud hosting). |
| **Key Metrics** | Monthly Active Hedera Accounts, HCS messages published/day, Reasoning requests processed, Reputation tokens minted, Network TPS contribution. |
| **Unfair Advantage** | First mover in "Verifiable AI Reasoning" on Hedera. Deep multi-service integration (HCS + HTS + EVM) that is difficult to replicate without significant expertise. |

---

## 📐 Market Sizing (TAM / SAM / SOM)

| Segment | Value | Rationale | Source |
| :--- | :--- | :--- | :--- |
| **TAM** | **$11.3B** (2025) | Global Explainable AI market, projected to reach $16.2B by 2028 at 20.9% CAGR. | [MarketsandMarkets, 2023](https://www.marketsandmarkets.com/Market-Reports/explainable-ai-market-246991483.html); [Precedence Research, 2025](https://www.precedenceresearch.com/explainable-artificial-intelligence-market) |
| **SAM** | **$113M** | ~1% of TAM: Web3/DLT-native AI tools — protocols, DAOs, and agent platforms requiring on-chain verifiable AI outputs. Conservative estimate. | Derived from TAM |
| **SOM** | **$1.1M** (Year 1) | ~1% of SAM: Hedera-specific projects that would adopt auditable AI reasoning tooling within the first year of SDK availability. | Bottom-up estimate |

### Why This Market Is Growing
- **EU AI Act (in force Aug 2024):** Mandates transparency, logging, and auditability for "high-risk" AI systems. Full application for high-risk systems: Aug 2026. ProofFlow's HCS audit trail directly addresses Art. 12 (logging) and Art. 13 (transparency). — [Source: EU Official Journal](https://eur-lex.europa.eu/eli/reg/2024/1689/oj)
- **AI Black Box Liability (proven incidents):**
  - **COMPAS (2016):** AI sentencing tool showed racial bias — Black defendants 45% more likely to be incorrectly flagged high-risk. No audit trail existed to diagnose why. — [Source: ProPublica, "Machine Bias"](https://www.propublica.org/article/machine-bias-risk-assessments-in-criminal-sentencing)
  - **IBM Watson for Oncology (2018):** Recommended unsafe cancer treatments, including a drug that could cause fatal hemorrhage in a bleeding patient. Trained on hypothetical data, not real patients. — [Source: STAT News / Nextgov](https://www.nextgov.com/emerging-tech/2018/07/ibms-watson-recommended-unsafe-and-incorrect-cancer-treatments-stat-report-found/150034/)
- **Autonomous Agent Economy:** OpenClaw, LangChain, and AutoGPT ecosystems require verifiable trust layers for agent-to-agent transactions.

---

## 📊 Hedera Network Impact Projection

Each ProofFlow query generates the following on-chain activity:

| Action | Hedera Service | Tx Count per Query | Cost per Tx (USD) | Source |
| :--- | :--- | :---: | :---: | :--- |
| Reasoning step hashing | **HCS** (Consensus Service) | 3–5 messages | $0.0008/msg | [Hedera Fee Schedule (post v0.69, Jan 2026)](https://docs.hedera.com/hedera/networks/mainnet/fees) |
| Reputation token mint | **HTS** (Token Service) | 1 transaction | ~$0.001 | [Hedera Fee Schedule](https://hedera.com/fees) |
| Proof hash settlement | **EVM** (Smart Contract) | 1 transaction | ~$0.05–0.08 | [Hedera Fee Estimator](https://hedera.com/fees) |
| Payment verification | **Mirror Node** | 1 read | Free | Mirror Node REST API |

**Impact at Scale:**

| Monthly Users | Queries/Month | HCS Messages | HTS Mints | EVM Txs | Total Hedera Txs |
| :---: | :---: | :---: | :---: | :---: | :---: |
| 100 | 500 | 2,000 | 500 | 500 | **3,000** |
| 1,000 | 5,000 | 20,000 | 5,000 | 5,000 | **30,000** |
| 10,000 | 50,000 | 200,000 | 50,000 | 50,000 | **300,000** |

> **Key Insight:** ProofFlow is a *transaction multiplier* — each user interaction generates 5–7 Hedera transactions across 3 services.

---

## 🚀 Go-To-Market (GTM) Strategy

### Phase 1: Community & Hackathon Validation (Current — Q1 2026)
- **Target:** Hedera developer community and hackathon participants.
- **Actions:**
  - Launch MVP on Hedera Testnet with full HCS/HTS/EVM pipeline.
  - Collect early adopter feedback via structured user testing sessions.
  - Demonstrate agent-to-agent capability for OpenClaw bounty.
- **Goal:** 50+ testnet accounts created, 200+ reasoning proofs generated.

### Phase 2: DeFi & DAO Integration (Q2–Q3 2026)
- **Target:** DeFi protocols, DAOs, and governance platforms on Hedera.
- **Actions:**
  - Release a lightweight SDK/npm package (`@proofflow/sdk`) enabling any dApp to request verifiable AI reasoning with a single function call.
  - Partner with 2–3 DeFi protocols (e.g., SaucerSwap, Bonzo) to integrate ProofFlow as their "AI Auditor" for automated risk assessments.
  - Deploy on Hedera Mainnet with production-grade security.
- **Goal:** 3 integration partners, 1,000+ monthly active accounts.

### Phase 3: Enterprise & Multi-Chain Expansion (Q4 2026+)
- **Target:** Enterprises requiring compliant AI audit trails (fintech, insurance, healthcare).
- **Actions:**
  - Introduce enterprise API tier with SLA guarantees, custom AI model selection (Gemini, Claude, GPT), and dedicated HCS topics.
  - Explore cross-chain bridge to make ProofFlow proofs verifiable on Ethereum and other L1s.
  - Submit for SOC 2 compliance certification leveraging Hedera's built-in auditability.
- **Goal:** $10K+ MRR, 10,000+ monthly active accounts.

---

## 🗺️ Future Roadmap

| Timeline | Feature | Impact |
| :--- | :--- | :--- |
| **Q2 2026** | Multi-model support (Gemini + Claude + GPT competing) | Users choose the best model; competitive reasoning improves quality. |
| **Q2 2026** | ProofFlow SDK (`npm install @proofflow/sdk`) | Any dApp can integrate verifiable reasoning in 5 lines of code. |
| **Q3 2026** | Decentralized Reasoner Nodes | Community members run reasoning nodes and earn HBAR fees (DePIN model). |
| **Q3 2026** | Agent-to-Agent UCP Marketplace | Full OpenClaw/UCP integration where agents discover, hire, and pay ProofFlow autonomously. |
| **Q4 2026** | Cross-chain proof verification | Verify Hedera-anchored proofs on Ethereum, Polygon, and Solana. |
| **Q4 2026** | Enterprise compliance dashboard | Real-time audit trail visualization for regulated industries. |

---

## 💰 Unit Economics (Honest Assessment)

### Current State (MVP / Testnet — Subsidized)

| Component | Cost per Query | Source |
| :--- | :--- | :--- |
| **Gemini 2.5 Flash API** (~1K input, ~2K output tokens) | ~$0.0053 | [Google AI Pricing](https://ai.google.dev/pricing): $0.30/M input, $2.50/M output |
| **HCS messages** (avg 4 steps × $0.0008 each) | ~$0.0032 | [Hedera Fees (post v0.69)](https://docs.hedera.com/hedera/networks/mainnet/fees) |
| **HTS token mint + transfer** | ~$0.002 | [Hedera Fees](https://hedera.com/fees) |
| **EVM smart contract tx** | ~$0.06 | [Hedera Fee Estimator](https://hedera.com/fees) |
| **Total cost per query** | **~$0.07** | Sum of above |
| **Current revenue per query** | **~$0.002** (0.02 HBAR) | — |
| **Current margin** | **-97% (subsidized)** | — |

> ⚠️ **Transparency:** At the current MVP fee of 0.02 HBAR (~$0.002), each query is heavily subsidized. This is intentional for hackathon/testnet validation — the fee exists to prove the micropayment mechanism works, not to be profitable yet.

### Path to Sustainability

| Strategy | Impact | Timeline |
| :--- | :--- | :--- |
| **Raise service fee** to 1–5 HBAR ($0.10–0.50) per query | Revenue covers Gemini + HCS costs | Phase 2 (Q2 2026) |
| **Enterprise API subscriptions** ($99–499/mo with volume discounts) | Predictable MRR, amortized infra costs | Phase 3 (Q4 2026) |
| **Batch HCS messages** (bundle 4 steps into 1 HCS msg) | Reduce HCS costs by ~75% | Phase 2 (Q2 2026) |
| **Skip EVM for non-critical proofs** (settle only on-demand) | Eliminate $0.06 EVM cost for basic queries | Phase 2 |
| **Use Gemini Free Tier** for low-traffic / development | $0.00 API cost (rate-limited) | Current |

### Projected Economics at Scale (Post-Optimization)

| Metric | Value |
| :--- | :--- |
| **Revenue per query** (Standard tier) | 2 HBAR (~$0.20) |
| **Cost per query** (optimized: batched HCS, no EVM for basic) | ~$0.008 |
| **Margin at scale** | ~96% |
| **Break-even** | ~500 queries/mo at 2 HBAR pricing |

---

## 🏆 Competitive Landscape

| Solution | Verifiable Reasoning | On-Chain Audit | Reputation System | Micro-Payments | Agent-Ready |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **ProofFlow** | ✅ | ✅ (HCS) | ✅ (HTS) | ✅ (HBAR) | ✅ |
| ChatGPT / Gemini (standalone) | ❌ | ❌ | ❌ | ❌ | ❌ |
| Chainlink Functions | ❌ | Partial | ❌ | ✅ | Partial |
| Ritual Network | Partial | ✅ | ❌ | ✅ | Partial |

---

*ProofFlow — Built for the Hedera Apex 2026 Hackathon* 🚀
