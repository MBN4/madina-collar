// Single source of truth for visual parity with mobile/src/screens/*.js + mobile/src/theme/colors.js.
// Mirrored as CSS custom properties in globals.css — update both when changing a value.

export const COLORS = {
  primary: "#FFD700",
  secondary: "#FFF9C4",
  background: "#FFFFFF",
  surface: "#FFFDE7",
  textPrimary: "#1A1A1B",
  textSecondary: "#5D4037",
  accent: "#FBC02D",
  error: "#FF5252",
  border: "#EFEFEF",
  borderAlt: "#EEEEEE",
  yellowGradient: "linear-gradient(160deg, #FFFDE7 0%, #FFD700 100%)",
  premiumGradient: "linear-gradient(135deg, #FFD700 0%, #FBC02D 55%, #FFA000 100%)",
};

export const QUALITY_THEMES: Record<string, { primary: string; gradient: string; accent: string }> = {
  "Madina Collar": { primary: "#FFD700", gradient: "linear-gradient(160deg, #FFFFFF 0%, #FFD700 100%)", accent: "#FBC02D" },
  "New Madina Collar": { primary: "#FFD700", gradient: "linear-gradient(160deg, #FFFFFF 0%, #FFD700 100%)", accent: "#FBC02D" },
  "Anarkali Collar": { primary: "#FFD700", gradient: "linear-gradient(160deg, #FFFFFF 0%, #FFD700 100%)", accent: "#FBC02D" },
  "Angle Collar": { primary: "#FFD700", gradient: "linear-gradient(160deg, #FFFFFF 0%, #FFD700 100%)", accent: "#FBC02D" },
  "Pak Collar": { primary: "#FFD700", gradient: "linear-gradient(160deg, #FFFFFF 0%, #FFD700 100%)", accent: "#FBC02D" },
};

export const DEFAULT_QUALITY_THEME = QUALITY_THEMES["Madina Collar"];

// Mobile leans on heavy weights (700-900) + tight/wide letter-spacing for hierarchy, no custom font.
export const TYPOGRAPHY = {
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  weight: { regular: 500, semibold: 700, bold: 800, black: 900 },
  size: {
    display: "42px", // QualityScreen "Collections"
    h1: "32px", // Auth title
    h2: "26px", // SizeSelection grid title
    h3: "22px", // ConfirmOrder header / style name
    body: "16px",
    small: "14px",
    micro: "11px", // uppercase eyebrow labels
    tiny: "10px",
  },
};

export const RADII = {
  pill: "9999px",
  xl: "45px", // bottom-sheet-style panels (checkout footer, product mainWrapper)
  lg: "30px", // hero cards, summary cards
  md: "20px", // inputs, image tiles
  sm: "15px", // buttons, tabs
  circle: "50%",
};

export const SPACING = {
  xs: "5px",
  sm: "10px",
  md: "15px",
  lg: "20px",
  xl: "25px",
  xxl: "35px",
};

export const SHADOWS = {
  soft: "0 3px 8px rgba(0,0,0,0.05)", // inputs
  card: "0 8px 24px rgba(0,0,0,0.08)", // product/quality cards
  raised: "0 15px 30px rgba(0,0,0,0.12)", // style cards, marquee logo pods
  sheet: "0 -15px 30px rgba(0,0,0,0.15)", // bottom sticky footers
  primaryGlow: "0 8px 20px rgba(255,215,0,0.35)", // primary CTA buttons
};

// Every animation/transition observed per mobile screen — durations/easings kept 1:1 for parity.
export const ANIMATIONS = {
  splash: {
    fade: { duration: 1.5, ease: "easeOut" },
    scale: { type: "spring", stiffness: 90, damping: 12 }, // friction 4 / tension 40
    rotate: { duration: 2, ease: "easeOut", from: -5, to: 0 }, // degrees
    slideUp: { duration: 1.2, ease: "easeOut", from: 30, to: 0 },
    holdMs: 3500,
  },
  auth: {
    entrance: { duration: 0.8, ease: "easeOut" },
    formSpring: { type: "spring", stiffness: 120, damping: 14 }, // friction 8
    logoSpring: { type: "spring", stiffness: 140, damping: 12 }, // friction 6
    passwordToggle: { duration: 0.1 },
    marqueeDurationA: 35,
    marqueeDurationB: 45,
    marqueeFloat: { duration: 2.5, ease: "easeInOut" },
  },
  catalog: {
    cardStaggerMs: 150,
    fade: { duration: 0.8, ease: "easeOut" },
    slideSpring: { type: "spring", stiffness: 110, damping: 14 }, // friction 8
  },
  product: {
    styleCardStaggerMs: 150, // FadeInDown
    sizeRowStaggerMs: 20, // FadeInRight
    layoutSpring: { type: "spring", stiffness: 170, damping: 20 },
  },
  checkout: {
    trayReveal: { duration: 0.3, ease: "easeOut" }, // FadeInDown
    successZoom: { duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }, // ZoomIn
  },
  hover: { duration: 0.15, ease: "easeOut" },
} as const;
