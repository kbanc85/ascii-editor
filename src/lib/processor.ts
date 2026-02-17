import { samplePixels, createSampleCanvases } from "@/lib/sampler";

export interface ProcessOptions {
  video: HTMLVideoElement;
  cols: number;
  fps: number;
  inPoint: number;
  outPoint: number;
  onProgress?: (progress: number) => void;
}

export interface ProcessResult {
  frames: Uint8ClampedArray[];
  rows: number;
}

/**
 * Seeks a video element to a specific time and waits for the seek to complete.
 * Times out after 5 seconds to prevent hanging on undecodable frames.
 */
export function seekTo(
  video: HTMLVideoElement,
  time: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      video.removeEventListener("seeked", onSeeked);
      reject(new Error(`Seek to ${time}s timed out`));
    }, 5000);

    const onSeeked = () => {
      clearTimeout(timeout);
      video.removeEventListener("seeked", onSeeked);
      resolve();
    };
    video.addEventListener("seeked", onSeeked);
    video.currentTime = time;
  });
}

/**
 * Processes a video between in/out points at the configured FPS,
 * sampling each frame to raw RGBA pixel data.
 * Reuses canvases across frames and yields to the main thread for progress updates.
 */
export async function processVideo(
  opts: ProcessOptions
): Promise<ProcessResult> {
  const { video, cols, fps, inPoint, outPoint, onProgress } = opts;

  const duration = outPoint - inPoint;
  const frameInterval = 1 / fps;
  const totalFrames = Math.ceil(duration * fps);

  // Reuse canvases across all frames instead of allocating per frame
  const canvases = createSampleCanvases();

  const frames: Uint8ClampedArray[] = [];
  let rows = 0;

  for (let i = 0; i < totalFrames; i++) {
    const time = inPoint + i * frameInterval;

    try {
      await seekTo(video, Math.min(time, outPoint));
    } catch {
      // Seek timed out: duplicate previous frame (or empty array for first frame)
      frames.push(frames.length > 0 ? frames[frames.length - 1] : new Uint8ClampedArray(0));
      if (onProgress) onProgress((i + 1) / totalFrames);
      continue;
    }

    const result = samplePixels(video, cols, canvases);
    frames.push(result.pixels);
    rows = result.rows;

    if (onProgress) {
      onProgress((i + 1) / totalFrames);
    }

    // Yield to main thread every 4 frames so React can flush progress updates
    if (i % 4 === 3) {
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
  }

  return { frames, rows };
}

/**
 * Applies crossfade blending between the last N and first N frames.
 * Uses random character selection weighted by the blend factor.
 */
export function applyCrossfade(
  frames: string[],
  crossfadeCount: number
): string[] {
  if (crossfadeCount <= 0 || frames.length < crossfadeCount * 2) {
    return frames;
  }

  const result = [...frames];
  const totalFrames = frames.length;

  for (let i = 0; i < crossfadeCount; i++) {
    const blend = (i + 1) / (crossfadeCount + 1);
    const tailIndex = totalFrames - crossfadeCount + i;
    const headIndex = i;

    const tailFrame = frames[tailIndex];
    const headFrame = frames[headIndex];

    let blended = "";
    for (let c = 0; c < tailFrame.length; c++) {
      if (tailFrame[c] === "\n") {
        blended += "\n";
      } else {
        // blend factor increases from 0 to 1 as we approach the loop point
        // Higher blend = more likely to pick from head frame
        blended += Math.random() < blend ? headFrame[c] : tailFrame[c];
      }
    }

    result[tailIndex] = blended;
  }

  return result;
}
