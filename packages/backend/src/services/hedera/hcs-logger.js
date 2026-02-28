import {
    Client,
    PrivateKey,
    TopicCreateTransaction,
    TopicMessageSubmitTransaction,
} from "@hashgraph/sdk";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Connect to Hedera Testnet
const myAccountId = process.env.HEDERA_ACCOUNT_ID;
const myPrivateKey = process.env.HEDERA_PRIVATE_KEY;

if (!myAccountId || !myPrivateKey) {
    throw new Error("Environment variables HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY must be present");
}

const client = Client.forTestnet();
client.setOperator(myAccountId, PrivateKey.fromStringECDSA(myPrivateKey));

const configPath = path.join(__dirname, "../../../../config");
const topicFilePath = path.join(configPath, "topic.json");

// Helper to ensure config directory exists
function ensureConfigDir() {
    if (!fs.existsSync(configPath)) {
        fs.mkdirSync(configPath, { recursive: true });
    }
}

// 2 & 3. Create a new HCS Topic and save to /config/topic.json (if it doesn't exist)
export async function getOrCreateTopic() {
    ensureConfigDir();

    if (fs.existsSync(topicFilePath)) {
        const data = JSON.parse(fs.readFileSync(topicFilePath, "utf8"));
        if (data.topicId) {
            console.log(`Using existing Topic ID: ${data.topicId}`);
            return data.topicId;
        }
    }

    console.log("Creating new HCS Topic...");
    const transaction = new TopicCreateTransaction();

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);
    const newTopicId = receipt.topicId.toString();

    console.log(`New Topic ID created: ${newTopicId}`);

    fs.writeFileSync(topicFilePath, JSON.stringify({ topicId: newTopicId }, null, 2));
    console.log(`Topic ID saved to ${topicFilePath}`);

    return newTopicId;
}

// 4. Export function to publish a hash
export async function publishHash(taskId, resultHash) {
    try {
        const topicId = await getOrCreateTopic();

        const payload = {
            taskId,
            resultHash,
            timestamp: Date.now(),
        };

        console.log(`Publishing message to topic ${topicId}:`, payload);

        const submitTx = new TopicMessageSubmitTransaction({
            topicId: topicId,
            message: JSON.stringify(payload),
        });

        const submitResponse = await submitTx.execute(client);
        const receipt = await submitResponse.getReceipt(client);

        console.log(`Message published successfully! Status: ${receipt.status.toString()}`);
        return receipt;
    } catch (error) {
        console.error("Error publishing hash:", error);
        throw error;
    }
}

// 5. Test at the bottom
async function test() {
    try {
        console.log("Starting HCS Logger test...");
        await publishHash("task-123", "0xabc123def456hashedresult");
        console.log("Test complete. Exiting...");
        process.exit(0);
    } catch (error) {
        console.error("Test failed:", error);
        process.exit(1);
    }
}

// Run the test if this file is executed directly
import { argv } from "process";
if (argv[1] === __filename) {
    test();
}
