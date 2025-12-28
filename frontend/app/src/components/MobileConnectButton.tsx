import React, { useEffect, useState } from "react";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { isMobileDevice, connectMobileWallet, isReturningFromWallet } from "@/utils/mobile-wallet";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";

interface MobileConnectButtonProps {
  /**
   * Custom className for the button
   */
  className?: string;
  
  /**
   * Custom label for the connect button on mobile
   */
  mobileLabel?: string;
  
  /**
   * Callback when wallet connection is initiated
   */
  onConnectStart?: () => void;
  
  /**
   * Callback when wallet is successfully connected
   */
  onConnectSuccess?: () => void;
  
  /**
   * Whether to show the standard ConnectButton on mobile (default: false)
   * If false, shows a custom mobile button that redirects to myslush.app
   */
  showStandardOnMobile?: boolean;
}

/**
 * Mobile-aware ConnectButton component
 * On mobile devices, redirects to myslush.app for wallet connection
 * On desktop, uses the standard ConnectButton from @mysten/dapp-kit
 */
export function MobileConnectButton({
  className,
  mobileLabel = "Connect Wallet",
  onConnectStart,
  onConnectSuccess,
  showStandardOnMobile = false,
}: MobileConnectButtonProps) {
  const account = useCurrentAccount();
  const [isMobile, setIsMobile] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Detect mobile device
  useEffect(() => {
    setIsMobile(isMobileDevice());
    
    // Listen for resize events to update mobile detection
    const handleResize = () => {
      setIsMobile(isMobileDevice());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check if returning from wallet connection
  useEffect(() => {
    if (isReturningFromWallet() && account && onConnectSuccess) {
      onConnectSuccess();
    }
  }, [account, onConnectSuccess]);

  // Handle mobile wallet connection
  const handleMobileConnect = () => {
    setIsConnecting(true);
    if (onConnectStart) {
      onConnectStart();
    }
    
    try {
      connectMobileWallet();
      // Note: connectMobileWallet() redirects, so setIsConnecting won't be reached
      // But we keep it for error handling
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to connect mobile wallet:', error);
        // Only show alert in development
        alert('Failed to connect wallet. Please try again.');
      }
      setIsConnecting(false);
      // In production, error is handled silently - user will see error from wallet if needed
    }
  };

  // If wallet is already connected, show account info (handled by ConnectButton)
  if (account) {
    return <ConnectButton className={className} />;
  }

  // On mobile, show custom button that redirects to myslush.app
  if (isMobile && !showStandardOnMobile) {
    return (
      <Button
        onClick={handleMobileConnect}
        disabled={isConnecting}
        className={className}
        variant="default"
      >
        <Wallet className="mr-2 h-4 w-4" />
        {isConnecting ? "Opening Wallet..." : mobileLabel}
      </Button>
    );
  }

  // On desktop, use standard ConnectButton
  return <ConnectButton className={className} />;
}

/**
 * Default export for convenience
 */
export default MobileConnectButton;

