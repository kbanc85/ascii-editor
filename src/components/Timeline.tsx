"use client";

import { useCallback, useEffect, useRef } from "react";
import { useEditor } from "@/lib/editor-context";
import { sortCharsByDensity } from "@/lib/density";
import { processVideo, applyCrossfade } from "@/lib/processor";
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
    frames,
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
  } = state;

  const rafRef = useRef<number | null>(null);

  // Playback loop using requestAnimationFrame for vsync-aligned timing
  useEffect(() => {
    if (!isPlaying || frames.length === 0) return;

    const frameDuration = 1000 / settings.fps;
    let startTime: number | null = null;
    let localFrame = currentFrame;

    const tick = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const targetFrame = localFrame + Math.floor(elapsed / frameDuration);

      if (targetFrame > localFrame) {
        const nextFrame = targetFrame >= frames.length
          ? loopEnabled ? targetFrame % frames.length : frames.length - 1
          : targetFrame;

        localFrame = targetFrame;
        startTime = timestamp - (elapsed % frameDuration);
        dispatch({ type: "SET_CURRENT_FRAME", payload: nextFrame });

        if (!loopEnabled && nextFrame >= frames.length - 1) {
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
  }, [isPlaying, frames.length, settings.fps, loopEnabled, dispatch]);

  const handleConvert = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    dispatch({ type: "SET_PROCESSING", payload: true });
    dispatch({ type: "SET_PROGRESS", payload: 0 });
    dispatch({ type: "SET_PLAYING", payload: false });

    try {
      const sortedChars = sortCharsByDensity(
        settings.chars,
        settings.font,
        settings.fontSize
      );

      const result = await processVideo({
        video,
        cols: settings.cols,
        sortedChars,
        fps: settings.fps,
        invertLuminance: settings.invertLuminance,
        inPoint,
        outPoint,
        onProgress: (p) => dispatch({ type: "SET_PROGRESS", payload: p }),
      });

      let finalFrames = result.frames;
      if (crossfadeFrames > 0) {
        finalFrames = applyCrossfade(finalFrames, crossfadeFrames);
      }

      dispatch({
        type: "SET_FRAMES",
        payload: { frames: finalFrames, rows: result.rows },
      });
    } finally {
      dispatch({ type: "SET_PROCESSING", payload: false });
    }
  }, [videoRef, settings, inPoint, outPoint, crossfadeFrames, dispatch]);

  const buildMeta = useCallback((): ExportMeta => {
    return {
      cols: settings.cols,
      rows: frameRows,
      fps: settings.fps,
      totalFrames: frames.length,
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
    };
  }, [settings, frameRows, frames.length, loopEnabled, crossfadeFrames]);

  const handleExportJSON = useCallback(() => {
    if (frames.length === 0) return;
    const data = buildExport(buildMeta(), frames);
    exportJSON(data, generateFilename(settings.cols, settings.fps, "json"));
  }, [frames, buildMeta, settings.cols, settings.fps]);

  const handleExportTS = useCallback(() => {
    if (frames.length === 0) return;
    const data = buildExport(buildMeta(), frames);
    exportTypeScript(data, generateFilename(settings.cols, settings.fps, "ts"));
  }, [frames, buildMeta, settings.cols, settings.fps]);

  const handleExportFrame = useCallback(() => {
    if (frames.length === 0) return;
    exportSingleFrame(buildMeta(), frames[currentFrame], `ascii-frame-${currentFrame}.json`);
  }, [frames, currentFrame, buildMeta]);

  return (
    <div className="border-t border-border bg-bg-panel px-4 py-3 flex flex-col gap-3">
      {/* Frame scrubber */}
      <div className="flex items-center gap-3">
        <button
          onClick={() =>
            dispatch({ type: "SET_PLAYING", payload: !isPlaying })
          }
          disabled={frames.length === 0}
          className="px-3 py-1 text-xs bg-accent/10 text-accent rounded border border-accent/20 hover:bg-accent/20 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPlaying ? "Pause" : "Play"}
        </button>

        <input
          type="range"
          min={0}
          max={Math.max(frames.length - 1, 0)}
          value={currentFrame}
          onChange={(e) =>
            dispatch({
              type: "SET_CURRENT_FRAME",
              payload: Number(e.target.value),
            })
          }
          disabled={frames.length === 0}
          className="flex-1"
        />

        <span className="text-xs font-mono text-text-dim w-20 text-right">
          {frames.length > 0
            ? `${currentFrame + 1}/${frames.length}`
            : "0/0"}
        </span>

        <label className="flex items-center gap-1.5 text-xs text-text-dim">
          <input
            type="checkbox"
            checked={loopEnabled}
            onChange={(e) =>
              dispatch({ type: "SET_LOOP", payload: e.target.checked })
            }
            className="accent-accent"
          />
          Loop
        </label>
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

        {/* Crossfade */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-text-dim">Crossfade</label>
          <input
            type="number"
            value={crossfadeFrames}
            min={0}
            max={15}
            onChange={(e) =>
              dispatch({
                type: "SET_CROSSFADE",
                payload: Number(e.target.value),
              })
            }
            className="w-14 bg-bg-subtle border border-border rounded px-1.5 py-1 text-xs font-mono text-text focus:outline-none focus:border-accent"
          />
        </div>

        {/* Convert button */}
        <button
          onClick={handleConvert}
          disabled={isProcessing}
          className="px-4 py-1.5 text-xs bg-accent text-bg rounded font-medium hover:bg-accent-dim disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isProcessing
            ? `Processing ${Math.round(processProgress * 100)}%`
            : "Convert"}
        </button>

        {/* Export buttons */}
        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={handleExportJSON}
            disabled={frames.length === 0}
            className="px-2 py-1 text-xs bg-bg-subtle text-text-dim rounded border border-border hover:border-border-hover disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Export JSON
          </button>
          <button
            onClick={handleExportTS}
            disabled={frames.length === 0}
            className="px-2 py-1 text-xs bg-bg-subtle text-text-dim rounded border border-border hover:border-border-hover disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Export TS
          </button>
          <button
            onClick={handleExportFrame}
            disabled={frames.length === 0}
            className="px-2 py-1 text-xs bg-bg-subtle text-text-dim rounded border border-border hover:border-border-hover disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Frame
          </button>
        </div>
      </div>
    </div>
  );
}
