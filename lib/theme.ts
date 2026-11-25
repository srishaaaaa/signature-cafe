/* Shop colour theme — three colours picked in Admin → Settings repaint the whole app.

   Every stylesheet already paints through variables: the guest menu through the
   tokens in app/globals.css (--cocoa, --cream, --cherry…), the admin panel through
   Tailwind's own --color-slate-* / --color-red-* ramps re-pointed in admin.css.
   themeCss() derives all of those from the three picks and returns a stylesheet
   that overrides them (doubled selectors, so it wins whatever order the CSS loads in).
   At the default colours it returns "" and the hand-tuned palette is left as it is. */

export type Theme = {
  /** brand colour: buttons, highlights, prices, links */
  accent: string;
  /** the dark colour: headers, dark bands, text */
  dark: string;
  /** the light colour: page background and cards */
  light: string;
};

export const DEFAULT_THEME: Theme = { accent: "#9a7420", dark: "#0d0d0d", light: "#f6f1e2" };

/* Only colours that sit well with the gold logo: the brand colour is always a gold tone,
   and the dark and light colours are deep jewel tones and warm whites that gold suits.
   Settings offers just these swatches, and the server accepts nothing else. */
export const THEME_SWATCHES: Record<keyof Theme, { name: string; hex: string }[]> = {
  accent: [
    { name: "Antique gold", hex: "#9a7420" },
    { name: "Logo gold", hex: "#a87a24" },
    { name: "Old bronze", hex: "#8a6324" },
    { name: "Deep honey", hex: "#94661a" },
    { name: "Rose gold", hex: "#a0614f" },
  ],
  dark: [
    { name: "Onyx black", hex: "#0d0d0d" },
    { name: "Espresso", hex: "#1e140e" },
    { name: "Emerald", hex: "#0e2219" },
    { name: "Midnight navy", hex: "#0d1626" },
    { name: "Burgundy", hex: "#2a0e14" },
    { name: "Aubergine", hex: "#1f1224" },
  ],
  light: [
    { name: "Cream", hex: "#f6f1e2" },
    { name: "Ivory", hex: "#fbf8ef" },
    { name: "Champagne", hex: "#f3e9d2" },
    { name: "Pearl", hex: "#f4f2ec" },
    { name: "Blush", hex: "#f8ede6" },
  ],
};

export const THEME_PRESETS: (Theme & { name: string })[] = [
  { name: "Onyx & gold", ...DEFAULT_THEME },
  { name: "Espresso & gold", accent: "#9a7420", dark: "#1e140e", light: "#f3e9d2" },
  { name: "Emerald & gold", accent: "#a87a24", dark: "#0e2219", light: "#fbf8ef" },
  { name: "Navy & gold", accent: "#a87a24", dark: "#0d1626", light: "#f4f2ec" },
  { name: "Burgundy & gold", accent: "#94661a", dark: "#2a0e14", light: "#f6f1e2" },
  { name: "Aubergine & rose gold", accent: "#a0614f", dark: "#1f1224", light: "#f8ede6" },
];

export const isHex = (v: unknown): v is string => typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v);

/** True when the colour is one of the allowed swatches for that slot. */
export const isSwatch = (k: keyof Theme, v: unknown) => isHex(v) && THEME_SWATCHES[k].some((s) => s.hex === v.toLowerCase());

/** Fills any missing or not-allowed colour from the default. */
export function cleanTheme(t: Partial<Theme> | null | undefined): Theme {
  return {
    accent: isSwatch("accent", t?.accent) ? t!.accent!.toLowerCase() : DEFAULT_THEME.accent,
    dark: isSwatch("dark", t?.dark) ? t!.dark!.toLowerCase() : DEFAULT_THEME.dark,
    light: isSwatch("light", t?.light) ? t!.light!.toLowerCase() : DEFAULT_THEME.light,
  };
}

export const sameTheme = (a: Theme, b: Theme) => a.accent === b.accent && a.dark === b.dark && a.light === b.light;

type RGB = [number, number, number];
const rgb = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;
const hex = (c: RGB) => "#" + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
const WHITE = "#ffffff";
const BLACK = "#000000";
/** a → b by t (0 = a, 1 = b) */
const mix = (a: string, b: string, t: number) => {
  const x = rgb(a), y = rgb(b);
  return hex([0, 1, 2].map((i) => x[i] + (y[i] - x[i]) * t) as RGB);
};
const alpha = (h: string, a: number) => `rgba(${rgb(h).join(", ")}, ${a})`;

/** WCAG contrast ratio between two colours (1–21). */
export function contrast(a: string, b: string) {
  const lum = (h: string) => {
    const [r, g, bl] = rgb(h).map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** The override stylesheet for a theme ("" for the default theme). */
export function themeCss(input: Partial<Theme> | null | undefined): string {
  const t = cleanTheme(input);
  if (sameTheme(t, DEFAULT_THEME)) return "";
  const { accent: A, dark: D, light: L } = t;

  const root: Record<string, string> = {
    "--cocoa": D,
    "--cocoa-2": mix(D, L, 0.05),
    "--cocoa-3": mix(D, L, 0.1),
    "--ganache": mix(D, L, 0.18),
    "--cream": L,
    "--cream-2": mix(L, A, 0.22),
    "--paper": mix(L, WHITE, 0.5),
    "--ink": mix(D, L, 0.04),
    "--ink-soft": mix(D, L, 0.42),
    "--cherry": A,
    "--cherry-deep": mix(A, BLACK, 0.24),
    "--cherry-lite": mix(A, WHITE, 0.3),
    "--pistachio": mix(A, WHITE, 0.22),
    "--caramel": mix(A, WHITE, 0.36),
    "--rose": mix(L, A, 0.3),
    "--line-dark": alpha(L, 0.16),
    "--line-light": alpha(D, 0.14),
  };

  /* admin: neutrals run light → dark, the accent ramp centres on the brand colour at 600 */
  const slate: Record<number, string> = {
    50: mix(L, WHITE, 0.35), 100: mix(L, D, 0.05), 200: mix(L, D, 0.12), 300: mix(L, D, 0.26), 400: mix(L, D, 0.42),
    500: mix(L, D, 0.56), 600: mix(L, D, 0.67), 700: mix(L, D, 0.77), 800: mix(L, D, 0.86), 900: mix(L, D, 0.93), 950: mix(L, D, 0.98),
  };
  const red: Record<number, string> = {
    50: mix(A, WHITE, 0.92), 100: mix(A, WHITE, 0.8), 200: mix(A, WHITE, 0.62), 300: mix(A, WHITE, 0.44), 400: mix(A, WHITE, 0.26),
    500: mix(A, WHITE, 0.12), 600: A, 700: mix(A, BLACK, 0.22), 800: mix(A, BLACK, 0.4), 900: mix(A, BLACK, 0.58),
  };
  const adm: Record<string, string> = { "--color-white": mix(L, WHITE, 0.75) };
  for (const [k, v] of Object.entries(slate)) adm[`--color-slate-${k}`] = v;
  for (const [k, v] of Object.entries(red)) adm[`--color-red-${k}`] = v;

  const block = (sel: string, vars: Record<string, string>) => `${sel}{${Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(";")}}`;
  return block(":root:root", root) + block(".adm.adm", adm);
}
