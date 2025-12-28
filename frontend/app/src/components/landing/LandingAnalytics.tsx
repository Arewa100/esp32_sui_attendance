import React from "react";
import AnalyticsChart from "@/components/AnalyticsChart";
import GridCanvas from "@/components/GridCanvas";

export default React.memo(function LandingAnalytics() {
  return (
    <section id="benefits" className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 relative overflow-hidden bg-[hsl(220,13%,9%)]">
      {/* Grid Canvas Background */}
      <GridCanvas />
      
      <div className="mx-auto max-w-7xl relative z-10">
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[hsl(220,14%,96%)] mb-3 sm:mb-4 px-4">
            Real-time System Analytics
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-[hsl(220,9%,55%)] max-w-2xl mx-auto px-4">
            Track system growth and activity in real-time. See how
            organisations, students, and attendance records are growing on the
            Sui blockchain.
          </p>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-0">
          <AnalyticsChart />
        </div>
      </div>
    </section>
  );
});

