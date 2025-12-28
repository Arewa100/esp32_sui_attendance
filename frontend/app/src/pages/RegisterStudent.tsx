import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Users, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { buildRegisterStudentTx } from "@/services/transactions";
import { usePreFetchObjectMetadata } from "@/hooks/use-object-metadata";
import { sanitizeErrorMessage, logError } from "@/utils/error-handler";

type TransactionStatus = "idle" | "pending" | "success" | "error";

export default function RegisterStudent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const account = useCurrentAccount();
  const { mutateAsync } = useSignAndExecuteTransaction();
  const [formData, setFormData] = useState({
    name: "",
    cardId: "",
    department: ""
  });
  const [status, setStatus] = useState<TransactionStatus>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Pre-fetch organisation object metadata immediately when component mounts
  // This eliminates blocking network calls during transaction flow
  const { data: orgMetadata, isReady: isMetadataReady } = usePreFetchObjectMetadata(id);

  // Pre-fetch metadata on mount
  useEffect(() => {
    if (id && !orgMetadata) {
      // Metadata will be fetched automatically by the hook
    }
  }, [id, orgMetadata]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.cardId.trim()) newErrors.cardId = "Card ID is required";
    if (!formData.department.trim()) newErrors.department = "Department is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!id) return;
    if (!isMetadataReady) {
      setSubmitError("Loading object metadata...");
      return;
    }

    setStatus("pending");
    setSubmitError(null);
    try {
      // Use cached metadata - no blocking network calls here!
      const tx = buildRegisterStudentTx({
        orgObjectId: id,
        name: formData.name.trim(),
        cardId: formData.cardId.trim(),
        department: formData.department.trim(),
        orgMetadata, // Pass cached metadata
      });
      // Wallet popup appears immediately - no delays!
      await mutateAsync({ transaction: tx });
      setStatus("success");
      setTimeout(() => navigate(`/organisations/${id}`), 1000);
    } catch (e) {
      const userMessage = sanitizeErrorMessage(e);
      logError(e, "RegisterStudent");
      setSubmitError(userMessage);
      setStatus("error");
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
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
        <span className="text-foreground">Register Student</span>
      </div>

      {/* Form Card */}
      <Card className="border-border">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <Users className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-xl">Register Student</CardTitle>
          <CardDescription>
            Register a new student with their RFID card. The student's information will be stored on the blockchain.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!account ? (
              <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                Connect your wallet to register a student.
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="name">Student Name</Label>
              <Input
                id="name"
                placeholder="Enter student name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                disabled={status !== "idle"}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cardId">RFID Card ID</Label>
              <Input
                id="cardId"
                placeholder="e.g., RFID-001"
                value={formData.cardId}
                onChange={(e) => handleChange("cardId", e.target.value)}
                disabled={status !== "idle"}
                className={errors.cardId ? "border-destructive" : ""}
              />
              {errors.cardId && <p className="text-xs text-destructive">{errors.cardId}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                placeholder="e.g., Computer Science"
                value={formData.department}
                onChange={(e) => handleChange("department", e.target.value)}
                disabled={status !== "idle"}
                className={errors.department ? "border-destructive" : ""}
              />
              {errors.department && <p className="text-xs text-destructive">{errors.department}</p>}
            </div>

            {submitError ? (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {submitError}
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
                      <p className="text-sm font-medium text-foreground">Student Registered!</p>
                      <p className="text-xs text-muted-foreground">Redirecting to organisation...</p>
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

            <div className="flex gap-3 pt-2">
              <Button 
                type="submit" 
                className="flex-1"
                disabled={status !== "idle" || !account || !isMetadataReady}
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
                  "Register Student"
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
