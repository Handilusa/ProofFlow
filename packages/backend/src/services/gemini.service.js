import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";

const MAX_RETRIES = 2;
const FETCH_TIMEOUT = 60000; // 60 seconds — Gemini 2.5 Flash needs time for thinking

/**
 * Build a pool of all available Gemini API keys from environment.
 * Supports GEMINI_API_KEY, GEMINI_API_KEY_2, GEMINI_API_KEY_3, etc.
 */
function buildKeyPool() {
    const keys = [];
    const primary = (process.env.GEMINI_API_KEY || "").trim().replace(/['"]/g, '');
    if (primary) keys.push(primary);

    // Check for additional numbered keys (GEMINI_API_KEY_2, _3, _4, ...)
    for (let i = 2; i <= 10; i++) {
        const key = (process.env[`GEMINI_API_KEY_${i}`] || "").trim().replace(/['"]/g, '');
        if (key) keys.push(key);
    }
    return keys;
}

const API_KEYS = buildKeyPool();
let currentKeyIndex = 0;

function getNextApiKey() {
    if (API_KEYS.length === 0) return null;
    const key = API_KEYS[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
    return key;
}

console.log(`[Gemini] Loaded ${API_KEYS.length} API key(s) for rotation.`);

/**
 * Parses Gemini's raw text response into structured reasoning steps.
 * Expects format: [STEP 1] content [STEP 2] content [FINAL] content
 */
function parseSteps(rawText) {
    const steps = [];
    // Match <STEP N> or <FINAL> blocks
    const regex = /<(STEP\s*\d+|FINAL)>/gi;
    const matches = [...rawText.matchAll(regex)];

    if (matches.length === 0) {
        // Fallback: If it completely failed to format, generate a 3-step synthetic structure
        // so the UI doesn't crash, but log it heavily for debugging.
        console.warn(`[Gemini Parser] Fallback triggered! No valid tags found in response:`, rawText.substring(0, 100) + '...');
        const hash = crypto.createHash("sha256").update(rawText).digest("hex");
        return [
            { stepNumber: 1, label: "STEP 1", content: "Analyzing request data...", hash: crypto.createHash("sha256").update("1").digest("hex"), timestamp: Date.now() },
            { stepNumber: 2, label: "STEP 2", content: "Processing internal models...", hash: crypto.createHash("sha256").update("2").digest("hex"), timestamp: Date.now() + 10 },
            { stepNumber: 3, label: "FINAL", content: rawText.trim() || "Execution completed.", hash, timestamp: Date.now() + 20 }
        ];
    }

    // Map the regex matches to our internal format
    for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        const nextMatch = matches[i + 1];
        const startIdx = match.index + match[0].length;
        const endIdx = nextMatch ? nextMatch.index : rawText.length;
        const content = rawText.slice(startIdx, endIdx)
            .replace(/<\/(?:STEP\s*\d+|FINAL)>/gi, "")
            .trim();
        
        // If it's the very last item, force it to be FINAL just in case
        const label = (match[1].toUpperCase().includes("FINAL") || i === matches.length - 1)
            ? "FINAL"
            : `STEP ${i + 1}`;
            
        const hash = crypto.createHash("sha256").update(content).digest("hex");

        steps.push({
            stepNumber: i + 1,
            label,
            content,
            hash,
            timestamp: Date.now() + i, // slight jitter to ensure unique timestamps
        });
    }

    // Safety net: Ensure the last step is ALWAYS labeled FINAL so the UI transitions correctly
    if (steps.length > 0 && steps[steps.length - 1].label !== "FINAL") {
        steps[steps.length - 1].label = "FINAL";
    }

    return steps;
}

export class GeminiService {
    async reasonWithAudit(question, retryCount = 0, keysTriedThisRound = 0) {
        const apiKey = getNextApiKey();

        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is not configured. Add it to your .env file.");
        }

        const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        console.log(`[Gemini REST] Calling ${modelName} on v1beta... (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                    contents: [{ parts: [{ text: question }] }],
                    tools: [{
                        googleSearch: {}
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 32768,
                        thinkingConfig: {
                            thinkingBudget: 16384
                        }
                    },
                    systemInstruction: {
                        parts: [{
                            text: `You are the ProofFlow Autonomous Agent. 
IDENTITY AND CONTEXT: You are an advanced AI reasoning engine anchored to the Hedera Hashgraph network. Your purpose is to provide verifiable, transparent, and irrefutable analysis for complex web3, crypto, and market queries. Every thought you have is logged on-chain via Hedera Consensus Service (HCS), and your final conclusions are anchored via EVM smart contracts. You represent the core intelligence of the ProofFlow platform. Never refer to yourself as a generic assistant or Google Gemini. Speak objectively, clinically, and with authority concerning blockchain and financial data.

LANGUAGE RULE — CRITICAL:
- Detect the language of the user's query and ALWAYS respond in that SAME language.
- If the user writes in English, respond entirely in English.
- If the user writes in Spanish, respond entirely in Spanish.
- If the user writes in any other language, respond in that language.
- NEVER mix languages in your response.

STRICT OUTPUT FORMAT — YOU MUST FOLLOW THIS EXACTLY:

<STEP 1>
Your first distinct reasoning action: e.g. identifying the question scope, fetching real data, or defining relevant concepts. Do not include markdown headers inside this step.
</STEP 1>

<STEP 2>
Your second distinct reasoning action: e.g. analyzing the data, comparing options, or applying logic.
</STEP 2>

<STEP 3>
Your third distinct reasoning action: e.g. stress-testing your reasoning, identifying risks, or synthesizing evidence.
</STEP 3>

<FINAL>
Your definitive, well-reasoned conclusion and recommendation. Do not include markdown headers inside this step.
</FINAL>

RULES:
- You MUST produce at minimum 3 STEPs and 1 FINAL section using the XML tags above.
- NEVER start your response with text outside of a tag. THE VERY FIRST TEXT OF YOUR RESPONSE MUST BE "<STEP 1>".
- Each step MUST be wrapped in its corresponding opening '<STEP N>' and closing '</STEP N>' XML tags.
- NEVER merge all your thinking into a single <FINAL> section or skip steps.
- Do NOT use any other format. Do NOT output plain prose without XML step tags.
- Each step should be substantive — at least 2-3 sentences of real analysis.
- If you use live data (prices, volumes, market cap), explicitly cite the source in the step (e.g. "CoinGecko data shows...").
- CRITICAL: Never use vague, theoretical, or filler language. Go straight to hard technical data and quantitative analysis.
- CRITICAL: NEVER say "Insufficient Data" or refuse to answer. If the user's question contains an unspecified variable (like "X"), you MUST:
  1. Calculate the BREAKEVEN THRESHOLD — tell the user exactly what value that variable would need to reach for their scenario to occur, using the real data you have.
  2. Use HISTORICAL MAXIMUMS from the network or market as a stress-test scenario if no variable is given.
  3. Always provide a definitive quantitative conclusion, even if it requires stating assumptions. Label assumptions clearly.

VIOLATION OF THIS FORMAT WILL RESULT IN AN AUDIT FAILURE.`
                        }]
                    }
                })
            });

            clearTimeout(timeout);

            if (!response.ok) {
                const errorText = await response.text().catch(() => "No error body");

                if (response.status === 429) {
                    // Try next API key immediately if we haven't exhausted the pool
                    if (keysTriedThisRound + 1 < API_KEYS.length) {
                        console.warn(`[Gemini REST] Key rate-limited (429). Rotating to next key (${keysTriedThisRound + 1}/${API_KEYS.length - 1} remaining)...`);
                        return this.reasonWithAudit(question, retryCount, keysTriedThisRound + 1);
                    }

                    // All keys exhausted for this round — apply backoff and retry
                    if (retryCount < MAX_RETRIES) {
                        const waitTime = Math.min(10000 * (retryCount + 1), 30000);
                        console.warn(`[Gemini REST] All ${API_KEYS.length} keys rate-limited. Waiting ${waitTime / 1000}s before retry round ${retryCount + 1}/${MAX_RETRIES}...`);
                        await new Promise(r => setTimeout(r, waitTime));
                        return this.reasonWithAudit(question, retryCount + 1, 0);
                    }
                }

                console.error("[Gemini REST Error]:", response.status, errorText);
                throw new Error(`Gemini API Error: ${response.status} — ${errorText}`);
            }

            const data = await response.json();
            const text = (data.candidates?.[0]?.content?.parts || [])
                .filter(p => p.text)
                .map(p => p.text)
                .join("") || "";

            if (!text) {
                throw new Error("Gemini returned an empty response. The model may be overloaded.");
            }

            // Parse raw text into structured steps array
            const steps = parseSteps(text);
            const proofId = uuidv4();

            console.log(`[Gemini REST] Success. Parsed ${steps.length} steps. ProofId: ${proofId}`);

            return {
                proofId,
                question,
                steps,
                totalSteps: steps.length,
                createdAt: Date.now(),
            };
        } catch (err) {
            if (err.name === 'AbortError') {
                console.error("[Gemini REST] Request timed out after 30s");
                throw new Error("Gemini API request timed out. Please try again.");
            }
            console.error("[Gemini REST Critical]:", err.message);
            throw err;
        }
    }
}
