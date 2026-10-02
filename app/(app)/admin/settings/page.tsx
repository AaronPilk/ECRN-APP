import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getCurrentProfile } from "@/lib/auth/session";
import { listAdminAllowlist } from "@/lib/data/repository";
import { isBullhornConfigured } from "@/lib/integrations/bullhorn";
import { SUPABASE_URL } from "@/lib/supabase/env";
import { CheckCircle2, XCircle } from "lucide-react";

export default async function AdminSettingsPage() {
  const profile = (await getCurrentProfile())!;
  if (profile.role !== "admin") redirect("/dashboard");

  const adminEmails = await listAdminAllowlist();
  const supabase = Boolean(SUPABASE_URL);
  const bullhorn = isBullhornConfigured();
  const sendgrid = Boolean(process.env.SENDGRID_API_KEY);
  const resend = Boolean(process.env.RESEND_API_KEY);
  const twilio = Boolean(process.env.TWILIO_ACCOUNT_SID);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ecrn-ink">
          Settings & integrations
        </h1>
        <p className="mt-1 text-slate-500">
          Everything that lives behind environment variables. Set these in{" "}
          <code className="text-xs px-1.5 py-0.5 bg-slate-100 rounded">.env.local</code>{" "}
          (locally) or in your hosting provider&apos;s env panel (production).
        </p>
      </div>

      {/* Admin allowlist */}
      <Card>
        <CardContent className="py-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
            Admin allowlist
          </h2>
          <p className="text-sm text-slate-600 mb-3 leading-relaxed">
            These emails become <code>admin</code> automatically when they sign up. Stored in the{" "}
            <code className="text-xs px-1.5 py-0.5 bg-slate-100 rounded">admin_allowlist</code> table
            in Supabase — add a row there to make someone an admin.
          </p>
          <div className="space-y-1.5">
            {adminEmails.map((email) => (
              <div
                key={email}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/60"
              >
                <CheckCircle2 className="w-4 h-4 text-ecrn-green" />
                <span className="text-sm font-mono text-ecrn-ink">{email}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Database */}
      <Card>
        <CardContent className="py-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
            Database
          </h2>
          <IntegrationRow
            name="Supabase"
            active={supabase}
            description="Postgres + Auth + Row Level Security. Schema lives in supabase/migrations/."
          />
          {!supabase && (
            <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200/60 rounded-xl px-3 py-2 leading-relaxed">
              Supabase isn't configured. Set NEXT_PUBLIC_SUPABASE_URL and
              NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardContent className="py-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
            Notifications
          </h2>
          <div className="space-y-2">
            <IntegrationRow
              name="SendGrid"
              active={sendgrid}
              description="Transactional email. Set SENDGRID_API_KEY to enable."
            />
            <IntegrationRow
              name="Resend"
              active={resend}
              description="Alternative transactional email provider. Set RESEND_API_KEY to enable."
            />
            <IntegrationRow
              name="Twilio SMS"
              active={twilio}
              description="SMS / text notifications. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER."
            />
          </div>
          <p className="mt-3 text-xs text-slate-500 leading-relaxed">
            Until any of these are connected, ECRN logs every notification to the console (you can
            see them in the terminal where{" "}
            <code className="text-[11px] px-1 bg-slate-100 rounded">npm run dev</code> is running).
          </p>
        </CardContent>
      </Card>

      {/* CRM */}
      <Card>
        <CardContent className="py-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
            CRM sync
          </h2>
          <IntegrationRow
            name="Bullhorn"
            active={bullhorn}
            description="Push candidates and pull job orders from Bullhorn. Set BULLHORN_CLIENT_ID, BULLHORN_CLIENT_SECRET, BULLHORN_REFRESH_TOKEN."
          />
          <p className="mt-3 text-xs text-slate-500 leading-relaxed">
            The schema reserves <code>external_crm_id</code> fields on candidates, jobs, and
            profiles for Bullhorn IDs. Integration logic stub lives in{" "}
            <code className="text-[11px] px-1 bg-slate-100 rounded">
              lib/integrations/bullhorn.ts
            </code>
            .
          </p>
        </CardContent>
      </Card>

      <p className="text-xs text-slate-500 text-center">
        Changes to env variables require restarting the dev server.
      </p>
    </div>
  );
}

function IntegrationRow({
  name,
  active,
  description,
}: {
  name: string;
  active: boolean;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
      <div className="shrink-0 mt-0.5">
        {active ? (
          <CheckCircle2 className="w-5 h-5 text-ecrn-green" />
        ) : (
          <XCircle className="w-5 h-5 text-slate-400" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-ecrn-ink">{name}</span>
          {active ? (
            <Badge variant="green">Active</Badge>
          ) : (
            <Badge variant="neutral">Not connected</Badge>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
