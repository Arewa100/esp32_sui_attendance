import { useSuiClient } from "@mysten/dapp-kit";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";

/**
 * Hook to get the current user's SUI balance
 * Returns balance in MIST (smallest unit) and SUI (formatted)
 */
export function useSuiBalance() {
  const client = useSuiClient();
  const account = useCurrentAccount();

  return useQuery({
    queryKey: ["sui-balance", account?.address],
    queryFn: async () => {
      if (!account?.address) {
        return { balanceMist: 0n, balanceSui: 0 };
      }

      try {
        const coins = await client.getCoins({
          owner: account.address,
          coinType: "0x2::sui::SUI",
        });

        // Sum all coin balances
        const totalBalance = coins.data.reduce((sum, coin) => {
          return sum + BigInt(coin.balance || 0);
        }, 0n);

        // Convert to SUI (1 SUI = 1_000_000_000 MIST)
        const balanceSui = Number(totalBalance) / 1_000_000_000;

        return {
          balanceMist: totalBalance,
          balanceSui,
        };
      } catch (error) {
        console.error("Error fetching SUI balance:", error);
        return { balanceMist: 0n, balanceSui: 0 };
      }
    },
    enabled: !!account?.address,
    staleTime: 10_000, // Cache for 10 seconds
    refetchInterval: 30_000, // Refetch every 30 seconds
  });
}



