import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useGlobalStats } from "@/hooks/use-global-stats";

interface LandingHeroProps {
  onGetStarted: () => void;
}

export default React.memo(function LandingHero({ onGetStarted }: LandingHeroProps) {
  const { formattedStats, isLoading } = useGlobalStats();

  return (
    <section className="pt-32 pb-20 px-6 relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 dark:opacity-20"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1753546466496-d2d8a819f61a?q=80&w=1920&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")',
          transform: "scaleX(-1)"
        }}
      />
      <div className="absolute inset-0 bg-background/40 dark:bg-background/70" />

      <div className="mx-auto max-w-7xl relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <div
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5 text-sm text-muted-foreground animate-fade-in-up opacity-0"
            style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}
          >
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            Built on Sui Blockchain
          </div>

          <h1
            className="text-5xl md:text-6xl font-bold tracking-tight text-foreground mb-6 animate-fade-in-up opacity-0"
            style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}
          >
            Blockchain-Powered{" "}
            <span className="text-primary">Attendance</span>{" "}
            Management
          </h1>

          <p
            className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in-up opacity-0"
            style={{ animationDelay: "0.5s", animationFillMode: "forwards" }}
          >
            A decentralized attendance system using ESP32 RFID readers and Sui
            blockchain. Secure, transparent, and tamper-proof record keeping
            for institutions.
          </p>

          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up opacity-0"
            style={{ animationDelay: "0.7s", animationFillMode: "forwards" }}
          >
            <Button
              size="lg"
              onClick={onGetStarted}
              className="w-full sm:w-auto"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="w-full sm:w-auto"
            >
              <a
                href="https://github.com/Arewa100/esp32_sui_attendance"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Documentation
              </a>
            </Button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          {[
            {
              value: isLoading ? "—" : formattedStats.organisations,
              label: "Organisations"
            },
            {
              value: isLoading ? "—" : formattedStats.students,
              label: "Students"
            },
            {
              value: isLoading ? "—" : formattedStats.records,
              label: "Records"
            },
            {
              value: isLoading ? "—" : formattedStats.uptime,
              label: "Uptime"
            }
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              {isLoading ? (
                <Skeleton className="h-10 w-20 mx-auto mb-2" />
              ) : (
                <div className="text-3xl md:text-4xl font-bold text-foreground">
                  {stat.value}
                </div>
              )}
              <div className="text-sm text-muted-foreground mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

