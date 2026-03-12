"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserInfo } from "@/components/embedded-wallet/UserInfo";
import { SignMethods } from "@/components/embedded-wallet/wallet/SignMethods";
import { HederaSignMethods } from "@/components/embedded-wallet/wallet/HederaSignMethods";
import { SolanaSignMethods } from "@/components/embedded-wallet/wallet/SolanaSignMethods";
import { useEmbeddedWallet } from "@/contexts/EmbeddedWalletContext";
import { UserMethods } from "@/components/embedded-wallet/wallet/UserMethods";
import { WalletMethods } from "@/components/embedded-wallet/wallet/WalletMethods";
import { PageHeader } from "@/components/PageHeader";
import { Network } from "@/contexts/EmbeddedWalletContext";
import { useKeycloakAuth } from "@/hooks/useKeycloakAuth";
import { LoadingScreen } from "@/components/LoadingScreen";

export default function WalletPage() {
  const router = useRouter();
  const { selectedNetwork, userInfo, checkAuthStatus } = useEmbeddedWallet();
  const { status: keycloakStatus } = useKeycloakAuth();
  const networkLabel =
    selectedNetwork === Network.HEDERA
      ? "Hedera Testnet"
      : selectedNetwork[0].toUpperCase() + selectedNetwork.slice(1);

  useEffect(() => {
    if (keycloakStatus === "unauthenticated") {
      router.replace("/embedded-wallet");
      return;
    }

    if (keycloakStatus !== "authenticated") {
      return;
    }

    if (!userInfo) {
      void checkAuthStatus();
    }
  }, [checkAuthStatus, keycloakStatus, router, userInfo]);

  if (keycloakStatus !== "authenticated") {
    return <LoadingScreen message="Checking Keycloak authentication..." />;
  }

  return (
    <div className="relative min-h-screen">
      <div className="relative z-10 flex flex-col items-center min-h-screen p-8 pt-0 sm:pt-12 pb-20 gap-2 sm:gap-16 sm:p-20">
        <PageHeader product="Embedded Wallet" title="Connected" />

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row items-start gap-8 w-full max-w-7xl mt-16 sm:mt-8">
          {/* Left Side - Wallet Profile */}
          <div className="flex flex-col gap-8 w-full lg:w-1/3 min-[741px]:self-start">
            <UserInfo />
          </div>

          {/* Right Side - Signing Methods */}
          <div className="w-full lg:w-2/3 flex flex-col gap-18">
            <div className="rounded-xl border border-slate-4 bg-background p-4">
              <p className="text-sm font-medium text-secondary tracking-wide">
                Current network
              </p>
              <p className="mt-1 text-lg text-white">{networkLabel}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                HBAR funding note: transaction demos require a small testnet HBAR
                balance in your wallet for network fees.
              </p>
            </div>

            {selectedNetwork === Network.HEDERA ? (
              <HederaSignMethods />
            ) : selectedNetwork === Network.SOLANA ? (
              <SolanaSignMethods />
            ) : (
              <SignMethods />
            )}

            <UserMethods />

            {[Network.POLYGON, Network.ETHEREUM, Network.OPTIMISM].includes(
              selectedNetwork
            ) && <WalletMethods />}
          </div>
        </div>
      </div>
    </div>
  );
}
