/**
 * Sanitizes error messages for user display
 * Prevents exposing internal errors, stack traces, or technical details
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (!error) {
    return "An unexpected error occurred. Please try again.";
  }

  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerMessage = errorMessage.toLowerCase();

  // Handle known user-friendly error patterns
  if (lowerMessage.includes("rejected") || lowerMessage.includes("user rejected")) {
    return "Transaction was rejected. Please try again.";
  }

  if (lowerMessage.includes("insufficient") && lowerMessage.includes("balance")) {
    return "Insufficient balance. Please add more funds to your wallet.";
  }

  if (lowerMessage.includes("device_already_registered") || 
      lowerMessage.includes("device") && lowerMessage.includes("already")) {
    return "Device ID not available. This device is already registered to another organisation.";
  }

  if (lowerMessage.includes("student") && lowerMessage.includes("already")) {
    return "Student with this card ID is already registered.";
  }

  if (lowerMessage.includes("network") || lowerMessage.includes("connection")) {
    return "Network error. Please check your connection and try again.";
  }

  if (lowerMessage.includes("timeout")) {
    return "Request timed out. Please try again.";
  }

  // Check for technical error patterns that should be hidden
  const technicalPatterns = [
    /stack trace/i,
    /at \w+\.\w+/i, // Stack trace patterns
    /error code/i,
    /exception/i,
    /undefined/i,
    /null/i,
    /\[object object\]/i,
    /\.env/i, // Environment file references
    /vite/i,
    /node_modules/i,
    /internal/i,
  ];

  for (const pattern of technicalPatterns) {
    if (pattern.test(errorMessage)) {
      return "An unexpected error occurred. Please try again.";
    }
  }

  // If error message is too long or contains suspicious characters, sanitize it
  if (errorMessage.length > 200 || /[<>{}[\]]/.test(errorMessage)) {
    return "An unexpected error occurred. Please try again.";
  }

  // For unknown errors, return a generic message in production
  if (import.meta.env.PROD) {
    return "An unexpected error occurred. Please try again.";
  }

  // In development, show the actual error for debugging
  return errorMessage;
}

/**
 * Logs error to console (development only) or error tracking service (production)
 */
export function logError(error: unknown, context?: string) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorDetails = error instanceof Error ? error.stack : String(error);

  if (import.meta.env.DEV) {
    if (context) {
      console.error(`[${context}]`, error, errorDetails);
    } else {
      console.error("Error:", error, errorDetails);
    }
  } else {
    // In production, send to error tracking service (e.g., Sentry, LogRocket)
    // Example:
    // if (window.Sentry) {
    //   window.Sentry.captureException(error, { contexts: { custom: { context } } });
    // }
  }
}

