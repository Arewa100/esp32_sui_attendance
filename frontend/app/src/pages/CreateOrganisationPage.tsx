import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PhoneShell from "@/components/PhoneShell";
import { WalletPill } from "@/components/WalletPill";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { CONFIG } from "@/config";
import { buildCreateOrganisationTx } from "@/services/transactions";
import { usePreFetchObjectMetadata } from "@/hooks/use-object-metadata";

export default function CreateOrganisationPage() {
  const navigate = useNavigate();
  const account = useCurrentAccount();
  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const systemObjectId = useMemo(() => CONFIG.SYSTEM_OBJECT_ID, []);
  
  // Pre-fetch system object metadata immediately when component mounts
  const { data: systemMetadata, isReady: isMetadataReady } = usePreFetchObjectMetadata(systemObjectId);

  const canSubmit = !!account && !!systemObjectId && name.trim().length > 0 && !isPending && isMetadataReady;

  return (
    <PhoneShell className="bg-white dark:bg-background-dark min-w-[320px]">
      <div className="sticky top-0 z-30 flex items-center bg-white/90 dark:bg-background-dark/90 backdrop-blur-md p-4 border-b border-gray-100 dark:border-gray-800">
        <button
          className="text-text-main dark:text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="text-text-main dark:text-white text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-10">
          Create Organisation
        </h2>
      </div>

      <div className="flex-1 flex flex-col p-5 gap-6">
        <div className="flex justify-end">
          <WalletPill />
        </div>

        <div className="space-y-2">
          <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-primary text-2xl">
              domain_add
            </span>
          </div>
          <h1 className="text-text-main dark:text-white text-2xl font-bold leading-tight">
            New Organisation
          </h1>
          <p className="text-text-light dark:text-gray-400 text-sm font-normal leading-relaxed">
            Register a new educational institution on the Sui network. This
            action will create an immutable on-chain record for your attendance
            system.
          </p>
        </div>

        <div className="flex flex-col gap-6 pt-2">
          <label className="flex flex-col gap-2 group">
            <span className="text-text-main dark:text-gray-200 text-sm font-medium">
              Organisation Name
            </span>
            <div className="relative">
              <input
                className="peer flex w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1A2633] px-4 h-14 text-base text-text-main dark:text-white placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm"
                placeholder="e.g. Springfield High School"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 peer-focus:text-primary transition-colors">
                <span className="material-symbols-outlined">edit</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500 px-1 pt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">info</span>
              Visible to all users on the blockchain.
            </p>
          </label>
        </div>

        {!CONFIG.SYSTEM_OBJECT_ID ? (
          <div className="rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30 p-4 text-sm text-orange-800 dark:text-orange-200">
            Missing system object ID. Set <span className="font-mono">VITE_SYSTEM_OBJECT_ID</span> in{" "}
            <span className="font-mono">frontend/app/.env</span>.
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 p-4 text-sm text-red-800 dark:text-red-200">
            {error}
          </div>
        ) : null}

        <div className="mt-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Recent Status
          </h3>
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-[#1A2633] border border-green-100 dark:border-green-900/30 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Organisation Created
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  TxID: 0x8a...4b2 • Just now
                </p>
              </div>
              <button className="text-primary text-sm font-medium hover:underline">
                View
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 w-full bg-white dark:bg-background-dark border-t border-gray-100 dark:border-gray-800 p-5 pb-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between mb-4 px-1">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Estimated Network Fee
          </span>
          <div className="flex items-center gap-1 text-xs font-semibold text-text-main dark:text-gray-300">
            <span className="material-symbols-outlined text-[14px] text-gray-400">
              local_gas_station
            </span>
            ~0.002 SUI
          </div>
        </div>
        <button
          className="relative w-full overflow-hidden rounded-xl bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-60 disabled:hover:bg-primary/10 transition-all duration-300 h-14 flex items-center justify-center group shadow-lg shadow-blue-500/20 active:scale-[0.98]"
          type="button"
          disabled={!canSubmit}
          onClick={() => {
            setError(null);
            if (!isMetadataReady) {
              setError("Loading object metadata...");
              return;
            }
            try {
              // Use cached metadata - no blocking network calls here!
              const tx = buildCreateOrganisationTx({
                systemObjectId,
                name: name.trim(),
                systemMetadata, // Pass cached metadata
              });
              // Wallet popup appears immediately - no delays!
              signAndExecute(
                { transaction: tx },
                {
                  onSuccess: () => {
                    navigate("/orgs");
                  },
                  onError: (e) => {
                    setError(e.message ?? String(e));
                  }
                }
              );
            } catch (e) {
              setError(e instanceof Error ? e.message : String(e));
            }
          }}
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          <span className="relative text-white text-base font-bold tracking-wide flex items-center gap-2">
            {!isMetadataReady ? "Preparing..." : isPending ? "Creating..." : "Create Organisation"}
            <span className="material-symbols-outlined text-[20px]">
              arrow_forward
            </span>
          </span>
        </button>
      </div>
    </PhoneShell>
  );
}


