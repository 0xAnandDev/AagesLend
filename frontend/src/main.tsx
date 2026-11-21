import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { darkTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import "@rainbow-me/rainbowkit/styles.css";
import "./styles/globals.css";
import App from "./App";
import { config } from "./wagmi";
import { ToastProvider } from "./hooks/useToasts";

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 4_000 } } });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({ accentColor: "#ffffff", accentColorForeground: "#000000", borderRadius: "large" })}>
          <ToastProvider>
            <App />
          </ToastProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
);
