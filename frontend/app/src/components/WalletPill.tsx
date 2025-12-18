import { useCurrentAccount, ConnectButton } from "@mysten/dapp-kit";

export function WalletPill() {
  const account = useCurrentAccount();

  if (!account) {
    return (
      <div className="flex items-center justify-end">
        <ConnectButton />
      </div>
    );
  }

  const short = `${account.address.slice(0, 4)}...${account.address.slice(-3)}`;

  return (
    <div className="flex items-center gap-x-2 rounded-full bg-primary/10 dark:bg-primary/20 pl-3 pr-4 py-1.5 border border-primary/10">
      <span className="material-symbols-outlined text-primary text-[18px]">
        account_balance_wallet
      </span>
      <p className="text-primary text-xs font-semibold tracking-wide font-mono">
        {short}
      </p>
      <div className="h-2 w-2 rounded-full bg-green-500 ml-1 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
    </div>
  );
}








