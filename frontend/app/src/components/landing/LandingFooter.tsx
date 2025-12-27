import React from "react";
import AnimatedLogo from "@/components/AnimatedLogo";

export default React.memo(function LandingFooter() {
  return (
    <footer className="py-12 px-6 border-t border-border">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
          <div className="flex justify-start">
            <AnimatedLogo variant="footer" />
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Built with love by Olasoyin Miracle
          </p>

          <div className="flex justify-end">
            <p className="text-sm text-muted-foreground">
              © 2025 SuiAttend. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
});

