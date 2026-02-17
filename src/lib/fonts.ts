const loadedFonts = new Set<string>();

/**
 * Loads a Google Font by injecting a stylesheet link and waiting for it to be ready.
 */
export async function loadGoogleFont(
  family: string,
  cssUrl: string
): Promise<void> {
  if (loadedFonts.has(family)) return;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = cssUrl;
  document.head.appendChild(link);

  await document.fonts.load(`16px "${family}"`);
  loadedFonts.add(family);
}

/**
 * Loads a custom font from a URL using the FontFace API.
 * Returns the font family name.
 */
export async function loadCustomFont(
  name: string,
  url: string
): Promise<string> {
  if (loadedFonts.has(name)) return name;

  const face = new FontFace(name, `url(${url})`);
  const loaded = await face.load();
  document.fonts.add(loaded);
  loadedFonts.add(name);
  return name;
}

/**
 * Extracts the font family name from a Google Fonts CSS URL.
 * Returns null if the URL doesn't match the expected pattern.
 */
export function parseFontFamily(googleUrl: string): string | null {
  try {
    const url = new URL(googleUrl);
    const family = url.searchParams.get("family");
    if (!family) return null;
    // Family param may include weight specs like "Fira+Code:wght@400;700"
    return family.split(":")[0].replace(/\+/g, " ");
  } catch {
    return null;
  }
}
