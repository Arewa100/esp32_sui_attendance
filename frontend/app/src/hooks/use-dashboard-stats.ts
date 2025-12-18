import { useQuery } from "@tanstack/react-query";
import { useSuiClient } from "@mysten/dapp-kit";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useOrganisationCreatedEvents, useAttendanceRecordedEvents } from "./use-attendance-events";
import { useOrganisationObject } from "./use-attendance-objects";
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
  const { data: createdEvents } = useOrganisationCreatedEvents(200);
  
  // Get organizations owned by current user
  const userOrganisations = createdEvents?.filter(
    (e) => account?.address ? e.owner === account.address : false
  ) ?? [];

  // Get all attendance events
  const { data: allAttendanceEvents } = useQuery({
    queryKey: ["events", "AttendanceRecordedEvent", "all", CONFIG.PACKAGE_ID],
    queryFn: async () => {
      if (!CONFIG.PACKAGE_ID) return [];
      const res = await client.queryEvents({
        query: { MoveEventType: `${CONFIG.PACKAGE_ID}::events::AttendanceRecordedEvent` },
        limit: 10000,
        order: "descending",
      });
      return res.data.map((e) => e.parsedJson as any);
    },
    enabled: !!CONFIG.PACKAGE_ID && !!account?.address,
    staleTime: 10_000,
    refetchInterval: 15_000,
  });

  // Filter attendance events to only user's organizations
  const userAttendanceEvents = allAttendanceEvents?.filter((e) =>
    userOrganisations.some((org) => org.organisation === e.organisation)
  ) ?? [];

  // Fetch organization details in parallel
  const orgQueries = userOrganisations.map((org) => ({
    id: org.organisation,
    query: useOrganisationObject(org.organisation),
  }));

  // Calculate stats
  const stats: DashboardStats = {
    totalOrganisations: userOrganisations.length,
    activeStudents: orgQueries.reduce((sum, { query }) => {
      return sum + (query.data?.fields?.students?.length ?? 0);
    }, 0),
    attendanceRecords: userAttendanceEvents.length,
    activeSessions: userOrganisations.filter((org) => {
      // An active session is an organization with recent activity (within last 24 hours)
      const recentActivity = userAttendanceEvents.some(
        (event) => event.organisation === org.organisation && 
        (Date.now() - Number(event.timestamp)) < 24 * 60 * 60 * 1000
      );
      return recentActivity;
    }).length,
  };

  return {
    stats,
    isLoading: orgQueries.some(({ query }) => query.isLoading),
    userOrganisations,
    userAttendanceEvents,
  };
}

export function useRecentActivity(limit = 5) {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const { data: createdEvents } = useOrganisationCreatedEvents(200);
  const { data: allAttendanceEvents } = useQuery({
    queryKey: ["events", "AttendanceRecordedEvent", "all", CONFIG.PACKAGE_ID, limit],
    queryFn: async () => {
      if (!CONFIG.PACKAGE_ID) return [];
      const res = await client.queryEvents({
        query: { MoveEventType: `${CONFIG.PACKAGE_ID}::events::AttendanceRecordedEvent` },
        limit: 500,
        order: "descending",
      });
      return res.data.map((e) => ({
        ...(e.parsedJson as any),
        timestamp: Number((e.parsedJson as any).timestamp),
      }));
    },
    enabled: !!CONFIG.PACKAGE_ID && !!account?.address,
    staleTime: 10_000,
    refetchInterval: 15_000,
  });

  // Get user's organizations
  const userOrganisations = createdEvents?.filter(
    (e) => account?.address ? e.owner === account.address : false
  ) ?? [];

  const orgNameMap = new Map(
    userOrganisations.map((org) => [org.organisation, org.name])
  );

  // Fetch student names for attendance events
  const { data: studentEvents } = useQuery({
    queryKey: ["events", "StudentRegisteredEvent", "all", CONFIG.PACKAGE_ID, limit],
    queryFn: async () => {
      if (!CONFIG.PACKAGE_ID) return [];
      const res = await client.queryEvents({
        query: { MoveEventType: `${CONFIG.PACKAGE_ID}::events::StudentRegisteredEvent` },
        limit: 1000,
        order: "descending",
      });
      return res.data.map((e) => e.parsedJson as any);
    },
    enabled: !!CONFIG.PACKAGE_ID && !!account?.address,
    staleTime: 10_000,
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

  // Add organization creation events
  const orgActivities: RecentActivity[] = userOrganisations
    .slice(0, Math.max(0, limit - activities.length))
    .map((org, idx) => ({
      id: `org-${idx}-${org.organisation}`,
      type: "organisation" as const,
      message: "New organisation created",
      org: org.name,
      time: "Recently",
      timestamp: 0,
    }));

  // Combine and sort by timestamp (most recent first)
  const allActivities = [...activities, ...orgActivities]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);

  return {
    activities: allActivities,
    isLoading: false,
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
