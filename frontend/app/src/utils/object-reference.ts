import { Transaction } from "@mysten/sui/transactions";
import { ObjectMetadata } from "@/hooks/use-object-metadata";

/**
 * Helper function to get the appropriate transaction argument for an object
 * Uses cached metadata to avoid additional network calls during transaction building
 * 
 * Note: The modern Sui SDK's tx.object() automatically handles both owned and shared objects.
 * We cache metadata for validation and future optimizations, but tx.object() works for both.
 * 
 * @param tx - The transaction builder
 * @param objectId - The object ID
 * @param metadata - Cached object metadata (from useObjectMetadata hook) - used for validation
 * @returns Transaction argument (tx.object works for both owned and shared)
 */
export function getObjectReference(
  tx: Transaction,
  objectId: string,
  metadata?: ObjectMetadata | null
): ReturnType<typeof tx.object> {
  // Validate that object exists if metadata is provided
  if (metadata && !metadata.exists) {
    throw new Error(`Object ${objectId} does not exist or is not accessible`);
  }

  // The modern Sui SDK's tx.object() automatically handles both owned and shared objects
  // No need to differentiate - the SDK handles it internally
  return tx.object(objectId);
}

/**
 * Helper to build transaction arguments using cached metadata
 * This eliminates the need for getObject calls during transaction building
 */
export function buildObjectArguments(
  tx: Transaction,
  objects: Array<{ objectId: string; metadata?: ObjectMetadata | null }>
): Array<ReturnType<typeof tx.object>> {
  return objects.map(({ objectId, metadata }) =>
    getObjectReference(tx, objectId, metadata)
  );
}

