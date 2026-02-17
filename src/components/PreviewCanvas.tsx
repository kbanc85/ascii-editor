"use client";

import { useRef, useEffect } from "react";
import { useEditor } from "@/lib/editor-context";
import { getGammaLUT } from "@/lib/sampler";
import { sortCharsByDensity } from "@/lib/density";

export default function PreviewCanvas() {
  const { state } = useEditor();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { settings, framePixels, frameCols, frameRows, currentFrame } = state;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pixels = framePixels[currentFrame];
    if (!pixels || pixels.length === 0) {
      // Placeholder
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
      ctx.fillStyle = settings.background;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#9CA3AF";
      ctx.font = "14px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Process video to see preview", w / 2, h / 2);
      return;
    }

    const cols = frameCols;
    const rows = frameRows;

    // Sort chars by density (cached internally)
    const sortedChars = sortCharsByDensity(settings.chars, settings.font, settings.fontSize);
    const charCount = sortedChars.length;

    // Tonal pipeline setup
    const lut = getGammaLUT(settings.gamma);
    const invGamma = 1 / settings.gamma;
    const { contrast, brightness, invertLuminance } = settings;

    const font = `${settings.fontSize}px "${settings.font}", monospace`;

    // Measure cell size
    ctx.font = font;
    const metrics = ctx.measureText("M");
    const cellW = metrics.width;
    const cellH = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;

    const dpr = window.devicePixelRatio || 1;
    const canvasW = Math.ceil(cols * cellW);
    const canvasH = Math.ceil(rows * cellH);

    canvas.width = canvasW * dpr;
    canvas.height = canvasH * dpr;
    canvas.style.width = `${canvasW}px`;
    canvas.style.height = `${canvasH}px`;
    ctx.scale(dpr, dpr);

    // Fill background
    if (settings.transparentBg) {
      ctx.clearRect(0, 0, canvasW, canvasH);
    } else {
      ctx.fillStyle = settings.background;
      ctx.fillRect(0, 0, canvasW, canvasH);
    }

    // Parse colour once
    const hex = settings.colour.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    ctx.font = font;
    ctx.textBaseline = "top";

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const i = (row * cols + col) * 4;

        // Gamma-correct luminance using BT.709 coefficients
        let luminance =
          0.2126 * lut[pixels[i]] +
          0.7152 * lut[pixels[i + 1]] +
          0.0722 * lut[pixels[i + 2]];

        // Contrast and brightness in linear space
        luminance = (luminance - 0.5) * contrast + 0.5 + brightness;
        luminance = Math.max(0, Math.min(1, luminance));

        if (invertLuminance) {
          luminance = 1 - luminance;
        }

        // Perceptual encoding for even character distribution
        const perceptual = luminance ** invGamma;
        const charIndex = Math.min(Math.floor(perceptual * charCount), charCount - 1);
        const char = sortedChars[charIndex];

        if (char === " ") continue;

        // Alpha from charIndex position (same ramp as density sort)
        const t = charCount > 1 ? charIndex / (charCount - 1) : 1;
        if (t < settings.clipThreshold) continue;

        const alpha = settings.baseAlpha + t * (settings.peakAlpha - settings.baseAlpha);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.fillText(char, col * cellW, row * cellH);
      }
    }
  }, [framePixels, frameCols, frameRows, currentFrame, settings]);

  if (framePixels.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center overflow-auto p-4">
      <canvas ref={canvasRef} />
    </div>
  );
}
