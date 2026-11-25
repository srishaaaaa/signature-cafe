import type { Metadata } from "next";
import Landing, { FALLBACK_INFO } from "@/landing/components/Landing";
import { shopInfo } from "@/lib/ops";
import "@/landing/landing.css";

/* The Signature Café welcome page — a separate address from "/", which stays the ordering menu.
   Its name, address, phone, email and Instagram come from Admin → Settings. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The Signature Café | Valasaravakkam, Chennai",
  description: "Coffee, tea, pastries and more at The Signature Café, Radha Avenue Main Road, Valasaravakkam, Chennai.",
};

export default async function Welcome() {
  const info = await shopInfo().catch(() => FALLBACK_INFO);
  return <Landing info={info} />;
}
