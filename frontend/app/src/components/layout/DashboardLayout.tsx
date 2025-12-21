import { Link, useLocation, Outlet } from "react-router-dom";
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Bell,
  Search,
  Wallet,
  ChevronLeft,
  Shield,
  Settings,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ConnectButton, useCurrentAccount, useDisconnectWallet } from "@mysten/dapp-kit";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Organisations", href: "/organisations", icon: Building2 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function DashboardLayout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const account = useCurrentAccount();
  const { mutate: disconnectWallet, isPending: isDisconnecting } = useDisconnectWallet();

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}>
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          {!collapsed && (
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Shield className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-sidebar-foreground">SuiAttend</span>
            </Link>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setCollapsed(!collapsed)}
            className={cn("h-8 w-8 text-sidebar-foreground", collapsed && "mx-auto")}
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== "/dashboard" && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
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
              "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-sidebar-foreground bg-primary/10 hover:bg-primary/20",
              collapsed && "justify-center px-2"
            )}
            disabled={!account || isDisconnecting}
            onClick={() => {
              if (!account) return;
              disconnectWallet();
            }}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>{isDisconnecting ? "Disconnecting..." : "Disconnect"}</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className={cn(
        "flex flex-1 flex-col transition-all duration-300",
        collapsed ? "ml-16" : "ml-64"
      )}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background px-6">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search..." 
                className="pl-9 bg-muted border-0"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                3
              </span>
            </Button>
            
            {account ? (
              <Button variant="outline" size="sm" className="gap-2">
                <Wallet className="h-4 w-4" />
                <span className="font-mono text-xs">
                  {account.address.slice(0, 6)}...{account.address.slice(-4)}
                </span>
              </Button>
            ) : (
              <ConnectButton />
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
