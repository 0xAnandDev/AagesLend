/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CHAINS?: string;
  readonly VITE_ARBITRUM_SEPOLIA_RPC_URL?: string;
  readonly VITE_WALLETCONNECT_PROJECT_ID?: string;
  readonly VITE_INDEXER_URL?: string;
  readonly VITE_DEV_WALLET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.png" {
  const src: string;
  export default src;
}
