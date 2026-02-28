import { mintReputation } from "./hedera/reputation-token.js";
import { proofsStore } from "./hcsAudit.service.js";
export class AuditPassService {
    /**
     * Mints a PFR token (Audit Pass) for a given proof and recipient.
     */
    async mintAuditPass(proofId, recipientAddress, accountKey) {
        try {
            // 1 PFR token per reasoning session
            const amount = 1;
            console.log(`[AuditPass] Minting for Proof ${proofId} to ${recipientAddress}`);
            const receipt = await mintReputation(recipientAddress, amount, accountKey);
            const tokenTxId = "unknown-tx"; // Note: TransactionReceipt doesn't store txId directly, you need TransactionResponse.
            const explorerUrl = `https://hashscan.io/testnet/transaction/${tokenTxId}`;
            // Update the proof in the store if it exists
            const storedProof = proofsStore.get(proofId);
            if (storedProof) {
                storedProof.tokenTxId = tokenTxId;
                storedProof.explorerUrl = explorerUrl;
                proofsStore.set(proofId, storedProof);
            }
            return { tokenTxId, explorerUrl };
        }
        catch (error) {
            console.error(`[AuditPass] Failed to mint for proof ${proofId}:`, error);
            throw error;
        }
    }
}
