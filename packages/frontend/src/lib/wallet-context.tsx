'use client';

import { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { connectToHedera } from './hedera-walletconnect';
import { UserTier, getConfig } from './api';
import { toast } from 'react-hot-toast';

interface WalletContextType {
    // Current active account (EVM or Hedera)
    account: string | null;
    isConnected: boolean;
    isConnecting: boolean;

    // Network State
    network: 'mainnet' | 'testnet';
    setNetwork: (network: 'mainnet' | 'testnet') => void;

    // User Tier
    userTier: UserTier | null;
    refreshTier: () => Promise<void>;

    // Unified Connect button action
    connect: () => void;
    disconnect: () => void;
    error: string | null;

    // Modal Control
    isSelectorOpen: boolean;
    closeSelector: () => void;

    // Specific Ecosystem connections
    connectEVM: () => void;
    connectHedera: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType>({
    account: null,
    isConnected: false,
    isConnecting: false,
    network: 'testnet',
    setNetwork: () => { },
    userTier: null,
    refreshTier: async () => { },
    connect: () => { },
    disconnect: () => { },
    error: null,
    isSelectorOpen: false,
    closeSelector: () => { },
    connectEVM: () => { },
    connectHedera: async () => { }
});

export function WalletProvider({ children }: { children: ReactNode }) {
    // EVM Context
    const { address: evmAddress, isConnected: isEvmConnected, isConnecting: isEvmConnecting } = useAccount();
    const { openConnectModal } = useConnectModal();
    const { disconnect: disconnectEvm } = useDisconnect();

    // Hedera Context (Local State for now)
    const [hederaAccount, setHederaAccount] = useState<string | null>(null);
    const [isHederaConnecting, setIsHederaConnecting] = useState(false);

    // Tier State
    const [userTier, setUserTier] = useState<UserTier | null>(null);

    // Modal State
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);

    // Network State
    const [network, setNetworkState] = useState<'mainnet' | 'testnet'>('testnet');

    useEffect(() => {
        const savedNetwork = localStorage.getItem('proofflow-network') as 'mainnet' | 'testnet';
        if (savedNetwork && (savedNetwork === 'mainnet' || savedNetwork === 'testnet')) {
            setNetworkState(savedNetwork);
        }
    }, []);

    const setNetwork = useCallback((newNetwork: 'mainnet' | 'testnet') => {
        setNetworkState(newNetwork);
        localStorage.setItem('proofflow-network', newNetwork);
    }, []);

    // Derived Unified State
    const account = hederaAccount || evmAddress || null;
    const isConnected = isEvmConnected || !!hederaAccount;
    const isConnecting = isEvmConnecting || isHederaConnecting;

    const refreshTier = useCallback(async () => {
        if (!account) {
            setUserTier(null);
            return;
        }
        try {
            const config = await getConfig(network, account);
            if (config.userTier) {
                setUserTier(config.userTier);
            }
        } catch (err) {
            console.error('Failed to fetch user tier:', err);
        }
    }, [account, network]);

    useEffect(() => {
        refreshTier();
    }, [refreshTier]);

    // Unified connect action opens our custom selector
    const handleConnect = useCallback(() => {
        setIsSelectorOpen(true);
    }, []);

    const closeSelector = useCallback(() => {
        setIsSelectorOpen(false);
    }, []);

    // Specific Connect Actions
    const connectEVM = useCallback(() => {
        openConnectModal?.();
    }, [openConnectModal]);

    const connectHederaAction = useCallback(async () => {
        setIsHederaConnecting(true);
        try {
            const session = await connectToHedera();
            if (session?.namespaces?.hedera?.accounts?.[0]) {
                const fullAccountStr = session.namespaces.hedera.accounts[0];
                const parts = fullAccountStr.split(':');
                const accountId = parts[parts.length - 1];
                setHederaAccount(accountId);
                toast.success('Hedera Wallet Connected!');
            }
        } catch (error) {
            console.error('Hedera connect failed:', error);
            toast.error('Failed to connect Hedera wallet');
        } finally {
            setIsHederaConnecting(false);
        }
    }, []);

    // Unified Disconnect Action
    const handleDisconnect = useCallback(() => {
        if (isEvmConnected) {
            disconnectEvm();
        }
        if (hederaAccount) {
            setHederaAccount(null);
        }
        setUserTier(null);
    }, [isEvmConnected, disconnectEvm, hederaAccount]);

    return (
        <WalletContext.Provider value={{
            account,
            isConnected,
            isConnecting,
            network,
            setNetwork,
            userTier,
            refreshTier,
            connect: handleConnect,
            disconnect: handleDisconnect,
            error: null,
            isSelectorOpen,
            closeSelector,
            connectEVM,
            connectHedera: connectHederaAction
        }}>
            {children}
        </WalletContext.Provider>
    );
}

export const useWallet = () => useContext(WalletContext);
