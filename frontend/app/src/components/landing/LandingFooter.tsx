import React from "react";
import AnimatedLogo from "@/components/AnimatedLogo";

export default React.memo(function LandingFooter() {
  return (
    <footer className="py-8 sm:py-10 md:py-12 px-4 sm:px-6 border-t border-border">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 sm:gap-6">
          {/* Logo - Centered on mobile, left-aligned on desktop */}
          <div className="flex justify-center md:justify-start">
            <AnimatedLogo variant="footer" />
          </div>

          {/* Built with love - Centered on all screens */}
          <p className="text-sm text-muted-foreground text-center">
            Built with love by Olasoyin Miracle
          </p>

          {/* Copyright - Centered on mobile, right-aligned on desktop */}
          <div className="flex justify-center md:justify-end">
            <p className="text-sm text-muted-foreground text-center md:text-right">
              © 2025 SuiAttend. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
});

