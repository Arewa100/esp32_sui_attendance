import React, { useRef, useEffect } from "react";
import {
  School,
  Landmark,
  Factory,
  GraduationCap,
  Hospital,
  Building,
  Scale,
  HeartHandshake
} from "lucide-react";
import { Icon } from "@chakra-ui/react";

const organisations = [
  { name: "Schools", icon: School },
  { name: "Banks", icon: Landmark },
  { name: "Industries", icon: Factory },
  { name: "Universities", icon: GraduationCap },
  { name: "Hospitals", icon: Hospital },
  { name: "Corporations", icon: Building },
  { name: "Government", icon: Scale },
  { name: "NGOs", icon: HeartHandshake }
];

export default React.memo(function LandingCarousel() {
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const carouselSectionRef = useRef<HTMLDivElement | null>(null);
  const scrollVelocityRef = useRef(0);
  const lastScrollY = useRef(window.scrollY);
  const lastScrollTime = useRef(Date.now());
  const scrollSamples = useRef<Array<{ time: number; scrollY: number }>>([]);
  const animationRafId = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number | null>(null);
  const positionX = useRef(0);

  // Throttle function
  const throttle = React.useCallback((func: () => void, limit: number) => {
    let inThrottle: boolean;
    return function(this: any) {
      if (!inThrottle) {
        func.apply(this);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }, []);

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
    const BASE_AUTO_SCROLL_SPEED = 60;
    let currentScrollDirection = -1;
    
    // Map scroll velocity to carousel speed
    const mapScrollVelocityToCarouselSpeed = (scrollVelocity: number): number => {
      const SPEED_SCALE = 0.5;
      const MIN_SPEED = 30;
      const MAX_SPEED = 400;
      
      if (scrollVelocity > 10) {
        currentScrollDirection = -1;
      } else if (scrollVelocity < -10) {
        currentScrollDirection = 1;
      }
      
      let carouselSpeed = Math.abs(scrollVelocity) * SPEED_SCALE;
      carouselSpeed = Math.max(MIN_SPEED, Math.min(MAX_SPEED, carouselSpeed));
      
      return carouselSpeed * currentScrollDirection;
    };

    // Animation loop
    const animate = (currentTime: number) => {
      if (!lastFrameTimeRef.current) {
        lastFrameTimeRef.current = currentTime;
      }
      
      const dt = (currentTime - lastFrameTimeRef.current) / 1000;
      lastFrameTimeRef.current = currentTime;

      if (isInView) {
        positionX.current += scrollVelocityRef.current * dt;

        const contentWidth = el.scrollWidth / 2;

        if (positionX.current <= -contentWidth) {
          positionX.current += contentWidth;
        } else if (positionX.current >= 0) {
          positionX.current -= contentWidth;
        }

        el.style.transform = `translate3d(${positionX.current}px, 0, 0)`;
        
        animationRafId.current = requestAnimationFrame(animate);
      } else {
        lastFrameTimeRef.current = null;
        animationRafId.current = null;
      }

      const currentSpeed = Math.abs(scrollVelocityRef.current);
      const baseSpeedWithDirection = BASE_AUTO_SCROLL_SPEED * currentScrollDirection;
      
      if (currentSpeed > BASE_AUTO_SCROLL_SPEED + 5) {
        scrollVelocityRef.current = scrollVelocityRef.current * 0.95;
      } else {
        scrollVelocityRef.current = baseSpeedWithDirection;
      }
    };

    // Throttled scroll handler
    const handleScroll = throttle(() => {
      const currentScrollY = window.scrollY;
      const currentTime = Date.now();
      const timeDelta = (currentTime - lastScrollTime.current) / 1000;

      scrollSamples.current.push({ time: currentTime, scrollY: currentScrollY });
      if (scrollSamples.current.length > 10) {
        scrollSamples.current.shift();
      }

      if (scrollSamples.current.length >= 2 && timeDelta > 0 && timeDelta < 1) {
        const oldestSample = scrollSamples.current[0];
        const newestSample = scrollSamples.current[scrollSamples.current.length - 1];
        const timeSpan = (newestSample.time - oldestSample.time) / 1000;
        const scrollSpan = newestSample.scrollY - oldestSample.scrollY;
        
        if (timeSpan > 0) {
          const scrollVelocity = scrollSpan / timeSpan;
          
          checkInView();
          
          if (isInView) {
            scrollVelocityRef.current = mapScrollVelocityToCarouselSpeed(scrollVelocity);
            
            if (animationRafId.current === null) {
              lastFrameTimeRef.current = null;
              animationRafId.current = requestAnimationFrame(animate);
            }
          }
        }
      }

      lastScrollY.current = currentScrollY;
      lastScrollTime.current = currentTime;
    }, 16); // ~60fps

    scrollVelocityRef.current = BASE_AUTO_SCROLL_SPEED * currentScrollDirection;
    checkInView();
    
    if (isInView && animationRafId.current === null) {
      lastFrameTimeRef.current = null;
      animationRafId.current = requestAnimationFrame(animate);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('wheel', handleScroll, { passive: true });
    
    const viewportCheckInterval = setInterval(() => {
      const wasInView = isInView;
      checkInView();
      if (isInView && !wasInView && animationRafId.current === null) {
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
    <section ref={carouselSectionRef} className="py-20 px-6 bg-white overflow-hidden relative">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Who&apos;s using SuiAttend?
          </h2>
        </div>

        <div className="relative">
          <div className="relative">
            <div
              ref={carouselRef}
              className="flex items-center will-change-transform"
            >
              {/* First set of logos */}
              {organisations.map((org, index, array) => {
                const IconComponent = org.icon;
                const isLast = index === array.length - 1;
                return (
                  <div
                    key={`first-${index}`}
                    className={`flex-shrink-0 bg-white border-t border-b border-l ${isLast ? 'border-r border-gray-300' : 'border-r border-gray-300'} px-6 py-5 flex items-center justify-center grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-300 h-24 min-w-[240px]`}
                  >
                    <div className="flex items-center gap-4">
                      <Icon as={IconComponent} boxSize={10} color="gray.700" />
                      <span className="text-base font-semibold text-gray-900 whitespace-nowrap">
                        {org.name}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Duplicate set for seamless loop */}
              {organisations.map((org, index, array) => {
                const IconComponent = org.icon;
                const isLast = index === array.length - 1;
                return (
                  <div
                    key={`second-${index}`}
                    className={`flex-shrink-0 bg-white border-t border-b border-l ${isLast ? 'border-r border-gray-300' : 'border-r border-gray-300'} px-6 py-5 flex items-center justify-center grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-300 h-24 min-w-[240px]`}
                    aria-hidden="true"
                  >
                    <div className="flex items-center gap-4">
                      <Icon as={IconComponent} boxSize={10} color="gray.700" />
                      <span className="text-base font-semibold text-gray-900 whitespace-nowrap">
                        {org.name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

