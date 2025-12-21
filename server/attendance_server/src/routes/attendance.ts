import { Router, Request, Response } from "express";
import { createAttendanceEvent, AttendanceEvent } from "../models/attendanceEvent";
import { processAttendanceEvent } from "../services/attendanceService";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { log } from "../utils/logger";

const router = Router();

// In-memory storage for events (use database in production)
const MAX_EVENTS = 1000;
const events: AttendanceEvent[] = [];

/**
 * POST /api/attendance
 * Receive attendance event from ESP32
 */
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body;

    // Validation
    if (!body.cardId || typeof body.cardId !== "string") {
      throw new AppError("cardId is required and must be a string", 400);
    }

    if (!body.orgObjectId || typeof body.orgObjectId !== "string") {
      throw new AppError("orgObjectId is required and must be a string", 400);
    }

    // Create event
    const event = createAttendanceEvent({
      cardId: body.cardId,
      orgObjectId: body.orgObjectId,
      deviceId: body.deviceId,
    });

    log.info(`New attendance event received`, {
      cardId: event.cardId,
      orgObjectId: event.orgObjectId,
      deviceId: event.deviceId || "Not provided",
    });

    // Store event
    events.push(event);
    if (events.length > MAX_EVENTS) {
      events.shift(); // Remove oldest
    }

    // Process blockchain transaction asynchronously
    // Don't wait for it to complete before responding
    processAttendanceEvent(event).catch((error) => {
      log.error("Blockchain processing failed", error);
    });

    // Respond immediately
    res.json({
      ok: true,
      message: "Attendance event received and processing",
      cardId: event.cardId,
      orgObjectId: event.orgObjectId,
      receivedAt: event.receivedAt,
    });
  })
);

/**
 * GET /api/attendance
 * Get all attendance events (paginated)
 */
router.get("/", (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 100, 1000);
  const offset = Number(req.query.offset) || 0;

  const paginatedEvents = events.slice(offset, offset + limit);

  res.json({
    ok: true,
    total: events.length,
    limit,
    offset,
    events: paginatedEvents,
  });
});

/**
 * GET /api/attendance/:orgObjectId
 * Get attendance events for a specific organization
 */
router.get("/:orgObjectId", (req: Request, res: Response) => {
  const { orgObjectId } = req.params;
  const orgEvents = events.filter((e) => e.orgObjectId === orgObjectId);

  res.json({
    ok: true,
    orgObjectId,
    count: orgEvents.length,
    events: orgEvents,
  });
});

/**
 * GET /api/attendance/:orgObjectId/card/:cardId
 * Get attendance events for a specific card ID in an organization
 */
router.get("/:orgObjectId/card/:cardId", (req: Request, res: Response) => {
  const { orgObjectId, cardId } = req.params;
  const cardEvents = events.filter(
    (e) => e.orgObjectId === orgObjectId && e.cardId === cardId
  );

  res.json({
    ok: true,
    orgObjectId,
    cardId,
    count: cardEvents.length,
    events: cardEvents,
  });
});

/**
 * DELETE /api/attendance
 * Clear all events (admin only - add auth in production)
 */
router.delete("/", (_req: Request, res: Response) => {
  const count = events.length;
  events.length = 0;

  log.warn(`Cleared ${count} attendance events`);

  res.json({
    ok: true,
    message: `Cleared ${count} events`,
  });
});

export default router;












