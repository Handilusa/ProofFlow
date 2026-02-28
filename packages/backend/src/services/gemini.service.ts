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
    private model: any;

    constructor() {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
        this.model = genAI.getGenerativeModel({
            model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
            systemInstruction: `You are a transparent reasoning engine. Before giving your final answer, you MUST think step by step. Format your response EXACTLY like this:

[STEP 1] {first reasoning step}
[STEP 2] {second reasoning step}
[STEP 3] {third reasoning step}
... (as many steps as needed, minimum 4)
[FINAL] {your final answer}`,
        });
    }
    async reasonWithAudit(question: string): Promise<ReasoningResult> {
        const result = await this.model.generateContent(question);
        const text = result.response.text();

        const steps: ReasoningStep[] = [];

        // Regex to match [STEP N] or [FINAL] and capture the content until the next tag or end of string
        const stepRegex = /\[(STEP \d+|FINAL)\]([\s\S]*?)(?=\[(?:STEP \d+|FINAL)\]|$)/g;
        let match;
        let stepNumber = 1;

        while ((match = stepRegex.exec(text)) !== null) {
            const label = match[1].trim(); // e.g., "STEP 1" or "FINAL"
            const content = match[2].trim();

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

        // fallback if model didn't follow formatting strictly
        if (steps.length === 0) {
            const hash = crypto.createHash("sha256").update(text).digest("hex");
            steps.push({
                stepNumber: 1,
                label: "FINAL",
                content: text.trim(),
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
