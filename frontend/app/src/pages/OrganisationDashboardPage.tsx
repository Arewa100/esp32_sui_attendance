import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PhoneShell from "@/components/PhoneShell";
import { useSubscriptionStatus } from "@/hooks/use-subscription-status";
import PageBackground from "@/components/PageBackground";

export default function OrganisationDashboardPage() {
  const navigate = useNavigate();
  const { orgObjectId } = useParams();
  const orgTitle = "Organisation";
  const { data: subscriptionStatus, isLoading: isLoadingSubscription } = useSubscriptionStatus(orgObjectId);

  const expiryText = useMemo(() => {
    if (isLoadingSubscription) return "Loading...";
    if (!subscriptionStatus) return "No subscription";
    if (subscriptionStatus.isActive && subscriptionStatus.timeRemaining) {
      const { days, hours } = subscriptionStatus.timeRemaining;
      if (days > 0) return `Expires in: ${days} Day${days !== 1 ? "s" : ""}`;
      if (hours > 0) return `Expires in: ${hours} Hour${hours !== 1 ? "s" : ""}`;
      return "Expires soon";
    }
    return subscriptionStatus.expiryTimestamp ? "Subscription expired" : "No subscription";
  }, [subscriptionStatus, isLoadingSubscription]);

  return (
    <PhoneShell withFrame={false} maxWidthClass="max-w-none" className="pb-24 relative">
      <PageBackground />
      {/* Top App Bar (Stitch structure) */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between shadow-sm transition-colors duration-300">
        <button
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-slate-900 dark:text-white transition-colors"
          type="button"
          onClick={() => navigate("/orgs")}
          aria-label="Menu"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="flex flex-col items-center flex-1 min-w-0">
          <h1 className="text-lg font-bold tracking-tight truncate text-[#111418] dark:text-white">
            {orgTitle}
          </h1>
          <p className="text-[11px] text-[#60728a] dark:text-slate-400 font-mono truncate max-w-[260px]">
            {orgObjectId ?? ""}
          </p>
        </div>
        <button
          className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 relative focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          type="button"
          aria-label="Settings"
        >
          <div className="absolute inset-0 bg-cover bg-center" />
          <span className="material-symbols-outlined absolute inset-0 m-auto h-6 w-6 text-[#111418] dark:text-white">
            settings
          </span>
        </button>
      </header>

      <main className="max-w-3xl mx-auto w-full p-4 space-y-6 flex-1">
        {/* Subscription Status Card */}
        <section className="group/card">
          <div className="flex flex-col md:flex-row overflow-hidden rounded-xl bg-white dark:bg-gray-900 shadow-[0_0_4px_rgba(0,0,0,0.1)] dark:shadow-none border border-transparent dark:border-gray-800">
            <div className="p-5 flex-1 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-primary text-xl filled">
                    verified
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#60728a] dark:text-slate-400">
                    Subscription Status
                  </span>
                </div>
                <h2 className="text-2xl font-bold leading-tight text-[#111418] dark:text-white">
                  {subscriptionStatus?.isActive ? "Premium Plan" : "No Active Plan"}
                </h2>
                <p className={`text-sm font-semibold mt-1 flex items-center gap-1.5 ${
                  subscriptionStatus?.isActive 
                    ? "text-orange-600 dark:text-orange-400" 
                    : "text-red-600 dark:text-red-400"
                }`}>
                  <span className="material-symbols-outlined text-base">
                    {subscriptionStatus?.isActive ? "warning" : "error"}
                  </span>
                  {expiryText}
                </p>
              </div>
              <button
                className="w-full md:w-fit px-6 py-2.5 bg-primary/10 text-primary hover:bg-primary/20 active:bg-primary/30 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm"
                type="button"
                onClick={() => navigate(`/orgs/${orgObjectId}/subscription`)}
              >
                <span className="material-symbols-outlined text-lg">payments</span>
                Renew Now
              </button>
            </div>
            <div
              className="h-32 md:h-auto md:w-2/5 bg-cover bg-center relative"
              aria-label="Abstract blue gradient background representing secure blockchain connectivity"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBDREJbRofx1Sp_AV3TnJf-oet7lNI7LAKkIrpFemMej2_d-CCemnzDQm4zc1o6MX3sKC5op6UQUm0esll1TNWsuejlpGke4dKaXcDGKKpSbnfRQq0cD2-qjCB_7Cu2KKuhGDqaunrLLXbc7D2xoLs-GnAgcwe-qlKxLoJzU97p0x1ZcP_-xhunGCL8Wo01B9KERyOjSF854Ocr9qVYHVBNr1feJNBFfASGgWxDVSgn40vQy1EchHit6btvZTdaEkymOq1OpeUvKTU')"
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent md:bg-gradient-to-l" />
              <div className="absolute bottom-3 left-3 text-white/90 text-xs font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-base">lock</span>
                Secured by Sui
              </div>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section>
          <h3 className="text-[#111418] dark:text-white tracking-tight text-lg font-bold leading-tight px-1 mb-3">
            Overview
          </h3>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="flex flex-col gap-2 rounded-xl p-5 bg-white dark:bg-gray-900 border border-[#dbdfe6] dark:border-gray-800 shadow-sm transition-transform active:scale-[0.98]">
              <div className="flex items-start justify-between">
                <span className="text-[#60728a] dark:text-slate-400 text-sm font-medium leading-normal">
                  Total Students
                </span>
                <span className="material-symbols-outlined text-primary">
                  groups
                </span>
              </div>
              <p className="text-[#111418] dark:text-white tracking-tight text-2xl font-bold leading-tight">
                0
              </p>
            </div>

            <div className="flex flex-col gap-2 rounded-xl p-5 bg-white dark:bg-gray-900 border border-[#dbdfe6] dark:border-gray-800 shadow-sm transition-transform active:scale-[0.98]">
              <div className="flex items-start justify-between">
                <span className="text-[#60728a] dark:text-slate-400 text-sm font-medium leading-normal">
                  Total Records
                </span>
                <span className="material-symbols-outlined text-primary">
                  receipt_long
                </span>
              </div>
              <p className="text-[#111418] dark:text-white tracking-tight text-2xl font-bold leading-tight">
                --
              </p>
            </div>

            <div className="flex flex-col gap-2 rounded-xl p-5 bg-white dark:bg-gray-900 border border-[#dbdfe6] dark:border-gray-800 shadow-sm transition-transform active:scale-[0.98]">
              <div className="flex items-start justify-between">
                <span className="text-[#60728a] dark:text-slate-400 text-sm font-medium leading-normal">
                  Active Devices
                </span>
                <span className="material-symbols-outlined text-emerald-500">
                  router
                </span>
              </div>
              <p className="text-[#111418] dark:text-white tracking-tight text-2xl font-bold leading-tight">
                --
              </p>
            </div>

            <div className="flex flex-col gap-2 rounded-xl p-5 bg-white dark:bg-gray-900 border border-[#dbdfe6] dark:border-gray-800 shadow-sm transition-transform active:scale-[0.98]">
              <div className="flex items-start justify-between">
                <span className="text-[#60728a] dark:text-slate-400 text-sm font-medium leading-normal">
                  Today&apos;s Rate
                </span>
                <span className="material-symbols-outlined text-emerald-500">
                  trending_up
                </span>
              </div>
              <p className="text-[#111418] dark:text-white tracking-tight text-2xl font-bold leading-tight">
                --
              </p>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <h3 className="text-[#111418] dark:text-white tracking-tight text-lg font-bold leading-tight px-1 mb-3">
            Quick Actions
          </h3>
          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-4 rounded-xl border border-[#dbdfe6] dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm hover:border-primary/50 transition-colors">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined filled">
                    person_add
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-[#111418] dark:text-white text-base font-bold leading-tight">
                    Register New Student
                  </p>
                  <p className="text-[#60728a] dark:text-slate-400 text-xs font-normal leading-normal truncate">
                    Add to blockchain registry
                  </p>
                </div>
              </div>
              <button
                className="shrink-0 h-9 px-4 bg-primary/10 text-primary hover:bg-primary/20 text-sm font-medium rounded-lg transition-colors shadow-sm"
                type="button"
                onClick={() => navigate(`/orgs/${orgObjectId}/students/new`)}
              >
                Register
              </button>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide snap-x">
              <button
                className="snap-start flex-1 min-w-[130px] flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-[#dbdfe6] dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm active:bg-gray-50 dark:active:bg-gray-800 transition"
                type="button"
              >
                <span className="material-symbols-outlined text-[#111418] dark:text-slate-200">
                  list_alt
                </span>
                <span className="text-[#111418] dark:text-slate-200 text-sm font-bold">
                  All Students
                </span>
              </button>
              <button
                className="snap-start flex-1 min-w-[130px] flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-[#dbdfe6] dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm active:bg-gray-50 dark:active:bg-gray-800 transition"
                type="button"
              >
                <span className="material-symbols-outlined text-[#111418] dark:text-slate-200">
                  history
                </span>
                <span className="text-[#111418] dark:text-slate-200 text-sm font-bold">
                  View Logs
                </span>
              </button>
              <button
                className="snap-start flex-1 min-w-[130px] flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-[#dbdfe6] dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm active:bg-gray-50 dark:active:bg-gray-800 transition"
                type="button"
              >
                <span className="material-symbols-outlined text-[#111418] dark:text-slate-200">
                  settings_remote
                </span>
                <span className="text-[#111418] dark:text-slate-200 text-sm font-bold">
                  Devices
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* Live Activity */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1 pt-2">
            <h3 className="text-[#111418] dark:text-white tracking-tight text-lg font-bold leading-tight">
              Live Activity
            </h3>
            <button
              className="text-sm text-primary font-bold hover:text-blue-600 transition-colors flex items-center"
              type="button"
            >
              View All{" "}
              <span className="material-symbols-outlined text-base leading-none ml-1">
                arrow_forward
              </span>
            </button>
          </div>
          <div className="rounded-xl border border-[#dbdfe6] dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm divide-y divide-[#f0f2f5] dark:divide-gray-800 overflow-hidden">
            <div className="p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 bg-cover bg-center shrink-0 border border-gray-100 dark:border-gray-700" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#111418] dark:text-white truncate">
                  Example Student
                </p>
                <p className="text-xs text-[#60728a] dark:text-slate-400">
                  ID: #0000 • Device A
                </p>
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wide">
                  Check In
                </div>
                <p className="text-xs text-[#60728a] dark:text-slate-500">
                  just now
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Bottom Navigation Bar (Stitch structure) */}
      <nav className="fixed bottom-0 left-0 w-full bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pb-safe pt-2 px-6 flex justify-between items-center z-50 shadow-[0_-4px_16px_-4px_rgba(0,0,0,0.05)]">
        <button className="flex flex-col items-center gap-1 p-2 text-primary" type="button">
          <span className="material-symbols-outlined filled text-[26px]">
            dashboard
          </span>
          <span className="text-[10px] font-bold">Home</span>
        </button>
        <button
          className="group flex flex-col items-center gap-1 p-2 text-[#60728a] dark:text-slate-500 hover:text-[#111418] dark:hover:text-slate-300 transition-colors"
          type="button"
        >
          <span className="material-symbols-outlined text-[26px] group-hover:scale-110 transition-transform">
            qr_code_scanner
          </span>
          <span className="text-[10px] font-medium">Scan</span>
        </button>
        <button
          className="group flex flex-col items-center gap-1 p-2 text-[#60728a] dark:text-slate-500 hover:text-[#111418] dark:hover:text-slate-300 transition-colors"
          type="button"
        >
          <span className="material-symbols-outlined text-[26px] group-hover:scale-110 transition-transform">
            groups
          </span>
          <span className="text-[10px] font-medium">Students</span>
        </button>
        <button
          className="group flex flex-col items-center gap-1 p-2 text-[#60728a] dark:text-slate-500 hover:text-[#111418] dark:hover:text-slate-300 transition-colors"
          type="button"
        >
          <span className="material-symbols-outlined text-[26px] group-hover:scale-110 transition-transform">
            settings
          </span>
          <span className="text-[10px] font-medium">Settings</span>
        </button>
      </nav>
    </PhoneShell>
  );
}



