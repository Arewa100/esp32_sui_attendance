import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  useCurrentAccount,
  ConnectButton,
  useDisconnectWallet
} from "@mysten/dapp-kit";
import AnimatedLogo from "@/components/AnimatedLogo";

export default React.memo(function LandingNav() {
  const account = useCurrentAccount();
  const navigate = useNavigate();
  const { mutate: disconnectWallet, isPending: isDisconnecting } =
    useDisconnectWallet();
  const connectButtonRef = useRef<HTMLDivElement>(null);
  const [shouldRedirectAfterConnect, setShouldRedirectAfterConnect] =
    useState(false);

  const handleButtonClick = React.useCallback(() => {
    if (account) {
      navigate("/dashboard");
    } else {
      setShouldRedirectAfterConnect(true);
      const button = connectButtonRef.current?.querySelector("button");
      if (button) {
        button.click();
      }
    }
  }, [account, navigate]);

  const handleDisconnect = React.useCallback(() => {
    if (account && !isDisconnecting) {
      disconnectWallet();
    }
  }, [account, isDisconnecting, disconnectWallet]);

  const handleNavClick = React.useCallback((e: React.MouseEvent<HTMLAnchorElement>, selector: string) => {
    e.preventDefault();
    document.querySelector(selector)?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Redirect after connect only if user clicked button
  useEffect(() => {
    if (account && shouldRedirectAfterConnect) {
      navigate("/dashboard");
      setShouldRedirectAfterConnect(false);
    }
  }, [account, shouldRedirectAfterConnect, navigate]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md transition-all duration-200">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between">
          <AnimatedLogo variant="default" />

          <div className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => handleNavClick(e, '#features')}
            >
              Features
            </a>
            <a
              href="#benefits"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => handleNavClick(e, '#benefits')}
            >
              Benefits
            </a>
            <a
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Docs
            </a>
          </div>

          {/* Hidden ConnectButton for programmatic triggering */}
          <div ref={connectButtonRef} className="hidden">
            <ConnectButton />
          </div>

          {/* Wallet button */}
          {account ? (
            <Button
              variant="ghost"
              size="sm"
              className="font-mono text-xs text-foreground hover:bg-orange-500 hover:text-white transition-colors relative group"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
            >
              <span className="group-hover:hidden inline">
                {account.address.slice(0, 6)}...
                {account.address.slice(-4)}
              </span>
              <span className="hidden group-hover:inline">Disconnect</span>
            </Button>
          ) : (
            <div className="[&>button]:!inline-flex [&>button]:!items-center [&>button]:!justify-center [&>button]:!gap-2 [&>button]:!rounded-md [&>button]:!bg-primary [&>button]:!px-4 [&>button]:!py-2 [&>button]:!text-sm [&>button]:!font-medium [&>button]:!text-white [&>button]:!shadow [&>button]:!transition-colors [&>button]:hover:!bg-primary/90 [&>button]:!h-10 [&>button]:!border-0 [&>button]:!cursor-pointer [&>button]:!font-sans">
              <ConnectButton />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
});

