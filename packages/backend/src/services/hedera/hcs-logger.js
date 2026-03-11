import {
    TopicCreateTransaction,
    TopicMessageSubmitTransaction,
} from "@hashgraph/sdk";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getClient, getConfigDirPath, getNetwork } from "./networkManager.js";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to ensure config directory exists
function ensureConfigDir(network) {
    const configPath = getConfigDirPath(network);
    if (!fs.existsSync(configPath)) {
        fs.mkdirSync(configPath, { recursive: true });
    }
    return configPath;
}

// 2 & 3. Create a new HCS Topic and save to config/{network}/topic.json (if it doesn't exist)
export async function getOrCreateTopic(networkStr = "testnet") {
    const network = getNetwork(networkStr);
    const client = getClient(network);
    const configPath = ensureConfigDir(network);
    const topicFilePath = path.join(configPath, "topic.json");

    if (fs.existsSync(topicFilePath)) {
        const data = JSON.parse(fs.readFileSync(topicFilePath, "utf8"));
        if (data.topicId) {
            console.log(`[${network.toUpperCase()}] Using existing Topic ID: ${data.topicId}`);
            return data.topicId;
        }
    }

    console.log(`[${network.toUpperCase()}] Creating new HCS Topic...`);
    const transaction = new TopicCreateTransaction();

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);
    const newTopicId = receipt.topicId.toString();

    console.log(`[${network.toUpperCase()}] New Topic ID created: ${newTopicId}`);

    fs.writeFileSync(topicFilePath, JSON.stringify({ topicId: newTopicId }, null, 2));
    console.log(`[${network.toUpperCase()}] Topic ID saved to ${topicFilePath}`);

    return newTopicId;
}

// 4. Export function to publish a hash
export async function publishHash(taskId, resultHash, networkStr = "testnet") {
    try {
        const network = getNetwork(networkStr);
        const client = getClient(network);
        const topicId = await getOrCreateTopic(network);

        const payload = {
            taskId,
            resultHash,
            timestamp: Date.now(),
        };

        console.log(`[${network.toUpperCase()}] Publishing message to topic ${topicId}:`, payload);

        const submitTx = new TopicMessageSubmitTransaction({
            topicId: topicId,
            message: JSON.stringify(payload),
        });

        const submitResponse = await submitTx.execute(client);
        const receipt = await submitResponse.getReceipt(client);

        console.log(`[${network.toUpperCase()}] Message published successfully! Status: ${receipt.status.toString()}`);
        return receipt;
    } catch (error) {
        console.error("Error publishing hash:", error);
        throw error;
    }
}
