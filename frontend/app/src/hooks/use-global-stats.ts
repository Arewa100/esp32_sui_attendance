import { useQuery } from "@tanstack/react-query";
import { useSuiClient } from "@mysten/dapp-kit";
import { CONFIG } from "@/config";
import { useOrganisationCreatedEvents } from "./use-attendance-events";

export type GlobalStats = {
  totalOrganisations: number;
  totalStudents: number;
  totalRecords: number;
  uptime: number; // percentage
};

function formatNumber(num: number, isEstimate: boolean = false): string {
  let formatted: string;
  if (num >= 1000000) {
    formatted = (num / 1000000).toFixed(1) + "M";
  } else if (num >= 1000) {
    formatted = (num / 1000).toFixed(1) + "K";
  } else {
    formatted = num.toString();
  }
  // Add "+" if it's an estimate (when we hit the query limit)
  return isEstimate ? formatted + "+" : formatted;
}

export function useGlobalStats() {
  const client = useSuiClient();
  
  // Fetch all organisations
  const { data: allOrganisations, isLoading: isLoadingOrgs } = useOrganisationCreatedEvents(1000);
  
  const ATTENDANCE_LIMIT = 1000;
  const STUDENT_LIMIT = 1000;
  
  // Fetch all attendance records
  const { data: allAttendanceEvents, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ["events", "AttendanceRecordedEvent", "global", CONFIG.PACKAGE_ID],
    queryFn: async () => {
      if (!CONFIG.PACKAGE_ID) return [];
      const res = await client.queryEvents({
        query: { MoveEventType: `${CONFIG.PACKAGE_ID}::events::AttendanceRecordedEvent` },
        limit: ATTENDANCE_LIMIT,
        order: "descending",
      });
      return res.data.map((e) => e.parsedJson as any);
    },
    enabled: !!CONFIG.PACKAGE_ID,
    staleTime: 120_000, // Cache for 2 minutes
    refetchInterval: (query) => {
      if (typeof document !== 'undefined' && document.hidden) {
        return false;
      }
      return 180_000; // 3 minutes (reduced from 60s) - global stats change slowly
    },
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    placeholderData: (previousData) => previousData,
  });
  
  // Fetch all student registrations (without orgId filter)
  const { data: allStudentEvents, isLoading: isLoadingStudents } = useQuery({
    queryKey: ["events", "StudentRegisteredEvent", "global", CONFIG.PACKAGE_ID],
    queryFn: async () => {
      if (!CONFIG.PACKAGE_ID) return [];
      const res = await client.queryEvents({
        query: { MoveEventType: `${CONFIG.PACKAGE_ID}::events::StudentRegisteredEvent` },
        limit: STUDENT_LIMIT,
        order: "descending",
      });
      return res.data.map((e) => e.parsedJson as any);
    },
    enabled: !!CONFIG.PACKAGE_ID,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
  
  // Calculate unique students (by student address)
  const uniqueStudents = new Set(allStudentEvents?.map((e: any) => e.student) ?? []).size;
  const hasMoreStudents = (allStudentEvents?.length ?? 0) >= STUDENT_LIMIT;
  const hasMoreRecords = (allAttendanceEvents?.length ?? 0) >= ATTENDANCE_LIMIT;
  
  const stats: GlobalStats = {
    totalOrganisations: allOrganisations?.length ?? 0,
    totalStudents: uniqueStudents,
    totalRecords: allAttendanceEvents?.length ?? 0,
    uptime: 99.9, // Hardcoded for now, can be calculated based on system uptime
  };
  
  const formattedStats = {
    organisations: formatNumber(stats.totalOrganisations, false),
    students: formatNumber(stats.totalStudents, hasMoreStudents),
    records: formatNumber(stats.totalRecords, hasMoreRecords),
    uptime: `${stats.uptime}%`,
  };
  
  return {
    stats,
    formattedStats,
    isLoading: isLoadingOrgs || isLoadingAttendance || isLoadingStudents,
  };
}

