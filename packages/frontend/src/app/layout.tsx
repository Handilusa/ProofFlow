import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "@/lib/wallet-context";
import { LanguageProvider } from "@/lib/language-context";
import AppShell from "@/components/proofflow/AppShell";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "ProofFlow | Trust Layer",
  description: "Cryptographic trust, autonomous agents, unstoppable execution on Hedera.",
  openGraph: {
    title: "ProofFlow | Trust Layer",
    description: "Cryptographic trust, autonomous agents, unstoppable execution on Hedera.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background antialiased selection:bg-success/20 selection:text-success text-text-primary">
        <LanguageProvider>
          <WalletProvider>
            <AppShell>
              {children}
            </AppShell>
          </WalletProvider>
        </LanguageProvider>
        <Toaster position="bottom-right" toastOptions={{ className: 'font-mono text-sm', style: { background: '#18181A', color: '#F8FAFC', border: '1px solid #27272A' } }} />
      </body>
    </html>
  );
}

