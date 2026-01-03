import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCurrentAccount } from "@mysten/dapp-kit";

/**
 * WalletCallback - Handles wallet connection callbacks and redirects
 * 
 * This component catches wallet callback routes (like /callback, /wallet/callback, etc.)
 * and redirects to the appropriate page. The WalletProvider handles the actual
 * connection state via URL hash/query parameters automatically.
 */
export default function WalletCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const account = useCurrentAccount();

  useEffect(() => {
    // Log for debugging (always log to help diagnose the issue)
    console.log("WalletCallback: Handling wallet callback", {
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
      fullUrl: window.location.href,
      account: account?.address,
    });

    // Wait a brief moment for WalletProvider to process the callback
    // Then redirect based on connection status
    const timeoutId = setTimeout(() => {
      if (account) {
        // Wallet connected successfully, redirect to dashboard
        navigate("/dashboard", { replace: true });
      } else {
        // No account yet, redirect to home
        // The WalletProvider's autoConnect will handle the connection
        navigate("/", { replace: true });
      }
    }, 1000); // Increased timeout to allow WalletProvider to process

    return () => clearTimeout(timeoutId);
  }, [navigate, location, account]);

  // Show a brief loading state while processing
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
        <p className="text-muted-foreground">Connecting wallet...</p>
      </div>
    </div>
  );
}

