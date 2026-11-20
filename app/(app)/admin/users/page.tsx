import { redirect } from "next/navigation";

/** The old Users screen. Members replaced it. */
export default function AdminUsersRedirect() {
  redirect("/admin/members");
}
