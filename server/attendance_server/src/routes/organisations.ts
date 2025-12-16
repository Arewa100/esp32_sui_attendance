import { Router, Request, Response } from "express";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { suiService } from "../services/suiClient";
import { config } from "../config/env";
import { log } from "../utils/logger";
import { getSubscriptionStatus, checkSubscriptionActive } from "../services/attendanceService";

const router = Router();

/**
 * GET /api/organisations/:orgObjectId/subscription
 * Get subscription status for an organization
 */
router.get(
  "/:orgObjectId/subscription",
  asyncHandler(async (req: Request, res: Response) => {
    const { orgObjectId } = req.params;

    try {
      const status = await getSubscriptionStatus(orgObjectId);
      
      res.json({
        ok: true,
        orgObjectId,
        subscription: status,
      });
    } catch (error: any) {
      throw new AppError(
        `Failed to get subscription status: ${error.message}`,
        500
      );
    }
  })
);

/**
 * GET /api/organisations/:orgObjectId
 * Get organization details
 */
router.get(
  "/:orgObjectId",
  asyncHandler(async (req: Request, res: Response) => {
    const { orgObjectId } = req.params;

    try {
      const org = await suiService.getObject(orgObjectId);
      
      if (!org?.content) {
        throw new AppError(`Organisation not found: ${orgObjectId}`, 404);
      }

      const fields = (org.content as any)?.fields;
      const subscription = await getSubscriptionStatus(orgObjectId);

      res.json({
        ok: true,
        orgObjectId,
        organisation: {
          name: fields?.name || "Unknown",
          owner: fields?.owner || "Unknown",
          subscription,
        },
      });
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        `Failed to get organisation: ${error.message}`,
        500
      );
    }
  })
);

/**
 * GET /api/organisations/:orgObjectId/students/:cardId
 * Get student information by card ID
 */
router.get(
  "/:orgObjectId/students/:cardId",
  asyncHandler(async (req: Request, res: Response) => {
    const { orgObjectId, cardId } = req.params;

    try {
      // Query events to find student
      const events = await suiService.queryEvents({
        MoveEventType: `${config.packageId}::events::StudentRegisteredEvent`,
      }, 100);

      // Find student with matching card_id and organisation
      for (const event of events.data) {
        if (event.parsedJson && typeof event.parsedJson === "object") {
          const eventData = event.parsedJson as any;
          
          if (
            eventData.card_id === cardId &&
            eventData.organisation === orgObjectId
          ) {
            return res.json({
              ok: true,
              student: {
                address: eventData.student,
                name: eventData.name,
                department: eventData.department,
                cardId: eventData.card_id,
                orgObjectId: eventData.organisation,
              },
            });
          }
        }
      }

      throw new AppError(
        `Student not found for cardId: ${cardId} in organisation: ${orgObjectId}`,
        404
      );
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        `Failed to get student: ${error.message}`,
        500
      );
    }
  })
);

export default router;

