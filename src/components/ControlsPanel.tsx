"use client";

import { useMemo } from "react";
import { useEditor } from "@/lib/editor-context";
import {
  RESOLUTION_PRESETS,
  STYLE_PRESETS,
  CHAR_SET_PRESETS,
  type EditorSettings,
  type ResolutionPreset,
} from "@/lib/types";
import SliderControl from "./controls/SliderControl";
import FontSelector from "./controls/FontSelector";
import Section from "./controls/Section";

const PRESET_LABELS: Record<ResolutionPreset, string> = {
  low: "Low",
  medium: "Med",
  high: "High",
  ultra: "Ultra",
};

export default function ControlsPanel() {
  const { state, dispatch } = useEditor();
  const { settings } = state;

  const setSetting = (payload: Partial<EditorSettings>) => {
    dispatch({ type: "SET_SETTINGS", payload });
  };

  const activeResolution = (Object.entries(RESOLUTION_PRESETS) as [ResolutionPreset, number][]).find(
    ([, value]) => value === settings.cols
  )?.[0];

  // Controlled style preset: compare current settings against each preset
  const activeStylePreset = useMemo(() => {
    return STYLE_PRESETS.find((preset) =>
      Object.entries(preset.settings).every(
        ([key, val]) => settings[key as keyof EditorSettings] === val
      )
    )?.name ?? "";
  }, [settings]);

  // Controlled char preset: match current chars against presets
  const activeCharPreset = useMemo(() => {
    return CHAR_SET_PRESETS.find((p) => p.chars === settings.chars)?.name ?? "Custom";
  }, [settings.chars]);

  return (
    <div className="w-64 border-r border-border overflow-y-auto p-4 flex flex-col gap-3 bg-bg-panel">
      {/* Style presets */}
      <div className="flex flex-col gap-2">
        <label className="text-xs text-text-dim">Style preset</label>
        <select
          value={activeStylePreset}
          onChange={(e) => {
            const preset = STYLE_PRESETS.find((p) => p.name === e.target.value);
            if (preset) {
              dispatch({ type: "SET_SETTINGS", payload: preset.settings });
            }
          }}
          className="bg-bg-subtle border border-border rounded px-2 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
        >
          <option value="" disabled>
            {activeStylePreset ? "Custom" : "Choose preset..."}
          </option>
          {STYLE_PRESETS.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* === Appearance === */}
      <Section label="Appearance">
        <FontSelector />

        <SliderControl
          label="Font size"
          value={settings.fontSize}
          min={6}
          max={24}
          onChange={(v) => setSetting({ fontSize: v })}
          format={(v) => `${v}px`}
        />

        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-dim">Colour</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={settings.colour}
              onChange={(e) => setSetting({ colour: e.target.value })}
              className="w-8 h-8 p-0.5"
            />
            <span className="text-xs font-mono text-text">{settings.colour}</span>
          </div>
        </div>

        <div className={`flex flex-col gap-1 ${settings.transparentBg ? "opacity-40 pointer-events-none" : ""}`}>
          <label className="text-xs text-text-dim">Background</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={settings.background}
              onChange={(e) => setSetting({ background: e.target.value })}
              className="w-8 h-8 p-0.5"
            />
            <span className="text-xs font-mono text-text">
              {settings.background}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-text-dim">Transparent background</span>
          <button
            onClick={() => setSetting({ transparentBg: !settings.transparentBg })}
            className={`w-10 h-5 rounded-full relative transition-colors ${
              settings.transparentBg ? "bg-accent" : "bg-border"
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-text transition-transform ${
                settings.transparentBg ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </Section>

      {/* === Opacity === */}
      <Section label="Opacity">
        <SliderControl
          label="Base alpha"
          value={settings.baseAlpha}
          min={0.01}
          max={0.5}
          step={0.01}
          onChange={(v) => setSetting({ baseAlpha: v })}
          format={(v) => v.toFixed(2)}
        />

        <SliderControl
          label="Peak alpha"
          value={settings.peakAlpha}
          min={0.05}
          max={1.0}
          step={0.01}
          onChange={(v) => setSetting({ peakAlpha: v })}
          format={(v) => v.toFixed(2)}
        />

        <SliderControl
          label="Clip threshold"
          value={settings.clipThreshold}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => setSetting({ clipThreshold: v })}
          format={(v) => `${Math.round(v * 100)}%`}
        />
      </Section>

      {/* === Image === */}
      <Section label="Image">
        <SliderControl
          label="Gamma"
          value={settings.gamma}
          min={0.5}
          max={5.0}
          step={0.1}
          onChange={(v) => setSetting({ gamma: v })}
          format={(v) => v.toFixed(1)}
        />

        <SliderControl
          label="Contrast"
          value={settings.contrast}
          min={0.0}
          max={3.0}
          step={0.05}
          onChange={(v) => setSetting({ contrast: v })}
          format={(v) => v.toFixed(2)}
        />

        <SliderControl
          label="Brightness"
          value={settings.brightness}
          min={-1.0}
          max={1.0}
          step={0.05}
          onChange={(v) => setSetting({ brightness: v })}
          format={(v) => (v >= 0 ? `+${v.toFixed(2)}` : v.toFixed(2))}
        />
      </Section>

      {/* === Conversion === */}
      <Section label="Conversion">
        {/* Character set preset */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-dim">Character preset</label>
          <select
            value={activeCharPreset}
            onChange={(e) => {
              const preset = CHAR_SET_PRESETS.find((p) => p.name === e.target.value);
              if (preset) {
                setSetting({ chars: preset.chars });
              }
            }}
            className="bg-bg-subtle border border-border rounded px-2 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
          >
            {activeCharPreset === "Custom" && (
              <option value="Custom" disabled>
                Custom
              </option>
            )}
            {CHAR_SET_PRESETS.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Character set */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-dim">Characters</label>
          <input
            type="text"
            value={settings.chars}
            onChange={(e) => setSetting({ chars: e.target.value })}
            className="bg-bg-subtle border border-border rounded px-2 py-1.5 text-xs font-mono text-text focus:outline-none focus:border-accent"
          />
        </div>

        {/* Resolution presets */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-text-dim">Resolution</label>
          <div className="grid grid-cols-4 gap-1">
            {(Object.entries(RESOLUTION_PRESETS) as [ResolutionPreset, number][]).map(
              ([key, value]) => (
                <button
                  key={key}
                  onClick={() => setSetting({ cols: value })}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                    activeResolution === key
                      ? "bg-accent/15 border-accent/40 text-accent"
                      : "bg-bg-subtle border-border text-text-dim hover:border-border-hover"
                  }`}
                >
                  {PRESET_LABELS[key]}
                </button>
              )
            )}
          </div>
        </div>

        <SliderControl
          label="Grid density"
          value={settings.cols}
          min={40}
          max={200}
          onChange={(v) => setSetting({ cols: v })}
          format={(v) => `${v} cols`}
        />

        <div className="flex items-center justify-between">
          <span className="text-xs text-text-dim">Invert luminance</span>
          <button
            onClick={() => setSetting({ invertLuminance: !settings.invertLuminance })}
            className={`w-10 h-5 rounded-full relative transition-colors ${
              settings.invertLuminance ? "bg-accent" : "bg-border"
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-text transition-transform ${
                settings.invertLuminance ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </Section>

      {/* === Playback === */}
      <Section label="Playback">
        <SliderControl
          label="FPS"
          value={settings.fps}
          min={1}
          max={30}
          onChange={(v) => setSetting({ fps: v })}
        />

        <div className="flex items-center justify-between">
          <span className="text-xs text-text-dim">Loop</span>
          <button
            onClick={() => dispatch({ type: "SET_LOOP", payload: !state.loopEnabled })}
            className={`w-10 h-5 rounded-full relative transition-colors ${
              state.loopEnabled ? "bg-accent" : "bg-border"
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-text transition-transform ${
                state.loopEnabled ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-dim">Crossfade frames</label>
          <input
            type="number"
            value={state.crossfadeFrames}
            min={0}
            max={15}
            onChange={(e) =>
              dispatch({
                type: "SET_CROSSFADE",
                payload: Number(e.target.value),
              })
            }
            className="w-full bg-bg-subtle border border-border rounded px-2 py-1.5 text-xs font-mono text-text focus:outline-none focus:border-accent"
          />
        </div>
      </Section>
    </div>
  );
}
