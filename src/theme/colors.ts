// theme/colors.ts

export type ThemeType = "light" | "dark";

// Global font configuration matching Welcome screen
export const typography = {
  // Headings
  heading: {
    fontSize: 32,
    fontWeight: "700" as const,
    letterSpacing: 0.3,
    lineHeight: 38,
  },
  headingMedium: {
    fontSize: 24,
    fontWeight: "700" as const,
    letterSpacing: 0.3,
    lineHeight: 30,
  },
  headingSmall: {
    fontSize: 20,
    fontWeight: "600" as const,
    letterSpacing: 0.2,
    lineHeight: 26,
  },
  
  // Body text
  body: {
    fontSize: 20,
    fontWeight: "400" as const,
    letterSpacing: 0.2,
    lineHeight: 34,
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: "400" as const,
    letterSpacing: 0.2,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: "400" as const,
    letterSpacing: 0.2,
    lineHeight: 20,
  },
  
  // Labels & captions
  label: {
    fontSize: 15,
    fontWeight: "500" as const,
    letterSpacing: 0.1,
  },
  caption: {
    fontSize: 12,
    fontWeight: "400" as const,
    letterSpacing: 0.1,
  },
};

export default function colors(theme: ThemeType) {
  const isDark = theme === "dark";

  return {
    // --- BACKGROUNDS ---
    background: isDark ? "#000000" : "#FFFFFF",
    card: isDark ? "#1A1A1A" : "#FFFFFF",

    // --- BRAND COLORS (unchanged for both modes) ---
    primaryBlue: "#1E63FF",
    primaryBlueDark: "#1141A8",
    accentGreen: "#28A745",

    // --- TEXT ---
    textDark: isDark ? "#FFFFFF" : "#111827",
    textMuted: isDark ? "#BBBBBB" : "#6B7280",
    textBody: isDark ? "#e5e5e5" : "#444",

    // --- BORDERS ---
    border: isDark ? "#333333" : "#E5E7EB",

    // --- ERRORS ---
    error: "#DC2626",
  };
}
