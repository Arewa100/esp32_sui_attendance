import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface AnimatedLogoProps {
  variant?: "default" | "sidebar" | "footer" | "welcome";
  collapsed?: boolean;
  className?: string;
  showLink?: boolean;
  onClick?: () => void;
}

export default React.memo(function AnimatedLogo({ 
  variant = "default", 
  collapsed = false,
  className = "",
  showLink = true,
  onClick
}: AnimatedLogoProps) {
  const baseClasses = "flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer";
  
  const iconSizes = {
    default: "h-9 w-9",
    sidebar: "h-8 w-8",
    footer: "h-8 w-8",
    welcome: "size-10"
  };

  const textSizes = {
    default: "text-lg font-semibold",
    sidebar: "font-semibold",
    footer: "font-semibold",
    welcome: "text-lg font-bold tracking-tight"
  };

  const textColors = {
    default: "text-foreground",
    sidebar: "text-sidebar-foreground",
    footer: "text-foreground",
    welcome: "text-gray-900 dark:text-white"
  };

  const iconSize = iconSizes[variant];
  const textClass = textSizes[variant];
  const textColor = textColors[variant];

  const logoIcon = (
    <svg 
      viewBox="0 0 6.3499999 6.3500002" 
      className={iconSize}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      <g>
        <path 
          d="m 1.0585285,1.3229167 c -0.28861698,0 -0.52936198,0.240656 -0.52936198,0.5291667 v 2.6458333 c 0,0.2885107 0.240745,0.5291667 0.52936198,0.5291667 h 4.232943 c 0.2886171,0 0.529362,-0.240656 0.529362,-0.5291667 V 1.8520834 c 0,-0.2885107 -0.2407449,-0.5291667 -0.529362,-0.5291667 z" 
          fill="#3c83f6"
        />
        <path 
          d="m 1.8515955,2.117643 c -0.288618,0 -0.529362,0.240656 -0.529362,0.5291667 V 3.705143 c 0,0.2885107 0.240744,0.5272141 0.529362,0.5272141 h 1.058724 c 0.2886159,0 0.5293619,-0.2387023 0.5293619,-0.5272141 V 2.6468097 c 0,-0.2885119 -0.240745,-0.5291667 -0.5293619,-0.5291667 z" 
          fill="#85b2f9"
        />
        <path 
          d="m 3.9690418,2.1176431 c -0.3423881,-0.019303 -0.366259,0.5039591 0,0.5291666 h 0.7930666 c 0.358165,-0.011611 0.3463936,-0.539364 0,-0.5291666 z" 
          fill="#85b2f9"
        />
        <path 
          d="m 3.9690418,2.9104167 c -0.341991,-0.018627 -0.3666751,0.5043052 0,0.5291667 h 0.7930666 c 0.358336,-0.01064 0.3462256,-0.5383547 0,-0.5291667 z" 
          fill="#85b2f9"
        />
        <path 
          d="m 3.9690418,3.705143 c -0.3604613,0.011699 -0.3480058,0.5392858 0,0.5272141 h 0.7930666 c 0.3523873,0.00162 0.3521283,-0.527544 0,-0.5272141 z" 
          fill="#85b2f9"
        />
      </g>
    </svg>
  );

  const content = (
    <div className={cn("logo-container", baseClasses, className)}>
      {logoIcon}
      {!collapsed && (
        <span className={cn("logo-text", textClass, textColor)}>
          SuiAttend
        </span>
      )}
    </div>
  );

  if (!showLink) {
    return (
      <div onClick={onClick} className="inline-block">
        {content}
      </div>
    );
  }

  return (
    <Link to="/" className="inline-block">
      {content}
    </Link>
  );
});
