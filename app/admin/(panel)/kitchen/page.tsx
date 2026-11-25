import { redirect } from "next/navigation";

/* The kitchen ticket queue (KOT) has been removed: send anyone here to Billing. */
export default function Page() {
  redirect("/admin/billing");
}
