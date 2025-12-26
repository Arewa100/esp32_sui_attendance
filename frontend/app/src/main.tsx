// import React from "react";
// import ReactDOM from "react-dom/client";
// import "@mysten/dapp-kit/dist/index.css";
// import { BrowserRouter } from "react-router-dom";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";

// import { networkConfig } from "./networkConfig";
// import App from "./App";
// import "./index.css";

// const queryClient = new QueryClient({
//   defaultOptions: {
//     queries: {
//       staleTime: 30_000, // 30 seconds
//       gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
//       refetchOnWindowFocus: false,
//       retry: 1,
//     },
//   },
// });

// const root = ReactDOM.createRoot(document.getElementById("root")!);

// // Only use StrictMode in production builds to avoid double renders in dev
// const AppWrapper = () => (
//   <BrowserRouter
//     future={{
//       v7_startTransition: true,
//       v7_relativeSplatPath: true,
//     }}
//   >
//     <QueryClientProvider client={queryClient}>
//       <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
//         <WalletProvider autoConnect>
//           <App />
//         </WalletProvider>
//       </SuiClientProvider>
//     </QueryClientProvider>
//   </BrowserRouter>
// );

// // Use StrictMode only in production for better dev performance
// if (import.meta.env.PROD) {
//   root.render(
//     <React.StrictMode>
//       <AppWrapper />
//     </React.StrictMode>
//   );
// } else {
//   root.render(<AppWrapper />);
// }




import React from "react";
import ReactDOM from "react-dom/client";
import "@mysten/dapp-kit/dist/index.css";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";

import { networkConfig } from "./networkConfig";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById("root")!);

// Only use StrictMode in production builds to avoid double renders in dev
const AppWrapper = () => (
  <BrowserRouter
    future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    }}
  >
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <WalletProvider autoConnect>
          <App />
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

// Use StrictMode only in production for better dev performance
if (import.meta.env.PROD) {
  root.render(
    <React.StrictMode>
      <AppWrapper />
    </React.StrictMode>
  );
} else {
  root.render(<AppWrapper />);
}

