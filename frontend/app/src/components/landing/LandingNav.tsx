import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  useCurrentAccount,
  ConnectButton,
  useDisconnectWallet
} from "@mysten/dapp-kit";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import AnimatedLogo from "@/components/AnimatedLogo";

export default React.memo(function LandingNav() {
  const account = useCurrentAccount();
  const navigate = useNavigate();
  const { mutate: disconnectWallet, isPending: isDisconnecting } =
    useDisconnectWallet();
  const connectButtonRef = useRef<HTMLDivElement>(null);
  const [shouldRedirectAfterConnect, setShouldRedirectAfterConnect] =
    useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    setMobileMenuOpen(false); // Close mobile menu after clicking
  }, []);

  // Redirect after connect only if user clicked button
  useEffect(() => {
    if (account && shouldRedirectAfterConnect) {
      navigate("/dashboard");
      setShouldRedirectAfterConnect(false);
    }
  }, [account, shouldRedirectAfterConnect, navigate]);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md transition-all duration-200">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <AnimatedLogo variant="default" />

            {/* Desktop Navigation Links */}
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

            {/* Desktop Wallet button */}
            <div className="hidden md:block">
              {account ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-mono text-xs text-foreground hover:bg-orange-500 hover:text-white transition-colors relative group md:h-11"
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
                <div className="[&>button]:!inline-flex [&>button]:!items-center [&>button]:!justify-center [&>button]:!gap-2 [&>button]:!rounded-md [&>button]:!bg-primary [&>button]:!px-4 [&>button]:!py-2 [&>button]:!text-sm [&>button]:!font-medium [&>button]:!text-white [&>button]:!shadow [&>button]:!transition-colors [&>button]:hover:!bg-primary/90 [&>button]:!h-10 [&>button]:!md:!h-11 [&>button]:!border-0 [&>button]:!cursor-pointer [&>button]:!font-sans">
                  <ConnectButton />
                </div>
              )}
            </div>

            {/* Mobile Hamburger Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-10 w-10"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-background/95 backdrop-blur-md">
          <SheetHeader>
            <SheetTitle className="text-left">Menu</SheetTitle>
            <SheetDescription className="sr-only">
              Navigation menu with links to Features, Benefits, Docs, and wallet connection
            </SheetDescription>
          </SheetHeader>
          
          <div className="flex flex-col gap-4 mt-8">
            {/* Navigation Links */}
            <nav className="flex flex-col gap-2">
              <a
                href="#features"
                className="text-base text-muted-foreground hover:text-foreground transition-colors py-2 px-3 rounded-md hover:bg-muted/50"
                onClick={(e) => handleNavClick(e, '#features')}
              >
                Features
              </a>
              <a
                href="#benefits"
                className="text-base text-muted-foreground hover:text-foreground transition-colors py-2 px-3 rounded-md hover:bg-muted/50"
                onClick={(e) => handleNavClick(e, '#benefits')}
              >
                Benefits
              </a>
              <a
                href="#"
                className="text-base text-muted-foreground hover:text-foreground transition-colors py-2 px-3 rounded-md hover:bg-muted/50"
                onClick={() => setMobileMenuOpen(false)}
              >
                Docs
              </a>
            </nav>

            {/* Separator */}
            <div className="border-t border-border my-2" />

            {/* Mobile Wallet Section */}
            <div className="flex flex-col gap-2">
              {account ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-mono text-xs text-foreground hover:bg-orange-500 hover:text-white transition-colors relative group justify-start w-full"
                  onClick={() => {
                    handleDisconnect();
                    setMobileMenuOpen(false);
                  }}
                  disabled={isDisconnecting}
                >
                  <span className="group-hover:hidden inline">
                    {account.address.slice(0, 6)}...
                    {account.address.slice(-4)}
                  </span>
                  <span className="hidden group-hover:inline">Disconnect</span>
                </Button>
              ) : (
                <div className="[&>button]:!inline-flex [&>button]:!items-center [&>button]:!justify-center [&>button]:!gap-2 [&>button]:!rounded-md [&>button]:!bg-primary [&>button]:!px-4 [&>button]:!py-2 [&>button]:!text-sm [&>button]:!font-medium [&>button]:!text-white [&>button]:!shadow [&>button]:!transition-colors [&>button]:hover:!bg-primary/90 [&>button]:!h-10 [&>button]:!border-0 [&>button]:!cursor-pointer [&>button]:!font-sans [&>button]:!w-full">
                  <ConnectButton />
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
});


