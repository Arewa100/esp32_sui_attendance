import React, { useEffect } from "react";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";

interface MobileConnectButtonProps {
  /**
   * Custom className for the button
   */
  className?: string;
  
  /**
   * Callback when wallet connection is initiated
   */
  onConnectStart?: () => void;
  
  /**
   * Callback when wallet is successfully connected
   */
  onConnectSuccess?: () => void;
}

/**
 * MobileConnectButton - Wrapper around official ConnectButton
 * 
 * The official ConnectButton from @mysten/dapp-kit handles:
 * - Desktop: Slush browser extension
 * - Mobile: Native Slush app via Wallet Standard
 * - Fallback: Slush web wallet
 * 
 * When configured with slushWallet prop in WalletProvider (see main.tsx),
 * it automatically handles all wallet connection scenarios correctly.
 */
export function MobileConnectButton({
  className,
  onConnectStart,
  onConnectSuccess,
}: MobileConnectButtonProps) {
  const account = useCurrentAccount();

  // Monitor for successful connection
  useEffect(() => {
    if (account && onConnectSuccess) {
      onConnectSuccess();
    }
  }, [account, onConnectSuccess]);

  // Use the official ConnectButton - it handles everything
  return <ConnectButton className={className} />;
}

/**
 * Default export for convenience
 */
export default MobileConnectButton;

