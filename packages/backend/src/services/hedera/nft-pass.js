import {
    TokenCreateTransaction,
    TokenType,
    TokenSupplyType,
    TokenMintTransaction,
    TransferTransaction,
    PrivateKey,
    AccountBalanceQuery,
    AccountId,
    TokenId
} from "@hashgraph/sdk";
import fs from "fs";
import path from "path";
import { getClient, getConfigDirPath, getNetwork } from "./networkManager.js";
import "dotenv/config";

const METADATA = {
    BRONZE: "ipfs://bafkreiekd2e3jyeyhviumhfmy6joscjf2xuyalni3a4gfw7kg7qhporu5i",
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
 * Resolves any address format (EVM 0x... or native 0.0.x) to an AccountId object.
 */
function resolveAccountId(address) {
    if (address.startsWith("0x")) {
        return AccountId.fromEvmAddress(0, 0, address);
    }
    return AccountId.fromString(address);
}

/**
 * Checks if a wallet already owns the specified tier NFT via SDK (consensus node).
 * Returns true if they own it, false if they don't.
 */
async function alreadyOwnsTierNft(recipientAddress, tokenIdStr, client) {
    const accountId = resolveAccountId(recipientAddress);
    try {
        const balance = await new AccountBalanceQuery()
            .setAccountId(accountId)
            .execute(client);

        const tokenId = TokenId.fromString(tokenIdStr);
        const tokenBalance = balance.tokens?._map?.get(tokenId.toString());
        const numericBalance = tokenBalance ? Number(tokenBalance) : 0;

        console.log(`[NFT] SDK ownership check for ${accountId.toString()}: ${tokenIdStr} balance = ${numericBalance}`);
        return numericBalance > 0;
    } catch (err) {
        const statusStr = err.status?.toString() || err.message || '';
        if (statusStr.includes('INVALID_ACCOUNT_ID') || statusStr.includes('ACCOUNT_ID_DOES_NOT_EXIST')) {
            console.log(`[NFT] Account ${recipientAddress} does not exist on Hedera yet — ownership = false`);
            return false;
        }
        console.error(`[NFT] SDK ownership check failed for ${recipientAddress}:`, err.message);
        throw err;
    }
}

/**
 * Mints an NFT of the specified tier to the recipient.
 * Enforces 1-per-wallet via SDK AccountBalanceQuery before minting.
 */
export async function mintNftTier(recipientId, tier, networkStr = "testnet") {
    try {
        const network = getNetwork(networkStr);
        const client = getClient(network);
        const tokenId = await getOrCreateNftToken(tier, network);
        const metadata = METADATA[tier.toUpperCase()] || METADATA.BRONZE;

        // ── 1-Per-Wallet check via SDK (NOT Mirror Node) ──
        const alreadyOwns = await alreadyOwnsTierNft(recipientId, tokenId, client);
        if (alreadyOwns) {
            console.warn(`[NFT] ⛔ Wallet ${recipientId} already owns ${tier} NFT. Mint rejected (1 per wallet).`);
            return { tokenId, serialNumber: null, transactionId: null, alreadyOwned: true };
        }

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

        // 2. Transfer to recipient
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
