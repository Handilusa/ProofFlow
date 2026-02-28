import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
    Client,
    PrivateKey,
    AccountCreateTransaction,
    Hbar,
    TokenAssociateTransaction
} from "@hashgraph/sdk";
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const API_URL = 'http://127.0.0.1:3001/api/v1/reason';

const myAccountId = process.env.HEDERA_ACCOUNT_ID;
const myPrivateKey = process.env.HEDERA_PRIVATE_KEY;

if (!myAccountId || !myPrivateKey) {
    throw new Error("HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY must be in .env");
}

const client = Client.forTestnet();
client.setOperator(myAccountId, PrivateKey.fromStringECDSA(myPrivateKey));

import { getOrCreateToken } from '../services/hedera/reputation-token.js';

const tokenFilePath = path.join(__dirname, "../../../../config/token.json");

function getTokenId() {
    if (fs.existsSync(tokenFilePath)) {
        return JSON.parse(fs.readFileSync(tokenFilePath, "utf8")).tokenId;
    }
    return null;
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const agents = [
    { name: 'YieldOptimizer', questions: ["Analyze the APY trends for Stader xHBAR staking this week. Is it safe to auto-compound?", "Compute optimal route for swapping USDC to HBAR."] },
    { name: 'SecurityAuditor', questions: ["Does the latest SaucerSwap V2 contract implementation have reentrancy vulnerabilities?", "Check the latest multisig transaction on the Dev Fund for anomalies."] },
    { name: 'SentimentBot', questions: ["What is the current Twitter sentiment regarding the Hedera ecosystem expansion?", "Evaluate the impact of the latest mainnet upgrade on developer sentiment."] }
];

async function createAndAssociateAccount(tokenId) {
    console.log("Creating new agent testnet account...");
    const newAccountPrivateKey = PrivateKey.generateECDSA();
    const newAccountPublicKey = newAccountPrivateKey.publicKey;

    const newAccount = await new AccountCreateTransaction()
        .setKey(newAccountPublicKey)
        .setInitialBalance(Hbar.fromTinybars(10000000)) // 100 HBAR
        .execute(client);

    const getReceipt = await newAccount.getReceipt(client);
    const newAccountId = getReceipt.accountId;

    console.log(`Agent Account Created: ${newAccountId.toString()}`);

    if (tokenId) {
        console.log(`Associating Token ${tokenId} with Agent...`);
        const associateTx = await new TokenAssociateTransaction()
            .setAccountId(newAccountId)
            .setTokenIds([tokenId])
            .freezeWith(client)
            .sign(newAccountPrivateKey);

        const associateExec = await associateTx.execute(client);
        await associateExec.getReceipt(client);
        console.log(`Token originally associated.`);
    }

    return newAccountId.toString();
}

async function run() {
    let tokenId = getTokenId();
    if (!tokenId) {
        console.log("Token ID not found. Creating PFR Token on testnet...");
        tokenId = await getOrCreateToken();
        await sleep(3000); // wait for consensus
    }

    const results = [];

    // Create 3 real hedera accounts
    for (const agent of agents) {
        agent.accountId = await createAndAssociateAccount(tokenId);
    }

    console.log("\n🚀 Starting LIVE simulation via Gemini and Hedera Services...\n");

    for (const agent of agents) {
        for (const question of agent.questions) {
            console.log(`\n🤖 [${agent.name}] Asking: "${question}"`);

            const body = {
                question: question,
                requesterAddress: agent.accountId
            };

            try {
                const res = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });

                const data = await res.json();
                console.log(`✅ [${agent.name}] Response received. Proof ID: ${data.proofId}`);
                console.log(`📝 Result: ${data.answer.substring(0, 50)}...`);
                results.push({ agentName: agent.name, question, ...data });
            } catch (err) {
                console.error(`❌ Failed request:`, err.message);
            }

            console.log("⏳ Waiting 10s to avoid rate limits and allow HCS/HTS full propagation...");
            await sleep(10000);
        }
    }

    fs.mkdirSync('logs', { recursive: true });
    fs.writeFileSync('logs/simulation.json', JSON.stringify(results, null, 2));
    console.log('\n🎯 Simulation complete.');
    console.log('📄 Results saved to logs/simulation.json');
    process.exit(0);
}

run().catch(console.error);
