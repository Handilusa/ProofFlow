/**
 * ═══════════════════════════════════════════════════════════════════════
 * Agent Intent Router — Classifies user intent to route between agents
 * ═══════════════════════════════════════════════════════════════════════
 *
 * This is a lightweight, deterministic classifier (NO AI calls).
 * It decides whether a user's question should be handled by:
 *   - ANALYTICAL: ProofFlow Neural Engine v2 (existing, untouched)
 *   - ACTIONABLE:  OpenClaw LangChain Agent → then ProofFlow Engine
 *
 * The classifier uses keyword matching only — fast, predictable, no cost.
 */

// Keywords that signal the user wants DeFi / wallet / portfolio actions
const ACTIONABLE_KEYWORDS = [
    // Wallet Analysis
    "my wallet", "mi wallet", "my portfolio", "mi portafolio", "mi cartera",
    "wallet", "balance", "holdings", "tokens held",
    // Direct account references (detected separately)
    // DeFi Actions
    "invest", "invertir", "deposit", "depositar", "swap", "provide liquidity",
    "liquidez", "farm", "farming", "stake my", "hacer staking",
    "opportunity", "oportunidad", "opportunities", "oportunidades",
    "radar", "scan", "escanear", "recommend", "recomienda",
    "where to put", "donde meter", "donde invertir", "where should i",
    "pool", "yield", "apr", "apy",
    // Portfolio management
    "rebalance", "diversify", "diversificar", "allocate", "asignar",
    "idle capital", "capital ocioso", "unused", "sin usar",
];

// Regex to detect Hedera account IDs or EVM addresses in the question  
const ACCOUNT_PATTERN = /(?:0\.0\.\d{4,}|0x[a-fA-F0-9]{40})/;

// Regex to detect an explicit swap command, e.g. "swap 5 hbar to sauce", "cambia 10.5 HBAR por USDC"
const SWAP_PATTERN = /(?:swap|cambia|cambiar)\s+(\d+\.?\d*)\s+(\w+)\s+(?:to|for|por|a|→)\s+(\w+)/i;

/**
 * Classifies whether the question should go to the OpenClaw Agent or Neural Engine.
 * 
 * @param {string} question - The user's raw input
 * @param {string} [requesterAddress] - The user's connected wallet address (optional)
 * @returns {{ route: 'ACTIONABLE' | 'ANALYTICAL', reason: string, injectedPrompt: string }}
 */
export function classifyIntent(question, requesterAddress) {
    const lowerQ = question.toLowerCase();

    // 0. Explicit Swap Command -> Route to SwapService (Deterministically parse, no AI wait)
    const swapMatch = question.match(SWAP_PATTERN);
    if (swapMatch) {
        return {
            route: "SWAP",
            reason: "Explicit swap command detected — routing to SwapService execution layer",
            swapParams: {
                amountIn: swapMatch[1],
                tokenIn: swapMatch[2].toUpperCase(),
                tokenOut: swapMatch[3].toUpperCase()
            }
        };
    }

    // 1. If it contains a wallet address → ACTIONABLE (they want wallet analysis)
    if (ACCOUNT_PATTERN.test(question)) {
        return {
            route: "ACTIONABLE",
            reason: "Wallet address detected — routing to OpenClaw Agent for portfolio analysis",
            injectedPrompt: question // Leave as is, the agent will find it
        };
    }

    // 2. Check for actionable keywords
    for (const keyword of ACTIONABLE_KEYWORDS) {
        if (lowerQ.includes(keyword)) {
            let promptModifier = question;
            // Unconditionally inject the requester's stored wallet address if they didn't manually type one
            if (requesterAddress && !ACCOUNT_PATTERN.test(question)) {
                promptModifier = `${question}\n\n[SYSTEM CONTEXT: The user's active Hedera wallet address is: ${requesterAddress}. You MUST use this address for your analysis.]`;
            }

            return {
                route: "ACTIONABLE",
                reason: `DeFi/action keyword "${keyword}" detected — routing to OpenClaw Agent`,
                injectedPrompt: promptModifier
            };
        }
    }

    // 3. Default → ANALYTICAL (ProofFlow Neural Engine v2 handles it directly)
    return {
        route: "ANALYTICAL",
        reason: "Analytical/research question — routing to ProofFlow Neural Engine v2",
        injectedPrompt: question
    };
}
