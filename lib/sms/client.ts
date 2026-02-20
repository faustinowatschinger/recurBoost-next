/**
 * SMS client placeholder.
 * Ready for Twilio or similar integration.
 * Currently logs to console only.
 */

export interface SmsPayload {
  to: string;
  body: string;
}

export interface SmsProvider {
  send(payload: SmsPayload): Promise<void>;
}

/**
 * Send a recovery SMS (placeholder — logs to console).
 * Only sends if the user has SMS enabled and the amount exceeds their threshold.
 */
export async function sendRecoverySms(
  phoneNumber: string,
  message: string,
): Promise<void> {
  // TODO: Implement with Twilio or similar provider
  console.log(`[SMS PLACEHOLDER] To: ${phoneNumber} | Message: ${message}`);
}
