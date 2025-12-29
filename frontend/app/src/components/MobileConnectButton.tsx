import React, { useCallback, useEffect, useState } from "react";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { isMobileDevice, connectMobileWallet } from "@/utils/mobile-wallet";
import { Button } from "@/components/ui/button";

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
   * Label for mobile connect button
   */
  mobileLabel?: string;
}

/**
 * MobileConnectButton - Hybrid approach for Slush wallet connection
 * 
 * The official dapp-kit slushWallet prop doesn't generate the correct URL format
 * that Slush web wallet expects, causing "Invalid Link" errors on mobile.
 * 
 * Solution: Use custom deep links for mobile (proven format), official support for desktop
 * 
 * - Desktop: Uses standard ConnectButton with official Slush extension support
 * - Mobile: Uses custom deep link to my.slush.app with correct URL format
 */
export function MobileConnectButton({
  className,
  onConnectStart,
  onConnectSuccess,
  mobileLabel = "Connect Wallet",
}: MobileConnectButtonProps) {
  const account = useCurrentAccount();
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(isMobileDevice());
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle mobile wallet connection with custom deep link
  const handleMobileConnect = useCallback(() => {
    if (onConnectStart) {
      onConnectStart();
    }
    
    try {
      connectMobileWallet();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to connect mobile wallet:', error);
      }
    }
  }, [onConnectStart]);

  // Monitor for successful connection
  useEffect(() => {
    if (account && onConnectSuccess) {
      onConnectSuccess();
    }
  }, [account, onConnectSuccess]);

  // If wallet is already connected, show account info
  if (account) {
    return <ConnectButton className={className} />;
  }

  // Mobile: Use custom deep link (correct format that Slush expects)
  if (isMobile) {
    return (
      <Button
        onClick={handleMobileConnect}
        className={className}
      >
        {mobileLabel}
      </Button>
    );
  }

  // Desktop: Use standard ConnectButton (official Slush extension support)
  return <ConnectButton className={className} />;
}

/**
 * Default export for convenience
 */
export default MobileConnectButton;

