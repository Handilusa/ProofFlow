'use client';

import { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { connectToHedera } from './hedera-walletconnect';
import { toast } from 'react-hot-toast';

interface WalletContextType {
    // Current active account (EVM or Hedera)
    account: string | null;
    isConnected: boolean;
    isConnecting: boolean;

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

    // Modal State
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);

    // Derived Unified State
    const account = hederaAccount || evmAddress || null;
    const isConnected = isEvmConnected || !!hederaAccount;
    const isConnecting = isEvmConnecting || isHederaConnecting;

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
                // Extract account ID like 0.0.12345 from hedera:testnet:0.0.12345
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
            // Additionally, you could call signClient.disconnect() here 
            // from the hedera-walletconnect integration if maintaining the session object.
        }
    }, [isEvmConnected, disconnectEvm, hederaAccount]);

    // Restore Hedera session if it exists on load (stub - WalletConnect usually persists automatically)
    // useEffect(() => { ... check signClient sessions ... }, [])

    return (
        <WalletContext.Provider value={{
            account,
            isConnected,
            isConnecting,
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
