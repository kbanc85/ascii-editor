// Cache density results to avoid recalculating on every Convert click
const densityCache = new Map<string, string[]>();

/**
 * Sorts characters by visual density (ink coverage) for a given font.
 * Lightest characters first, densest last.
 * Uses alpha-sum (continuous) instead of binary pixel counting for accuracy.
 */
export function sortCharsByDensity(
  chars: string,
  font: string,
  fontSize: number
): string[] {
  const cacheKey = `${chars}|${font}|${fontSize}`;
  const cached = densityCache.get(cacheKey);
  if (cached) return cached;

  const size = fontSize * 2;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const densities: { char: string; count: number }[] = [];

  for (const char of chars) {
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "#000";
    ctx.font = `${fontSize}px "${font}", monospace`;
    ctx.textBaseline = "top";
    ctx.fillText(char, 0, 0);

    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;
    let alphaSum = 0;

    for (let i = 3; i < data.length; i += 4) {
      alphaSum += data[i];
    }

    densities.push({ char, count: alphaSum });
  }

  // Stable sort: by density, then by charCode as tiebreaker
  densities.sort((a, b) => a.count - b.count || a.char.charCodeAt(0) - b.char.charCodeAt(0));
  const result = densities.map((d) => d.char);
  densityCache.set(cacheKey, result);
  return result;
}
