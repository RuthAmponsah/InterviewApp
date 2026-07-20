export const cleanConfigValue = (value?: unknown) => {
  if (typeof value !== "string") return "";

  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith("@")) return "";

  return trimmed;
};

export const firstConfigValue = (...values: unknown[]) => {
  for (const value of values) {
    const cleaned = cleanConfigValue(value);
    if (cleaned) return cleaned;
  }

  return "";
};

export const hasConfigValue = (...values: unknown[]) => Boolean(firstConfigValue(...values));

export const isValidHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};
