import { useSuiClient } from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export type ObjectMetadata = {
  exists: boolean;
  isShared: boolean;
  sharedVersion?: string;
  ownerAddress?: string;
  objectId: string;
  // Cache timestamp for invalidation
  cachedAt: number;
};

/**
 * Hook to fetch and cache object metadata (sharedVersion, isShared, owner)
 * This should be called proactively before transactions to eliminate blocking calls
 */
export function useObjectMetadata(objectId: string | undefined) {
  const client = useSuiClient();
  const [cachedMetadata, setCachedMetadata] = useState<ObjectMetadata | null>(null);

  const query = useQuery({
    queryKey: ["object-metadata", objectId],
    queryFn: async (): Promise<ObjectMetadata> => {
      if (!objectId) {
        throw new Error("Missing objectId");
      }

      try {
        const res = await client.getObject({
          id: objectId,
          options: {
            showOwner: true,
            showType: true,
          },
        });

        if (!res.data) {
          return {
            exists: false,
            isShared: false,
            objectId,
            cachedAt: Date.now(),
          };
        }

        const owner = res.data.owner;
        const isShared = !!(owner && typeof owner === 'object' && 'Shared' in owner);
        const sharedVersion = isShared && typeof owner === 'object' && 'Shared' in owner
          ? (owner as { Shared: { initial_shared_version: string } }).Shared.initial_shared_version
          : undefined;
        const ownerAddress = owner && typeof owner === 'object' && 'AddressOwner' in owner
          ? (owner as { AddressOwner: string }).AddressOwner
          : owner && typeof owner === 'object' && 'ObjectOwner' in owner
          ? (owner as { ObjectOwner: string }).ObjectOwner
          : undefined;

        const metadata: ObjectMetadata = {
          exists: true,
          isShared,
          sharedVersion,
          ownerAddress,
          objectId,
          cachedAt: Date.now(),
        };

        // Cache in state for immediate access
        setCachedMetadata(metadata);
        return metadata;
      } catch (error) {
        // Object might not exist or be inaccessible
        return {
          exists: false,
          isShared: false,
          objectId,
          cachedAt: Date.now(),
        };
      }
    },
    enabled: !!objectId,
    staleTime: 30_000, // Cache for 30 seconds
    gcTime: 300_000, // Keep in cache for 5 minutes
    retry: 1, // Only retry once
  });

  // Return cached metadata if available, otherwise return query result
  return {
    ...query,
    data: cachedMetadata || query.data,
    // Helper to check if metadata is ready
    isReady: !!cachedMetadata || (query.isSuccess && !!query.data),
  };
}

/**
 * Hook to pre-fetch multiple object metadata in parallel
 * Use this when you need metadata for multiple objects before a transaction
 */
export function useMultipleObjectMetadata(objectIds: (string | undefined)[]) {
  const client = useSuiClient();
  const validIds = objectIds.filter((id): id is string => !!id);

  return useQuery({
    queryKey: ["object-metadata-batch", validIds.sort().join(",")],
    queryFn: async (): Promise<Map<string, ObjectMetadata>> => {
      if (validIds.length === 0) {
        return new Map();
      }

      // Fetch all objects in parallel
      const results = await Promise.allSettled(
        validIds.map(async (objectId) => {
          try {
            const res = await client.getObject({
              id: objectId,
              options: {
                showOwner: true,
                showType: true,
              },
            });

            if (!res.data) {
              return {
                objectId,
                metadata: {
                  exists: false,
                  isShared: false,
                  objectId,
                  cachedAt: Date.now(),
                },
              };
            }

            const owner = res.data.owner;
            const isShared = !!(owner && typeof owner === 'object' && 'Shared' in owner);
            const sharedVersion = isShared && typeof owner === 'object' && 'Shared' in owner
              ? (owner as { Shared: { initial_shared_version: string } }).Shared.initial_shared_version
              : undefined;
            const ownerAddress = owner && typeof owner === 'object' && 'AddressOwner' in owner
              ? (owner as { AddressOwner: string }).AddressOwner
              : owner && typeof owner === 'object' && 'ObjectOwner' in owner
              ? (owner as { ObjectOwner: string }).ObjectOwner
              : undefined;

            return {
              objectId,
              metadata: {
                exists: true,
                isShared,
                sharedVersion,
                ownerAddress,
                objectId,
                cachedAt: Date.now(),
              },
            };
          } catch (error) {
            return {
              objectId,
              metadata: {
                exists: false,
                isShared: false,
                objectId,
                cachedAt: Date.now(),
              },
            };
          }
        })
      );

      const metadataMap = new Map<string, ObjectMetadata>();
      results.forEach((result) => {
        if (result.status === "fulfilled") {
          metadataMap.set(result.value.objectId, result.value.metadata);
        }
      });

      return metadataMap;
    },
    enabled: validIds.length > 0,
    staleTime: 30_000,
    gcTime: 300_000,
  });
}

/**
 * Hook to pre-fetch object metadata when a component/modal mounts
 * Use this in useEffect to proactively fetch data before user interaction
 */
export function usePreFetchObjectMetadata(objectId: string | undefined) {
  const metadata = useObjectMetadata(objectId);

  useEffect(() => {
    // Trigger fetch immediately when objectId is available
    if (objectId && !metadata.data) {
      metadata.refetch();
    }
  }, [objectId]);

  return metadata;
}

