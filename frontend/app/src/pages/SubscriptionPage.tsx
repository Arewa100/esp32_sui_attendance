import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PhoneShell from "../components/PhoneShell";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { CONFIG } from "../config";
import { buildPaySubscriptionTx } from "../services/transactions";
import { useSubscriptionStatus } from "../hooks/use-subscription-status";
import { useMultipleObjectMetadata } from "../hooks/use-object-metadata";

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const { orgObjectId } = useParams();
  const account = useCurrentAccount();
  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();
  const [error, setError] = useState<string | null>(null);
  const systemObjectId = useMemo(() => CONFIG.SYSTEM_OBJECT_ID, []);
  const { data: subscriptionStatus, isLoading: isLoadingStatus } = useSubscriptionStatus(orgObjectId);
  
  // Pre-fetch all required object metadata in parallel
  // This eliminates blocking network calls during transaction flow
  const { data: metadataMap, isSuccess: isMetadataReady } = useMultipleObjectMetadata([
    systemObjectId,
    orgObjectId,
    CONFIG.CLOCK_OBJECT_ID,
  ]);

  const systemMetadata = metadataMap?.get(systemObjectId || "");
  const orgMetadata = metadataMap?.get(orgObjectId || "");
  const clockMetadata = metadataMap?.get(CONFIG.CLOCK_OBJECT_ID);

  const canPay = !!account && !!orgObjectId && !!systemObjectId && !isPending && isMetadataReady;

  // Update time remaining every second
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    if (!subscriptionStatus?.timeRemaining) return;
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [subscriptionStatus?.timeRemaining]);

  // Recalculate time remaining based on current time
  const timeRemaining = useMemo(() => {
    if (!subscriptionStatus?.expiryTimestamp) return null;
    const remaining = subscriptionStatus.expiryTimestamp - currentTime;
    if (remaining <= 0) return null;
    const seconds = Math.floor(remaining / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    return {
      days: days.toString().padStart(2, "0"),
      hours: (hours % 24).toString().padStart(2, "0"),
      minutes: (minutes % 60).toString().padStart(2, "0"),
      seconds: (seconds % 60).toString().padStart(2, "0"),
    };
  }, [subscriptionStatus?.expiryTimestamp, currentTime]);

  return (
    <PhoneShell>
      <div className="sticky top-0 z-50 flex items-center bg-surface-light dark:bg-[#1c2633] px-4 py-3 justify-between border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <button
          className="text-text-main dark:text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
        >
          <span className="material-symbols-outlined text-2xl">
            arrow_back_ios_new
          </span>
        </button>
        <h2 className="text-text-main dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-10">
          Subscription
        </h2>
      </div>

      <div className="flex-1 flex flex-col gap-6 p-4 pb-24 overflow-y-auto no-scrollbar">
        <div className="flex flex-col gap-4">
          <div className="flex items-stretch justify-between gap-4 rounded-xl bg-surface-light dark:bg-[#1c2633] p-4 shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="flex flex-col justify-center gap-2 flex-[2_2_0px]">
              {isLoadingStatus ? (
                <div className="inline-flex items-center gap-2">
                  <span className="text-text-light dark:text-gray-400 text-sm">Loading...</span>
                </div>
              ) : subscriptionStatus?.isActive ? (
                <div className="inline-flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
                  </span>
                  <p className="text-green-600 dark:text-green-400 text-sm font-bold uppercase tracking-wide">
                    Active
                  </p>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                  </span>
                  <p className="text-red-600 dark:text-red-400 text-sm font-bold uppercase tracking-wide">
                    {subscriptionStatus?.expiryTimestamp ? "Expired" : "No Subscription"}
                  </p>
                </div>
              )}
              <h3 className="text-text-main dark:text-white text-xl font-bold leading-tight">
                Organisation Plan
              </h3>
              <p className="text-text-light dark:text-gray-400 text-sm font-normal leading-normal font-mono">
                {orgObjectId ?? ""}
              </p>
            </div>
            <div
              className="w-24 bg-center bg-no-repeat bg-cover rounded-lg flex-none relative overflow-hidden bg-primary/10"
              aria-label="Abstract network pattern"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDIYEVpid1n1snegHoCt3CH-UK9--j6uSWgA78jLrFILET2xfgM_5TJ6ZLAaoXSoxrlLgum-n1g4PtLF3BpNvkDG0uJyMXavCyWIaiMG0J3qCmNAiCvL7HeXCo0gAZpSxkUePfH9lA06B4eWoHyLAAeaEf3gXfvs31jrne9Zn-9SRsbcfq8bzXtyByRtW2EQVgEZLWZD_PjWkDcOup-wqvS9_8BkMWd2u3MWI8OYga8aEAba3PQjCLnSQBtz2XpEYf-usQuV04pPw0")'
              }}
            >
              <div className="absolute inset-0 bg-primary/20" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h4 className="text-text-main dark:text-white text-base font-semibold px-1">
            Time Remaining
          </h4>
          {isLoadingStatus ? (
            <div className="flex gap-3">
              {["Days", "Hrs", "Mins", "Secs"].map((label) => (
                <div
                  key={label}
                  className="flex grow basis-0 flex-col items-center gap-2 p-3 bg-surface-light dark:bg-[#1c2633] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800"
                >
                  <span className="text-primary text-2xl font-bold">--</span>
                  <span className="text-text-light dark:text-gray-400 text-xs font-medium uppercase">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          ) : timeRemaining ? (
            <div className="flex gap-3">
              {[
                { label: "Days", value: timeRemaining.days },
                { label: "Hrs", value: timeRemaining.hours },
                { label: "Mins", value: timeRemaining.minutes },
                { label: "Secs", value: timeRemaining.seconds }
              ].map((x) => (
                <div
                  key={x.label}
                  className="flex grow basis-0 flex-col items-center gap-2 p-3 bg-surface-light dark:bg-[#1c2633] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800"
                >
                  <span className="text-primary text-2xl font-bold">{x.value}</span>
                  <span className="text-text-light dark:text-gray-400 text-xs font-medium uppercase">
                    {x.label}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-surface-light dark:bg-[#1c2633] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 text-center">
              <p className="text-text-light dark:text-gray-400 text-sm">
                {subscriptionStatus?.expiryTimestamp ? "Subscription has expired" : "No active subscription"}
              </p>
            </div>
          )}
        </div>

        <div className="bg-surface-light dark:bg-[#1c2633] rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="mb-6">
            <label className="flex flex-col w-full">
              <div className="flex items-center justify-between pb-2">
                <p className="text-text-main dark:text-white text-sm font-medium">
                  Payment Source
                </p>
                <span className="text-xs text-primary font-medium cursor-pointer">
                  Change
                </span>
              </div>
              <div className="flex w-full items-center rounded-lg border border-[#dbdfe6] dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 h-12 px-3 overflow-hidden">
                <span className="material-symbols-outlined text-text-light dark:text-gray-400 mr-2 text-xl">
                  account_balance_wallet
                </span>
                <input
                  className="flex-1 bg-transparent text-text-main dark:text-white text-sm font-mono focus:outline-none"
                  readOnly
                  value={account ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}` : "Not connected"}
                />
                <div className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded text-[10px] font-bold text-primary">
                  SUI
                </div>
              </div>
            </label>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3">
              <p className="text-text-light dark:text-gray-400 text-sm">
                Subscription Fee (30 Days)
              </p>
              <p className="text-text-main dark:text-white text-sm font-medium">
                10.00 SUI
              </p>
            </div>
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-1">
                <p className="text-text-light dark:text-gray-400 text-sm">
                  Est. Network Fee
                </p>
                <span className="material-symbols-outlined text-[16px] text-text-light cursor-help">
                  info
                </span>
              </div>
              <p className="text-text-main dark:text-white text-sm font-medium">
                ~0.002 SUI
              </p>
            </div>
            <div className="flex justify-between items-end pt-1">
              <p className="text-text-main dark:text-white text-base font-bold">
                Total
              </p>
              <div className="text-right">
                <p className="text-primary text-xl font-bold">10.002 SUI</p>
                <p className="text-text-light dark:text-gray-500 text-xs">
                  Estimated
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!CONFIG.SYSTEM_OBJECT_ID ? (
        <div className="px-4 pb-24">
          <div className="rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30 p-4 text-sm text-orange-800 dark:text-orange-200">
            Missing system object ID. Set <span className="font-mono">VITE_SYSTEM_OBJECT_ID</span> in{" "}
            <span className="font-mono">frontend/app/.env</span>.
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="px-4 pb-24">
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 p-4 text-sm text-red-800 dark:text-red-200">
            {error}
          </div>
        </div>
      ) : null}

      <div className="sticky bottom-0 left-0 right-0 p-4 bg-surface-light dark:bg-[#1c2633] border-t border-gray-200 dark:border-gray-800 z-40 pb-8">
        <button
          className="flex w-full items-center justify-center gap-2 rounded-xl h-14 bg-primary hover:bg-blue-600 disabled:opacity-60 disabled:hover:bg-primary text-white font-bold text-base transition-all shadow-lg shadow-blue-500/30 active:scale-[0.98]"
          type="button"
          disabled={!canPay}
          onClick={() => {
            setError(null);
            if (!orgObjectId) {
              setError("Missing organisation object id in route.");
              return;
            }
            if (!isMetadataReady || !systemMetadata || !orgMetadata || !clockMetadata) {
              setError("Loading object metadata...");
              return;
            }
            try {
              // Use cached metadata - no blocking network calls here!
              const tx = buildPaySubscriptionTx({
                systemObjectId,
                orgObjectId,
                systemMetadata,
                orgMetadata,
                clockMetadata,
              });
              // Wallet popup appears immediately - no delays!
              signAndExecute(
                { transaction: tx },
                {
                  onSuccess: () => {
                    // Refetch subscription status after payment
                    setTimeout(() => navigate(`/orgs/${orgObjectId}`), 2000);
                  },
                  onError: (e) => setError(e.message ?? String(e))
                }
              );
            } catch (e) {
              setError(e instanceof Error ? e.message : String(e));
            }
          }}
        >
          <span className="material-symbols-outlined">fingerprint</span>
          {!isMetadataReady ? "Preparing..." : isPending ? "Processing..." : "Pay 10 SUI to Renew"}
        </button>
        <p className="text-center text-xs text-text-light dark:text-gray-500 mt-3">
          Process secured by ESP32 Sui Blockchain Protocol
        </p>
      </div>
    </PhoneShell>
  );
}


