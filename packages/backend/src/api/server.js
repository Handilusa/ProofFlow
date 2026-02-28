import "dotenv/config";
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
import { enrichQuestionWithMarketData } from "../services/marketData.service.js";
import { UserService } from "../services/userService.js";

process.on("unhandledRejection", (reason, promise) => {
    console.error("[CRITICAL] Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
    console.error("[CRITICAL] Uncaught Exception:", err);
});

const app = express();
const PORT = process.env.PORT || 3001;
const UPTIME_START = Date.now();

// Instantiate Services
const geminiService = new GeminiService();
const hcsAuditService = new HCSAuditService();
const auditPassService = new AuditPassService();
const userService = new UserService();

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

app.post("/api/v1/reason",
    [
        body("question").isString().notEmpty().withMessage("question is required"),
        body("requesterAddress").optional().isString()
    ],
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { question, requesterAddress } = req.body;

            // 1. Enrich question with live market data
            let enrichedPrompt = question;
            let sources = [];
            try {
                const enrichResult = await enrichQuestionWithMarketData(question);
                enrichedPrompt = enrichResult.enrichedPrompt;
                sources = enrichResult.sources;
                console.log(`[API] Enriched with sources: ${sources.join(", ") || "none"}`);
            } catch (enrichErr) {
                console.warn("[API] Market data enrichment failed, using raw question:", enrichErr.message);
            }

            // 2. Call Gemini for reasoning with enriched context
            const reasoningResult = await geminiService.reasonWithAudit(enrichedPrompt);

            // Validate the response shape
            if (!reasoningResult || !Array.isArray(reasoningResult.steps)) {
                console.error("[API] Gemini returned invalid shape:", JSON.stringify(reasoningResult));
                return res.status(503).json({
                    success: false,
                    error: "AI service returned an unexpected response. Please try again.",
                });
            }

            // Store the original question, not the enriched one
            reasoningResult.question = question;
            reasoningResult.dataSources = sources;

            // 3. Return result immediately to client
            const finalAnswerStep = reasoningResult.steps.find(s => s.label === "FINAL");

            const responseData = {
                proofId: reasoningResult.proofId,
                question: reasoningResult.question,
                answer: finalAnswerStep ? finalAnswerStep.content : "Answer generation issue.",
                steps: reasoningResult.steps,
                totalSteps: reasoningResult.totalSteps,
                status: "PUBLISHING_TO_HEDERA",
                hcsTopicId: "pending",
                dataSources: sources,
                createdAt: reasoningResult.createdAt,
                requesterAddress: requesterAddress,
            };

            res.status(201).json(responseData);

            // 4. Asynchronously handle Hedera operations
            setImmediate(async () => {
                try {
                    const { proofsStore, saveProofsToDisk } = await import("../services/hcsAudit.service.js");
                    proofsStore.set(reasoningResult.proofId, {
                        ...reasoningResult,
                        status: "PUBLISHING",
                        hcsTopicId: "unknown",
                        requesterAddress: requesterAddress
                    });
                    saveProofsToDisk();

                    await hcsAuditService.publishReasoningChain(reasoningResult.proofId, reasoningResult.steps);

                    if (requesterAddress) {
                        try {
                            await auditPassService.mintAuditPass(reasoningResult.proofId, requesterAddress);
                        } catch (e) {
                            console.error("Failed to mint audit pass", e);
                        }
                    }
                } catch (err) {
                    console.error("Async Hedera operation failed:", err);
                }
            });

        } catch (error) {
            // Return a user-friendly error for AI failures
            if (error.message?.includes("Gemini") || error.message?.includes("GEMINI")) {
                console.error("[API] Gemini error:", error.message);
                return res.status(503).json({
                    success: false,
                    error: error.message,
                });
            }
            next(error);
        }
    }
);

app.get("/api/v1/proof/:proofId",
    [param("proofId").isString().notEmpty()],
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { proofId } = req.params;
            const proof = await hcsAuditService.getProofById(proofId);

            if (!proof) {
                return res.status(404).json({ error: "Proof not found" });
            }

            return res.status(200).json(proof);
        } catch (error) {
            next(error);
        }
    }
);

app.post("/api/v1/user/profile",
    [
        body("address").isString().notEmpty(),
        body("username").isString().isLength({ min: 1, max: 20 })
    ],
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { address, username } = req.body;
            let hederaAccountId = address.toLowerCase();

            // Resolve EVM mapping to Hedera ID if necessary
            if (address.startsWith("0x")) {
                try {
                    const network = process.env.HEDERA_NETWORK || "testnet";
                    const mnRes = await fetch(`https://${network}.mirrornode.hedera.com/api/v1/accounts/${address}`);
                    if (mnRes.ok) {
                        const mnData = await mnRes.json();
                        if (mnData.account) {
                            hederaAccountId = mnData.account.toLowerCase();
                        }
                    }
                } catch (e) {
                    console.error("[API] Failed to resolve EVM address to Hedera ID:", e);
                }
            }

            const updatedName = userService.setUsername(hederaAccountId, username);
            return res.status(200).json({ success: true, username: updatedName, accountId: hederaAccountId });
        } catch (error) {
            if (error.message && error.message.startsWith('COOLDOWN_ACTIVE:')) {
                const daysLeft = error.message.split(':')[1];
                return res.status(403).json({
                    success: false,
                    error: "COOLDOWN_ACTIVE",
                    daysLeft: parseInt(daysLeft, 10)
                });
            }
            next(error);
        }
    }
);

app.get("/api/v1/user/profile/:address",
    [param("address").isString().notEmpty()],
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { address } = req.params;
            let hederaAccountId = address.toLowerCase();

            // Resolve EVM mapping to Hedera ID if necessary
            if (address.startsWith("0x")) {
                try {
                    const network = process.env.HEDERA_NETWORK || "testnet";
                    const mnRes = await fetch(`https://${network}.mirrornode.hedera.com/api/v1/accounts/${address}`);
                    if (mnRes.ok) {
                        const mnData = await mnRes.json();
                        if (mnData.account) {
                            hederaAccountId = mnData.account.toLowerCase();
                        }
                    }
                } catch (e) {
                    // Ignore, proceed with EVM address
                }
            }

            const status = userService.getProfileStatus(hederaAccountId);
            return res.status(200).json(status);
        } catch (error) {
            next(error);
        }
    }
);

app.get("/api/v1/proofs", async (req, res, next) => {
    try {
        const address = req.query.address;
        const proofs = await hcsAuditService.getRecentProofs(address);
        return res.status(200).json(proofs);
    } catch (error) {
        next(error);
    }
});

app.get("/api/v1/leaderboard", async (req, res, next) => {
    try {
        const leaderboard = await fetchLeaderboard(userService);
        return res.status(200).json(leaderboard);
    } catch (error) {
        next(error);
    }
});

app.get("/api/v1/stats", async (req, res, next) => {
    try {
        const stats = await fetchStats();
        return res.status(200).json(stats);
    } catch (error) {
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
app.get("/api/v1/debug-gemini", async (req, res) => {
    try {
        const gemini = new GeminiService();
        const result = await gemini.reasonWithAudit("Basic connectivity test. Respond with [STEP 1] ok [FINAL] status: active");
        res.json({ success: true, result });
    } catch (err) {
        console.error("[DEBUG ROUTE ERROR]:", err);
        res.status(500).json({ success: false, error: err.message, stack: err.stack });
    }
});

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
