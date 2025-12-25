import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Building2, 
  Users, 
  Zap, 
  ArrowRight,
  CheckCircle2,
  Wallet
} from "lucide-react";
import { useGlobalStats } from "@/hooks/use-global-stats";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentAccount, ConnectButton, useDisconnectWallet } from "@mysten/dapp-kit";
import { useRef, useState, useEffect } from "react";
import AnalyticsChart from "@/components/AnalyticsChart";
import SignalIcon from "@/components/SignalIcon";
import AnimatedLogo from "@/components/AnimatedLogo";

const features = [
  {
    icon: Building2,
    title: "Organisation Management",
    description: "Create and manage multiple organisations with subscription-based access control."
  },
  {
    icon: Users,
    title: "Student Registration",
    description: "Register students with RFID card IDs for seamless attendance tracking."
  },
  {
    icon: SignalIcon,
    title: "Blockchain Security",
    description: "All records are immutably stored on the Sui blockchain for transparency."
  },
  {
    icon: Zap,
    title: "Real-time Tracking",
    description: "Instant attendance recording with ESP32-powered RFID readers."
  }
];

const benefits = [
  "Immutable attendance records",
  "Decentralized data storage",
  "RFID-based check-in",
  "Real-time analytics",
  "Multi-organisation support",
  "Subscription management"
];

export default function Landing() {
  const { formattedStats, isLoading } = useGlobalStats();
  const account = useCurrentAccount();
  const navigate = useNavigate();
  const { mutate: disconnectWallet, isPending: isDisconnecting } = useDisconnectWallet();
  const connectButtonRef = useRef<HTMLDivElement>(null);
  const [shouldRedirectAfterConnect, setShouldRedirectAfterConnect] = useState(false);
  
  // Refs for slider
  const sliderTrackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleButtonClick = () => {
    if (account) {
      // Wallet already connected, navigate immediately
      navigate("/dashboard");
    } else {
      // Wallet not connected, mark that we should redirect after connection
      setShouldRedirectAfterConnect(true);
      // Trigger the hidden ConnectButton
      const button = connectButtonRef.current?.querySelector('button');
      if (button) {
        button.click();
      }
    }
  };

  // Only redirect after connection if user clicked a button
  useEffect(() => {
    if (account && shouldRedirectAfterConnect) {
      navigate("/dashboard");
      setShouldRedirectAfterConnect(false); // Reset flag
    }
  }, [account, shouldRedirectAfterConnect, navigate]);

  // Rolling depth effect for feature cards
  useEffect(() => {
    const updateCardScales = () => {
      if (!sliderTrackRef.current) return;
      
      const container = sliderTrackRef.current.parentElement;
      if (!container) return;
      
      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.left + containerRect.width / 2;
      
      // Get all card elements from the track
      const allCards = Array.from(sliderTrackRef.current.children) as HTMLElement[];
      
      allCards.forEach((card) => {
        if (!card) return;
        
        const cardRect = card.getBoundingClientRect();
        const cardCenter = cardRect.left + cardRect.width / 2;
        const distanceFromCenter = Math.abs(cardCenter - containerCenter);
        const maxDistance = containerRect.width / 2;
        const normalizedDistance = Math.min(distanceFromCenter / maxDistance, 1);
        
        // Scale: 1.0 at edges (distance = 1), 0.8 at center (distance = 0)
        // This creates the rolling effect where outer cards are bigger and inner cards are smaller
        const scale = 0.8 + (normalizedDistance * 0.2);
        
        // Apply transform with scale and maintain 3D
        card.style.transform = `translateZ(0) scale(${scale})`;
        card.style.transition = 'transform 0.15s ease-out';
      });
    };

    // Update scales on animation frame for smooth updates
    let animationFrameId: number;
    const animate = () => {
      updateCardScales();
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);
  
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <AnimatedLogo variant="default" />
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#benefits" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Benefits</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Docs</a>
            </div>
            
            {/* Hidden ConnectButton for programmatic triggering */}
            <div ref={connectButtonRef} className="hidden">
              <ConnectButton />
            </div>
            {/* Wallet button - shows Connect or Disconnect based on state */}
            {account ? (
              <Button 
                variant="ghost" 
                size="sm" 
                className="font-mono text-xs text-foreground hover:bg-orange-500 hover:text-white transition-colors relative group"
                onClick={() => {
                  if (account && !isDisconnecting) {
                    disconnectWallet();
                  }
                }}
                disabled={isDisconnecting}
              >
                <span className="group-hover:hidden inline">
                  {account.address.slice(0, 6)}...{account.address.slice(-4)}
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

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Background Image with Opacity Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 dark:opacity-20"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1753546466496-d2d8a819f61a?q=80&w=1920&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")',
            transform: 'scaleX(-1)', // Mirror effect
          }}
        />
        {/* Gradient overlay to maintain page colors */}
        <div className="absolute inset-0 bg-background/40 dark:bg-background/70" />
        
        <div className="mx-auto max-w-7xl relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            {/* Badge with fade-in animation */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5 text-sm text-muted-foreground animate-fade-in-up opacity-0" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
              Built on Sui Blockchain
            </div>
            
            {/* Heading with fade-in animation */}
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground mb-6 animate-fade-in-up opacity-0" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
              Blockchain-Powered{" "}
              <span className="text-primary">Attendance</span>{" "}
              Management
            </h1>
            
            {/* Description with fade-in animation */}
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in-up opacity-0" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
              A decentralized attendance system using ESP32 RFID readers and Sui blockchain. 
              Secure, transparent, and tamper-proof record keeping for institutions.
            </p>
            
            {/* Buttons with fade-in animation */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up opacity-0" style={{ animationDelay: '0.7s', animationFillMode: 'forwards' }}>
              <Button size="lg" onClick={handleButtonClick} className="w-full sm:w-auto">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
                <a href="https://github.com/Arewa100/esp32_sui_attendance" target="_blank" rel="noopener noreferrer">View Documentation</a>
              </Button>
            </div>
          </div>
          
          {/* Stats Section */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { value: isLoading ? "—" : formattedStats.organisations, label: "Organisations" },
              { value: isLoading ? "—" : formattedStats.students, label: "Students" },
              { value: isLoading ? "—" : formattedStats.records, label: "Records" },
              { value: isLoading ? "—" : formattedStats.uptime, label: "Uptime" }
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                {isLoading ? (
                  <Skeleton className="h-10 w-20 mx-auto mb-2" />
                ) : (
                  <div className="text-3xl md:text-4xl font-bold text-foreground">{stat.value}</div>
                )}
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-muted/50 overflow-hidden">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything you need
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete solution for managing attendance with blockchain technology
            </p>
          </div>
          
          {/* Sliding Carousel Container with 3D Perspective */}
          <div className="relative w-full overflow-hidden slider-perspective">
            {/* Gradient fade masks on edges */}
            <div className="absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none slider-fade-left" />
            <div className="absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none slider-fade-right" />
            
            {/* Sliding Track with 3D transforms and rolling effect */}
            <div 
              ref={sliderTrackRef}
              className="flex animate-slide-infinite gap-6" 
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* First Set */}
              {features.map((feature, index) => (
                <Card 
                  key={`first-${index}`}
                  ref={(el) => {
                    const cardIndex = index;
                    if (cardRefs.current[cardIndex] !== el) {
                      cardRefs.current[cardIndex] = el;
                    }
                  }}
                  className="border-border bg-card hover:shadow-lg transition-all duration-300 flex-shrink-0 w-[280px] md:w-[320px]"
                  style={{ 
                    backfaceVisibility: 'hidden',
                    willChange: 'transform',
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
              {/* Duplicate Set for Seamless Loop */}
              {features.map((feature, index) => (
                <Card 
                  key={`second-${index}`}
                  ref={(el) => {
                    const cardIndex = features.length + index;
                    if (cardRefs.current[cardIndex] !== el) {
                      cardRefs.current[cardIndex] = el;
                    }
                  }}
                  className="border-border bg-card hover:shadow-lg transition-all duration-300 flex-shrink-0 w-[280px] md:w-[320px]"
                  style={{ 
                    backfaceVisibility: 'hidden',
                    willChange: 'transform',
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Analytics Section */}
      <section id="benefits" className="py-20 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Real-Time System Analytics
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Track system growth and activity in real-time. See how organisations, students, and attendance records are growing on the Sui blockchain.
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <AnalyticsChart />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-primary/5">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ready to get started?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Connect your wallet and create your first organisation today.
          </p>
          <Button size="lg" variant="default" onClick={handleButtonClick}>
            Launch Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <AnimatedLogo variant="footer" />
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="https://github.com/Arewa100/esp32_sui_attendance" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Documentation</a>
              <a href="https://github.com/Arewa100/esp32_sui_attendance" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GitHub</a>
            </div>
            
            <p className="text-sm text-muted-foreground">
              © 2025 SuiAttend. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
