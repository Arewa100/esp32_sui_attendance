import { useSuiClient } from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";

export type AttendanceOrganisationFields = {
  name: string;
  owner: string;
  students: string[];
  subscription?: {
    fields?: {
      expiry_timestamp: string | number;
      payment_amount: string | number;
      is_active: boolean;
    };
  };
};

export type StudentFields = {
  name: string;
  department: string;
  card_id: string;
};

export function useOrganisationObject(orgId?: string) {
  const client = useSuiClient();

  return useQuery({
    queryKey: ["object", "AttendanceOrganisation", orgId],
    queryFn: async () => {
      if (!orgId) throw new Error("Missing orgId");
      const res = await client.getObject({
        id: orgId,
        options: { showContent: true, showType: true, showOwner: true },
      });
      const fields = (res.data?.content as any)?.fields as AttendanceOrganisationFields | undefined;
      if (!fields) throw new Error("Organisation object has no readable fields");
      return { object: res, fields };
    },
    enabled: !!orgId,
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

export function useStudentsByIds(studentIds: string[] | undefined) {
  const client = useSuiClient();

  return useQuery({
    queryKey: ["objects", "Students", studentIds?.join(",") ?? ""],
    queryFn: async () => {
      if (!studentIds || studentIds.length === 0) return [];
      const res = await client.multiGetObjects({
        ids: studentIds,
        options: { showContent: true, showType: true },
      });
      return res
        .map((o) => {
          const fields = (o.data?.content as any)?.fields as StudentFields | undefined;
          if (!fields) return null;
          return {
            id: o.data!.objectId,
            fields,
          };
        })
        .filter(Boolean) as Array<{ id: string; fields: StudentFields }>;
    },
    enabled: !!studentIds && studentIds.length > 0,
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}











