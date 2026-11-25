"use client";

import ApprovalPopup from "./ApprovalPopup";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAdmin } from "./Store";
import { PRINT_FORMAT_OPTIONS } from "./receipt";
import { Btn, Field, Icon, Modal, Switch, cx, inputCls, type IconName } from "./kit";
import { DEFAULT_THEME, THEME_PRESETS, THEME_SWATCHES, sameTheme, themeCss, type Theme } from "@/lib/theme";

type Nav = { href: string; label: string; icon: IconName; roles: ("admin" | "staff")[]; requiresKot?: boolean; hideWhen?: (s: { walkInsOnly: boolean; kotEnabled: boolean; orderingEnabled: boolean }) => boolean };

/* Pages the sidebar may show. Staff sees only the four the client agreed on
   (billing, orders, open tabs, inventory) plus the kitchen queue when it's on. */
const NAV: Nav[] = [
  { href: "/admin/billing", label: "Billing", icon: "billing", roles: ["admin", "staff"] },
  { href: "/admin/orders", label: "Orders", icon: "orders", roles: ["admin", "staff"] },
  { href: "/admin/analytics", label: "Analytics", icon: "chart", roles: ["admin"] },
  { href: "/admin/inventory", label: "Inventory", icon: "box", roles: ["admin", "staff"] },
  { href: "/admin/inventory/ingredients", label: "Ingredients & waste", icon: "orders", roles: ["admin", "staff"] },
  { href: "/admin/inventory/movements", label: "Stock movement", icon: "list", roles: ["admin"] },
  { href: "/admin/expenses", label: "Expenses", icon: "bag", roles: ["admin"] },
  { href: "/admin/coupons", label: "Coupons", icon: "coupon", roles: ["admin"] },
  { href: "/admin/loyalty", label: "Loyalty", icon: "star", roles: ["admin", "staff"] },
  { href: "/admin/birthdays", label: "Birthdays", icon: "cake", roles: ["admin", "staff"] },
];

/* The shop logo. The built-in Signature Café mark is shown in gold straight on the dark sidebar; a logo uploaded in Settings
   keeps a light tile behind it so it can be seen. */
const Cherry = ({ logo }: { logo?: string }) =>
  !logo || logo === "/logo.png" ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/logo.png" alt="" className="adm-logo-plain" />
  ) : (
    <span className="adm-logo">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logo} alt="" />
    </span>
  );

const Sec = ({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) => (
  <section className="rounded-2xl border border-slate-100 bg-white p-4">
    <b className="block text-[13.5px] text-slate-900">{title}</b>
    {desc && <p className="mt-0.5 text-[12px] leading-snug text-slate-500">{desc}</p>}
    <div className="mt-3 space-y-3">{children}</div>
  </section>
);
const Toggle = ({ title, desc, on, onChange }: { title: string; desc: string; on: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
    <div className="min-w-0">
      <b className="block text-[13px] text-slate-900">{title}</b>
      <p className="mt-0.5 text-[12px] leading-snug text-slate-500">{desc}</p>
    </div>
    <Switch on={on} onChange={onChange} label={title} />
  </div>
);

function Settings({ onClose }: { onClose: () => void }) {
  const { s, act, toast } = useAdmin();
  const [walkInsOnly, setWalkInsOnly] = useState(s.settings.walkInsOnly);
  const [orderingEnabled, setOrderingEnabled] = useState(s.settings.orderingEnabled);

  const toggleOrdering = async (v: boolean) => {
    setOrderingEnabled(v);
    const r = await act("settings.update", { orderingEnabled: v });
    if (!r.ok) setOrderingEnabled(!v);
    else toast({ kind: "ok", title: v ? "Customer ordering is on — guests can order from their phone." : "Customer site is now menu-only." });
  };

  const toggleWalkIns = async (v: boolean) => {
    setWalkInsOnly(v);
    const r = await act("settings.update", { walkInsOnly: v });
    if (!r.ok) setWalkInsOnly(!v);
    else toast({ kind: "ok", title: v ? "Customer tab is hidden in Billing." : "Customer tab is showing in Billing." });
  };

  const d = s.settings;
  const [form, setForm] = useState({
    shopName: d.shopName, ownerName: d.ownerName, location: d.location, address: d.address, address2: "",
    whatsapp1: d.whatsapp1, whatsapp2: "", customerCare: d.customerCare, email: d.email, instagram: d.instagram, mapsUrl: d.mapsUrl, logoUrl: d.logoUrl, publicUrl: d.publicUrl,
    upiId: d.upiId, upiName: d.upiName, upiPhone: d.upiPhone, upiQrMinutes: String(d.upiQrMinutes), tableCount: String(d.tableCount), printFormat: d.printFormat,
  });
  const [saving, setSaving] = useState(false);

  /* Theme colours preview live: the page's theme stylesheet is rewritten as they change.
     Closing without saving puts the saved colours back. */
  const [theme, setTheme] = useState<Theme>(d.theme);
  const savedTheme = useRef<Theme>(d.theme);
  useEffect(() => {
    const el = document.getElementById("shop-theme");
    if (el) el.textContent = themeCss(theme);
  }, [theme]);
  useEffect(
    () => () => {
      const el = document.getElementById("shop-theme");
      if (el) el.textContent = themeCss(savedTheme.current);
    },
    [],
  );

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });
  /* Shrink a picked PNG/JPG to at most 160px in the browser and keep it as a small
     data URL, so the logo needs no file storage and stays well under the size limit. */
  const pickLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!/^image\/(png|jpeg)$/.test(f.type)) return toast({ kind: "err", title: "Choose a PNG or JPG image." });
    const img = new Image();
    const url = URL.createObjectURL(f);
    img.onload = () => {
      const k = Math.min(1, 160 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(img.width * k));
      c.height = Math.max(1, Math.round(img.height * k));
      c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      setForm((cur) => ({ ...cur, logoUrl: c.toDataURL(f.type === "image/png" ? "image/png" : "image/jpeg", 0.85) }));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      toast({ kind: "err", title: "Couldn't read that image." });
    };
    img.src = url;
  };
  const saveDetails = async () => {
    setSaving(true);
    const r = await act("settings.update", { ...form, theme });
    setSaving(false);
    if (r.ok) {
      savedTheme.current = theme;
      toast({ kind: "ok", title: "Settings saved." });
    }
  };

  const two = "grid gap-3 sm:grid-cols-2";

  return (
    <Modal
      open
      onClose={onClose}
      wide
      title="Settings"
      footer={
        <>
          <Btn kind="plain" onClick={onClose}>Close</Btn>
          <Btn kind="red" onClick={saveDetails} disabled={saving}>{saving ? "Saving…" : "Save settings"}</Btn>
        </>
      }
    >
      <div className="space-y-4">
        <Sec title="Shop details" desc="Shown on the menu page, receipts and invoices.">
          <div className={two}>
            <Field label="Shop name"><input className={inputCls} value={form.shopName} maxLength={60} onChange={set("shopName")} /></Field>
            <Field label="Owner's name"><input className={inputCls} value={form.ownerName} maxLength={80} onChange={set("ownerName")} /></Field>
            <Field label="Location"><input className={inputCls} value={form.location} maxLength={120} onChange={set("location")} /></Field>
            <Field label="Email"><input className={inputCls} type="email" value={form.email} maxLength={120} onChange={set("email")} /></Field>
            <Field label="WhatsApp number"><input className={inputCls} inputMode="tel" value={form.whatsapp1} maxLength={30} onChange={set("whatsapp1")} placeholder="10-digit number" /></Field>
            <Field label="Customer service number"><input className={inputCls} inputMode="tel" value={form.customerCare} maxLength={30} onChange={set("customerCare")} /></Field>
            <Field label="Instagram ID" hint="Shown on the menu page. Blank hides it."><input className={inputCls} value={form.instagram} maxLength={200} onChange={set("instagram")} placeholder="@yourcafe" autoCapitalize="none" /></Field>
          </div>
          <Field label="Address" hint="One line per row"><textarea className={cx(inputCls, "h-20 resize-none py-2 leading-snug")} value={form.address} onChange={set("address")} /></Field>
          <Field label="Google Maps link"><input className={inputCls} value={form.mapsUrl} maxLength={500} onChange={set("mapsUrl")} placeholder="https://maps.app.goo.gl/…" /></Field>
          <Field label="Website address" hint="The address customers open. QR codes and WhatsApp payment links use it, so it must be your live website."><input className={inputCls} inputMode="url" autoCapitalize="none" value={form.publicUrl} maxLength={200} onChange={set("publicUrl")} placeholder="https://signaturecafe.vercel.app" /></Field>
        </Sec>

        <Sec title="Logo" desc="Upload a PNG or JPG, or paste an image link. Blank uses the built-in icon.">
          <div className="flex flex-wrap items-center gap-3">
            <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-950">
              {form.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.logoUrl} alt="Logo preview" className="h-full w-full object-contain p-1" />
              ) : (
                <span className="text-[10px] text-slate-400">none</span>
              )}
            </span>
            <label className="inline-flex h-10 cursor-pointer items-center rounded-xl border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50">
              Upload PNG / JPG
              <input type="file" accept="image/png,image/jpeg" className="sr-only" onChange={pickLogo} />
            </label>
            {form.logoUrl && <Btn kind="plain" onClick={() => setForm({ ...form, logoUrl: "" })}>Remove</Btn>}
          </div>
          <input className={inputCls} value={form.logoUrl.startsWith("data:") ? "" : form.logoUrl} maxLength={500} onChange={set("logoUrl")} placeholder={form.logoUrl.startsWith("data:") ? "Uploaded image in use" : "…or paste a link: https://…"} />
        </Sec>

        <Sec title="Theme colours" desc="Colours chosen to sit with the gold logo. Pick a ready-made pairing or mix your own. They repaint the guest menu, billing, the admin panel and receipts — press Save settings to keep them.">
          <div className="flex flex-wrap gap-2">
            {THEME_PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => setTheme({ accent: p.accent, dark: p.dark, light: p.light })}
                className={cx("flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-[12px] font-semibold text-slate-700", sameTheme(theme, p) ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white hover:bg-slate-50")}
              >
                <span className="flex overflow-hidden rounded-md border border-slate-200" aria-hidden="true">
                  {[p.dark, p.accent, p.light].map((c) => <span key={c} className="h-5 w-3.5" style={{ background: c }} />)}
                </span>
                {p.name}
              </button>
            ))}
          </div>
          {([["accent", "Gold tone", "Buttons, prices, highlights"], ["dark", "Dark colour", "Headers, dark bands, text"], ["light", "Light colour", "Page background, cards"]] as const).map(([k, label, hint]) => (
            <div key={k}>
              <div className="flex items-baseline gap-2">
                <b className="text-[12px] text-slate-800">{label}</b>
                <span className="text-[11px] text-slate-500">{hint}</span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
                {THEME_SWATCHES[k].map((c) => {
                  const on = theme[k] === c.hex;
                  return (
                    <button
                      key={c.hex}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setTheme({ ...theme, [k]: c.hex })}
                      className={cx("flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-2.5 text-[11.5px] font-semibold text-slate-700", on ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white hover:bg-slate-50")}
                    >
                      <span className="h-5 w-5 rounded-full border border-black/10" style={{ background: c.hex }} aria-hidden="true" />
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {!sameTheme(theme, DEFAULT_THEME) && <Btn kind="plain" onClick={() => setTheme(DEFAULT_THEME)}>Reset to Onyx &amp; gold</Btn>}
        </Sec>

        <Sec title="Guests paying by UPI" desc="Guests see a UPI QR with their exact amount on their phone tab. It's your own UPI ID, so there are no fees — but staff confirm the payment in their UPI app. Leave the UPI ID blank to switch it off.">
          <div className={two}>
            <Field label="Shop UPI ID" hint="Where the money goes. UPI links need an ID, not a bare number — see it in GPay or PhonePe under your profile → UPI IDs (often like 9884217588@ybl)."><input className={inputCls} value={form.upiId} maxLength={80} onChange={set("upiId")} placeholder="yourshop@okicici" autoCapitalize="none" /></Field>
            <Field label="Name shown in the UPI app" hint="Blank uses the shop name"><input className={inputCls} value={form.upiName} maxLength={60} onChange={set("upiName")} /></Field>
            <Field label="GPay / PhonePe number (optional)" hint="10 digits, shown beside the UPI ID"><input className={inputCls} inputMode="numeric" value={form.upiPhone} maxLength={14} onChange={set("upiPhone")} placeholder="98765 43210" /></Field>
            <Field label="Change the QR every (minutes)" hint="A fresh QR replaces the old one"><input className={inputCls} type="number" min={1} max={30} inputMode="numeric" value={form.upiQrMinutes} onChange={set("upiQrMinutes")} /></Field>
          </div>
        </Sec>

        <Sec title="Printing" desc="The paper the Print button uses straight away, without asking each time.">
          <Field label="Default paper" hint="Thermal bill printers: pick the roll width. Sheet printers: pick the paper size."><select className={inputCls} value={form.printFormat} onChange={(e) => setForm({ ...form, printFormat: e.target.value })}>{PRINT_FORMAT_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}</select></Field>
        </Sec>

        <Sec title="Tables" desc="Each table gets its own QR code, so every order shows which table it came from. The table QR codes are made from these numbers.">
          <Field label="Number of tables" hint="Tables are numbered 1 to this number. 0 = no tables (one shop QR only)."><input className={inputCls} type="number" min={0} max={200} inputMode="numeric" value={form.tableCount} onChange={set("tableCount")} /></Field>
        </Sec>

        <section className="divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-white p-4">
          <Toggle title="Customer ordering" desc="On: guests can scan, order and open a tab from their phone. Off: the site shows the menu card only." on={orderingEnabled} onChange={toggleOrdering} />
          <Toggle title="Customer tab in Billing" desc="Show the Customer tab option in POS Billing, for billing guests who ordered from their phone. Off: every bill is a counter sale." on={!walkInsOnly} onChange={(v) => toggleWalkIns(!v)} />
        </section>
      </div>
    </Modal>
  );
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { s, role, floor, toasts, dismiss, pending, answer, printNode, sound, setSound } = useAdmin();
  const [menu, setMenu] = useState(false);
  const [settings, setSettings] = useState(false);
  const [rail, setRail] = useState(false); // desktop sidebar collapsed to icons
  useEffect(() => {
    try {
      // read after load so the server and browser render the same HTML
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRail(localStorage.getItem("adm-rail") === "1");
    } catch {}
  }, []);
  const toggleRail = () =>
    setRail((c) => {
      const next = !c;
      try {
        localStorage.setItem("adm-rail", next ? "1" : "0");
      } catch {}
      return next;
    });
  const [lastPath, setLastPath] = useState(path);
  if (path !== lastPath) {
    setLastPath(path);
    setMenu(false);
  }

  const fresh = s.orders.filter((o) => o.source === "customer" && o.status === "new").length;
  const kitchenPending = s.settings.kotEnabled ? s.orders.filter((o) => o.status === "new" || o.status === "preparing").length : 0;
  const billReq = floor.filter((f) => f.billRequested).length;
  const low = s.products.filter((p) => p.active && p.stock !== null && p.stock <= p.lowAt).length;

  const badge: Record<string, React.ReactNode> = {
    "/admin/orders": fresh ? (
      <span className="adm-pulse grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">{fresh}</span>
    ) : null,
    "/admin/kitchen": kitchenPending ? (
      <span className="grid h-5 min-w-5 place-items-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">{kitchenPending}</span>
    ) : null,
    "/admin/billing": billReq ? <span className="grid h-5 min-w-5 place-items-center rounded-full bg-amber-400 px-1.5 text-[10px] font-bold text-amber-950">{billReq}</span> : null,
    "/admin/inventory": low ? <span className="grid h-5 min-w-5 place-items-center rounded-full bg-amber-100 px-1.5 text-[10px] font-bold text-amber-700">{low}</span> : null,
  };

  useEffect(() => {
    const base = document.title.replace(/^\(\d+\)\s*/, "");
    document.title = fresh ? `(${fresh}) ${base}` : base;
  }, [fresh, path]);

  const signOut = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.replace("/admin/login");
  };

  /* the longest matching entry wins, so /admin/inventory/movements doesn't also light up Inventory */
  const nav = NAV.filter((n) => n.roles.includes(role) && !(n.requiresKot && !s.settings.kotEnabled) && !(n.hideWhen && n.hideWhen(s.settings)));
  const active = (href: string) =>
    href === "/admin" ? path === "/admin" : path.startsWith(href) && !nav.some((n) => n.href.length > href.length && n.href.startsWith(href) && path.startsWith(n.href));

  const renderSide = (mini: boolean) => (
    <div className="flex h-full flex-col">
      <Link href="/admin/billing" title={`${s.settings.shopName} · Admin`} className={cx("adm-side__brand flex items-center gap-3 pb-6 pt-6", mini ? "justify-center px-0" : "px-5")}>
        <Cherry logo={s.settings.logoUrl} />
        {!mini && (
          <span className="leading-tight">
            <b className="adm-wordmark block text-[17px]">
              {s.settings.shopName}
            </b>
            <small className="text-[10px] font-bold uppercase tracking-[0.18em]">{role === "admin" ? "Admin console" : "Staff console"}</small>
          </span>
        )}
      </Link>
      <nav className="adm-side__scroll min-h-0 flex-1 space-y-1 overflow-y-auto px-3" aria-label="Admin">
        {nav.map((n) => {
          const on = active(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              title={mini ? n.label : undefined}
              className={cx("adm-link relative flex h-11 items-center rounded-xl text-[14px] font-semibold", on && "is-on", mini ? "justify-center px-0" : "gap-3 px-3")}
            >
              <Icon name={n.icon} size={19} />
              {!mini && <span className="flex-1">{n.label}</span>}
              {!mini && badge[n.href]}
              {mini && badge[n.href] && <span className="adm-pulse absolute right-2 top-2 h-2 w-2 rounded-full bg-red-600 text-red-600" />}
            </Link>
          );
        })}
      </nav>
      <div className="adm-side space-y-1 px-3 py-4" style={{ borderTop: "1px solid var(--line-dark)" }}>
        <button type="button" onClick={() => setSound(!sound)} title={mini ? (sound ? "Order chime on" : "Order chime off") : undefined} className={cx("adm-link flex h-10 w-full items-center rounded-xl text-[13px] font-semibold", mini ? "justify-center px-0" : "gap-3 px-3")}>
          <Icon name={sound ? "bell" : "belloff"} size={17} />
          {!mini && (sound ? "Order chime on" : "Order chime off")}
        </button>
        <a href="/" target="_blank" rel="noopener noreferrer" title={mini ? "Guest website" : undefined} className={cx("adm-link flex h-10 items-center rounded-xl text-[13px] font-semibold", mini ? "justify-center px-0" : "gap-3 px-3")}>
          <Icon name="globe" size={17} />
          {!mini && "Guest website"}
        </a>
        {role === "admin" && (
          <button type="button" onClick={() => setSettings(true)} title={mini ? "Settings" : undefined} className={cx("adm-link flex h-10 w-full items-center rounded-xl text-[13px] font-semibold", mini ? "justify-center px-0" : "gap-3 px-3")}>
            <Icon name="sliders" size={17} />
            {!mini && "Settings"}
          </button>
        )}
        <button type="button" onClick={signOut} title={mini ? "Sign out" : undefined} className={cx("adm-link flex h-10 w-full items-center rounded-xl text-[13px] font-semibold", mini ? "justify-center px-0" : "gap-3 px-3")}>
          <Icon name="logout" size={17} />
          {!mini && "Sign out"}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="adm-app">
        {/* sidebar — desktop */}
        <aside className={cx("adm-side fixed inset-y-0 left-0 z-40 hidden transition-[width] duration-200 lg:block", rail ? "w-[76px]" : "w-[248px]")}>
          {renderSide(rail)}
          <button
            type="button"
            onClick={toggleRail}
            aria-label={rail ? "Expand sidebar" : "Collapse sidebar"}
            title={rail ? "Expand sidebar" : "Collapse sidebar"}
            className="absolute -right-3 top-[72px] z-50 hidden h-7 w-7 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md transition hover:text-slate-900 lg:grid"
          >
            <Icon name="chevron" size={15} className={cx("transition-transform", rail ? "" : "rotate-180")} />
          </button>
        </aside>

        {/* top bar — mobile */}
        <header className="adm-side sticky top-0 z-40 flex h-14 items-center gap-3 px-4 lg:hidden">
          <button type="button" onClick={() => setMenu(true)} className="adm-link grid h-10 w-10 place-items-center rounded-xl" aria-label="Open menu">
            <Icon name="menu" size={20} />
          </button>
          <b className="adm-wordmark min-w-0 flex-1 truncate text-[16px]">
            {s.settings.shopName} · {role === "admin" ? "Admin" : "Staff"}
          </b>
          {fresh > 0 && (
            <Link href="/admin/orders" className="shrink-0 rounded-full bg-red-600 px-3 py-1 text-[12px] font-bold text-white">
              {fresh} new
            </Link>
          )}
        </header>
        {menu && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button type="button" className="adm-scrim absolute inset-0 bg-slate-900/40" onClick={() => setMenu(false)} aria-label="Close menu" />
            <aside className="adm-side adm-in absolute inset-y-0 left-0 w-[270px] shadow-2xl">{renderSide(false)}</aside>
          </div>
        )}

        {/* main grows to fill whatever the page doesn't use, so the footer sits on
            the bottom edge of a short page instead of floating under the card */}
        <div className={cx("flex flex-1 flex-col min-w-0 transition-[padding] duration-200", rail ? "lg:pl-[76px]" : "lg:pl-[248px]")}>
          <main className="mx-auto w-full min-w-0 max-w-[1480px] flex-1 p-3 sm:p-6">{children}</main>
          <footer className="mx-auto flex w-full max-w-[1480px] flex-col items-center gap-3 border-t border-slate-200 px-4 py-7 text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-500 sm:flex-row sm:justify-between sm:px-6">
            <span>© 2026 All rights reserved. {s.settings.shopName}.</span>
            <span>
              Powered by <span className="text-red-600">Cenexa Systems</span> ©2026
            </span>
            <span className="text-[13px] normal-case tracking-normal text-red-600" style={{ fontFamily: "var(--font-display), Georgia, serif", fontWeight: 600 }}>
              • Fresh, hot & fast.
            </span>
          </footer>
        </div>

        {/* toasts */}
        <div className={cx("pointer-events-none fixed bottom-3 left-3 z-[90] flex w-[min(380px,calc(100%-24px))] flex-col gap-2 sm:bottom-5 sm:left-5", rail ? "lg:left-[96px]" : "lg:left-[268px]")} aria-live="polite">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={cx(
                "adm-in pointer-events-auto flex items-start gap-3 rounded-2xl border bg-white p-4 shadow-[0_12px_32px_-12px_rgba(15,23,42,.35)]",
                t.kind === "err" ? "border-red-200" : t.kind === "order" ? "border-red-200" : t.kind === "bill" ? "border-amber-200" : "border-slate-200",
              )}
            >
              <span
                className={cx(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
                  t.kind === "err" && "bg-red-50 text-red-600",
                  t.kind === "order" && "bg-red-600 text-white",
                  t.kind === "bill" && "bg-amber-400 text-amber-950",
                  (t.kind === "ok" || t.kind === "info") && "bg-emerald-50 text-emerald-600",
                )}
              >
                <Icon name={t.kind === "err" ? "alert" : t.kind === "order" ? "utensils" : t.kind === "bill" ? "billing" : "check"} size={17} />
              </span>
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => {
                  if (t.href) router.push(t.href);
                  dismiss(t.id);
                }}
              >
                <b className="block text-[13.5px] text-slate-900">{t.title}</b>
                {t.body && <span className="mt-0.5 block truncate text-[12.5px] text-slate-500">{t.body}</span>}
              </button>
              <button type="button" onClick={() => dismiss(t.id)} className="text-slate-400 hover:text-slate-700" aria-label="Dismiss">
                <Icon name="x" size={15} />
              </button>
            </div>
          ))}
        </div>

        {/* confirm */}
        <Modal
          open={!!pending}
          onClose={() => answer(false)}
          title={pending?.title ?? ""}
          footer={
            <>
              <Btn onClick={() => answer(false)}>Cancel</Btn>
              <Btn kind={pending?.danger ? "red" : "dark"} onClick={() => answer(true)}>
                {pending?.ok ?? "Confirm"}
              </Btn>
            </>
          }
        >
          <div className="text-[14px] leading-relaxed text-slate-600">{pending?.body}</div>
        </Modal>

        {role === "admin" && <ApprovalPopup />}
        {settings && <Settings onClose={() => setSettings(false)} />}
        <div id="adm-layer" />
      </div>
      <div className="adm-print">{printNode}</div>
    </>
  );
}
