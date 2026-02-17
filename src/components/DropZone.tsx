"use client";

import { useRef, useState, useCallback, type DragEvent } from "react";
import { useEditor } from "@/lib/editor-context";

export default function DropZone() {
  const { dispatch } = useEditor();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.preload = "metadata";

      video.onloadedmetadata = () => {
        dispatch({
          type: "SET_VIDEO",
          payload: {
            file,
            url,
            duration: video.duration,
            width: video.videoWidth,
            height: video.videoHeight,
          },
        });
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
      };

      video.src = url;
    },
    [dispatch]
  );

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("video/")) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      className={`rounded-lg border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-3 cursor-pointer ${
        dragOver
          ? "border-accent bg-accent/5"
          : "border-border hover:border-border-hover"
      }`}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        onChange={onInputChange}
        className="hidden"
      />
      <p className="text-text-dim text-sm">
        Drop a video file here, or{" "}
        <span className="text-accent underline underline-offset-2">browse</span>
      </p>
      <p className="text-text-dim/60 text-xs">MP4, WebM. Under 30 seconds.</p>
    </div>
  );
}
