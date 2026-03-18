import { mintReputation, getOrCreateToken } from "./hedera/reputation-token.js";
import { mintNftTier, getOrCreateNftToken } from "./hedera/nft-pass.js";
import { HCSAuditService } from "./hcsAudit.service.js";
import { getClient, getNetwork } from "./hedera/networkManager.js";
import { AccountBalanceQuery, AccountId, TokenId } from "@hashgraph/sdk";

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000;

export const TIER_THRESHOLDS = {
    BRONZE: 50,
    SILVER: 250,
    GOLD: 750
};

/**
 * Resolves any address format (EVM 0x... or native 0.0.x) to an AccountId object.
 */
function resolveAccountId(address) {
    if (address.startsWith("0x")) {
        return AccountId.fromEvmAddress(0, 0, address);
    }
    return AccountId.fromString(address);
}

export class AuditPassService {
    constructor() {
        this.hcsAuditService = new HCSAuditService();
    }

    /**
     * Calculates the tier of a user using SDK AccountBalanceQuery (consensus node).
     * No Mirror Node dependency for critical ownership logic.
     */
    async getUserTier(address, networkStr = "testnet") {
        let count = 0;

        try {
            const network = getNetwork(networkStr);
            const client = getClient(network);
            const accountId = resolveAccountId(address);

            // Query all token balances via SDK (consensus node)
            let balanceMap = null;
            try {
                const balance = await new AccountBalanceQuery()
                    .setAccountId(accountId)
                    .execute(client);
                balanceMap = balance.tokens?._map;
            } catch (err) {
                const statusStr = err.status?.toString() || err.message || '';
                if (statusStr.includes('INVALID_ACCOUNT_ID') || statusStr.includes('ACCOUNT_ID_DOES_NOT_EXIST')) {
                    console.log(`[AuditPass] Account ${address} does not exist on Hedera yet.`);
                    return { id: 'free', name: 'Free', count: 0, discount: 0, nextTier: TIER_THRESHOLDS.BRONZE };
                }
                throw err;
            }

            // 1. Get PFR token count (audit count)
            const pfrTokenId = await getOrCreateToken(network);
            if (balanceMap) {
                const pfrBalance = balanceMap.get(TokenId.fromString(pfrTokenId).toString());
                if (pfrBalance) count = Number(pfrBalance);
            }

            // 2. Check Bronze NFT ownership via SDK
            const bronzeTokenId = await getOrCreateNftToken('BRONZE', network);
            if (balanceMap) {
                const bronzeBalance = balanceMap.get(TokenId.fromString(bronzeTokenId).toString());
                if (bronzeBalance && Number(bronzeBalance) > 0) {
                    console.log(`[AuditPass] ✅ Confirmed ${address} holds Bronze NFT via SDK.`);
                    return { id: 'bronze', name: 'Bronze', count, discount: 0.10, nextTier: TIER_THRESHOLDS.SILVER };
                }
            }
        } catch (e) {
            console.error(`[AuditPass] Failed to fetch tier via SDK for ${address}:`, e.message);
        }

        // If they don't have the NFT, they are Free tier
        return { id: 'free', name: 'Free', count, discount: 0, nextTier: TIER_THRESHOLDS.BRONZE };
    }

    /**
     * Mints a PFR token (Audit Pass) for a given proof and recipient.
     * Also checks if the user reached a new NFT tier milestone.
     */
    async mintAuditPass(proofId, recipientAddress, accountKey, networkStr = "testnet") {
        const amount = 1;
        let lastError;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                console.log(`[AuditPass - ${networkStr.toUpperCase()}] Minting for Proof ${proofId} to ${recipientAddress} (attempt ${attempt}/${MAX_RETRIES})`);

                // 1. Mint the standard Reputation Token (Fungible)
                const mintResult = await mintReputation(recipientAddress, amount, accountKey, networkStr, true);

                // If the user's wallet doesn't have PFR associated, bubble up immediately
                if (mintResult.needsAssociation) {
                    console.warn(`[AuditPass] Token not associated for ${recipientAddress}. Needs user action.`);
                    return { needsAssociation: true, tokenId: mintResult.tokenId, accountId: mintResult.accountId };
                }

                const tokenTxId = mintResult.transactionId || "unknown-tx";
                const explorerUrl = `https://hashscan.io/${networkStr}/transaction/${tokenTxId}`;

                // 2. Check for NFT Tier Milestones
                const userTierData = await this.getUserTier(recipientAddress, networkStr);
                const newCount = userTierData.count;

                console.log(`[AuditPass] User ${recipientAddress} now has ${newCount} total audits (PFR balance).`);

                // Check milestone — use >= to catch users who passed the threshold
                if (newCount >= TIER_THRESHOLDS.BRONZE && userTierData.id === 'free') {
                    try {
                        console.log(`[AuditPass] 🔍 User reached Bronze milestone (${newCount} audits, threshold: ${TIER_THRESHOLDS.BRONZE}). Minting Bronze NFT...`);
                        
                        // mintNftTier already has its own SDK-based 1-per-wallet check
                        const result = await mintNftTier(recipientAddress, 'BRONZE', networkStr);
                        
                        if (result.alreadyOwned) {
                            console.log(`[AuditPass] ℹ️ User already owns Bronze NFT — skipping mint.`);
                        } else {
                            console.log(`[AuditPass] ✅ Bronze NFT minted! Serial: ${result.serialNumber}`);
                        }
                    } catch (nftErr) {
                        console.error(`[AuditPass] Failed to process milestone NFT logic:`, nftErr.message);
                    }
                }

                console.log(`[AuditPass] ✅ Process complete for ${proofId}`);
                return { tokenTxId, explorerUrl };
            } catch (error) {
                lastError = error;
                console.error(`[AuditPass] ❌ Attempt ${attempt}/${MAX_RETRIES} failed for proof ${proofId}:`, error?.message || error);

                if (attempt < MAX_RETRIES) {
                    const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
                    console.log(`[AuditPass] Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        throw lastError;
    }
}

