import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import LandingNav from "@/components/landing/LandingNav";
import LandingHero from "@/components/landing/LandingHero";
import LandingCarousel from "@/components/landing/LandingCarousel";
import LandingFeatures from "@/components/landing/LandingFeatures";
import LandingAnalytics from "@/components/landing/LandingAnalytics";
import LandingCTA from "@/components/landing/LandingCTA";
import LandingFooter from "@/components/landing/LandingFooter";
import { useCurrentAccount } from "@mysten/dapp-kit";

export default function Landing() {
  const account = useCurrentAccount();
  const navigate = useNavigate();

  const handleGetStarted = useCallback(() => {
    if (account) {
      navigate("/dashboard");
    } else {
      // Trigger wallet connect via LandingNav
      const connectButton = document.querySelector('[data-testid="connect-button"]') as HTMLButtonElement;
      if (connectButton) {
        connectButton.click();
      }
    }
  }, [account, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <LandingNav />

      <LandingHero onGetStarted={handleGetStarted} />
      <LandingCarousel />

      <LandingFeatures />
      <LandingAnalytics />
      <LandingCTA onGetStarted={handleGetStarted} />
      <LandingFooter />
    </div>
  );
}
