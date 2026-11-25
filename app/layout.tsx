import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Sans, Caveat, Cinzel } from "next/font/google";
import "./globals.css";
import { shopTheme } from "@/lib/ops";
import { DEFAULT_THEME, themeCss } from "@/lib/theme";

const fraunces = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["opsz"],
});

/* The wordmark's western face — used only for the shop name beside the logo, not for the rest of the app. */
const brand = Cinzel({
  variable: "--font-brand",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const instrument = Instrument_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-hand",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Signature Café | Valasaravakkam, Chennai",
  description: "Order from your phone at The Signature Café — browse the menu, add to your tab and pay at the counter.",
  robots: { index: false, follow: false },
  // the Signature Café logo (public/icon.png)
  icons: { icon: "/icon.png", apple: "/icon.png" },
};

/* The colours picked in Admin → Settings → Theme colours repaint every page (menu, billing, admin, receipts). */
const theme = () => shopTheme().catch(() => DEFAULT_THEME);

export async function generateViewport(): Promise<Viewport> {
  return { themeColor: (await theme()).dark };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const css = themeCss(await theme());
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${instrument.variable} ${caveat.variable} ${brand.variable} antialiased`}
    >
      <body>
        <style id="shop-theme" dangerouslySetInnerHTML={{ __html: css }} />
        {children}
      </body>
    </html>
  );
}
