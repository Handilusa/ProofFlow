import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIRROR_NODE_URL = "https://testnet.mirrornode.hedera.com/api/v1";
const configPath = path.join(__dirname, "../../../config");
const topicFilePath = path.join(configPath, "topic.json");
const tokenFilePath = path.join(configPath, "token.json");
function getTopicId() {
    if (fs.existsSync(topicFilePath)) {
        return JSON.parse(fs.readFileSync(topicFilePath, "utf8")).topicId;
    }
    return null;
}
function getTokenId() {
    if (fs.existsSync(tokenFilePath)) {
        return JSON.parse(fs.readFileSync(tokenFilePath, "utf8")).tokenId;
    }
    return null;
}
export async function fetchProofFromMirrorNode(proofId) {
    const topicId = getTopicId();
    if (!topicId)
        throw new Error("Topic ID not configured");
    // We are querying the Mirror Node to find the specific message containing the proofId / taskId
    // To be precise we fetch all messages and filter. In production, this can be heavily paginated or indexed locally.
    let nextUrl = `${MIRROR_NODE_URL}/topics/${topicId}/messages`;
    while (nextUrl) {
        const response = await fetch(nextUrl);
        const data = await response.json();
        const messages = data.messages || [];
        for (const msg of messages) {
            try {
                // messages in HCS are Base64 encoded
                const decodedMessage = Buffer.from(msg.message, 'base64').toString('utf8');
                const parsedPayload = JSON.parse(decodedMessage);
                // Assuming ProofId internally equates to taskId or resultHash representation
                if (parsedPayload.taskId === proofId || parsedPayload.resultHash === proofId) {
                    return {
                        sequenceNumber: msg.sequence_number,
                        consensusTimestamp: msg.consensus_timestamp,
                        payload: parsedPayload,
                        rawMessageId: msg.chunk_info?.initial_transaction_id || null
                    };
                }
            }
            catch (err) {
                // Ignore parsing errors for individual messages that might not be valid JSON
            }
        }
        nextUrl = data.links?.next ? `${MIRROR_NODE_URL}${data.links.next}` : null;
    }
    return null; // Not found
}
export async function fetchLeaderboard() {
    const tokenId = getTokenId();
    if (!tokenId)
        throw new Error("Token ID not configured");
    const response = await fetch(`${MIRROR_NODE_URL}/tokens/${tokenId}/balances?order=desc&limit=10`);
    if (!response.ok)
        throw new Error(`Mirror Node error: ${response.statusText}`);
    const data = await response.json();
    return data.balances.map(b => ({
        account: b.account,
        balance: b.balance
    }));
}
export async function fetchStats() {
    const topicId = getTopicId();
    const tokenId = getTokenId();
    let totalProofs = 0;
    let totalAgents = 0;
    let totalTokensMinted = 0;
    let lastActivity = null;
    if (topicId) {
        const msgResponse = await fetch(`${MIRROR_NODE_URL}/topics/${topicId}/messages?order=desc&limit=1`);
        if (msgResponse.ok) {
            const msgData = await msgResponse.json();
            if (msgData.messages && msgData.messages.length > 0) {
                totalProofs = msgData.messages[0].sequence_number;
                lastActivity = msgData.messages[0].consensus_timestamp;
            }
        }
    }
    if (tokenId) {
        const tokenResponse = await fetch(`${MIRROR_NODE_URL}/tokens/${tokenId}`);
        if (tokenResponse.ok) {
            const tokenData = await tokenResponse.json();
            totalTokensMinted = tokenData.total_supply;
        }
        const limitsResponse = await fetch(`${MIRROR_NODE_URL}/tokens/${tokenId}/balances`);
        if (limitsResponse.ok) {
            const limitsData = await limitsResponse.json();
            totalAgents = limitsData.balances.length; // Approximate distinct agents holding PFR
        }
    }
    return {
        totalProofs,
        totalAgents,
        totalTokensMinted,
        lastActivity
    };
}
