import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Diagnostic component to catch unknown routes and log them
 * This helps identify what route Slush is trying to use
 */
export default function DiagnosticRoute() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Log the attempted route
    console.log("=== DIAGNOSTIC: Unknown route accessed ===");
    console.log("Path:", location.pathname);
    console.log("Search:", location.search);
    console.log("Hash:", location.hash);
    console.log("Full URL:", window.location.href);
    console.log("=========================================");

    // ALWAYS show alert for mobile debugging (even in production)
    alert(
      `🔍 DIAGNOSTIC - Route Info:\n\n` +
      `Path: ${location.pathname}\n` +
      `Search: ${location.search}\n` +
      `Hash: ${location.hash}\n\n` +
      `Full URL:\n${window.location.href}`
    );

    // Don't auto-redirect - let user read the alert
    // They can manually navigate back
  }, [location]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-gray-50">
      <div className="max-w-md bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4 text-red-600">🔍 Route Diagnostic</h1>
        
        <div className="text-left mb-4 p-4 bg-gray-100 rounded">
          <p className="font-mono text-sm mb-2">
            <strong>Path:</strong> {location.pathname}
          </p>
          <p className="font-mono text-sm mb-2">
            <strong>Search:</strong> {location.search || "(none)"}
          </p>
          <p className="font-mono text-sm">
            <strong>Hash:</strong> {location.hash || "(none)"}
          </p>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          Take a screenshot of this info and share it for debugging.
        </p>
        
        <button 
          onClick={() => navigate("/", { replace: true })}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
}





