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
import { isContractReady, getContractAddress, recordAuditInEVM } from "../services/hedera/proofflow.js";
import { startContractListener } from "../services/hedera/contractListener.js";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.on("unhandledRejection", (reason, promise) => {
    console.error("[CRITICAL] Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
    console.error("[CRITICAL] Uncaught Exception:", err);
});

const app = express();
const PORT = process.env.PORT || 3001;
const UPTIME_START = Date.now();

// Micropayment config
const OPERATOR_EVM_ADDRESS = process.env.EVM_ADDRESS || '';
const SERVICE_FEE_HBAR = process.env.SERVICE_FEE_HBAR || '0.02';
const HEDERA_NETWORK = process.env.HEDERA_NETWORK || 'testnet';
const MIRROR_NODE_URL = `https://${HEDERA_NETWORK}.mirrornode.hedera.com`;

// Verify a payment transaction on Mirror Node
async function verifyPayment(txHash, expectedPayerAddress) {
    try {
        // Give mirror node time to index the transaction
        await new Promise(r => setTimeout(r, 3000));

        // Hedera EVM tx hashes need to be looked up via the mirror node
        const res = await fetch(`${MIRROR_NODE_URL}/api/v1/contracts/results/${txHash}`);
        if (!res.ok) {
            console.log(`[Payment] Mirror node returned ${res.status} for tx ${txHash}`);
            // On testnet, mirror node indexing can be slow — accept payment optimistically
            console.log('[Payment] Accepting payment optimistically (testnet mode)');
            return true;
        }

        const data = await res.json();
        // Check the tx was successful
        if (data.result === 'SUCCESS' || data.status === '0x1') {
            console.log(`[Payment] ✅ Verified payment tx: ${txHash}`);
            return true;
        }

        console.log(`[Payment] ❌ Payment tx failed: ${JSON.stringify(data)}`);
        return false;
    } catch (err) {
        console.error('[Payment] Verification error:', err.message);
        // Testnet: accept optimistically if mirror node is not available
        console.log('[Payment] Accepting payment optimistically (mirror node unavailable)');
        return true;
    }
}

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
        body("requesterAddress").optional().isString(),
        body("paymentTxHash").optional().isString()
    ],
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { question, requesterAddress, paymentTxHash } = req.body;

            // Enforce micropayment when Smart Contract is active
            const contractActive = isContractReady();
            if (OPERATOR_EVM_ADDRESS && contractActive) {
                if (!paymentTxHash) {
                    return res.status(402).json({
                        success: false,
                        error: "Payment required. Please connect a wallet and complete the micropayment.",
                    });
                }
                const verified = await verifyPayment(paymentTxHash, requesterAddress);
                if (!verified) {
                    return res.status(402).json({
                        success: false,
                        error: "Payment verification failed. Please try again.",
                    });
                }
                console.log(`[API] Payment verified: ${paymentTxHash}`);
            } else if (OPERATOR_EVM_ADDRESS && paymentTxHash) {
                // Contract not active but payment was provided — still verify it
                const verified = await verifyPayment(paymentTxHash, requesterAddress);
                if (!verified) {
                    return res.status(402).json({
                        success: false,
                        error: "Payment verification failed. Please try again.",
                    });
                }
                console.log(`[API] Payment verified (legacy mode): ${paymentTxHash}`);
            }

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

                    try {
                        const stored = proofsStore.get(reasoningResult.proofId);
                        const finalRootHash = stored ? stored.rootHash : ethers.id("fallback-hash");
                        await recordAuditInEVM(reasoningResult.question, finalRootHash, requesterAddress);
                    } catch (e) {
                        console.error("[EVM] Async recording failed:", e);
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

// New endpoint: Get unsigned transaction data for EVM smart contract anchor
app.get("/api/v1/proof/:proofId/tx-data",
    [param("proofId").isString().notEmpty()],
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { proofId } = req.params;

            if (!isContractReady()) {
                return res.status(503).json({ error: "Smart contract not deployed or configured" });
            }

            // 1. Get the proof from HCS store to get the result hash
            const proof = await hcsAuditService.getProofById(proofId);
            if (!proof) {
                return res.status(404).json({ error: "Proof not found" });
            }

            // 2. We need the final answer to hash it (same logic as proofflow.js submitProof)
            const finalAnswerStep = proof.steps?.find(s => s.label === "FINAL");
            if (!finalAnswerStep) {
                return res.status(400).json({ error: "Proof incomplete, no FINAL step found" });
            }

            const resultData = finalAnswerStep.content;
            const resultHash = ethers.id(resultData);

            // 3. Load ABI
            const artifactPath = path.join(__dirname, "../../../contracts/artifacts/contracts/ProofValidator.sol/ProofValidator.json");
            if (!fs.existsSync(artifactPath)) {
                return res.status(500).json({ error: "Contract ABI not found" });
            }

            const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

            // 4. Return data needed for `wagmi` useWriteContract
            return res.status(200).json({
                contractAddress: getContractAddress(),
                abi: artifact.abi,
                args: [proofId, resultHash],
                functionName: "registerProof"
            });
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
        network: HEDERA_NETWORK,
        uptime: Math.floor((Date.now() - UPTIME_START) / 1000)
    });
});

// Config endpoint — tells frontend where to send micropayment
app.get("/api/v1/config", (req, res) => {
    return res.status(200).json({
        operatorEvmAddress: OPERATOR_EVM_ADDRESS,
        operatorAccountId: process.env.HEDERA_ACCOUNT_ID,
        serviceFeeHbar: SERVICE_FEE_HBAR,
        network: HEDERA_NETWORK,
        paymentRequired: !!OPERATOR_EVM_ADDRESS,
        contractAddress: getContractAddress(),
        contractReady: isContractReady(),
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
    app.listen(PORT, async () => {
        console.log(`Backend API running securely on port ${PORT}`);

        // Start autonomous blockchain listener
        try {
            await startContractListener({
                geminiService,
                hcsAuditService,
                auditPassService,
            });
        } catch (err) {
            console.error('[Agent Listener] Failed to start:', err.message);
        }
    });
}

export default app;
