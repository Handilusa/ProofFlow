import {
    TokenCreateTransaction,
    TokenType,
    TokenMintTransaction,
    TokenAssociateTransaction,
    TransferTransaction,
    PrivateKey
} from "@hashgraph/sdk";
import fs from "fs";
import path from "path";
import { getClient, getConfigDirPath, getNetwork } from "./networkManager.js";
import "dotenv/config";

function ensureConfigDir(network) {
    const configPath = getConfigDirPath(network);
    if (!fs.existsSync(configPath)) {
        fs.mkdirSync(configPath, { recursive: true });
    }
    return configPath;
}

export async function getOrCreateToken(networkStr = "testnet") {
    const network = getNetwork(networkStr);
    const client = getClient(network);
    const configPath = ensureConfigDir(network);
    const tokenFilePath = path.join(configPath, "token.json");

    if (fs.existsSync(tokenFilePath)) {
        const data = JSON.parse(fs.readFileSync(tokenFilePath, "utf8"));
        if (data.tokenId) {
            console.log(`[${network.toUpperCase()}] Using existing Token ID: ${data.tokenId}`);
            return data.tokenId;
        }
    }

    console.log(`[${network.toUpperCase()}] Creating ProofFlow Reputation Token (PFR)...`);

    // We need the operator key corresponding to the selected network
    const privateKeyStr = network === "mainnet"
        ? process.env.HEDERA_PRIVATE_KEY_MAINNET
        : process.env.HEDERA_PRIVATE_KEY_TESTNET;
    const operatorKey = PrivateKey.fromString(privateKeyStr);

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

    console.log(`[${network.toUpperCase()}] New Token ID created: ${newTokenId}`);
    fs.writeFileSync(tokenFilePath, JSON.stringify({ tokenId: newTokenId }, null, 2));

    return newTokenId;
}

export async function mintReputation(accountId, amount, accountKey = null, networkStr = "testnet", isSystemAction = false) {
    try {
        const network = getNetwork(networkStr);
        const client = getClient(network);
        const tokenId = await getOrCreateToken(network);

        // Security Guardrail:
        // 1. If it's not a system action (AI audit)
        // 2. AND the recipient is not the authorized master wallet (0.0.8026799)
        // Then we block the transaction to prevent unauthorized token inflation.
        const MASTER_ADMIN = "0.0.8026799";
        if (!isSystemAction && accountId.toString() !== MASTER_ADMIN) {
            console.error(`[SECURITY] 🛡️ Unauthorized manual mint attempt to ${accountId} for ${amount} PFR. BLOCKED.`);
            throw new Error("UNAUTHORIZED_MINT: Manual minting is only allowed for the authorized admin wallet.");
        }

        // 1. Mint tokens to the Treasury
        console.log(`[${network.toUpperCase()}] Minting ${amount} tokens to Treasury...`);
        const mintTx = new TokenMintTransaction()
            .setTokenId(tokenId)
            .setAmount(amount);

        const mintResponse = await mintTx.execute(client);
        const mintReceipt = await mintResponse.getReceipt(client);
        console.log(`[${network.toUpperCase()}] Minted successfully. Status: ${mintReceipt.status.toString()}`);

        if (accountId.toString() === client.operatorAccountId.toString()) {
            console.log(`[${network.toUpperCase()}] Target account is Treasury (${accountId}). Transfer skipped.`);
            return { receipt: mintReceipt, transactionId: mintResponse.transactionId.toString() };
        }

        if (accountKey) {
            try {
                console.log(`[${network.toUpperCase()}] Associating token ${tokenId} to account ${accountId}...`);
                const associateTx = new TokenAssociateTransaction()
                    .setAccountId(accountId)
                    .setTokenIds([tokenId])
                    .freezeWith(client);

                const signTx = await associateTx.sign(accountKey);
                const associateResponse = await signTx.execute(client);
                await associateResponse.getReceipt(client);
                console.log(`[${network.toUpperCase()}] Association successful.`);
            } catch (error) {
                console.log(`[${network.toUpperCase()}] Association skipped or failed (perhaps already associated): ${error.message}`);
            }
        } else {
            console.log(`[${network.toUpperCase()}] No accountKey provided for ${accountId}. Assuming token is already associated.`);
        }

        console.log(`[${network.toUpperCase()}] Transferring ${amount} tokens to ${accountId}...`);
        try {
            const transferTx = new TransferTransaction()
                .addTokenTransfer(tokenId, client.operatorAccountId, -amount)
                .addTokenTransfer(tokenId, accountId, amount);

            const transferResponse = await transferTx.execute(client);
            const transferReceipt = await transferResponse.getReceipt(client);

            console.log(`[${network.toUpperCase()}] Transfer successful! Status: ${transferReceipt.status.toString()}`);
            return { receipt: transferReceipt, transactionId: transferResponse.transactionId.toString() };
        } catch (transferErr) {
            const statusStr = transferErr.status?.toString() || transferErr.message || '';
            if (statusStr.includes('TOKEN_NOT_ASSOCIATED')) {
                console.warn(`[${network.toUpperCase()}] ⚠️ Token ${tokenId} NOT associated for ${accountId}. User must associate first.`);
                return { needsAssociation: true, tokenId, accountId: accountId.toString() };
            }
            throw transferErr; // Re-throw if it's a different error
        }
    } catch (error) {
        console.error(`[${getNetwork(networkStr).toUpperCase()}] Error in mintReputation:`, error);
        throw error;
    }
}
