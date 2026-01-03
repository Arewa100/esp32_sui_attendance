import React from "react";
import ReactDOM from "react-dom/client";
import "@mysten/dapp-kit/dist/index.css";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";

import { networkConfig } from "./networkConfig";
import App from "./App";
import "./index.css";
import { validateEnv } from "./config/validate-env";
import { reportWebVitals } from "./utils/web-vitals";
import { EnvError } from "./components/EnvError";

const envValidation = validateEnv();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById("root")!);

const AppWrapper = () => {
  if (!envValidation.isValid) {
    return <EnvError missing={envValidation.missing} />;
  }
  
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
          <WalletProvider 
            autoConnect
            slushWallet={{
              name: 'Sui Attendance System',
            }}
          >
            <App />
          </WalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

if (import.meta.env.PROD) {
  root.render(
    <React.StrictMode>
      <AppWrapper />
    </React.StrictMode>
  );
} else {
  root.render(<AppWrapper />);
}

reportWebVitals();

