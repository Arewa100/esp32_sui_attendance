export const CONFIG = {
  // Set these after deploying your Move package (or via Vite envs if you prefer).
  PACKAGE_ID: import.meta.env.VITE_PACKAGE_ID ?? "",
  SYSTEM_OBJECT_ID: import.meta.env.VITE_SYSTEM_OBJECT_ID ?? "",
  CLOCK_OBJECT_ID: "0x6",
  MODULE: "attendance_system",
  FUNCTIONS_MODULE: "attendance_system"
} as const;

export function contractTarget(functionName: string) {
  if (!CONFIG.PACKAGE_ID) {
    throw new Error("Missing VITE_PACKAGE_ID in frontend/app/.env");
  }
  return `${CONFIG.PACKAGE_ID}::${CONFIG.FUNCTIONS_MODULE}::${functionName}`;
}








