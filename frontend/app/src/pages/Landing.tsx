import React, { useCallback, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LandingNav from "@/components/landing/LandingNav";
import LandingHero from "@/components/landing/LandingHero";
import LandingCarousel from "@/components/landing/LandingCarousel";
import LandingFeatures from "@/components/landing/LandingFeatures";
import LandingAnalytics from "@/components/landing/LandingAnalytics";
import LandingCTA from "@/components/landing/LandingCTA";
import LandingFooter from "@/components/landing/LandingFooter";
import { useCurrentAccount, ConnectButton } from "@mysten/dapp-kit";

export default function Landing() {
  const account = useCurrentAccount();
  const navigate = useNavigate();
  const connectButtonRef = useRef<HTMLDivElement>(null);
  const [shouldRedirectAfterConnect, setShouldRedirectAfterConnect] = useState(false);

  const handleGetStarted = useCallback(() => {
    if (account) {
      // If wallet is connected, navigate to dashboard
      navigate("/dashboard");
    } else {
      // If wallet is not connected, trigger wallet connection dialog and set redirect flag
      setShouldRedirectAfterConnect(true);
      const button = connectButtonRef.current?.querySelector("button");
      if (button) {
        button.click();
      }
    }
  }, [account, navigate]);

  // Redirect after connect only if user clicked button
  useEffect(() => {
    if (account && shouldRedirectAfterConnect) {
      navigate("/dashboard");
      setShouldRedirectAfterConnect(false);
    }
  }, [account, shouldRedirectAfterConnect, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <LandingNav />

      {/* Hidden ConnectButton for programmatic triggering */}
      <div ref={connectButtonRef} className="hidden">
        <ConnectButton />
      </div>

      <LandingHero onGetStarted={handleGetStarted} />
      <LandingCarousel />

      <LandingFeatures />
      <LandingAnalytics />
      <LandingCTA onGetStarted={handleGetStarted} />
      <LandingFooter />
    </div>
  );
}
