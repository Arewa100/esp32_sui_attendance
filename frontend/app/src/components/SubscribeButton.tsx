import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { CONFIG } from "@/config";
import { buildPaySubscriptionTx } from "@/services/transactions";
import { useMultipleObjectMetadata } from "@/hooks/use-object-metadata";
import { useSubscriptionStatus } from "@/hooks/use-subscription-status";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard, CheckCircle2, AlertCircle, Clock } from "lucide-react";

export type SubscribeButtonProps = {
  orgObjectId: string;
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showStatus?: boolean; // Show subscription status badge
  onSuccess?: () => void; // Callback after successful payment
  onError?: (error: Error) => void; // Callback on error
};

/**
 * SubscribeButton Component with Pre-fetching Strategy
 * 
 * Features:
 * - Pre-fetches all required object metadata on mount (system, org, clock)
 * - Shows subscription status and time remaining
 * - Instant wallet popup (< 100ms) using cached metadata
 * - Handles loading, success, and error states
 * 
 * @param orgObjectId - The organisation object ID to subscribe
 * @param variant - Button variant style
 * @param size - Button size
 * @param className - Additional CSS classes
 * @param showStatus - Whether to show subscription status badge
 * @param onSuccess - Callback after successful payment
 * @param onError - Callback on error
 */
export default function SubscribeButton({
  orgObjectId,
  variant = "default",
  size = "default",
  className = "",
  showStatus = true,
  onSuccess,
  onError,
}: SubscribeButtonProps) {
  const navigate = useNavigate();
  const account = useCurrentAccount();
  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();
  const { toast } = useToast();
  const [success, setSuccess] = useState(false);

  const systemObjectId = useMemo(() => CONFIG.SYSTEM_OBJECT_ID, []);

  // Pre-fetch all required object metadata in parallel on mount
  // This eliminates blocking network calls during transaction flow
  const { data: metadataMap, isSuccess: isMetadataReady, isLoading: isLoadingMetadata } = useMultipleObjectMetadata([
    systemObjectId,
    orgObjectId,
    CONFIG.CLOCK_OBJECT_ID,
  ]);

  // Get subscription status
  const { data: subscriptionStatus, isLoading: isLoadingStatus } = useSubscriptionStatus(orgObjectId);

  // Extract cached metadata
  const systemMetadata = metadataMap?.get(systemObjectId || "");
  const orgMetadata = metadataMap?.get(orgObjectId);
  const clockMetadata = metadataMap?.get(CONFIG.CLOCK_OBJECT_ID);

  // Determine if button can be clicked
  const canSubscribe = !!account && 
                       !!orgObjectId && 
                       !!systemObjectId && 
                       !isPending && 
                       !success &&
                       isMetadataReady &&
                       !!systemMetadata &&
                       !!orgMetadata &&
                       !!clockMetadata;

  // Handle successful subscription
  useEffect(() => {
    if (success && onSuccess) {
      onSuccess();
    }
  }, [success, onSuccess]);

  const handleSubscribe = async () => {
    if (!canSubscribe) return;

    setSuccess(false);

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
            setSuccess(true);
            toast({
              title: "Subscription Successful!",
              description: "Your organisation subscription is now active for 30 days.",
              variant: "default",
            });
            // Refetch subscription status after a short delay
            setTimeout(() => {
              if (onSuccess) {
                onSuccess();
              } else {
                // Default: navigate to organisation detail
                navigate(`/organisations/${orgObjectId}`);
              }
            }, 1500);
          },
          onError: (e) => {
            const errorMessage = e.message ?? String(e);
            // Show error toast
            toast({
              title: "Subscription Failed",
              description: errorMessage.includes("rejected") 
                ? "Transaction was rejected. Please try again."
                : errorMessage,
              variant: "destructive",
            });
            if (onError) {
              onError(e instanceof Error ? e : new Error(errorMessage));
            }
          },
        }
      );
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      // Show error toast
      toast({
        title: "Subscription Error",
        description: errorMessage,
        variant: "destructive",
      });
      if (onError) {
        onError(e instanceof Error ? e : new Error(errorMessage));
      }
    }
  };

  // Calculate time remaining display
  const timeRemainingDisplay = useMemo(() => {
    if (!subscriptionStatus?.timeRemaining) return null;
    const { days, hours, minutes } = subscriptionStatus.timeRemaining;
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }, [subscriptionStatus?.timeRemaining]);

  // Button content based on state
  const getButtonContent = () => {
    if (isLoadingMetadata) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Preparing...
        </>
      );
    }

    if (success) {
      return (
        <>
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Subscription Active!
        </>
      );
    }

    if (isPending) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      );
    }

    if (!isMetadataReady) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </>
      );
    }

    if (!account) {
      return (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          Connect Wallet
        </>
      );
    }

    return (
      <>
        <CreditCard className="mr-2 h-4 w-4" />
        Subscribe (10 SUI)
      </>
    );
  };

  return (
    <div className={className}>
      {/* Subscription Status Badge */}
      {showStatus && subscriptionStatus && (
        <div className="flex items-center gap-2 text-sm mb-2">
          {subscriptionStatus.isActive ? (
            <>
              <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Active
              </Badge>
              {timeRemainingDisplay && (
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {timeRemainingDisplay} remaining
                </span>
              )}
            </>
          ) : (
            <Badge variant="destructive">
              <AlertCircle className="mr-1 h-3 w-3" />
              {subscriptionStatus.expiryTimestamp ? "Expired" : "No Subscription"}
            </Badge>
          )}
        </div>
      )}

      {/* Subscribe Button */}
      <Button
        variant={variant}
        size={size}
        onClick={handleSubscribe}
        disabled={!canSubscribe}
        className={size === "sm" ? "" : "w-full"}
      >
        {getButtonContent()}
      </Button>

      {/* Helper Text */}
      {!account && size !== "sm" && (
        <p className="text-xs text-muted-foreground text-center mt-2">
          Connect your wallet to subscribe
        </p>
      )}
      {account && isMetadataReady && !isPending && !success && size !== "sm" && (
        <p className="text-xs text-muted-foreground text-center mt-2">
          10 SUI for 30 days • Instant activation
        </p>
      )}
    </div>
  );
}

