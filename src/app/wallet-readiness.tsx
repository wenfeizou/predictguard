"use client";

import { useCurrentAccount, useCurrentNetwork } from "@mysten/dapp-kit-react";
import { ConnectButton } from "@mysten/dapp-kit-react/ui";
import { useEffect } from "react";

import type { WalletReadinessInput } from "@/lib/ptb/hedgeTransaction";

export function WalletReadinessClient({
  onChange,
}: {
  onChange: (wallet: WalletReadinessInput) => void;
}) {
  const account = useCurrentAccount();
  const network = useCurrentNetwork();

  useEffect(() => {
    onChange({
      connected: Boolean(account),
      address: account?.address,
      network,
    });
  }, [account, network, onChange]);

  const connected = Boolean(account?.address);
  const onTestnet = network === "testnet";

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <div
        className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${
          connected && onTestnet
            ? "border-[#1f8a70] bg-[#e8f4ef] text-[#1f8a70]"
            : "border-[#d0a13a] bg-[#fff8e7] text-[#8a6416]"
        }`}
      >
        {connected ? (onTestnet ? "Testnet ready" : "Wrong network") : "Not connected"}
      </div>
      <div className="overflow-hidden rounded-md border border-[#dce3dd] bg-white text-sm font-semibold text-[#17211d]">
        <ConnectButton />
      </div>
    </div>
  );
}
