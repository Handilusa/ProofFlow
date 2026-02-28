import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { body, param, validationResult } from "express-validator";
import { fetchLeaderboard, fetchStats } from "../services/mirrorNode.js";
import { GeminiService } from "../services/gemini.service.js";
import { HCSAuditService } from "../services/hcsAudit.service.js";
import { AuditPassService } from "../services/auditPass.service.js";
import "dotenv/config";
const app = express();
const PORT = process.env.PORT || 3001;
const UPTIME_START = Date.now();
// Instantiate Services
const geminiService = new GeminiService();
const hcsAuditService = new HCSAuditService();
const auditPassService = new AuditPassService();
// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
// Rate Limiter
const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};
app.post("/api/v1/reason", [
    body("question").isString().notEmpty().withMessage("question is required"),
    body("requesterAddress").optional().isString()
], handleValidationErrors, async (req, res, next) => {
    try {
        const { question, requesterAddress } = req.body;
        // 1. Call Gemini for reasoning
        const reasoningResult = await geminiService.reasonWithAudit(question);
        // 2. Return result immediately to client
        const finalAnswerStep = reasoningResult.steps.find(s => s.label === "FINAL");
        const responseData = {
            proofId: reasoningResult.proofId,
            question: reasoningResult.question,
            answer: finalAnswerStep ? finalAnswerStep.content : "Answer generation issue.",
            steps: reasoningResult.steps,
            totalSteps: reasoningResult.totalSteps,
            status: "PUBLISHING_TO_HEDERA",
            hcsTopicId: "pending", // Will update asynchronously
            createdAt: reasoningResult.createdAt,
        };
        res.status(201).json(responseData);
        // 3. Asynchronously handle Hedera operations
        setImmediate(async () => {
            try {
                // Update store initially before publishing 
                // (in a real DB we'd use await here or have a robust queue)
                const { proofsStore } = await import("../services/hcsAudit.service.js");
                proofsStore.set(reasoningResult.proofId, {
                    ...reasoningResult,
                    status: "PUBLISHING",
                    hcsTopicId: "unknown"
                });
                await hcsAuditService.publishReasoningChain(reasoningResult.proofId, reasoningResult.steps);
                if (requesterAddress) {
                    try {
                        await auditPassService.mintAuditPass(reasoningResult.proofId, requesterAddress);
                    }
                    catch (e) {
                        console.error("Failed to mint audit pass", e);
                    }
                }
            }
            catch (err) {
                console.error("Async Hedera operation failed:", err);
            }
        });
    }
    catch (error) {
        next(error);
    }
});
app.get("/api/v1/proof/:proofId", [param("proofId").isString().notEmpty()], handleValidationErrors, async (req, res, next) => {
    try {
        const { proofId } = req.params;
        const proof = await hcsAuditService.getProofById(proofId);
        if (!proof) {
            return res.status(404).json({ error: "Proof not found" });
        }
        return res.status(200).json(proof);
    }
    catch (error) {
        next(error);
    }
});
app.get("/api/v1/proofs", async (req, res, next) => {
    try {
        const proofs = await hcsAuditService.getRecentProofs();
        return res.status(200).json(proofs);
    }
    catch (error) {
        next(error);
    }
});
app.get("/api/v1/leaderboard", async (req, res, next) => {
    try {
        const leaderboard = await fetchLeaderboard();
        return res.status(200).json(leaderboard);
    }
    catch (error) {
        next(error);
    }
});
app.get("/api/v1/stats", async (req, res, next) => {
    try {
        const stats = await fetchStats();
        return res.status(200).json(stats);
    }
    catch (error) {
        next(error);
    }
});
app.get("/api/v1/health", (req, res) => {
    return res.status(200).json({
        status: "ok",
        network: "testnet",
        uptime: Math.floor((Date.now() - UPTIME_START) / 1000)
    });
});
// Centralized Error Handler
app.use((err, req, res, next) => {
    console.error("Express Error Handler:", err);
    res.status(500).json({
        success: false,
        error: "Internal Server Error",
        message: err.message
    });
});
if (process.env.NODE_ENV !== "test") {
    app.listen(PORT, () => {
        console.log(`Backend API running securely on port ${PORT}`);
    });
}
export default app;
