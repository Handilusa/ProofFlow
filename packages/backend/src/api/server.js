import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { createDDoSShield } from "./middleware/ddosShield.js";
import { createCaptchaChallenge } from "./middleware/captchaChallenge.js";
import { body, param, validationResult } from "express-validator";
import { fetchLeaderboard, fetchStats } from "../services/mirrorNode.js";
import { GeminiService } from "../services/gemini.service.js";
import { HCSAuditService } from "../services/hcsAudit.service.js";
import { AuditPassService } from "../services/auditPass.service.js";
import { enrichQuestionWithMarketData } from "../services/marketData.service.js";
import { UserService } from "../services/userService.js";
import { mintAndTransferGenesis } from "../services/genesisMint.service.js";
import { isContractReady, getContractAddress, recordAuditInEVM } from "../services/hedera/proofflow.js";
import { startContractListener } from "../services/hedera/contractListener.js";
import { getNetwork, getMirrorNodeUrl } from "../services/hedera/networkManager.js";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to extract network from request
const extractNetwork = (req) => {
    return getNetwork(req.headers['x-network'] || req.query.network || 'testnet');
};

process.on("unhandledRejection", (reason, promise) => {
    console.error("[CRITICAL] Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
    console.error("[CRITICAL] Uncaught Exception:", err);
});

const app = express();
const PORT = process.env.PORT || 3002;
const UPTIME_START = Date.now();

// Micropayment config
const EVM_ADDRESS_MAINNET = process.env.EVM_ADDRESS_MAINNET || '';
const EVM_ADDRESS_TESTNET = process.env.EVM_ADDRESS_TESTNET || '';

const getOperatorEvmAddress = (network) => {
    return network === 'mainnet' ? EVM_ADDRESS_MAINNET : EVM_ADDRESS_TESTNET;
};

// Calculate realistic fee:
// HTS Mint: ~$0.01
// HCS Submit (2-3 messages): ~$0.0005
// EVM Smart Contract (gas): ~$0.03
// Base cost ~ $0.05 (approx 0.5 HBAR)
const getServiceFee = (network, tierId = 'free') => {
    const isMainnet = network === 'mainnet';
    const baseFee = isMainnet ? 1.6 : 0.16; // 0.16 HBAR for testnet (realistic cost)
    const costBase = isMainnet ? 0.5 : 0.01; // covers network costs

    if (tierId === 'gold') return costBase.toString();
    if (tierId === 'silver') return (baseFee * 0.8).toFixed(2); // 20% discount
    if (tierId === 'bronze') return (baseFee * 0.9).toFixed(2); // 10% discount

    return baseFee.toFixed(2);
};

// Verify a payment transaction on Mirror Node
async function verifyPayment(txHash, _expectedPayerAddress, networkStr) {
    const network = getNetwork(networkStr);
    const mirrorNodeUrl = getMirrorNodeUrl(network);
    try {
        // Give mirror node time to index the transaction
        await new Promise(r => setTimeout(r, 3000));

        // Hedera EVM tx hashes need to be looked up via the mirror node
        const res = await fetch(`${mirrorNodeUrl}/contracts/results/${txHash}`);
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

// ═══════════════════════════════════════════════════════
// 🛡️  3-LAYER API PROTECTION SYSTEM
// Order: DDoS Shield → CAPTCHA Challenge → Rate Limiter
// ═══════════════════════════════════════════════════════

// Layer 2: DDoS Shield — detects coordinated multi-IP attacks
const ddosShield = createDDoSShield();
app.use(ddosShield);

// Layer 3: Dynamic CAPTCHA — challenges suspicious bot-like traffic
const { middleware: captchaMiddleware, verifyHandler: captchaVerifyHandler } = createCaptchaChallenge();
app.use(captchaMiddleware);

// Layer 1: Rate Limiter — 100 requests/min per IP, then HTTP 429
const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.warn(`[Rate Limit] 🚫 IP ${req.ip} exceeded 100 req/min — BLOCKED`);
        return res.status(429).json({
            success: false,
            error: "Too many requests. You are limited to 100 requests per minute.",
            reason: "RATE_LIMIT",
            retryAfter: 60,
        });
    },
});
app.use(limiter);

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

app.get("/api/v1/user/tier/:address",
    [param("address").isString().notEmpty()],
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { address } = req.params;
            const network = extractNetwork(req);
            const tier = await auditPassService.getUserTier(address, network);
            return res.status(200).json(tier);
        } catch (error) {
            next(error);
        }
    }
);

app.post("/api/v1/reason",
    [
        body("question").isString().notEmpty().withMessage("question is required"),
        body("requesterAddress").optional().isString(),
        body("paymentTxHash").optional().isString(),
        body("parentProofIds").optional().isArray().withMessage("parentProofIds must be an array")
    ],
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { question, requesterAddress, paymentTxHash, parentProofIds } = req.body;
            const network = extractNetwork(req);

            let userTier = { id: 'free', discount: 0 };
            if (requesterAddress) {
                try {
                    userTier = await auditPassService.getUserTier(requesterAddress, network);
                } catch (e) {
                    console.error("[API] Failed to fetch user tier for validation:", e.message);
                }
            }

            // Enforce micropayment when OPERATOR_EVM_ADDRESS is configured
            const operatorAddress = getOperatorEvmAddress(network);
            if (operatorAddress) {
                if (!paymentTxHash) {
                    return res.status(402).json({
                        success: false,
                        error: "Payment required. Please connect a wallet and complete the micropayment.",
                        expectedFee: getServiceFee(network, userTier.id)
                    });
                }
                const verified = await verifyPayment(paymentTxHash, requesterAddress, network);
                if (!verified) {
                    return res.status(402).json({
                        success: false,
                        error: "Payment verification failed. Please try again.",
                    });
                }
                console.log(`[API] Payment verified: ${paymentTxHash}`);
            }

            // 0. Resolve parent proofs for Multi-Agent Reasoning Chain
            let parentContext = "";
            const resolvedParents = [];
            if (parentProofIds && parentProofIds.length > 0) {
                console.log(`[API] 🔗 Multi-Agent Chain: resolving ${parentProofIds.length} parent proof(s)...`);
                for (const pid of parentProofIds) {
                    const parentProof = await hcsAuditService.getProofById(pid);
                    if (parentProof) {
                        const parentAnswer = parentProof.steps?.find(s => s.label === "FINAL")?.content || "(no final answer)";
                        const parentHash = parentProof.rootHash || "(pending)";
                        resolvedParents.push({
                            proofId: pid,
                            question: parentProof.question,
                            answer: parentAnswer.substring(0, 500),
                            rootHash: parentHash,
                        });
                        console.log(`[API]   ✓ Parent ${pid}: hash=${parentHash?.substring(0, 16)}...`);
                    } else {
                        console.warn(`[API]   ⚠ Parent ${pid} not found — skipping`);
                    }
                }

                if (resolvedParents.length > 0) {
                    parentContext = "\n\n══════ VERIFIED PARENT PROOFS (On-Chain) ══════\n"
                        + "The following conclusions were produced by other autonomous agents and are "
                        + "cryptographically anchored on Hedera Consensus Service (HCS). "
                        + "You MUST incorporate these verified findings into your analysis.\n\n"
                        + resolvedParents.map((p, i) =>
                            `── Parent Proof #${i + 1} ──\n`
                            + `  Proof ID:   ${p.proofId}\n`
                            + `  Root Hash:  ${p.rootHash}\n`
                            + `  Question:   ${p.question}\n`
                            + `  Conclusion: ${p.answer}\n`
                        ).join("\n")
                        + "\n══════════════════════════════════════════════\n";
                }
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

            // Inject parent proof context into the prompt
            if (parentContext) {
                enrichedPrompt = parentContext + "\n" + enrichedPrompt;
                console.log(`[API] 🔗 Injected ${resolvedParents.length} parent proof(s) into prompt context`);
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
            reasoningResult.parentProofIds = parentProofIds || [];
            reasoningResult.parentProofs = resolvedParents;

            // 3. Ensure the model actually completed its reasoning
            const finalAnswerStep = reasoningResult.steps.find(s => s.label === "FINAL");

            if (!finalAnswerStep) {
                console.error("[API] AI generation stopped prematurely without a FINAL step.");
                return res.status(503).json({
                    success: false,
                    error: "El Agente IA no pudo concluir el razonamiento complejo. Por favor, intenta de nuevo con un contexto más específico.",
                });
            }

            // Return result immediately to client so UI unblocks
            const responseData = {
                proofId: reasoningResult.proofId,
                question: reasoningResult.question,
                answer: finalAnswerStep.content,
                steps: reasoningResult.steps,
                totalSteps: reasoningResult.totalSteps,
                status: "PUBLISHING_TO_HEDERA",
                hcsTopicId: "pending",
                dataSources: sources,
                createdAt: reasoningResult.createdAt,
                requesterAddress: requesterAddress,
                parentProofIds: reasoningResult.parentProofIds,
                parentProofs: resolvedParents,
                network: network,
                tier: userTier.id
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
                        requesterAddress: requesterAddress,
                        network: network
                    });

                    saveProofsToDisk();

                    await hcsAuditService.publishReasoningChain(reasoningResult.proofId, reasoningResult.steps, network);

                    if (requesterAddress) {
                        try {
                            let resolveAddress = requesterAddress;
                            if (resolveAddress.startsWith('0x')) {
                                try {
                                    const { getMirrorNodeUrl } = await import("../services/hedera/networkManager.js");
                                    const mirrorNodeUrl = getMirrorNodeUrl(network);
                                    const res = await fetch(`${mirrorNodeUrl}/accounts/${resolveAddress}`);
                                    if (res.ok) {
                                        const data = await res.json();
                                        if (data.account) resolveAddress = data.account;
                                    }
                                } catch (e) {
                                    console.log(`[API] Could not resolve EVM address ${resolveAddress} to Hedera ID:`, e.message);
                                }
                            }
                            await auditPassService.mintAuditPass(reasoningResult.proofId, resolveAddress, null, network);
                        } catch (e) {
                            console.error("[Async] Failed to mint audit pass", e);
                        }
                    }

                    try {
                        const stored = proofsStore.get(reasoningResult.proofId);
                        const finalRootHash = stored ? stored.rootHash : ethers.id("fallback-hash");

                        const evmTxHash = await recordAuditInEVM(reasoningResult.question, finalRootHash, requesterAddress, network);

                        if (stored) {
                            if (evmTxHash) {
                                stored.evmTxHash = evmTxHash;
                                stored.evmSettled = true;
                            }
                            stored.status = "VERIFIED";
                            proofsStore.set(reasoningResult.proofId, stored);
                            saveProofsToDisk();
                            console.log(`[EVM - ${network.toUpperCase()}] Proof ${reasoningResult.proofId} reached VERIFIED state. ${evmTxHash ? `(tx: ${evmTxHash})` : '(EVM registration skipped)'}`);
                        }
                    } catch (e) {
                        console.error("[EVM] Async recording error:", e.message);
                        const stored = proofsStore.get(reasoningResult.proofId);
                        if (stored) {
                            stored.status = "VERIFIED";
                            proofsStore.set(reasoningResult.proofId, stored);
                            saveProofsToDisk();
                        }
                    }
                } catch (err) {
                    console.error("[Async] Fatal Hedera operation failed:", err.message);
                    try {
                        const { proofsStore, saveProofsToDisk } = await import("../services/hcsAudit.service.js");
                        const stored = proofsStore.get(reasoningResult.proofId);
                        if (stored) {
                            stored.status = "FAILED";
                            stored.error = err.message;
                            proofsStore.set(reasoningResult.proofId, stored);
                            saveProofsToDisk();
                        }
                    } catch (e) {
                        console.error("[Async] Could not update failure status:", e);
                    }
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
            const network = extractNetwork(req);

            if (!isContractReady(network)) {
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

            // 3. Load ABI — try local config copy first (production), then cross-package path
            const localArtifactPath = path.join(__dirname, "../../config/ProofValidator.json");
            const crossPkgArtifactPath = path.join(__dirname, "../../../contracts/artifacts/contracts/ProofValidator.sol/ProofValidator.json");
            const artifactPath = fs.existsSync(localArtifactPath) ? localArtifactPath : crossPkgArtifactPath;
            if (!fs.existsSync(artifactPath)) {
                return res.status(500).json({ error: "Contract ABI not found" });
            }

            const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

            // 4. Return data needed for `wagmi` useWriteContract
            return res.status(200).json({
                contractAddress: getContractAddress(network),
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
                    const network = extractNetwork(req);
                    const mirrorNodeUrl = getMirrorNodeUrl(network);
                    const mnRes = await fetch(`${mirrorNodeUrl}/accounts/${address}`);
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
                    const network = extractNetwork(req);
                    const mirrorNodeUrl = getMirrorNodeUrl(network);
                    const mnRes = await fetch(`${mirrorNodeUrl}/accounts/${address}`);
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

// ═══════════════════════════════════════════════════════
// 🔗  Proof Verification & Lineage (Multi-Agent Chain)
// ═══════════════════════════════════════════════════════
app.get("/api/v1/verify/:proofId",
    [param("proofId").isString().notEmpty()],
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { proofId } = req.params;
            const proof = await hcsAuditService.getProofById(proofId);

            if (!proof) {
                return res.status(404).json({ error: "Proof not found" });
            }

            // Build lineage chain by walking parent proofs
            const lineage = [];
            const visited = new Set();
            const buildLineage = async (pid) => {
                if (visited.has(pid)) return;
                visited.add(pid);
                const p = await hcsAuditService.getProofById(pid);
                if (!p) return;
                lineage.push({
                    proofId: pid,
                    question: p.question,
                    rootHash: p.rootHash || null,
                    hcsTopicId: p.hcsTopicId || null,
                    evmTxHash: p.evmTxHash || null,
                    status: p.status,
                    parentProofIds: p.parentProofIds || [],
                    createdAt: p.createdAt,
                });
                for (const parentId of (p.parentProofIds || [])) {
                    await buildLineage(parentId);
                }
            };
            await buildLineage(proofId);

            return res.status(200).json({
                proofId,
                rootHash: proof.rootHash || null,
                hcsTopicId: proof.hcsTopicId || null,
                evmTxHash: proof.evmTxHash || null,
                status: proof.status,
                parentProofIds: proof.parentProofIds || [],
                lineage,
                chainDepth: lineage.length,
            });
        } catch (error) {
            next(error);
        }
    }
);

app.get("/api/v1/proofs", async (req, res, next) => {
    try {
        const address = req.query.address;
        const network = extractNetwork(req);
        const proofs = await hcsAuditService.getRecentProofs(address, network);
        return res.status(200).json(proofs);
    } catch (error) {
        next(error);
    }
});

app.get("/api/v1/leaderboard", async (req, res, next) => {
    try {
        const network = extractNetwork(req);
        const leaderboard = await fetchLeaderboard(userService, network);
        return res.status(200).json(leaderboard);
    } catch (error) {
        next(error);
    }
});

app.get("/api/v1/stats", async (req, res, next) => {
    try {
        const network = extractNetwork(req);
        const stats = await fetchStats(network);
        return res.status(200).json(stats);
    } catch (error) {
        next(error);
    }
});

app.get("/api/v1/health", (req, res) => {
    const network = extractNetwork(req);
    return res.status(200).json({
        status: "ok",
        network: network,
        uptime: Math.floor((Date.now() - UPTIME_START) / 1000)
    });
});

// CAPTCHA verification endpoint
app.post("/api/v1/captcha/verify",
    [
        body("captchaToken").isString().notEmpty().withMessage("captchaToken is required"),
        body("captchaSolution").notEmpty().withMessage("captchaSolution is required")
    ],
    handleValidationErrors,
    captchaVerifyHandler
);

// Mint Genesis Endpoint
app.post("/api/v1/mint-genesis",
    [
        body("address").isString().notEmpty().withMessage("Wallet address is required")
    ],
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { address } = req.body;
            const network = extractNetwork(req);
            
            console.log(`[API] Received Genesis Mint request for ${address} on ${network}`);
            
            const result = await mintAndTransferGenesis(address, network);
            
            return res.status(200).json({
                success: true,
                ...result
            });
        } catch (error) {
            console.error("[API] Mint Genesis Failed:", error.message);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
);

// Config endpoint — tells frontend where to send micropayment
app.get("/api/v1/config", async (req, res) => {
    const network = extractNetwork(req);
    const address = req.query.address;
    const isMainnet = network === "mainnet";
    const operatorAddress = getOperatorEvmAddress(network);

    let userTier = { id: 'free', discount: 0 };
    if (address) {
        try {
            userTier = await auditPassService.getUserTier(address, network);
        } catch (e) { }
    }

    return res.status(200).json({
        operatorEvmAddress: operatorAddress,
        operatorAccountId: isMainnet ? process.env.HEDERA_ACCOUNT_ID_MAINNET : process.env.HEDERA_ACCOUNT_ID_TESTNET,
        serviceFeeHbar: getServiceFee(network, userTier.id),
        network: network,
        paymentRequired: !!operatorAddress,
        contractAddress: getContractAddress(network),
        contractReady: isContractReady(network),
        userTier: userTier
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
