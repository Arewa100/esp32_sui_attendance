export interface AttendanceEvent {
  cardId: string; // RFID card ID from ESP32
  orgObjectId?: string; // Organisation object ID (optional, can be resolved from deviceId)
  deviceId?: string; // Optional: ESP32 device identifier (required if orgObjectId not provided)
  receivedAt: string; // ISO timestamp when server received the event
  blockchainTxDigest?: string; // Transaction digest after recording on-chain
  error?: string; // Error message if processing failed
}

export interface AttendanceEventInput {
  cardId: string;
  orgObjectId?: string; // Optional: can be resolved from deviceId
  deviceId?: string; // Required if orgObjectId is not provided
}

export interface StudentInfo {
  address: string;
  name: string;
  department: string;
  cardId: string;
  orgObjectId: string;
}

export interface SubscriptionStatus {
  isActive: boolean;
  expiryTimestamp: number;
  paymentAmount: number;
}

export interface PaginationParams {
  limit: number;
  offset: number;
}

export function createAttendanceEvent(input: AttendanceEventInput): AttendanceEvent {
  return {
    cardId: input.cardId,
    orgObjectId: input.orgObjectId || undefined,
    deviceId: input.deviceId,
    receivedAt: new Date().toISOString(),
  };
}












