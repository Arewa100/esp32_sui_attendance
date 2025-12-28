# Frontend Optimization Audit Report
**Date:** 2025-12-28  
**Scope:** Complete frontend performance and optimization analysis  
**Framework:** React 18 + TypeScript + Vite + TanStack Query  
**Status:** Analysis Only - No Changes Made

---

## Executive Summary

This audit identified **30+ optimization opportunities** across data fetching, component rendering, bundle optimization, memory management, and asset loading. The frontend is well-structured with good use of React.memo and code splitting, but several critical areas need optimization to improve performance, especially on mobile devices and slow networks.

**Priority Breakdown:**
- 🔴 **Critical (8 issues)**: Must fix - significant performance impact
- 🟡 **High (12 issues)**: Should fix soon - noticeable performance impact  
- 🟢 **Medium (10 issues)**: Nice to have - incremental improvements

---

## 🔴 Critical Issues

### 1. Inefficient Data Fetching - Client-Side Filtering After Fetching All Data

**Issue:** Multiple hooks fetch large datasets (1000+ events) and then filter client-side, wasting bandwidth and memory.

**Locations:**
- `use-attendance-events.ts:79-96` - Fetches all student events, filters by orgId client-side
- `use-attendance-events.ts:99-116` - Fetches all attendance events, filters by orgId client-side
- `Organisations.tsx:59-90` - Fetches 1000 events for all orgs, then filters by wallet address

**Impact:**
- Unnecessary network requests (fetching data for all orgs when only one needed)
- High memory usage (storing unused data)
- Slower initial load times
- Increased API costs

**Current Code Pattern:**
```typescript
// ❌ BAD: Fetches all, filters client-side
const res = await client.queryEvents({
  query: { MoveEventType: `${pkg}::events::StudentRegisteredEvent` },
  limit: 500,
});
const items = res.data.map(e => e.parsedJson);
return orgId ? items.filter(x => x.organisation === orgId) : items;
```

**Recommended Solution:**
```typescript
// ✅ GOOD: Use server-side filtering if possible, or reduce limit
// Option 1: Use Move module filters (if supported by Sui)
const res = await client.queryEvents({
  query: { 
    MoveEventType: `${pkg}::events::StudentRegisteredEvent`,
    // Add filter if Sui API supports it
  },
  limit: orgId ? 100 : 500, // Reduce limit when filtering
});

// Option 2: Implement pagination with cursor-based loading
// Option 3: Cache filtered results separately
```

**Expected Improvement:** 50-70% reduction in data transfer and memory usage

---

### 2. Large Component Files Without Further Optimization

**Issue:** Several components are very large and could benefit from additional splitting.

**Locations:**
- `OrganisationDetail.tsx` - 1055 lines (already has some optimization but could be better)
- `AnalyticsPage.tsx` - 900+ lines
- `OrganisationAnalytics.tsx` - 740+ lines

**Impact:**
- Larger bundle sizes
- More complex maintenance
- Potential for unnecessary re-renders

**Current State:**
- ✅ Already uses `useMemo` and `useCallback` in many places
- ✅ Already split into tabs
- ❌ Could extract more sub-components (e.g., StatsCards, Tables, Charts)

**Recommended Solution:**
```typescript
// Extract reusable components:
// - OrganisationStatsCards.tsx
// - StudentTable.tsx / StudentCardList.tsx
// - AttendanceTable.tsx / AttendanceCardList.tsx
// - DeviceList.tsx
// - AnalyticsCharts.tsx
```

**Expected Improvement:** 10-20% bundle size reduction, better code maintainability

---

### 3. Missing Pagination for Large Event Lists

**Issue:** All event hooks fetch large limits (500-1000) without pagination support.

**Locations:**
- `use-attendance-events.ts` - All hooks use fixed limits (500-1000)
- `use-dashboard-stats.ts:35-56` - Fetches 1000 attendance events
- `Organisations.tsx:59-90` - Fetches 1000 events for counting

**Impact:**
- Slow initial load for users with many records
- High memory usage
- Poor performance on mobile devices
- Network timeouts on slow connections

**Current Code:**
```typescript
// ❌ BAD: Fixed large limit
export function useAttendanceRecordedEvents(orgId?: string, limit = 500) {
  return useQuery({
    queryFn: async () => {
      const res = await client.queryEvents({
        limit, // Always 500-1000
        // ...
      });
    },
  });
}
```

**Recommended Solution:**
```typescript
// ✅ GOOD: Implement infinite query with pagination
export function useAttendanceRecordedEvents(orgId?: string, pageSize = 50) {
  return useInfiniteQuery({
    queryKey: ["events", "AttendanceRecordedEvent", orgId, pageSize],
    queryFn: async ({ pageParam }) => {
      const res = await client.queryEvents({
        query: { MoveEventType: `${pkg}::events::AttendanceRecordedEvent` },
        limit: pageSize,
        cursor: pageParam,
        order: "descending",
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
```

**Expected Improvement:** 60-80% faster initial load, better memory efficiency

---

### 4. Frequent Refetch Intervals Causing Unnecessary Network Requests

**Issue:** Many queries have short refetch intervals (10-30 seconds), causing constant polling.

**Locations:**
- `use-attendance-events.ts` - Multiple hooks with 15-30s refetch intervals
- `use-subscription-status.ts:68-69` - 10s refetch interval
- `use-sui-balance.ts:45` - 30s refetch interval
- `Organisations.tsx:72,89` - 30s refetch intervals

**Impact:**
- Unnecessary network requests
- Increased server load
- Battery drain on mobile devices
- Potential rate limiting issues

**Current Code:**
```typescript
// ❌ BAD: Too frequent refetching
staleTime: 10_000,
refetchInterval: 15_000, // Every 15 seconds
```

**Recommended Solution:**
```typescript
// ✅ GOOD: Increase intervals, use smart refetching
staleTime: 60_000, // 1 minute
refetchInterval: 120_000, // 2 minutes
refetchOnWindowFocus: true, // Only refetch when user returns
refetchOnReconnect: true, // Only refetch on reconnect
// Or use websockets/subscriptions for real-time updates
```

**Expected Improvement:** 50-70% reduction in network requests

---

### 5. Missing Virtual Scrolling for Large Lists

**Issue:** Tables and lists render all items at once, even with 500+ records.

**Locations:**
- `OrganisationDetail.tsx` - Student and attendance tables
- `ActivityPage.tsx` - Activity list (can have 100+ items)
- `AnalyticsPage.tsx` - Student tables in analytics

**Impact:**
- Slow initial render for large lists
- High DOM node count
- Poor scroll performance
- Memory overhead

**Current State:**
- ✅ Already has mobile card views (good!)
- ❌ No virtual scrolling for desktop tables
- ❌ All items rendered even if not visible

**Recommended Solution:**
```typescript
// Use @tanstack/react-virtual for virtual scrolling
import { useVirtualizer } from '@tanstack/react-virtual';

const parentRef = useRef<HTMLDivElement>(null);
const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 50, // Estimated row height
  overscan: 5, // Render 5 extra items outside viewport
});

// Render only visible items
{virtualizer.getVirtualItems().map((virtualRow) => (
  <TableRow key={virtualRow.key} style={{ height: virtualRow.size }}>
    {/* Row content */}
  </TableRow>
))}
```

**Expected Improvement:** 80-90% faster render for lists with 100+ items

---

### 6. Unoptimized Image Loading

**Issue:** Background images loaded without optimization, lazy loading, or responsive variants.

**Location:**
- `PageBackground.tsx:12` - Large Unsplash image (1920px width)
- No lazy loading
- No WebP format
- No responsive srcset

**Impact:**
- Large initial bundle size
- Slow page load on slow connections
- Unnecessary bandwidth usage
- Poor mobile performance

**Current Code:**
```typescript
// ❌ BAD: Large unoptimized image
backgroundImage: 'url("https://images.unsplash.com/...?w=1920")'
```

**Recommended Solution:**
```typescript
// ✅ GOOD: Use optimized image with lazy loading
// Option 1: Use Unsplash API with size parameters
backgroundImage: 'url("https://images.unsplash.com/...?w=800&q=75&auto=format")'

// Option 2: Host optimized images locally
// Option 3: Use next/image equivalent or similar
// Option 4: Use CSS with responsive images
<picture>
  <source srcset="image-400.webp 400w, image-800.webp 800w" type="image/webp" />
  <img src="image.jpg" loading="lazy" decoding="async" />
</picture>
```

**Expected Improvement:** 40-60% reduction in image load time

---

### 7. Multiple Chart Libraries Loaded

**Issue:** Both Chart.js and Recharts are loaded, increasing bundle size.

**Locations:**
- `AnalyticsPage.tsx` - Uses Chart.js (react-chartjs-2)
- `OrganisationAnalytics.tsx` - Uses Recharts (PieChart)
- `AnalyticsChart.tsx` - Uses Chart.js

**Impact:**
- Larger bundle size (~200-300KB)
- Duplicate chart functionality
- Slower initial load

**Current State:**
- Chart.js: ~150KB
- Recharts: ~200KB
- Total: ~350KB for charts alone

**Recommended Solution:**
```typescript
// ✅ GOOD: Standardize on one library
// Option 1: Use only Chart.js (more features, better docs)
// Option 2: Use only Recharts (smaller, React-native)
// Option 3: Lazy load charts only when needed
const Chart = lazy(() => import('./ChartComponent'));
```

**Expected Improvement:** 150-200KB bundle size reduction

---

### 8. Inefficient Query Key Structure

**Issue:** Some query keys don't properly invalidate or share cache when they should.

**Locations:**
- `Organisations.tsx:59-90` - Separate queries for "all" events vs org-specific
- `use-dashboard-stats.ts` - Multiple similar queries that could share cache
- Query keys don't include all relevant filters

**Impact:**
- Duplicate data fetching
- Inconsistent cache invalidation
- Wasted memory

**Current Code:**
```typescript
// ❌ BAD: Separate queries that could share cache
queryKey: ["events", "StudentRegisteredEvent", "all", CONFIG.PACKAGE_ID]
queryKey: ["events", "StudentRegisteredEvent", orgId, CONFIG.PACKAGE_ID]
```

**Recommended Solution:**
```typescript
// ✅ GOOD: Unified query key structure
queryKey: ["events", "StudentRegisteredEvent", CONFIG.PACKAGE_ID, { orgId, limit }]

// Use query client to share data between queries
const queryClient = useQueryClient();
const allEvents = queryClient.getQueryData(["events", "StudentRegisteredEvent", CONFIG.PACKAGE_ID]);
const filtered = useMemo(() => 
  allEvents?.filter(e => e.organisation === orgId), 
  [allEvents, orgId]
);
```

**Expected Improvement:** 20-30% reduction in duplicate queries

---

## 🟡 High Priority Issues

### 9. Missing useCallback for Some Event Handlers

**Issue:** Some event handlers are recreated on every render, causing child re-renders.

**Locations:**
- `Organisations.tsx` - Filter/sort handlers could use useCallback
- `AnalyticsPage.tsx` - Date filter handlers
- Some inline arrow functions in map/render

**Impact:**
- Unnecessary child component re-renders
- Performance degradation in lists

**Recommended Solution:**
```typescript
// ✅ GOOD: Memoize handlers
const handleFilterChange = useCallback((filter: StatusFilter) => {
  setStatusFilter(filter);
}, []);

const handleSortChange = useCallback((sort: SortOption) => {
  setSortOption(sort);
}, []);
```

**Expected Improvement:** 10-15% reduction in unnecessary renders

---

### 10. Large useMemo Dependencies

**Issue:** Some useMemo hooks have many dependencies, causing frequent recalculations.

**Locations:**
- `OrganisationDetail.tsx` - Multiple useMemo with many dependencies
- `AnalyticsPage.tsx` - Chart data calculations

**Impact:**
- Frequent recalculations
- Potential performance issues

**Current State:**
- ✅ Already using useMemo (good!)
- ⚠️ Some could be optimized further

**Recommended Solution:**
```typescript
// ✅ GOOD: Split complex calculations
const baseData = useMemo(() => computeBase(data), [data]);
const filteredData = useMemo(() => filter(baseData, filters), [baseData, filters]);
const chartData = useMemo(() => transform(filteredData), [filteredData]);
```

**Expected Improvement:** 5-10% performance improvement

---

### 11. Missing Debouncing for Search Inputs

**Issue:** Search inputs trigger filtering on every keystroke without debouncing.

**Locations:**
- `OrganisationDetail.tsx:46-47` - Student and attendance search
- `Organisations.tsx:53` - Organisation search
- `ActivityPage.tsx` - Activity search

**Impact:**
- Unnecessary filtering calculations
- Poor performance with large datasets
- Laggy input on slow devices

**Recommended Solution:**
```typescript
// ✅ GOOD: Debounce search input
import { useDebouncedValue } from '@mantine/hooks'; // or implement custom
// or
const [searchQuery, setSearchQuery] = useState("");
const debouncedSearch = useDebounce(searchQuery, 300);

const filtered = useMemo(() => 
  items.filter(item => item.name.includes(debouncedSearch)),
  [items, debouncedSearch]
);
```

**Expected Improvement:** 30-50% reduction in filtering operations

---

### 12. Missing Code Splitting for Heavy Components

**Issue:** Some heavy components (charts, analytics) are not lazy-loaded.

**Locations:**
- `AnalyticsPage.tsx` - Already lazy-loaded (good!)
- `OrganisationAnalytics.tsx` - Not lazy-loaded (used in dialog)
- Chart components loaded upfront

**Impact:**
- Larger initial bundle
- Slower first contentful paint

**Current State:**
- ✅ Pages are lazy-loaded
- ❌ Some heavy components within pages are not

**Recommended Solution:**
```typescript
// ✅ GOOD: Lazy load heavy components
const OrganisationAnalytics = lazy(() => import('@/components/OrganisationAnalytics'));

// In component:
<Suspense fallback={<Skeleton />}>
  <OrganisationAnalytics />
</Suspense>
```

**Expected Improvement:** 5-10% faster initial load

---

### 13. Missing Error Boundaries for Critical Sections

**Issue:** Only one error boundary at app level, missing granular error handling.

**Locations:**
- `App.tsx:52` - Single error boundary
- No error boundaries around data-heavy sections
- No error boundaries around chart components

**Impact:**
- Entire app crashes on single component error
- Poor user experience
- Difficult error debugging

**Recommended Solution:**
```typescript
// ✅ GOOD: Add error boundaries around critical sections
<ErrorBoundary fallback={<ErrorFallback />}>
  <OrganisationAnalytics />
</ErrorBoundary>

<ErrorBoundary fallback={<ChartError />}>
  <AnalyticsChart />
</ErrorBoundary>
```

**Expected Improvement:** Better error recovery and UX

---

### 14. Inefficient Array Operations in Render

**Issue:** Some array operations (map, filter, reduce) run on every render without memoization.

**Locations:**
- Multiple components with inline array operations
- Complex filtering/sorting in render

**Impact:**
- Unnecessary recalculations
- Performance degradation

**Current State:**
- ✅ Most are already memoized (good!)
- ⚠️ Some inline operations remain

**Recommended Solution:**
```typescript
// ❌ BAD: Inline operation
{items.filter(x => x.active).map(item => <Item key={item.id} />)}

// ✅ GOOD: Memoized
const activeItems = useMemo(() => items.filter(x => x.active), [items]);
{activeItems.map(item => <Item key={item.id} />)}
```

**Expected Improvement:** 5-10% render performance improvement

---

### 15. Missing Service Worker / Caching Strategy

**Issue:** No service worker or advanced caching strategy for static assets.

**Impact:**
- Slower repeat visits
- No offline capability
- Higher bandwidth usage

**Recommended Solution:**
```typescript
// Implement service worker with Workbox
// Cache static assets
// Cache API responses
// Implement stale-while-revalidate strategy
```

**Expected Improvement:** 50-70% faster repeat visits

---

### 16. Missing Bundle Analysis

**Issue:** No bundle size monitoring or analysis in build process.

**Impact:**
- Bundle size can grow unnoticed
- No visibility into what's included
- Difficult to optimize

**Recommended Solution:**
```typescript
// Add to vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({ open: true, filename: 'dist/stats.html' })
  ],
});
```

**Expected Improvement:** Better visibility and optimization opportunities

---

### 17. Missing React.StrictMode in Development

**Issue:** StrictMode is conditionally enabled, which can hide issues.

**Location:**
- `main.tsx:43-44` - Conditional StrictMode

**Impact:**
- Potential issues not caught in development
- Inconsistent behavior

**Recommended Solution:**
```typescript
// ✅ GOOD: Always use StrictMode in development
if (import.meta.env.DEV) {
  root.render(
    <React.StrictMode>
      <AppWrapper />
    </React.StrictMode>
  );
}
```

**Expected Improvement:** Better development experience, catch issues earlier

---

### 18. Missing Performance Monitoring

**Issue:** No performance monitoring or metrics collection.

**Impact:**
- No visibility into real-world performance
- Difficult to identify bottlenecks
- No user experience metrics

**Recommended Solution:**
```typescript
// Add Web Vitals monitoring
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  // Send to analytics service
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

**Expected Improvement:** Better understanding of real-world performance

---

### 19. Missing Request Deduplication

**Issue:** Multiple components might request the same data simultaneously.

**Impact:**
- Duplicate network requests
- Wasted bandwidth
- Slower load times

**Current State:**
- ✅ TanStack Query handles some deduplication
- ⚠️ Could be improved with better query key structure

**Recommended Solution:**
```typescript
// TanStack Query already deduplicates, but ensure:
// 1. Consistent query keys
// 2. Proper staleTime configuration
// 3. Consider request batching for multiple objects
```

**Expected Improvement:** 10-20% reduction in duplicate requests

---

### 20. Missing Optimistic Updates

**Issue:** Some mutations don't use optimistic updates, causing UI lag.

**Locations:**
- Transaction submissions
- Form submissions
- State updates

**Impact:**
- Perceived slowness
- Poor user experience

**Recommended Solution:**
```typescript
// ✅ GOOD: Use optimistic updates
const mutation = useMutation({
  mutationFn: updateData,
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['data']);
    
    // Snapshot previous value
    const previous = queryClient.getQueryData(['data']);
    
    // Optimistically update
    queryClient.setQueryData(['data'], newData);
    
    return { previous };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(['data'], context.previous);
  },
});
```

**Expected Improvement:** Better perceived performance

---

## 🟢 Medium Priority Issues

### 21. Missing Prefetching for Likely Next Actions

**Issue:** No prefetching of data user is likely to need next.

**Impact:**
- Slower navigation
- Perceived lag

**Recommended Solution:**
```typescript
// Prefetch on hover or when component mounts
const queryClient = useQueryClient();

useEffect(() => {
  queryClient.prefetchQuery({
    queryKey: ['organisation', orgId],
    queryFn: () => fetchOrganisation(orgId),
  });
}, [orgId]);
```

---

### 22. Missing Compression for API Responses

**Issue:** No mention of response compression in code.

**Impact:**
- Larger payloads
- Slower transfers

**Recommended Solution:**
- Ensure server sends gzip/brotli compression
- Verify Accept-Encoding headers

---

### 23. Missing Font Optimization

**Issue:** No font-display strategy or font subsetting.

**Impact:**
- FOIT (Flash of Invisible Text)
- Larger font files

**Recommended Solution:**
```css
@font-face {
  font-family: 'CustomFont';
  font-display: swap; /* or optional */
  /* Subset fonts to only needed characters */
}
```

---

### 24. Missing CSS Optimization

**Issue:** No CSS purging or optimization strategy visible.

**Impact:**
- Larger CSS bundle
- Unused styles included

**Recommended Solution:**
- Ensure Tailwind purging is configured
- Use CSS minification
- Consider critical CSS extraction

---

### 25. Missing Accessibility Optimizations

**Issue:** Some components may lack proper ARIA labels and keyboard navigation.

**Impact:**
- Poor accessibility
- Legal compliance issues

**Recommended Solution:**
- Audit with axe-core
- Add proper ARIA labels
- Ensure keyboard navigation

---

### 26. Missing SEO Optimizations

**Issue:** No meta tags, structured data, or SEO considerations visible.

**Impact:**
- Poor search engine visibility
- Missing social sharing previews

**Recommended Solution:**
- Add meta tags
- Implement structured data
- Add Open Graph tags

---

### 27. Missing Loading States for Some Operations

**Issue:** Some async operations don't show loading states.

**Impact:**
- Confusing user experience
- Users may think app is frozen

**Recommended Solution:**
- Add loading skeletons
- Show progress indicators
- Use optimistic updates

---

### 28. Missing Error Recovery Strategies

**Issue:** Limited error recovery and retry logic.

**Impact:**
- Poor user experience on errors
- Users must manually retry

**Recommended Solution:**
- Implement automatic retry with exponential backoff
- Add error recovery UI
- Provide clear error messages

---

### 29. Missing Memory Leak Prevention

**Issue:** Some components may not properly clean up subscriptions or timers.

**Impact:**
- Memory leaks over time
- Performance degradation

**Current State:**
- ✅ Most components have proper cleanup
- ⚠️ Some event listeners might not be cleaned up

**Recommended Solution:**
- Audit all useEffect cleanup functions
- Ensure all subscriptions are unsubscribed
- Verify all timers are cleared

---

### 30. Missing TypeScript Strict Mode

**Issue:** TypeScript may not be in strict mode, allowing potential runtime errors.

**Impact:**
- Potential runtime errors
- Less type safety

**Recommended Solution:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  }
}
```

---

## Summary of Recommendations

### Immediate Actions (Critical)
1. ✅ Implement server-side filtering or reduce fetch limits
2. ✅ Add pagination to all event queries
3. ✅ Increase refetch intervals (reduce polling frequency)
4. ✅ Implement virtual scrolling for large lists
5. ✅ Optimize image loading (lazy load, WebP, responsive)
6. ✅ Standardize on single chart library
7. ✅ Improve query key structure for better caching
8. ✅ Add error boundaries around critical sections

### Short-term Actions (High Priority)
9. ✅ Add useCallback for event handlers
10. ✅ Optimize useMemo dependencies
11. ✅ Add debouncing to search inputs
12. ✅ Lazy load heavy components
13. ✅ Add service worker for caching
14. ✅ Implement bundle analysis
15. ✅ Add performance monitoring

### Long-term Actions (Medium Priority)
16. ✅ Add prefetching strategies
17. ✅ Optimize fonts and CSS
18. ✅ Improve accessibility
19. ✅ Add SEO optimizations
20. ✅ Enhance error recovery

---

## Performance Metrics to Track

### Before Optimization (Estimated)
- Initial Bundle Size: ~800-1000KB
- First Contentful Paint: ~2-3s
- Time to Interactive: ~4-5s
- Largest Contentful Paint: ~3-4s
- Total Blocking Time: ~500-800ms

### After Optimization (Expected)
- Initial Bundle Size: ~500-700KB (30-40% reduction)
- First Contentful Paint: ~1-1.5s (50% improvement)
- Time to Interactive: ~2-3s (40-50% improvement)
- Largest Contentful Paint: ~1.5-2s (50% improvement)
- Total Blocking Time: ~200-400ms (50-60% improvement)

---

## Tools for Monitoring

1. **Lighthouse** - Performance auditing
2. **Web Vitals** - Core Web Vitals tracking
3. **React DevTools Profiler** - Component performance
4. **Bundle Analyzer** - Bundle size analysis
5. **Network Tab** - Request optimization
6. **Performance Tab** - Runtime performance

---

## Notes

- This audit is analysis-only - no code changes were made
- Many optimizations are already in place (React.memo, code splitting, etc.)
- Focus should be on data fetching and bundle optimization
- Mobile performance is already well-optimized with responsive design
- Consider implementing optimizations incrementally to measure impact

---

**End of Audit Report**

