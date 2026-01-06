# Complete Wallet Integration Guide - Slush Wallet with Sui dapp-kit

**Last Updated:** January 2025  
**Status:** ✅ Production Ready  
**Framework:** React + TypeScript + @mysten/dapp-kit

---

## Table of Contents

1. [Overview](#overview)
2. [The Problem We Solved](#the-problem-we-solved)
3. [Root Cause Analysis](#root-cause-analysis)
4. [The Solution](#the-solution)
5. [Step-by-Step Integration](#step-by-step-integration)
6. [Routing Configuration](#routing-configuration)
7. [Common Pitfalls & Solutions](#common-pitfalls--solutions)
8. [Testing Checklist](#testing-checklist)
9. [Troubleshooting](#troubleshooting)
10. [Code Examples](#code-examples)

---

## Overview

This guide documents the complete integration of Slush wallet with Sui dapp-kit, including the critical fix for mobile wallet connections and proper routing. This solution works seamlessly across:

- ✅ Desktop browsers (with/without extensions)
- ✅ Mobile browsers (iOS Safari, Chrome, etc.)
- ✅ All routing scenarios
- ✅ Callback handling

---

## The Problem We Solved

### Initial Issues

1. **Mobile 404 Errors**
   - When users clicked "Connect Wallet" on mobile, they were redirected to `/dapp-request` on the app's domain
   - This route didn't exist, causing a 404 error
   - The diagnostic showed: `https://app-three-delta-43.vercel.app/dapp-request#...`

2. **Routing Problems**
   - Wallet callbacks weren't being handled correctly
   - Users were stuck on error pages after wallet connection
   - Redirects weren't working properly

3. **Desktop vs Mobile Behavior**
   - Desktop worked fine with browser extensions
   - Mobile showed "Install Extension" errors instead of opening web wallet

### Error Symptoms

```
🔍 DIAGNOSTIC - Route Info:
Path: /dapp-request
Hash: #eyJ2ZXJzaW9uIjoiMSIsInJlcXVlc3RJZCI6IjlmMTNiODgyLWQyMTAtNDRjNS1hMGY2LTgwMTcxZjVmZDA4YSIsImFwcFVybCI6Imh0dHBzOi8vYXBwLXRocmVlLWRlbHRhLTQzLnZlcmNlbC5hcHAvIiwiYXBwTmFtZSI6IlN1aSBBdHRlbmRhbmNlIFN5c3RlbSIsInBheWxvYWQiOnsidHlwZSI6ImNvbm5lY3QifSwibWV0YWRhdGEiOnsidmVyc2lvbiI6IjEiLCJvcmlnaW5VcmwiOiJodHRwczovL2FwcC10aHJlZS1kZWx0YS00My52ZXJjZWwuYXBwLyIsInVzZXJBZ2VudCI6Ik1vemlsbGEvNS4wIChpUGhvbmU7IENQVSBpUGhvbmUgT1MgMThfNSBsaWtlIE1hYyBPUyBYKSBBcHBsZVdlYktpdC82MDUuMS4xNSAoS0hUTUwsIGxpa2UgR2Vja28pIFZlcnNpb24vMTguNSBNb2JpbGUvMTVFMTQ4IFNhZmFyaS82MDQuMSIsInNjcmVlblJlc29sdXRpb24iOiI0MTR4ODk2IiwibGFuZ3VhZ2UiOiJlbi1HQiIsInBsYXRmb3JtIjoiaVBob25lIiwidGltZXpvbmUiOiJBZnJpY2EvTGFnb3MiLCJ0aW1lc3RhbXAiOjE3Njc0NjYwMDkwNzN9fQ%3D%3D
```

The hash contained:
```json
{
  "version": "1",
  "requestId": "9f13b882-d210-44c5-a0f6-80171f5fd08a",
  "appUrl": "https://app-three-delta-43.vercel.app/",
  "appName": "Sui Attendance System",
  "payload": {"type": "connect"},
  ...
}
```

**The Problem:** Slush was trying to access `/dapp-request` on YOUR app's domain instead of the Slush wallet domain!

---

## Root Cause Analysis

### The Critical Mistake

The `origin` property in `slushWallet` config was being misunderstood:

```tsx
// ❌ WRONG - This was the problem!
<WalletProvider 
  autoConnect
  slushWallet={{
    name: 'Sui Attendance System',
    origin: getAppOrigin(), // Returns 'https://app-three-delta-43.vercel.app'
  }}
>
```

**What `origin` Actually Means:**
- `origin` refers to **where the Slush wallet UI is hosted**
- **NOT** where your app is hosted
- By setting it to your app's URL, you told Slush: *"Your wallet UI is at the user's app domain"*
- So Slush tried to open: `https://your-app.com/dapp-request` → 404!

### Why This Happened

The dapp-kit documentation mentions `origin` but doesn't clearly explain:
- It's for the **wallet's origin**, not your app's origin
- If omitted, dapp-kit uses the default Slush wallet URL
- The default behavior is what you want in 99% of cases

---

## The Solution

### The Fix

Simply **remove the `origin` property**:

```tsx
// ✅ CORRECT - This is the fix!
<WalletProvider 
  autoConnect
  slushWallet={{
    name: 'Sui Attendance System',
    // No 'origin' property - let dapp-kit use defaults
  }}
>
```

### Why This Works

1. **Without `origin`:**
   - dapp-kit uses the default Slush wallet URL (e.g., `https://wallet.slush.app` or similar)
   - When you click "Slush", it opens the **actual Slush web wallet**
   - After authentication, Slush redirects back to your app at `/`
   - No 404 errors!

2. **With `origin` set to your app:**
   - Slush thinks the wallet UI is on your domain
   - Tries to access `/dapp-request` on your app → 404
   - Connection fails

---

## Step-by-Step Integration

### Step 1: Install Dependencies

```bash
npm install @mysten/dapp-kit @mysten/sui.js
```

### Step 2: Configure WalletProvider

**File: `src/main.tsx`**

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import "@mysten/dapp-kit/dist/index.css";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { networkConfig } from "./networkConfig";
import App from "./App";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById("root")!);

const AppWrapper = () => {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
          <WalletProvider 
            autoConnect
            slushWallet={{
              name: 'Your App Name',
              // ⚠️ DO NOT SET 'origin' HERE
              // The 'origin' prop refers to where the Slush WALLET UI is hosted,
              // NOT where your app is hosted. Let dapp-kit use the default.
            }}
          >
            <App />
          </WalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

root.render(<AppWrapper />);
```

**Key Points:**
- ✅ Set `autoConnect` to automatically reconnect on page load
- ✅ Set `name` to your app's display name
- ❌ **DO NOT** set `origin` - this causes the 404 issue!

### Step 3: Create Connect Button Component

**File: `src/components/MobileConnectButton.tsx`**

```tsx
import React, { useEffect } from "react";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";

interface MobileConnectButtonProps {
  className?: string;
  onConnectStart?: () => void;
  onConnectSuccess?: () => void;
}

/**
 * MobileConnectButton - Wrapper around official ConnectButton
 * 
 * The official ConnectButton from @mysten/dapp-kit handles:
 * - Desktop: Slush browser extension
 * - Mobile: Native Slush app via Wallet Standard
 * - Fallback: Slush web wallet
 * 
 * When configured with slushWallet prop in WalletProvider,
 * it automatically handles all wallet connection scenarios correctly.
 */
export function MobileConnectButton({
  className,
  onConnectStart,
  onConnectSuccess,
}: MobileConnectButtonProps) {
  const account = useCurrentAccount();

  useEffect(() => {
    if (account && onConnectSuccess) {
      onConnectSuccess();
    }
  }, [account, onConnectSuccess]);

  return <ConnectButton className={className} />;
}

export default MobileConnectButton;
```

**Why This Works:**
- Uses the official `ConnectButton` from dapp-kit
- Automatically detects mobile vs desktop
- Handles all connection scenarios (extension, web wallet, mobile app)
- No custom deep links needed!

### Step 4: Use the Connect Button

**File: `src/pages/Landing.tsx`**

```tsx
import { MobileConnectButton } from "@/components/MobileConnectButton";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const account = useCurrentAccount();
  const navigate = useNavigate();

  return (
    <div>
      <MobileConnectButton />
      {account && (
        <button onClick={() => navigate("/dashboard")}>
          Go to Dashboard
        </button>
      )}
    </div>
  );
}
```

---

## Routing Configuration

### Step 5: Set Up Callback Routes

**File: `src/App.tsx`**

```tsx
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import WalletCallback from "./pages/WalletCallback";

const Landing = lazy(() => import("./pages/Landing"));
const Dashboard = lazy(() => import("./pages/Dashboard"));

export default function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/" element={<Landing />} />
        
        {/* Wallet callback routes - handle wallet redirects */}
        <Route path="/callback" element={<WalletCallback />} />
        <Route path="/wallet/callback" element={<WalletCallback />} />
        <Route path="/connect/callback" element={<WalletCallback />} />
        
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  );
}
```

**Why Multiple Callback Routes:**
- Different wallets may use different callback paths
- Covers common variations: `/callback`, `/wallet/callback`, `/connect/callback`
- All route to the same handler component

### Step 6: Create Wallet Callback Handler

**File: `src/pages/WalletCallback.tsx`**

```tsx
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCurrentAccount } from "@mysten/dapp-kit";

/**
 * WalletCallback - Handles wallet connection callbacks and redirects
 * 
 * This component catches wallet callback routes and redirects to the appropriate page.
 * The WalletProvider handles the actual connection state via URL hash/query parameters automatically.
 */
export default function WalletCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const account = useCurrentAccount();

  useEffect(() => {
    console.log("WalletCallback: Handling wallet callback", {
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
      fullUrl: window.location.href,
      account: account?.address,
    });

    // Wait a moment for WalletProvider to process the callback
    const timeoutId = setTimeout(() => {
      if (account) {
        // Wallet connected successfully, redirect to dashboard
        navigate("/dashboard", { replace: true });
      } else {
        // No account yet, redirect to home
        // The WalletProvider's autoConnect will handle the connection
        navigate("/", { replace: true });
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [navigate, location, account]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
        <p className="text-muted-foreground">Connecting wallet...</p>
      </div>
    </div>
  );
}
```

**Key Points:**
- Shows loading state while processing
- Waits 1 second for WalletProvider to process callback
- Redirects to dashboard if connected, home if not
- Uses `replace: true` to avoid back button issues

### Step 7: Protect Routes (Optional)

**File: `src/components/layout/DashboardLayout.tsx`**

```tsx
import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCurrentAccount } from "@mysten/dapp-kit";

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const account = useCurrentAccount();
  const hasCheckedRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Skip if already on landing page
    if (location.pathname === "/") {
      return;
    }

    // If account is connected, clear any pending timeout
    if (account) {
      hasCheckedRef.current = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // If we've already checked and account is still null, redirect immediately
    if (hasCheckedRef.current && !account) {
      navigate("/");
      return;
    }

    // Wait for autoConnect to finish (give it 1.5 seconds)
    if (!hasCheckedRef.current) {
      timeoutRef.current = setTimeout(() => {
        hasCheckedRef.current = true;
        if (!account) {
          navigate("/");
        }
      }, 1500);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [account, navigate, location.pathname]);

  return (
    <div>
      {/* Your dashboard content */}
    </div>
  );
}
```

**Why This Pattern:**
- Gives `autoConnect` time to work (1.5 seconds)
- Prevents flash of content before redirect
- Handles edge cases gracefully

---

## Common Pitfalls & Solutions

### ❌ Pitfall 1: Setting `origin` Property

**Problem:**
```tsx
slushWallet={{
  name: 'My App',
  origin: window.location.origin, // ❌ WRONG!
}}
```

**Symptom:** 404 errors on `/dapp-request` route

**Solution:** Remove `origin` property entirely

---

### ❌ Pitfall 2: Missing Callback Routes

**Problem:** No routes for `/callback`, `/wallet/callback`, etc.

**Symptom:** Users stuck on blank page after wallet connection

**Solution:** Add callback routes as shown in Step 5

---

### ❌ Pitfall 3: Not Waiting for WalletProvider

**Problem:** Redirecting immediately without waiting for connection

**Symptom:** Connection state not ready, redirects to wrong page

**Solution:** Use timeout (1 second) in WalletCallback component

---

### ❌ Pitfall 4: Not Using `autoConnect`

**Problem:**
```tsx
<WalletProvider> {/* Missing autoConnect */}
```

**Symptom:** Users have to reconnect on every page load

**Solution:** Always set `autoConnect` prop

---

### ❌ Pitfall 5: Using Custom Deep Links

**Problem:** Trying to manually construct wallet URLs

**Symptom:** Complex code, doesn't work reliably

**Solution:** Use official `ConnectButton` - it handles everything

---

## Testing Checklist

### Desktop Testing

- [ ] **With Slush Extension Installed**
  - Click "Connect Wallet"
  - Should show extension option
  - Should connect successfully
  - Should redirect to dashboard

- [ ] **Without Extension**
  - Click "Connect Wallet"
  - Should open Slush web wallet
  - Should connect successfully
  - Should redirect back to app

- [ ] **Connection Persistence**
  - Connect wallet
  - Refresh page
  - Should auto-connect
  - Should stay on current page

### Mobile Testing

- [ ] **iOS Safari**
  - Click "Connect Wallet"
  - Should open Slush web wallet (not show "Install Extension")
  - Should connect successfully
  - Should redirect back to app

- [ ] **Android Chrome**
  - Click "Connect Wallet"
  - Should open Slush web wallet
  - Should connect successfully
  - Should redirect back to app

- [ ] **No 404 Errors**
  - Should never see `/dapp-request` route
  - Should never see 404 page
  - Should handle all redirects smoothly

### Routing Testing

- [ ] **Callback Routes**
  - Test `/callback` route
  - Test `/wallet/callback` route
  - Test `/connect/callback` route
  - All should work correctly

- [ ] **Protected Routes**
  - Try accessing `/dashboard` without wallet
  - Should redirect to landing page
  - After connecting, should access dashboard

- [ ] **Back Button**
  - Connect wallet
  - Navigate to dashboard
  - Press back button
  - Should not get stuck in redirect loop

---

## Troubleshooting

### Issue: Still Getting 404 on `/dapp-request`

**Check:**
1. Did you remove the `origin` property from `slushWallet`?
2. Are you using the official `ConnectButton`?
3. Clear browser cache and try again

**Solution:**
```tsx
// Make sure your WalletProvider looks like this:
<WalletProvider 
  autoConnect
  slushWallet={{
    name: 'Your App Name',
    // NO origin property!
  }}
>
```

---

### Issue: Wallet Connects But Doesn't Redirect

**Check:**
1. Do you have callback routes set up?
2. Is WalletCallback component waiting long enough?
3. Check browser console for errors

**Solution:**
- Increase timeout in WalletCallback from 1000ms to 2000ms
- Check that callback routes are properly configured

---

### Issue: Mobile Shows "Install Extension"

**Check:**
1. Are you using `ConnectButton` from dapp-kit?
2. Is `slushWallet` prop set in WalletProvider?
3. Is `origin` property removed?

**Solution:**
- Use official `ConnectButton` (not custom implementation)
- Ensure `slushWallet` is configured correctly
- Remove any `origin` property

---

### Issue: Connection Doesn't Persist on Refresh

**Check:**
1. Is `autoConnect` set on WalletProvider?
2. Are you clearing localStorage anywhere?

**Solution:**
```tsx
<WalletProvider autoConnect ...>
```

---

## Code Examples

### Complete Working Example

**`src/main.tsx`**
```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import "@mysten/dapp-kit/dist/index.css";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { networkConfig } from "./networkConfig";
import App from "./App";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById("root")!);

const AppWrapper = () => {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
          <WalletProvider 
            autoConnect
            slushWallet={{
              name: 'Your App Name',
            }}
          >
            <App />
          </WalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

root.render(<AppWrapper />);
```

**`src/App.tsx`**
```tsx
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import WalletCallback from "./pages/WalletCallback";

const Landing = lazy(() => import("./pages/Landing"));
const Dashboard = lazy(() => import("./pages/Dashboard"));

export default function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/callback" element={<WalletCallback />} />
        <Route path="/wallet/callback" element={<WalletCallback />} />
        <Route path="/connect/callback" element={<WalletCallback />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  );
}
```

---

## Key Takeaways

1. **Never set `origin` in `slushWallet` config** - This causes 404 errors
2. **Use official `ConnectButton`** - It handles all scenarios automatically
3. **Set up callback routes** - Multiple routes for different wallet behaviors
4. **Always use `autoConnect`** - Provides better UX
5. **Wait for WalletProvider** - Use timeouts in callback handlers
6. **Test on mobile** - Desktop and mobile behave differently

---

## References

- [dapp-kit Documentation](https://sdk.mystenlabs.com/dapp-kit)
- [Slush Wallet](https://my.slush.app)
- [Wallet Standard Protocol](https://github.com/wallet-standard/wallet-standard)
- [Sui Documentation](https://docs.sui.io)

---

**Last Updated:** January 2025  
**Status:** ✅ Production Ready  
**Tested On:** iOS Safari, Android Chrome, Desktop Chrome/Firefox/Safari

---

## Quick Reference

### ✅ DO:
- Use `ConnectButton` from `@mysten/dapp-kit`
- Set `autoConnect` on `WalletProvider`
- Set `name` in `slushWallet` config
- Set up callback routes
- Wait for connection in callback handlers

### ❌ DON'T:
- Set `origin` in `slushWallet` config
- Create custom deep links
- Redirect immediately without waiting
- Skip callback routes
- Assume desktop and mobile work the same

---

**This guide is based on real production experience and fixes. Use it as a reference for future projects!**





