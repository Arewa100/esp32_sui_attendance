export interface AttendanceEvent {
  cardId: string; // RFID card ID from ESP32
  orgObjectId: string; // Organisation object ID
  deviceId?: string; // Optional: ESP32 device identifier
  receivedAt: string; // ISO timestamp when server received the event
  blockchainTxDigest?: string; // Transaction digest after recording on-chain
  error?: string; // Error message if processing failed
}

export interface AttendanceEventInput {
  cardId: string;
  orgObjectId: string;
  deviceId?: string;
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
    orgObjectId: input.orgObjectId,
    deviceId: input.deviceId,
    receivedAt: new Date().toISOString(),
  };
}

