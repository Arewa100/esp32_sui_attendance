import { useSuiClient } from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";
import { CONFIG } from "@/config";

export type OrganisationCreatedEvent = {
  organisation: string;
  name: string;
  owner: string;
  timestampMs?: number; // Event creation timestamp from blockchain
};

export type StudentRegisteredEvent = {
  student: string;
  name: string;
  department: string;
  card_id: string;
  organisation: string;
};

export type AttendanceRecordedEvent = {
  record: string;
  student: string;
  timestamp: string | number;
  organisation: string;
};

export type SubscriptionRenewedEvent = {
  organisation: string;
  expiry_timestamp: string | number;
  payment_amount: string | number;
};

export type DeviceRegisteredEvent = {
  organisation: string;
  device_id: string;
};

export type DeviceUnregisteredEvent = {
  organisation: string;
  device_id: string;
};

export type DeviceHeartbeatEvent = {
  organisation: string;
  device_id: string;
  timestamp: string | number;
};

function requirePackageId() {
  if (!CONFIG.PACKAGE_ID) {
    throw new Error("Missing VITE_PACKAGE_ID in frontend/app/.env");
  }
  return CONFIG.PACKAGE_ID;
}

export function useOrganisationCreatedEvents(limit = 200) {
  const client = useSuiClient();
  return useQuery({
    queryKey: ["events", "OrganisationCreatedEvent", CONFIG.PACKAGE_ID, limit],
    queryFn: async () => {
      const pkg = requirePackageId();
      const res = await client.queryEvents({
        query: { MoveEventType: `${pkg}::events::OrganisationCreatedEvent` },
        limit,
        order: "descending",
      });
      return (res.data || []).map((e) => ({
        ...(e.parsedJson as unknown as OrganisationCreatedEvent),
        timestampMs: Number(e.timestampMs),
      }));
    },
    enabled: !!CONFIG.PACKAGE_ID,
    staleTime: 60_000, // Data is fresh for 1 minute
    refetchInterval: (query) => {
      if (typeof document !== 'undefined' && document.hidden) {
        return false;
      }
      return 120_000; // 2 minutes (reduced from 30s)
    },
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnReconnect: true, // Refetch on network reconnect
    placeholderData: (previousData) => previousData, // Use placeholder for instant updates
  });
}

export function useStudentRegisteredEvents(orgId?: string, limit = 500) {
  const client = useSuiClient();
  return useQuery({
    queryKey: ["events", "StudentRegisteredEvent", CONFIG.PACKAGE_ID, orgId, limit],
    queryFn: async () => {
      const pkg = requirePackageId();
      const res = await client.queryEvents({
        query: { MoveEventType: `${pkg}::events::StudentRegisteredEvent` },
        limit,
        order: "descending",
      });
      const items = (res.data || []).map((e) => e.parsedJson as unknown as StudentRegisteredEvent);
      return orgId ? items.filter((x) => x.organisation === orgId) : items;
    },
    enabled: !!CONFIG.PACKAGE_ID && !!orgId,
    staleTime: 30_000, // Data is fresh for 30 seconds
    refetchInterval: (query) => {
      if (typeof document !== 'undefined' && document.hidden) {
        return false;
      }
      return 30_000; // 30 seconds (reduced from 15s)
    },
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    placeholderData: (previousData) => previousData,
  });
}

export function useAttendanceRecordedEvents(orgId?: string, limit = 500) {
  const client = useSuiClient();
  return useQuery({
    queryKey: ["events", "AttendanceRecordedEvent", CONFIG.PACKAGE_ID, orgId, limit],
    queryFn: async () => {
      const pkg = requirePackageId();
      const res = await client.queryEvents({
        query: { MoveEventType: `${pkg}::events::AttendanceRecordedEvent` },
        limit,
        order: "descending",
      });
      const items = (res.data || []).map((e) => e.parsedJson as unknown as AttendanceRecordedEvent);
      return orgId ? items.filter((x) => x.organisation === orgId) : items;
    },
    enabled: !!CONFIG.PACKAGE_ID && !!orgId,
    staleTime: 30_000, // Data is fresh for 30 seconds
    refetchInterval: (query) => {
      if (typeof document !== 'undefined' && document.hidden) {
        return false;
      }
      return 30_000; // 30 seconds (reduced from 15s) - still real-time enough
    },
    refetchOnWindowFocus: true, // Immediate update when user returns
    refetchOnReconnect: true, // Refetch on network reconnect
    placeholderData: (previousData) => previousData, // Show stale data while fetching
  });
}

export function useSubscriptionRenewedEvents(orgId?: string, limit = 200) {
  const client = useSuiClient();
  return useQuery({
    queryKey: ["events", "SubscriptionRenewedEvent", CONFIG.PACKAGE_ID, orgId, limit],
    queryFn: async () => {
      const pkg = requirePackageId();
      const res = await client.queryEvents({
        query: { MoveEventType: `${pkg}::events::SubscriptionRenewedEvent` },
        limit,
        order: "descending",
      });
      const items = (res.data || []).map((e) => e.parsedJson as unknown as SubscriptionRenewedEvent);
      return orgId ? items.filter((x) => x.organisation === orgId) : items;
    },
    enabled: !!CONFIG.PACKAGE_ID && !!orgId,
    staleTime: 60_000, // Data is fresh for 1 minute
    refetchInterval: (query) => {
      if (typeof document !== 'undefined' && document.hidden) {
        return false;
      }
      return 120_000; // 2 minutes (reduced from 30s) - subscriptions change rarely
    },
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    placeholderData: (previousData) => previousData,
  });
}

export function useDeviceRegisteredEvents(orgId?: string, limit = 500) {
  const client = useSuiClient();
  return useQuery({
    queryKey: ["events", "DeviceRegisteredEvent", CONFIG.PACKAGE_ID, orgId, limit],
    queryFn: async () => {
      const pkg = requirePackageId();
      const res = await client.queryEvents({
        query: { MoveEventType: `${pkg}::events::DeviceRegisteredEvent` },
        limit,
        order: "descending",
      });
      const items = (res.data || []).map((e) => e.parsedJson as unknown as DeviceRegisteredEvent);
      return orgId ? items.filter((x) => x.organisation === orgId) : items;
    },
    enabled: !!CONFIG.PACKAGE_ID && !!orgId,
    staleTime: 60_000, // Data is fresh for 1 minute
    refetchInterval: (query) => {
      if (typeof document !== 'undefined' && document.hidden) {
        return false;
      }
      return 60_000; // 1 minute (reduced from 15s) - devices registered rarely
    },
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    placeholderData: (previousData) => previousData,
  });
}

export function useDeviceHeartbeatEvents(orgId?: string, limit = 500) {
  const client = useSuiClient();
  return useQuery({
    queryKey: ["events", "DeviceHeartbeatEvent", CONFIG.PACKAGE_ID, orgId, limit],
    queryFn: async () => {
      const pkg = requirePackageId();
      const res = await client.queryEvents({
        query: { MoveEventType: `${pkg}::events::DeviceHeartbeatEvent` },
        limit,
        order: "descending",
      });
      const items = (res.data || []).map((e) => e.parsedJson as unknown as DeviceHeartbeatEvent);
      return orgId ? items.filter((x) => x.organisation === orgId) : items;
    },
    enabled: !!CONFIG.PACKAGE_ID && !!orgId,
    staleTime: 60_000, // Data is fresh for 1 minute
    refetchInterval: (query) => {
      if (typeof document !== 'undefined' && document.hidden) {
        return false;
      }
      return 60_000; // 1 minute (reduced from 15s) - devices send heartbeats hourly
    },
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    placeholderData: (previousData) => previousData,
  });
}











