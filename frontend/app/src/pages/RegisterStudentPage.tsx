import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PhoneShell from "@/components/PhoneShell";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { buildRegisterStudentTx } from "@/services/transactions";
import { usePreFetchObjectMetadata } from "@/hooks/use-object-metadata";
import { sanitizeErrorMessage, logError } from "@/utils/error-handler";
import PageBackground from "@/components/PageBackground";

export default function RegisterStudentPage() {
  const navigate = useNavigate();
  const { orgObjectId } = useParams();
  const account = useCurrentAccount();
  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [cardId, setCardId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: orgMetadata, isReady: isMetadataReady } = usePreFetchObjectMetadata(orgObjectId);

  const canSubmit =
    !!account &&
    !!orgObjectId &&
    fullName.trim().length > 0 &&
    department.trim().length > 0 &&
    cardId.trim().length > 0 &&
    !isPending &&
    isMetadataReady;

  return (
    <PhoneShell className="relative">
      <PageBackground />
      <div className="sticky top-0 z-20 flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between border-b border-gray-200 dark:border-gray-800">
        <button
          className="text-text-main dark:text-white flex size-12 shrink-0 items-center justify-center rounded-full active:bg-gray-200 dark:active:bg-gray-800 transition-colors cursor-pointer"
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
        >
          <span className="material-symbols-outlined text-[24px]">
            arrow_back_ios_new
          </span>
        </button>
        <h2 className="text-text-main dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
          Register Student
        </h2>
      </div>

      <div className="flex-1 flex flex-col items-center w-full max-w-md mx-auto pb-24">
        <div className="w-full px-4 pt-6 pb-2">
          <div className="flex items-stretch justify-between gap-4 rounded-xl bg-white dark:bg-[#1a222d] p-4 shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="flex flex-col gap-1 flex-[2_2_0px] justify-center">
              <p className="text-text-light text-xs font-semibold uppercase tracking-wider">
                Registering For
              </p>
              <p className="text-text-main dark:text-white text-base font-bold leading-tight">
                Organisation
              </p>
              <p className="text-text-light text-sm font-normal leading-normal font-mono">
                {orgObjectId ?? ""}
              </p>
            </div>
            <div
              className="w-16 h-16 bg-center bg-no-repeat bg-cover rounded-lg flex-shrink-0 bg-gray-100 dark:bg-gray-700"
              aria-label="Organisation logo"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuC5lN3MlbfDvW3MTm0Laou0A0w26Sj8PFPeTFpsi--jlxXhAazuGpXRwmrIRns7HRszxBjPZzETcmmk-1CsgDqmly32ovdHOp4W3CM2acHHfYBSx6ToYK34C85fnaCEA_y8jjE-kkoEk0cKNcRlAjKxT4G_9_vdR1adJKm1uLvCmDyFt-bSDAQBLuPSAFtceILSVnEM8GUhqnMVQjvhZ3LRgWD6jW7ryLoL_ZJWZL5EoPmdtRPrVtVWa_wuaeJcRD0CT4ZH2vD8mqg")'
              }}
            />
          </div>
        </div>

        <div className="w-full flex flex-col gap-2 mt-2">
          <div className="flex w-full flex-col gap-1 px-4 py-2">
            <label className="flex flex-col min-w-40 flex-1">
              <p className="text-text-main dark:text-white text-sm font-medium leading-normal pb-2 ml-1">
                Student Full Name
              </p>
              <input
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-text-main dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/20 border border-[#dbdfe6] dark:border-gray-700 bg-white dark:bg-[#1a222d] focus:border-primary h-14 placeholder:text-text-light p-[15px] text-base font-normal leading-normal transition-all"
                placeholder="e.g., Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </label>
          </div>

          <div className="flex w-full flex-col gap-1 px-4 py-2">
            <label className="flex flex-col min-w-40 flex-1">
              <p className="text-text-main dark:text-white text-sm font-medium leading-normal pb-2 ml-1">
                Department
              </p>
              <div className="relative">
                <select
                  className="form-select w-full rounded-xl text-text-main dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/20 border border-[#dbdfe6] dark:border-gray-700 bg-white dark:bg-[#1a222d] focus:border-primary h-14 pl-[15px] pr-10 text-base font-normal leading-normal appearance-none transition-all cursor-pointer"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  <option value="">Select Department</option>
                  <option value="cs">Computer Science</option>
                  <option value="ee">Electrical Engineering</option>
                  <option value="me">Mechanical Engineering</option>
                  <option value="ba">Business Administration</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-light">
                  <span className="material-symbols-outlined">expand_more</span>
                </div>
              </div>
            </label>
          </div>

          <div className="flex w-full flex-col gap-1 px-4 py-2">
            <label className="flex flex-col min-w-40 flex-1">
              <div className="flex justify-between items-center pb-2 ml-1">
                <p className="text-text-main dark:text-white text-sm font-medium leading-normal">
                  RFID Card ID
                </p>
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full hidden">
                  Unique
                </span>
              </div>
              <div className="flex w-full flex-1 items-stretch rounded-xl shadow-sm">
                <input
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-l-xl text-text-main dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/20 border border-[#dbdfe6] dark:border-gray-700 bg-white dark:bg-[#1a222d] focus:border-primary h-14 placeholder:text-text-light p-[15px] border-r-0 text-base font-normal leading-normal transition-all"
                  placeholder="Tap to scan or enter ID"
                  value={cardId}
                  onChange={(e) => setCardId(e.target.value)}
                />
                <button
                  className="text-primary hover:bg-primary/10 flex border border-[#dbdfe6] dark:border-gray-700 bg-white dark:bg-[#1a222d] items-center justify-center px-4 rounded-r-xl border-l-0 transition-all cursor-pointer group"
                  type="button"
                >
                  <span className="material-symbols-outlined group-hover:scale-110 transition-transform">
                    nfc
                  </span>
                  <span className="ml-2 text-sm font-semibold hidden sm:block">
                    Scan
                  </span>
                </button>
              </div>
            </label>
            <div className="flex items-start gap-2 pt-2 px-1">
              <span className="material-symbols-outlined text-text-light text-[18px] mt-0.5">
                info
              </span>
              <p className="text-text-light text-xs font-normal leading-normal">
                Ensure the RFID card is not already assigned to another student
                on the chain.
              </p>
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="px-4 pb-28">
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 p-4 text-sm text-red-800 dark:text-red-200">
            {error}
          </div>
        </div>
      ) : null}

      <div className="fixed bottom-0 w-full max-w-md left-1/2 -translate-x-1/2 bg-background-light dark:bg-background-dark border-t border-gray-200 dark:border-gray-800 p-4 pb-8 z-30">
        <button
          className="flex w-full min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 px-5 bg-primary/10 text-primary text-base font-bold leading-normal tracking-[0.015em] hover:bg-primary/20 transition-colors shadow-lg shadow-primary/20 disabled:opacity-60 disabled:hover:bg-primary/10"
          type="button"
          disabled={!canSubmit}
          onClick={() => {
            setError(null);
            if (!orgObjectId) {
              setError("Missing organisation object id in route.");
              return;
            }
            if (!department.trim()) {
              setError("Select a department.");
              return;
            }
            if (!isMetadataReady) {
              setError("Loading object metadata...");
              return;
            }
            try {
              const tx = buildRegisterStudentTx({
                orgObjectId,
                name: fullName.trim(),
                department: department.trim(),
                cardId: cardId.trim(),
                orgMetadata,
              });
              signAndExecute(
                { transaction: tx },
                {
                  onSuccess: () => navigate(`/orgs/${orgObjectId}`),
                  onError: (e) => {
                    logError(e, "RegisterStudentPage");
                    setError(sanitizeErrorMessage(e));
                  }
                }
              );
            } catch (e) {
              logError(e, "RegisterStudentPage");
              setError(sanitizeErrorMessage(e));
            }
          }}
        >
          <span className="truncate">{!isMetadataReady ? "Preparing..." : isPending ? "Registering..." : "Register Student"}</span>
        </button>
      </div>
    </PhoneShell>
  );
}


