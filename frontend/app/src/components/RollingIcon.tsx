import React, { useState, useEffect } from "react";
import IdCardIcon from "./IdCardIcon";
import SignalIcon from "./SignalIcon";

interface RollingIconProps {
  className?: string;
  size?: number;
  containerSize?: string;
}

// Array of icon components to cycle through - only the two SVGs you shared
const iconComponents = [
  { component: IdCardIcon, name: "id-card", isSvg: true },
  { component: SignalIcon, name: "signal", isSvg: true },
];

export default function RollingIcon({ 
  className = "", 
  size = 24,
  containerSize = "h-8 w-8"
}: RollingIconProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRolling, setIsRolling] = useState(false);

  useEffect(() => {
    // Roll every 3 seconds
    const interval = setInterval(() => {
      setIsRolling(true);
      
      // After rolling animation completes, change icon
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % iconComponents.length);
        setIsRolling(false);
      }, 600); // Half of roll animation duration
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const CurrentIcon = iconComponents[currentIndex].component;

  return (
    <div className={`rolling-icon-container ${containerSize} flex items-center justify-center ${className}`}>
      <div 
        className={`rolling-icon ${isRolling ? 'rolling' : ''}`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <CurrentIcon 
          className="h-4 w-4 text-primary" 
          size={size} 
        />
      </div>
    </div>
  );
}

