export function extractMetaPixelId(value: string) {
  const initMatch = value.match(/fbq\(\s*['"]init['"]\s*,\s*['"](\d{5,30})['"]/i);
  if (initMatch?.[1]) return initMatch[1];

  const urlMatch = value.match(/[?&]id=(\d{5,30})(?:&|$)/i);
  if (urlMatch?.[1]) return urlMatch[1];

  const digitsOnly = value.replace(/\D/g, "");
  return digitsOnly.length >= 5 && digitsOnly.length <= 30 ? digitsOnly : value.trim();
}
