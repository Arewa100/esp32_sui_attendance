import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  Users, 
  Zap, 
  ArrowRight
} from "lucide-react";
import { useGlobalStats } from "@/hooks/use-global-stats";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentAccount, ConnectButton, useDisconnectWallet } from "@mysten/dapp-kit";
import { useRef, useState, useEffect } from "react";
import AnalyticsChart from "@/components/AnalyticsChart";
import SignalIcon from "@/components/SignalIcon";
import AnimatedLogo from "@/components/AnimatedLogo";
import { QRCodeSVG } from 'qrcode.react';

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


export default function Landing() {
  const { formattedStats, isLoading } = useGlobalStats();
  const account = useCurrentAccount();
  const navigate = useNavigate();
  const { mutate: disconnectWallet, isPending: isDisconnecting } = useDisconnectWallet();
  const connectButtonRef = useRef<HTMLDivElement>(null);
  const [shouldRedirectAfterConnect, setShouldRedirectAfterConnect] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('down');
  const lastScrollY = useRef(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const carouselSectionRef = useRef<HTMLDivElement>(null);
  const scrollVelocityRef = useRef(0);
  const lastScrollTimeRef = useRef(Date.now());
  const [animationDuration, setAnimationDuration] = useState(30); // Base duration in seconds
  const velocityHistoryRef = useRef<number[]>([]); // For smoothing
  const rafIdRef = useRef<number | null>(null);
  const targetDurationRef = useRef(30);
  const currentDurationRef = useRef(30);
  const scrollPositionRef = useRef(0);
  const baseAnimationSpeedRef = useRef(30); // Base animation duration when not scrolling
  
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


  // Track scroll direction and velocity for carousel with smooth interpolation
  useEffect(() => {
    const carouselSection = carouselSectionRef.current;
    if (!carouselSection) return;

    let isInView = false;

    // Check if carousel section is in viewport
    const checkInView = () => {
      const rect = carouselSection.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      isInView = rect.top < windowHeight && rect.bottom > 0;
      return isInView;
    };

    // Walrus-style mapping: scroll speed directly controls animation speed
    // Similar to data-marquee-scroll-speed="10" - animation speed = scroll speed * multiplier
    const mapVelocityToDuration = (velocity: number): number => {
      // Walrus approach: animation speed is directly proportional to scroll speed
      // Base duration when not scrolling (slower = longer duration)
      const baseDuration = 40;
      
      // FIXED: Reduced scroll speed multiplier from 6 to 3.5 for gentler, less sensitive response
      const scrollSpeedMultiplier = 3.5;
      
      // Calculate how scroll speed affects animation
      // Faster scroll = faster animation (shorter duration)
      // The multiplier determines the sensitivity
      
      // Normalize velocity to 0-1 range (based on typical scroll speeds)
      // Typical scroll: 50-500 px/s, fast scroll: 500-1500 px/s
      // FIXED: Reduced cap from 1.0 to 0.8 to prevent excessive speed changes
      const normalizedVelocity = Math.min(velocity / 800, 0.8);
      
      // Map to duration: faster scroll = shorter duration
      // Formula inspired by Walrus: duration decreases as scroll speed increases
      // The multiplier controls how responsive the animation is to scroll
      const speedFactor = 1 + (normalizedVelocity * scrollSpeedMultiplier / 15);
      const duration = baseDuration / speedFactor;
      
      // Clamp to reasonable bounds
      // FIXED: Increased minimum from 15 to 22 to prevent carousel from being too fast
      const minDuration = 22;
      const maxDuration = 50;
      
      return Math.max(minDuration, Math.min(maxDuration, duration));
    };

    // Smooth animation duration updates using requestAnimationFrame
    // Walrus-style smooth interpolation with easing
    const updateAnimationDuration = () => {
      const currentDuration = currentDurationRef.current;
      const targetDuration = targetDurationRef.current;
      
      // Smooth interpolation with easing - FIXED: increased from 0.08 to 0.18 for faster, smoother response
      const diff = targetDuration - currentDuration;
      if (Math.abs(diff) > 0.05) {
        // Use exponential easing with ease-out curve for smooth transitions
        // FIXED: Higher interpolation rate (0.18) for more responsive but still smooth transitions
        // Apply ease-out easing: faster at start, slower at end
        const easingFactor = 0.18;
        const newDuration = currentDuration + diff * easingFactor;
        currentDurationRef.current = newDuration;
        setAnimationDuration(newDuration);
        rafIdRef.current = requestAnimationFrame(updateAnimationDuration);
      } else {
        currentDurationRef.current = targetDuration;
        setAnimationDuration(targetDuration);
        rafIdRef.current = null;
      }
    };

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const currentTime = Date.now();
      const timeDelta = (currentTime - lastScrollTimeRef.current) / 1000; // Convert to seconds
      
      // Calculate scroll velocity (pixels per second)
      if (timeDelta > 0 && timeDelta < 0.5) { // Only calculate if time delta is reasonable
        const scrollDelta = Math.abs(currentScrollY - lastScrollY.current);
        const velocity = scrollDelta / timeDelta; // pixels per second
        
        // Add to velocity history for smoothing (keep last 10 measurements for better smoothing)
        velocityHistoryRef.current.push(velocity);
        if (velocityHistoryRef.current.length > 10) {
          velocityHistoryRef.current.shift();
        }
        
        // Calculate average velocity for smoother transitions
        const avgVelocity = velocityHistoryRef.current.reduce((a, b) => a + b, 0) / velocityHistoryRef.current.length;
        scrollVelocityRef.current = avgVelocity;
        
        // Only adjust speed when section is in view
        // FIXED: Increased threshold from 5 to 18 to ignore micro-scrolls and reduce sensitivity
        if (checkInView() && avgVelocity > 18) { // Only adjust if there's meaningful scroll
          // Calculate target duration using Walrus-style mapping
          const targetDuration = mapVelocityToDuration(avgVelocity);
          targetDurationRef.current = targetDuration;
          
          // Start smooth interpolation if not already running
          if (rafIdRef.current === null) {
            rafIdRef.current = requestAnimationFrame(updateAnimationDuration);
          }
        } else if (!isInView || avgVelocity <= 18) {
          // Reset to base speed when out of view or not scrolling
          // FIXED: Increased threshold from 5 to 18 to match the adjustment threshold
          targetDurationRef.current = baseAnimationSpeedRef.current;
          if (rafIdRef.current === null) {
            rafIdRef.current = requestAnimationFrame(updateAnimationDuration);
          }
        }
      }
      
      // Update direction
      if (currentScrollY > lastScrollY.current) {
        setScrollDirection('down');
      } else if (currentScrollY < lastScrollY.current) {
        setScrollDirection('up');
      }
      
      lastScrollY.current = currentScrollY;
      lastScrollTimeRef.current = currentTime;
    };

    // Initial check
    checkInView();

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
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

      {/* Who's Using SuiAttend Section - Infinite Logo Carousel */}
      <section ref={carouselSectionRef} className="py-20 px-6 bg-white overflow-hidden relative">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Who's using SuiAttend?
            </h2>
          </div>
          
          {/* Infinite Scrolling Carousel */}
          <div className="relative">
            {/* Scrolling container */}
            <div className="relative overflow-hidden group">
              <div 
                ref={carouselRef}
                className={`flex gap-4 items-center ${scrollDirection === 'up' ? 'animate-infinite-scroll-reverse' : 'animate-infinite-scroll'}`}
                style={{
                  '--animation-duration': `${animationDuration}s`,
                } as React.CSSProperties}
              >
                {/* First set of logos */}
                {[
                  { name: "Schools", icon: "🏫" },
                  { name: "Banks", icon: "🏦" },
                  { name: "Industries", icon: "🏭" },
                  { name: "Universities", icon: "🎓" },
                  { name: "Hospitals", icon: "🏥" },
                  { name: "Corporations", icon: "🏢" },
                  { name: "Government", icon: "🏛️" },
                  { name: "NGOs", icon: "🤝" },
                ].map((org, index) => (
                  <div
                    key={`first-${index}`}
                    className="flex-shrink-0 bg-white border border-gray-300 rounded-lg px-10 py-6 flex items-center justify-center grayscale h-28 min-w-[240px]"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-4xl">{org.icon}</span>
                      <span className="text-base font-semibold text-gray-900 whitespace-nowrap">{org.name}</span>
                    </div>
                  </div>
                ))}
                
                {/* Duplicate set for seamless loop */}
                {[
                  { name: "Schools", icon: "🏫" },
                  { name: "Banks", icon: "🏦" },
                  { name: "Industries", icon: "🏭" },
                  { name: "Universities", icon: "🎓" },
                  { name: "Hospitals", icon: "🏥" },
                  { name: "Corporations", icon: "🏢" },
                  { name: "Government", icon: "🏛️" },
                  { name: "NGOs", icon: "🤝" },
                ].map((org, index) => (
                  <div
                    key={`second-${index}`}
                    className="flex-shrink-0 bg-white border border-gray-300 rounded-lg px-10 py-6 flex items-center justify-center grayscale h-28 min-w-[240px]"
                    aria-hidden="true"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-4xl">{org.icon}</span>
                      <span className="text-base font-semibold text-gray-900 whitespace-nowrap">{org.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-[hsl(220,13%,9%)] overflow-hidden relative">
        {/* QR Code Background Pattern using qrcode.react - 12 QR codes */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none overflow-hidden">
          {/* Top-left QR Code - Primary Blue */}
          <div className="absolute top-0 left-0 w-64 h-64 -translate-x-1/2 -translate-y-1/2">
            <QRCodeSVG 
              value="https://github.com/Arewa100/esp32_sui_attendance"
              size={256}
              bgColor="transparent"
              fgColor="hsl(217, 91%, 60%)"
              level="L"
              includeMargin={false}
            />
          </div>
          
          {/* Top-center-left QR Code - Teal */}
          <div className="absolute top-10 left-1/4 w-48 h-48 rotate-[15deg]">
            <QRCodeSVG 
              value="https://github.com/Arewa100/esp32_sui_attendance"
              size={192}
              bgColor="transparent"
              fgColor="hsl(188, 94%, 43%)"
              level="L"
              includeMargin={false}
            />
          </div>
          
          {/* Top-center QR Code - Primary Blue */}
          <div className="absolute top-5 left-1/2 w-56 h-56 -translate-x-1/2 -rotate-12">
            <QRCodeSVG 
              value="https://github.com/Arewa100/esp32_sui_attendance"
              size={224}
              bgColor="transparent"
              fgColor="hsl(217, 91%, 60%)"
              level="L"
              includeMargin={false}
            />
          </div>
          
          {/* Top-right QR Code - Teal - Rotated */}
          <div className="absolute top-1/4 right-0 w-96 h-96 translate-x-1/3 rotate-12">
            <QRCodeSVG 
              value="https://github.com/Arewa100/esp32_sui_attendance"
              size={384}
              bgColor="transparent"
              fgColor="hsl(188, 94%, 43%)"
              level="L"
              includeMargin={false}
            />
          </div>
          
          {/* Middle-left QR Code - Teal */}
          <div className="absolute top-1/2 left-0 w-52 h-52 -translate-x-1/4 -translate-y-1/2 rotate-6">
            <QRCodeSVG 
              value="https://github.com/Arewa100/esp32_sui_attendance"
              size={208}
              bgColor="transparent"
              fgColor="hsl(188, 94%, 43%)"
              level="L"
              includeMargin={false}
            />
          </div>
          
          {/* Center QR Code - Primary Blue - 45deg rotation */}
          <div className="absolute top-1/2 left-1/2 w-80 h-80 -translate-x-1/2 -translate-y-1/2 rotate-45 opacity-50">
            <QRCodeSVG 
              value="https://github.com/Arewa100/esp32_sui_attendance"
              size={320}
              bgColor="transparent"
              fgColor="hsl(217, 91%, 60%)"
              level="L"
              includeMargin={false}
            />
          </div>
          
          {/* Middle-right QR Code - Primary Blue */}
          <div className="absolute top-1/2 right-0 w-60 h-60 translate-x-1/4 -translate-y-1/2 -rotate-[25deg]">
            <QRCodeSVG 
              value="https://github.com/Arewa100/esp32_sui_attendance"
              size={240}
              bgColor="transparent"
              fgColor="hsl(217, 91%, 60%)"
              level="L"
              includeMargin={false}
            />
          </div>
          
          {/* Bottom-left QR Code - Primary Blue - Slightly rotated */}
          <div className="absolute bottom-0 left-1/4 w-72 h-72 -translate-y-1/4 -rotate-6">
            <QRCodeSVG 
              value="https://github.com/Arewa100/esp32_sui_attendance"
              size={288}
              bgColor="transparent"
              fgColor="hsl(217, 91%, 60%)"
              level="L"
              includeMargin={false}
            />
          </div>
          
          {/* Bottom-center-left QR Code - Teal */}
          <div className="absolute bottom-10 left-1/3 w-44 h-44 rotate-[18deg]">
            <QRCodeSVG 
              value="https://github.com/Arewa100/esp32_sui_attendance"
              size={176}
              bgColor="transparent"
              fgColor="hsl(188, 94%, 43%)"
              level="L"
              includeMargin={false}
            />
          </div>
          
          {/* Bottom-center QR Code - Primary Blue */}
          <div className="absolute bottom-5 left-1/2 w-64 h-64 -translate-x-1/2 rotate-8">
            <QRCodeSVG 
              value="https://github.com/Arewa100/esp32_sui_attendance"
              size={256}
              bgColor="transparent"
              fgColor="hsl(217, 91%, 60%)"
              level="L"
              includeMargin={false}
            />
          </div>
          
          {/* Bottom-right QR Code - Teal */}
          <div className="absolute bottom-10 right-10 w-56 h-56 rotate-[20deg]">
            <QRCodeSVG 
              value="https://github.com/Arewa100/esp32_sui_attendance"
              size={224}
              bgColor="transparent"
              fgColor="hsl(188, 94%, 43%)"
              level="L"
              includeMargin={false}
            />
          </div>
          
          {/* Bottom-far-right QR Code - Primary Blue */}
          <div className="absolute bottom-1/4 right-0 w-52 h-52 translate-x-1/3 -rotate-[30deg]">
            <QRCodeSVG 
              value="https://github.com/Arewa100/esp32_sui_attendance"
              size={208}
              bgColor="transparent"
              fgColor="hsl(217, 91%, 60%)"
              level="L"
              includeMargin={false}
            />
          </div>
        </div>
        
        <div className="mx-auto max-w-7xl relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[hsl(220,14%,96%)] mb-4">
              Everything you need
            </h2>
            <p className="text-base text-[hsl(220,9%,55%)] max-w-2xl mx-auto">
              A complete solution for managing attendance with blockchain technology
            </p>
          </div>
          
          {/* Grid Layout with Chain Animation */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              // Define animation class based on card index
              // Card 0: bottom, Card 1: top, Card 2: bottom, Card 3: top
              const topGridClass = index === 1 ? 'card-1-top' : index === 3 ? 'card-3-top' : '';
              const bottomGridClass = index === 0 ? 'card-0-bottom' : index === 2 ? 'card-2-bottom' : '';
              const descriptionClass = `card-${index}-description`;
              
              return (
                <div 
                  key={index}
                  className="relative bg-[hsl(220,13%,9%)] border border-[hsl(220,13%,18%)] rounded-lg overflow-hidden group transition-all duration-300 flex flex-col"
                  style={{ minHeight: '20em' }}
                >
                  {/* Content Container */}
                  <div className="relative p-6 flex flex-col h-full">
                    {/* Top Section - Grid Blocks Row */}
                    <div className={`grid grid-cols-12 gap-px mb-3 ${topGridClass}`}>
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div 
                          key={`top-${i}`}
                          className={topGridClass ? `grid-box-animated grid-box-${i}` : 'h-4 bg-[hsl(220,14%,96%)]/5 group-hover:bg-[hsl(220,14%,96%)]/10 transition-colors'}
                        />
                      ))}
                    </div>

                    {/* Middle Section - Icon and Heading */}
                    <div className="flex items-center gap-3 mb-3 min-h-[60px]">
                      <div className="h-4 w-4 bg-blue-500 flex-shrink-0" />
                      <h3 className="text-base font-semibold text-[hsl(220,14%,96%)] whitespace-nowrap">
                        {feature.title}
                      </h3>
                    </div>

                    {/* Description between grids - NOW WITH ANIMATION */}
                    <div className="mb-4">
                      <p className={`text-base text-[hsl(220,9%,55%)] leading-relaxed ${descriptionClass}`}>
                        {feature.description}
                      </p>
                    </div>
                    
                    {/* Bottom Section - Grid Blocks Row */}
                    <div className={`grid grid-cols-12 gap-px mt-auto ${bottomGridClass}`}>
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div 
                          key={`bottom-${i}`}
                          className={bottomGridClass ? `grid-box-animated grid-box-${i}` : 'h-4 bg-[hsl(220,14%,96%)]/5 group-hover:bg-[hsl(220,14%,96%)]/10 transition-colors'}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
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