import {
    TokenCreateTransaction,
    TokenType,
    TokenSupplyType,
    TokenMintTransaction,
    TokenAssociateTransaction,
    TransferTransaction,
    PrivateKey
} from "@hashgraph/sdk";
import fs from "fs";
import path from "path";
import { getClient, getConfigDirPath, getNetwork } from "./networkManager.js";
import "dotenv/config";

const METADATA = {
    BRONZE: "ipfs://bafkreidbxfcc5xpq2t5phh5d5lhqqcpq4d7bwqsa56fc6ny4fdwfc5buqy",
    SILVER: "ipfs://pending_silver",
    GOLD: "ipfs://pending_gold"
};

/**
 * Gets or creates the NFT collection for a specific tier.
 */
export async function getOrCreateNftToken(tier, networkStr = "testnet") {
    const network = getNetwork(networkStr);
    const client = getClient(network);
    const configPath = getConfigDirPath(network);
    const tokenFilePath = path.join(configPath, `nft_${tier.toLowerCase()}.json`);

    if (fs.existsSync(tokenFilePath)) {
        const data = JSON.parse(fs.readFileSync(tokenFilePath, "utf8"));
        if (data.tokenId) {
            console.log(`[NFT - ${network.toUpperCase()}] Using existing ${tier} NFT ID: ${data.tokenId}`);
            return data.tokenId;
        }
    }

    console.log(`[NFT - ${network.toUpperCase()}] Creating ProofFlow Audit Pass - ${tier} collection...`);

    const privateKeyStr = network === "mainnet"
        ? process.env.HEDERA_PRIVATE_KEY_MAINNET
        : process.env.HEDERA_PRIVATE_KEY_TESTNET;
    const operatorKey = PrivateKey.fromString(privateKeyStr);

    const transaction = new TokenCreateTransaction()
        .setTokenName(`ProofFlow Audit Pass - ${tier}`)
        .setTokenSymbol(`PF${tier.substring(0, 1).toUpperCase()}`)
        .setTokenType(TokenType.NonFungibleUnique)
        .setDecimals(0)
        .setInitialSupply(0)
        .setSupplyType(TokenSupplyType.Infinite)
        .setTreasuryAccountId(client.operatorAccountId)
        .setSupplyKey(operatorKey)
        .setAdminKey(operatorKey);

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);
    const newTokenId = receipt.tokenId.toString();

    console.log(`[NFT - ${network.toUpperCase()}] New ${tier} NFT ID created: ${newTokenId}`);
    fs.writeFileSync(tokenFilePath, JSON.stringify({ tokenId: newTokenId }, null, 2));

    return newTokenId;
}

/**
 * Mints an NFT of the specified tier to the recipient.
 */
export async function mintNftTier(recipientId, tier, networkStr = "testnet") {
    try {
        const network = getNetwork(networkStr);
        const client = getClient(network);
        const tokenId = await getOrCreateNftToken(tier, network);
        const metadata = METADATA[tier.toUpperCase()] || METADATA.BRONZE;

        console.log(`[NFT - ${network.toUpperCase()}] Minting ${tier} NFT to ${recipientId}...`);

        // 1. Mint NFT to Treasury
        const mintTx = new TokenMintTransaction()
            .setTokenId(tokenId)
            .setMetadata([Buffer.from(metadata)]);

        const mintResponse = await mintTx.execute(client);
        const mintReceipt = await mintResponse.getReceipt(client);
        const serialNumber = mintReceipt.serials[0].toNumber();

        console.log(`[NFT] Minted successful. Serial: ${serialNumber}`);

        if (recipientId.toString() === client.operatorAccountId.toString()) {
            return { tokenId, serialNumber, transactionId: mintResponse.transactionId.toString() };
        }

        // 2. Transfer to recipient (assuming association is handled or using auto-association)
        // For simplicity in this agentic implementation, we'll try to transfer.
        // In a real app, user must associate or we must sign.
        const transferTx = new TransferTransaction()
            .addNftTransfer(tokenId, serialNumber, client.operatorAccountId, recipientId);

        const transferResponse = await transferTx.execute(client);
        await transferResponse.getReceipt(client);

        console.log(`[NFT] Transferred to ${recipientId}`);
        return { tokenId, serialNumber, transactionId: transferResponse.transactionId.toString() };
    } catch (error) {
        console.error(`[NFT] Error in mintNftTier:`, error);
        throw error;
    }
}
