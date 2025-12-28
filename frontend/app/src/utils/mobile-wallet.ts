/**
 * Mobile wallet connection utilities
 * Handles deep linking to mobile Sui wallets (e.g., myslush.app)
 */

/**
 * Detects if the current device is a mobile device
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check user agent
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
  
  // Check screen width (mobile is typically < 768px)
  const isSmallScreen = window.innerWidth < 768;
  
  // Check touch capability
  const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  return mobileRegex.test(userAgent) || (isSmallScreen && hasTouchScreen);
}

/**
 * Gets the current network from the URL or defaults to testnet
 */
export function getCurrentNetwork(): 'testnet' | 'mainnet' | 'devnet' {
  if (typeof window === 'undefined') return 'testnet';
  
  // Check URL for network parameter
  const urlParams = new URLSearchParams(window.location.search);
  const networkParam = urlParams.get('network');
  
  if (networkParam === 'mainnet' || networkParam === 'testnet' || networkParam === 'devnet') {
    return networkParam;
  }
  
  // Check localStorage for saved network preference
  try {
    const savedNetwork = localStorage.getItem('sui-network');
    if (savedNetwork === 'mainnet' || savedNetwork === 'testnet' || savedNetwork === 'devnet') {
      return savedNetwork;
    }
  } catch (e) {
    // Ignore localStorage errors
  }
  
  // Default to testnet
  return 'testnet';
}

/**
 * Generates a unique request ID (UUID v4)
 */
function generateRequestId(): string {
  if (typeof window === 'undefined') {
    // Fallback for SSR
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  // Use crypto.randomUUID if available (modern browsers)
  if (crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback UUID generation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Gets the current app URL (full URL)
 * Uses the complete current URL so myslush.app can redirect back properly
 * Must be a complete, valid HTTPS URL (myslush.app requires this)
 * 
 * IMPORTANT: myslush.app cannot redirect to local IPs or HTTP URLs.
 * For development, use VITE_PUBLIC_APP_URL environment variable.
 */
function getAppUrl(): string {
  if (typeof window === 'undefined') return '';
  
  // Check for production URL in environment variable (for development/testing)
  const prodUrl = import.meta.env.VITE_PUBLIC_APP_URL;
  if (prodUrl && prodUrl.startsWith('https://')) {
    // Use production URL if available (useful for development)
    return prodUrl.endsWith('/') ? prodUrl : prodUrl + '/';
  }
  
  // Construct the complete URL from location
  // Use origin + pathname to ensure we have a complete URL
  // Remove hash and query params for cleaner redirect
  let url = `${window.location.origin}${window.location.pathname}`;
  
  // Ensure URL is valid and complete
  // Must start with http:// or https://
  if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
    // Fallback: construct from location properties
    const protocol = window.location.protocol || 'https:';
    const host = window.location.host || window.location.hostname;
    const pathname = window.location.pathname || '/';
    url = `${protocol}//${host}${pathname}`;
  }
  
  // Ensure URL ends with / if pathname is empty (root)
  if (!url.endsWith('/') && window.location.pathname === '/') {
    url = url + '/';
  }
  
  // Check if URL is localhost or local IP (won't work with myslush.app)
  const urlObj = new URL(url);
  const hostname = urlObj.hostname;
  const isLocal = hostname === 'localhost' || 
                  hostname === '127.0.0.1' || 
                  hostname.startsWith('192.168.') ||
                  hostname.startsWith('172.') ||
                  hostname.startsWith('10.') ||
                  hostname === '[::1]';
  
  // Check if using HTTP (not allowed for mobile wallet redirects)
  const isHttp = url.startsWith('http://');
  
  // If local or HTTP, we need to use production URL or show error
  if (isLocal || isHttp) {
    if (import.meta.env.DEV) {
      console.warn('⚠️ Mobile wallet connection requires a public HTTPS URL.');
      console.warn('Current URL:', url, 'is not accessible from myslush.app');
      console.warn('Set VITE_PUBLIC_APP_URL in your .env file to your production URL');
    }
    
    // If we have a production URL from env, use it
    if (prodUrl) {
      return prodUrl.endsWith('/') ? prodUrl : prodUrl + '/';
    }
    
    // For development, show a user-friendly error
    if (import.meta.env.DEV) {
      // In development, we can't redirect to local URLs
      // Show alert to user explaining the issue (DEV ONLY)
      alert(
        'Mobile wallet connection requires a public HTTPS URL.\n\n' +
        'Your current URL (' + url + ') is not accessible from myslush.app.\n\n' +
        'Solutions:\n' +
        '1. Deploy your app and test on the deployed version\n' +
        '2. Use a tunneling service (ngrok, etc.) to expose your local server\n' +
        '3. Set VITE_PUBLIC_APP_URL in .env to your production URL'
      );
      throw new Error(
        'Mobile wallet connection requires a public HTTPS URL. ' +
        'Local development URLs (localhost, local IPs, HTTP) are not supported.'
      );
    }
    
    // In production, if we don't have a valid URL, silently fail
    // This should never happen if the app is properly deployed
    // But we don't want to show errors to users
    if (import.meta.env.PROD) {
      // In production, try to use the current URL anyway
      // If it fails, myslush.app will handle the error gracefully
      return url;
    }
  }
  
  // Validate it's a proper URL
  try {
    new URL(url);
    return url;
  } catch (e) {
    // If URL construction fails, use a safe fallback
    if (import.meta.env.DEV) {
      console.warn('Invalid URL constructed, using fallback:', url);
    }
    return window.location.origin || 'https://localhost';
  }
}

/**
 * Generates the mobile wallet deep link URL
 * Uses the correct myslush.app format: https://my.slush.app/dapp-request#<base64_json>
 * 
 * Based on the format from walrus.xyz, the request should include:
 * - version: "1"
 * - requestId: unique UUID
 * - appUrl: the app URL to redirect back to
 */
export function getMobileWalletConnectUrl(): string {
  const appUrl = getAppUrl();
  const requestId = generateRequestId();
  
  // Create the request object matching myslush.app format
  // Based on: https://my.slush.app/dapp-request#<base64>
  // Structure that myslush.app expects - must match exactly
  const requestData: {
    version: string;
    requestId: string;
    appUrl: string;
  } = {
    version: "1",
    requestId: requestId,
    appUrl: appUrl
  };
  
  // Validate appUrl is complete and valid
  if (!appUrl || appUrl.trim() === '' || !appUrl.includes('://')) {
    if (import.meta.env.DEV) {
      console.error('Invalid appUrl for wallet connection:', appUrl);
    }
    // Fallback: construct complete URL from current location
    const protocol = typeof window !== 'undefined' ? window.location.protocol : 'https:';
    const host = typeof window !== 'undefined' ? window.location.host : 'localhost';
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
    requestData.appUrl = `${protocol}//${host}${pathname}`;
  }
  
  // Final validation: ensure appUrl is a valid URL
  try {
    new URL(requestData.appUrl);
  } catch (e) {
    if (import.meta.env.DEV) {
      console.error('appUrl is not a valid URL:', requestData.appUrl);
    }
    // Last resort fallback
    requestData.appUrl = typeof window !== 'undefined' 
      ? `${window.location.protocol}//${window.location.host}/`
      : 'https://localhost/';
  }
  
  // Convert to JSON and base64 encode
  // JSON is ASCII-safe, so btoa() works directly
  // Use standard base64 (not URL-safe) as myslush.app expects standard base64
  let jsonString: string = '';
  let base64Encoded: string = '';
  
  try {
    // Stringify with compact format (no spaces) to match exact format
    jsonString = JSON.stringify(requestData);
    
    // Encode to base64
    base64Encoded = btoa(jsonString);
    
    // Validate the base64 encoding worked
    if (!base64Encoded || base64Encoded.length === 0) {
      throw new Error('Base64 encoding resulted in empty string');
    }
    
    // Verify we can decode it back (sanity check)
    try {
      const decoded = atob(base64Encoded);
      const parsed = JSON.parse(decoded);
      if (parsed.version !== requestData.version || 
          parsed.requestId !== requestData.requestId ||
          parsed.appUrl !== requestData.appUrl) {
        if (import.meta.env.DEV) {
          console.warn('Base64 decode verification mismatch:', { parsed, requestData });
        }
      }
    } catch (verifyError) {
      if (import.meta.env.DEV) {
        console.warn('Base64 verification check failed (non-critical):', verifyError);
      }
      // Don't throw - this is just a sanity check
    }
    
    // Use the correct myslush.app format
    // Format: https://my.slush.app/dapp-request#<base64_encoded_json>
    // Note: Hash fragments (#) don't get URL-encoded, so standard base64 is fine
    const connectUrl = `https://my.slush.app/dapp-request#${base64Encoded}`;
    
    return connectUrl;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Failed to encode wallet request:', error, { requestData, jsonString });
    }
    throw new Error('Failed to create wallet connection request');
  }
}

/**
 * Opens the mobile wallet connection
 * Redirects to my.slush.app using the correct dapp-request format
 */
export function connectMobileWallet(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const connectUrl = getMobileWalletConnectUrl();
    
    // Store the URL in sessionStorage for debugging (can be checked on mobile)
    try {
      sessionStorage.setItem('last_wallet_connect_url', connectUrl);
      // Also store the decoded JSON for debugging
      const hashPart = connectUrl.split('#')[1];
      if (hashPart) {
        try {
          const decoded = atob(hashPart);
          sessionStorage.setItem('last_wallet_connect_json', decoded);
          // Also store in localStorage for easier access
          localStorage.setItem('last_wallet_connect_json', decoded);
          localStorage.setItem('last_wallet_connect_url', connectUrl);
        } catch (e) {
          // Ignore decode errors
        }
      }
    } catch (e) {
      // Ignore sessionStorage errors
    }
    
    // Store in a global variable for debugging (visible in window object)
    if (typeof window !== 'undefined') {
      (window as any).__lastWalletConnectUrl = connectUrl;
      const hashPart = connectUrl.split('#')[1];
      if (hashPart) {
        try {
          (window as any).__lastWalletConnectJson = atob(hashPart);
        } catch (e) {
          // Ignore
        }
      }
    }
    
    // Redirect to myslush.app
    // Use href for maximum compatibility across mobile browsers
    // Format: https://my.slush.app/dapp-request#<base64_encoded_json>
    // The app will handle the connection and redirect back to appUrl
    window.location.href = connectUrl;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Failed to open mobile wallet:', error);
      // Only show alert in development
      alert('Failed to open wallet. Please try again.');
    }
    // In production, silently fail - user will see the error from myslush.app if needed
    // We don't want to show technical errors to end users
  }
}

/**
 * Checks if we're returning from a mobile wallet connection
 * This can be used to detect when user returns to the app after connecting
 */
export function isReturningFromWallet(): boolean {
  if (typeof window === 'undefined') return false;
  
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.has('wallet_connected') || urlParams.has('connected');
}

