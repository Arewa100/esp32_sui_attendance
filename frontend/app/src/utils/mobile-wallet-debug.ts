/**
 * Debug utility to display the generated wallet connection URL
 * This can be used to verify the URL format on mobile devices
 */

export function getDebugInfo(): {
  url: string;
  json: string;
  isValid: boolean;
} {
  if (typeof window === 'undefined') {
    return { url: '', json: '', isValid: false };
  }

  try {
    const url = (window as any).__lastWalletConnectUrl || 
                sessionStorage.getItem('last_wallet_connect_url') ||
                localStorage.getItem('last_wallet_connect_url') ||
                '';
    
    const json = (window as any).__lastWalletConnectJson ||
                 sessionStorage.getItem('last_wallet_connect_json') ||
                 localStorage.getItem('last_wallet_connect_json') ||
                 '';

    // Try to decode if we have URL but not JSON
    if (url && !json) {
      const hashPart = url.split('#')[1];
      if (hashPart) {
        try {
          const decoded = atob(hashPart);
          return { url, json: decoded, isValid: true };
        } catch (e) {
          // Ignore
        }
      }
    }

    return { url, json, isValid: !!url && !!json };
  } catch (e) {
    return { url: '', json: '', isValid: false };
  }
}

/**
 * Display debug info in an alert (for mobile testing)
 * DEV ONLY - Never shows in production
 */
export function showDebugInfo(): void {
  // Only allow in development mode
  if (!import.meta.env.DEV) {
    return;
  }
  
  const info = getDebugInfo();
  if (info.isValid) {
    alert(`Wallet Connect URL:\n${info.url}\n\nDecoded JSON:\n${info.json}`);
  } else {
    alert('No wallet connection URL found. Please try connecting first.');
  }
}

