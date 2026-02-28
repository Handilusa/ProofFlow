import { Client, PrivateKey, TopicMessageSubmitTransaction, } from "@hashgraph/sdk";
import crypto from "crypto";
import { getOrCreateTopic } from "./hedera/hcs-logger.js";
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
        }
        return sequenceNumbers;
    }
    async getProofById(proofId) {
        const proof = proofsStore.get(proofId);
        return proof || null;
    }
    async getRecentProofs() {
        const allProofs = Array.from(proofsStore.values());
        allProofs.sort((a, b) => b.createdAt - a.createdAt);
        return allProofs.slice(0, 20);
    }
}
