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
  
  /**
   * @deprecated - Not used with official Slush wallet support
   */
  mobileLabel?: string;
}

/**
 * MobileConnectButton - Uses official @mysten/dapp-kit Slush wallet support
 * 
 * With slushWallet prop configured in WalletProvider, the ConnectButton automatically:
 * - Shows Slush extension if installed (desktop)
 * - Falls back to Slush web app (my.slush.app) if extension not installed (mobile/desktop)
 * - Handles all connection logic automatically
 * 
 * No custom deep link code needed - dapp-kit handles everything!
 */
export function MobileConnectButton({
  className,
  onConnectStart,
  onConnectSuccess,
  mobileLabel,
}: MobileConnectButtonProps) {
  const account = useCurrentAccount();

  // Monitor for successful connection
  useEffect(() => {
    if (account && onConnectSuccess) {
      onConnectSuccess();
    }
  }, [account, onConnectSuccess]);

  // Simply use the standard ConnectButton - it handles Slush wallet automatically
  // The WalletProvider has slushWallet configured, so ConnectButton will:
  // - Show Slush extension if available
  // - Fall back to Slush web app (my.slush.app) on mobile
  return <ConnectButton className={className} />;
}

/**
 * Default export for convenience
 */
export default MobileConnectButton;

