import type {
  NotificationChannel,
  NotificationEvent,
  Profile,
} from "@/types";
import { db, generateId, nowIso } from "@/lib/data/mock-store";
import { sendEmail } from "./providers/email";
import { sendSms } from "./providers/sms";
import { logToConsole } from "./providers/console";

/**
 * Notification dispatcher.
 *
 * Page/action code does NOT call providers directly. It calls
 * `dispatchNotification(...)`, which:
 *   1. Writes a row to `notification_events` (audit trail).
 *   2. Picks the right provider for the channel.
 *   3. Records the result back on the event row.
 *
 * This means we can swap email providers (SendGrid → Resend → HubSpot)
 * by editing one file, and we get a full delivery log for free.
 *
 * V1 default: the console provider logs everything to stdout. Plug in
 * real providers in Batch 7 by setting SENDGRID_API_KEY / TWILIO_*.
 */

export interface NotificationInput {
  recipient: Profile | { id?: string; email?: string; phone?: string };
  eventType: string;
  channel: NotificationChannel;
  subject?: string;
  body: string;
  payload?: Record<string, unknown>;
}

export async function dispatchNotification(
  input: NotificationInput
): Promise<NotificationEvent> {
  const event: NotificationEvent = {
    id: generateId("ne"),
    userId: "id" in input.recipient && input.recipient.id ? input.recipient.id : null,
    eventType: input.eventType,
    channel: input.channel,
    status: "queued",
    payload: {
      subject: input.subject,
      body: input.body,
      ...(input.payload ?? {}),
    },
    providerId: null,
    error: null,
    createdAt: nowIso(),
  };
  db.notificationEvents.push(event);

  try {
    let providerId: string | null = null;
    switch (input.channel) {
      case "email":
        providerId = await sendEmail({
          to: "email" in input.recipient ? input.recipient.email ?? "" : "",
          subject: input.subject ?? "",
          body: input.body,
        });
        break;
      case "sms":
        providerId = await sendSms({
          to: "phone" in input.recipient ? input.recipient.phone ?? "" : "",
          body: input.body,
        });
        break;
      case "push":
      case "inapp":
        providerId = await logToConsole({
          channel: input.channel,
          eventType: input.eventType,
          subject: input.subject,
          body: input.body,
          payload: input.payload,
        });
        break;
    }
    event.status = "sent";
    event.providerId = providerId;
  } catch (err) {
    event.status = "failed";
    event.error = err instanceof Error ? err.message : String(err);
  }

  return event;
}
