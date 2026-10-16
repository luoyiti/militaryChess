# River Plate performance checks

Use the installed **hardware-accelerated Chrome**, with a 1440×900 CSS viewport and DPR 2. The runners launch a separate temporary profile and do not change the user's Chrome profile. `report.json` records the actual GPU renderer; a software renderer invalidates a hardware performance comparison.

```sh
npm run build
npm run preview
# In another terminal:
node tools/perf/river.mjs --out .work/river-perf/after --seconds 30 --cold 5 --soak
node tools/perf/acceptance.mjs --out .work/river-perf/acceptance
node tools/perf/trace.mjs --mode 2d
node tools/perf/trace.mjs --mode 3d
```

`river.mjs` checkpoints its JSON after each sample. It measures five cold contexts (both intro and direct entry), historical scenes, 1×/8× playback, sustained mouse interaction at six zoom levels, 3D orbiting, twenty mode switches, and optionally ten minutes of playback. Heap samples in the soak run are taken after garbage collection; compare retained heap and WebGL geometry/texture counts rather than transient allocations. Do not run builds, other browser tests, video playback, or CPU-heavy tests at the same time as performance sampling.

`--seconds 5 --cold 1` is a smoke run, not acceptance. `--only battle` limits frame samples to matching names; cold starts, scene setup/screenshots and switches still run. Use `--base http://127.0.0.1:5180` to measure development separately. Production preview is the release gate.

`trace.mjs` captures a focused Chrome timeline for 8× battle playback, including script, layout, prepaint and paint events. Load its `.trace.json` in Chrome Performance for investigation. Its instrumentation overhead is excluded from the performance gate; overlapping trace categories must not be added together as total frame time, and CPU paint events do not measure GPU presentation latency.

The browser acceptance runner checks hidden 2D work, time/selection restoration, frame coalescing, reverse seeks, rapid origin changes, mobile/high-resolution layouts, and Britain/Crete/Norway mode-switch regressions. It blocks external requests while retaining the local server: this validates **local use without internet**, not a service-worker-backed offline website. Automated Chrome may keep `document.hidden` false in minimized windows, so the visibility handler test explicitly injects the visibility input and records that fact in its output.

Visual comparisons use fresh navigation, matching date/camera and seeded random numbers. 3D water and ship motion still use wall time; a screenshot diff alone cannot certify their fidelity. Inspect the images as well as the numeric diff. Keep pre-existing screenshots and baseline directories intact.

Diagnostics are additive under `window.__app`: `resetScene(iso)`, `setCamera(zoom, lon, lat)` (current mode), and `stats().performance` with map readiness and 2D update/draw counts. Naval sandbox stats include frame count, readiness, loaded-model completion and WebGL memory. Simulation data and public campaign schemas are unchanged.
