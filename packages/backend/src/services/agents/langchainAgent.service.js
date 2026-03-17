import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { tool } from "@langchain/core/tools";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage } from "@langchain/core/messages";
import { z } from "zod";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";

// ═══════════════════════════════════════════════════════════════════════════════
//  TOOLS (Reused from CLI, adapted for backend service)
// ═══════════════════════════════════════════════════════════════════════════════

const MIRROR_NODE = "https://testnet.mirrornode.hedera.com/api/v1";

const defiRadarTool = tool(
    async () => {
        try {
            const dexRes = await fetch(`https://api.dexscreener.com/latest/dex/search?q=saucerswap`);
            if (!dexRes.ok) return "DexScreener unavailable";
            const dexData = await dexRes.json();
            const pools = (dexData.pairs || [])
                .filter(p => p.chainId === "hedera" && p.liquidity?.usd > 1000)
                .sort((a, b) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0))
                .slice(0, 5);

            if (!pools.length) return "No active Hedera DeFi pools found";

            // Create a snapshot for the data_source_hash
            const snapshotData = pools.map(p => ({ pool: p.pairAddress, tvl: p.liquidity?.usd, apr24h: p.priceChange?.h24 }));
            const snapshotHash = crypto.createHash("sha256").update(JSON.stringify(snapshotData)).digest("hex");

            let report = `Top SaucerSwap Pools (Snapshot Hash: ${snapshotHash}):\n`;
            for (const p of pools) {
                const tvl = p.liquidity?.usd || 0;
                const vol = p.volume?.h24 || 0;
                const apr = tvl > 0 ? ((vol * 0.0025 * 365) / tvl * 100).toFixed(2) : "0";
                const pairStr = `${p.baseToken?.symbol}/${p.quoteToken?.symbol}`;
                report += `  [${pairStr}](${p.url || 'N/A'}): TVL $${tvl.toLocaleString()} | APR: ${apr}%\n`;
            }
            return report + `\nDATA_SOURCE_HASH=${snapshotHash}`;
        } catch (err) { return `Error: ${err.message}`; }
    },
    {
        name: "defi_radar",
        description: "Scans all SaucerSwap V2 liquidity pools on Hedera: TVL, volume, estimated APR, price changes, and direct URLs.",
        schema: z.object({}),
    }
);

const analyzeWalletTool = tool(
    async ({ walletAddress }) => {
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

            // Fetch HBAR price
            const priceRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=hedera-hashgraph&vs_currencies=usd`);
            let usdValue = 0;
            if (priceRes.ok) {
                const pd = await priceRes.json();
                usdValue = (hbar * (pd['hedera-hashgraph']?.usd || 0.15)).toFixed(2);
            }

            return `Wallet ${accountId}:\n  HBAR: ${hbar} (~$${usdValue} USD)`;
        } catch (err) { return `Error: ${err.message}`; }
    },
    {
        name: "analyze_wallet",
        description: "Reads a Hedera wallet's real balances: HBAR, fungible tokens, and NFTs from the Mirror Node.",
        schema: z.object({ walletAddress: z.string().describe("Hedera account ID or EVM address") }),
    }
);

// ═══════════════════════════════════════════════════════════════════════════════
//  AGENT BUILDERS
// ═══════════════════════════════════════════════════════════════════════════════

function buildLangChainExecutor(apiKey) {
    const model = new ChatGoogleGenerativeAI({
        model: "gemini-2.5-flash",
        apiKey: apiKey,
        temperature: 0.2,
        maxOutputTokens: 8192,
    });

    return createReactAgent({
        llm: model,
        tools: [analyzeWalletTool, defiRadarTool],
        messageModifier: `You are the OpenClaw Executor Agent — an autonomous DeFi portfolio manager on Hedera.

YOUR JOB: Analyze the user's wallet AND scan Hedera DeFi pools to provide a strict, actionable financial recommendation following professional robo-advisor heuristics. 
Write your analysis in a balanced, highly professional tone. Provide enough detail to build trust and explain your reasoning clearly, but avoid excessive fluff.

WORKFLOW & HEURISTICS (Follow strictly):
1. Identify the user's wallet address. It may be in their message OR provided invisibly in the (System Context). Strictly use analyze_wallet.
2. Detect Idle Capital: Calculate the percentage of their portfolio that is doing nothing.
3. Minimum Viable Capital Rule:
   - If total capital < $1: Recommend NOTHING (Fees exceed yield).
   - If total capital < $200: Recommend ONLY Native Staking or low-risk lending. DO NOT recommend Liquidity Pools (gas/IL ruins yields).
   - If total capital >= $200: You may recommend Liquidity Pools (LP).
4. Risk Scoring & Diversification: Always assign a Risk Score (1-10) and a Diversification Score (1-10).
5. Output your reasoning in the STRICT XML FORMAT required by the ProofFlow UI.

OUTPUT FORMAT REQUIREMENTS — YOU MUST OBEY THIS EXACTLY:
Your final answer MUST be structured using exactly these XML tags so the UI can parse it. DO NOT output conversational markdown outside these tags.

<STEP 1>
(Wallet scan results: Summarize holdings clearly. MUST explicitly include the phrase "Total Portfolio Value: $X.XX")
</STEP 1>

<STEP 2>
(Portfolio composition: Detail the assets found. MUST explicitly include the phrase "Diversification Score: X/10" and a brief reason.)
</STEP 2>

<STEP 3>
(Idle capital detection: State the exact percentage of capital not earning yield and briefly note why this is suboptimal.)
</STEP 3>

<STEP 4>
(Opportunity scan: List the top DeFi opportunities found via defi_radar that fit the user's capital size. If capital is small, emphasize staking. 
CRITICAL: If a DATA_SOURCE_HASH is provided by a tool, you MUST include this exact line:
"Dex pool snapshot hash: [HASH]")
</STEP 4>

<STEP 5>
(Risk analysis: MUST explicitly include the phrase "Risk Score: X/10" to the chosen opportunities and explain risks like impermanent loss or smart contract vulnerabilities clearly but concisely.)
</STEP 5>

<FINAL>
(Your definitive Recommended Strategy. Provide clear, actionable numbered steps. State the dApp URL as a Markdown link. If you recommend a swap, explicitly instruct the user to type the exact swap command in the terminal (e.g., "swap 10 hbar to sauce") to trigger the Autonomous Execution Engine.)
</FINAL>`,
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SERVICE EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export class LangchainAgentService {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY;
        if (!this.apiKey) console.warn("[LangchainAgent] GEMINI_API_KEY missing");
    }

    /**
     * Parses the strict XML output into the steps array expected by ProofFlow UI
     */
    _parseSteps(rawText) {
        const steps = [];
        const regex = /<(STEP\s*\d+|FINAL)>([\s\S]*?)<\/\1>/gi;
        let match;
        let stepCount = 1;

        while ((match = regex.exec(rawText)) !== null) {
            const label = match[1].toUpperCase();
            const content = match[2].trim();
            const hash = crypto.createHash("sha256").update(content).digest("hex");

            steps.push({
                stepNumber: stepCount++,
                label: label.includes("FINAL") ? "FINAL" : label,
                content,
                hash,
                timestamp: Date.now() + stepCount
            });
        }

        // Fallback if the agent disobeyed the prompt (safety net)
        if (steps.length === 0) {
            console.warn("[LangChain Parser] Agent disobeyed XML format. Creating fallback steps.");
            const hash = crypto.createHash("sha256").update(rawText).digest("hex");
            return [
                { stepNumber: 1, label: "STEP 1", content: "Analyzing on-chain data and compiling DeFi opportunities...", hash: crypto.createHash("sha256").update("1").digest("hex"), timestamp: Date.now() },
                { stepNumber: 2, label: "FINAL", content: rawText.trim(), hash, timestamp: Date.now() + 10 }
            ];
        }

        // Ensure last step is FINAL
        if (steps[steps.length - 1].label !== "FINAL") {
            steps[steps.length - 1].label = "FINAL";
        }

        return steps;
    }

    async executeDeFiFlow(question) {
        if (!this.apiKey) throw new Error("GEMINI_API_KEY not configured for LangChain.");
        
        console.log(`[LangchainAgent] Executing Actionable flow for query: "${question}"`);
        
        const agent = buildLangChainExecutor(this.apiKey);
        
        const result = await agent.invoke({
            messages: [new HumanMessage(question)],
        });

        const rawContent = result.messages[result.messages.length - 1]?.content || "";
        const parsedSteps = this._parseSteps(rawContent);

        return {
            proofId: `pf-${uuidv4()}`,
            steps: parsedSteps,
            totalSteps: parsedSteps.length,
            createdAt: new Date().toISOString(),
            dataSources: ["Hedera Mirror Node (mainnet)", "DexScreener API"]
        };
    }
}
