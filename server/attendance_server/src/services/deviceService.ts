import { EventId } from "@mysten/sui/client";
import { suiService } from "./suiClient";
import { config } from "../config/env";
import { log } from "../utils/logger";

// Cache: deviceId -> orgObjectId (for quick lookups)
const deviceCache = new Map<string, string>();

/**
 * Get organisation object ID by device ID from blockchain events
 */
export async function getOrgByDeviceId(
  deviceId: string
): Promise<string | null> {
  // Check cache first
  if (deviceCache.has(deviceId)) {
    const cachedOrg = deviceCache.get(deviceId)!;
    log.info(`Found device in cache: ${deviceId} -> ${cachedOrg}`);
    return cachedOrg;
  }

  try {
    log.info(`Searching for organisation with deviceId: ${deviceId}`);

    // Query DeviceRegisteredEvent to find organisation
    let cursor: EventId | undefined = undefined;
    let hasMore = true;
    let pageCount = 0;

    while (hasMore && pageCount < 50) {
      const events = await suiService.queryEvents(
        {
          MoveEventType: `${config.packageId}::events::DeviceRegisteredEvent`,
        },
        50,
        cursor
      );

      // Find device with matching device_id
      for (const event of events.data) {
        if (event.parsedJson && typeof event.parsedJson === "object") {
          const eventData = event.parsedJson as any;
          
          if (eventData.device_id === deviceId) {
            const orgObjectId = eventData.organisation;
            log.info(`Found device: ${deviceId} -> ${orgObjectId}`);
            
            // Cache the result
            deviceCache.set(deviceId, orgObjectId);
            
            return orgObjectId;
          }
        }
      }

      hasMore = events.hasNextPage;
      cursor = events.nextCursor || undefined;
      pageCount++;
    }

    log.error(`No organisation found for deviceId: ${deviceId}`);
    return null;
  } catch (error) {
    log.error("Error fetching organisation by device ID", error);
    throw error;
  }
}

/**
 * Get device heartbeat timestamp from organisation
 */
export async function getDeviceHeartbeat(
  orgObjectId: string,
  _deviceId: string
): Promise<number | null> {
  try {
    const org = await suiService.getObject(orgObjectId);
    
    if (!org?.content || !("fields" in org.content)) {
      log.warn(`Cannot read organisation object: ${orgObjectId}`);
      return null;
    }

    const fields = (org.content as any).fields;
    const deviceHeartbeats = fields?.device_heartbeats;

    if (!deviceHeartbeats || !("fields" in deviceHeartbeats)) {
      log.info(`No device heartbeats found for org: ${orgObjectId}`);
      return null;
    }

    // Look up heartbeat for this device
    // Note: Table access via SDK may require different approach depending on SDK version
    // This is a placeholder - actual implementation may need adjustment based on SDK
    log.warn("getDeviceHeartbeat: Direct table access not available via SDK. Use event queries instead.");
    
    return null;
  } catch (error) {
    log.error("Error getting device heartbeat", error);
    return null;
  }
}

/**
 * Clear device cache
 */
export function clearDeviceCache(): void {
  deviceCache.clear();
  log.info("Device cache cleared");
}

/**
 * Get cache statistics
 */
export function getDeviceCacheStats() {
  return {
    deviceCacheSize: deviceCache.size,
    cachedDeviceIds: Array.from(deviceCache.keys()),
  };
}

