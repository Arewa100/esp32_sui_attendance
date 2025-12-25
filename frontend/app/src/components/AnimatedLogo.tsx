import { Link } from "react-router-dom";
import RollingIcon from "./RollingIcon";
import { cn } from "@/lib/utils";

interface AnimatedLogoProps {
  variant?: "default" | "sidebar" | "footer" | "welcome";
  collapsed?: boolean;
  className?: string;
  showLink?: boolean;
  onClick?: () => void;
}

export default function AnimatedLogo({ 
  variant = "default", 
  collapsed = false,
  className = "",
  showLink = true,
  onClick
}: AnimatedLogoProps) {
  const baseClasses = "flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer";
  
  const iconSizes = {
    default: { container: "h-9 w-9", icon: 20 },
    sidebar: { container: "h-8 w-8", icon: 16 },
    footer: { container: "h-8 w-8", icon: 16 },
    welcome: { container: "size-10", icon: 24 }
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

  const size = iconSizes[variant];
  const textClass = textSizes[variant];
  const textColor = textColors[variant];

  const content = (
    <div className={cn("logo-container", baseClasses, className)}>
      <RollingIcon
        size={size.icon}
        containerSize={size.container}
      />
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
}

