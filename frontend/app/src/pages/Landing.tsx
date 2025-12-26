// import { useNavigate } from "react-router-dom";
// import { Button } from "@/components/ui/button";
// import { 
//   Building2, 
//   Users, 
//   Zap, 
//   ArrowRight
// } from "lucide-react";
// import { useGlobalStats } from "@/hooks/use-global-stats";
// import { Skeleton } from "@/components/ui/skeleton";
// import { useCurrentAccount, ConnectButton, useDisconnectWallet } from "@mysten/dapp-kit";
// import { useRef, useState, useEffect } from "react";
// import AnalyticsChart from "@/components/AnalyticsChart";
// import SignalIcon from "@/components/SignalIcon";
// import AnimatedLogo from "@/components/AnimatedLogo";
// import { QRCodeSVG } from 'qrcode.react';

// const features = [
//   {
//     icon: Building2,
//     title: "Organisation Management",
//     description: "Create and manage multiple organisations with subscription-based access control."
//   },
//   {
//     icon: Users,
//     title: "Student Registration",
//     description: "Register students with RFID card IDs for seamless attendance tracking."
//   },
//   {
//     icon: SignalIcon,
//     title: "Blockchain Security",
//     description: "All records are immutably stored on the Sui blockchain for transparency."
//   },
//   {
//     icon: Zap,
//     title: "Real-time Tracking",
//     description: "Instant attendance recording with ESP32-powered RFID readers."
//   }
// ];


// export default function Landing() {
//   const { formattedStats, isLoading } = useGlobalStats();
//   const account = useCurrentAccount();
//   const navigate = useNavigate();
//   const { mutate: disconnectWallet, isPending: isDisconnecting } = useDisconnectWallet();
//   const connectButtonRef = useRef<HTMLDivElement>(null);
//   const [shouldRedirectAfterConnect, setShouldRedirectAfterConnect] = useState(false);
//   const [scrollDirection, setScrollDirection] = useState<'down' | 'up'>('down');
//   const lastScrollY = useRef(0);
//   const carouselRef = useRef<HTMLDivElement>(null);
//   const carouselSectionRef = useRef<HTMLDivElement>(null);
//   const scrollVelocityRef = useRef(0);
//   const lastScrollTimeRef = useRef(Date.now());
//   const [animationDuration, setAnimationDuration] = useState(30);
//   const velocityHistoryRef = useRef<number[]>([]);
//   const rafIdRef = useRef<number | null>(null);
//   const targetDurationRef = useRef(30);
//   const currentDurationRef = useRef(30);
//   const baseAnimationSpeedRef = useRef(30);
  
//   const handleButtonClick = () => {
//     if (account) {
//       // Wallet already connected, navigate immediately
//       navigate("/dashboard");
//     } else {
//       // Wallet not connected, mark that we should redirect after connection
//       setShouldRedirectAfterConnect(true);
//       // Trigger the hidden ConnectButton
//       const button = connectButtonRef.current?.querySelector('button');
//       if (button) {
//         button.click();
//       }
//     }
//   };

//   // Only redirect after connection if user clicked a button
//   useEffect(() => {
//     if (account && shouldRedirectAfterConnect) {
//       navigate("/dashboard");
//       setShouldRedirectAfterConnect(false); // Reset flag
//     }
//   }, [account, shouldRedirectAfterConnect, navigate]);


//   // Track scroll direction and velocity for carousel with smooth interpolation
//   useEffect(() => {
//     const carouselSection = carouselSectionRef.current;
//     if (!carouselSection) return;

//     let isInView = false;
//     let scrollMonitoringRaf: number | null = null;
//     let lastKnownScrollY = window.scrollY;
//     let lastKnownScrollTime = Date.now();
//     const scrollSamples: Array<{ time: number; scrollY: number }> = [];

//     // Check if carousel section is in viewport
//     const checkInView = () => {
//       const rect = carouselSection.getBoundingClientRect();
//       const windowHeight = window.innerHeight;
//       isInView = rect.top < windowHeight && rect.bottom > 0;
//       return isInView;
//     };

//     const mapVelocityToDuration = (velocity: number): number => {
//       const baseDuration = 40;
//       const scrollSpeedMultiplier = 2.5; // Reduced for gentler response
//       const normalizedVelocity = Math.min(velocity / 1000, 0.7); // Smoother cap
//       const speedFactor = 1 + (normalizedVelocity * scrollSpeedMultiplier / 15);
//       const duration = baseDuration / speedFactor;
      
//       const minDuration = 25;
//       const maxDuration = 50;
      
//       return Math.max(minDuration, Math.min(maxDuration, duration));
//     };

//     // Smooth animation duration updates using requestAnimationFrame
//     const updateAnimationDuration = () => {
//       const currentDuration = currentDurationRef.current;
//       const targetDuration = targetDurationRef.current;
      
//       const diff = targetDuration - currentDuration;
//       if (Math.abs(diff) > 0.1) {
//         const easingFactor = 0.12; // Smoother interpolation
//         const newDuration = currentDuration + diff * easingFactor;
//         currentDurationRef.current = newDuration;
//         setAnimationDuration(newDuration);
//         rafIdRef.current = requestAnimationFrame(updateAnimationDuration);
//       } else {
//         currentDurationRef.current = targetDuration;
//         setAnimationDuration(targetDuration);
//         rafIdRef.current = null;
//       }
//     };

//     // Continuous scroll monitoring that works with all input methods
//     const monitorScroll = () => {
//       const currentScrollY = window.scrollY;
//       const currentTime = Date.now();
      
//       // Always track scroll position changes, even tiny ones (important for touchpad)
//       if (currentScrollY !== lastKnownScrollY) {
//         // Add sample to history (keep last 10 samples)
//         scrollSamples.push({ time: currentTime, scrollY: currentScrollY });
//         if (scrollSamples.length > 10) {
//           scrollSamples.shift();
//         }
        
//         // Update direction based on actual scroll change
//         const scrollDelta = currentScrollY - lastKnownScrollY;
//         if (Math.abs(scrollDelta) > 0) {
//           setScrollDirection(scrollDelta > 0 ? 'down' : 'up');
//         }
        
//         lastKnownScrollY = currentScrollY;
//         lastKnownScrollTime = currentTime;
        
//         // Calculate velocity from recent samples
//         if (scrollSamples.length >= 2) {
//           const oldestSample = scrollSamples[0];
//           const newestSample = scrollSamples[scrollSamples.length - 1];
//           const timeSpan = (newestSample.time - oldestSample.time) / 1000; // in seconds
//           const scrollSpan = Math.abs(newestSample.scrollY - oldestSample.scrollY);
          
//           if (timeSpan > 0 && timeSpan < 1) { // Valid time window
//             const velocity = scrollSpan / timeSpan;
            
//             // Add to velocity history for smoothing
//             velocityHistoryRef.current.push(velocity);
//             if (velocityHistoryRef.current.length > 8) {
//               velocityHistoryRef.current.shift();
//             }
            
//             // Calculate average velocity
//             const avgVelocity = velocityHistoryRef.current.reduce((a, b) => a + b, 0) / velocityHistoryRef.current.length;
//             scrollVelocityRef.current = avgVelocity;
            
//             // Only adjust speed when section is in view
//             if (checkInView() && avgVelocity > 10) { // Lower threshold for better responsiveness
//               const targetDuration = mapVelocityToDuration(avgVelocity);
//               targetDurationRef.current = targetDuration;
              
//               // Start smooth interpolation if not already running
//               if (rafIdRef.current === null) {
//                 rafIdRef.current = requestAnimationFrame(updateAnimationDuration);
//               }
//             } else if (!isInView || avgVelocity <= 10) {
//               // Reset to base speed when out of view or not scrolling
//               targetDurationRef.current = baseAnimationSpeedRef.current;
//               if (rafIdRef.current === null) {
//                 rafIdRef.current = requestAnimationFrame(updateAnimationDuration);
//               }
//             }
//           }
//         }
//       } else {
//         // No scroll change detected - decay velocity gradually
//         const timeSinceLastScroll = (currentTime - lastKnownScrollTime) / 1000;
//         if (timeSinceLastScroll > 0.1 && velocityHistoryRef.current.length > 0) {
//           // Gradually reduce velocity when not scrolling
//           velocityHistoryRef.current = velocityHistoryRef.current.map(v => v * 0.9);
//           if (velocityHistoryRef.current.every(v => v < 10)) {
//             velocityHistoryRef.current = [];
//             if (checkInView()) {
//               targetDurationRef.current = baseAnimationSpeedRef.current;
//               if (rafIdRef.current === null) {
//                 rafIdRef.current = requestAnimationFrame(updateAnimationDuration);
//               }
//             }
//           }
//         }
//       }
      
//       // Continue monitoring
//       scrollMonitoringRaf = requestAnimationFrame(monitorScroll);
//     };

//     // Handle scroll events (works for mouse wheel, touchpad, touch swipe)
//     // This ensures we capture scroll events immediately for all input methods
//     const handleScroll = () => {
//       const currentScrollY = window.scrollY;
//       const currentTime = Date.now();
      
//       // Update tracking variables immediately for accurate tracking
//       lastScrollY.current = currentScrollY;
//       lastScrollTimeRef.current = currentTime;
//       // Also update local variables so monitorScroll can detect changes
//       lastKnownScrollY = currentScrollY;
//       lastKnownScrollTime = currentTime;
//     };

//     // Initial check
//     checkInView();
    
//     // Start continuous monitoring
//     scrollMonitoringRaf = requestAnimationFrame(monitorScroll);

//     // Listen to scroll events (supports mouse wheel, touchpad, touch swipe)
//     window.addEventListener('scroll', handleScroll, { passive: true });
//     // Also listen to wheel events for better touchpad support
//     window.addEventListener('wheel', handleScroll, { passive: true });
    
//     return () => {
//       window.removeEventListener('scroll', handleScroll);
//       window.removeEventListener('wheel', handleScroll);
//       if (rafIdRef.current !== null) {
//         cancelAnimationFrame(rafIdRef.current);
//       }
//       if (scrollMonitoringRaf !== null) {
//         cancelAnimationFrame(scrollMonitoringRaf);
//       }
//     };
//   }, []);


//   return (
//     <div className="min-h-screen bg-background">
//       {/* Navigation */}
//       <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
//         <div className="mx-auto max-w-7xl px-6 py-4">
//           <div className="flex items-center justify-between">
//             <AnimatedLogo variant="default" />
            
//             <div className="hidden md:flex items-center gap-8">
//               <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
//               <a href="#benefits" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Benefits</a>
//               <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Docs</a>
//             </div>
            
//             {/* Hidden ConnectButton for programmatic triggering */}
//             <div ref={connectButtonRef} className="hidden">
//               <ConnectButton />
//             </div>
//             {/* Wallet button - shows Connect or Disconnect based on state */}
//             {account ? (
//               <Button 
//                 variant="ghost" 
//                 size="sm" 
//                 className="font-mono text-xs text-foreground hover:bg-orange-500 hover:text-white transition-colors relative group"
//                 onClick={() => {
//                   if (account && !isDisconnecting) {
//                     disconnectWallet();
//                   }
//                 }}
//                 disabled={isDisconnecting}
//               >
//                 <span className="group-hover:hidden inline">
//                   {account.address.slice(0, 6)}...{account.address.slice(-4)}
//                 </span>
//                 <span className="hidden group-hover:inline">Disconnect</span>
//               </Button>
//             ) : (
//               <div className="[&>button]:!inline-flex [&>button]:!items-center [&>button]:!justify-center [&>button]:!gap-2 [&>button]:!rounded-md [&>button]:!bg-primary [&>button]:!px-4 [&>button]:!py-2 [&>button]:!text-sm [&>button]:!font-medium [&>button]:!text-white [&>button]:!shadow [&>button]:!transition-colors [&>button]:hover:!bg-primary/90 [&>button]:!h-10 [&>button]:!border-0 [&>button]:!cursor-pointer [&>button]:!font-sans">
//                 <ConnectButton />
//               </div>
//             )}
//           </div>
//         </div>
//       </nav>

//       {/* Hero Section */}
//       <section className="pt-32 pb-20 px-6 relative overflow-hidden">
//         {/* Background Image with Opacity Overlay */}
//         <div 
//           className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 dark:opacity-20"
//           style={{
//             backgroundImage: 'url("https://images.unsplash.com/photo-1753546466496-d2d8a819f61a?q=80&w=1920&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")',
//             transform: 'scaleX(-1)', // Mirror effect
//           }}
//         />
//         {/* Gradient overlay to maintain page colors */}
//         <div className="absolute inset-0 bg-background/40 dark:bg-background/70" />
        
//         <div className="mx-auto max-w-7xl relative z-10">
//           <div className="mx-auto max-w-3xl text-center">
//             {/* Badge with fade-in animation */}
//             <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5 text-sm text-muted-foreground animate-fade-in-up opacity-0" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
//               <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
//               Built on Sui Blockchain
//             </div>
            
//             {/* Heading with fade-in animation */}
//             <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground mb-6 animate-fade-in-up opacity-0" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
//               Blockchain-Powered{" "}
//               <span className="text-primary">Attendance</span>{" "}
//               Management
//             </h1>
            
//             {/* Description with fade-in animation */}
//             <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in-up opacity-0" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
//               A decentralized attendance system using ESP32 RFID readers and Sui blockchain. 
//               Secure, transparent, and tamper-proof record keeping for institutions.
//             </p>
            
//             {/* Buttons with fade-in animation */}
//             <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up opacity-0" style={{ animationDelay: '0.7s', animationFillMode: 'forwards' }}>
//               <Button size="lg" onClick={handleButtonClick} className="w-full sm:w-auto">
//                 Get Started
//                 <ArrowRight className="ml-2 h-4 w-4" />
//               </Button>
//               <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
//                 <a href="https://github.com/Arewa100/esp32_sui_attendance" target="_blank" rel="noopener noreferrer">View Documentation</a>
//               </Button>
//             </div>
//           </div>
          
//           {/* Stats Section */}
//           <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
//             {[
//               { value: isLoading ? "—" : formattedStats.organisations, label: "Organisations" },
//               { value: isLoading ? "—" : formattedStats.students, label: "Students" },
//               { value: isLoading ? "—" : formattedStats.records, label: "Records" },
//               { value: isLoading ? "—" : formattedStats.uptime, label: "Uptime" }
//             ].map((stat) => (
//               <div key={stat.label} className="text-center">
//                 {isLoading ? (
//                   <Skeleton className="h-10 w-20 mx-auto mb-2" />
//                 ) : (
//                   <div className="text-3xl md:text-4xl font-bold text-foreground">{stat.value}</div>
//                 )}
//                 <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Who's Using SuiAttend Section - Infinite Logo Carousel */}
//       <section ref={carouselSectionRef} className="py-20 px-6 bg-white overflow-hidden relative">
//         <div className="mx-auto max-w-7xl">
//           <div className="text-center mb-12">
//             <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
//               Who's using SuiAttend?
//             </h2>
//           </div>
          
//           {/* Infinite Scrolling Carousel */}
//           <div className="relative">
//             {/* Scrolling container */}
//             <div className="relative overflow-hidden">
//               <div 
//                 ref={carouselRef}
//                 className={`flex gap-4 items-center ${scrollDirection === 'up' ? 'animate-infinite-scroll-reverse' : 'animate-infinite-scroll'}`}
//                 style={{
//                   '--animation-duration': `${animationDuration}s`,
//                 } as React.CSSProperties}
//               >
//                 {/* First set of logos */}
//                 {[
//                   { name: "Schools", icon: "🏫" },
//                   { name: "Banks", icon: "🏦" },
//                   { name: "Industries", icon: "🏭" },
//                   { name: "Universities", icon: "🎓" },
//                   { name: "Hospitals", icon: "🏥" },
//                   { name: "Corporations", icon: "🏢" },
//                   { name: "Government", icon: "🏛️" },
//                   { name: "NGOs", icon: "🤝" },
//                 ].map((org, index) => (
//                   <div
//                     key={`first-${index}`}
//                     className="flex-shrink-0 bg-white border border-gray-300 rounded-lg px-10 py-6 flex items-center justify-center grayscale h-28 min-w-[240px]"
//                   >
//                     <div className="flex items-center gap-4">
//                       <span className="text-4xl">{org.icon}</span>
//                       <span className="text-base font-semibold text-gray-900 whitespace-nowrap">{org.name}</span>
//                     </div>
//                   </div>
//                 ))}
                
//                 {/* Duplicate set for seamless loop */}
//                 {[
//                   { name: "Schools", icon: "🏫" },
//                   { name: "Banks", icon: "🏦" },
//                   { name: "Industries", icon: "🏭" },
//                   { name: "Universities", icon: "🎓" },
//                   { name: "Hospitals", icon: "🏥" },
//                   { name: "Corporations", icon: "🏢" },
//                   { name: "Government", icon: "🏛️" },
//                   { name: "NGOs", icon: "🤝" },
//                 ].map((org, index) => (
//                   <div
//                     key={`second-${index}`}
//                     className="flex-shrink-0 bg-white border border-gray-300 rounded-lg px-10 py-6 flex items-center justify-center grayscale h-28 min-w-[240px]"
//                     aria-hidden="true"
//                   >
//                     <div className="flex items-center gap-4">
//                       <span className="text-4xl">{org.icon}</span>
//                       <span className="text-base font-semibold text-gray-900 whitespace-nowrap">{org.name}</span>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Features Section */}
//       <section id="features" className="py-20 px-6 bg-[hsl(220,13%,9%)] overflow-hidden relative">
//         {/* QR Code Background Pattern using qrcode.react - 12 QR codes */}
//         <div className="absolute inset-0 opacity-[0.04] pointer-events-none overflow-hidden">
//           {/* Top-left QR Code - Primary Blue */}
//           <div className="absolute top-0 left-0 w-64 h-64 -translate-x-1/2 -translate-y-1/2">
//             <QRCodeSVG 
//               value="https://github.com/Arewa100/esp32_sui_attendance"
//               size={256}
//               bgColor="transparent"
//               fgColor="hsl(217, 91%, 60%)"
//               level="L"
//               includeMargin={false}
//             />
//           </div>
          
//           {/* Top-center-left QR Code - Teal */}
//           <div className="absolute top-10 left-1/4 w-48 h-48 rotate-[15deg]">
//             <QRCodeSVG 
//               value="https://github.com/Arewa100/esp32_sui_attendance"
//               size={192}
//               bgColor="transparent"
//               fgColor="hsl(188, 94%, 43%)"
//               level="L"
//               includeMargin={false}
//             />
//           </div>
          
//           {/* Top-center QR Code - Primary Blue */}
//           <div className="absolute top-5 left-1/2 w-56 h-56 -translate-x-1/2 -rotate-12">
//             <QRCodeSVG 
//               value="https://github.com/Arewa100/esp32_sui_attendance"
//               size={224}
//               bgColor="transparent"
//               fgColor="hsl(217, 91%, 60%)"
//               level="L"
//               includeMargin={false}
//             />
//           </div>
          
//           {/* Top-right QR Code - Teal - Rotated */}
//           <div className="absolute top-1/4 right-0 w-96 h-96 translate-x-1/3 rotate-12">
//             <QRCodeSVG 
//               value="https://github.com/Arewa100/esp32_sui_attendance"
//               size={384}
//               bgColor="transparent"
//               fgColor="hsl(188, 94%, 43%)"
//               level="L"
//               includeMargin={false}
//             />
//           </div>
          
//           {/* Middle-left QR Code - Teal */}
//           <div className="absolute top-1/2 left-0 w-52 h-52 -translate-x-1/4 -translate-y-1/2 rotate-6">
//             <QRCodeSVG 
//               value="https://github.com/Arewa100/esp32_sui_attendance"
//               size={208}
//               bgColor="transparent"
//               fgColor="hsl(188, 94%, 43%)"
//               level="L"
//               includeMargin={false}
//             />
//           </div>
          
//           {/* Center QR Code - Primary Blue - 45deg rotation */}
//           <div className="absolute top-1/2 left-1/2 w-80 h-80 -translate-x-1/2 -translate-y-1/2 rotate-45 opacity-50">
//             <QRCodeSVG 
//               value="https://github.com/Arewa100/esp32_sui_attendance"
//               size={320}
//               bgColor="transparent"
//               fgColor="hsl(217, 91%, 60%)"
//               level="L"
//               includeMargin={false}
//             />
//           </div>
          
//           {/* Middle-right QR Code - Primary Blue */}
//           <div className="absolute top-1/2 right-0 w-60 h-60 translate-x-1/4 -translate-y-1/2 -rotate-[25deg]">
//             <QRCodeSVG 
//               value="https://github.com/Arewa100/esp32_sui_attendance"
//               size={240}
//               bgColor="transparent"
//               fgColor="hsl(217, 91%, 60%)"
//               level="L"
//               includeMargin={false}
//             />
//           </div>
          
//           {/* Bottom-left QR Code - Primary Blue - Slightly rotated */}
//           <div className="absolute bottom-0 left-1/4 w-72 h-72 -translate-y-1/4 -rotate-6">
//             <QRCodeSVG 
//               value="https://github.com/Arewa100/esp32_sui_attendance"
//               size={288}
//               bgColor="transparent"
//               fgColor="hsl(217, 91%, 60%)"
//               level="L"
//               includeMargin={false}
//             />
//           </div>
          
//           {/* Bottom-center-left QR Code - Teal */}
//           <div className="absolute bottom-10 left-1/3 w-44 h-44 rotate-[18deg]">
//             <QRCodeSVG 
//               value="https://github.com/Arewa100/esp32_sui_attendance"
//               size={176}
//               bgColor="transparent"
//               fgColor="hsl(188, 94%, 43%)"
//               level="L"
//               includeMargin={false}
//             />
//           </div>
          
//           {/* Bottom-center QR Code - Primary Blue */}
//           <div className="absolute bottom-5 left-1/2 w-64 h-64 -translate-x-1/2 rotate-8">
//             <QRCodeSVG 
//               value="https://github.com/Arewa100/esp32_sui_attendance"
//               size={256}
//               bgColor="transparent"
//               fgColor="hsl(217, 91%, 60%)"
//               level="L"
//               includeMargin={false}
//             />
//           </div>
          
//           {/* Bottom-right QR Code - Teal */}
//           <div className="absolute bottom-10 right-10 w-56 h-56 rotate-[20deg]">
//             <QRCodeSVG 
//               value="https://github.com/Arewa100/esp32_sui_attendance"
//               size={224}
//               bgColor="transparent"
//               fgColor="hsl(188, 94%, 43%)"
//               level="L"
//               includeMargin={false}
//             />
//           </div>
          
//           {/* Bottom-far-right QR Code - Primary Blue */}
//           <div className="absolute bottom-1/4 right-0 w-52 h-52 translate-x-1/3 -rotate-[30deg]">
//             <QRCodeSVG 
//               value="https://github.com/Arewa100/esp32_sui_attendance"
//               size={208}
//               bgColor="transparent"
//               fgColor="hsl(217, 91%, 60%)"
//               level="L"
//               includeMargin={false}
//             />
//           </div>
//         </div>
        
//         <div className="mx-auto max-w-7xl relative z-10">
//           <div className="text-center mb-16">
//             <h2 className="text-3xl md:text-4xl font-bold text-[hsl(220,14%,96%)] mb-4">
//               Everything you need
//             </h2>
//             <p className="text-base text-[hsl(220,9%,55%)] max-w-2xl mx-auto">
//               A complete solution for managing attendance with blockchain technology
//             </p>
//           </div>
          
//           {/* Grid Layout with Chain Animation */}
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//             {features.map((feature, index) => {
//               // Define animation class based on card index
//               // Card 0: bottom, Card 1: top, Card 2: bottom, Card 3: top
//               const topGridClass = index === 1 ? 'card-1-top' : index === 3 ? 'card-3-top' : '';
//               const bottomGridClass = index === 0 ? 'card-0-bottom' : index === 2 ? 'card-2-bottom' : '';
//               const descriptionClass = `card-${index}-description`;
              
//               return (
//                 <div 
//                   key={index}
//                   className="relative bg-[hsl(220,13%,9%)] border border-[hsl(220,13%,18%)] rounded-lg overflow-hidden group transition-all duration-300 flex flex-col"
//                   style={{ minHeight: '20em' }}
//                 >
//                   {/* Content Container */}
//                   <div className="relative p-6 flex flex-col h-full">
//                     {/* Top Section - Grid Blocks Row */}
//                     <div className={`grid grid-cols-12 gap-px mb-3 ${topGridClass}`}>
//                       {Array.from({ length: 12 }).map((_, i) => (
//                         <div 
//                           key={`top-${i}`}
//                           className={topGridClass ? `grid-box-animated grid-box-${i}` : 'h-4 bg-[hsl(220,14%,96%)]/5 group-hover:bg-[hsl(220,14%,96%)]/10 transition-colors'}
//                         />
//                       ))}
//                     </div>

//                     {/* Middle Section - Icon and Heading */}
//                     <div className="flex items-center gap-3 mb-3 min-h-[60px]">
//                       <div className="h-4 w-4 bg-blue-500 flex-shrink-0" />
//                       <h3 className="text-base font-semibold text-[hsl(220,14%,96%)] whitespace-nowrap">
//                         {feature.title}
//                       </h3>
//                     </div>

//                     {/* Description between grids - NOW WITH ANIMATION */}
//                     <div className="mb-4">
//                       <p className={`text-base text-[hsl(220,9%,55%)] leading-relaxed ${descriptionClass}`}>
//                         {feature.description}
//                       </p>
//                     </div>
                    
//                     {/* Bottom Section - Grid Blocks Row */}
//                     <div className={`grid grid-cols-12 gap-px mt-auto ${bottomGridClass}`}>
//                       {Array.from({ length: 12 }).map((_, i) => (
//                         <div 
//                           key={`bottom-${i}`}
//                           className={bottomGridClass ? `grid-box-animated grid-box-${i}` : 'h-4 bg-[hsl(220,14%,96%)]/5 group-hover:bg-[hsl(220,14%,96%)]/10 transition-colors'}
//                         />
//                       ))}
//                     </div>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//       </section>

//       {/* Analytics Section */}
//       <section id="benefits" className="py-20 px-6">
//         <div className="mx-auto max-w-7xl">
//           <div className="text-center mb-12">
//             <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
//               Real-Time System Analytics
//             </h2>
//             <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
//               Track system growth and activity in real-time. See how organisations, students, and attendance records are growing on the Sui blockchain.
//             </p>
//           </div>
          
//           <div className="max-w-4xl mx-auto">
//             <AnalyticsChart />
//           </div>
//         </div>
//       </section>

//       {/* CTA Section */}
//       <section className="py-20 px-6 bg-primary/5">
//         <div className="mx-auto max-w-4xl text-center">
//           <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
//             Ready to get started?
//           </h2>
//           <p className="text-lg text-muted-foreground mb-8">
//             Connect your wallet and create your first organisation today.
//           </p>
//           <Button size="lg" variant="default" onClick={handleButtonClick}>
//             Launch Dashboard
//             <ArrowRight className="ml-2 h-4 w-4" />
//           </Button>
//         </div>
//       </section>

//       {/* Footer */}
//       <footer className="py-12 px-6 border-t border-border">
//         <div className="mx-auto max-w-7xl">
//           <div className="flex flex-col md:flex-row items-center justify-between gap-4">
//             <AnimatedLogo variant="footer" />
            
//             <div className="flex items-center gap-6 text-sm text-muted-foreground">
//               <a href="https://github.com/Arewa100/esp32_sui_attendance" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Documentation</a>
//               <a href="https://github.com/Arewa100/esp32_sui_attendance" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GitHub</a>
//             </div>
            
//             <p className="text-sm text-muted-foreground">
//               © 2025 SuiAttend. All rights reserved.
//             </p>
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// }

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
import {
  useCurrentAccount,
  ConnectButton,
  useDisconnectWallet
} from "@mysten/dapp-kit";
import React, { useRef, useState, useEffect } from "react";
import AnalyticsChart from "@/components/AnalyticsChart";
import SignalIcon from "@/components/SignalIcon";
import AnimatedLogo from "@/components/AnimatedLogo";
import { QRCodeSVG } from "qrcode.react";

const features = [
  {
    icon: Building2,
    title: "Organisation Management",
    description:
      "Create and manage multiple organisations with subscription-based access control."
  },
  {
    icon: Users,
    title: "Student Registration",
    description:
      "Register students with RFID card IDs for seamless attendance tracking."
  },
  {
    icon: SignalIcon,
    title: "Blockchain Security",
    description:
      "All records are immutably stored on the Sui blockchain for transparency."
  },
  {
    icon: Zap,
    title: "Real-time Tracking",
    description:
      "Instant attendance recording with ESP32-powered RFID readers."
  }
];

export default function Landing() {
  const { formattedStats, isLoading } = useGlobalStats();
  const account = useCurrentAccount();
  const navigate = useNavigate();
  const { mutate: disconnectWallet, isPending: isDisconnecting } =
    useDisconnectWallet();
  const connectButtonRef = useRef<HTMLDivElement>(null);
  const [shouldRedirectAfterConnect, setShouldRedirectAfterConnect] =
    useState(false);

  // Carousel refs and scroll tracking
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const carouselSectionRef = useRef<HTMLDivElement | null>(null);
  const scrollVelocityRef = useRef(0); // px/s
  const lastScrollY = useRef(window.scrollY);
  const lastScrollTime = useRef(Date.now());
  const scrollSamples = useRef<Array<{ time: number; scrollY: number }>>([]);
  const animationRafId = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number | null>(null);
  const positionX = useRef(0);

  const handleButtonClick = () => {
    if (account) {
      navigate("/dashboard");
    } else {
      setShouldRedirectAfterConnect(true);
      const button = connectButtonRef.current?.querySelector("button");
      if (button) {
        button.click();
      }
    }
  };

  // Redirect after connect only if user clicked button
  useEffect(() => {
    if (account && shouldRedirectAfterConnect) {
      navigate("/dashboard");
      setShouldRedirectAfterConnect(false);
    }
  }, [account, shouldRedirectAfterConnect, navigate]);

  // Scroll-controlled carousel: responds to page scroll (mouse, touchpad, swipe)
  useEffect(() => {
    const el = carouselRef.current;
    const section = carouselSectionRef.current;
    if (!el || !section) return;

    let isInView = false;

    // Check if carousel section is in viewport
    const checkInView = () => {
      const rect = section.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      isInView = rect.top < windowHeight && rect.bottom > 0;
      return isInView;
    };

    // Base auto-scroll speed (always moving when not actively scrolling)
    const BASE_AUTO_SCROLL_SPEED = 60; // px/s (will be negative or positive based on direction)
    let currentScrollDirection = -1; // -1 = left (down scroll default), 1 = right (up scroll)
    
    // Map scroll velocity to carousel speed (pixels per second)
    const mapScrollVelocityToCarouselSpeed = (scrollVelocity: number): number => {
      // Direct mapping: faster scroll = faster carousel
      // Scale factor to match scroll speed to carousel speed
      const SPEED_SCALE = 0.5; // Adjust this to control sensitivity
      const MIN_SPEED = 30; // Minimum speed to keep it moving
      const MAX_SPEED = 400; // Maximum carousel speed in px/s
      
      // Determine direction based on scroll direction
      // scrollVelocity > 0 means scrolling down -> carousel moves left (negative)
      // scrollVelocity < 0 means scrolling up -> carousel moves right (positive)
      if (scrollVelocity > 10) { // Threshold to avoid jitter
        currentScrollDirection = -1; // Scroll down -> move left
      } else if (scrollVelocity < -10) { // Threshold to avoid jitter
        currentScrollDirection = 1; // Scroll up -> move right
      }
      
      let carouselSpeed = Math.abs(scrollVelocity) * SPEED_SCALE;
      carouselSpeed = Math.max(MIN_SPEED, Math.min(MAX_SPEED, carouselSpeed));
      
      // Return speed with direction applied
      return carouselSpeed * currentScrollDirection;
    };

    // Animation loop that moves the carousel
    const animate = (currentTime: number) => {
      if (!lastFrameTimeRef.current) {
        lastFrameTimeRef.current = currentTime;
      }
      
      const dt = (currentTime - lastFrameTimeRef.current) / 1000; // Delta time in seconds
      lastFrameTimeRef.current = currentTime;

      // Always animate when section is in view (carousel always moves)
      if (isInView) {
        // Update position based on current velocity
        positionX.current += scrollVelocityRef.current * dt;

        const contentWidth = el.scrollWidth / 2;

        // Handle seamless looping
        if (positionX.current <= -contentWidth) {
          positionX.current += contentWidth;
        } else if (positionX.current >= 0) {
          positionX.current -= contentWidth;
        }

        el.style.transform = `translate3d(${positionX.current}px, 0, 0)`;
        
        // Always continue animation when in view
        animationRafId.current = requestAnimationFrame(animate);
      } else {
        // Section not in view, stop animation
        lastFrameTimeRef.current = null;
        animationRafId.current = null;
      }

      // Decay velocity back to base speed (maintaining direction) when not actively scrolling
      const currentSpeed = Math.abs(scrollVelocityRef.current);
      const baseSpeedWithDirection = BASE_AUTO_SCROLL_SPEED * currentScrollDirection;
      
      if (currentSpeed > BASE_AUTO_SCROLL_SPEED + 5) {
        // Gradually decay towards base speed while maintaining direction
        scrollVelocityRef.current = scrollVelocityRef.current * 0.95;
      } else {
        // Settle to base speed with current direction
        scrollVelocityRef.current = baseSpeedWithDirection;
      }
    };

    // Handle scroll events (works for mouse wheel, touchpad, touch swipe, scrollbar)
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const currentTime = Date.now();
      const timeDelta = (currentTime - lastScrollTime.current) / 1000; // Convert to seconds

      // Update scroll samples for velocity calculation
      scrollSamples.current.push({ time: currentTime, scrollY: currentScrollY });
      if (scrollSamples.current.length > 10) {
        scrollSamples.current.shift();
      }

      // Calculate scroll velocity from recent samples
      if (scrollSamples.current.length >= 2 && timeDelta > 0 && timeDelta < 1) {
        const scrollDelta = currentScrollY - lastScrollY.current;
        
        // Calculate velocity from sample window
        const oldestSample = scrollSamples.current[0];
        const newestSample = scrollSamples.current[scrollSamples.current.length - 1];
        const timeSpan = (newestSample.time - oldestSample.time) / 1000;
        const scrollSpan = newestSample.scrollY - oldestSample.scrollY;
        
        if (timeSpan > 0) {
          const scrollVelocity = scrollSpan / timeSpan;
          
          // Check if section is in view before applying velocity
          checkInView();
          
          if (isInView) {
            // Map scroll velocity to carousel speed
            scrollVelocityRef.current = mapScrollVelocityToCarouselSpeed(scrollVelocity);
            
            // Start animation loop if not already running
            if (animationRafId.current === null) {
              lastFrameTimeRef.current = null;
              animationRafId.current = requestAnimationFrame(animate);
            }
          }
        }
      }

      lastScrollY.current = currentScrollY;
      lastScrollTime.current = currentTime;
    };

    // Initialize with base auto-scroll speed (default left direction)
    scrollVelocityRef.current = BASE_AUTO_SCROLL_SPEED * currentScrollDirection;
    
    // Initial viewport check
    checkInView();
    
    // Start animation loop if section is in view
    if (isInView && animationRafId.current === null) {
      lastFrameTimeRef.current = null;
      animationRafId.current = requestAnimationFrame(animate);
    }

    // Listen to scroll events (supports all scroll methods: mouse, touchpad, swipe, scrollbar)
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Also listen to wheel events for immediate response during active scrolling
    window.addEventListener('wheel', handleScroll, { passive: true });
    
    // Also check viewport periodically to start/stop animation
    const viewportCheckInterval = setInterval(() => {
      const wasInView = isInView;
      checkInView();
      if (isInView && !wasInView && animationRafId.current === null) {
        // Just entered viewport, start animation
        scrollVelocityRef.current = BASE_AUTO_SCROLL_SPEED;
        lastFrameTimeRef.current = null;
        animationRafId.current = requestAnimationFrame(animate);
      }
    }, 100);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('wheel', handleScroll);
      clearInterval(viewportCheckInterval);
      if (animationRafId.current !== null) {
        cancelAnimationFrame(animationRafId.current);
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
              <a
                href="#features"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </a>
              <a
                href="#benefits"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
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
                onClick={() => {
                  if (account && !isDisconnecting) {
                    disconnectWallet();
                  }
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
              <div className="[&>button]:!inline-flex [&>button]:!items-center [&>button]:!justify-center [&>button]:!gap-2 [&>button]:!rounded-md [&>button]:!bg-primary [&>button]:!px-4 [&>button]:!py-2 [&>button]:!text-sm [&>button]:!font-medium [&>button]:!text-white [&>button]:!shadow [&>button]:!transition-colors [&>button]:hover:!bg-primary/90 [&>button]:!h-10 [&>button]:!border-0 [&>button]:!cursor-pointer [&>button]:!font-sans">
                <ConnectButton />
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
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
                onClick={handleButtonClick}
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

      {/* Who's Using SuiAttend Section - Scroll-driven Carousel */}
      <section ref={carouselSectionRef} className="py-20 px-6 bg-white overflow-hidden relative">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Who&apos;s using SuiAttend?
            </h2>
          </div>

          <div className="relative">
            <div className="relative overflow-hidden">
              <div
                ref={carouselRef}
                className="flex gap-4 items-center will-change-transform"
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
                  { name: "NGOs", icon: "🤝" }
                ].map((org, index) => (
                  <div
                    key={`first-${index}`}
                    className="flex-shrink-0 bg-white border border-gray-300 rounded-lg px-10 py-6 flex items-center justify-center grayscale h-28 min-w-[240px]"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-4xl">{org.icon}</span>
                      <span className="text-base font-semibold text-gray-900 whitespace-nowrap">
                        {org.name}
                      </span>
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
                  { name: "NGOs", icon: "🤝" }
                ].map((org, index) => (
                  <div
                    key={`second-${index}`}
                    className="flex-shrink-0 bg-white border border-gray-300 rounded-lg px-10 py-6 flex items-center justify-center grayscale h-28 min-w-[240px]"
                    aria-hidden="true"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-4xl">{org.icon}</span>
                      <span className="text-base font-semibold text-gray-900 whitespace-nowrap">
                        {org.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-20 px-6 bg-[hsl(220,13%,9%)] overflow-hidden relative"
      >
        {/* QR Code Background Pattern */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none overflow-hidden">
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
              A complete solution for managing attendance with blockchain
              technology
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const topGridClass =
                index === 1
                  ? "card-1-top"
                  : index === 3
                  ? "card-3-top"
                  : "";
              const bottomGridClass =
                index === 0
                  ? "card-0-bottom"
                  : index === 2
                  ? "card-2-bottom"
                  : "";
              const descriptionClass = `card-${index}-description`;

              return (
                <div
                  key={index}
                  className="relative bg-[hsl(220,13%,9%)] border border-[hsl(220,13%,18%)] rounded-lg overflow-hidden group transition-all duration-300 flex flex-col"
                  style={{ minHeight: "20em" }}
                >
                  <div className="relative p-6 flex flex-col h-full">
                    <div className={`grid grid-cols-12 gap-px mb-3 ${topGridClass}`}>
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div
                          key={`top-${i}`}
                          className={
                            topGridClass
                              ? `grid-box-animated grid-box-${i}`
                              : "h-4 bg-[hsl(220,14%,96%)]/5 group-hover:bg-[hsl(220,14%,96%)]/10 transition-colors"
                          }
                        />
                      ))}
                    </div>

                    <div className="flex items-center gap-3 mb-3 min-h-[60px]">
                      <div className="h-4 w-4 bg-blue-500 flex-shrink-0" />
                      <h3 className="text-base font-semibold text-[hsl(220,14%,96%)] whitespace-nowrap">
                        {feature.title}
                      </h3>
                    </div>

                    <div className="mb-4">
                      <p
                        className={`text-base text-[hsl(220,9%,55%)] leading-relaxed ${descriptionClass}`}
                      >
                        {feature.description}
                      </p>
                    </div>

                    <div className={`grid grid-cols-12 gap-px mt-auto ${bottomGridClass}`}>
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div
                          key={`bottom-${i}`}
                          className={
                            bottomGridClass
                              ? `grid-box-animated grid-box-${i}`
                              : "h-4 bg-[hsl(220,14%,96%)]/5 group-hover:bg-[hsl(220,14%,96%)]/10 transition-colors"
                          }
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
              Track system growth and activity in real-time. See how
              organisations, students, and attendance records are growing on the
              Sui blockchain.
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
              <a
                href="https://github.com/Arewa100/esp32_sui_attendance"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Documentation
              </a>
              <a
                href="https://github.com/Arewa100/esp32_sui_attendance"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                GitHub
              </a>
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
