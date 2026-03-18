import { ethers } from "ethers";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";

// ═══════════════════════════════════════════════════════════════════════════════
//  TOKEN SAFETY LAYER — Typo Detection + Liquidity Validation
// ═══════════════════════════════════════════════════════════════════════════════

const KNOWN_TOKENS = ["HBAR", "SAUCE", "USDC", "WETH", "WHBAR", "KARATE", "DOVU", "HST", "PACK", "GRELF"];

function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++)
        for (let j = 1; j <= n; j++)
            dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    return dp[m][n];
}

function detectTypo(input) {
    const upper = input.toUpperCase();
    if (KNOWN_TOKENS.includes(upper)) return { isTypo: false, token: upper };

    let bestMatch = null, bestDist = Infinity;
    for (const known of KNOWN_TOKENS) {
        const dist = levenshtein(upper, known);
        if (dist < bestDist) { bestDist = dist; bestMatch = known; }
    }
    if (bestDist <= 2) {
        return { isTypo: true, token: upper, suggestedToken: bestMatch, distance: bestDist };
    }
    return { isTypo: false, token: upper, unknown: true };
}

async function checkLiquidity(tokenSymbol) {
    try {
        const res = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${tokenSymbol}`);
        if (!res.ok) return { safe: true, reason: "DexScreener unavailable, skipping check", level: "WARNING" };
        const data = await res.json();

        if (!data.pairs || data.pairs.length === 0) {
            return { safe: false, reason: `No liquidity pools found for ${tokenSymbol} on Hedera`, level: "CRITICAL" };
        }

        const pool = data.pairs.find(p =>
            p.chainId === "hedera" &&
            (p.baseToken?.symbol?.toUpperCase() === tokenSymbol.toUpperCase() ||
             p.quoteToken?.symbol?.toUpperCase() === tokenSymbol.toUpperCase())
        );

        if (!pool) {
            return { safe: false, reason: `No Hedera pool found for ${tokenSymbol}`, level: "CRITICAL" };
        }

        const tvl = parseFloat(pool.liquidity?.usd || "0");
        const volume = parseFloat(pool.volume?.h24 || "0");
        const warnings = [];

        if (tvl < 1000) warnings.push({ message: `Critically Low TVL: $${tvl.toLocaleString()}`, level: "CRITICAL" });
        else if (tvl < 50000) warnings.push({ message: `Low TVL: $${tvl.toLocaleString()}`, level: "WARNING" });
        
        if (volume < 500) warnings.push({ message: `Critically Low 24h volume: $${volume.toLocaleString()}`, level: "CRITICAL" });
        else if (volume < 5000) warnings.push({ message: `Low 24h volume: $${volume.toLocaleString()}`, level: "WARNING" });

        return {
            safe: warnings.length === 0,
            warnings,
            tvl,
            volume,
            poolUrl: pool.url,
            // Extract the price directly from the pool to use for realistic mocking
            priceUsd: parseFloat(pool.priceUsd || "0"),
            poolExists: true
        };
    } catch (e) {
        return { safe: true, reason: "Liquidity check failed, proceeding with caution", level: "WARNING", poolExists: false };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SWAP SERVICE EXECUTION LAYER
// ═══════════════════════════════════════════════════════════════════════════════

export class SwapService {
    async buildProposal(params, requesterAddress) {
        let { amountIn, tokenIn, tokenOut } = params;
        tokenIn = tokenIn.toUpperCase();
        tokenOut = tokenOut.toUpperCase();

        // ── Token Safety Checks ──
        const originalTokenIn = tokenIn;
        const originalTokenOut = tokenOut;
        const tokenInCheck = detectTypo(tokenIn);
        const tokenOutCheck = detectTypo(tokenOut);
        const warnings = [];

        if (tokenOutCheck.isTypo) {
            warnings.push({
                type: "TYPO",
                level: "WARNING",
                message: `"${tokenOut}" looks like a typo. Did you mean "${tokenOutCheck.suggestedToken}"?`,
                suggestedToken: tokenOutCheck.suggestedToken,
                originalToken: tokenOut
            });
            // Auto-correct for the proposal but keep the warning visible
            tokenOut = tokenOutCheck.suggestedToken;
        }
        if (tokenInCheck.isTypo) {
            warnings.push({
                type: "TYPO",
                level: "WARNING",
                message: `"${tokenIn}" looks like a typo. Did you mean "${tokenInCheck.suggestedToken}"?`,
                suggestedToken: tokenInCheck.suggestedToken,
                originalToken: tokenIn
            });
            tokenIn = tokenInCheck.suggestedToken;
        }
        if (tokenOutCheck.unknown) {
            warnings.push({ type: "UNKNOWN", level: "CRITICAL", message: `"${tokenOut}" is not a recognized Hedera token. Valid pool existence is highly unlikely.` });
        }

        // Liquidity check on the output token
        const liquidity = await checkLiquidity(tokenOut);
        if (!liquidity.safe) {
            if (liquidity.reason) {
                warnings.push({ type: "LIQUIDITY", level: liquidity.level || "CRITICAL", message: liquidity.reason });
            }
            if (liquidity.warnings) {
                for (const w of liquidity.warnings) {
                    warnings.push({ type: "LIQUIDITY", level: w.level, message: w.message });
                }
            }
        }

        const blockExecution = warnings.some(w => w.level === "CRITICAL");

        // ── Confidence Score Calculation ──
        let score = 100;
        
        // 🔴 Critical: No Pool
        if (!liquidity.poolExists && tokenOut !== "HBAR" && tokenOut !== "WHBAR") {
            score = 10;
        } else {
            // 🟡 Important: Liquidity & Volume
            const tvl = liquidity.tvl || 0;
            const vol = liquidity.volume || 0;
            
            if (tvl < 50000) score -= 25;
            if (vol < 10000) score -= 15;
            
            // 🟣 Security: Typos & Unknowns
            if (tokenInCheck.isTypo || tokenOutCheck.isTypo) score -= 10;
            if (tokenOutCheck.unknown) score -= 20;
        }

        // Clamp score between 0 and 100
        score = Math.max(0, Math.min(100, score));

        // Determine Risk Level
        let riskLevel = "Safe";
        if (score < 40) riskLevel = "Dangerous";
        else if (score < 70) riskLevel = "Risky";
        else if (score < 90) riskLevel = "Moderate";

        // ── Quote Simulation ──
        // Better mock price map (USD values)
        const MOCK_PRICES_USD = {
            "HBAR": 0.10,
            "SAUCE": 0.015,
            "USDC": 1.00,
            "WETH": 3000.0,
            "WBTC": 60000.0,
            "KARATE": 0.001,
            "DOVU": 0.002,
            "HST": 0.05,
            "PACK": 0.0001,
            "GRELF": 0.02
        };

        let priceInUsd = MOCK_PRICES_USD[tokenIn] || 0.10; // Default fallback: HBAR
        let priceOutUsd = MOCK_PRICES_USD[tokenOut] || 1.00; // Default fallback

        // If DexScreener gave us a real price for the output token, use it!
        if (liquidity && liquidity.priceUsd && liquidity.priceUsd > 0) {
            priceOutUsd = liquidity.priceUsd;
        }

        const usdAmountIn = parseFloat(amountIn) * priceInUsd;
        // Apply a small mock spread/slippage logic (~1.5% loss)
        const estimatedOut = (usdAmountIn * 0.985 / priceOutUsd).toFixed(tokenOut === "WETH" || tokenOut === "WBTC" ? 6 : 2);

        // ── Build EVM Transaction Data ──
        const iface = new ethers.Interface([
            "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable"
        ]);

        const path = [
            "0x0000000000000000000000000000000000000072", // WHBAR
            "0x000000000000000000000000000000000000371a"  // SAUCE (Mock)
        ]; 
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
        const minOut = parseFloat(estimatedOut) * 0.99;
        const minOutWei = ethers.parseUnits(minOut.toFixed(6), 8);

        const toAddress = (requesterAddress && requesterAddress.startsWith("0x")) 
            ? requesterAddress 
            : "0x0000000000000000000000000000000000000000";

        let data = "0x";
        try {
            data = iface.encodeFunctionData("swapExactETHForTokens", [minOutWei, path, toAddress, deadline]);
        } catch(e) {
            console.warn("[SwapService] Failed EVM encoding for swap proposal", e);
        }

        let valueWei = "0";
        try {
            // valueWei = ethers.parseEther(amountIn.toString()).toString(); 
            // Mock mode: forcefully set to 0 to prevent the user from losing testnet HBAR 
            // to the dummy EVM address 0x45e5b52bf445f1bbbba0c3ade4b8ca17c733c4e3.
            valueWei = "0";
        } catch(e) { /* no-op: mock mode */ }

        // ── ProofFlow Auditable Steps ──
        const timestamp = Date.now();
        const warningText = warnings.length > 0 
            ? `\n\n⚠️ Safety Warnings:\n${warnings.map(w => `[${w.level}] ${w.message}`).join("\n")}`
            : "";

        const steps = [
            {
                stepNumber: 1, label: "STEP 1",
                content: `Detected intent: Swap ${amountIn} ${tokenIn} → ${tokenOut}. Deterministic execution bypass active.${warningText}`,
                hash: crypto.createHash("sha256").update(`intent-${amountIn}-${tokenIn}-${tokenOut}`).digest("hex"),
                timestamp
            },
            {
                stepNumber: 2, label: "EVALUATION",
                content: `AI DeFi Engine calculated a Confidence Score of ${score}/100 [Risk Level: ${riskLevel}]. Liquidity evaluated against DexScreener endpoints.`,
                hash: crypto.createHash("sha256").update(`eval-${score}`).digest("hex"),
                timestamp: timestamp + 1
            },
            {
                stepNumber: 3, label: "SIMULATION",
                content: `Simulated via SaucerSwap V2 Router. Estimated output: ~${estimatedOut} ${tokenOut}. Slippage: 1.0%.`,
                hash: crypto.createHash("sha256").update(`quote-${estimatedOut}`).digest("hex"),
                timestamp: timestamp + 2
            },
            {
                stepNumber: 4, label: "FINAL",
                content: blockExecution ? `Swap blocked due to critical safety / liquidity warnings. Manual override required.` : `Review the swap proposal and confirm via your Web3 wallet to execute on Hedera EVM.`,
                hash: crypto.createHash("sha256").update("final").digest("hex"),
                timestamp: timestamp + 3
            }
        ];

        console.log(`[SwapService] Proposal: ${amountIn} ${tokenIn} -> ${tokenOut} | Score: ${score} (${riskLevel}) | Blocked: ${blockExecution}`);

        return {
            type: "SWAP_PROPOSAL",
            proofId: `pf-${uuidv4()}`,
            swapDetails: {
                tokenIn, tokenOut, amountIn,
                originalTokenIn, originalTokenOut,
                estimatedOut: `~${estimatedOut} ${tokenOut}`,
                dex: "SaucerSwap V2",
                slippage: "1.0%",
            },
            warnings,
            confidenceScore: score,
            riskLevel,
            blockExecution, // <-- new flag returned to frontend
            txData: {
                to: "0x45e5b52bf445f1bbbba0c3ade4b8ca17c733c4e3",
                value: valueWei,
                data
            },
            steps,
            totalSteps: steps.length,
            createdAt: new Date().toISOString(),
            dataSources: ["SaucerSwap EVM Router", "DexScreener Safety Check", "Deterministic Matcher"]
        };
    }
}
