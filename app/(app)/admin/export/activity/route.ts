import type { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { actionLabel, describeActivity, entityLabel } from "@/lib/admin/activity-labels";
import { activityPage, fetchAllRows, parseActivityFilters, staffLookups, toActivityRow } from "@/lib/admin/members";
import { csvDownload, denyUnlessAdmin, exportFailed } from "../_shared";

const COLUMNS = [
  "id",
  "created_at",
  "actor_id",
  "actor_name",
  "actor_email",
  "actor_is_admin",
  "action",
  "action_label",
  "entity_type",
  "entity_label",
  "entity_id",
  "summary",
  "metadata",
];

/** Most rows one download will hold. Narrow the date range to export older history in pieces. */
const MAX_ROWS = 100000;

/**
 * The audit trail, newest first. Takes the same query string as
 * /admin/activity (action, entity_type, from, to, actor).
 */
export async function GET(request: NextRequest): Promise<Response> {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;

  try {
    const sb = await createSupabaseServerClient();
    const filters = parseActivityFilters(request.nextUrl.searchParams);
    const [raw, lookups] = await Promise.all([
      fetchAllRows((from, to) => activityPage(sb, filters, from, to), { max: MAX_ROWS }),
      staffLookups(),
    ]);

    const rows = raw.map((r) => {
      const log = toActivityRow(r);
      return {
        id: log.id,
        created_at: log.createdAt,
        actor_id: log.actorUserId,
        actor_name: log.actor?.name ?? (log.actorUserId ? null : "System"),
        actor_email: log.actor?.email ?? null,
        actor_is_admin: log.actor ? log.actor.isAdmin : null,
        action: log.action,
        action_label: actionLabel(log.action),
        entity_type: log.entityType,
        entity_label: entityLabel(log.entityType),
        entity_id: log.entityId,
        summary: describeActivity(log, lookups),
        metadata: log.metadata,
      };
    });

    if (raw.length >= MAX_ROWS) {
      // Say so in the file itself rather than hand over a silently cut-off export.
      rows.push({
        id: "",
        created_at: "",
        actor_id: null,
        actor_name: null,
        actor_email: null,
        actor_is_admin: null,
        action: "export_truncated",
        action_label: "Export stopped here",
        entity_type: "",
        entity_label: "",
        entity_id: null,
        summary: `This file stops at ${MAX_ROWS.toLocaleString("en-US")} rows. Use the date filters to export older entries.`,
        metadata: {},
      });
    }

    return csvDownload("activity", COLUMNS, rows);
  } catch (e) {
    return exportFailed("activity", e);
  }
}
