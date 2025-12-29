/**
 * Validate required environment variables
 * Logs warnings instead of throwing to prevent white screen
 * Returns validation status
 */
export function validateEnv(): { isValid: boolean; missing: string[] } {
  const required = [
    'VITE_PACKAGE_ID',
    'VITE_SYSTEM_OBJECT_ID',
  ];
  
  const missing = required.filter(key => !import.meta.env[key]);
  
  if (missing.length > 0) {
    const message = `Missing required environment variables: ${missing.join(', ')}\n` +
      `Please check your deployment configuration.`;
    
    if (import.meta.env.PROD) {
      // In production, log error but don't throw to prevent white screen
      console.error('❌ Environment Variable Error:', message);
      console.error('Available env vars:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')));
    } else {
      console.warn('⚠️', message);
    }
    
    return { isValid: false, missing };
  }
  
  // Log available env vars in development (without values for security)
  if (import.meta.env.DEV) {
    console.log(`✅ Environment variables configured: ${required.join(', ')}`);
  }
  
  return { isValid: true, missing: [] };
}

