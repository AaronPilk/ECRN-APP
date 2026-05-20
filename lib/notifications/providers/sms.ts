import { logToConsole } from "./console";

/**
 * SMS provider abstraction.
 *
 * V1: logs to console. Batch 7: detects TWILIO_* env and dispatches via
 * the Twilio SDK.
 */

interface SendSmsInput {
  to: string;
  body: string;
  from?: string;
}

export async function sendSms(input: SendSmsInput): Promise<string | null> {
  // TODO (Batch 7): if (process.env.TWILIO_ACCOUNT_SID) { ...Twilio... }
  return logToConsole({ provider: "sms", ...input });
}
