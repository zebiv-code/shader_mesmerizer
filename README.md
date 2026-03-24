# Shader Mesmerizer

WebGL shader visualizer with real-time controls and sprite sheet export.

A full-screen fragment shader renders animated wave/color patterns. Adjust time scale, amplitude, frequency, and two blend colors via the control panel. Capture a 10-second animation as a sprite sheet PNG.

**Live demo:** [https://zebiv.com/shader-mesmerizer/](https://zebiv.com/shader-mesmerizer/)

## Structure

```
web/
  index.html          HTML shell
  css/main.css        Dark-theme styles
  js/
    main.js           Init, animation loop, controls, resize
    gl-utils.js       WebGL setup, shader compilation, program creation
    recorder.js       Frame capture and sprite sheet export
```

## Usage

Serve the `web/` directory with any static file server:

```sh
cd web && python3 -m http.server 8000
```

Open `http://localhost:8000` in a WebGL-capable browser.

## Controls

| Control | Range | Default |
|---------|-------|---------|
| Time Scale | 0 – 5 | 1.0 |
| Amplitude | 0 – 2 | 0.50 |
| Frequency | 0.1 – 10 | 3.0 |
| Color 1 | any | #0066ff |
| Color 2 | any | #ff3300 |

Click **Record 10s Sprite Sheet** to capture 150 frames (15 fps) into a single PNG sprite sheet and download it.
