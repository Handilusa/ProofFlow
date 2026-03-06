import { GoogleGenerativeAI } from "@google/generative-ai";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";

export interface ReasoningStep {
    stepNumber: number;
    label: string; // "STEP 1", "STEP 2", "FINAL"
    content: string; // full text of the step
    hash: string; // SHA-256 of content
    timestamp: number;
}

export interface ReasoningResult {
    proofId: string;
    question: string;
    steps: ReasoningStep[];
    totalSteps: number;
    createdAt: number;
}

export class GeminiService {
    private models: any[] = [];
    private currentKeyIndex = 0;
    private static MAX_RETRIES = 3;

    constructor() {
        // Load all available API keys
        const keys = [
            process.env.GEMINI_API_KEY,
            process.env.GEMINI_API_KEY_2,
            process.env.GEMINI_API_KEY_3,
        ].filter(Boolean) as string[];

        if (keys.length === 0) {
            throw new Error("No GEMINI_API_KEY configured.");
        }

        const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
        const systemInstruction = `You are a transparent reasoning engine for blockchain audit verification. You MUST follow this exact output format with NO exceptions:

[STEP 1] {first reasoning step - data gathering and initial analysis}
[STEP 2] {second reasoning step - deeper analysis}
[STEP 3] {third reasoning step - synthesis and evaluation}
[FINAL] {definitive conclusion and recommendation}

CRITICAL RULES:
- You MUST produce at least 3 [STEP N] blocks plus exactly one [FINAL] block.
- The [FINAL] block is MANDATORY. Never stop before writing [FINAL].
- Each block must start with the exact tag format: [STEP 1], [STEP 2], etc.
- The last block MUST be [FINAL] followed by your definitive answer.
- Keep each step concise but substantive (2-4 paragraphs max per step).
- Do NOT use any other format or tags.`;

        for (const key of keys) {
            const genAI = new GoogleGenerativeAI(key);
            this.models.push(genAI.getGenerativeModel({
                model: modelName,
                systemInstruction,
                generationConfig: {
                    temperature: 0.4,
                    maxOutputTokens: 8192,
                }
            }));
        }

        console.log(`[Gemini] Initialized with ${this.models.length} API key(s). Model: ${modelName}`);
    }

    private getModel(): any {
        return this.models[this.currentKeyIndex];
    }

    private rotateKey(): boolean {
        const nextIndex = (this.currentKeyIndex + 1) % this.models.length;
        if (nextIndex === this.currentKeyIndex && this.models.length === 1) return false;
        // Don't rotate back to the starting key
        if (nextIndex === 0 && this.currentKeyIndex !== 0) {
            console.warn(`[Gemini] All ${this.models.length} API keys exhausted.`);
            return false;
        }
        this.currentKeyIndex = nextIndex;
        console.log(`[Gemini] 🔄 Rotated to API key #${nextIndex + 1}`);
        return true;
    }

    private parseSteps(text: string): ReasoningStep[] {
        const steps: ReasoningStep[] = [];
        const stepRegex = /\[(STEP \d+|FINAL(?: ANSWER| CONCLUSION)?|CONCLUSION)\]([\s\S]*?)(?=\[(?:STEP \d+|FINAL(?: ANSWER| CONCLUSION)?|CONCLUSION)\]|$)/g;
        let match;
        let stepNumber = 1;

        while ((match = stepRegex.exec(text)) !== null) {
            let label = match[1].trim();
            const content = match[2].trim();
            if (!content) continue;

            if (label.includes("FINAL") || label.includes("CONCLUSION")) {
                label = "FINAL";
            }

            const hash = crypto.createHash("sha256").update(content).digest("hex");
            steps.push({
                stepNumber: label === "FINAL" ? stepNumber : parseInt(label.replace("STEP ", "")),
                label,
                content,
                hash,
                timestamp: Date.now(),
            });
            stepNumber++;
        }
        return steps;
    }

    private hasFinalStep(steps: ReasoningStep[]): boolean {
        return steps.some(s => s.label === "FINAL");
    }

    async reasonWithAudit(question: string): Promise<ReasoningResult> {
        let steps: ReasoningStep[] = [];
        let lastRawText = "";

        for (let attempt = 1; attempt <= GeminiService.MAX_RETRIES; attempt++) {
            try {
                const prompt = attempt === 1
                    ? question
                    : `${question}\n\n[SYSTEM REMINDER: You MUST complete ALL reasoning steps and end with a [FINAL] block. This is attempt ${attempt}. Do NOT stop mid-reasoning.]`;

                console.log(`[Gemini] Attempt ${attempt}/${GeminiService.MAX_RETRIES} (key #${this.currentKeyIndex + 1})...`);

                const result = await this.getModel().generateContent(prompt);
                lastRawText = result.response.text();
                steps = this.parseSteps(lastRawText);

                if (this.hasFinalStep(steps) && steps.length >= 2) {
                    console.log(`[Gemini] ✅ Success on attempt ${attempt}. ${steps.length} steps parsed (including FINAL).`);
                    break;
                }

                console.warn(`[Gemini] ⚠️ Attempt ${attempt} incomplete: ${steps.length} steps, hasFinal=${this.hasFinalStep(steps)}. Retrying...`);
            } catch (err: any) {
                // On rate limit (429) or overload (503), rotate to next API key and retry without burning an attempt
                if (err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED') || err.message?.includes('503') || err.message?.includes('Service Unavailable')) {
                    console.warn(`[Gemini] ⚠️ Key #${this.currentKeyIndex + 1} overloaded/rate-limited. Rotating...`);
                    if (this.rotateKey()) {
                        attempt--; // Don't count this as a failed attempt
                        continue;
                    }
                }
                console.error(`[Gemini] ❌ Attempt ${attempt} error: ${err.message}`);
                if (attempt === GeminiService.MAX_RETRIES) throw err;
            }
        }

        // If after all retries we still don't have a FINAL, use whatever we got as a single FINAL fallback
        if (steps.length === 0) {
            const hash = crypto.createHash("sha256").update(lastRawText).digest("hex");
            steps.push({
                stepNumber: 1,
                label: "FINAL",
                content: lastRawText.trim(),
                hash,
                timestamp: Date.now()
            });
        }

        return {
            proofId: uuidv4(),
            question,
            steps,
            totalSteps: steps.length,
            createdAt: Date.now(),
        };
    }
}
