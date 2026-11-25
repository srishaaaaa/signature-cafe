import type { Metadata } from "next";
import { Courier_Prime, Lexend } from "next/font/google";
import "./admin.css";

const lexend = Lexend({ subsets: ["latin"], variable: "--font-adm-num" });
/* the typewriter face of the printed thermal receipt (the logo is an image and is not affected) */
const courier = Courier_Prime({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-rcpt" });

export const metadata: Metadata = {
  title: { default: "Admin · The Signature Café", template: "%s · Admin · The Signature Café" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <div className={`adm ${lexend.variable} ${courier.variable}`}>{children}</div>;
}
