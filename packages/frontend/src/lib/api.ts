// packages/frontend/src/lib/api.ts

export interface ReasoningStep {
    stepNumber: number;
    label: string;
    content: string;
    hash: string;
    timestamp: number;
}

export interface ReasoningResult {
    proofId: string;
    question: string;
    answer?: string;
    steps: ReasoningStep[];
    totalSteps: number;
    status: "PUBLISHING_TO_HEDERA" | "PUBLISHING" | "CONFIRMED" | "VERIFIED";
    hcsTopicId: string;
    createdAt: number;
}

export interface StoredProof extends ReasoningResult {
    rootHash?: string;
    hcsSequenceNumbers?: number[];
    tokenTxId?: string;
    explorerUrl?: string;
}

import { API_URL } from './utils';

export interface ProofFlowConfig {
    operatorEvmAddress: string;
    operatorAccountId: string;
    serviceFeeHbar: string;
    network: string;
    paymentRequired: boolean;
    contractAddress: string | null;
    contractReady: boolean;
}

export async function getConfig(): Promise<ProofFlowConfig> {
    const response = await fetch(`${API_URL}/config`, {
        cache: "no-store",
        headers: {
            "Cache-Control": "no-cache"
        }
    });
    if (!response.ok) {
        // Fallback: payment not required
        return { operatorEvmAddress: '', operatorAccountId: '0.0.7986674', serviceFeeHbar: '0.02', network: 'testnet', paymentRequired: false, contractAddress: null, contractReady: false };
    }
    return response.json();
}

export async function submitQuestion(question: string, address?: string, paymentTxHash?: string): Promise<ReasoningResult> {
    const response = await fetch(`${API_URL}/reason`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ question, requesterAddress: address, paymentTxHash }),
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
}

export interface ContractTxData {
    contractAddress: string;
    abi: any[];
    args: any[];
    functionName: string;
}

export async function getProofTxData(proofId: string): Promise<ContractTxData> {
    const response = await fetch(`${API_URL}/proof/${proofId}/tx-data`);
    if (!response.ok) {
        throw new Error("Failed to fetch EVM transaction data");
    }
    return response.json();
}

export async function getProof(proofId: string): Promise<StoredProof> {
    const response = await fetch(`${API_URL}/proof/${proofId}`);

    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
}

export async function getRecentProofs(address?: string): Promise<StoredProof[]> {
    const url = address ? `${API_URL}/proofs?address=${address}` : `${API_URL}/proofs`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
}

export interface NetworkStats {
    totalProofs: number;
    totalAgents: number;
    totalTokensMinted: number;
    lastActivity: string | null;
}

export async function getNetworkStats(): Promise<NetworkStats> {
    const response = await fetch(`${API_URL}/stats`);
    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
}
