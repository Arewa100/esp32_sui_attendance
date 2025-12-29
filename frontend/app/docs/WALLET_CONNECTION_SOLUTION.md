# Mobile Wallet Connection Solution Documentation

## Problem Summary

The application was experiencing wallet connection issues on mobile devices. When users tried to connect their wallet on mobile, they were prompted to "Install Extension" instead of being redirected to the Slush web wallet (`my.slush.app`), which is the expected behavior for mobile wallet connections.

### Error Symptoms

- **Desktop**: Worked correctly with browser extensions
- **Mobile**: Showed "Install Extension" error instead of opening `my.slush.app`
- **Expected Behavior**: Mobile should automatically open Slush web wallet (like `walrus.xyz` does)

## Root Cause Analysis

### Initial Investigation

1. **First Attempt - Custom Deep Links**: 
   - Implemented custom deep link generation to `my.slush.app`
   - Created manual mobile detection and URL encoding
   - Result: Still showed "Install Extension" error

2. **Second Attempt - Official dapp-kit Support**:
   - Discovered `@mysten/dapp-kit` has built-in Slush wallet support via `slushWallet` prop
   - Added `slushWallet={{ name: 'Sui Attendance System' }}` to `WalletProvider`
   - Simplified `MobileConnectButton` to use standard `ConnectButton`
   - Result: Still had issues with URL format on mobile

3. **Final Solution - Hybrid Approach**:
   - **Desktop**: Use official `slushWallet` prop with standard `ConnectButton` (handles browser extensions)
   - **Mobile**: Use custom deep links with proven URL format that Slush web wallet expects
   - Result: ✅ **WORKING** - Mobile opens `my.slush.app` correctly

## The Solution

### Implementation Details

#### 1. WalletProvider Configuration (`src/main.tsx`)

```tsx
<WalletProvider 
  autoConnect
  slushWallet={{
    name: 'Sui Attendance System',
    origin: import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin,
  }}
>
```

**Why this works:**
- Enables official Slush wallet support for desktop extensions
- Provides app metadata to Slush wallet
- Sets the origin for proper redirect handling

#### 2. Hybrid MobileConnectButton (`src/components/MobileConnectButton.tsx`)

```tsx
// Desktop: Uses standard ConnectButton (official Slush extension support)
// Mobile: Uses custom deep link (correct format that Slush expects)
```

**Key Logic:**
- Detects mobile devices using `isMobileDevice()` utility
- **Mobile**: Uses custom `connectMobileWallet()` function with proven URL format
- **Desktop**: Uses standard `ConnectButton` which handles Slush extension automatically

#### 3. Custom Deep Link Implementation (`src/utils/mobile-wallet.ts`)

The custom deep link uses the exact format that Slush web wallet expects:

```
https://my.slush.app/dapp-request#<base64_encoded_json>
```

Where the JSON contains:
```json
{
  "version": "1",
  "requestId": "<uuid>",
  "appUrl": "<app_origin_without_trailing_slash>"
}
```

**Critical Details:**
- URL must be HTTPS (no HTTP or localhost)
- `appUrl` must NOT have trailing slash
- Base64 encoding must use standard encoding (not URL-safe)
- Opens in new tab with fallback to same-tab redirect

## Why This Solution Works

### Problem with Official dapp-kit Only

The official `slushWallet` prop in dapp-kit works great for:
- ✅ Desktop browser extensions
- ✅ Desktop web wallet fallback

But on mobile, it was generating URLs that Slush web wallet couldn't parse correctly, leading to "Invalid Link" errors.

### Why Hybrid Approach Works

1. **Desktop**: Official support handles everything perfectly
   - Detects Slush extension if installed
   - Falls back to web wallet if extension not installed
   - All handled by dapp-kit automatically

2. **Mobile**: Custom deep links use proven format
   - Format matches what Slush web wallet expects (tested with `walrus.xyz`)
   - Proper URL encoding and validation
   - Handles edge cases (popup blockers, redirects, etc.)

## Technical Details

### Mobile Detection

```typescript
function isMobileDevice(): boolean {
  // Checks user agent, screen width, and touch capability
  // Returns true for mobile devices
}
```

### Deep Link Generation

```typescript
export function getMobileWalletConnectUrl(): string {
  const appUrl = getAppUrl(); // Ensures no trailing slash
  const requestId = generateRequestId(); // UUID v4
  
  const requestData = {
    version: "1",
    requestId: requestId,
    appUrl: appUrl
  };
  
  // Base64 encode and construct URL
  const base64Encoded = btoa(JSON.stringify(requestData));
  return `https://my.slush.app/dapp-request#${base64Encoded}`;
}
```

### Connection Flow

1. User clicks "Connect Wallet" on mobile
2. `MobileConnectButton` detects mobile device
3. Calls `connectMobileWallet()` which:
   - Generates deep link URL with correct format
   - Opens `my.slush.app` in new tab (or same tab if popup blocked)
   - Sets up message listener for wallet response
4. User connects wallet in Slush app
5. Slush redirects back to app with connection data
6. App receives connection and updates state

## Files Modified

1. **`src/main.tsx`**: Added `slushWallet` prop to `WalletProvider`
2. **`src/components/MobileConnectButton.tsx`**: Hybrid approach (desktop = official, mobile = custom)
3. **`src/utils/mobile-wallet.ts`**: Custom deep link implementation (already existed, kept for mobile)

## Environment Variables

Required for production:
- `VITE_PACKAGE_ID`: Sui package ID
- `VITE_SYSTEM_OBJECT_ID`: System object ID
- `VITE_PUBLIC_APP_URL`: Production URL (for mobile wallet redirects)

## Testing

### Desktop Testing
- ✅ With Slush extension: Shows extension option
- ✅ Without extension: Falls back to web wallet

### Mobile Testing
- ✅ Opens `my.slush.app` correctly
- ✅ No "Install Extension" error
- ✅ Redirects back to app after connection
- ✅ Connection state persists

## Key Learnings

1. **Official support isn't always enough**: Sometimes you need custom implementation for specific use cases
2. **URL format matters**: Slush web wallet is strict about URL format (no trailing slashes, proper encoding)
3. **Hybrid approaches work**: Combining official support (desktop) with custom implementation (mobile) provides best UX
4. **Mobile detection is important**: Different platforms need different connection methods

## Future Improvements

- Monitor dapp-kit updates for improved mobile Slush support
- Consider removing custom deep links if official support improves
- Add analytics to track connection success rates
- Consider supporting other mobile wallets (Sui Wallet, etc.)

## References

- [dapp-kit Slush Integration Docs](https://sdk.mystenlabs.com/dapp-kit/slush)
- [Slush Wallet](https://my.slush.app)
- [Wallet Standard Protocol](https://github.com/wallet-standard/wallet-standard)

---

**Last Updated**: After successful mobile wallet connection implementation
**Status**: ✅ Working in production

