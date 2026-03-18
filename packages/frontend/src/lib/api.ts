// packages/frontend/src/lib/api.ts

export interface ReasoningStep {
    stepNumber: number;
    label: string;
    content: string;
    hash: string;
    timestamp: number;
}

export interface ReasoningResult {
    type?: "SWAP_PROPOSAL";
    proofId: string;
    question: string;
    answer?: string;
    steps: ReasoningStep[];
    totalSteps: number;
    status: "PUBLISHING_TO_HEDERA" | "PUBLISHING" | "CONFIRMED" | "VERIFIED" | "PENDING_EXECUTION" | "FAILED";
    hcsTopicId: string;
    createdAt: number;
    confidenceScore?: number;
    riskLevel?: string;
    blockExecution?: boolean;
    swapDetails?: {
        tokenIn: string;
        tokenOut: string;
        amountIn: string | number;
        originalTokenIn?: string;
        originalTokenOut?: string;
        estimatedOut: string;
        dex: string;
        slippage: string;
    };
    txData?: {
        to: string;
        value: string;
        data: string;
    };
    warnings?: Array<{
        type: string;
        level?: string;
        message: string;
        suggestedToken?: string;
        originalToken?: string;
    }>;
}

export interface StoredProof extends ReasoningResult {
    rootHash?: string;
    hcsSequenceNumbers?: number[];
    tokenTxId?: string;
    requesterAddress?: string;
    explorerUrl?: string;
    needsAssociation?: boolean;
    pfrTokenId?: string;
}

import { API_URL } from './utils';

export interface UserTier {
    id: 'free' | 'bronze' | 'silver' | 'gold';
    name: string;
    count: number;
    discount: number;
    nextTier: number | null;
}

export interface ProofFlowConfig {
    operatorEvmAddress: string;
    operatorAccountId: string;
    serviceFeeHbar: string;
    network: string;
    paymentRequired: boolean;
    contractAddress: string | null;
    contractReady: boolean;
    userTier?: UserTier;
    pfrTokenId?: string;
}

export async function getConfig(networkStr: string = 'testnet', address?: string): Promise<ProofFlowConfig> {
    const url = address
        ? `${API_URL}/config?address=${address}`
        : `${API_URL}/config`;

    const response = await fetch(url, {
        cache: "no-store",
        headers: {
            "Cache-Control": "no-cache",
            "x-network": networkStr
        }
    });

    if (!response.ok) {
        // Fallback: payment not required
        return {
            operatorEvmAddress: '',
            operatorAccountId: '0.0.7986674',
            serviceFeeHbar: '0.16',
            network: 'testnet',
            paymentRequired: false,
            contractAddress: null,
            contractReady: false
        };
    }
    return response.json();
}

export class ApiError extends Error {
    public status: number;
    public data: any;

    constructor(status: number, message: string, data?: any) {
        super(message);
        this.status = status;
        this.data = data;
        this.name = 'ApiError';
    }
}

export async function submitQuestion(question: string, address?: string, paymentTxHash?: string, parentProofIds?: string[], networkStr: string = 'testnet'): Promise<ReasoningResult> {
    const response = await fetch(`${API_URL}/reason`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-network": networkStr
        },
        body: JSON.stringify({ question, requesterAddress: address, paymentTxHash, parentProofIds }),
    });

    if (!response.ok) {
        let serverMsg = response.statusText;
        let jsonData = {};
        try {
            jsonData = await response.json();
            if ((jsonData as any).error) serverMsg = (jsonData as any).error;
        } catch (_) { /* ignore parse error */ }

        throw new ApiError(response.status, `API Error: ${serverMsg}`, jsonData);
    }

    return response.json();
}

export async function verifyCaptcha(token: string, solution: string, networkStr: string = 'testnet'): Promise<boolean> {
    const response = await fetch(`${API_URL}/captcha/verify`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-network": networkStr
        },
        body: JSON.stringify({ token, solution }),
    });

    if (!response.ok) {
        let serverMsg = response.statusText;
        try {
            const errorData = await response.json();
            if (errorData.error) serverMsg = errorData.error;
        } catch (_) { }
        throw new Error(`Captcha Error: ${serverMsg}`);
    }

    const data = await response.json();
    return !!data.success;
}

export interface ContractTxData {
    contractAddress: string;
    abi: any[];
    args: any[];
    functionName: string;
}

export async function getProofTxData(proofId: string, networkStr: string = 'testnet'): Promise<ContractTxData> {
    const response = await fetch(`${API_URL}/proof/${proofId}/tx-data`, {
        headers: { "x-network": networkStr }
    });
    if (!response.ok) {
        throw new Error("Failed to fetch EVM transaction data");
    }
    return response.json();
}

export async function getProof(proofId: string, networkStr: string = 'testnet'): Promise<StoredProof> {
    const response = await fetch(`${API_URL}/proof/${proofId}`, {
        headers: { "x-network": networkStr }
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
}

export async function getRecentProofs(address?: string, networkStr: string = 'testnet'): Promise<StoredProof[]> {
    const url = address ? `${API_URL}/proofs?address=${address}` : `${API_URL}/proofs`;
    const response = await fetch(url, {
        headers: { "x-network": networkStr }
    });

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

export async function getNetworkStats(networkStr: string = 'testnet'): Promise<NetworkStats> {
    const response = await fetch(`${API_URL}/stats`, {
        headers: { "x-network": networkStr }
    });
    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
}

export async function retryTokenMint(proofId: string, networkStr: string = 'testnet'): Promise<{ success: boolean; tokenTxId?: string; explorerUrl?: string; needsAssociation?: boolean }> {
    const response = await fetch(`${API_URL}/token/retry-mint/${proofId}`, {
        method: 'POST',
        headers: { 'x-network': networkStr }
    });
    return response.json();
}
