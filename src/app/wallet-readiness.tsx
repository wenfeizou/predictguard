"use client";

import {
  useCurrentAccount,
  useCurrentClient,
  useCurrentNetwork,
  useDAppKit,
  useWallets,
} from "@mysten/dapp-kit-react";
import { ConnectButton } from "@mysten/dapp-kit-react/ui";
import { Transaction } from "@mysten/sui/transactions";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { predictTestnetConfig } from "@/lib/predict/config";
import type { PredictManagerInventoryReadback } from "@/lib/predict/managerReadback";
import type { WalletReadinessInput } from "@/lib/ptb/hedgeTransaction";

export function WalletReadinessClient({
  onChange,
}: {
  onChange: (wallet: WalletReadinessInput) => void;
}) {
  const dAppKit = useDAppKit();
  const account = useCurrentAccount();
  const client = useCurrentClient();
  const network = useCurrentNetwork();
  const queryClient = useQueryClient();
  const wallets = useWallets();
  const [connectError, setConnectError] = useState<string | null>(null);
  const [managerCreatePending, setManagerCreatePending] = useState(false);
  const [managerCreateDigest, setManagerCreateDigest] = useState<string | null>(null);
  const [managerCreateError, setManagerCreateError] = useState<string | null>(null);

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
        managerCreatedAtMs?: number;
        inventoryReadback?: PredictManagerInventoryReadback | { error: string };
        error?: string;
      };
    },
    enabled: Boolean(account?.address && network === "testnet"),
    refetchInterval: managerCreateDigest ? 2000 : false,
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
        managerInventory:
          managerQuery.data?.inventoryReadback &&
          !("error" in managerQuery.data.inventoryReadback)
            ? managerQuery.data.inventoryReadback
            : undefined,
      },
    });
  }, [account, dusdcQuery.data, managerQuery.data, network, onChange]);

  const connected = Boolean(account?.address);
  const onTestnet = network === "testnet";
  const showWalletDiagnostics =
    !connected || wallets.some((wallet) => wallet.accounts.length === 0);

  async function createPredictManager() {
    if (!account?.address || !onTestnet) {
      return;
    }

    setManagerCreatePending(true);
    setManagerCreateDigest(null);
    setManagerCreateError(null);

    try {
      const transaction = new Transaction();
      transaction.moveCall({
        target: `${predictTestnetConfig.packageId}::predict::create_manager`,
      });

      const result = await dAppKit.signAndExecuteTransaction({ transaction });
      if (result.FailedTransaction) {
        throw new Error(
          result.FailedTransaction.status.error?.message ?? "Create manager transaction failed",
        );
      }

      const digest = result.Transaction.digest;
      await client.core.waitForTransaction({ digest });
      setManagerCreateDigest(digest);
      await queryClient.refetchQueries({ queryKey: ["predict-manager", account.address] });
    } catch (error) {
      setManagerCreateError(
        error instanceof Error ? error.message : "Unknown manager creation error",
      );
    } finally {
      setManagerCreatePending(false);
    }
  }

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
      <div className="rounded-md border border-[#dce3dd] bg-white text-sm font-semibold text-[#17211d]">
        <ConnectButton />
      </div>
      {showWalletDiagnostics ? (
        <div className="w-full max-w-xs rounded-md border border-[#dce3dd] bg-white p-3 text-xs text-[#52615a]">
          <div className="font-semibold text-[#17211d]">Wallet diagnostics</div>
          <div className="mt-2">
            Detected:{" "}
            <span className="font-semibold text-[#17211d]">{wallets.length}</span>
          </div>
          <ul className="mt-2 space-y-2">
            {wallets.map((wallet) => (
              <li key={wallet.name} className="rounded-md border border-[#dce3dd] p-2">
                <div className="font-semibold text-[#17211d]">{wallet.name}</div>
                <div>Accounts exposed: {wallet.accounts.length}</div>
                <div className="break-all">
                  Chains:{" "}
                  {Array.from(
                    new Set(wallet.accounts.flatMap((walletAccount) => walletAccount.chains)),
                  ).join(", ") || "Unavailable"}
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    setConnectError(null);
                    try {
                      await dAppKit.connectWallet({ wallet });
                    } catch (error) {
                      setConnectError(
                        error instanceof Error
                          ? `${error.name}: ${error.message}`
                          : JSON.stringify(error),
                      );
                    }
                  }}
                  className="mt-2 rounded-md bg-[#17211d] px-3 py-1 font-semibold text-white transition hover:bg-[#1f8a70]"
                >
                  Connect this wallet
                </button>
              </li>
            ))}
          </ul>
          {connectError ? (
            <div className="mt-2 rounded-md border border-[#c75c48] bg-[#fff1ed] p-2 text-[#8f3325]">
              {connectError}
            </div>
          ) : null}
        </div>
      ) : null}
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
          {managerQuery.data?.managerFound === false ? (
            <button
              type="button"
              onClick={createPredictManager}
              disabled={managerCreatePending}
              className="mt-3 w-full rounded-md bg-[#17211d] px-3 py-2 font-semibold text-white transition hover:bg-[#1f8a70] disabled:cursor-not-allowed disabled:bg-[#aeb8b2]"
            >
              {managerCreatePending ? "Creating" : "Create PredictManager"}
            </button>
          ) : null}
          {managerCreateError ? (
            <div className="mt-2 rounded-md border border-[#c75c48] bg-[#fff1ed] p-2 text-[#8f3325]">
              {managerCreateError}
            </div>
          ) : null}
          {managerCreateDigest ? (
            <a
              href={`https://testnet.suivision.xyz/txblock/${managerCreateDigest}`}
              target="_blank"
              rel="noreferrer"
              className="mt-2 block break-all font-semibold text-[#1f8a70] underline-offset-4 hover:underline"
            >
              Manager tx: {managerCreateDigest}
            </a>
          ) : null}
          {managerCreateDigest && managerQuery.data?.managerFound === false ? (
            <div className="mt-2 rounded-md border border-[#d0a13a] bg-[#fff8e7] p-2 text-[#8a6416]">
              Manager transaction confirmed. Waiting for Predict server indexing.
            </div>
          ) : null}
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
