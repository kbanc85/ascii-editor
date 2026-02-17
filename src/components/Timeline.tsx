"use client";

import { useCallback, useEffect, useRef } from "react";
import { useEditor } from "@/lib/editor-context";
import { sortCharsByDensity } from "@/lib/density";
import { processVideo, applyCrossfade } from "@/lib/processor";
import { renderFrameToString, type RenderOptions } from "@/lib/sampler";
import {
  buildExport,
  exportJSON,
  exportTypeScript,
  exportSingleFrame,
  generateFilename,
} from "@/lib/export";
import type { ExportMeta } from "@/lib/types";

export default function Timeline() {
  const { state, dispatch, videoRef } = useEditor();
  const {
    settings,
    framePixels,
    frameCols,
    frameRows,
    currentFrame,
    isPlaying,
    isProcessing,
    processProgress,
    inPoint,
    outPoint,
    videoDuration,
    crossfadeFrames,
    loopEnabled,
    conversionStale,
  } = state;

  const rafRef = useRef<number | null>(null);

  // Playback loop using requestAnimationFrame for vsync-aligned timing
  useEffect(() => {
    if (!isPlaying || framePixels.length === 0) return;

    const frameDuration = 1000 / settings.fps;
    let startTime: number | null = null;
    let localFrame = currentFrame;

    const tick = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const targetFrame = localFrame + Math.floor(elapsed / frameDuration);

      if (targetFrame > localFrame) {
        const nextFrame = targetFrame >= framePixels.length
          ? loopEnabled ? targetFrame % framePixels.length : framePixels.length - 1
          : targetFrame;

        localFrame = targetFrame;
        startTime = timestamp - (elapsed % frameDuration);
        dispatch({ type: "SET_CURRENT_FRAME", payload: nextFrame });

        if (!loopEnabled && nextFrame >= framePixels.length - 1) {
          dispatch({ type: "SET_PLAYING", payload: false });
          return;
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isPlaying, framePixels.length, settings.fps, loopEnabled, dispatch]);

  const handleConvert = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    dispatch({ type: "SET_PROCESSING", payload: true });
    dispatch({ type: "SET_PROGRESS", payload: 0 });
    dispatch({ type: "SET_PLAYING", payload: false });

    try {
      const result = await processVideo({
        video,
        cols: settings.cols,
        fps: settings.fps,
        inPoint,
        outPoint,
        onProgress: (p) => dispatch({ type: "SET_PROGRESS", payload: p }),
      });

      dispatch({
        type: "SET_FRAMES",
        payload: { frames: result.frames, cols: settings.cols, rows: result.rows },
      });
    } finally {
      dispatch({ type: "SET_PROCESSING", payload: false });
    }
  }, [videoRef, settings.cols, settings.fps, inPoint, outPoint, dispatch]);

  /** Render all pixel frames to ASCII strings using current settings */
  const renderAllFrames = useCallback((): string[] => {
    const sortedChars = sortCharsByDensity(settings.chars, settings.font, settings.fontSize);
    const renderOpts: RenderOptions = {
      gamma: settings.gamma,
      contrast: settings.contrast,
      brightness: settings.brightness,
      invertLuminance: settings.invertLuminance,
    };
    return framePixels.map((px) =>
      renderFrameToString(px, frameCols, frameRows, sortedChars, renderOpts)
    );
  }, [framePixels, frameCols, frameRows, settings]);

  const buildMeta = useCallback((): ExportMeta => {
    return {
      cols: frameCols,
      rows: frameRows,
      fps: settings.fps,
      totalFrames: framePixels.length,
      font: settings.font,
      fontSize: settings.fontSize,
      chars: settings.chars,
      colour: settings.colour,
      baseAlpha: settings.baseAlpha,
      peakAlpha: settings.peakAlpha,
      background: settings.background,
      loop: loopEnabled,
      crossfadeFrames,
      transparentBackground: settings.transparentBg,
      clipThreshold: settings.clipThreshold,
      gamma: settings.gamma,
      contrast: settings.contrast,
      brightness: settings.brightness,
    };
  }, [settings, frameCols, frameRows, framePixels.length, loopEnabled, crossfadeFrames]);

  const handleExportJSON = useCallback(() => {
    if (framePixels.length === 0) return;
    let stringFrames = renderAllFrames();
    if (crossfadeFrames > 0) {
      stringFrames = applyCrossfade(stringFrames, crossfadeFrames);
    }
    const data = buildExport(buildMeta(), stringFrames);
    exportJSON(data, generateFilename(frameCols, settings.fps, "json"));
  }, [framePixels.length, renderAllFrames, crossfadeFrames, buildMeta, frameCols, settings.fps]);

  const handleExportTS = useCallback(() => {
    if (framePixels.length === 0) return;
    let stringFrames = renderAllFrames();
    if (crossfadeFrames > 0) {
      stringFrames = applyCrossfade(stringFrames, crossfadeFrames);
    }
    const data = buildExport(buildMeta(), stringFrames);
    exportTypeScript(data, generateFilename(frameCols, settings.fps, "ts"));
  }, [framePixels.length, renderAllFrames, crossfadeFrames, buildMeta, frameCols, settings.fps]);

  const handleExportFrame = useCallback(() => {
    if (framePixels.length === 0) return;
    const sortedChars = sortCharsByDensity(settings.chars, settings.font, settings.fontSize);
    const renderOpts: RenderOptions = {
      gamma: settings.gamma,
      contrast: settings.contrast,
      brightness: settings.brightness,
      invertLuminance: settings.invertLuminance,
    };
    const frameString = renderFrameToString(
      framePixels[currentFrame], frameCols, frameRows, sortedChars, renderOpts
    );
    exportSingleFrame(buildMeta(), frameString, `ascii-frame-${currentFrame}.json`);
  }, [framePixels, currentFrame, frameCols, frameRows, settings, buildMeta]);

  return (
    <div className="border-t border-border bg-bg-panel px-4 py-3 flex flex-col gap-3">
      {/* Frame scrubber */}
      <div className="flex items-center gap-3">
        <button
          onClick={() =>
            dispatch({ type: "SET_PLAYING", payload: !isPlaying })
          }
          disabled={framePixels.length === 0}
          className="px-3 py-1 text-xs bg-accent/10 text-accent rounded border border-accent/20 hover:bg-accent/20 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPlaying ? "Pause" : "Play"}
        </button>

        <input
          type="range"
          min={0}
          max={Math.max(framePixels.length - 1, 0)}
          value={currentFrame}
          onChange={(e) =>
            dispatch({
              type: "SET_CURRENT_FRAME",
              payload: Number(e.target.value),
            })
          }
          disabled={framePixels.length === 0}
          className="flex-1"
        />

        <span className="text-xs font-mono text-text-dim w-20 text-right">
          {framePixels.length > 0
            ? `${currentFrame + 1}/${framePixels.length}`
            : "0/0"}
        </span>
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* In/Out points */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-text-dim">In</label>
          <input
            type="number"
            value={inPoint}
            min={0}
            max={outPoint}
            step={0.1}
            onChange={(e) =>
              dispatch({
                type: "SET_IN_POINT",
                payload: Number(e.target.value),
              })
            }
            className="w-16 bg-bg-subtle border border-border rounded px-1.5 py-1 text-xs font-mono text-text focus:outline-none focus:border-accent"
          />
          <label className="text-xs text-text-dim">Out</label>
          <input
            type="number"
            value={outPoint}
            min={inPoint}
            max={videoDuration}
            step={0.1}
            onChange={(e) =>
              dispatch({
                type: "SET_OUT_POINT",
                payload: Number(e.target.value),
              })
            }
            className="w-16 bg-bg-subtle border border-border rounded px-1.5 py-1 text-xs font-mono text-text focus:outline-none focus:border-accent"
          />
        </div>

        {/* Convert button with re-convert indicator */}
        <button
          onClick={handleConvert}
          disabled={isProcessing}
          className={`px-4 py-1.5 text-xs rounded font-medium disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 ${
            conversionStale
              ? "bg-amber-500/90 text-bg hover:bg-amber-500"
              : "bg-accent text-bg hover:bg-accent-dim"
          }`}
        >
          {conversionStale && (
            <span className="w-1.5 h-1.5 rounded-full bg-bg animate-pulse" />
          )}
          {isProcessing
            ? `Processing ${Math.round(processProgress * 100)}%`
            : conversionStale
              ? "Re-convert"
              : "Convert"}
        </button>

        {/* Export buttons */}
        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={handleExportJSON}
            disabled={framePixels.length === 0}
            className="px-2 py-1 text-xs bg-bg-subtle text-text-dim rounded border border-border hover:border-border-hover disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Export JSON
          </button>
          <button
            onClick={handleExportTS}
            disabled={framePixels.length === 0}
            className="px-2 py-1 text-xs bg-bg-subtle text-text-dim rounded border border-border hover:border-border-hover disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Export TS
          </button>
          <button
            onClick={handleExportFrame}
            disabled={framePixels.length === 0}
            className="px-2 py-1 text-xs bg-bg-subtle text-text-dim rounded border border-border hover:border-border-hover disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Frame
          </button>
        </div>
      </div>
    </div>
  );
}
