import { useSuiClient } from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";
import { CONFIG } from "@/config";

export type OrganisationCreatedEvent = {
  organisation: string;
  name: string;
  owner: string;
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
      return res.data.map((e) => e.parsedJson as unknown as OrganisationCreatedEvent);
    },
    enabled: !!CONFIG.PACKAGE_ID,
    staleTime: 10_000,
    refetchInterval: 15_000,
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
      const items = res.data.map((e) => e.parsedJson as unknown as StudentRegisteredEvent);
      return orgId ? items.filter((x) => x.organisation === orgId) : items;
    },
    enabled: !!CONFIG.PACKAGE_ID && !!orgId,
    staleTime: 10_000,
    refetchInterval: 15_000,
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
      const items = res.data.map((e) => e.parsedJson as unknown as AttendanceRecordedEvent);
      return orgId ? items.filter((x) => x.organisation === orgId) : items;
    },
    enabled: !!CONFIG.PACKAGE_ID && !!orgId,
    staleTime: 10_000,
    refetchInterval: 15_000,
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
      const items = res.data.map((e) => e.parsedJson as unknown as SubscriptionRenewedEvent);
      return orgId ? items.filter((x) => x.organisation === orgId) : items;
    },
    enabled: !!CONFIG.PACKAGE_ID && !!orgId,
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}








