/**
 * ═══════════════════════════════════════════════════════════════════════
 * OpenClaw Swarm — Multi-Agent Reasoning Chain
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Three autonomous agents collaboratively analyze a complex DeFi
 * decision. Each agent builds upon the VERIFIED, on-chain-anchored
 * proof of the previous agent, creating a Directed Acyclic Graph (DAG)
 * of cryptographically-linked reasoning.
 *
 * FLOW:
 *   Agent A (DeFi Risk)   → Proof #1 (root)
 *   Agent B (Security)    → Proof #2 (parent: #1)
 *   Agent C (Market Intel) → Proof #3 (parents: #1, #2)
 *
 * Each proof's hash is anchored on HCS + EVM. Agent B's prompt contains
 * Agent A's verified conclusion + hash. Agent C sees both. This creates
 * an immutable, traceable "chain of thought" across multiple agents.
 *
 * USAGE:
 *   Ensure the ProofFlow backend is running on localhost:3001, then:
 *   node packages/backend/src/scripts/openclaw-swarm.js
 *
 * ═══════════════════════════════════════════════════════════════════════
 */

import {
    Client,
    PrivateKey,
    AccountCreateTransaction,
    Hbar,
    TransferTransaction,
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

// ─── The Swarm: Agent Definitions ───────────────────────────────────────────────
// Each agent represents a specialized autonomous actor in the OpenClaw ecosystem.
// They DON'T have their own AI — they delegate reasoning to ProofFlow and build
// on each other's verified proofs.

const SWARM = [
    {
        name: "🏦 DeFi Risk Analyst",
        role: "Evaluates financial risk of DeFi protocols",
        emoji: "🏦",
        question:
            "Analyze the risk profile of depositing 10,000 HBAR into a SaucerSwap V2 HBAR/USDC liquidity pool. " +
            "Consider impermanent loss, smart contract risk, protocol maturity, and current market conditions. " +
            "Provide a risk score from 1-10 and a clear recommendation.",
        parentIndices: [], // Root node — no parents
    },
    {
        name: "🔐 Security Auditor",
        role: "Reviews smart contract security and vulnerability analysis",
        emoji: "🔐",
        question:
            "Based on the DeFi risk analysis provided in the parent proof, conduct a focused security audit " +
            "of the SaucerSwap V2 router and pool contracts on Hedera EVM. " +
            "Identify the top 5 potential vulnerabilities and assess whether the contracts are safe for the " +
            "proposed 10,000 HBAR deposit. Reference the risk score from the parent analysis.",
        parentIndices: [0], // Depends on Agent A's proof
    },
    {
        name: "📊 Market Strategist",
        role: "Synthesizes multi-agent analysis into an actionable strategy",
        emoji: "📊",
        question:
            "You have access to two verified proofs from other autonomous agents: " +
            "a DeFi risk analysis and a security audit of SaucerSwap V2. " +
            "Synthesize both findings into a final actionable strategy. " +
            "Should the agent proceed with the 10,000 HBAR deposit? " +
            "If yes, what entry strategy (timing, sizing, hedging) do you recommend? " +
            "If no, what alternative DeFi opportunities on Hedera should be considered instead?",
        parentIndices: [0, 1], // Depends on both Agent A and Agent B
    },
];

// ─── Core Functions ─────────────────────────────────────────────────────────────

async function createAgentWallet() {
    const agentKey = PrivateKey.generateECDSA();
    const tx = await new AccountCreateTransaction()
        .setKey(agentKey.publicKey)
        .setInitialBalance(Hbar.fromTinybars(50_000_000)) // 0.5 HBAR
        .execute(operatorClient);

    const receipt = await tx.getReceipt(operatorClient);
    const accountId = receipt.accountId.toString();
    return { accountId, privateKey: agentKey };
}

async function payProofFlowFee(agentAccountId, agentPrivateKey) {
    try {
        const configRes = await fetch(`${PROOFFLOW_API}/config`);
        const config = await configRes.json();

        const operatorAccountId = config.operatorAccountId;
        const feeHbar = parseFloat(config.serviceFeeHbar || "0.02");

        const agentClient = Client.forTestnet();
        agentClient.setOperator(agentAccountId, agentPrivateKey);

        const transferTx = await new TransferTransaction()
            .addHbarTransfer(agentAccountId, Hbar.from(-feeHbar))
            .addHbarTransfer(operatorAccountId, Hbar.from(feeHbar))
            .execute(agentClient);

        const receipt = await transferTx.getReceipt(agentClient);
        const txId = transferTx.transactionId.toString();

        console.log(`      💸 Payment: ${feeHbar} HBAR → ${operatorAccountId} (${receipt.status})`);
        agentClient.close();

        return txId;
    } catch (err) {
        console.log(`      ⚠️  Payment skipped (${err.message})`);
        return null;
    }
}

/**
 * Calls ProofFlow's /reason API with optional parent proof references.
 * This is the core multi-agent chain mechanism.
 */
async function requestChainedReasoning(question, agentAccountId, paymentTxId, parentProofIds = []) {
    const body = {
        question,
        requesterAddress: agentAccountId,
        parentProofIds,
    };

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

/**
 * Verifies the proof lineage on-chain via ProofFlow's verify endpoint.
 */
async function verifyProofLineage(proofId) {
    try {
        const res = await fetch(`${PROOFFLOW_API}/verify/${proofId}`);
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

// ─── Main Execution ─────────────────────────────────────────────────────────────

async function main() {
    console.log("╔══════════════════════════════════════════════════════════════╗");
    console.log("║  🐝  OpenClaw Swarm — Multi-Agent Reasoning Chain          ║");
    console.log("║  Three agents collaboratively analyze a complex DeFi       ║");
    console.log("║  decision, building a DAG of verified proofs on Hedera.    ║");
    console.log("╚══════════════════════════════════════════════════════════════╝");
    console.log();

    // Store proof IDs as they're generated
    const proofChain = [];

    // Create a shared wallet for the swarm (in production, each agent has its own)
    console.log("🔑 Creating agent wallet...");
    const { accountId: agentAccount, privateKey: agentKey } = await createAgentWallet();
    console.log(`   Wallet: ${agentAccount}\n`);

    for (let i = 0; i < SWARM.length; i++) {
        const agent = SWARM[i];
        const isRoot = agent.parentIndices.length === 0;

        console.log(`\n${"═".repeat(64)}`);
        console.log(`${agent.emoji}  AGENT ${i + 1}/${SWARM.length}: ${agent.name}`);
        console.log(`   Role: ${agent.role}`);

        if (!isRoot) {
            const parentIds = agent.parentIndices.map(idx => proofChain[idx].proofId);
            console.log(`   🔗 Building on ${parentIds.length} parent proof(s):`);
            for (const idx of agent.parentIndices) {
                const parent = proofChain[idx];
                console.log(`      └─ ${SWARM[idx].emoji} Proof: ${parent.proofId} (hash: ${parent.rootHash || "pending"})`);
            }
        } else {
            console.log(`   🌱 Root node — no parent proofs`);
        }
        console.log(`${"═".repeat(64)}`);

        // 1. Pay the micro-fee
        console.log(`\n      Step 1/3: Paying ProofFlow micro-fee...`);
        const paymentTxId = await payProofFlowFee(agentAccount, agentKey);

        // 2. Request chained reasoning
        const parentProofIds = agent.parentIndices.map(idx => proofChain[idx].proofId);
        console.log(`      Step 2/3: Requesting verifiable reasoning...`);
        if (parentProofIds.length > 0) {
            console.log(`                (injecting ${parentProofIds.length} parent proof(s) as verified context)`);
        }

        try {
            const proof = await requestChainedReasoning(
                agent.question,
                agentAccount,
                paymentTxId,
                parentProofIds
            );

            const shortAnswer = proof.answer?.substring(0, 150) || "(no answer)";

            console.log(`\n      ✅ PROOF RECEIVED:`);
            console.log(`         Proof ID:      ${proof.proofId}`);
            console.log(`         Steps:         ${proof.totalSteps}`);
            console.log(`         Parents:       ${(proof.parentProofIds || []).length > 0 ? proof.parentProofIds.join(", ") : "none (root)"}`);
            console.log(`         Answer:        ${shortAnswer}...`);

            // Store for next agent
            proofChain.push({
                proofId: proof.proofId,
                agent: agent.name,
                question: agent.question,
                answer: proof.answer,
                totalSteps: proof.totalSteps,
                parentProofIds: proof.parentProofIds || [],
                rootHash: null, // Will be set asynchronously by backend
                timestamp: new Date().toISOString(),
            });

            // 3. Wait for HCS/EVM anchoring, then verify lineage
            console.log(`\n      Step 3/3: Waiting for HCS + EVM anchoring (15s)...`);
            await sleep(15000);

            // Try to fetch the verification/lineage data
            const verification = await verifyProofLineage(proof.proofId);
            if (verification) {
                proofChain[i].rootHash = verification.rootHash;
                console.log(`      🔍 VERIFICATION:`);
                console.log(`         Root Hash:     ${verification.rootHash || "(propagating)"}`);
                console.log(`         HCS Topic:     ${verification.hcsTopicId || "(propagating)"}`);
                console.log(`         EVM Tx:        ${verification.evmTxHash || "(propagating)"}`);
                console.log(`         Chain Depth:   ${verification.chainDepth || 1}`);
                console.log(`         Status:        ${verification.status}`);
            }

        } catch (err) {
            console.error(`\n      ❌ FAILED: ${err.message}`);
            proofChain.push({
                proofId: `ERROR-${i}`,
                agent: agent.name,
                error: err.message,
                timestamp: new Date().toISOString(),
            });
        }
    }

    // ─── Final Report: Proof Lineage DAG ────────────────────────────────────────
    console.log(`\n\n${"═".repeat(64)}`);
    console.log("🐝 SWARM REASONING CHAIN — FINAL REPORT");
    console.log(`${"═".repeat(64)}`);
    console.log();

    // Print the DAG
    console.log("📊 PROOF LINEAGE DAG:\n");
    for (let i = 0; i < proofChain.length; i++) {
        const proof = proofChain[i];
        const indent = i === 0 ? "" : "   ".repeat(i);
        const connector = i === 0 ? "🌱" : "└──🔗";

        console.log(`${indent}${connector} Proof #${i + 1}: ${proof.proofId}`);
        console.log(`${indent}    Agent:    ${proof.agent}`);
        console.log(`${indent}    Hash:     ${proof.rootHash || "(pending)"}`);
        console.log(`${indent}    Steps:    ${proof.totalSteps || "N/A"}`);

        if (proof.parentProofIds && proof.parentProofIds.length > 0) {
            console.log(`${indent}    Parents:  ${proof.parentProofIds.join(", ")}`);
        }
        console.log();
    }

    // Summary stats
    const successful = proofChain.filter(p => !p.error);
    const chained = proofChain.filter(p => p.parentProofIds?.length > 0);

    console.log(`${"─".repeat(64)}`);
    console.log(`  Total agents:           ${SWARM.length}`);
    console.log(`  Successful proofs:      ${successful.length}`);
    console.log(`  Chained proofs:         ${chained.length} (with parent references)`);
    console.log(`  Root proofs:            ${successful.length - chained.length}`);
    console.log(`  Max chain depth:        ${proofChain.length}`);
    console.log(`  HBAR micro-payments:    ${successful.length} × 0.02 = ${(successful.length * 0.02).toFixed(2)} HBAR`);
    console.log();
    console.log(`  Each proof generated:`);
    console.log(`    • 5-10 HCS messages (immutable audit trail)`);
    console.log(`    • 1 HTS reputation token mint`);
    console.log(`    • 1 EVM smart contract settlement`);
    console.log(`    • 1 HBAR micro-payment`);
    console.log();
    console.log(`  🔗 INNOVATION: Each proof cryptographically references its`);
    console.log(`     parent proofs, creating a verifiable DAG of reasoning.`);
    console.log(`     The entire chain is traceable on Hedera's public ledger.`);
    console.log(`${"─".repeat(64)}`);

    // Print verification URLs
    console.log(`\n🔎 VERIFY ON HASHSCAN:`);
    for (const proof of proofChain) {
        if (proof.proofId && !proof.error) {
            console.log(`   ${proof.agent}: https://hashscan.io/testnet/transaction/${proof.rootHash || proof.proofId}`);
        }
    }

    console.log(`\n🏁 Swarm simulation complete.`);
    process.exit(0);
}

main().catch((err) => {
    console.error("\n❌ Fatal error:", err);
    process.exit(1);
});
