import { Transaction } from "@mysten/sui/transactions";
import { suiService } from "./suiClient";
import { config } from "../config/env";
import { log } from "../utils/logger";
import { getOrgByDeviceId } from "./deviceService";

/**
 * Process device heartbeat update
 */
export async function processDeviceHeartbeat(
  deviceId: string,
  timestamp?: number
): Promise<string> {
  try {
    log.info(`Processing heartbeat for device: ${deviceId}`);

    // Get organisation from device ID
    const orgObjectId = await getOrgByDeviceId(deviceId);
    
    if (!orgObjectId) {
      const error = `Device ${deviceId} is not registered to any organisation. Please register the device first.`;
      log.error(`${error}`);
      throw new Error(error);
    }

    // Use provided timestamp or current time
    const heartbeatTimestamp = timestamp || Date.now();

    log.info(`Updating heartbeat for device: ${deviceId} in org: ${orgObjectId}`);

    const tx = new Transaction();

    // Call update_device_heartbeat function
    tx.moveCall({
      target: `${config.packageId}::attendance_system::update_device_heartbeat`,
      arguments: [
        tx.object(config.systemObjectId), // AttendanceSystem shared object
        tx.object(orgObjectId), // AttendanceOrganisation shared object
        tx.pure.string(deviceId),
        tx.pure.u64(heartbeatTimestamp),
      ],
    });

    // Set gas budget
    tx.setGasBudget(100_000_000);

    try {
      log.info(`Sending heartbeat transaction to Sui network...`);
      log.info(`Target: ${config.packageId}::attendance_system::update_device_heartbeat`);
      log.info(`Network: ${config.network}`);
      log.info(`Signer: ${suiService.address}`);

      const result = await suiService.executeTransaction(tx);
      const digest = result.digest;
      
      log.info(`Heartbeat updated successfully!`);
      log.info(`Transaction digest: ${digest}`);
      
      return digest;
    } catch (error: any) {
      log.error("Failed to update heartbeat - DETAILED ERROR:");
      log.error("Error type:", error?.constructor?.name || typeof error);
      log.error("Error message:", error?.message || String(error));
      throw error;
    }
  } catch (error: any) {
    log.error("Error processing device heartbeat:", error.message);
    throw error;
  }
}

