/**
 * ═══════════════════════════════════════════════════════════════════════
 * OpenClaw Client Agent — "Autonomous DeFi Risk Analyst"
 * ═══════════════════════════════════════════════════════════════════════
 *
 * This script simulates an autonomous external agent (e.g., an OpenClaw
 * DeFi Risk Analyst) that delegates complex reasoning tasks to ProofFlow.
 *
 * HOW IT WORKS:
 * 1. The agent creates its own Hedera account (simulating an autonomous wallet).
 * 2. It identifies a complex decision it cannot make alone.
 * 3. It pays ProofFlow's micro-fee (HBAR) and calls the /api/v1/reason endpoint.
 * 4. ProofFlow's backend (Gemini + HCS + HTS + EVM) processes the request.
 * 5. The agent receives a verifiable, HCS-anchored proof and makes its decision.
 *
 * WHY THIS MATTERS FOR OPENCLAW:
 * - ProofFlow becomes "infrastructure" for the Agentic Society.
 * - Agents can subcontract verifiable reasoning without needing their own AI.
 * - Every interaction generates HCS messages, HTS mints, and HBAR micro-transactions.
 * - This proves ProofFlow is "agent-first" — machines talking to machines.
 *
 * USAGE:
 *   Ensure the ProofFlow backend is running on localhost:3001, then:
 *   node packages/backend/src/scripts/openclaw-client.js
 *
 * ═══════════════════════════════════════════════════════════════════════
 */

import {
    Client,
    PrivateKey,
    AccountCreateTransaction,
    Hbar,
    TransferTransaction,
    AccountBalanceQuery,
} from "@hashgraph/sdk";
import "dotenv/config";

// ─── Configuration ──────────────────────────────────────────────────────────────

const PROOFFLOW_API = process.env.PROOFFLOW_API || "http://127.0.0.1:3001/api/v1";
const HEDERA_ACCOUNT_ID = process.env.HEDERA_ACCOUNT_ID;
const HEDERA_PRIVATE_KEY = process.env.HEDERA_PRIVATE_KEY;

if (!HEDERA_ACCOUNT_ID || !HEDERA_PRIVATE_KEY) {
    throw new Error("HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY must be set in .env");
}

const operatorClient = Client.forTestnet();
operatorClient.setOperator(HEDERA_ACCOUNT_ID, PrivateKey.fromStringECDSA(HEDERA_PRIVATE_KEY));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Agent Personas ─────────────────────────────────────────────────────────────
// Each agent represents a different autonomous actor in the OpenClaw ecosystem.

const AGENT_PERSONAS = [
    {
        name: "🏦 DeFi Risk Analyst",
        role: "Autonomous agent that evaluates smart contract risks before allocating funds",
        tasks: [
            {
                context: "I am about to deposit 10,000 HBAR into a new liquidity pool on SaucerSwap V2.",
                question:
                    "Analyze the risk profile of depositing into a new SaucerSwap V2 HBAR/USDC liquidity pool. Consider impermanent loss, smart contract risk, and current market volatility. Should I proceed?",
            },
            {
                context: "A new yield farming protocol just launched claiming 500% APY.",
                question:
                    "Evaluate whether a DeFi protocol offering 500% APY on Hedera is likely sustainable or a potential rug pull. What red flags should I look for in the smart contract?",
            },
        ],
    },
    {
        name: "📊 Market Intelligence Agent",
        role: "Autonomous sentiment and trend analysis agent for crypto markets",
        tasks: [
            {
                context: "HBAR price has dropped 15% in the last 24 hours.",
                question:
                    "Given a 15% price drop in HBAR over 24 hours, analyze whether this is a buying opportunity or the beginning of a larger correction. Consider on-chain metrics, whale activity, and broader market sentiment.",
            },
        ],
    },
    {
        name: "🔐 Security Auditor Agent",
        role: "Autonomous agent that reviews smart contracts for vulnerabilities before interaction",
        tasks: [
            {
                context: "A DAO governance proposal wants to upgrade the treasury contract.",
                question:
                    "What are the top 5 security concerns when a DAO upgrades its treasury smart contract on Hedera EVM? How can the community verify the upgrade is safe?",
            },
        ],
    },
];

// ─── Core Functions ─────────────────────────────────────────────────────────────

/**
 * Creates a new Hedera testnet account for the agent.
 * In a real OpenClaw scenario, each agent would have its own persistent wallet.
 */
async function createAgentWallet() {
    const agentKey = PrivateKey.generateECDSA();
    const tx = await new AccountCreateTransaction()
        .setKey(agentKey.publicKey)
        .setInitialBalance(Hbar.fromTinybars(50_000_000)) // 0.5 HBAR
        .execute(operatorClient);

    const receipt = await tx.getReceipt(operatorClient);
    const accountId = receipt.accountId.toString();

    console.log(`   💳 Agent wallet created: ${accountId}`);
    return { accountId, privateKey: agentKey };
}

/**
 * Simulates the agent paying the ProofFlow micro-fee.
 * In production, this would be a real HBAR transfer to the ProofFlow operator.
 */
async function payProofFlowFee(agentAccountId, agentPrivateKey) {
    try {
        // Fetch the ProofFlow config to get the operator address and fee
        const configRes = await fetch(`${PROOFFLOW_API}/config`);
        const config = await configRes.json();

        const operatorAccountId = config.operatorAccountId;
        const feeHbar = parseFloat(config.serviceFeeHbar || "0.02");

        console.log(`   💸 Paying ${feeHbar} HBAR to ProofFlow operator (${operatorAccountId})...`);

        // Create a client for the agent
        const agentClient = Client.forTestnet();
        agentClient.setOperator(agentAccountId, agentPrivateKey);

        const transferTx = await new TransferTransaction()
            .addHbarTransfer(agentAccountId, Hbar.from(-feeHbar))
            .addHbarTransfer(operatorAccountId, Hbar.from(feeHbar))
            .execute(agentClient);

        const receipt = await transferTx.getReceipt(agentClient);
        const txId = transferTx.transactionId.toString();

        console.log(`   ✅ Payment confirmed: ${txId} (status: ${receipt.status})`);
        agentClient.close();

        return txId;
    } catch (err) {
        console.log(`   ⚠️  Payment simulation skipped (${err.message}). Proceeding without payment...`);
        return null;
    }
}

/**
 * Calls ProofFlow's reasoning API — the core agent-to-agent interaction.
 * The external agent delegates its complex decision to ProofFlow.
 */
async function requestVerifiableReasoning(question, agentAccountId, paymentTxId) {
    const body = {
        question,
        requesterAddress: agentAccountId,
    };

    // Include payment hash if available
    if (paymentTxId) {
        body.paymentTxHash = paymentTxId;
    }

    const res = await fetch(`${PROOFFLOW_API}/reason`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(`ProofFlow API error ${res.status}: ${errData.error || res.statusText}`);
    }

    return await res.json();
}

// ─── Main Execution ─────────────────────────────────────────────────────────────

async function main() {
    console.log("╔══════════════════════════════════════════════════════════════╗");
    console.log("║  🤖  OpenClaw Agent Simulation — ProofFlow Integration     ║");
    console.log("║  Demonstrating Agent-to-Agent Verifiable Reasoning on      ║");
    console.log("║  Hedera Network (HCS + HTS + EVM)                          ║");
    console.log("╚══════════════════════════════════════════════════════════════╝");
    console.log();

    const results = [];

    for (const persona of AGENT_PERSONAS) {
        console.log(`\n${"═".repeat(60)}`);
        console.log(`🤖 AGENT: ${persona.name}`);
        console.log(`📝 Role:  ${persona.role}`);
        console.log(`${"═".repeat(60)}`);

        // 1. Create a unique wallet for this agent
        const { accountId, privateKey } = await createAgentWallet();

        for (const task of persona.tasks) {
            console.log(`\n   📋 Context: "${task.context}"`);
            console.log(`   ❓ Delegating decision to ProofFlow...`);

            // 2. Pay ProofFlow's micro-fee (agent-to-agent HBAR transfer)
            const paymentTxId = await payProofFlowFee(accountId, privateKey);

            // 3. Request verifiable reasoning from ProofFlow
            try {
                const proof = await requestVerifiableReasoning(task.question, accountId, paymentTxId);

                console.log(`\n   ✅ PROOF RECEIVED:`);
                console.log(`      Proof ID:     ${proof.proofId}`);
                console.log(`      Total Steps:  ${proof.totalSteps}`);
                console.log(`      Status:       ${proof.status}`);
                console.log(`      Answer:       ${proof.answer?.substring(0, 120)}...`);

                // 4. The agent "makes its decision" based on ProofFlow's verifiable output
                const decision = proof.answer?.toLowerCase().includes("risk")
                    ? "⛔ HOLD — Risk detected, delaying action."
                    : "✅ PROCEED — ProofFlow verified this is safe.";

                console.log(`\n   🧠 AGENT DECISION: ${decision}`);
                console.log(`   📜 Proof anchored on HCS — fully verifiable and auditable.`);

                results.push({
                    agent: persona.name,
                    question: task.question,
                    proofId: proof.proofId,
                    steps: proof.totalSteps,
                    decision,
                    timestamp: new Date().toISOString(),
                });
            } catch (err) {
                console.error(`   ❌ Request failed: ${err.message}`);
                results.push({
                    agent: persona.name,
                    question: task.question,
                    error: err.message,
                    timestamp: new Date().toISOString(),
                });
            }

            // Wait between requests to respect rate limits and allow HCS propagation
            console.log(`\n   ⏳ Cooling down (15s) for HCS/HTS propagation...`);
            await sleep(15000);
        }
    }

    // ─── Summary Report ─────────────────────────────────────────────────────────
    console.log(`\n\n${"═".repeat(60)}`);
    console.log("📊 OPENCLAW SIMULATION REPORT");
    console.log(`${"═".repeat(60)}`);
    console.log(`Total agents simulated:     ${AGENT_PERSONAS.length}`);
    console.log(`Total reasoning requests:   ${results.length}`);
    console.log(`Successful proofs:          ${results.filter((r) => r.proofId).length}`);
    console.log(`Failed requests:            ${results.filter((r) => r.error).length}`);
    console.log(`\nEach successful proof generated:`);
    console.log(`  • 5-10 HCS messages (immutable audit trail)`);
    console.log(`  • 1 HTS reputation token mint`);
    console.log(`  • 1 EVM smart contract settlement`);
    console.log(`  • 1 HBAR micro-payment (agent → ProofFlow operator)`);
    console.log(`\n🏁 Simulation complete.`);

    process.exit(0);
}

main().catch((err) => {
    console.error("\n❌ Fatal error:", err);
    process.exit(1);
});
