import { Client, PrivateKey, TopicMessageSubmitTransaction, } from "@hashgraph/sdk";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getOrCreateTopic } from "./hedera/hcs-logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDirPath = path.join(__dirname, "../../data");
const proofsFilePath = path.join(dataDirPath, "proofs.json");

if (!fs.existsSync(dataDirPath)) {
    fs.mkdirSync(dataDirPath, { recursive: true });
}

// Initialize Hedera Client
const myAccountId = process.env.HEDERA_ACCOUNT_ID;
const myPrivateKey = process.env.HEDERA_PRIVATE_KEY;
if (!myAccountId || !myPrivateKey) {
    throw new Error("Environment variables HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY must be present");
}
const client = Client.forTestnet();
client.setOperator(myAccountId, PrivateKey.fromStringECDSA(myPrivateKey));
// In-memory store for demo purposes. Can be replaced with a DB.
export const proofsStore = new Map();

// Load proofs from disk on startup
if (fs.existsSync(proofsFilePath)) {
    try {
        const rawData = fs.readFileSync(proofsFilePath, "utf8");
        const parsed = JSON.parse(rawData);
        if (Array.isArray(parsed)) {
            parsed.forEach(([key, value]) => proofsStore.set(key, value));
        } else if (typeof parsed === 'object') {
            Object.entries(parsed).forEach(([key, value]) => proofsStore.set(key, value));
        }
        console.log(`[Persistence] Loaded ${proofsStore.size} proofs from disk.`);
    } catch (err) {
        console.error("[Persistence] Error loading proofs:", err);
    }
}

export function saveProofsToDisk() {
    try {
        const data = Array.from(proofsStore.entries());
        fs.writeFileSync(proofsFilePath, JSON.stringify(data, null, 2), "utf8");
    } catch (err) {
        console.error("[Persistence] Error saving proofs:", err);
    }
}
export class HCSAuditService {
    async publishReasoningChain(proofId, steps) {
        const topicId = await getOrCreateTopic();
        const sequenceNumbers = [];
        const hashes = [];
        // Publish each step
        for (const step of steps) {
            const payload = {
                type: "REASONING_STEP",
                proofId,
                stepNumber: step.stepNumber,
                label: step.label,
                hash: step.hash,
                timestamp: step.timestamp,
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
            console.log(`[HCS] Published step ${step.stepNumber}. Seq: ${seqNum}`);
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
        };
        const submitFinalTx = new TopicMessageSubmitTransaction({
            topicId,
            message: JSON.stringify(finalPayload),
        });
        await submitFinalTx.execute(client);
        console.log(`[HCS] Published PROOF_COMPLETE for ${proofId}. RootHash: ${rootHash}`);
        // Update in-memory store
        const storedProof = proofsStore.get(proofId);
        if (storedProof) {
            storedProof.status = "CONFIRMED";
            storedProof.hcsTopicId = topicId;
            storedProof.rootHash = rootHash;
            storedProof.hcsSequenceNumbers = sequenceNumbers;
            proofsStore.set(proofId, storedProof);
            saveProofsToDisk();
        }
        return sequenceNumbers;
    }
    async getProofById(proofId) {
        const proof = proofsStore.get(proofId);
        return proof || null;
    }
    async getRecentProofs(address) {
        const allProofs = Array.from(proofsStore.values());
        let filteredProofs = allProofs;
        if (address) {
            filteredProofs = allProofs.filter(p => p.requesterAddress?.toLowerCase() === address.toLowerCase());
        }
        filteredProofs.sort((a, b) => b.createdAt - a.createdAt);
        return filteredProofs.slice(0, 20);
    }
}
