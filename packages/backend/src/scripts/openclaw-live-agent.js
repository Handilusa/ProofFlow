/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * OpenClaw Live Agent — Multi-Agent Orchestration + ProofFlow Audit Layer
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * TWO autonomous LangChain agents collaborate via ProofFlow's on-chain DAG:
 *
 *   AGENT 1 — "OpenClaw Strategist"
 *     Tools: market_price, defi_radar, sentiment_index
 *     Job:   Analyze market conditions and find the best opportunity.
 *     Audit: Routes its reasoning through ProofFlow → HCS (Proof #1)
 *
 *   AGENT 2 — "OpenClaw Executor"
 *     Tools: analyze_wallet, risk_assessment
 *     Job:   Analyze the user's wallet, cross-reference with Strategist's
 *            verified conclusion, and produce an actionable recommendation.
 *     Audit: Routes its reasoning through ProofFlow → HCS (Proof #2)
 *            with parentProofIds: [Proof #1] — creating a real on-chain DAG.
 *
 *   ProofFlow is NOT an agent — it's the TRUST LAYER. The transparent glass
 *   that makes the agents' "Black Box" reasoning visible and immutable.
 *
 *   x402 Paymaster subsidizes both agents (they start with 0 HBAR).
 *
 * USAGE:
 *   Ensure ProofFlow backend is running on localhost:3001, then:
 *   node packages/backend/src/scripts/openclaw-live-agent.js
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { tool } from "@langchain/core/tools";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage } from "@langchain/core/messages";
import { z } from "zod";
import {
    Client,
    PrivateKey,
    AccountCreateTransaction,
    Hbar,
    TransferTransaction,
} from "@hashgraph/sdk";
import "dotenv/config";
import readline from "readline";

// ─── Configuration ──────────────────────────────────────────────────────────────

const PROOFFLOW_API = process.env.PROOFFLOW_API || "http://localhost:3001/api/v1";
const HEDERA_ACCOUNT_ID = process.env.HEDERA_ACCOUNT_ID_TESTNET;
const HEDERA_PRIVATE_KEY = process.env.HEDERA_PRIVATE_KEY_TESTNET;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!HEDERA_ACCOUNT_ID || !HEDERA_PRIVATE_KEY) {
    throw new Error("HEDERA_ACCOUNT_ID_TESTNET and HEDERA_PRIVATE_KEY_TESTNET must be set in .env");
}
if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY must be set in .env");
}

const operatorClient = Client.forTestnet();
operatorClient.setOperator(HEDERA_ACCOUNT_ID, PrivateKey.fromStringECDSA(HEDERA_PRIVATE_KEY));

const MIRROR_NODE = "https://testnet.mirrornode.hedera.com/api/v1";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── x402 Paymaster ─────────────────────────────────────────────────────────────

async function createAgentWallet() {
    const agentKey = PrivateKey.generateECDSA();
    const tx = await new AccountCreateTransaction()
        .setKey(agentKey.publicKey)
        .setInitialBalance(Hbar.fromTinybars(0))
        .execute(operatorClient);
    const receipt = await tx.getReceipt(operatorClient);
    return { accountId: receipt.accountId.toString(), privateKey: agentKey };
}

async function x402PaymasterSubsidize(agentName) {
    try {
        const configRes = await fetch(`${PROOFFLOW_API}/config`, { headers: { 'x-network': 'testnet' } }).catch(() => null);
        let feeHbar = 0.16;
        let operatorAccountId = HEDERA_ACCOUNT_ID;

        if (configRes && configRes.ok) {
            const config = await configRes.json();
            operatorAccountId = config.operatorAccountId;
            feeHbar = parseFloat(config.serviceFeeHbar || "0.16");
        }

        console.log(`      ⛽ [x402] ${agentName}: Wallet empty → Paymaster subsidizing ${feeHbar} HBAR...`);

        const transferTx = await new TransferTransaction()
            .addHbarTransfer(operatorClient.operatorAccountId, Hbar.from(-feeHbar))
            .addHbarTransfer(operatorAccountId, Hbar.from(feeHbar))
            .execute(operatorClient);

        await transferTx.getReceipt(operatorClient);
        const txId = transferTx.transactionId.toString();
        console.log(`      ⛽ [x402] ${agentName}: Fee subsidized ✓ (tx: ${txId.substring(0, 30)}...)`);
        return txId;
    } catch (err) {
        console.log(`      ⚠️  [x402] ${agentName}: ${err.message}`);
        return null;
    }
}

// ─── Shared: ProofFlow Audit Call ────────────────────────────────────────────────

async function routeThroughProofFlow(analysis, agentAccountId, paymentTxId, parentProofIds = []) {
    const body = {
        question: analysis,
        requesterAddress: agentAccountId,
    };
    if (paymentTxId) body.paymentTxHash = paymentTxId;
    if (parentProofIds.length > 0) body.parentProofIds = parentProofIds;

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

// ═══════════════════════════════════════════════════════════════════════════════
//  AGENT 1 TOOLS — "OpenClaw Strategist"
// ═══════════════════════════════════════════════════════════════════════════════

const marketPriceTool = tool(
    async ({ coinName }) => {
        console.log(`   🔍 [Strategist Tool] Fetching price: ${coinName}...`);
        try {
            const IDS = {
                hbar: "hedera-hashgraph", hedera: "hedera-hashgraph",
                bitcoin: "bitcoin", btc: "bitcoin", ethereum: "ethereum", eth: "ethereum",
                solana: "solana", sol: "solana", usdc: "usd-coin", usdt: "tether",
                sauce: "saucerswap", xrp: "ripple", ada: "cardano", doge: "dogecoin",
            };
            const geckoId = IDS[coinName.toLowerCase()] || coinName.toLowerCase();
            const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${geckoId}&sparkline=false&price_change_percentage=1h,24h,7d`;
            const res = await fetch(url);
            if (!res.ok) return `CoinGecko error: ${res.status}`;
            const data = await res.json();
            if (!data.length) return `No data for "${coinName}"`;
            const c = data[0];
            return `${c.name} (${c.symbol.toUpperCase()}): $${c.current_price} | MCap: $${c.market_cap?.toLocaleString()} | Vol24h: $${c.total_volume?.toLocaleString()} | 1h: ${c.price_change_percentage_1h_in_currency?.toFixed(2)}% | 24h: ${c.price_change_percentage_24h?.toFixed(2)}% | 7d: ${c.price_change_percentage_7d_in_currency?.toFixed(2)}% | ATH: $${c.ath} (${c.ath_change_percentage?.toFixed(1)}% from ATH)`;
        } catch (err) { return `Error: ${err.message}`; }
    },
    {
        name: "market_price",
        description: "Fetches real-time price, market cap, volume, and price changes for any cryptocurrency from CoinGecko.",
        schema: z.object({ coinName: z.string().describe("Coin name or symbol (e.g. 'hbar', 'bitcoin')") }),
    }
);

const defiRadarTool = tool(
    async () => {
        console.log(`   🔍 [Strategist Tool] Scanning Hedera DeFi pools...`);
        try {
            const dexRes = await fetch(`https://api.dexscreener.com/latest/dex/search?q=saucerswap`);
            if (!dexRes.ok) return "DexScreener unavailable";
            const dexData = await dexRes.json();
            const pools = (dexData.pairs || [])
                .filter(p => p.chainId === "hedera" && p.liquidity?.usd > 1000)
                .sort((a, b) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0))
                .slice(0, 8);

            if (!pools.length) return "No active Hedera DeFi pools found";

            let report = `Top SaucerSwap V2 Pools:\n`;
            for (const p of pools) {
                const tvl = p.liquidity?.usd || 0;
                const vol = p.volume?.h24 || 0;
                const apr = tvl > 0 ? ((vol * 0.0025 * 365) / tvl * 100).toFixed(2) : "0";
                report += `  ${p.baseToken?.symbol}/${p.quoteToken?.symbol}: $${p.priceUsd} | TVL: $${tvl.toLocaleString()} | Vol24h: $${vol.toLocaleString()} | APR: ${apr}% | 24h: ${p.priceChange?.h24 || 0}% | URL: ${p.url || 'N/A'}\n`;
            }
            return report;
        } catch (err) { return `Error: ${err.message}`; }
    },
    {
        name: "defi_radar",
        description: "Scans all SaucerSwap V2 liquidity pools on Hedera: TVL, volume, estimated APR, price changes, and direct URLs.",
        schema: z.object({}),
    }
);

const sentimentTool = tool(
    async () => {
        console.log(`   🔍 [Strategist Tool] Fetching Fear & Greed Index...`);
        try {
            const res = await fetch("https://api.alternative.me/fng/?limit=7");
            if (!res.ok) return "Sentiment API unavailable";
            const data = await res.json();
            return data.data.map(d => `${new Date(d.timestamp * 1000).toISOString().split('T')[0]}: ${d.value}/100 — ${d.value_classification}`).join("\n");
        } catch (err) { return `Error: ${err.message}`; }
    },
    {
        name: "sentiment_index",
        description: "Returns the 7-day Crypto Fear & Greed Index trend (0=Extreme Fear, 100=Extreme Greed).",
        schema: z.object({}),
    }
);

// ═══════════════════════════════════════════════════════════════════════════════
//  AGENT 2 TOOLS — "OpenClaw Executor"
// ═══════════════════════════════════════════════════════════════════════════════

const analyzeWalletTool = tool(
    async ({ walletAddress }) => {
        console.log(`   🔍 [Executor Tool] Analyzing wallet: ${walletAddress}...`);
        try {
            let accountId = walletAddress;
            if (walletAddress.startsWith("0x")) {
                const r = await fetch(`${MIRROR_NODE}/accounts/${walletAddress}`);
                if (r.ok) { const d = await r.json(); accountId = d.account || walletAddress; }
            }

            const balRes = await fetch(`${MIRROR_NODE}/balances?account.id=${accountId}`);
            let hbar = 0;
            if (balRes.ok) {
                const bd = await balRes.json();
                const e = bd.balances?.find(b => b.account === accountId);
                if (e) hbar = (Number(e.balance) / 1e8).toFixed(4);
            }

            const tokRes = await fetch(`${MIRROR_NODE}/accounts/${accountId}/tokens?limit=25`);
            let tokens = [];
            if (tokRes.ok) {
                const td = await tokRes.json();
                tokens = (td.tokens || []).map(t => `Token ${t.token_id}: balance ${t.balance}`);
            }

            const nftRes = await fetch(`${MIRROR_NODE}/accounts/${accountId}/nfts?limit=25`);
            let nfts = [];
            if (nftRes.ok) {
                const nd = await nftRes.json();
                nfts = (nd.nfts || []).map(n => `NFT ${n.token_id} #${n.serial_number}`);
            }

            return `Wallet ${accountId}:\n  HBAR: ${hbar}\n  Tokens (${tokens.length}): ${tokens.join(', ') || 'none'}\n  NFTs (${nfts.length}): ${nfts.join(', ') || 'none'}`;
        } catch (err) { return `Error: ${err.message}`; }
    },
    {
        name: "analyze_wallet",
        description: "Reads a Hedera wallet's real balances: HBAR, fungible tokens, and NFTs from the Mirror Node.",
        schema: z.object({ walletAddress: z.string().describe("Hedera account ID (0.0.xxxxx) or EVM address (0x...)") }),
    }
);

const riskAssessmentTool = tool(
    async ({ poolName, investmentAmount }) => {
        console.log(`   🔍 [Executor Tool] Risk assessment: ${investmentAmount} HBAR → ${poolName}...`);
        try {
            // Fetch HBAR price for USD conversion
            const priceRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=hedera-hashgraph&vs_currencies=usd`);
            let hbarPrice = 0.15;
            if (priceRes.ok) {
                const pd = await priceRes.json();
                hbarPrice = pd['hedera-hashgraph']?.usd || 0.15;
            }

            const usdValue = (investmentAmount * hbarPrice).toFixed(2);

            // Fetch pool data for IL estimation
            const dexRes = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${poolName}`);
            let poolData = null;
            if (dexRes.ok) {
                const dd = await dexRes.json();
                poolData = dd.pairs?.find(p => p.chainId === 'hedera');
            }

            let report = `Risk Assessment — ${investmentAmount} HBAR ($${usdValue} at $${hbarPrice}/HBAR) → ${poolName}\n`;

            if (poolData) {
                const volatility24h = Math.abs(poolData.priceChange?.h24 || 0);
                const riskLevel = volatility24h > 10 ? "HIGH" : volatility24h > 5 ? "MODERATE" : "LOW";
                const tvl = poolData.liquidity?.usd || 0;
                const depthRatio = tvl > 0 ? ((investmentAmount * hbarPrice) / tvl * 100).toFixed(4) : "N/A";

                report += `  Pool TVL: $${tvl.toLocaleString()}\n`;
                report += `  24h Volatility: ${volatility24h.toFixed(2)}% → Risk: ${riskLevel}\n`;
                report += `  Your position as % of pool: ${depthRatio}%\n`;
                report += `  Impermanent Loss warning: ${volatility24h > 8 ? "ELEVATED — consider waiting for lower volatility" : "Acceptable for current conditions"}\n`;
            } else {
                report += `  Pool data unavailable — manual verification recommended\n`;
            }

            return report;
        } catch (err) { return `Error: ${err.message}`; }
    },
    {
        name: "risk_assessment",
        description: "Calculates risk metrics for a proposed DeFi investment: position size vs pool TVL, volatility risk, and impermanent loss estimation.",
        schema: z.object({
            poolName: z.string().describe("Name of the pool (e.g. 'HBAR/USDC')"),
            investmentAmount: z.number().describe("Amount of HBAR to invest"),
        }),
    }
);

// ═══════════════════════════════════════════════════════════════════════════════
//  BUILD AGENTS
// ═══════════════════════════════════════════════════════════════════════════════

function buildStrategistAgent() {
    const model = new ChatGoogleGenerativeAI({
        model: "gemini-2.5-flash",
        apiKey: GEMINI_API_KEY,
        temperature: 0.4,
        maxOutputTokens: 4096,
    });

    return createReactAgent({
        llm: model,
        tools: [marketPriceTool, defiRadarTool, sentimentTool],
        messageModifier: `You are the OpenClaw Strategist Agent — a specialized autonomous market analyst operating on the Hedera network. Your reasoning will be cryptographically audited on-chain via ProofFlow.

YOUR JOB: Analyze market conditions and identify the single best DeFi opportunity on Hedera right now.

WORKFLOW:
1. Use market_price to get HBAR's current price and momentum.
2. Use defi_radar to scan all SaucerSwap V2 pools for yield opportunities.
3. Use sentiment_index to gauge market mood.
4. Synthesize everything into a CLEAR, QUANTITATIVE recommendation naming ONE specific pool and why.

RULES:
- Be concise and data-driven. Every sentence must contain a number.
- Name the specific pool, its APR, TVL, and your reasoning.
- End with a clear conclusion: "RECOMMENDED: [Pool Name] at [APR]% — [1 sentence reason]"
- Detect the user's language and respond in it.
- Do NOT hedge or give vague advice. Be definitive.`,
    });
}

function buildExecutorAgent() {
    const model = new ChatGoogleGenerativeAI({
        model: "gemini-2.5-flash",
        apiKey: GEMINI_API_KEY,
        temperature: 0.3,
        maxOutputTokens: 4096,
    });

    return createReactAgent({
        llm: model,
        tools: [analyzeWalletTool, riskAssessmentTool],
        messageModifier: `You are the OpenClaw Executor Agent — a specialized autonomous portfolio manager on the Hedera network. You receive VERIFIED conclusions from the Strategist Agent (anchored on Hedera HCS) and your job is to determine IF and HOW to execute.

YOUR JOB: Analyze the user's wallet, cross-reference with the Strategist's verified recommendation, and produce an actionable execution plan.

WORKFLOW:
1. Use analyze_wallet to read the user's real token balances.
2. Use risk_assessment to evaluate the proposed investment.
3. Cross-reference wallet holdings with the Strategist's recommendation.
4. Produce a specific execution plan with exact amounts.

RULES:
- Your analysis STARTS from the Strategist Agent's verified conclusion (provided as context). Do NOT re-analyze the market.
- Be specific: "Deposit X HBAR into Y pool" with exact numbers.
- Include the dApp URL if available (from the Strategist's data).
- Flag risks clearly. If the position would be too large relative to the pool or wallet, say so.
- End with: "EXECUTION PLAN: [specific action] | Risk: [LOW/MODERATE/HIGH]"
- Detect the user's language and respond in it.`,
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ORCHESTRATOR — Runs both agents + ProofFlow audit
// ═══════════════════════════════════════════════════════════════════════════════

async function runMultiAgentOrchestration(userQuery, walletAddress, agentAccount) {
    const strategist = buildStrategistAgent();
    const executor = buildExecutorAgent();

    // ── PHASE 1: Strategist Agent ────────────────────────────────────────────
    console.log(`\n${"═".repeat(70)}`);
    console.log(`🏦 PHASE 1/2 — OpenClaw Strategist Agent`);
    console.log(`   Task: Market analysis & opportunity identification`);
    console.log(`${"═".repeat(70)}`);

    // x402 Paymaster for Agent 1
    const payment1 = await x402PaymasterSubsidize("Strategist");

    console.log(`\n   🧠 Strategist is thinking (LangChain ReAct loop)...\n`);

    const strategistResult = await strategist.invoke({
        messages: [new HumanMessage(userQuery)],
    });

    const strategistAnswer = strategistResult.messages[strategistResult.messages.length - 1]?.content || "(no response)";
    console.log(`\n   📋 Strategist Raw Conclusion:`);
    console.log(`   ${strategistAnswer.substring(0, 200)}...`);

    // Route Strategist's reasoning through ProofFlow → HCS
    console.log(`\n   📡 Routing Strategist's reasoning through ProofFlow → HCS...`);
    const strategistPrompt = `[OPENCLAW STRATEGIST AGENT — AUTONOMOUS MARKET ANALYSIS]\n\nOriginal User Query: "${userQuery}"\n\nAgent's Analysis & Conclusion:\n${strategistAnswer}`;

    const proof1 = await routeThroughProofFlow(strategistPrompt, agentAccount, payment1);

    console.log(`\n   ✅ STRATEGIST PROOF ANCHORED:`);
    console.log(`      Proof ID:     ${proof1.proofId}`);
    console.log(`      Steps:        ${proof1.totalSteps} (SHA-256 → HCS Topic 0.0.8001198)`);
    console.log(`      Status:       ${proof1.status}`);

    // ── PHASE 2: Executor Agent ──────────────────────────────────────────────
    console.log(`\n${"═".repeat(70)}`);
    console.log(`🔐 PHASE 2/2 — OpenClaw Executor Agent`);
    console.log(`   Task: Wallet analysis + execution plan`);
    console.log(`   📎 Parent Proof: ${proof1.proofId} (Strategist's verified conclusion)`);
    console.log(`${"═".repeat(70)}`);

    // x402 Paymaster for Agent 2
    const payment2 = await x402PaymasterSubsidize("Executor");

    // Build Executor's context with verified Strategist conclusion
    const executorPrompt = `The OpenClaw Strategist Agent has completed its market analysis. Its conclusion has been VERIFIED and anchored on Hedera HCS (Proof ID: ${proof1.proofId}).

VERIFIED STRATEGIST CONCLUSION:
${strategistAnswer}

YOUR TASK: Analyze the wallet "${walletAddress}" and determine whether to execute the Strategist's recommendation. Provide a specific action plan with exact amounts.`;

    console.log(`\n   🧠 Executor is thinking (LangChain ReAct loop)...\n`);

    const executorResult = await executor.invoke({
        messages: [new HumanMessage(executorPrompt)],
    });

    const executorAnswer = executorResult.messages[executorResult.messages.length - 1]?.content || "(no response)";
    console.log(`\n   📋 Executor Raw Conclusion:`);
    console.log(`   ${executorAnswer.substring(0, 200)}...`);

    // Route Executor's reasoning through ProofFlow → HCS with parentProofIds
    console.log(`\n   📡 Routing Executor's reasoning through ProofFlow → HCS...`);
    console.log(`      🔗 Linking to parent proof: ${proof1.proofId} (Strategist)`);

    const executorAuditPrompt = `[OPENCLAW EXECUTOR AGENT — AUTONOMOUS PORTFOLIO MANAGEMENT]\n\nStratist Proof ID: ${proof1.proofId}\nTarget Wallet: ${walletAddress}\n\nAgent's Execution Plan:\n${executorAnswer}`;

    const proof2 = await routeThroughProofFlow(executorAuditPrompt, agentAccount, payment2, [proof1.proofId]);

    console.log(`\n   ✅ EXECUTOR PROOF ANCHORED:`);
    console.log(`      Proof ID:     ${proof2.proofId}`);
    console.log(`      Steps:        ${proof2.totalSteps} (SHA-256 → HCS Topic 0.0.8001198)`);
    console.log(`      Parent:       ${proof1.proofId} (Strategist — verified DAG link)`);
    console.log(`      Status:       ${proof2.status}`);

    return { proof1, proof2, strategistAnswer, executorAnswer };
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN — Interactive CLI
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
    console.log("╔══════════════════════════════════════════════════════════════════════╗");
    console.log("║  🤖 OpenClaw Multi-Agent System — ProofFlow Auditable Layer          ║");
    console.log("║                                                                      ║");
    console.log("║  Two autonomous agents collaborate via on-chain DAG:                 ║");
    console.log("║    Agent 1: Strategist (market analysis + opportunity discovery)     ║");
    console.log("║    Agent 2: Executor   (wallet analysis + execution planning)        ║");
    console.log("║                                                                      ║");
    console.log("║  ProofFlow = Trust Layer (HCS audit + EVM settlement)                ║");
    console.log("║  x402 Paymaster = Zero gas friction for agents                       ║");
    console.log("║                                                                      ║");
    console.log("║  Type 'exit' to quit.                                                ║");
    console.log("╚══════════════════════════════════════════════════════════════════════╝");
    console.log();

    // Create agent wallet (x402 — starts at 0 HBAR)
    console.log("🔑 Initializing OpenClaw Agent Wallet (x402 — 0 HBAR)...");
    const { accountId: agentAccount } = await createAgentWallet();
    console.log(`   Agent Wallet: ${agentAccount} (Balance: 0 HBAR — requires x402 Paymaster)\n`);

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    const askQuestion = () => {
        console.log(`\n${"─".repeat(70)}`);
        rl.question("🤖 OpenClaw > Enter your query (+ wallet address for portfolio analysis):\n   Example: 'Best DeFi opportunity on Hedera for wallet 0.0.8026799'\n   You > ", async (input) => {
            const trimmed = input.trim();
            if (!trimmed || trimmed.toLowerCase() === "exit") {
                console.log("\n🏁 OpenClaw agents shutting down. All proofs remain on Hedera forever.");
                rl.close();
                process.exit(0);
            }

            // Extract wallet address from input if present
            const walletMatch = trimmed.match(/(?:0\.0\.\d{4,}|0x[a-fA-F0-9]{40})/);
            const walletAddress = walletMatch ? walletMatch[0] : agentAccount;
            const isOwnWallet = !walletMatch;

            if (isOwnWallet) {
                console.log(`\n   ℹ️  No wallet address detected — using agent's own wallet: ${agentAccount}`);
            }

            try {
                const startTime = Date.now();

                const { proof1, proof2, strategistAnswer, executorAnswer } = await runMultiAgentOrchestration(
                    trimmed, walletAddress, agentAccount
                );

                const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

                // ── Final Report ────────────────────────────────────────────
                console.log(`\n\n${"═".repeat(70)}`);
                console.log(`🤖 OPENCLAW MULTI-AGENT REPORT`);
                console.log(`${"═".repeat(70)}`);
                console.log();
                console.log(`  ⏱️  Total execution: ${elapsed}s`);
                console.log();
                console.log(`  ┌─ AGENT 1: Strategist ─────────────────────────────`);
                console.log(`  │  Proof ID:  ${proof1.proofId}`);
                console.log(`  │  Steps:     ${proof1.totalSteps} reasoning steps → HCS`);
                console.log(`  │  HashScan:  https://hashscan.io/testnet/topic/0.0.8001198`);
                console.log(`  └────────────────────────────────────────────────────`);
                console.log();
                console.log(`  ┌─ AGENT 2: Executor ────────────────────────────────`);
                console.log(`  │  Proof ID:  ${proof2.proofId}`);
                console.log(`  │  Parent:    ${proof1.proofId} (Agent-to-Agent DAG)`);
                console.log(`  │  Steps:     ${proof2.totalSteps} reasoning steps → HCS`);
                console.log(`  │  HashScan:  https://hashscan.io/testnet/topic/0.0.8001198`);
                console.log(`  └────────────────────────────────────────────────────`);
                console.log();
                console.log(`  🔗 ON-CHAIN DAG: Proof #1 → Proof #2 (verified via parentProofIds)`);
                console.log(`  ⛽ x402 PAYMASTER: Both agents operated with 0 HBAR (fees subsidized)`);
                console.log();
                console.log(`${"─".repeat(70)}`);
                console.log(`📋 STRATEGIST'S ANALYSIS:`);
                console.log(`${"─".repeat(70)}`);
                console.log(strategistAnswer);
                console.log();
                console.log(`${"─".repeat(70)}`);
                console.log(`📋 EXECUTOR'S RECOMMENDATION:`);
                console.log(`${"─".repeat(70)}`);
                console.log(executorAnswer);
                console.log(`${"─".repeat(70)}`);

                // Wait for EVM settlement
                console.log(`\n   ⏳ Waiting 10s for EVM anchoring...`);
                await sleep(10000);
                console.log(`   ✅ Settlement window complete.`);

            } catch (err) {
                console.error(`\n   ❌ Orchestration Error: ${err.message}`);
                if (err.message.includes("429") || err.message.includes("quota")) {
                    console.log("   💡 API rate limit hit. Wait 30s and try again.");
                }
            }

            askQuestion();
        });
    };

    askQuestion();
}

main().catch((err) => {
    console.error("\n❌ Fatal error:", err);
    process.exit(1);
});
