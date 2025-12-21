import { Transaction } from "@mysten/sui/transactions";
import { EventId } from "@mysten/sui/client";
import { suiService } from "./suiClient";
import { config } from "../config/env";
import { log } from "../utils/logger";
import { AttendanceEvent, SubscriptionStatus } from "../models/attendanceEvent";

// Shared Clock object ID on Sui
const CLOCK_OBJECT_ID = "0x6";

// In-memory cache: cardId -> student address (for quick lookups)
const studentCache = new Map<string, { address: string; orgObjectId: string }>();

/**
 * Get student address by card ID from blockchain events
 */
export async function getStudentByCardId(
  orgObjectId: string,
  cardId: string
): Promise<string | null> {
  // Check cache first
  const cacheKey = `${orgObjectId}:${cardId}`;
  if (studentCache.has(cacheKey)) {
    const cached = studentCache.get(cacheKey)!;
    log.info(`Found student in cache: ${cardId} -> ${cached.address}`);
    return cached.address;
  }

  try {
    log.info(`Searching for student with cardId: ${cardId} in org: ${orgObjectId}`);

    // Query StudentRegisteredEvent to find student
    let cursor: EventId | undefined = undefined;
    let hasMore = true;
    let pageCount = 0;

    while (hasMore && pageCount < 50) {
      const events = await suiService.queryEvents(
        {
          MoveEventType: `${config.packageId}::events::StudentRegisteredEvent`,
        },
        50,
        cursor
      );

      // Find student with matching card_id and organisation
      for (const event of events.data) {
        if (event.parsedJson && typeof event.parsedJson === "object") {
          const eventData = event.parsedJson as any;
          
          if (
            eventData.card_id === cardId &&
            eventData.organisation === orgObjectId
          ) {
            const studentAddress = eventData.student;
            log.info(`Found student: ${cardId} -> ${studentAddress}`);
            
            // Cache the result
            studentCache.set(cacheKey, { address: studentAddress, orgObjectId });
            
            return studentAddress;
          }
        }
      }

      hasMore = events.hasNextPage;
      cursor = events.nextCursor || undefined;
      pageCount++;
    }

    log.error(`No student found for cardId: ${cardId} in org: ${orgObjectId}`);
    return null;
  } catch (error) {
    log.error("Error fetching student by card ID", error);
    throw error;
  }
}

/**
 * Check if subscription is active for an organization
 */
export async function checkSubscriptionActive(
  orgObjectId: string
): Promise<boolean> {
  try {
    const org = await suiService.getObject(orgObjectId);
    
    if (!org?.content || !("fields" in org.content)) {
      log.warn(`Cannot read organisation object: ${orgObjectId}`);
      return false;
    }

    const fields = (org.content as any).fields;
    const subscription = fields?.subscription;

    if (!subscription || !("fields" in subscription)) {
      log.info(`No subscription found for org: ${orgObjectId}`);
      return false;
    }

    const currentTime = Date.now();
    const expiryTimestamp = Number(subscription.fields.expiry_timestamp);
    const isActive = 
      expiryTimestamp > currentTime && 
      subscription.fields.is_active === true;

    log.info(`Subscription status for ${orgObjectId}: ${isActive ? "ACTIVE" : "INACTIVE"}`);
    log.info(`Expiry: ${new Date(expiryTimestamp).toISOString()}`);
    
    return isActive;
  } catch (error) {
    log.error("Error checking subscription status", error);
    return false;
  }
}

/**
 * Get subscription status details
 */
export async function getSubscriptionStatus(
  orgObjectId: string
): Promise<SubscriptionStatus> {
  try {
    const org = await suiService.getObject(orgObjectId);
    
    if (!org?.content || !("fields" in org.content)) {
      return {
        isActive: false,
        expiryTimestamp: 0,
        paymentAmount: 0,
      };
    }

    const fields = (org.content as any).fields;
    const subscription = fields?.subscription;

    if (!subscription || !("fields" in subscription)) {
      return {
        isActive: false,
        expiryTimestamp: 0,
        paymentAmount: 0,
      };
    }

    const currentTime = Date.now();
    const expiryTimestamp = Number(subscription.fields.expiry_timestamp);
    const isActive = 
      expiryTimestamp > currentTime && 
      subscription.fields.is_active === true;

    return {
      isActive,
      expiryTimestamp,
      paymentAmount: Number(subscription.fields.payment_amount || 0),
    };
  } catch (error) {
    log.error("Error getting subscription status", error);
    return {
      isActive: false,
      expiryTimestamp: 0,
      paymentAmount: 0,
    };
  }
}

/**
 * Record attendance on blockchain
 */
export async function recordAttendance(
  orgObjectId: string,
  studentAddress: string
): Promise<string> {
  log.info(`Recording attendance for student: ${studentAddress} in org: ${orgObjectId}`);

  // Verify organisation object exists
  try {
    const org = await suiService.getObject(orgObjectId);
    log.info(`Organisation object verified:`, {
      objectId: orgObjectId,
      type: org?.type,
      hasContent: !!org?.content,
    });
  } catch (verifyError) {
    log.error(`Cannot access organisation object ${orgObjectId}:`, verifyError);
    throw new Error(`Organisation object verification failed: ${verifyError}`);
  }

  // Check subscription before recording
  const isActive = await checkSubscriptionActive(orgObjectId);
  if (!isActive) {
    const error = "Subscription expired or inactive. Please renew subscription.";
    log.error(`${error}`);
    throw new Error(error);
  }

  const tx = new Transaction();

  // Call record_attendance function
  // Note: system parameter is now required (first argument) for access control
  tx.moveCall({
    target: `${config.packageId}::attendance_system::record_attendance`,
    arguments: [
      tx.object(config.systemObjectId), // AttendanceSystem shared object
      tx.object(orgObjectId), // AttendanceOrganisation shared object
      tx.pure.address(studentAddress),
      tx.object(CLOCK_OBJECT_ID), // Shared Clock object
    ],
  });

  // Set gas budget
  tx.setGasBudget(100_000_000);

  try {
    log.info(`Sending attendance transaction to Sui network...`);
    log.info(`Target: ${config.packageId}::attendance_system::record_attendance`);
    log.info(`Network: ${config.network}`);
    log.info(`Signer: ${suiService.address}`);

    const result = await suiService.executeTransaction(tx);
    const digest = result.digest;
    
    log.info(`Attendance recorded successfully!`);
    log.info(`Transaction digest: ${digest}`);
    log.info(`Effects status: ${result.effects?.status?.status}`);
    
    if (result.events && result.events.length > 0) {
      log.info(`Events emitted: ${result.events.length}`);
      result.events.forEach((event, idx) => {
        log.info(`Event ${idx}:`, JSON.stringify(event, null, 2));
      });
    }

    return digest;
  } catch (error: any) {
    log.error("Failed to record attendance - DETAILED ERROR:");
    log.error("Error type:", error?.constructor?.name || typeof error);
    log.error("Error message:", error?.message || String(error));
    
    // Check for subscription expired error
    const errorString = String(error?.message || error);
    if (errorString.includes("subscription") || errorString.includes("expired")) {
      log.warn("Subscription-related error detected");
    }

    throw error;
  }
}

/**
 * Process attendance event from ESP32
 */
export async function processAttendanceEvent(
  event: AttendanceEvent
): Promise<void> {
  try {
    log.info(`Processing attendance event for cardId: ${event.cardId}`);
    log.info(`Event details:`, {
      cardId: event.cardId,
      orgObjectId: event.orgObjectId,
      deviceId: event.deviceId,
      receivedAt: event.receivedAt,
    });

    // Get student address from card ID
    const studentAddress = await getStudentByCardId(
      event.orgObjectId,
      event.cardId
    );

    if (!studentAddress) {
      const error = `Student not found for card ID: ${event.cardId}. Please ensure this student is registered in the organisation.`;
      log.error(`${error}`);
      event.error = error;
      throw new Error(error);
    }

    log.info(`Found student: ${studentAddress}`);

    // Check subscription status
    const isActive = await checkSubscriptionActive(event.orgObjectId);
    if (!isActive) {
      const error = "Subscription expired or inactive. Please renew subscription before recording attendance.";
      log.error(`${error}`);
      event.error = error;
      throw new Error(error);
    }

    // Record attendance on blockchain
    try {
      log.info(`Recording attendance on blockchain...`);
      const txDigest = await recordAttendance(event.orgObjectId, studentAddress);
      event.blockchainTxDigest = txDigest;
      log.info(`Attendance recorded on blockchain: ${txDigest}`);
    } catch (error: any) {
      const errorMsg = String(error?.message || error);
      log.error("Failed to record attendance:", errorMsg);
      event.error = `Blockchain error: ${errorMsg}`;
      throw error;
    }

    log.info(`Event processing complete for cardId: ${event.cardId}`);
  } catch (error: any) {
    log.error("Error processing attendance event:", error.message);
    event.error = error.message;
    throw error;
  }
}

/**
 * Clear student cache
 */
export function clearStudentCache(): void {
  studentCache.clear();
  log.info("Student cache cleared");
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    studentCacheSize: studentCache.size,
    cachedCardIds: Array.from(studentCache.keys()),
  };
}

