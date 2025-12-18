import { useNavigate } from "react-router-dom";
import PhoneShell from "../components/PhoneShell";
import { WalletPill } from "../components/WalletPill";

export default function MyOrganisationsPage() {
  const navigate = useNavigate();

  // Note: UI is from Stitch. Real org listing will be wired to chain in the next step.
  return (
    <PhoneShell className="pb-20">
      <header className="sticky top-0 z-20 bg-white/90 dark:bg-[#101822]/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold leading-tight tracking-tight flex-1 truncate">
            My Organisations
          </h1>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <WalletPill />
            </div>
            <button
              className="sm:hidden flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 text-primary"
              type="button"
              onClick={() => navigate("/")}
              aria-label="Wallet"
            >
              <span className="material-symbols-outlined text-[20px]">
                account_balance_wallet
              </span>
            </button>
            <button
              className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white hover:bg-blue-600 transition-colors shadow-sm"
              type="button"
              onClick={() => navigate("/orgs/new")}
              aria-label="Add organisation"
            >
              <span className="material-symbols-outlined text-[24px]">add</span>
            </button>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-gray-500 dark:text-gray-400">
              search
            </span>
          </div>
          <input
            className="block w-full pl-10 pr-3 py-3 border-none rounded-xl bg-white dark:bg-[#1A222C] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm"
            placeholder="Search organisations..."
            type="text"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <button className="flex whitespace-nowrap h-8 items-center justify-center px-4 rounded-full bg-[#111418] dark:bg-white text-white dark:text-[#111418] text-sm font-medium transition-colors">
            All
          </button>
          <button className="flex whitespace-nowrap h-8 items-center justify-center px-4 rounded-full bg-white dark:bg-[#1A222C] border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Active
          </button>
          <button className="flex whitespace-nowrap h-8 items-center justify-center px-4 rounded-full bg-white dark:bg-[#1A222C] border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Expiring Soon
          </button>
          <button className="flex whitespace-nowrap h-8 items-center justify-center px-4 rounded-full bg-white dark:bg-[#1A222C] border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Expired
          </button>
        </div>
      </div>

      <main className="px-4 space-y-4">
        <article className="group relative flex flex-col sm:flex-row bg-white dark:bg-[#1A222C] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-md transition-shadow">
          <div className="h-32 sm:h-auto sm:w-32 md:w-48 bg-gray-200 shrink-0 relative">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAWaiAeFG_-oUGEuwpEyvdKOFqEBbDtAJ3QMqiweEmP3ofY2LQNIiFt12MUml0jAhbeQSrI8XggUnUbkKrdaj9q_5mTFVAsd0AHvDRVcAfv_grAiv8Qu1GstWcYpHtH_NRwSmXGCl3xHzj46fXouzxniwgTpcO_0nIQtT46kXmW4zs1q9wfQVC5iN78mAk_-sKuPi53QwpxwSVVjV7ErESZCafKkcxt7dHOD69m1H7IR3JTtYt7ES1VHSyvCbIMU_sLKPutS5BIPtM")'
              }}
            />
          </div>
          <div className="flex flex-1 flex-col justify-between p-4">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-base font-bold text-text-main dark:text-white leading-tight pr-6">
                  St. Mary&apos;s Engineering College
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-md bg-green-50 dark:bg-green-900/40 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-300 ring-1 ring-inset ring-green-600/20 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-600 dark:bg-green-400" />
                  Active
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3 mb-4">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Students
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-gray-400">
                      group
                    </span>
                    <span className="text-sm font-semibold text-text-main dark:text-white">
                      1,240
                    </span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Records
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-gray-400">
                      inventory_2
                    </span>
                    <span className="text-sm font-semibold text-text-main dark:text-white">
                      15k
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-3 mt-auto">
              <span className="text-xs text-gray-400 dark:text-gray-500">
                Last sync: 2m ago
              </span>
              <button
                className="flex items-center gap-1 text-sm font-semibold text-primary hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                type="button"
                onClick={() => navigate("/orgs/0xORG_OBJECT_ID")}
              >
                Dashboard
                <span className="material-symbols-outlined text-[18px]">
                  arrow_forward
                </span>
              </button>
            </div>
          </div>
        </article>

        <article className="flex flex-col sm:flex-row bg-white dark:bg-[#1A222C] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden opacity-60">
          <div className="h-32 sm:h-auto sm:w-32 md:w-48 bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div className="flex flex-1 flex-col p-4 gap-3">
            <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-3/4 animate-pulse" />
            <div className="flex gap-4">
              <div className="h-8 w-20 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              <div className="h-8 w-20 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            </div>
            <div className="mt-auto h-4 bg-gray-200 dark:bg-gray-800 rounded w-full animate-pulse" />
          </div>
        </article>
      </main>

      <nav className="fixed bottom-0 inset-x-0 bg-white dark:bg-[#101822] border-t border-gray-200 dark:border-gray-800 z-30">
        <div className="flex justify-around items-center h-16">
          <button className="flex flex-col items-center justify-center w-full h-full text-primary space-y-1">
            <span className="material-symbols-outlined">grid_view</span>
            <span className="text-[10px] font-medium">Orgs</span>
          </button>
          <button className="flex flex-col items-center justify-center w-full h-full text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 space-y-1">
            <span className="material-symbols-outlined">qr_code_scanner</span>
            <span className="text-[10px] font-medium">Scanner</span>
          </button>
          <button
            className="flex flex-col items-center justify-center w-full h-full text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 space-y-1"
            onClick={() => navigate("/")}
            type="button"
          >
            <span className="material-symbols-outlined">
              account_balance_wallet
            </span>
            <span className="text-[10px] font-medium">Wallet</span>
          </button>
          <button className="flex flex-col items-center justify-center w-full h-full text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 space-y-1">
            <span className="material-symbols-outlined">settings</span>
            <span className="text-[10px] font-medium">Settings</span>
          </button>
        </div>
      </nav>
    </PhoneShell>
  );
}








