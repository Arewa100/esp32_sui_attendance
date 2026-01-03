import { useSuiClient } from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";

export type SubscriptionStatus = {
  isActive: boolean;
  expiryTimestamp: number | null;
  paymentAmount: number | null;
  timeRemaining: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null;
};

export function useSubscriptionStatus(orgId?: string) {
  const client = useSuiClient();

  return useQuery({
    queryKey: ["subscription-status", orgId],
    queryFn: async (): Promise<SubscriptionStatus> => {
      if (!orgId) {
        return {
          isActive: false,
          expiryTimestamp: null,
          paymentAmount: null,
          timeRemaining: null,
        };
      }

      try {
        const orgRes = await client.getObject({
          id: orgId,
          options: { showContent: true },
        });

        const subscription = (orgRes.data?.content as any)?.fields?.subscription?.fields;
        if (!subscription) {
          return {
            isActive: false,
            expiryTimestamp: null,
            paymentAmount: null,
            timeRemaining: null,
          };
        }

        const expiry = Number(subscription.expiry_timestamp);
        const now = Date.now();
        const isActuallyActive = expiry > now && subscription.is_active;

        return {
          isActive: isActuallyActive,
          expiryTimestamp: expiry,
          paymentAmount: Number(subscription.payment_amount),
          timeRemaining: isActuallyActive ? calculateTimeRemaining(expiry - now) : null,
        };
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("Error fetching subscription from object:", error);
        }
        return {
          isActive: false,
          expiryTimestamp: null,
          paymentAmount: null,
          timeRemaining: null,
        };
      }
    },
    enabled: !!orgId,
    staleTime: 60_000, // Data is fresh for 1 minute
    refetchInterval: (query) => {
      if (typeof document !== 'undefined' && document.hidden) {
        return false;
      }
      return 60_000; // 1 minute (reduced from 10s) - subscriptions change rarely
    },
    refetchOnWindowFocus: true, // Immediate update when user returns
    refetchOnReconnect: true, // Refetch on network reconnect
    placeholderData: (previousData) => previousData, // Show stale data while fetching
  });
}

function calculateTimeRemaining(ms: number): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  return {
    days,
    hours: hours % 24,
    minutes: minutes % 60,
    seconds: seconds % 60,
  };
}

