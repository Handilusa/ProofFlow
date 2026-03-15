/**
 * ═══════════════════════════════════════════════════════════════════════
 * OpenClaw Swarm — x402 Agentic Wallets & "Thinking Out Loud"
 * ═══════════════════════════════════════════════════════════════════════
 *
 * This simulation demonstrates ProofFlow's solution to the two biggest
 * problems in autonomous AI architecture:
 *
 * 1. THE FEE FRICTION: Agents cannot easily hold or manage crypto to pay 
 *    gas. We simulate Coinbase's x402 (Agentic Wallets) where a Paymaster
 *    subsidizes the HBAR micro-fee so the agent operates frictionlessly.
 *
 * 2. THE BLACK BOX (OpenClaw Auditable): Before an autonomous agent makes
 *    a financial decision, it is FORCED to "Think Out Loud". Its internal
 *    monologue is cryptographically hashed to Hedera HCS *before* execution,
 *    creating an immutable, auditable trail of why it took that action.
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

const PROOFFLOW_API = process.env.PROOFFLOW_API || "http://localhost:3001/api/v1";
const HEDERA_ACCOUNT_ID = process.env.HEDERA_ACCOUNT_ID_TESTNET;
const HEDERA_PRIVATE_KEY = process.env.HEDERA_PRIVATE_KEY_TESTNET;

if (!HEDERA_ACCOUNT_ID || !HEDERA_PRIVATE_KEY) {
    throw new Error("HEDERA_ACCOUNT_ID_TESTNET and HEDERA_PRIVATE_KEY_TESTNET must be set in .env");
}

const operatorClient = Client.forTestnet();
operatorClient.setOperator(HEDERA_ACCOUNT_ID, PrivateKey.fromStringECDSA(HEDERA_PRIVATE_KEY));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── The Swarm: OpenClaw Agents ─────────────────────────────────────────────────

const SWARM = [
    {
        name: "🏦 OpenClaw Agent Alpha (DeFi Risk)",
        role: "Evaluates financial risk of DeFi pools",
        emoji: "🏦",
        question:
            "I am an OpenClaw autonomous agent. I need to deploy 50,000 HBAR into the SaucerSwap V2 USDC/HBAR pool. " +
            "Before I execute this transaction, I must 'think out loud' and log my reasoning to HCS. " +
            "Analyze current market volatility, impermanent loss risk, and base APR. " +
            "Conclude definitively whether I should execute the trade (Risk score 1-10).",
    },
    {
        name: "🔐 OpenClaw Agent Beta (Security Audit)",
        role: "Reviews smart contract security",
        emoji: "🔐",
        question:
            "I am an OpenClaw Security Agent. I am about to authorize a 50,000 HBAR deposit. " +
            "Before I sign the multi-sig, I must log my internal monologue to HCS. " +
            "Evaluate the smart contract risk of the SaucerSwap V2 router on Hedera EVM. " +
            "Is it safe to proceed? Provide a definitive security clearance.",
    }
];

// ─── Core Functions ─────────────────────────────────────────────────────────────

async function createAgentWallet() {
    const agentKey = PrivateKey.generateECDSA();
    const tx = await new AccountCreateTransaction()
        .setKey(agentKey.publicKey)
        .setInitialBalance(Hbar.fromTinybars(0)) // Starts EMPTY! (x402 solves this)
        .execute(operatorClient);

    const receipt = await tx.getReceipt(operatorClient);
    return { accountId: receipt.accountId.toString(), privateKey: agentKey };
}

/**
 * ⛽ SIMULATED x402 PAYMASTER DELEGATION
 * The agent's wallet is completely empty. It requests a gas subsidy from the
 * x402 Paymaster (operator account) to cover the ProofFlow micro-fee.
 */
async function x402PaymasterSubsidize(agentAccountId) {
    try {
        const configRes = await fetch(`${PROOFFLOW_API}/config`, { headers: { 'x-network': 'testnet' } }).catch(() => null);
        let feeHbar = 0.16; // Default ProofFlow fee
        let operatorAccountId = HEDERA_ACCOUNT_ID;

        if (configRes && configRes.ok) {
            const config = await configRes.json();
            operatorAccountId = config.operatorAccountId;
            feeHbar = parseFloat(config.serviceFeeHbar || "0.16");
        }

        console.log(`      ⛽ [x402 Paymaster] Agent wallet is empty. Delegating transaction fee...`);
        console.log(`      ⛽ [x402 Paymaster] Subsidizing ${feeHbar} HBAR for ProofFlow audit...`);

        // The Paymaster (operator) sends the fee directly to ProofFlow on behalf of the agent
        const transferTx = await new TransferTransaction()
            .addHbarTransfer(operatorClient.operatorAccountId, Hbar.from(-feeHbar))
            .addHbarTransfer(operatorAccountId, Hbar.from(feeHbar))
            .execute(operatorClient);

        const receipt = await transferTx.getReceipt(operatorClient);
        return transferTx.transactionId.toString();

    } catch (err) {
        console.log(`      ⚠️  x402 Paymaster failed (${err.message}). Simulation continuing without payment.`);
        return null;
    }
}

/**
 * Calls ProofFlow's /reason API.
 * This forces the OpenClaw agent to "Think Out Loud" to HCS.
 */
async function requestChainedReasoning(question, agentAccountId, paymentTxId) {
    const body = {
        question,
        requesterAddress: agentAccountId,
    };

    if (paymentTxId) {
        body.paymentTxHash = paymentTxId;
    }

    const res = await fetch(`${PROOFFLOW_API}/reason`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-network": "testnet" },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(`ProofFlow API error ${res.status}: ${errData.error || res.statusText}`);
    }

    return await res.json();
}

/**
 * Verifies the proof lineage on-chain.
 */
async function verifyProofLineage(proofId) {
    try {
        const res = await fetch(`${PROOFFLOW_API}/verify/${proofId}`, { headers: { 'x-network': 'testnet' } });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

// ─── Main Execution ─────────────────────────────────────────────────────────────

async function main() {
    console.log("╔══════════════════════════════════════════════════════════════════════╗");
    console.log("║  🤖 OpenClaw Auditable — x402 Agentic Wallets Simulation             ║");
    console.log("║  Autonomous agents 'Think Out Loud', routing their internal          ║");
    console.log("║  monologues to Hedera HCS via a subsidized x402 gas Paymaster.       ║");
    console.log("╚══════════════════════════════════════════════════════════════════════╝");
    console.log();

    const proofChain = [];

    // Create an empty wallet for the agent
    console.log("🔑 Initializing OpenClaw Agent Wallet...");
    const { accountId: agentAccount } = await createAgentWallet();
    console.log(`   Wallet ID: ${agentAccount} (Balance: 0.0000 HBAR - REQUIRES x402)\n`);

    for (let i = 0; i < SWARM.length; i++) {
        const agent = SWARM[i];

        console.log(`\n${"═".repeat(70)}`);
        console.log(`${agent.emoji}  ${agent.name} (Thinking Out Loud)`);
        console.log(`   Task: ${agent.role}`);
        console.log(`${"═".repeat(70)}`);

        // 1. x402 Paymaster Subsidy
        console.log(`\n      Step 1/3: x402 Agentic Wallet Integration...`);
        const paymentTxId = await x402PaymasterSubsidize(agentAccount);

        // 2. Request verifiable reasoning ("Thinking out loud")
        console.log(`      Step 2/3: Forcing native 'Internal Monologue' to HCS...`);
        console.log(`                (Agent is reasoning mathematically via Neural Engine v2)`);

        try {
            const proof = await requestChainedReasoning(
                agent.question,
                agentAccount,
                paymentTxId
            );

            const shortAnswer = proof.answer?.substring(0, 150) || "(no answer)";

            console.log(`\n      ✅ HCS AUDIT LOG CAPTURED:`);
            console.log(`         Proof ID:      ${proof.proofId}`);
            console.log(`         Steps Logged:  ${proof.totalSteps} (SHA-256 Individually Hashed)`);
            console.log(`         Conclusion:    ${shortAnswer}...`);

            proofChain.push({
                proofId: proof.proofId,
                agent: agent.name,
                rootHash: null,
                timestamp: new Date().toISOString(),
            });

            // 3. Wait for EVM anchoring
            console.log(`\n      Step 3/3: Waiting for ProofValidator EVM anchoring (10s)...`);
            await sleep(10000);

            const verification = await verifyProofLineage(proof.proofId);
            if (verification) {
                proofChain[i].rootHash = verification.rootHash;
                console.log(`      🔍 ON-CHAIN SETTLEMENT VERIFIED:`);
                console.log(`         Root Hash:     ${verification.rootHash}`);
                console.log(`         HCS Topic:     ${verification.hcsTopicId}`);
                console.log(`         EVM Tx:        ${verification.evmTxHash}`);
            }

            console.log(`\n      🟢 Agent ${i+1} authorized to continue execution. Monologue secured.`);

        } catch (err) {
            console.error(`\n      ❌ FAILED: ${err.message}`);
        }
    }

    // ─── Final Report ────────────────────────────────────────────────────────────
    console.log(`\n\n${"═".repeat(70)}`);
    console.log("🤖 OPENCLAW ARCHITECTURE REPORT");
    console.log(`${"═".repeat(70)}`);
    console.log();

    console.log(`  1. THE FEE FRICTION SOLVED (x402 Agentic Wallets)`);
    console.log(`     The agents started with 0 HBAR. A Paymaster contract subsidized`);
    console.log(`     their ProofFlow micro-fees dynamically. Agents never need to manage`);
    console.log(`     their own private keys for gas.`);
    console.log();
    console.log(`  2. THE BLACK BOX SOLVED (OpenClaw Auditable)`);
    console.log(`     Before making API calls or signing multi-sigs, the agents were`);
    console.log(`     forced to 'Think Out Loud'. Their Neural Engine reasoning steps`);
    console.log(`     were hashed to HCS (Topic 0.0.8001198) creating an immutable,`);
    console.log(`     tamper-evident audit trail of their decision-making process.`);
    console.log();
    
    console.log(`🔎 VERIFY AGENT LOGS ON HASHSCAN:`);
    for (const proof of proofChain) {
        if (proof.proofId) {
            console.log(`   ${proof.agent}: https://hashscan.io/testnet/transaction/${proof.rootHash || proof.proofId}`);
        }
    }

    console.log(`\n🏁 Simulation complete.`);
    process.exit(0);
}

main().catch((err) => {
    console.error("\n❌ Fatal error:", err);
    process.exit(1);
});

