import { mintReputation } from "./hedera/reputation-token.js";
import { proofsStore, saveProofsToDisk } from "./hcsAudit.service.js";

export class AuditPassService {
    private static MAX_RETRIES = 3;
    private static BASE_DELAY_MS = 2000;

    /**
     * Mints a PFR token (Audit Pass) for a given proof and recipient.
     * Includes retry logic with exponential backoff for transient Hedera failures.
     */
    async mintAuditPass(proofId: string, recipientAddress: string, accountKey?: any): Promise<{ tokenTxId: string; explorerUrl: string }> {
        const amount = 1;
        let lastError: any;

        for (let attempt = 1; attempt <= AuditPassService.MAX_RETRIES; attempt++) {
            try {
                console.log(`[AuditPass] Minting for Proof ${proofId} to ${recipientAddress} (attempt ${attempt}/${AuditPassService.MAX_RETRIES})`);
                const mintResult = await mintReputation(recipientAddress, amount, accountKey);

                const tokenTxId = mintResult.transactionId || "unknown-tx";
                const network = process.env.HEDERA_NETWORK || "testnet";
                const explorerUrl = `https://hashscan.io/${network}/transaction/${tokenTxId}`;

                // Update the proof in the store
                const storedProof = proofsStore.get(proofId);
                if (storedProof) {
                    storedProof.tokenTxId = tokenTxId;
                    storedProof.explorerUrl = explorerUrl;
                    proofsStore.set(proofId, storedProof);
                }

                // Persist to disk
                try { saveProofsToDisk(); } catch (_) { /* best-effort */ }

                console.log(`[AuditPass] ✅ Mint successful for ${proofId} on attempt ${attempt}`);
                return { tokenTxId, explorerUrl };
            } catch (error) {
                lastError = error;
                console.error(`[AuditPass] ❌ Attempt ${attempt}/${AuditPassService.MAX_RETRIES} failed for proof ${proofId}:`, (error as any)?.message || error);

                if (attempt < AuditPassService.MAX_RETRIES) {
                    const delay = AuditPassService.BASE_DELAY_MS * Math.pow(2, attempt - 1);
                    console.log(`[AuditPass] Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        console.error(`[AuditPass] All ${AuditPassService.MAX_RETRIES} attempts failed for proof ${proofId}`);
        throw lastError;
    }
}
