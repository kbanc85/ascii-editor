"use client";

import { useEditor } from "@/lib/editor-context";
import DropZone from "./DropZone";
import PreviewCanvas from "./PreviewCanvas";
import ControlsPanel from "./ControlsPanel";
import Timeline from "./Timeline";

export default function Editor() {
  const { state, dispatch, videoRef } = useEditor();
  const { videoUrl, videoWidth, videoHeight } = state;

  if (!videoUrl) {
    return (
      <main className="h-screen flex items-center justify-center p-8">
        <div className="max-w-xl w-full h-64">
          <DropZone />
        </div>
      </main>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-bg-panel">
        <h1 className="text-sm font-medium text-text">ASCII Video Editor</h1>
        <button
          onClick={() => dispatch({ type: "CLEAR_VIDEO" })}
          className="px-3 py-1 text-xs text-text-dim border border-border rounded hover:border-border-hover hover:text-text"
        >
          New video
        </button>
      </header>

      {/* Three-panel layout */}
      <div className="flex flex-1 min-h-0">
        {/* Left: Controls */}
        <ControlsPanel />

        {/* Center: Preview */}
        <PreviewCanvas />

        {/* Right: Source video */}
        <aside className="w-72 border-l border-border bg-bg-panel p-4 flex flex-col gap-3">
          <video
            src={videoUrl}
            controls
            muted
            className="w-full rounded"
          />
          <p className="text-xs text-text-dim">
            {videoWidth} x {videoHeight}
          </p>
        </aside>
      </div>

      {/* Footer: Timeline */}
      <Timeline />

      {/* Hidden video element for processing */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="hidden"
        preload="auto"
        muted
      />
    </div>
  );
}
