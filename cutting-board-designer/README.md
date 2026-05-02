# End Grain Cutting Board Designer

A single-page tool for designing end-grain cutting boards. Lay out wood slabs, set the
glue-up dimensions, and preview both the initial glue-up and the final end-grain
checkerboard pattern. Includes a per-species material calculator and a print-friendly
layout view.

The whole app is one self-contained React component
(`src/CuttingBoardDesigner.jsx`) that takes no required props and stores all state
with `useState`. No backend.

## Run locally

```
npm install
npm run dev
```

Then open the URL Vite prints (typically `http://localhost:5173`).

## Build

```
npm run build
```

Produces a static site in `dist/` that can be served from any static host.

## Tech

- React 18
- Vite
- Tailwind CSS (dark theme)
- Native HTML5 drag-and-drop, native `<input type="color">`, `window.print()`
