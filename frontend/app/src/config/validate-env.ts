/**
 * Validate required environment variables
 * Throws error in production if required vars are missing
 * Warns in development
 */
export function validateEnv() {
  const required = [
    'VITE_PACKAGE_ID',
    'VITE_SYSTEM_OBJECT_ID',
  ];
  
  const missing = required.filter(key => !import.meta.env[key]);
  
  if (missing.length > 0 && import.meta.env.PROD) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `Please check your .env file or deployment configuration.`
    );
  }
  
  if (missing.length > 0 && import.meta.env.DEV) {
    console.warn(
      `⚠️ Missing environment variables: ${missing.join(', ')}\n` +
      `Some features may not work correctly. Please check your .env file.`
    );
  }
  
  // Log available env vars in development (without values for security)
  if (import.meta.env.DEV) {
    const available = required.filter(key => import.meta.env[key]);
    if (available.length > 0) {
      console.log(`✅ Environment variables configured: ${available.join(', ')}`);
    }
  }
}

