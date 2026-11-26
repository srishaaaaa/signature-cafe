import { redirect } from "next/navigation";

/* There is no guest site: the home address goes straight to the admin panel. */
export default function Home() {
  redirect("/admin");
}
