import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Smartphone, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { buildRegisterDeviceTx } from "@/services/transactions";
import { CONFIG } from "@/config";
import { usePreFetchObjectMetadata } from "@/hooks/use-object-metadata";
import { useToast } from "@/hooks/use-toast";

type TransactionStatus = "idle" | "pending" | "success" | "error";

export default function RegisterDevice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const account = useCurrentAccount();
  const { mutateAsync } = useSignAndExecuteTransaction();
  const { toast } = useToast();
  const [deviceId, setDeviceId] = useState("");
  const [status, setStatus] = useState<TransactionStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const systemObjectId = CONFIG.SYSTEM_OBJECT_ID;
  
  // Pre-fetch object metadata immediately when component mounts
  const { data: systemMetadata, isReady: isSystemMetadataReady } = usePreFetchObjectMetadata(systemObjectId);
  const { data: orgMetadata, isReady: isOrgMetadataReady } = usePreFetchObjectMetadata(id);

  const isMetadataReady = isSystemMetadataReady && isOrgMetadataReady;
  const canSubmit = !!account && !!systemObjectId && !!id && deviceId.trim().length > 0 && status === "idle" && isMetadataReady;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceId.trim()) {
      setError("Device ID is required");
      return;
    }
    if (!id || !systemObjectId) return;
    if (!isMetadataReady) {
      setError("Loading object metadata...");
      return;
    }

    setStatus("pending");
    setError(null);
    try {
      const tx = buildRegisterDeviceTx({
        systemObjectId,
        orgObjectId: id,
        deviceId: deviceId.trim(),
        systemMetadata,
        orgMetadata,
      });
      await mutateAsync({ transaction: tx });
      setStatus("success");
      toast({
        title: "Device Registered",
        description: "Device has been successfully registered to your organisation.",
        variant: "default",
      });
      setTimeout(() => navigate(`/organisations/${id}`), 1500);
    } catch (e: any) {
      const userMessage = sanitizeErrorMessage(e);
      logError(e, "RegisterDevice");
      
      setError(userMessage);
      setStatus("error");
      toast({
        title: "Registration Failed",
        description: userMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-xl mx-auto px-4 sm:px-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs sm:text-sm overflow-x-auto">
        <Link to={`/organisations/${id}`} className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 min-h-[44px] flex-shrink-0">
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Organisation</span>
          <span className="sm:hidden">Org</span>
        </Link>
        <span className="text-muted-foreground flex-shrink-0">/</span>
        <span className="text-foreground truncate">Register Device</span>
      </div>

      {/* Form Card */}
      <Card className="border-border">
        <CardHeader className="text-center pb-2 p-4 sm:p-6">
          <div className="mx-auto mb-3 sm:mb-4 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-primary/10">
            <Smartphone className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
          </div>
          <CardTitle className="text-lg sm:text-xl">Register Device</CardTitle>
          <CardDescription className="text-sm sm:text-base px-2">
            Register an attendance device (e.g., ESP32 scanner) to your organisation. The device ID will be stored on the blockchain.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!account ? (
              <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                Connect your wallet to register a device.
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="deviceId" className="text-sm sm:text-base">Device ID</Label>
              <Input
                id="deviceId"
                placeholder="e.g., ESP32_ATTENDANCE_001"
                value={deviceId}
                onChange={(e) => {
                  setDeviceId(e.target.value);
                  setError(null);
                }}
                disabled={status !== "idle"}
                className={`min-h-[44px] ${error ? "border-destructive" : ""}`}
              />
              <p className="text-xs text-muted-foreground">
                Enter the unique device identifier for your attendance scanner.
              </p>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>

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
                      <p className="text-sm font-medium text-foreground">Device Registered!</p>
                      <p className="text-xs text-muted-foreground">Redirecting to organisation...</p>
                    </div>
                  </>
                )}
                {status === "error" && (
                  <>
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Registration Failed</p>
                      <p className="text-xs text-muted-foreground">Please try again.</p>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button 
                type="submit" 
                className="flex-1 md:h-11 text-xs sm:text-sm"
                disabled={!canSubmit}
              >
                {!isMetadataReady ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Preparing...</span>
                    <span className="sm:hidden">Preparing</span>
                  </>
                ) : status === "pending" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Registering...</span>
                    <span className="sm:hidden">Registering</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Register Device</span>
                    <span className="sm:hidden">Register</span>
                  </>
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="md:h-11 text-xs sm:text-sm"
                onClick={() => navigate(`/organisations/${id}`)}
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


