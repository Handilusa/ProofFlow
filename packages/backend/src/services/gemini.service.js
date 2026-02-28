import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";

const MAX_RETRIES = 2;
const FETCH_TIMEOUT = 60000; // 60 seconds — Gemini 2.5 Flash needs time for thinking

/**
 * Parses Gemini's raw text response into structured reasoning steps.
 * Expects format: [STEP 1] content [STEP 2] content [FINAL] content
 */
function parseSteps(rawText) {
    const steps = [];
    // Match [STEP N] or [FINAL] blocks
    const regex = /\[(STEP\s*\d+|FINAL)\]\s*/gi;
    const matches = [...rawText.matchAll(regex)];

    if (matches.length === 0) {
        // If Gemini didn't follow format, wrap entire response as a single FINAL step
        const hash = crypto.createHash("sha256").update(rawText).digest("hex");
        steps.push({
            stepNumber: 1,
            label: "FINAL",
            content: rawText.trim(),
            hash,
            timestamp: Date.now(),
        });
        return steps;
    }

    for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        const nextMatch = matches[i + 1];
        const startIdx = match.index + match[0].length;
        const endIdx = nextMatch ? nextMatch.index : rawText.length;
        const content = rawText.slice(startIdx, endIdx).trim();
        const label = match[1].toUpperCase().includes("FINAL")
            ? "FINAL"
            : `STEP ${i + 1}`;
        const hash = crypto.createHash("sha256").update(content).digest("hex");

        steps.push({
            stepNumber: i + 1,
            label,
            content,
            hash,
            timestamp: Date.now(),
        });
    }

    return steps;
}

export class GeminiService {
    async reasonWithAudit(question, retryCount = 0) {
        const apiKey = (process.env.GEMINI_API_KEY || "").trim().replace(/['"]/g, '');

        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is not configured. Add it to your .env file.");
        }

        const modelName = "gemini-2.5-flash";
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
                        maxOutputTokens: 8192,
                        thinkingConfig: {
                            thinkingBudget: 2048
                        }
                    },
                    systemInstruction: {
                        parts: [{
                            text: `You are ProofFlow, a blockchain-anchored AI reasoning engine. Every single response you generate MUST be broken into explicit reasoning steps. This is non-negotiable.

STRICT OUTPUT FORMAT — YOU MUST FOLLOW THIS EXACTLY:

[STEP 1] <Your first distinct reasoning action: e.g. identifying the question scope, fetching real data, or defining relevant concepts>

[STEP 2] <Your second distinct reasoning action: e.g. analyzing the data, comparing options, or applying logic>

[STEP 3] <Your third distinct reasoning action: e.g. stress-testing your reasoning, identifying risks, or synthesizing evidence>

[FINAL] <Your definitive, well-reasoned conclusion and recommendation>

RULES:
- You MUST produce at minimum 3 STEPs and 1 FINAL section.
- Each step MUST be clearly labeled with [STEP N] or [FINAL].
- NEVER merge all your thinking into a single [FINAL] section or skip steps.
- Do NOT use any other format. Do NOT output plain prose without step labels.
- Each step should be substantive — at least 2-3 sentences of real analysis.
- If you use live data (prices, volumes, market cap), explicitly cite the source in the step (e.g. "CoinGecko data shows...").

VIOLATION OF THIS FORMAT WILL RESULT IN AN AUDIT FAILURE.`
                        }]
                    }
                })
            });

            clearTimeout(timeout);

            if (!response.ok) {
                const errorText = await response.text().catch(() => "No error body");

                if (response.status === 429 && retryCount < MAX_RETRIES) {
                    const waitTime = Math.min(10000 * (retryCount + 1), 30000);
                    console.warn(`[Gemini REST] Rate limited (429). Waiting ${waitTime / 1000}s before retry ${retryCount + 1}/${MAX_RETRIES}...`);
                    await new Promise(r => setTimeout(r, waitTime));
                    return this.reasonWithAudit(question, retryCount + 1);
                }

                console.error("[Gemini REST Error]:", response.status, errorText);
                throw new Error(`Gemini API Error: ${response.status} — ${errorText}`);
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

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
