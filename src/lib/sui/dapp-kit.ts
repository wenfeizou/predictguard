import { createDAppKit } from "@mysten/dapp-kit-react";
import { SuiGrpcClient } from "@mysten/sui/grpc";

const grpcUrls = {
  testnet: "https://fullnode.testnet.sui.io:443",
  mainnet: "https://fullnode.mainnet.sui.io:443",
} as const;

export type SuiDappNetwork = keyof typeof grpcUrls;

export const dAppKit = createDAppKit({
  networks: ["testnet", "mainnet"],
  defaultNetwork: "testnet",
  createClient: (network) =>
    new SuiGrpcClient({
      network,
      baseUrl: grpcUrls[network as SuiDappNetwork],
    }),
});

declare module "@mysten/dapp-kit-react" {
  interface Register {
    dAppKit: typeof dAppKit;
  }
}
