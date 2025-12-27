# Frontend Performance Audit Report
**Date:** 2025-01-27  
**Scope:** Complete frontend performance analysis  
**Framework:** React 18 + TypeScript + Vite

---

## Executive Summary

This audit identified **25+ performance issues** across bundle optimization, component rendering, data fetching, memory management, and asset loading. The frontend is generally well-structured but requires optimization in several critical areas to improve load times, reduce memory usage, and enhance user experience.

**Priority Breakdown:**
- 🔴 **Critical (8 issues)**: Must fix immediately - significant performance impact
- 🟡 **High (10 issues)**: Should fix soon - noticeable performance impact  
- 🟢 **Medium (7 issues)**: Nice to have - incremental improvements

---

## 🔴 Critical Issues

### 1. Large Component Files Without Memoization

**Issue:** `Landing.tsx` is 914 lines with no memoization, causing unnecessary re-renders.

**Location:** `frontend/app/src/pages/Landing.tsx`

**Impact:**
- Entire landing page re-renders on any state change
- Complex scroll animations recalculate on every render
- Multiple QR code SVG components re-render unnecessarily

**Solution:**
```typescript
// Split into smaller components:
// - LandingHero.tsx
// - LandingFeatures.tsx  
// - LandingCarousel.tsx
// - LandingAnalytics.tsx
// - LandingCTA.tsx

// Wrap expensive components with React.memo:
export const LandingCarousel = React.memo(({ ... }) => { ... });

// Memoize expensive calculations:
const carouselData = useMemo(() => [...], []);
```

**Expected Improvement:** 40-60% reduction in render time

---

### 2. Excessive QR Code SVG Rendering

**Issue:** Landing page renders 12+ QRCodeSVG components simultaneously (lines 535-666), each generating complex SVG paths.

**Location:** `frontend/app/src/pages/Landing.tsx:535-666`

**Impact:**
- High initial render cost
- Memory overhead from multiple SVG DOM nodes
- Slower page load on low-end devices

**Solution:**
```typescript
// Option 1: Use CSS background images (pre-rendered QR codes)
// Option 2: Lazy load QR codes outside viewport
// Option 3: Reduce to 3-4 QR codes with CSS transforms for variety
// Option 4: Use canvas-based QR code rendering (lighter weight)

import { lazy, Suspense } from 'react';
const QRCodeSVG = lazy(() => import('qrcode.react'));

// Only render visible QR codes
const visibleQRs = useMemo(() => {
  // Calculate which QR codes are in viewport
}, [viewport]);
```

**Expected Improvement:** 30-50% faster initial render

---

### 3. Missing React.memo on Frequently Re-rendered Components

**Issue:** No components use `React.memo`, causing cascading re-renders.

**Locations:**
- `AnimatedLogo.tsx` - Renders on every navigation
- `CustomCursor.tsx` - Re-renders on mouse move (though optimized with refs)
- `AnalyticsChart.tsx` - Re-renders when parent updates
- `OrganisationAnalytics.tsx` - Large component without memoization

**Solution:**
```typescript
// Wrap components that receive stable props:
export default React.memo(function AnimatedLogo({ variant, collapsed, ... }) {
  // Component code
}, (prevProps, nextProps) => {
  // Custom comparison if needed
  return prevProps.variant === nextProps.variant && 
         prevProps.collapsed === nextProps.collapsed;
});

// For components with callbacks, use useCallback:
const handleClick = useCallback(() => { ... }, [deps]);
```

**Expected Improvement:** 20-30% reduction in unnecessary renders

---

### 4. Inefficient Data Fetching - Multiple Parallel Queries

**Issue:** `useDashboardStats` and `useRecentActivity` fetch large datasets (1000+ events) even when not needed.

**Location:** `frontend/app/src/hooks/use-dashboard-stats.ts`

**Problems:**
- Fetches 1000 attendance events for dashboard (line 43)
- Fetches 500 student events (line 165)
- Multiple `useQueries` calls for organization objects (line 79)
- No pagination or incremental loading

**Solution:**
```typescript
// Implement pagination:
const { data, fetchNextPage } = useInfiniteQuery({
  queryKey: ['events', 'AttendanceRecordedEvent'],
  queryFn: ({ pageParam = 0 }) => 
    client.queryEvents({ limit: 50, cursor: pageParam }),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});

// Use virtual scrolling for large lists
// Fetch only visible items + buffer
// Implement request deduplication
```

**Expected Improvement:** 50-70% reduction in initial data load

---

### 5. GridCanvas Continuous Animation Without Optimization

**Issue:** `GridCanvas` runs `requestAnimationFrame` continuously with 50 particles, even when not visible.

**Location:** `frontend/app/src/components/GridCanvas.tsx`

**Problems:**
- Animation runs even when component is off-screen
- No intersection observer to pause when hidden
- 50 particles with trails = high CPU usage
- Canvas redraws entire grid every frame

**Solution:**
```typescript
// Use Intersection Observer to pause when off-screen:
useEffect(() => {
  const observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) {
      // Pause animation
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    } else {
      // Resume animation
      animate();
    }
  }, { threshold: 0.1 });
  
  observer.observe(canvas);
  return () => observer.disconnect();
}, []);

// Reduce particle count on low-end devices:
const particleCount = useMemo(() => {
  const isLowEnd = navigator.hardwareConcurrency <= 4;
  return isLowEnd ? 25 : 50;
}, []);
```

**Expected Improvement:** 40-60% CPU reduction when off-screen

---

### 6. Missing Code Splitting for Heavy Dependencies

**Issue:** Chart.js, recharts, and all Radix UI components load upfront.

**Location:** `frontend/app/src/components/OrganisationAnalytics.tsx`, `AnalyticsChart.tsx`

**Problems:**
- Chart.js (~200KB) loads even if user never views analytics
- Multiple chart libraries (Chart.js + recharts) increase bundle size
- Radix UI components not split by feature

**Solution:**
```typescript
// Lazy load chart components:
const OrganisationAnalytics = lazy(() => 
  import('./OrganisationAnalytics')
);

// Split chart libraries:
// vite.config.ts
manualChunks: {
  'chart-vendor': ['chart.js', 'react-chartjs-2'],
  'recharts-vendor': ['recharts'],
  'radix-ui': Object.keys(pkg.dependencies)
    .filter(dep => dep.startsWith('@radix-ui')),
}
```

**Expected Improvement:** 200-300KB reduction in initial bundle

---

### 7. Inefficient Scroll Event Handling

**Issue:** Landing page scroll handler runs on every scroll event without throttling.

**Location:** `frontend/app/src/pages/Landing.tsx:191-233`

**Problems:**
- `handleScroll` executes on every scroll pixel
- Complex velocity calculations on every event
- Multiple refs updated synchronously
- No debouncing/throttling

**Solution:**
```typescript
// Use passive event listeners (already done) + throttling:
const handleScroll = useMemo(
  () => throttle(() => {
    // Scroll logic
  }, 16), // ~60fps
  []
);

// Or use requestAnimationFrame batching:
let rafId: number | null = null;
const handleScroll = () => {
  if (rafId === null) {
    rafId = requestAnimationFrame(() => {
      // Process scroll
      rafId = null;
    });
  }
};
```

**Expected Improvement:** 30-50% reduction in scroll lag

---

### 8. Large Event Query Limits Without Pagination

**Issue:** Multiple hooks fetch 500-1000 events without pagination.

**Locations:**
- `use-attendance-events.ts` - limit: 500-1000
- `use-global-stats.ts` - limit: 1000
- `use-dashboard-stats.ts` - limit: 1000

**Impact:**
- Slow initial load
- High memory usage
- Network overhead
- Poor performance on slow connections

**Solution:**
```typescript
// Implement cursor-based pagination:
export function useAttendanceRecordedEvents(
  orgId?: string, 
  pageSize = 50
) {
  return useInfiniteQuery({
    queryKey: ['events', 'AttendanceRecordedEvent', orgId],
    queryFn: async ({ pageParam }) => {
      const res = await client.queryEvents({
        query: { MoveEventType: `${pkg}::events::AttendanceRecordedEvent` },
        limit: pageSize,
        cursor: pageParam,
        order: 'descending',
      });
      return {
        data: res.data,
        nextCursor: res.nextCursor,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
  });
}

// Use virtual scrolling for UI
```

**Expected Improvement:** 60-80% faster initial load

---

## 🟡 High Priority Issues

### 9. Missing useCallback for Event Handlers

**Issue:** Event handlers recreated on every render, causing child re-renders.

**Locations:**
- `Landing.tsx:80` - `handleButtonClick`
- `OrganisationDetail.tsx:193` - `handleCopyHash`
- Multiple components with inline arrow functions

**Solution:**
```typescript
const handleButtonClick = useCallback(() => {
  if (account) {
    navigate('/dashboard');
  } else {
    setShouldRedirectAfterConnect(true);
    // ...
  }
}, [account, navigate, shouldRedirectAfterConnect]);
```

---

### 10. Unoptimized Image Loading

**Issue:** Background images loaded from Unsplash without optimization.

**Location:** `frontend/app/src/pages/Landing.tsx:352`, `PageBackground.tsx:12`

**Problems:**
- No lazy loading
- No responsive images (srcset)
- No WebP format
- Large image URLs (1920px width)

**Solution:**
```typescript
// Use optimized image component:
<img
  srcSet="
    image-400.webp 400w,
    image-800.webp 800w,
    image-1200.webp 1200w
  "
  sizes="(max-width: 768px) 100vw, 50vw"
  loading="lazy"
  decoding="async"
/>

// Or use next/image equivalent for React
```

---

### 11. Inefficient useMemo Dependencies

**Issue:** Some `useMemo` hooks have incorrect or missing dependencies.

**Locations:**
- `OrganisationDetail.tsx` - Multiple useMemo hooks
- `AnalyticsChart.tsx:112` - useEffect dependencies

**Solution:**
```typescript
// Audit all useMemo/useCallback dependencies
// Use ESLint rule: react-hooks/exhaustive-deps
// Ensure all referenced values are in dependency array
```

---

### 12. Chart.js Re-registration on Every Render

**Issue:** Chart.js components register plugins on every render.

**Location:** `frontend/app/src/components/AnalyticsChart.tsx:22-32`

**Solution:**
```typescript
// Move registration outside component or use useEffect:
useEffect(() => {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    // ... other plugins
  );
  
  return () => {
    // Unregister on unmount if needed
  };
}, []);
```

---

### 13. Missing Virtual Scrolling for Large Lists

**Issue:** Tables render all rows at once, even with 500+ items.

**Locations:**
- `OrganisationDetail.tsx` - Student and attendance tables
- `ActivityPage.tsx` - Activity list

**Solution:**
```typescript
// Use react-window or @tanstack/react-virtual:
import { useVirtualizer } from '@tanstack/react-virtual';

const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 50,
});
```

---

### 14. Inefficient Query Key Structure

**Issue:** Some query keys don't properly invalidate when dependencies change.

**Location:** Multiple hooks

**Solution:**
```typescript
// Ensure query keys include all relevant dependencies:
queryKey: ['events', 'AttendanceRecordedEvent', orgId, limit, filters]

// Use query key factories:
const eventKeys = {
  all: ['events'] as const,
  lists: () => [...eventKeys.all, 'list'] as const,
  list: (filters: string) => [...eventKeys.lists(), filters] as const,
};
```

---

### 15. Missing Error Boundaries

**Issue:** No error boundaries to prevent full app crashes.

**Impact:** Single component error crashes entire app

**Solution:**
```typescript
// Add error boundaries at route level:
<ErrorBoundary fallback={<ErrorFallback />}>
  <Routes>...</Routes>
</ErrorBoundary>
```

---

### 16. Unoptimized Font Loading

**Issue:** Multiple Google Fonts loaded synchronously.

**Location:** `frontend/app/index.html:7-16`, `index.css:2-4`

**Solution:**
```typescript
// Use font-display: swap
// Preload critical fonts
// Self-host fonts for better control
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
```

---

### 17. Missing Service Worker for Caching

**Issue:** No offline support or asset caching.

**Solution:**
```typescript
// Implement service worker with Workbox
// Cache static assets
// Cache API responses
// Enable offline fallback
```

---

### 18. Inefficient Re-render Patterns in OrganisationDetail

**Issue:** Multiple `useMemo` hooks recalculate unnecessarily.

**Location:** `frontend/app/src/pages/OrganisationDetail.tsx`

**Solution:**
```typescript
// Combine related useMemo hooks
// Reduce dependency arrays where possible
// Use React DevTools Profiler to identify bottlenecks
```

---

## 🟢 Medium Priority Issues

### 19. Missing Bundle Analysis

**Issue:** No visibility into bundle composition.

**Solution:**
```bash
# Add bundle analyzer:
npm install --save-dev rollup-plugin-visualizer

# vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

plugins: [
  visualizer({ open: true, filename: 'dist/stats.html' })
]
```

---

### 20. CSS Not Optimized for Production

**Issue:** Large CSS file with unused styles potentially.

**Solution:**
```bash
# Use PurgeCSS (already in Tailwind)
# Audit unused CSS
# Split CSS by route
```

---

### 21. Missing Prefetching for Likely Navigation

**Issue:** No prefetching of likely next routes.

**Solution:**
```typescript
// Prefetch on hover:
<Link 
  to="/dashboard"
  onMouseEnter={() => queryClient.prefetchQuery(...)}
>
```

---

### 22. No Performance Monitoring

**Issue:** No real user monitoring (RUM).

**Solution:**
```typescript
// Add Web Vitals tracking:
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

// Track and send to analytics
```

---

### 23. Missing Compression Headers

**Issue:** No gzip/brotli compression mentioned.

**Solution:**
```nginx
# Ensure server compresses responses
gzip on;
gzip_types text/javascript application/json;
```

---

### 24. Large Dependency Tree

**Issue:** 46 Radix UI components + Chart.js + recharts.

**Solution:**
```typescript
// Tree-shake unused exports
// Consider lighter alternatives
// Audit if all Radix components are needed
```

---

### 25. Missing React 18 Concurrent Features

**Issue:** Not leveraging `useTransition`, `useDeferredValue`.

**Solution:**
```typescript
// Use for non-urgent updates:
const [isPending, startTransition] = useTransition();

startTransition(() => {
  setSearchQuery(value);
});
```

---

## Performance Metrics & Targets

### Current State (Estimated)
- **Initial Bundle Size:** ~800KB-1.2MB (gzipped: ~300-400KB)
- **Time to Interactive (TTI):** ~3-5s on 3G
- **First Contentful Paint (FCP):** ~1.5-2s
- **Largest Contentful Paint (LCP):** ~2.5-4s
- **Total Blocking Time (TBT):** ~300-500ms

### Target State (After Optimizations)
- **Initial Bundle Size:** ~400-600KB (gzipped: ~150-250KB)
- **Time to Interactive (TTI):** ~1.5-2.5s on 3G
- **First Contentful Paint (FCP):** ~0.8-1.2s
- **Largest Contentful Paint (LCP):** ~1.5-2.5s
- **Total Blocking Time (TBT):** ~100-200ms

---

## Implementation Priority

### Phase 1 (Week 1) - Critical Fixes
1. ✅ Split `Landing.tsx` into smaller components
2. ✅ Add `React.memo` to frequently re-rendered components
3. ✅ Optimize QR code rendering
4. ✅ Implement pagination for event queries
5. ✅ Add Intersection Observer to GridCanvas

### Phase 2 (Week 2) - High Priority
6. ✅ Lazy load chart components
7. ✅ Optimize scroll handlers
8. ✅ Add useCallback to event handlers
9. ✅ Implement virtual scrolling for tables
10. ✅ Optimize image loading

### Phase 3 (Week 3) - Medium Priority
11. ✅ Add bundle analyzer
12. ✅ Implement error boundaries
13. ✅ Add performance monitoring
14. ✅ Optimize font loading
15. ✅ Audit and optimize dependencies

---

## Tools & Resources

### Recommended Tools
- **React DevTools Profiler** - Identify render bottlenecks
- **Lighthouse** - Performance auditing
- **WebPageTest** - Real-world performance testing
- **Bundle Analyzer** - Visualize bundle composition
- **Chrome Performance Tab** - Profile runtime performance

### Useful Libraries
- `@tanstack/react-virtual` - Virtual scrolling
- `react-window` - Alternative virtual scrolling
- `web-vitals` - Performance metrics
- `workbox` - Service worker/PWA

---

## Conclusion

The frontend has a solid foundation but requires optimization in component architecture, data fetching, and asset loading. Implementing the critical and high-priority fixes should result in **40-60% improvement** in load times and **30-50% reduction** in memory usage.

**Next Steps:**
1. Review and prioritize issues based on user impact
2. Create implementation tickets for each phase
3. Set up performance monitoring baseline
4. Begin Phase 1 implementation
5. Measure improvements after each phase

---

*End of Performance Audit Report*

