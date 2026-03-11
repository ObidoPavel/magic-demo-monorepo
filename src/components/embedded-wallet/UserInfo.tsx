"use client";

import { useEmbeddedWallet } from "@/contexts/EmbeddedWalletContext";
import { WalletAddress } from "@/components/WalletAddress";
import { Card } from "../Card";
import IconProfile from "public/icons/icon-profile.svg";
import { Button } from "../Button";

const HEDERA_TESTNET_FAUCET_URL = "https://portal.hedera.com/faucet";

export function UserInfo() {
  const { publicAddress, hederaAccountId, userInfo, handleLogout, selectedNetwork } =
    useEmbeddedWallet();
  const networkLabel =
    selectedNetwork === "hedera"
      ? "Hedera Testnet"
      : selectedNetwork[0].toUpperCase() + selectedNetwork.slice(1);
  const mirrorNodeUrl = hederaAccountId
    ? `https://testnet.mirrornode.hedera.com/api/v1/accounts/${hederaAccountId}`
    : null;

  const displayedAddress =
    selectedNetwork === "hedera" ? hederaAccountId || publicAddress : publicAddress;

  return (
    <Card icon={IconProfile} title={userInfo?.email} className="mb-10">
      <div className="flex flex-col gap-6">
        <div className="rounded-xl border border-slate-4 bg-background p-4">
          <p className="text-sm font-medium text-secondary tracking-wide">
            Current network
          </p>
          <p className="mt-1 text-lg text-white">{networkLabel}</p>
        </div>

        <WalletAddress
          address={displayedAddress}
          label={selectedNetwork === "hedera" ? "Hedera Account ID" : "Wallet Address"}
        />

        {selectedNetwork === "hedera" && (
          <div className="flex flex-col gap-2">
            {mirrorNodeUrl && (
              <Button
                onClick={() =>
                  window.open(
                    mirrorNodeUrl,
                    "_blank",
                    "noopener,noreferrer"
                  )
                }
                variant="secondary"
                fullWidth
              >
                Validate on Mirror Node
              </Button>
            )}
            <Button
              onClick={() =>
                window.open(
                  HEDERA_TESTNET_FAUCET_URL,
                  "_blank",
                  "noopener,noreferrer"
                )
              }
              variant="secondary"
              fullWidth
            >
              Open Testnet Faucet
            </Button>
          </div>
        )}

        <Button onClick={handleLogout} variant="secondary" fullWidth>
          Logout
        </Button>
      </div>
    </Card>
  );
}
