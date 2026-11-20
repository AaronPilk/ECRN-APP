import { redirect } from "next/navigation";

/** Everyone shares one home now. */
export default function CandidateHomeRedirect() {
  redirect("/dashboard");
}
