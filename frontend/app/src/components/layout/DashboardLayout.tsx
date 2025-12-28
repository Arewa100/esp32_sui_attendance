import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Wallet,
  ChevronLeft,
  Settings,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { useCurrentAccount, useDisconnectWallet } from "@mysten/dapp-kit";
import PageBackground from "@/components/PageBackground";
import AnimatedLogo from "@/components/AnimatedLogo";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Organisations", href: "/organisations", icon: Building2 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const account = useCurrentAccount();
  const { mutate: disconnectWallet, isPending: isDisconnecting } = useDisconnectWallet();
  const hasCheckedRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Redirect to landing page if wallet is not connected (with delay to allow autoConnect)
  useEffect(() => {
    // Skip if already on landing page
    if (location.pathname === "/") {
      return;
    }

    // If account is connected, clear any pending timeout
    if (account) {
      hasCheckedRef.current = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // If we've already checked and account is still null, redirect immediately
    if (hasCheckedRef.current && !account) {
      navigate("/");
      return;
    }

    // Wait for autoConnect to finish (give it 1.5 seconds)
    if (!hasCheckedRef.current) {
      timeoutRef.current = setTimeout(() => {
        hasCheckedRef.current = true;
        if (!account) {
          navigate("/");
        }
      }, 1500);
    }

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [account, navigate, location.pathname]);

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden relative">
      <PageBackground />
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-background/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-sidebar-border bg-sidebar/95 backdrop-blur-md transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        // Mobile: drawer behavior
        "lg:translate-x-0",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className={cn("flex h-16 items-center border-b border-sidebar-border px-4", collapsed ? "justify-center" : "justify-between")}>
          {!collapsed && (
            <AnimatedLogo variant="sidebar" collapsed={false} />
          )}
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setCollapsed(!collapsed)}
              className="h-10 w-10 min-h-[44px] min-w-[44px] text-sidebar-foreground hidden lg:flex"
            >
              <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setMobileMenuOpen(false)}
              className="h-10 w-10 min-h-[44px] min-w-[44px] text-sidebar-foreground lg:hidden"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== "/dashboard" && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors min-h-[44px]",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-sidebar-foreground hover:bg-primary/10"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-sidebar-border p-3">
          <button
            className={cn(
              "w-full flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors text-sidebar-foreground bg-primary/10 hover:bg-primary/20 min-h-[44px]",
              collapsed && "justify-center px-2"
            )}
            disabled={!account || isDisconnecting}
            onClick={() => {
              if (!account) return;
              disconnectWallet();
              setMobileMenuOpen(false);
            }}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>{isDisconnecting ? "Disconnecting..." : "Disconnect"}</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className={cn(
        "flex flex-1 flex-col transition-all duration-300 min-w-0 overflow-x-hidden",
        // Mobile: no margin, Desktop: margin based on collapsed state
        "lg:ml-64",
        collapsed && "lg:ml-16"
      )}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-4 sm:px-6 shrink-0">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-10 w-10 min-h-[44px] min-w-[44px]"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
          
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            {account ? (
              <Button 
                variant="ghost" 
                size="sm" 
                className="font-mono text-xs sm:text-sm text-foreground hover:bg-orange-500 hover:text-white transition-colors relative group md:h-11"
                onClick={() => {
                  if (account && !isDisconnecting) {
                    disconnectWallet();
                  }
                }}
                disabled={isDisconnecting}
              >
                <span className="group-hover:hidden inline">
                  <span className="hidden sm:inline">{account.address.slice(0, 6)}...</span>
                  <span className="sm:hidden">{account.address.slice(0, 4)}...</span>
                  {account.address.slice(-4)}
                </span>
                <span className="hidden group-hover:inline">Disconnect</span>
              </Button>
            ) : (
              <Button 
                variant="default" 
                size="sm" 
                className="gap-2 text-white md:h-11 text-xs sm:text-sm"
                onClick={() => navigate("/")}
              >
                <Wallet className="h-4 w-4" />
                <span className="hidden sm:inline">Connect Wallet</span>
                <span className="sm:hidden">Connect</span>
              </Button>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
