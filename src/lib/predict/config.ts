export type PredictTestnetConfig = {
  network: "testnet";
  apiBaseUrl: string;
  packageId: string;
  predictObjectId: string;
  dusdcType: string;
  plpType: string;
};

export const predictTestnetConfig: PredictTestnetConfig = {
  network: "testnet",
  apiBaseUrl:
    process.env.NEXT_PUBLIC_PREDICT_API_BASE_URL ??
    "https://predict-server.testnet.mystenlabs.com",
  packageId:
    process.env.NEXT_PUBLIC_PREDICT_PACKAGE_ID ??
    "0xf5ea2b3749c65d6e56507cc35388719aadb28f9cab873696a2f8687f5c785138",
  predictObjectId:
    process.env.NEXT_PUBLIC_PREDICT_OBJECT_ID ??
    "0xc8736204d12f0a7277c86388a68bf8a194b0a14c5538ad13f22cbd8e2a38028a",
  dusdcType:
    process.env.NEXT_PUBLIC_PREDICT_DUSDC_TYPE ??
    "0xe95040085976bfd54a1a07225cd46c8a2b4e8e2b6732f140a0fc49850ba73e1a::dusdc::DUSDC",
  plpType:
    process.env.NEXT_PUBLIC_PREDICT_PLP_TYPE ??
    "0xf5ea2b3749c65d6e56507cc35388719aadb28f9cab873696a2f8687f5c785138::plp::PLP",
};
