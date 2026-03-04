/**
 * Contract Listener — Autonomous Agent Blockchain Monitor
 * 
 * Listens for AuditRequested events from the ProofValidator contract.
 * When a user deposits HBAR and requests an audit, this listener triggers
 * the full AI reasoning pipeline (Gemini → HCS → EVM settlement).
 */
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Global reference to the contract — set on init
let contract = null;
let provider = null;
let wallet = null;
let contractAddress = null;

/**
 * Initialize the contract listener. Should be called after the Express server boots.
 * @param {object} deps - Injected service dependencies
 * @param {object} deps.geminiService - GeminiService instance
 * @param {object} deps.hcsAuditService - HCSAuditService instance
 * @param {object} deps.auditPassService - AuditPassService instance
 */
export async function startContractListener({ geminiService, hcsAuditService, auditPassService }) {
    const rpcUrl = process.env.TESTNET_ENDPOINT || "https://testnet.hashio.io/api";
    const privateKey = process.env.TESTNET_OPERATOR_PRIVATE_KEY;

    if (!privateKey) {
        console.warn("[Agent Listener] Missing TESTNET_OPERATOR_PRIVATE_KEY — listener disabled.");
        return;
    }

    // Load contract address — relative to packages/backend/src/services/hedera/
    const configPath = path.join(__dirname, "../../../config/contract.json");
    if (!fs.existsSync(configPath)) {
        console.warn("[Agent Listener] contract.json not found at", configPath, "— listener disabled.");
        return;
    }
    const contractConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    contractAddress = contractConfig.address;

    // Load ABI — relative to packages/contracts/artifacts/
    const artifactPath = path.join(__dirname, "../../../../contracts/artifacts/contracts/ProofValidator.sol/ProofValidator.json");
    if (!fs.existsSync(artifactPath)) {
        console.warn("[Agent Listener] Contract ABI not found — listener disabled.");
        return;
    }
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

    // Connect
    provider = new ethers.JsonRpcProvider(rpcUrl);
    wallet = new ethers.Wallet(privateKey, provider);
    contract = new ethers.Contract(contractAddress, artifact.abi, wallet);

    console.log(`[Agent Listener] 🤖 Autonomous Agent activated!`);
    console.log(`[Agent Listener] Watching contract: ${contractAddress}`);
    console.log(`[Agent Listener] Agent wallet: ${wallet.address}`);

    // Start polling for AuditRequested events (Hedera JSON-RPC doesn't support WebSocket subscriptions reliably)
    pollForAuditRequests({ geminiService, hcsAuditService, auditPassService });
}

// Track which request IDs we've already processed
const processedRequests = new Set();

// Keep track of the last block we scanned
let lastScannedBlock = 0;

/**
 * Poll the blockchain for new AuditRequested events every N seconds.
 * Much more reliable than WebSocket listeners on Hedera Testnet.
 */
async function pollForAuditRequests(deps) {
    const POLL_INTERVAL = 10_000; // 10 seconds

    // Get the current block on first run
    try {
        lastScannedBlock = await provider.getBlockNumber();
        console.log(`[Agent Listener] Starting from block: ${lastScannedBlock}`);
    } catch (err) {
        console.error("[Agent Listener] Failed to get initial block number:", err.message);
        lastScannedBlock = 0;
    }

    const poll = async () => {
        try {
            const currentBlock = await provider.getBlockNumber();

            if (currentBlock <= lastScannedBlock) return;

            // Query AuditRequested events from lastScannedBlock to currentBlock
            const filter = contract.filters.AuditRequested();
            const events = await contract.queryFilter(filter, lastScannedBlock + 1, currentBlock);

            for (const event of events) {
                const requestId = event.args[0].toString();
                const requester = event.args[1];
                const prompt = event.args[2];
                const deposit = event.args[3];

                if (processedRequests.has(requestId)) continue;
                processedRequests.add(requestId);

                console.log(`\n[Agent Listener] 🔔 NEW AUDIT REQUEST DETECTED!`);
                console.log(`  Request ID: ${requestId}`);
                console.log(`  Requester:  ${requester}`);
                console.log(`  Deposit:    ${ethers.formatEther(deposit)} HBAR`);
                console.log(`  Prompt:     "${prompt.substring(0, 80)}..."`);

                // Handle this request asynchronously
                handleAuditRequest(requestId, requester, prompt, deps).catch(err => {
                    console.error(`[Agent Listener] ❌ Failed to process request ${requestId}:`, err.message);
                });
            }

            lastScannedBlock = currentBlock;
        } catch (err) {
            // Don't crash on transient RPC errors
            console.error("[Agent Listener] Poll error:", err.message);
        }
    };

    // Initial poll
    await poll();

    // Start interval
    setInterval(poll, POLL_INTERVAL);
    console.log(`[Agent Listener] Polling every ${POLL_INTERVAL / 1000}s for new audit requests...`);
}

/**
 * The core autonomous pipeline:
 * 1. Enrich with market data
 * 2. Run Gemini AI reasoning
 * 3. Publish to HCS
 * 4. Mint HTS token
 * 5. Submit result to EVM Smart Contract (claim bounty)
 */
async function handleAuditRequest(requestId, requesterAddress, prompt, { geminiService, hcsAuditService, auditPassService }) {
    console.log(`[Agent] 🧠 Starting autonomous processing for Request #${requestId}...`);

    try {
        // 1. Enrich with market data (optional, best-effort)
        let enrichedPrompt = prompt;
        let sources = [];
        try {
            const { enrichQuestionWithMarketData } = await import("../marketData.service.js");
            const enrichResult = await enrichQuestionWithMarketData(prompt);
            enrichedPrompt = enrichResult.enrichedPrompt;
            sources = enrichResult.sources;
            console.log(`[Agent] Enriched with sources: ${sources.join(", ") || "none"}`);
        } catch (enrichErr) {
            console.warn("[Agent] Market data enrichment failed, using raw prompt:", enrichErr.message);
        }

        // 2. Run Gemini AI reasoning
        console.log(`[Agent] Calling Gemini AI...`);
        const reasoningResult = await geminiService.reasonWithAudit(enrichedPrompt);

        if (!reasoningResult || !Array.isArray(reasoningResult.steps)) {
            console.error("[Agent] Gemini returned invalid shape — aborting.");
            return;
        }

        reasoningResult.question = prompt;
        reasoningResult.dataSources = sources;
        reasoningResult.requesterAddress = requesterAddress;
        reasoningResult.contractRequestId = requestId;

        // Store in proofsStore
        const { proofsStore, saveProofsToDisk } = await import("../hcsAudit.service.js");
        proofsStore.set(reasoningResult.proofId, {
            ...reasoningResult,
            status: "PUBLISHING",
            hcsTopicId: "unknown",
            requesterAddress: requesterAddress,
            contractRequestId: requestId,
        });
        saveProofsToDisk();

        // 3. Publish to HCS
        console.log(`[Agent] Publishing reasoning chain to HCS...`);
        await hcsAuditService.publishReasoningChain(reasoningResult.proofId, reasoningResult.steps);

        // 4. Mint HTS Audit Pass token
        if (requesterAddress) {
            try {
                console.log(`[Agent] Minting HTS Audit Pass for ${requesterAddress}...`);
                await auditPassService.mintAuditPass(reasoningResult.proofId, requesterAddress);
            } catch (e) {
                console.error("[Agent] Failed to mint audit pass:", e.message);
            }
        }

        // 5. Submit result to Smart Contract and claim bounty
        console.log(`[Agent] Submitting result to EVM Smart Contract...`);
        const finalStep = reasoningResult.steps.find(s => s.label === "FINAL");
        const resultData = finalStep ? finalStep.content : reasoningResult.steps[reasoningResult.steps.length - 1].content;
        const resultHash = ethers.id(resultData);

        const tx = await contract.submitResult(BigInt(requestId), resultHash, {
            gasLimit: 150000,
        });
        const receipt = await tx.wait();

        console.log(`[Agent] ✅ Result anchored to EVM! Tx: ${receipt.hash}`);
        console.log(`[Agent] 💰 Bounty claimed for Request #${requestId}`);

        // Update proof store with EVM info
        const storedProof = proofsStore.get(reasoningResult.proofId);
        if (storedProof) {
            storedProof.evmTxHash = receipt.hash;
            storedProof.evmSettled = true;
            storedProof.status = "VERIFIED";
            proofsStore.set(reasoningResult.proofId, storedProof);
            saveProofsToDisk();
        }

        console.log(`[Agent] 🎉 Request #${requestId} FULLY PROCESSED (HCS + HTS + EVM)`);

    } catch (err) {
        console.error(`[Agent] ❌ Error processing Request #${requestId}:`, err.message);
    }
}

export function getContractInstance() {
    return contract;
}

export function getListenerContractAddress() {
    return contractAddress;
}
