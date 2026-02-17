"use client";

import { useState, useCallback } from "react";
import { useEditor } from "@/lib/editor-context";
import { BUILT_IN_FONTS, type FontOption } from "@/lib/types";
import { loadGoogleFont, loadCustomFont, parseFontFamily } from "@/lib/fonts";

export default function FontSelector() {
  const { state, dispatch } = useEditor();
  const [customFonts, setCustomFonts] = useState<FontOption[]>([]);
  const [fontUrl, setFontUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFontChange = useCallback(
    async (family: string) => {
      const builtIn = BUILT_IN_FONTS.find((f) => f.family === family);
      if (builtIn?.googleUrl) {
        setLoading(true);
        try {
          await loadGoogleFont(builtIn.family, builtIn.googleUrl);
        } finally {
          setLoading(false);
        }
      }
      dispatch({ type: "SET_SETTINGS", payload: { font: family } });
    },
    [dispatch]
  );

  const handleAddFont = useCallback(async () => {
    if (!fontUrl.trim()) return;

    setLoading(true);
    try {
      if (fontUrl.includes("fonts.googleapis.com")) {
        const family = parseFontFamily(fontUrl);
        if (family) {
          await loadGoogleFont(family, fontUrl);
          setCustomFonts((prev) => [
            ...prev,
            { name: family, family, googleUrl: fontUrl },
          ]);
          dispatch({ type: "SET_SETTINGS", payload: { font: family } });
        }
      } else {
        // Treat as direct font file URL
        const name = fontUrl.split("/").pop()?.replace(/\.\w+$/, "") || "Custom";
        const family = await loadCustomFont(name, fontUrl);
        setCustomFonts((prev) => [...prev, { name, family }]);
        dispatch({ type: "SET_SETTINGS", payload: { font: family } });
      }
      setFontUrl("");
    } finally {
      setLoading(false);
    }
  }, [fontUrl, dispatch]);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs text-text-dim">Font</label>
      <select
        value={state.settings.font}
        onChange={(e) => handleFontChange(e.target.value)}
        disabled={loading}
        className="bg-bg-subtle border border-border rounded px-2 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
      >
        <optgroup label="Built-in">
          <option value="monospace">System monospace</option>
          {BUILT_IN_FONTS.map((f) => (
            <option key={f.family} value={f.family}>
              {f.name}
            </option>
          ))}
        </optgroup>
        {customFonts.length > 0 && (
          <optgroup label="Custom">
            {customFonts.map((f) => (
              <option key={f.family} value={f.family}>
                {f.name}
              </option>
            ))}
          </optgroup>
        )}
      </select>
      <div className="flex gap-1">
        <input
          type="text"
          placeholder="Google Fonts URL or .woff2"
          value={fontUrl}
          onChange={(e) => setFontUrl(e.target.value)}
          className="flex-1 bg-bg-subtle border border-border rounded px-2 py-1 text-xs text-text placeholder:text-text-dim/50 focus:outline-none focus:border-accent"
        />
        <button
          onClick={handleAddFont}
          disabled={loading || !fontUrl.trim()}
          className="px-2 py-1 text-xs bg-accent/10 text-accent rounded border border-accent/20 hover:bg-accent/20 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "..." : "Add"}
        </button>
      </div>
    </div>
  );
}
