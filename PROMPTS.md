# Video prompts for the ASCII editor

These prompts work with AI video generators (Runway, Kling, Minimax, Pika, etc.) to create looping clips that render well as ASCII art.

## Why these work

The editor maps pixel brightness to character density at low resolution (80-200 columns). That means:

- **Bold silhouettes** read better than fine detail
- **High contrast** (bright subject, dark background) gives the widest character range
- **Slow, smooth motion** stays legible at low frame rates
- **Simple compositions** with one focal point avoid noise
- **Seamless loops** let the animation run forever with the editor's loop/crossfade features

## Prompts

### Smoke plume

> Slow-motion wisp of white smoke rising against a pure black background, soft volumetric lighting from the left, gentle curling motion, seamless loop, cinematic, high contrast, 4 seconds

Works well because smoke has smooth tonal gradients from white core to transparent edges. The alpha ramp in the editor maps perfectly to smoke density.

### Ocean waves (aerial)

> Top-down aerial view of dark ocean waves rolling in slow motion, white foam patterns on deep black water, minimal camera movement, seamless loop, high contrast monochrome, 4 seconds

The repeating wave pattern creates natural rhythm in ASCII. Foam reads as dense characters, deep water as sparse.

### Rotating geometry

> Single white wireframe icosahedron slowly rotating against a solid black background, clean edges, no textures, soft ambient glow, seamless 360-degree loop, 4 seconds

Geometric shapes with clean edges produce crisp ASCII outlines. The rotation creates constantly shifting character patterns.

### Candlelight

> Extreme close-up of a single candle flame flickering gently in darkness, warm orange glow against pure black, soft focus, slow motion, seamless loop, 4 seconds

Fire has the right tonal range: bright core, mid-tone glow, dark surroundings. The flicker creates subtle animation that looks alive in ASCII.

### Rain on glass

> Close-up of rain droplets slowly rolling down a dark window pane at night, soft bokeh city lights blurred in the background, shallow depth of field, seamless loop, moody, 4 seconds

Bokeh circles become interesting character clusters. The slow droplet motion gives the animation a meditative quality.

### Abstract particles

> Swarm of small bright white particles drifting slowly through empty black space, some particles closer and larger, others tiny and distant, soft glow, no background, seamless loop, 4 seconds

Particles at different sizes test the full character density range. The randomness prevents visible loop seams.

## Tips

- **Duration:** 3-4 seconds is the sweet spot. Longer clips increase conversion time without adding much visual variety.
- **Resolution:** Source resolution doesn't matter much since everything gets downsampled. 720p is fine.
- **Colour:** The editor converts to luminance, so the source colours don't affect the output. But high-contrast monochrome sources give the cleanest results.
- **"Seamless loop" in the prompt:** Most generators attempt to honour this. If the loop isn't perfect, use the editor's crossfade feature (set crossfade frames to 5-15% of total frames).
- **Dark backgrounds:** Match the editor's default dark theme. If you use a light background, toggle "Invert luminance" in the editor.
