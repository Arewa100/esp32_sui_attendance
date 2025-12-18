import { useNavigate } from "react-router-dom";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import PhoneShell from "../components/PhoneShell";

export default function WelcomePage() {
  const navigate = useNavigate();
  const account = useCurrentAccount();

  return (
    <PhoneShell withFrame={false} maxWidthClass="max-w-none">
      <div className="relative flex min-h-screen w-full flex-col">
        <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 dark:bg-[#101822]/80 border-b border-gray-200 dark:border-gray-800 transition-colors">
          <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
            <div className="flex items-center gap-2 text-primary">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-[24px]">nfc</span>
              </div>
              <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white hidden min-[360px]:block">
                SuiAttend
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden lg:flex items-center gap-6 mr-2">
                <button
                  className="text-sm font-medium hover:text-primary transition-colors"
                  type="button"
                >
                  Home
                </button>
                <button
                  className="text-sm font-medium hover:text-primary transition-colors"
                  type="button"
                  onClick={() => navigate("/orgs")}
                >
                  My Organisations
                </button>
                <a
                  className="text-sm font-medium hover:text-primary transition-colors"
                  href="../smart-contract/FRONTEND_INTEGRATION.md"
                >
                  Docs
                </a>
              </div>

              <div className="flex h-7 items-center justify-center gap-x-1.5 rounded-full bg-green-100 dark:bg-green-900/30 px-3 border border-green-200 dark:border-green-800">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                <p className="text-green-700 dark:text-green-400 text-xs font-medium">
                  Online
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col w-full max-w-7xl mx-auto">
          <section className="px-4 py-6 md:py-12 lg:py-20">
            <div className="relative w-full rounded-2xl overflow-hidden bg-gray-900 shadow-xl group">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                aria-label="Abstract gradient background with blockchain nodes network pattern"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuABhFxH49SS58T_rRhg3G5Gip0Jc2TYvo15fR_v2eG4X3KGUfiu_fbFtaUFP7XVp3sp3Xn8Wo-L_MZB_7o8QSB3RZv7Sky1QC_jjDiOq_RLEDD0lrxM14rZb-F17TgnrxCX1Zmi3f94yteqlNq2Fyqqcgr24iYwinQxrY_26mBXRQ2E8tDr5n9qt6tBc_mtgYJftN9QbY6ey5CccDymvqHSQ0F-uP6RREmAJAAXtyALM1IkrRE-NpxrUSNyc5pFKqoYf5tOa3iDLtY')"
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
              <div className="relative z-10 flex flex-col items-center justify-center px-4 py-16 text-center md:py-24 gap-6">
                <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
                  <span className="mr-1 h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  Live on Sui Testnet
                </div>

                <h1 className="text-3xl font-black leading-tight tracking-tight text-white sm:text-5xl md:text-6xl max-w-3xl">
                  Attendance Verified on{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-primary">
                    Blockchain
                  </span>
                </h1>
                <p className="max-w-xl text-base text-gray-300 sm:text-lg md:text-xl">
                  Connect your wallet to manage organizations and view real-time
                  immutable RFID logs powered by ESP32.
                </p>

                <div className="mt-4 w-full flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:w-auto">
                  <div className="w-full sm:w-auto min-w-[200px]">
                    <ConnectButton />
                  </div>

                  <button
                    className="flex h-12 w-full sm:w-auto min-w-[160px] cursor-pointer items-center justify-center gap-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 px-6 text-sm font-bold text-white transition-all hover:bg-white/20 active:scale-95"
                    type="button"
                    onClick={() => navigate("/orgs")}
                    disabled={!account}
                    title={account ? "Go to My Organisations" : "Connect wallet first"}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      corporate_fare
                    </span>
                    My Organisations
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="px-4 py-8 flex flex-col gap-10">
            <div className="flex flex-col gap-3 text-center md:text-left">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                Why Choose Sui Attendance?
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-base max-w-2xl mx-auto md:mx-0">
                Secure, transparent, and instant tracking designed for the
                future of education.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a202c] p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/50">
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-blue-50 text-primary dark:bg-blue-900/20 dark:text-blue-400 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[28px]">
                    verified_user
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">
                  Immutability
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  Every scan is a transaction. Records are stored permanently on
                  Sui and cannot be tampered with.
                </p>
              </div>

              <div className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a202c] p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/50">
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-blue-50 text-primary dark:bg-blue-900/20 dark:text-blue-400 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[28px]">
                    memory
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">
                  Hardware Sync
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  Real-time communication between ESP32 microcontrollers and the
                  blockchain network.
                </p>
              </div>

              <div className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a202c] p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/50">
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-blue-50 text-primary dark:bg-blue-900/20 dark:text-blue-400 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[28px]">
                    bolt
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">
                  Instant Finality
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  Sub-second latency. Attendance is marked and verified as
                  students tap their cards.
                </p>
              </div>
            </div>
          </section>

          <section className="px-4 py-8 mb-8">
            <div className="rounded-2xl bg-primary/5 dark:bg-primary/10 p-8">
              <div className="flex flex-col md:flex-row justify-around items-center gap-8 text-center">
                <div className="flex flex-col gap-1">
                  <span className="text-3xl font-black text-primary">10k+</span>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Transactions Logged
                  </span>
                </div>
                <div className="w-16 h-[1px] md:h-12 md:w-[1px] bg-gray-300 dark:bg-gray-700" />
                <div className="flex flex-col gap-1">
                  <span className="text-3xl font-black text-primary">50+</span>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Active Institutions
                  </span>
                </div>
                <div className="w-16 h-[1px] md:h-12 md:w-[1px] bg-gray-300 dark:bg-gray-700" />
                <div className="flex flex-col gap-1">
                  <span className="text-3xl font-black text-primary">99.9%</span>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Uptime Reliability
                  </span>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="mt-auto border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#101822] px-5 py-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row max-w-7xl mx-auto">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-gray-400">
                nfc
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                ESP32 Sui Attendance
              </span>
            </div>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              © 2024 Built for the Future of Education.
            </p>
            <button
              className="text-sm font-semibold text-primary hover:text-blue-600 transition-colors"
              type="button"
              onClick={() => navigate("/orgs")}
            >
              Open App
            </button>
          </div>
        </footer>
        <div className="h-4 w-full bg-white dark:bg-[#101822] sm:hidden" />
      </div>
    </PhoneShell>
  );
}



