import { Router, Request, Response } from "express";
import { processDeviceHeartbeat } from "../services/heartbeatService";
import { getOrgByDeviceId } from "../services/deviceService";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { log } from "../utils/logger";

const router = Router();

/**
 * POST /api/devices/:deviceId/heartbeat
 * Receive device heartbeat from ESP32
 */
router.post(
  "/:deviceId/heartbeat",
  asyncHandler(async (req: Request, res: Response) => {
    const { deviceId } = req.params;
    const body = req.body;
    
    // Validation
    if (!deviceId || typeof deviceId !== "string") {
      throw new AppError("deviceId is required and must be a string", 400);
    }

    // Optional timestamp in request body (defaults to current time)
    const timestamp = body.timestamp ? Number(body.timestamp) : undefined;
    
    if (timestamp !== undefined && (isNaN(timestamp) || timestamp < 0)) {
      throw new AppError("timestamp must be a valid positive number if provided", 400);
    }

    log.info(`Heartbeat received for device: ${deviceId}`);

    // Process heartbeat (updates on blockchain)
    try {
      const txDigest = await processDeviceHeartbeat(deviceId, timestamp);
      
      res.json({
        ok: true,
        message: "Heartbeat updated successfully",
        deviceId,
        timestamp: timestamp || Date.now(),
        transactionDigest: txDigest,
      });
    } catch (error: any) {
      log.error(`Failed to process heartbeat for device ${deviceId}:`, error);
      throw new AppError(
        `Failed to update heartbeat: ${error.message}`,
        500
      );
    }
  })
);

/**
 * GET /api/devices/:deviceId/organisation
 * Get organisation for a device
 */
router.get(
  "/:deviceId/organisation",
  asyncHandler(async (req: Request, res: Response) => {
    const { deviceId } = req.params;

    if (!deviceId || typeof deviceId !== "string") {
      throw new AppError("deviceId is required and must be a string", 400);
    }

    log.info(`Looking up organisation for device: ${deviceId}`);

    try {
      const orgObjectId = await getOrgByDeviceId(deviceId);
      
      if (!orgObjectId) {
        throw new AppError(
          `Device ${deviceId} is not registered to any organisation`,
          404
        );
      }

      res.json({
        ok: true,
        deviceId,
        orgObjectId,
      });
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      log.error(`Error looking up organisation for device ${deviceId}:`, error);
      throw new AppError(
        `Failed to lookup organisation: ${error.message}`,
        500
      );
    }
  })
);

export default router;


