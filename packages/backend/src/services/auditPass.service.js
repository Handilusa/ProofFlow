import { mintReputation } from "./hedera/reputation-token.js";
import { mintNftTier } from "./hedera/nft-pass.js";
import { proofsStore, saveProofsToDisk, HCSAuditService } from "./hcsAudit.service.js";

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000;

export const TIER_THRESHOLDS = {
    BRONZE: 50,
    SILVER: 250,
    GOLD: 750
};

export class AuditPassService {
    constructor() {
        this.hcsAuditService = new HCSAuditService();
    }

    /**
     * Calculates the tier of a user based on their proof count.
     */
    async getUserTier(address, network = "testnet") {
        const proofs = await this.hcsAuditService.getRecentProofs(address, network);
        const count = proofs.length;

        if (count >= TIER_THRESHOLDS.GOLD) return { id: 'gold', name: 'Gold', count, discount: 0.69, nextTier: null };
        if (count >= TIER_THRESHOLDS.SILVER) return { id: 'silver', name: 'Silver', count, discount: 0.20, nextTier: TIER_THRESHOLDS.GOLD };
        if (count >= TIER_THRESHOLDS.BRONZE) return { id: 'bronze', name: 'Bronze', count, discount: 0.10, nextTier: TIER_THRESHOLDS.SILVER };

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
                const mintResult = await mintReputation(recipientAddress, amount, accountKey, networkStr);
                const tokenTxId = mintResult.transactionId || "unknown-tx";
                const explorerUrl = `https://hashscan.io/${networkStr}/transaction/${tokenTxId}`;

                // Update the proof in the store
                const storedProof = proofsStore.get(proofId);
                if (storedProof) {
                    storedProof.tokenTxId = tokenTxId;
                    storedProof.explorerUrl = explorerUrl;
                    proofsStore.set(proofId, storedProof);
                    try { saveProofsToDisk(); } catch (_) { }
                }

                // 2. Check for NFT Tier Milestones
                const proofs = await this.hcsAuditService.getRecentProofs(recipientAddress, networkStr);
                const newCount = proofs.length;

                console.log(`[AuditPass] User ${recipientAddress} now has ${newCount} total audits.`);

                // Check milestones
                for (const [tier, threshold] of Object.entries(TIER_THRESHOLDS)) {
                    if (newCount === threshold) {
                        try {
                            console.log(`[AuditPass] 🎉 User reached ${tier} milestone (${threshold} audits)! Minting NFT...`);
                            await mintNftTier(recipientAddress, tier, networkStr);
                        } catch (nftErr) {
                            console.error(`[AuditPass] Failed to mint milestone NFT:`, nftErr.message);
                        }
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
