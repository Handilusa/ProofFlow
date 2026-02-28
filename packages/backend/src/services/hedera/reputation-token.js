import {
    Client,
    PrivateKey,
    TokenCreateTransaction,
    TokenType,
    TokenMintTransaction,
    TokenAssociateTransaction,
    TransferTransaction
} from "@hashgraph/sdk";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const myAccountId = process.env.HEDERA_ACCOUNT_ID;
const myPrivateKey = process.env.HEDERA_PRIVATE_KEY;

if (!myAccountId || !myPrivateKey) {
    throw new Error("Environment variables HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY must be present");
}

const client = Client.forTestnet();
const operatorKey = PrivateKey.fromStringECDSA(myPrivateKey);
client.setOperator(myAccountId, operatorKey);

const configPath = path.join(__dirname, "../../../../config");
const tokenFilePath = path.join(configPath, "token.json");

function ensureConfigDir() {
    if (!fs.existsSync(configPath)) {
        fs.mkdirSync(configPath, { recursive: true });
    }
}

export async function getOrCreateToken() {
    ensureConfigDir();

    if (fs.existsSync(tokenFilePath)) {
        const data = JSON.parse(fs.readFileSync(tokenFilePath, "utf8"));
        if (data.tokenId) {
            console.log(`Using existing Token ID: ${data.tokenId}`);
            return data.tokenId;
        }
    }

    console.log("Creating ProofFlow Reputation Token (PFR)...");
    const transaction = new TokenCreateTransaction()
        .setTokenName("ProofFlow Reputation")
        .setTokenSymbol("PFR")
        .setTokenType(TokenType.FungibleCommon)
        .setDecimals(0)
        .setInitialSupply(0)
        .setTreasuryAccountId(client.operatorAccountId)
        .setSupplyKey(operatorKey)
        .setAdminKey(operatorKey);

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);
    const newTokenId = receipt.tokenId.toString();

    console.log(`New Token ID created: ${newTokenId}`);
    fs.writeFileSync(tokenFilePath, JSON.stringify({ tokenId: newTokenId }, null, 2));

    return newTokenId;
}

export async function mintReputation(accountId, amount, accountKey = null) {
    try {
        const tokenId = await getOrCreateToken();

        // 1. Mint tokens to the Treasury
        console.log(`Minting ${amount} tokens to Treasury...`);
        const mintTx = new TokenMintTransaction()
            .setTokenId(tokenId)
            .setAmount(amount);

        const mintResponse = await mintTx.execute(client);
        const mintReceipt = await mintResponse.getReceipt(client);
        console.log(`Minted successfully. Status: ${mintReceipt.status.toString()}`);

        if (accountId.toString() === client.operatorAccountId.toString()) {
            console.log(`Target account is Treasury (${accountId}). Transfer skipped.`);
            return { receipt: mintReceipt, transactionId: mintResponse.transactionId.toString() };
        }

        if (accountKey) {
            try {
                console.log(`Associating token ${tokenId} to account ${accountId}...`);
                const associateTx = new TokenAssociateTransaction()
                    .setAccountId(accountId)
                    .setTokenIds([tokenId])
                    .freezeWith(client);

                const signTx = await associateTx.sign(accountKey);
                const associateResponse = await signTx.execute(client);
                await associateResponse.getReceipt(client);
                console.log(`Association successful.`);
            } catch (error) {
                console.log(`Association skipped or failed (perhaps already associated): ${error.message}`);
            }
        } else {
            console.log(`No accountKey provided for ${accountId}. Assuming token is already associated.`);
        }

        console.log(`Transferring ${amount} tokens to ${accountId}...`);
        const transferTx = new TransferTransaction()
            .addTokenTransfer(tokenId, client.operatorAccountId, -amount)
            .addTokenTransfer(tokenId, accountId, amount);

        const transferResponse = await transferTx.execute(client);
        const transferReceipt = await transferResponse.getReceipt(client);

        console.log(`Transfer successful! Status: ${transferReceipt.status.toString()}`);
        return { receipt: transferReceipt, transactionId: transferResponse.transactionId.toString() };
    } catch (error) {
        console.error("Error in mintReputation:", error);
        throw error;
    }
}

async function test() {
    try {
        console.log("Starting HTS Logger test...");
        await mintReputation(client.operatorAccountId, 10);
        console.log("Test complete. Exiting...");
        process.exit(0);
    } catch (error) {
        console.error("Test failed:", error);
        process.exit(1);
    }
}

import { argv } from "process";
if (argv[1] === __filename) {
    test();
}
