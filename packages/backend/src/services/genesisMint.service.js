import { Client, PrivateKey, TokenMintTransaction, TransferTransaction } from '@hashgraph/sdk';
import { getMirrorNodeUrl } from './hedera/networkManager.js';

const GENESIS_TOKEN_ID = "0.0.8170105";

export async function mintAndTransferGenesis(userAddress, network = 'testnet') {
    const operatorId = process.env.HEDERA_ACCOUNT_ID_TESTNET;
    const operatorKey = PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY_TESTNET);
    const client = Client.forTestnet().setOperator(operatorId, operatorKey);

    let hederaAccountId = userAddress;

    // Resolve EVM mapping if 0x address is passed
    if (userAddress.startsWith("0x")) {
        try {
            const mirrorNodeUrl = getMirrorNodeUrl(network);
            const mnRes = await fetch(`${mirrorNodeUrl}/accounts/${userAddress}`);
            if (mnRes.ok) {
                const mnData = await mnRes.json();
                if (mnData.account) {
                    hederaAccountId = mnData.account;
                } else {
                    throw new Error("EVM address not found on Hedera Mirror Node. Please fund the account or use a native Hedera wallet.");
                }
            } else {
                 throw new Error("Could not map EVM address. Ensure your account is active on Hedera.");
            }
        } catch (e) {
            console.error("[Mint Service] Failed to map address:", e.message);
            throw new Error("Account resolution failed. Ensure your EVM address is active on Hedera.");
        }
    }

    try {
        console.log(`[Genesis] Minting Edition for ${hederaAccountId}...`);
        
        // 1. Mint 1 Edition
        const metadataURI = "ipfs://bafkreiahvascdldplfsgzqptqphjtsga7djrc7czdy7atu6jx5vpv22nru";
        const mintTx = await new TokenMintTransaction()
            .setTokenId(GENESIS_TOKEN_ID)
            .setMetadata([Buffer.from(metadataURI)])
            .execute(client);
            
        const mintReceipt = await mintTx.getReceipt(client);
        const serialNumber = mintReceipt.serials[0].low;
        console.log(`[Genesis] Successfully minted Edition #${serialNumber}`);

        // 2. Transfer from Treasury to User
        // Note: Hedera requires the user to "Associate" the token first.
        // If the user has NOT associated the token yet, the TransferTransaction will fail.
        // As a fallback for the hackathon, we will attempt the transfer. If it fails due to TOKEN_NOT_ASSOCIATED_TO_ACCOUNT, 
        // we still return the serial number so the frontend knows it was minted and can tell the user to associate it.
        try {
            const transferTx = await new TransferTransaction()
                .addNftTransfer(GENESIS_TOKEN_ID, serialNumber, operatorId, hederaAccountId)
                .execute(client);
            
            await transferTx.getReceipt(client);
            console.log(`[Genesis] Successfully transferred Edition #${serialNumber} to ${hederaAccountId}`);
            return { success: true, serialNumber, transferred: true };
            
        } catch (transferErr) {
            console.warn(`[Genesis] Transfer failed (User probably didn't associate the token yet):`, transferErr.message);
            return { 
                success: true, 
                serialNumber, 
                transferred: false, 
                message: "Token minted successfully, but transfer failed. Please associate Token ID 0.0.8170105 in your wallet first." 
            };
        }
        
    } catch (e) {
        console.error("[Mint Service] Minting error:", e);
        throw e;
    }
}
