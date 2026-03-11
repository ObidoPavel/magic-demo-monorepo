"use client";

import { useEmbeddedWallet } from "@/contexts/EmbeddedWalletContext";
import { WalletAddress } from "@/components/WalletAddress";
import { Card } from "../Card";
import IconProfile from "public/icons/icon-profile.svg";
import { Button } from "../Button";

export function UserInfo() {
  const { publicAddress, userInfo, handleLogout, selectedNetwork } =
    useEmbeddedWallet();
  const networkLabel =
    selectedNetwork === "hedera"
      ? "Hedera Testnet"
      : selectedNetwork[0].toUpperCase() + selectedNetwork.slice(1);

  return (
    <Card icon={IconProfile} title={userInfo?.email} className="mb-10">
      <div className="flex flex-col gap-6">
        <div className="rounded-xl border border-slate-4 bg-background p-4">
          <p className="text-sm font-medium text-secondary tracking-wide">
            Current network
          </p>
          <p className="mt-1 text-lg text-white">{networkLabel}</p>
        </div>

        <WalletAddress address={publicAddress} />

        <Button onClick={handleLogout} variant="secondary" fullWidth>
          Logout
        </Button>
      </div>
    </Card>
  );
}
