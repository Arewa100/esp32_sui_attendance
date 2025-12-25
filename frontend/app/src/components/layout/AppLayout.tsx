import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { WalletPill } from "@/components/WalletPill";
import { useCurrentAccount, useDisconnectWallet } from "@mysten/dapp-kit";
import AnimatedLogo from "@/components/AnimatedLogo";

function SideLink({
  to,
  label,
  icon
}: {
  to: string;
  label: string;
  icon: string;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "flex items-center gap-3 rounded-xl px-4 py-3 transition-colors",
          isActive
            ? "bg-gray-100 text-primary"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        ].join(" ")
      }
    >
      <span className="material-symbols-outlined text-[22px]">{icon}</span>
      <span className="text-base font-medium">{label}</span>
    </NavLink>
  );
}

export function AppLayout({
  title,
  headerRight,
  children
}: {
  title?: string;
  headerRight?: ReactNode;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const account = useCurrentAccount();
  const { mutate: disconnectWallet, isPending: isDisconnecting } = useDisconnectWallet();

  return (
    <div className="min-h-screen bg-white">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden md:flex w-72 flex-col border-r border-gray-200 bg-white">
          <div className="flex items-center justify-between p-5">
            <button
              className="flex items-center gap-3"
              type="button"
              onClick={() => navigate("/")}
            >
              <div className="flex items-center gap-2">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <SignalIcon className="text-primary" size={22} />
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-xl font-bold text-gray-900 logo-text logo-text-swap">
                    SuiAttend
                  </span>
                  <span className="text-xs text-gray-500">Attendance System</span>
                </div>
              </div>
            </button>

            <button
              type="button"
              className="h-9 w-9 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600"
              aria-label="Collapse sidebar"
            >
              <span className="material-symbols-outlined text-[18px]">
                chevron_left
              </span>
            </button>
          </div>

          <nav className="px-4 py-2 space-y-2">
            <SideLink to="/dashboard" label="Dashboard" icon="grid_view" />
            <SideLink
              to="/organisations"
              label="Organisations"
              icon="apartment"
            />
            <SideLink to="/settings" label="Settings" icon="settings" />
          </nav>

          <div className="mt-auto border-t border-gray-200 p-4">
            <button
              className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              type="button"
              disabled={!account || isDisconnecting}
              onClick={() => {
                if (!account) return;
                disconnectWallet();
              }}
            >
              <span className="material-symbols-outlined text-[22px]">
                logout
              </span>
              <span className="text-base font-medium">{isDisconnecting ? "Disconnecting..." : "Disconnect"}</span>
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          <header className="sticky top-0 z-20 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between gap-4 px-4 md:px-6 py-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="relative flex-1 max-w-xl">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    search
                  </span>
                  <input
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="Search..."
                  />
                </div>
                {title ? (
                  <div className="hidden lg:block min-w-0">
                    <h1 className="truncate text-lg font-semibold text-gray-900">
                      {title}
                    </h1>
                  </div>
                ) : null}
              </div>

              <div className="flex items-center gap-3">
                <button
                  className="relative h-10 w-10 rounded-xl border border-gray-200 hover:bg-gray-50"
                  type="button"
                  aria-label="Notifications"
                >
                  <span className="material-symbols-outlined text-[20px] text-gray-600">
                    notifications
                  </span>
                  <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary" />
                </button>
                <WalletPill />
                {headerRight}
              </div>
            </div>
          </header>

          <main className="px-4 md:px-6 py-6">{children}</main>
        </div>
      </div>
    </div>
  );
}


