"use client";

import { useState, useRef, useEffect } from "react";

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
}

export default function SliderControl({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
}: SliderControlProps) {
  const display = format ? format(value) : String(value);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    const parsed = parseFloat(editValue);
    if (!isNaN(parsed)) {
      onChange(Math.min(max, Math.max(min, parsed)));
    }
    setEditing(false);
  };

  const cancel = () => {
    setEditing(false);
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span className="text-xs text-text-dim">{label}</span>
        {editing ? (
          <input
            ref={inputRef}
            type="number"
            value={editValue}
            min={min}
            max={max}
            step={step}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") cancel();
            }}
            className="w-16 text-xs font-mono text-text text-right bg-bg-subtle border border-accent/40 rounded px-1 py-0.5 focus:outline-none"
          />
        ) : (
          <span
            onClick={() => {
              setEditValue(String(value));
              setEditing(true);
            }}
            className="text-xs font-mono text-text cursor-text hover:text-accent transition-colors"
            title="Click to edit"
          >
            {display}
          </span>
        )}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-border [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent"
      />
    </div>
  );
}
