import { TopicMessageSubmitTransaction } from "@hashgraph/sdk";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";
import { getOrCreateTopic } from "./hedera/hcs-logger.js";
import { getClient, getNetwork, getMirrorNodeUrl } from "./hedera/networkManager.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, "../../data");

// Helper to fetch Topic ID dynamically since we removed fs imports here
async function getTopicId(networkStr) {
    const network = getNetwork(networkStr);
    return await getOrCreateTopic(network);
}

// ─── Local JSON helpers ───────────────────────────────────────────
function getProofsFilePath(network) {
    return path.join(DATA_DIR, `proofs_${network}.json`);
}

function loadLocalProofs(network) {
    const filePath = getProofsFilePath(network);
    try {
        if (fs.existsSync(filePath)) {
            const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
            // Handle Map-serialized format: [[proofId, {...data}], ...]
            if (Array.isArray(raw) && raw.length > 0 && Array.isArray(raw[0])) {
                return raw.map(entry => entry[1]); // Extract data objects
            }
            return raw; // Already flat array format
        }
    } catch (e) {
        console.error(`[LocalStore] Error loading ${filePath}:`, e.message);
    }
    return [];
}

function saveLocalProofs(network, proofs) {
    const filePath = getProofsFilePath(network);
    try {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        // Save in the tuple format for backward compatibility: [[proofId, {...data}], ...]
        const tupleFormat = proofs.map(p => [p.proofId, p]);
        fs.writeFileSync(filePath, JSON.stringify(tupleFormat, null, 2), "utf8");
    } catch (e) {
        console.error(`[LocalStore] Error saving ${filePath}:`, e.message);
    }
}

export class HCSAuditService {
    async publishReasoningChain(proofId, steps, networkStr = "testnet", question = "") {
        const network = getNetwork(networkStr);
        const client = getClient(network);
        const topicId = await getOrCreateTopic(network);

        const sequenceNumbers = [];
        const hashes = [];
        // Publish each step to HCS
        for (const step of steps) {
            const payload = {
                type: "REASONING_STEP",
                proofId,
                stepNumber: step.stepNumber,
                label: step.label,
                content: step.content,
                hash: step.hash,
                timestamp: step.timestamp,
                network
            };
            const submitTx = new TopicMessageSubmitTransaction({
                topicId,
                message: JSON.stringify(payload),
            });
            const submitResponse = await submitTx.execute(client);
            const receipt = await submitResponse.getReceipt(client);
            const seqNum = receipt.topicSequenceNumber ? receipt.topicSequenceNumber.toNumber() : 0;
            sequenceNumbers.push(seqNum);
            hashes.push(step.hash);
            console.log(`[HCS - ${network.toUpperCase()}] Published step ${step.stepNumber}. Seq: ${seqNum}`);
        }
        // Publish PROOF_COMPLETE
        const concatenatedHashes = hashes.join("");
        const rootHash = crypto.createHash("sha256").update(concatenatedHashes).digest("hex");
        const finalPayload = {
            type: "PROOF_COMPLETE",
            proofId,
            totalSteps: steps.length,
            rootHash,
            timestamp: Date.now(),
            network,
            question: question.substring(0, 200)
        };
        const submitFinalTx = new TopicMessageSubmitTransaction({
            topicId,
            message: JSON.stringify(finalPayload),
        });
        await submitFinalTx.execute(client);
        console.log(`[HCS - ${network.toUpperCase()}] Published PROOF_COMPLETE for ${proofId}. RootHash: ${rootHash}`);

        // ─── Also save full proof locally for fast reads with content ───
        try {
            const localProofs = loadLocalProofs(network);
            localProofs.push({
                proofId,
                question,
                steps,
                totalSteps: steps.length,
                rootHash,
                status: "CONFIRMED",
                hcsTopicId: topicId.toString(),
                hcsSequenceNumbers: sequenceNumbers,
                createdAt: finalPayload.timestamp,
                network
            });
            saveLocalProofs(network, localProofs);
            console.log(`[LocalStore] Saved proof ${proofId} locally.`);
        } catch (e) {
            console.error(`[LocalStore] Failed to save proof locally:`, e.message);
        }

        console.log(`[HCS - ${network.toUpperCase()}] Reasoning chain completely pushed to blockchain.`);
        return sequenceNumbers;
    }

    async updateLocalProof(proofId, updates, networkStr = "testnet") {
        const network = getNetwork(networkStr);
        try {
            const localProofs = loadLocalProofs(network);
            const proofIndex = localProofs.findIndex(p => p.proofId === proofId);
            if (proofIndex !== -1) {
                localProofs[proofIndex] = { ...localProofs[proofIndex], ...updates };
                saveLocalProofs(network, localProofs);
                console.log(`[LocalStore] Updated proof ${proofId} with new data.`);
            } else {
                console.warn(`[LocalStore] Proof ${proofId} not found for update.`);
            }
        } catch (e) {
            console.error(`[LocalStore] Failed to update proof locally:`, e.message);
        }
    }

    async getRecentProofs(address, networkStr = "testnet") {
        const network = getNetwork(networkStr);
        const mirrorNodeUrl = getMirrorNodeUrl(network);
        const mirrorNodeBaseUrl = mirrorNodeUrl.replace(/\/api\/v1$/, '');
        const topicId = await getTopicId(network);

        // ─── Build a local lookup for enrichment ───
        const localProofs = loadLocalProofs(network);
        const localMap = new Map();
        for (const p of localProofs) {
            localMap.set(p.proofId, p);
        }

        const proofs = [];
        
        try {
            // Paginate through ALL Mirror Node messages to collect every PROOF_COMPLETE event.
            let nextUrl = `${mirrorNodeUrl}/topics/${topicId}/messages?order=desc&limit=100`;

            while (nextUrl) {
                const response = await fetch(nextUrl);
                if (!response.ok) {
                    console.error(`[HCS] Failed to fetch recent proofs from Mirror Node: ${response.statusText}`);
                    break;
                }

                const data = await response.json();
                const messages = data.messages || [];

                for (const msg of messages) {
                    try {
                        const decodedStr = Buffer.from(msg.message, 'base64').toString('utf8');
                        const payload = JSON.parse(decodedStr);

                        if (payload.type === "PROOF_COMPLETE") {
                            const local = localMap.get(payload.proofId);
                            proofs.push({
                                proofId: payload.proofId,
                                rootHash: payload.rootHash,
                                timestamp: payload.timestamp,
                                network: payload.network || networkStr,
                                status: "CONFIRMED",
                                hcsTopicId: topicId.toString(),
                                question: payload.question || local?.question || null,
                                totalSteps: payload.totalSteps || local?.totalSteps || 0,
                                requesterAddress: address
                            });
                        }
                    } catch (e) {
                        // Ignore parse errors for older or incompatible messages
                    }
                }

                nextUrl = data.links?.next ? `${mirrorNodeBaseUrl}${data.links.next}` : null;
            }
        } catch (e) {
            console.error(`[HCS] Error fetching recent proofs:`, e);
        }

        return proofs;
    }

    async getProofById(proofId, networkStr = "testnet") {
        const network = getNetwork(networkStr);

        // ─── 1. Try local JSON first (fast, has full content) ───
        const localProofs = loadLocalProofs(network);
        const localProof = localProofs.find(p => p.proofId === proofId);
        if (localProof && localProof.steps && localProof.steps.length > 0) {
            console.log(`[LocalStore] Found proof ${proofId} locally with ${localProof.steps.length} steps.`);
            return {
                proofId: localProof.proofId,
                question: localProof.question,
                steps: localProof.steps,
                totalSteps: localProof.totalSteps || localProof.steps.length,
                rootHash: localProof.rootHash,
                status: localProof.status || "CONFIRMED",
                hcsTopicId: localProof.hcsTopicId,
                hcsSequenceNumbers: localProof.hcsSequenceNumbers,
                createdAt: localProof.createdAt,
                network: localProof.network || network,
                tokenTxId: localProof.tokenTxId,
                explorerUrl: localProof.explorerUrl,
                evmTxHash: localProof.evmTxHash,
                evmSettled: localProof.evmSettled
            };
        }

        // ─── 2. Fallback: read from HCS Mirror Node ───
        const mirrorNodeUrl = getMirrorNodeUrl(network);
        const mirrorNodeBaseUrl = mirrorNodeUrl.replace(/\/api\/v1$/, '');
        const topicId = await getTopicId(network);

        let proofData = {
            proofId,
            status: "UNKNOWN",
            network,
            steps: []
        };

        try {
            let nextUrl = `${mirrorNodeUrl}/topics/${topicId}/messages`;
            let foundFinal = false;

            while (nextUrl && !foundFinal) {
                const response = await fetch(nextUrl);
                const data = await response.json();
                const messages = data.messages || [];

                for (const msg of messages) {
                    try {
                        const decodedStr = Buffer.from(msg.message, 'base64').toString('utf8');
                        const payload = JSON.parse(decodedStr);

                        if (payload.proofId === proofId) {
                            if (payload.type === "REASONING_STEP") {
                                proofData.steps.push(payload);
                            } else if (payload.type === "PROOF_COMPLETE") {
                                proofData.status = "CONFIRMED";
                                proofData.rootHash = payload.rootHash;
                                proofData.hcsTopicId = topicId.toString();
                                proofData.timestamp = payload.timestamp;
                                proofData.question = payload.question || "";
                                proofData.totalSteps = payload.totalSteps;
                                foundFinal = true;
                            }
                        }
                    } catch (e) { }
                }
                nextUrl = data.links?.next ? `${mirrorNodeBaseUrl}${data.links.next}` : null;
            }

            // Sort steps correctly
            proofData.steps.sort((a, b) => a.stepNumber - b.stepNumber);

            return proofData.steps.length > 0 || proofData.status === "CONFIRMED" ? proofData : null;

        } catch (e) {
            console.error(`[HCS] Error fetching proof by ID:`, e);
            return null;
        }
    }
}
