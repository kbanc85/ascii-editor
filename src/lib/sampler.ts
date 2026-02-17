// Gamma LUT: linearize sRGB values (gamma 2.2) with three array lookups per pixel
const GAMMA_LUT = new Float64Array(256);
for (let i = 0; i < 256; i++) {
  GAMMA_LUT[i] = (i / 255) ** 2.2;
}

/** Reusable canvases passed between frames to avoid per-frame allocation */
export interface SampleCanvases {
  sample: HTMLCanvasElement;
  downsample: HTMLCanvasElement;
}

/** Create a reusable canvas pair for processVideo to pass into sampleFrame */
export function createSampleCanvases(): SampleCanvases {
  return {
    sample: document.createElement("canvas"),
    downsample: document.createElement("canvas"),
  };
}

/**
 * Samples a video frame and converts it to ASCII text.
 * Uses gamma-correct luminance (BT.709), perceptual character mapping,
 * and 2x anti-aliased source sampling.
 */
export function sampleFrame(
  video: HTMLVideoElement,
  cols: number,
  sortedChars: string[],
  invertLuminance: boolean,
  canvases?: SampleCanvases
): { text: string; rows: number } {
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
  const data = imageData.data;

  const lines: string[] = [];
  const charCount = sortedChars.length;

  for (let y = 0; y < rows; y++) {
    let line = "";
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4;

      // Gamma-correct luminance using BT.709 coefficients
      let luminance =
        0.2126 * GAMMA_LUT[data[i]] +
        0.7152 * GAMMA_LUT[data[i + 1]] +
        0.0722 * GAMMA_LUT[data[i + 2]];

      if (invertLuminance) {
        luminance = 1 - luminance;
      }

      // Re-encode to perceptual space for even character distribution
      const perceptual = luminance ** (1 / 2.2);

      const charIndex = Math.min(
        Math.floor(perceptual * charCount),
        charCount - 1
      );
      line += sortedChars[charIndex];
    }
    lines.push(line);
  }

  return { text: lines.join("\n"), rows };
}
