import type { ReactNode } from "react";

export default function PhoneShell({
  children,
  className,
  maxWidthClass = "max-w-md",
  withFrame = true
}: {
  children: ReactNode;
  className?: string;
  maxWidthClass?: string;
  withFrame?: boolean;
}) {
  return (
    <div
      className={[
        "relative flex h-full min-h-screen w-full flex-col overflow-x-hidden mx-auto",
        maxWidthClass,
        withFrame ? "shadow-xl" : "shadow-none",
        "bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm text-text-main dark:text-white transition-colors duration-200",
        className ?? ""
      ].join(" ")}
    >
      {children}
    </div>
  );
}



