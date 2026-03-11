import { TopicMessageSubmitTransaction } from "@hashgraph/sdk";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getOrCreateTopic } from "./hedera/hcs-logger.js";
import { getClient, getNetwork } from "./hedera/networkManager.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDirPath = path.join(__dirname, "../../data");
const testnetProofsPath = path.join(dataDirPath, "proofs_testnet.json");
const mainnetProofsPath = path.join(dataDirPath, "proofs_mainnet.json");
const legacyProofsPath = path.join(dataDirPath, "proofs.json");

if (!fs.existsSync(dataDirPath)) {
    fs.mkdirSync(dataDirPath, { recursive: true });
}

// In-memory store for demo purposes. Can be replaced with a DB.
export const proofsStore = new Map();

// Helper to load a file
const loadProofs = (filePath) => {
    if (fs.existsSync(filePath)) {
        try {
            const rawData = fs.readFileSync(filePath, "utf8");
            const parsed = JSON.parse(rawData);
            if (Array.isArray(parsed)) {
                parsed.forEach(([key, value]) => proofsStore.set(key, value));
            } else if (typeof parsed === 'object') {
                Object.entries(parsed).forEach(([key, value]) => proofsStore.set(key, value));
            }
            console.log(`[Persistence] Loaded proofs from ${path.basename(filePath)}`);
        } catch (err) {
            console.error(`[Persistence] Error loading ${path.basename(filePath)}:`, err);
        }
    }
};

// Load both files (and legacy for safety)
loadProofs(legacyProofsPath);
loadProofs(testnetProofsPath);
loadProofs(mainnetProofsPath);
console.log(`[Persistence] Total loaded: ${proofsStore.size} proofs from disk.`);

export function saveProofsToDisk() {
    try {
        const testnetData = [];
        const mainnetData = [];

        for (const [key, value] of proofsStore.entries()) {
            if (value.network === 'mainnet') {
                mainnetData.push([key, value]);
            } else {
                testnetData.push([key, value]);
            }
        }

        fs.writeFileSync(testnetProofsPath, JSON.stringify(testnetData, null, 2), "utf8");
        fs.writeFileSync(mainnetProofsPath, JSON.stringify(mainnetData, null, 2), "utf8");
    } catch (err) {
        console.error("[Persistence] Error saving proofs:", err);
    }
}
export class HCSAuditService {
    async publishReasoningChain(proofId, steps, networkStr = "testnet") {
        const network = getNetwork(networkStr);
        const client = getClient(network);
        const topicId = await getOrCreateTopic(network);

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
            network
        };
        const submitFinalTx = new TopicMessageSubmitTransaction({
            topicId,
            message: JSON.stringify(finalPayload),
        });
        await submitFinalTx.execute(client);
        console.log(`[HCS - ${network.toUpperCase()}] Published PROOF_COMPLETE for ${proofId}. RootHash: ${rootHash}`);

        // Update in-memory store
        const storedProof = proofsStore.get(proofId);
        if (storedProof) {
            storedProof.status = "CONFIRMED";
            storedProof.hcsTopicId = topicId.toString();
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
    async getRecentProofs(address, networkStr = "testnet") {
        const network = getNetwork(networkStr);
        const allProofs = Array.from(proofsStore.values());

        // Filter by network first
        let filteredProofs = allProofs.filter(p => !p.network || p.network === network || (network === 'testnet' && !p.network));

        if (address) {
            filteredProofs = filteredProofs.filter(p => p.requesterAddress?.toLowerCase() === address.toLowerCase());
        }
        filteredProofs.sort((a, b) => b.createdAt - a.createdAt);
        return filteredProofs;
    }
}
