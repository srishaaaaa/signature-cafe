import { redirect } from "next/navigation";

/* The KOT / open-tabs panel has been removed: /admin goes straight to Billing. */
export default function Page() {
  redirect("/admin/billing");
}
