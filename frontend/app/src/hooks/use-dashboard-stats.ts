import { useQuery, useQueries } from "@tanstack/react-query";
import { useSuiClient } from "@mysten/dapp-kit";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useOrganisationCreatedEvents, useAttendanceRecordedEvents } from "./use-attendance-events";
import { CONFIG } from "@/config";

export type DashboardStats = {
  totalOrganisations: number;
  activeStudents: number;
  attendanceRecords: number;
  activeSessions: number;
};

export type RecentActivity = {
  id: string;
  type: "attendance" | "registration" | "organisation";
  message: string;
  org: string;
  time: string;
  timestamp: number;
};

export function useDashboardStats() {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const { data: createdEvents, isLoading: isLoadingEvents, error: eventsError } = useOrganisationCreatedEvents(200);
  
  // Get organizations owned by current user
  const userOrganisations = createdEvents?.filter(
    (e) => account?.address ? e.owner === account.address : false
  ) ?? [];

  // Optimized: Only fetch attendance events for user's organizations
  // Use a more reasonable limit and filter server-side when possible
  const { data: allAttendanceEvents, isLoading: isLoadingAttendance, error: attendanceError } = useQuery({
    queryKey: ["events", "AttendanceRecordedEvent", "user", CONFIG.PACKAGE_ID, account?.address],
    queryFn: async () => {
      if (!CONFIG.PACKAGE_ID || !account?.address) return [];
      
      // Fetch a reasonable amount of events (reduced from 10000)
      const res = await client.queryEvents({
        query: { MoveEventType: `${CONFIG.PACKAGE_ID}::events::AttendanceRecordedEvent` },
        limit: 1000, // Reduced from 10000 for faster loading
        order: "descending",
      });
      // Normalize timestamps to numbers for consistent handling
      return (res.data || []).map((e) => ({
        ...(e.parsedJson as any),
        timestamp: Number((e.parsedJson as any).timestamp),
      }));
    },
    enabled: !!CONFIG.PACKAGE_ID && !!account?.address,
    staleTime: 60_000, // Data is fresh for 1 minute
    refetchInterval: (query) => {
      // Pause polling when tab is hidden
      if (typeof document !== 'undefined' && document.hidden) {
        return false;
      }
      return 60_000; // 1 minute (reduced from 30s)
    },
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    placeholderData: (previousData) => previousData,
  });

  // Filter attendance events to only user's organizations
  const userAttendanceEvents = allAttendanceEvents?.filter((e) =>
    userOrganisations.some((org) => org.organisation === e.organisation)
  ) ?? [];

  // Optimized: Only fetch organization details for active organizations (with recent activity)
  // This reduces the number of parallel queries
  const activeOrgIds = userOrganisations
    .filter((org) => {
      // Only fetch details for orgs with recent activity (last 7 days)
      const recentActivity = userAttendanceEvents?.some(
        (event) => event.organisation === org.organisation && 
        (Date.now() - event.timestamp) < 7 * 24 * 60 * 60 * 1000
      );
      return recentActivity;
    })
    .map((org) => org.organisation)
    .slice(0, 10); // Limit to first 10 active orgs for performance

  // Fetch organization details in parallel (only for active orgs) - using useQueries to avoid Rules of Hooks violation
  const orgQueries = useQueries({
    queries: activeOrgIds.map((orgId) => ({
      queryKey: ["object", "AttendanceOrganisation", orgId],
      queryFn: async () => {
        const res = await client.getObject({
          id: orgId,
          options: { showContent: true, showType: true, showOwner: true },
        });
        const fields = (res.data?.content as any)?.fields;
        if (!fields) return null;
        return { object: res, fields, orgId };
      },
      enabled: !!orgId,
      staleTime: 10_000,
    })),
  });

  // Calculate stats with optimized calculations
  const stats: DashboardStats = {
    totalOrganisations: userOrganisations.length,
    // Use cached data or estimate from events
    activeStudents: orgQueries.reduce((sum, query) => {
      return sum + (query.data?.fields?.students?.length ?? 0);
    }, 0),
    attendanceRecords: userAttendanceEvents?.length ?? 0,
    activeSessions: userOrganisations.filter((org) => {
      // An active session is an organization with recent activity (within last 24 hours)
      const recentActivity = userAttendanceEvents?.some(
        (event) => event.organisation === org.organisation && 
        (Date.now() - event.timestamp) < 24 * 60 * 60 * 1000
      );
      return recentActivity;
    }).length,
  };

  return {
    stats,
    isLoading: isLoadingEvents || isLoadingAttendance || orgQueries.some((query) => query.isLoading),
    error: eventsError || attendanceError,
    userOrganisations,
    userAttendanceEvents,
  };
}

export function useRecentActivity(limit = 5) {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const { data: createdEvents } = useOrganisationCreatedEvents(200);
  
  // Optimized: Fetch only what we need (limit * 2 for filtering buffer)
  const { data: allAttendanceEvents, error: recentError } = useQuery({
    queryKey: ["events", "AttendanceRecordedEvent", "recent", CONFIG.PACKAGE_ID, limit],
    queryFn: async () => {
      if (!CONFIG.PACKAGE_ID) return [];
      const res = await client.queryEvents({
        query: { MoveEventType: `${CONFIG.PACKAGE_ID}::events::AttendanceRecordedEvent` },
        limit: limit * 10, // Fetch more than needed for filtering, but not too much
        order: "descending",
      });
      return (res.data || []).map((e) => ({
        ...(e.parsedJson as any),
        timestamp: Number((e.parsedJson as any).timestamp),
      }));
    },
    enabled: !!CONFIG.PACKAGE_ID && !!account?.address,
    staleTime: 60_000, // Data is fresh for 1 minute
    refetchInterval: (query) => {
      // Pause polling when tab is hidden
      if (typeof document !== 'undefined' && document.hidden) {
        return false;
      }
      return 60_000; // 1 minute (reduced from 30s)
    },
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    placeholderData: (previousData) => previousData,
  });

  // Get user's organizations
  const userOrganisations = createdEvents?.filter(
    (e) => account?.address ? e.owner === account.address : false
  ) ?? [];

  const orgNameMap = new Map(
    userOrganisations.map((org) => [org.organisation, org.name])
  );

  // Optimized: Fetch student events with reasonable limit
  const { data: studentEvents } = useQuery({
    queryKey: ["events", "StudentRegisteredEvent", "recent", CONFIG.PACKAGE_ID, limit],
    queryFn: async () => {
      if (!CONFIG.PACKAGE_ID) return [];
      const res = await client.queryEvents({
        query: { MoveEventType: `${CONFIG.PACKAGE_ID}::events::StudentRegisteredEvent` },
        limit: 500, // Reduced from 1000
        order: "descending",
      });
      return (res.data || []).map((e) => e.parsedJson as any);
    },
    enabled: !!CONFIG.PACKAGE_ID && !!account?.address,
    staleTime: 120_000, // Longer cache for student data (changes less frequently)
    refetchInterval: (query) => {
      // Pause polling when tab is hidden
      if (typeof document !== 'undefined' && document.hidden) {
        return false;
      }
      return 120_000; // 2 minutes - student data changes rarely
    },
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    placeholderData: (previousData) => previousData,
  });

  const studentNameMap = new Map(
    studentEvents?.map((e) => [e.student, e.name]) ?? []
  );

  // Build recent activity from attendance events
  const activities: RecentActivity[] = (allAttendanceEvents ?? [])
    .filter((e) => userOrganisations.some((org) => org.organisation === e.organisation))
    .slice(0, limit)
    .map((event, idx) => {
      const studentName = studentNameMap.get(event.student) ?? "Unknown Student";
      const orgName = orgNameMap.get(event.organisation) ?? "Unknown Organisation";
      const timestamp = Number(event.timestamp);
      const timeAgo = getTimeAgo(timestamp);

      return {
        id: `attendance-${idx}-${event.record}`,
        type: "attendance" as const,
        message: `${studentName} checked in`,
        org: orgName,
        time: timeAgo,
        timestamp,
      };
    });

  // Add organization creation events with real timestamps
  const orgActivities: RecentActivity[] = userOrganisations
    .slice(0, Math.max(0, limit - activities.length))
    .map((org, idx) => {
      // Use timestampMs from the event if available (check for undefined/null, not just falsy)
      // timestampMs comes from Sui event metadata (e.timestampMs)
      const timestamp = (org.timestampMs !== undefined && org.timestampMs !== null && org.timestampMs > 0) 
        ? org.timestampMs 
        : Date.now() - (idx * 24 * 60 * 60 * 1000); // Fallback: spread over days if no timestamp
      const timeAgo = (org.timestampMs !== undefined && org.timestampMs !== null && org.timestampMs > 0)
        ? getTimeAgo(timestamp)
        : "Recently";
      
      return {
        id: `org-${idx}-${org.organisation}`,
        type: "organisation" as const,
        message: "New organisation created",
        org: org.name,
        time: timeAgo,
        timestamp,
      };
    });

  // Combine and sort by timestamp (most recent first)
  const allActivities = [...activities, ...orgActivities]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);

  return {
    activities: allActivities,
    isLoading: false,
    error: recentError,
  };
}

function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return `${seconds} sec ago`;
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  return `${days} day${days > 1 ? "s" : ""} ago`;
}
