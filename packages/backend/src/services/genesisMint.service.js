import { Client, PrivateKey, TokenMintTransaction, TransferTransaction, AccountBalanceQuery, AccountId, TokenId } from '@hashgraph/sdk';
import { getClient } from './hedera/networkManager.js';

const GENESIS_TOKEN_ID = "0.0.8170105";

// In-memory lock to prevent race-condition exploits from concurrent API calls
const activeMints = new Set();

/**
 * Resolves any address format (EVM 0x... or native 0.0.x) to an AccountId object.
 * Uses AccountId.fromEvmAddress() for EVM aliases — this is a local conversion,
 * the actual validity is checked when we execute the AccountBalanceQuery.
 */
function resolveAccountId(address) {
    if (address.startsWith("0x")) {
        // fromEvmAddress(shard, realm, evmAddress) — deterministic local conversion
        return AccountId.fromEvmAddress(0, 0, address);
    }
    return AccountId.fromString(address);
}

/**
 * Checks if a wallet owns the Genesis NFT using the Hedera SDK (consensus node query).
 * This is 100% on-chain and does NOT use the Mirror Node.
 * 
 * @param {string} address - EVM (0x...) or native (0.0.x) address
 * @param {string} network - 'mainnet' or 'testnet'
 * @returns {Promise<{owned: boolean, balance: number, accountId: string}>}
 */
export async function checkGenesisOwnership(address, network = 'testnet') {
    const client = getClient(network);
    const accountId = resolveAccountId(address);

    try {
        const balance = await new AccountBalanceQuery()
            .setAccountId(accountId)
            .execute(client);

        const tokenId = TokenId.fromString(GENESIS_TOKEN_ID);
        // balance.tokens is a TokenBalanceMap; get() returns Long or undefined
        const tokenBalance = balance.tokens?._map?.get(tokenId.toString());
        const numericBalance = tokenBalance ? Number(tokenBalance) : 0;

        console.log(`[Genesis] SDK AccountBalanceQuery for ${accountId.toString()}: Genesis balance = ${numericBalance}`);

        return {
            owned: numericBalance > 0,
            balance: numericBalance,
            accountId: accountId.toString()
        };
    } catch (err) {
        const statusStr = err.status?.toString() || err.message || '';
        
        // INVALID_ACCOUNT_ID = account doesn't exist on Hedera (new/hollow EVM wallet)
        // This means they definitely don't own any NFTs
        if (statusStr.includes('INVALID_ACCOUNT_ID') || statusStr.includes('ACCOUNT_ID_DOES_NOT_EXIST')) {
            console.log(`[Genesis] Account ${address} does not exist on Hedera yet — ownership = false`);
            return { owned: false, balance: 0, accountId: accountId.toString() };
        }

        // Any other error is unexpected — log and re-throw
        console.error(`[Genesis] SDK AccountBalanceQuery failed for ${address}:`, err.message);
        throw err;
    }
}

export async function mintAndTransferGenesis(userAddress, network = 'testnet') {
    if (activeMints.has(userAddress)) {
        throw new Error("Minting is already in progress for this address. Protection against concurrent requests.");
    }
    activeMints.add(userAddress);

    try {
        const client = getClient(network);
        const operatorId = network === 'mainnet'
            ? process.env.HEDERA_ACCOUNT_ID_MAINNET
            : process.env.HEDERA_ACCOUNT_ID_TESTNET;

        // ── Step 1: Resolve address ──
        const accountId = resolveAccountId(userAddress);
        const hederaAccountId = accountId.toString();
        console.log(`[Genesis] Resolved ${userAddress} → ${hederaAccountId}`);

        // ── Step 2: On-chain ownership check via SDK (NOT Mirror Node) ──
        const ownership = await checkGenesisOwnership(userAddress, network);
        if (ownership.owned) {
            console.warn(`[Genesis] Wallet ${hederaAccountId} already owns ${ownership.balance} Genesis NFT(s). Mint rejected.`);
            throw new Error("Ya posees un Genesis NFT en esta wallet. Límite de 1 por usuario.");
        }

        // ── Step 3: Mint 1 Edition ──
        try {
            console.log(`[Genesis] Minting Edition for ${hederaAccountId}...`);
            
            const metadataURI = "ipfs://bafkreiahvascdldplfsgzqptqphjtsga7djrc7czdy7atu6jx5vpv22nru";
            const mintTx = await new TokenMintTransaction()
                .setTokenId(GENESIS_TOKEN_ID)
                .setMetadata([Buffer.from(metadataURI)])
                .execute(client);
                
            const mintReceipt = await mintTx.getReceipt(client);
            const serialNumber = mintReceipt.serials[0].low;
            console.log(`[Genesis] Successfully minted Edition #${serialNumber}`);

            // ── Step 4: Transfer from Treasury to User ──
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

    } finally {
        activeMints.delete(userAddress);
    }
}
