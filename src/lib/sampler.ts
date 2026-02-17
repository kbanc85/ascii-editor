// Gamma LUT cache: rebuilt only when gamma value changes
let cachedGamma = 0;
let GAMMA_LUT = new Float64Array(256);

export function getGammaLUT(gamma: number): Float64Array {
  if (gamma === cachedGamma) return GAMMA_LUT;
  cachedGamma = gamma;
  GAMMA_LUT = new Float64Array(256);
  for (let i = 0; i < 256; i++) {
    GAMMA_LUT[i] = (i / 255) ** gamma;
  }
  return GAMMA_LUT;
}

/** Reusable canvases passed between frames to avoid per-frame allocation */
export interface SampleCanvases {
  sample: HTMLCanvasElement;
  downsample: HTMLCanvasElement;
}

/** Create a reusable canvas pair for processVideo to pass into samplePixels */
export function createSampleCanvases(): SampleCanvases {
  return {
    sample: document.createElement("canvas"),
    downsample: document.createElement("canvas"),
  };
}

/**
 * Samples a video frame and returns raw RGBA pixel data.
 * Uses 2x anti-aliased source sampling then box-filters down to cols × rows.
 * No gamma decode, no char mapping, no settings dependency.
 */
export function samplePixels(
  video: HTMLVideoElement,
  cols: number,
  canvases?: SampleCanvases
): { pixels: Uint8ClampedArray; rows: number } {
  const aspect = video.videoWidth / video.videoHeight;
  const rows = Math.round(cols / aspect / 2);

  // 2x oversample then box-filter downsample for anti-aliasing
  const w2 = cols * 2;
  const h2 = rows * 2;

  const sampleCvs = canvases?.sample ?? document.createElement("canvas");
  const downCvs = canvases?.downsample ?? document.createElement("canvas");

  if (sampleCvs.width !== w2 || sampleCvs.height !== h2) {
    sampleCvs.width = w2;
    sampleCvs.height = h2;
  }
  if (downCvs.width !== cols || downCvs.height !== rows) {
    downCvs.width = cols;
    downCvs.height = rows;
  }

  const sampleCtx = sampleCvs.getContext("2d")!;
  const downCtx = downCvs.getContext("2d")!;

  sampleCtx.drawImage(video, 0, 0, w2, h2);
  downCtx.drawImage(sampleCvs, 0, 0, cols, rows);

  const imageData = downCtx.getImageData(0, 0, cols, rows);
  return { pixels: imageData.data, rows };
}

export interface RenderOptions {
  gamma: number;
  contrast: number;
  brightness: number;
  invertLuminance: boolean;
}

/**
 * Renders raw RGBA pixel data to an ASCII string.
 * Applies gamma LUT → luminance → contrast/brightness → clamp → invert →
 * perceptual encode → char index → character.
 */
export function renderFrameToString(
  pixels: Uint8ClampedArray,
  cols: number,
  rows: number,
  sortedChars: string[],
  options: RenderOptions
): string {
  const { gamma, contrast, brightness, invertLuminance } = options;
  const lut = getGammaLUT(gamma);
  const charCount = sortedChars.length;
  const invGamma = 1 / gamma;

  const lines: string[] = [];

  for (let y = 0; y < rows; y++) {
    let line = "";
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4;

      // Gamma-correct luminance using BT.709 coefficients
      let luminance =
        0.2126 * lut[pixels[i]] +
        0.7152 * lut[pixels[i + 1]] +
        0.0722 * lut[pixels[i + 2]];

      // Apply contrast and brightness in linear space
      luminance = (luminance - 0.5) * contrast + 0.5;
      luminance += brightness;
      luminance = Math.max(0, Math.min(1, luminance));

      if (invertLuminance) {
        luminance = 1 - luminance;
      }

      // Re-encode to perceptual space for even character distribution
      const perceptual = luminance ** invGamma;

      const charIndex = Math.min(
        Math.floor(perceptual * charCount),
        charCount - 1
      );
      line += sortedChars[charIndex];
    }
    lines.push(line);
  }

  return lines.join("\n");
}
