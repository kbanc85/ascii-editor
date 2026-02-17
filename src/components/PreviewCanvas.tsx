"use client";

import { useRef, useEffect } from "react";
import { useEditor } from "@/lib/editor-context";

export default function PreviewCanvas() {
  const { state } = useEditor();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { settings, frames, currentFrame } = state;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const frame = frames[currentFrame];
    if (!frame) {
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

    const lines = frame.split("\n");
    const font = `${settings.fontSize}px "${settings.font}", monospace`;

    // Measure cell size using actual font metrics (not magic multiplier)
    ctx.font = font;
    const metrics = ctx.measureText("M");
    const cellW = metrics.width;
    const cellH = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;

    const cols = lines[0]?.length || 0;
    const rows = lines.length;

    const dpr = window.devicePixelRatio || 1;
    const canvasW = Math.ceil(cols * cellW);
    const canvasH = Math.ceil(rows * cellH);

    canvas.width = canvasW * dpr;
    canvas.height = canvasH * dpr;
    canvas.style.width = `${canvasW}px`;
    canvas.style.height = `${canvasH}px`;
    ctx.scale(dpr, dpr);

    // Fill background (skip for transparent mode)
    if (settings.transparentBg) {
      ctx.clearRect(0, 0, canvasW, canvasH);
    } else {
      ctx.fillStyle = settings.background;
      ctx.fillRect(0, 0, canvasW, canvasH);
    }

    // Pre-compute fill styles per character (avoids hex parsing + string concat in inner loop)
    const hex = settings.colour.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const charsLen = settings.chars.length;
    const fillStyleMap = new Map<string, string | null>();
    for (let i = 0; i < charsLen; i++) {
      const ch = settings.chars[i];
      const t = charsLen > 1 ? i / (charsLen - 1) : 1;
      if (t < settings.clipThreshold) {
        fillStyleMap.set(ch, null);
      } else {
        const alpha = settings.baseAlpha + t * (settings.peakAlpha - settings.baseAlpha);
        fillStyleMap.set(ch, `rgba(${r},${g},${b},${alpha})`);
      }
    }
    const fallbackStyle = `rgba(${r},${g},${b},${settings.peakAlpha})`;

    ctx.font = font;
    ctx.textBaseline = "top";

    for (let row = 0; row < rows; row++) {
      const line = lines[row];
      if (!line) continue;
      for (let col = 0; col < line.length; col++) {
        const char = line[col];
        if (char === " ") continue;

        const style = fillStyleMap.get(char);
        if (style === null) continue; // clipped
        ctx.fillStyle = style ?? fallbackStyle;
        ctx.fillText(char, col * cellW, row * cellH);
      }
    }
  }, [frames, currentFrame, settings]);

  if (frames.length === 0) {
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
