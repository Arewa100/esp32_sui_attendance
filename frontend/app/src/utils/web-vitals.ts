import { onCLS, onFID, onFCP, onLCP, onTTFB, Metric } from 'web-vitals';

/**
 * Send Web Vitals metrics to analytics service
 * Currently logs to console in development
 * Can be extended to send to Google Analytics, Plausible, etc.
 */
function sendToAnalytics(metric: Metric) {
  // In production, send to your analytics service
  // Example: Google Analytics
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_category: 'Web Vitals',
      event_label: metric.id,
      non_interaction: true,
    });
  }
  
  // Log to console in development
  if (import.meta.env.DEV) {
    const value = metric.name === 'CLS' ? metric.value.toFixed(4) : Math.round(metric.value);
    console.log(`[Web Vitals] ${metric.name}: ${value}${metric.name === 'CLS' ? '' : 'ms'}`);
  }
}

/**
 * Report Core Web Vitals metrics
 * Call this function in main.tsx after app initialization
 */
export function reportWebVitals() {
  try {
    onCLS(sendToAnalytics);
    onFID(sendToAnalytics);
    onFCP(sendToAnalytics);
    onLCP(sendToAnalytics);
    onTTFB(sendToAnalytics);
  } catch (error) {
    // Silently fail if web-vitals is not available
    if (import.meta.env.DEV) {
      console.warn('Web Vitals reporting failed:', error);
    }
  }
}

