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
      const errorMessage = e?.message || String(e);
      
      // Check for duplicate device error (error code 7)
      if (errorMessage.includes("device_already_registered") || errorMessage.includes("7") || 
          errorMessage.toLowerCase().includes("device") && errorMessage.toLowerCase().includes("already")) {
        setError("Device ID not available. This device is already registered to another organisation.");
      } else if (errorMessage.includes("rejected")) {
        setError("Transaction was rejected. Please try again.");
      } else {
        setError(errorMessage);
      }
      
      setStatus("error");
      toast({
        title: "Registration Failed",
        description: errorMessage.includes("rejected") 
          ? "Transaction was rejected. Please try again."
          : errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link to={`/organisations/${id}`} className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
          <ChevronLeft className="h-4 w-4" />
          Organisation
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-foreground">Register Device</span>
      </div>

      {/* Form Card */}
      <Card className="border-border">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <Smartphone className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-xl">Register Device</CardTitle>
          <CardDescription>
            Register an attendance device (e.g., ESP32 scanner) to your organisation. The device ID will be stored on the blockchain.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!account ? (
              <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                Connect your wallet to register a device.
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="deviceId">Device ID</Label>
              <Input
                id="deviceId"
                placeholder="e.g., ESP32_ATTENDANCE_001"
                value={deviceId}
                onChange={(e) => {
                  setDeviceId(e.target.value);
                  setError(null);
                }}
                disabled={status !== "idle"}
                className={error ? "border-destructive" : ""}
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
                    Registering...
                  </>
                ) : (
                  "Register Device"
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
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


