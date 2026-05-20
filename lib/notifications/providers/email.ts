import { logToConsole } from "./console";

/**
 * Email provider abstraction.
 *
 * V1: logs to console. Batch 7: detects SENDGRID_API_KEY or RESEND_API_KEY
 * and dispatches via the right SDK.
 */

interface SendEmailInput {
  to: string;
  subject: string;
  body: string;
  from?: string;
  replyTo?: string;
}

export async function sendEmail(input: SendEmailInput): Promise<string | null> {
  // TODO (Batch 7): if (process.env.SENDGRID_API_KEY) { ...SendGrid... }
  // TODO (Batch 7): if (process.env.RESEND_API_KEY)   { ...Resend... }
  return logToConsole({ provider: "email", ...input });
}
