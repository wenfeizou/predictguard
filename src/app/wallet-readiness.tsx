"use client";

import { useCurrentAccount, useCurrentClient, useCurrentNetwork } from "@mysten/dapp-kit-react";
import { ConnectButton } from "@mysten/dapp-kit-react/ui";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { predictTestnetConfig } from "@/lib/predict/config";
import type { WalletReadinessInput } from "@/lib/ptb/hedgeTransaction";

export function WalletReadinessClient({
  onChange,
}: {
  onChange: (wallet: WalletReadinessInput) => void;
}) {
  const account = useCurrentAccount();
  const client = useCurrentClient();
  const network = useCurrentNetwork();

  const dusdcQuery = useQuery({
    queryKey: ["dusdc-coins", account?.address, network],
    queryFn: async () => {
      const response = await client.core.listCoins({
        owner: account!.address,
        coinType: predictTestnetConfig.dusdcType,
        limit: 20,
      });
      const coins = [...response.objects].sort((a, b) => {
        const balanceA = BigInt(a.balance);
        const balanceB = BigInt(b.balance);
        if (balanceA === balanceB) {
          return 0;
        }
        return balanceA < balanceB ? 1 : -1;
      });
      const selected = coins[0];

      return {
        coins,
        selectedCoinObjectId: selected?.objectId,
        totalBalanceMist: coins
          .reduce((sum, coin) => sum + BigInt(coin.balance), BigInt(0))
          .toString(),
      };
    },
    enabled: Boolean(account?.address && network === "testnet"),
  });

  const managerQuery = useQuery({
    queryKey: ["predict-manager", account?.address],
    queryFn: async () => {
      const response = await fetch(`/api/predict/manager?owner=${account!.address}`);
      if (!response.ok) {
        throw new Error(`Manager lookup returned ${response.status}`);
      }
      return (await response.json()) as {
        managerFound: boolean;
        managerObjectId?: string;
        candidateCount?: number;
        error?: string;
      };
    },
    enabled: Boolean(account?.address && network === "testnet"),
  });

  useEffect(() => {
    onChange({
      connected: Boolean(account),
      address: account?.address,
      network,
      account: {
        dusdcCoinObjectId: dusdcQuery.data?.selectedCoinObjectId,
        dusdcBalanceMist: dusdcQuery.data?.totalBalanceMist,
        managerObjectId: managerQuery.data?.managerObjectId,
        managerFound: managerQuery.data?.managerFound,
      },
    });
  }, [account, dusdcQuery.data, managerQuery.data, network, onChange]);

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
      {connected && onTestnet ? (
        <div className="w-full max-w-xs rounded-md border border-[#dce3dd] bg-white p-3 text-xs text-[#52615a]">
          <div className="font-semibold text-[#17211d]">Account readiness</div>
          <dl className="mt-2 space-y-2">
            <div>
              <dt className="font-semibold text-[#17211d]">dUSDC balance</dt>
              <dd>{formatDusdc(dusdcQuery.data?.totalBalanceMist)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[#17211d]">dUSDC coin</dt>
              <dd className="break-all">
                {dusdcQuery.isPending
                  ? "Checking"
                  : dusdcQuery.data?.selectedCoinObjectId ?? "Missing"}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-[#17211d]">PredictManager</dt>
              <dd className="break-all">
                {managerQuery.isPending
                  ? "Checking"
                  : managerQuery.data?.managerObjectId ?? "Missing"}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}
    </div>
  );
}

function formatDusdc(value?: string) {
  if (!value) {
    return "0.00 dUSDC";
  }

  return `${(Number(value) / 1_000_000).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })} dUSDC`;
}
