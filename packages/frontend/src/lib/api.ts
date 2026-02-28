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

export async function submitQuestion(question: string, address?: string): Promise<ReasoningResult> {
    const response = await fetch(`${API_URL}/reason`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ question, requesterAddress: address }),
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
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
