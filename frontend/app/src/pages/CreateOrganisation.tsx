import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Building2, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { CONFIG } from "@/config";
import { buildCreateOrganisationTx } from "@/services/transactions";
import { usePreFetchObjectMetadata } from "@/hooks/use-object-metadata";
import { sanitizeErrorMessage, logError } from "@/utils/error-handler";

type TransactionStatus = "idle" | "pending" | "success" | "error";

export default function CreateOrganisation() {
  const navigate = useNavigate();
  const account = useCurrentAccount();
  const { mutateAsync } = useSignAndExecuteTransaction();
  const [name, setName] = useState("");
  const [status, setStatus] = useState<TransactionStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const systemObjectId = useMemo(() => CONFIG.SYSTEM_OBJECT_ID, []);
  
  // Pre-fetch system object metadata immediately when component mounts
  // This eliminates blocking network calls during transaction flow
  const { data: systemMetadata, isReady: isMetadataReady } = usePreFetchObjectMetadata(systemObjectId);

  const canSubmit = !!account && !!systemObjectId && name.trim().length > 0 && status === "idle" && isMetadataReady;

  // Pre-fetch metadata on mount
  useEffect(() => {
    if (systemObjectId && !systemMetadata) {
      // Metadata will be fetched automatically by the hook
    }
  }, [systemObjectId, systemMetadata]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!isMetadataReady) {
      setError("Loading object metadata...");
      return;
    }

    setError(null);
    setStatus("pending");
    try {
      // Use cached metadata - no blocking network calls here!
      const tx = buildCreateOrganisationTx({ 
        systemObjectId, 
        name: name.trim(),
        systemMetadata 
      });
      // Wallet popup appears immediately - no delays!
      await mutateAsync({ transaction: tx });
      setStatus("success");
      setTimeout(() => navigate("/organisations"), 1000);
    } catch (e) {
      const userMessage = sanitizeErrorMessage(e);
      logError(e, "CreateOrganisation");
      setError(userMessage);
      setStatus("error");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-xl mx-auto px-4 sm:px-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs sm:text-sm overflow-x-auto">
        <Link to="/organisations" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 min-h-[44px] flex-shrink-0">
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Organisations</span>
          <span className="sm:hidden">Orgs</span>
        </Link>
        <span className="text-muted-foreground flex-shrink-0">/</span>
        <span className="text-foreground truncate">Create New</span>
      </div>

      {/* Form Card */}
      <Card className="border-border">
        <CardHeader className="text-center pb-2 p-4 sm:p-6">
          <div className="mx-auto mb-3 sm:mb-4 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-primary/10">
            <Building2 className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
          </div>
          <CardTitle className="text-lg sm:text-xl">Create Organisation</CardTitle>
          <CardDescription className="text-sm sm:text-base px-2">
            Create a new organisation on the Sui blockchain. A transaction will be submitted to create the organisation record.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {!CONFIG.SYSTEM_OBJECT_ID && import.meta.env.DEV ? (
              <div className="rounded-lg bg-orange-50 border border-orange-100 p-3 text-sm text-orange-800">
                Missing system object ID. Set <span className="font-mono">VITE_SYSTEM_OBJECT_ID</span> in{" "}
                <span className="font-mono">frontend/app/.env</span>.
              </div>
            ) : null}

            {!account ? (
              <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                Connect your wallet to create an organisation.
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="name">Organisation Name</Label>
              <Input
                id="name"
                placeholder="Enter organisation name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={status !== "idle"}
              />
            </div>

            {error ? (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            {/* Transaction Status */}
            {status !== "idle" && (
              <div className={`flex items-center gap-3 p-4 rounded-lg ${
                status === "pending" ? "bg-muted" :
                status === "success" ? "bg-primary/10" :
                "bg-destructive/10"
              }`}>
                {status === "pending" && (
                  <>
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Transaction Pending</p>
                      <p className="text-xs text-muted-foreground">Waiting for blockchain confirmation...</p>
                    </div>
                  </>
                )}
                {status === "success" && (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Organisation Created!</p>
                      <p className="text-xs text-muted-foreground">Redirecting to organisations...</p>
                    </div>
                  </>
                )}
                {status === "error" && (
                  <>
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Transaction Failed</p>
                      <p className="text-xs text-muted-foreground">Please try again.</p>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button 
                type="submit" 
                className="flex-1"
                disabled={!canSubmit}
              >
                {!isMetadataReady ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Preparing...
                  </>
                ) : status === "pending" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Organisation"
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate("/organisations")}
                disabled={status === "pending"}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
