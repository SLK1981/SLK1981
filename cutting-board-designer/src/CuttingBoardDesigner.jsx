import React, { useState, useMemo, useRef } from 'react';

const BUILT_IN_SPECIES = {
  hardMaple:    { name: 'Hard Maple',         color: '#f0e3c2', pattern: null },
  cherry:       { name: 'Cherry',             color: '#a55a3a', pattern: null },
  walnut:       { name: 'Walnut',             color: '#3d2a1e', pattern: null },
  purpleheart:  { name: 'Purpleheart',        color: '#4a2c6a', pattern: null },
  padauk:       { name: 'Padauk',             color: '#c8451c', pattern: null },
  yellowheart:  { name: 'Canary/Yellowheart', color: '#e8c937', pattern: null },
  bloodwood:    { name: 'Bloodwood',          color: '#7a1818', pattern: null },
  ebony:        { name: 'Ebony',              color: '#15110d', pattern: null },
  osageOrange:  { name: 'Osage Orange',       color: '#caa12a', pattern: null },
  bocote:       { name: 'Bocote',             color: '#a87a3c', pattern: 'bocote' },
  teak:         { name: 'Teak',               color: '#a8814a', pattern: null },
  wenge:        { name: 'Wenge',              color: '#241812', pattern: null },
  zebrawood:    { name: 'Zebrawood',          color: '#c6a06b', pattern: 'zebrawood' },
};

const PatternDefs = () => (
  <defs>
    <pattern id="bocote-pattern" patternUnits="userSpaceOnUse" width="0.5" height="1.6">
      <rect width="0.5" height="1.6" fill="#a87a3c" />
      <path d="M0 0.35 Q 0.25 0.15 0.5 0.35" stroke="#2d1a08" strokeWidth="0.07" fill="none" />
      <path d="M0 1.05 Q 0.25 0.9 0.5 1.05" stroke="#4a2c10" strokeWidth="0.09" fill="none" />
      <path d="M0 1.45 Q 0.25 1.3 0.5 1.45" stroke="#3a2208" strokeWidth="0.05" fill="none" />
    </pattern>
    <pattern id="zebrawood-pattern" patternUnits="userSpaceOnUse" width="0.5" height="0.45">
      <rect width="0.5" height="0.45" fill="#c6a06b" />
      <rect y="0.04" width="0.5" height="0.08" fill="#3a2412" />
      <rect y="0.26" width="0.5" height="0.06" fill="#4d2f18" />
    </pattern>
  </defs>
);

const fillForSpecies = (sp) => {
  if (!sp) return '#666';
  if (sp.pattern === 'bocote') return 'url(#bocote-pattern)';
  if (sp.pattern === 'zebrawood') return 'url(#zebrawood-pattern)';
  return sp.color;
};

let __nextId = 1;
const newId = () => `s${__nextId++}`;

const DEFAULT_SLABS = [
  { id: newId(), speciesKey: 'walnut',    label: '', width: 1.5, quantity: 4 },
  { id: newId(), speciesKey: 'hardMaple', label: '', width: 1.5, quantity: 4 },
  { id: newId(), speciesKey: 'cherry',    label: '', width: 1.5, quantity: 4 },
];

const fmt = (n, d = 2) =>
  Number.isFinite(n) ? n.toFixed(d).replace(/\.?0+$/, '') : '0';

export default function CuttingBoardDesigner() {
  const [slabs, setSlabs] = useState(DEFAULT_SLABS);
  const [customSpecies, setCustomSpecies] = useState({});
  const [boardLength, setBoardLength] = useState(24);
  const [boardThickness, setBoardThickness] = useState(2);
  const [stripCutWidth, setStripCutWidth] = useState(1.5);
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [newCustomName, setNewCustomName] = useState('');
  const [newCustomColor, setNewCustomColor] = useState('#b08040');
  const customKeyCounter = useRef(1);

  const allSpecies = useMemo(
    () => ({ ...BUILT_IN_SPECIES, ...customSpecies }),
    [customSpecies]
  );

  const expandedSlabs = useMemo(() => {
    const out = [];
    slabs.forEach((s) => {
      const q = Math.max(0, Math.floor(s.quantity));
      for (let i = 0; i < q; i++) {
        out.push({ slab: s, instanceIndex: i });
      }
    });
    return out;
  }, [slabs]);

  const totalGlueUpWidth = useMemo(
    () =>
      slabs.reduce(
        (acc, s) => acc + Math.max(0, s.width) * Math.max(0, Math.floor(s.quantity)),
        0
      ),
    [slabs]
  );

  const numStrips =
    stripCutWidth > 0 && boardLength > 0
      ? Math.floor(boardLength / stripCutWidth)
      : 0;

  const finalBoard = {
    width: totalGlueUpWidth,
    length: numStrips * boardThickness,
    thickness: stripCutWidth,
  };

  const materialBySpecies = useMemo(() => {
    const map = new Map();
    slabs.forEach((s) => {
      const sp = allSpecies[s.speciesKey];
      if (!sp) return;
      const w = Math.max(0, s.width);
      const q = Math.max(0, Math.floor(s.quantity));
      const existing = map.get(s.speciesKey) || {
        key: s.speciesKey,
        name: sp.name,
        color: sp.color,
        pattern: sp.pattern,
        slabCount: 0,
        linearInches: 0,
        boardFeet: 0,
      };
      existing.slabCount += q;
      existing.linearInches += boardLength * q;
      existing.boardFeet += (w * boardLength * boardThickness * q) / 144;
      map.set(s.speciesKey, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.boardFeet - a.boardFeet);
  }, [slabs, allSpecies, boardLength, boardThickness]);

  const totalBoardFeet = materialBySpecies.reduce((acc, m) => acc + m.boardFeet, 0);

  const addSlab = () =>
    setSlabs((prev) => [
      ...prev,
      { id: newId(), speciesKey: 'walnut', label: '', width: 1.5, quantity: 1 },
    ]);

  const removeSlab = (id) => setSlabs((prev) => prev.filter((s) => s.id !== id));

  const updateSlab = (id, patch) =>
    setSlabs((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const handleDragStart = (id) => setDraggedId(id);
  const handleDragOver = (e, id) => {
    e.preventDefault();
    if (id !== dragOverId) setDragOverId(id);
  };
  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };
  const handleDrop = (e, targetId) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      handleDragEnd();
      return;
    }
    setSlabs((prev) => {
      const next = [...prev];
      const fromIdx = next.findIndex((s) => s.id === draggedId);
      const toIdx = next.findIndex((s) => s.id === targetId);
      if (fromIdx < 0 || toIdx < 0) return prev;
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
    handleDragEnd();
  };

  const addCustomSpecies = () => {
    const name = newCustomName.trim();
    if (!name) return;
    const key = `custom_${customKeyCounter.current++}`;
    setCustomSpecies((prev) => ({
      ...prev,
      [key]: { name, color: newCustomColor, pattern: null },
    }));
    setNewCustomName('');
    setSlabs((prev) =>
      prev.length === 0
        ? [{ id: newId(), speciesKey: key, label: '', width: 1.5, quantity: 1 }]
        : prev
    );
  };

  const removeCustomSpecies = (key) => {
    setCustomSpecies((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setSlabs((prev) =>
      prev.map((s) =>
        s.speciesKey === key ? { ...s, speciesKey: 'walnut' } : s
      )
    );
  };

  const handlePrint = () => window.print();

  // ----- Glue-up preview SVG -----
  const glueUpAspectW = totalGlueUpWidth > 0 ? totalGlueUpWidth : 1;
  const glueUpAspectL = boardLength > 0 ? boardLength : 1;

  const glueUpRects = useMemo(() => {
    const out = [];
    let x = 0;
    expandedSlabs.forEach(({ slab, instanceIndex }, idx) => {
      const sp = allSpecies[slab.speciesKey];
      out.push(
        <rect
          key={`gu-${slab.id}-${instanceIndex}`}
          x={x}
          y={0}
          width={slab.width}
          height={glueUpAspectL}
          fill={fillForSpecies(sp)}
          stroke="#0a0a0a"
          strokeWidth={Math.min(0.04, glueUpAspectW * 0.005)}
        />
      );
      x += slab.width;
    });
    return out;
  }, [expandedSlabs, allSpecies, glueUpAspectL, glueUpAspectW]);

  const cutLines = useMemo(() => {
    if (stripCutWidth <= 0) return [];
    const lines = [];
    for (let y = stripCutWidth; y < boardLength + 0.0001; y += stripCutWidth) {
      lines.push(
        <line
          key={`cut-${y}`}
          x1={0}
          x2={glueUpAspectW}
          y1={y}
          y2={y}
          stroke="#fafafa"
          strokeWidth={0.03}
          strokeDasharray="0.25 0.15"
          opacity="0.55"
        />
      );
    }
    return lines;
  }, [stripCutWidth, boardLength, glueUpAspectW]);

  // ----- End grain preview SVG -----
  const endGrainW = totalGlueUpWidth > 0 ? totalGlueUpWidth : 1;
  const endGrainL = numStrips * boardThickness > 0 ? numStrips * boardThickness : 1;

  const endGrainCells = useMemo(() => {
    if (numStrips <= 0 || boardThickness <= 0) return [];
    const out = [];
    const order = expandedSlabs;
    for (let row = 0; row < numStrips; row++) {
      const rowOrder = row % 2 === 0 ? order : [...order].reverse();
      let x = 0;
      const y = row * boardThickness;
      rowOrder.forEach(({ slab, instanceIndex }, idx) => {
        const sp = allSpecies[slab.speciesKey];
        out.push(
          <rect
            key={`eg-${row}-${slab.id}-${instanceIndex}-${idx}`}
            x={x}
            y={y}
            width={slab.width}
            height={boardThickness}
            fill={fillForSpecies(sp)}
            stroke="#0a0a0a"
            strokeWidth={Math.min(0.04, endGrainW * 0.005)}
          />
        );
        x += slab.width;
      });
    }
    return out;
  }, [expandedSlabs, allSpecies, numStrips, boardThickness, endGrainW]);

  // ----- UI -----
  const speciesOptions = useMemo(
    () =>
      Object.entries(allSpecies).map(([key, sp]) => (
        <option key={key} value={key}>
          {sp.name}
        </option>
      )),
    [allSpecies]
  );

  const SwatchChip = ({ sp, size = 16 }) => (
    <span
      className="inline-block rounded-sm border border-neutral-700"
      style={{
        width: size,
        height: size,
        background: sp?.pattern
          ? sp.pattern === 'bocote'
            ? 'repeating-linear-gradient(180deg,#a87a3c 0 4px,#3a2208 4px 5px)'
            : 'repeating-linear-gradient(180deg,#c6a06b 0 3px,#3a2412 3px 4px)'
          : sp?.color || '#666',
      }}
    />
  );

  return (
    <div className="min-h-full bg-neutral-950 text-neutral-100 print-page">
      {/* Top toolbar */}
      <header className="border-b border-neutral-800 bg-neutral-900/80 backdrop-blur sticky top-0 z-10 no-print">
        <div className="px-4 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400">
              <rect x="3" y="6" width="18" height="12" rx="1.5" />
              <line x1="9" y1="6" x2="9" y2="18" />
              <line x1="15" y1="6" x2="15" y2="18" />
            </svg>
            <h1 className="text-base font-semibold tracking-tight">
              End Grain Cutting Board Designer
            </h1>
          </div>
          <div className="ml-auto flex items-center gap-2 text-sm">
            <span className="text-neutral-500">
              {slabs.length} slab{slabs.length === 1 ? '' : 's'} · {expandedSlabs.length}{' '}
              piece{expandedSlabs.length === 1 ? '' : 's'} · {numStrips} strip{numStrips === 1 ? '' : 's'}
            </span>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-sm rounded-md bg-amber-500 text-neutral-950 font-medium hover:bg-amber-400 active:bg-amber-600 transition-colors"
            >
              Print Layout
            </button>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 xl:grid-cols-12 gap-4 p-4">
        {/* ---------- Slab Editor ---------- */}
        <section className="xl:col-span-4 2xl:col-span-3 space-y-4 no-print">
          <Panel
            title="Slabs"
            action={
              <button
                onClick={addSlab}
                className="text-xs px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 border border-neutral-700"
              >
                + Add Slab
              </button>
            }
          >
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-1 px-1 text-[10px] uppercase tracking-wider text-neutral-500">
                <div className="col-span-1"></div>
                <div className="col-span-4">Species</div>
                <div className="col-span-3">Label</div>
                <div className="col-span-2">Width&nbsp;in</div>
                <div className="col-span-1">Qty</div>
                <div className="col-span-1"></div>
              </div>
              {slabs.length === 0 && (
                <div className="text-sm text-neutral-500 py-6 text-center border border-dashed border-neutral-800 rounded">
                  No slabs yet. Click "+ Add Slab" to begin.
                </div>
              )}
              {slabs.map((s) => {
                const sp = allSpecies[s.speciesKey];
                const isDragging = s.id === draggedId;
                const isTarget = s.id === dragOverId && draggedId && draggedId !== s.id;
                return (
                  <div
                    key={s.id}
                    draggable
                    onDragStart={() => handleDragStart(s.id)}
                    onDragOver={(e) => handleDragOver(e, s.id)}
                    onDrop={(e) => handleDrop(e, s.id)}
                    onDragEnd={handleDragEnd}
                    className={[
                      'grid grid-cols-12 gap-1 items-center rounded px-1 py-1 transition-colors',
                      isDragging ? 'opacity-40' : '',
                      isTarget ? 'bg-amber-500/10 ring-1 ring-amber-500/50' : 'hover:bg-neutral-800/40',
                    ].join(' ')}
                  >
                    <div
                      className="col-span-1 flex items-center justify-center text-neutral-500 cursor-grab active:cursor-grabbing select-none"
                      title="Drag to reorder"
                    >
                      <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor">
                        <circle cx="3" cy="3" r="1.2" />
                        <circle cx="9" cy="3" r="1.2" />
                        <circle cx="3" cy="7" r="1.2" />
                        <circle cx="9" cy="7" r="1.2" />
                        <circle cx="3" cy="11" r="1.2" />
                        <circle cx="9" cy="11" r="1.2" />
                      </svg>
                    </div>
                    <div className="col-span-4 flex items-center gap-1.5">
                      <SwatchChip sp={sp} />
                      <select
                        value={s.speciesKey}
                        onChange={(e) => updateSlab(s.id, { speciesKey: e.target.value })}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-amber-500"
                      >
                        {speciesOptions}
                      </select>
                    </div>
                    <input
                      type="text"
                      value={s.label}
                      placeholder="optional"
                      onChange={(e) => updateSlab(s.id, { label: e.target.value })}
                      className="col-span-3 bg-neutral-900 border border-neutral-700 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-amber-500"
                    />
                    <input
                      type="number"
                      step="0.0625"
                      min="0"
                      value={s.width}
                      onChange={(e) =>
                        updateSlab(s.id, { width: parseFloat(e.target.value) || 0 })
                      }
                      className="col-span-2 bg-neutral-900 border border-neutral-700 rounded px-1.5 py-1 text-xs text-right focus:outline-none focus:border-amber-500"
                    />
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={s.quantity}
                      onChange={(e) =>
                        updateSlab(s.id, { quantity: parseInt(e.target.value, 10) || 0 })
                      }
                      className="col-span-1 bg-neutral-900 border border-neutral-700 rounded px-1.5 py-1 text-xs text-right focus:outline-none focus:border-amber-500"
                    />
                    <button
                      onClick={() => removeSlab(s.id)}
                      title="Remove slab"
                      className="col-span-1 text-neutral-500 hover:text-red-400 text-sm leading-none"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel title="Custom Species">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newCustomName}
                  onChange={(e) => setNewCustomName(e.target.value)}
                  placeholder="e.g. Sapele"
                  className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-amber-500"
                />
                <input
                  type="color"
                  value={newCustomColor}
                  onChange={(e) => setNewCustomColor(e.target.value)}
                  className="h-7 w-9 bg-neutral-900 border border-neutral-700 rounded cursor-pointer"
                />
                <button
                  onClick={addCustomSpecies}
                  className="text-xs px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 border border-neutral-700"
                >
                  Add
                </button>
              </div>
              {Object.entries(customSpecies).length === 0 ? (
                <div className="text-[11px] text-neutral-500">
                  Add your own species with a color picker if it isn't in the built-in list.
                </div>
              ) : (
                <ul className="space-y-1">
                  {Object.entries(customSpecies).map(([key, sp]) => (
                    <li
                      key={key}
                      className="flex items-center gap-2 text-xs bg-neutral-900/60 rounded px-2 py-1 border border-neutral-800"
                    >
                      <span
                        className="inline-block w-4 h-4 rounded-sm border border-neutral-700"
                        style={{ background: sp.color }}
                      />
                      <span className="flex-1 truncate">{sp.name}</span>
                      <span className="text-neutral-500 font-mono">{sp.color}</span>
                      <button
                        onClick={() => removeCustomSpecies(key)}
                        className="text-neutral-500 hover:text-red-400"
                        title="Delete custom species"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Panel>
        </section>

        {/* ---------- Board Settings + Material Calculator ---------- */}
        <section className="xl:col-span-3 2xl:col-span-3 space-y-4">
          <div className="no-print">
            <Panel title="Board Settings">
              <div className="space-y-2.5">
                <NumField
                  label="Board length (in)"
                  hint="Length of the initial glue-up before crosscutting."
                  value={boardLength}
                  step={0.25}
                  min={0}
                  onChange={setBoardLength}
                />
                <NumField
                  label="Board thickness (in)"
                  hint="Thickness of the initial glue-up — becomes the strip height in the final board."
                  value={boardThickness}
                  step={0.0625}
                  min={0}
                  onChange={setBoardThickness}
                />
                <NumField
                  label="Strip cut width (in)"
                  hint="How thick each strip is cut from the glue-up — becomes the final board thickness."
                  value={stripCutWidth}
                  step={0.0625}
                  min={0}
                  onChange={setStripCutWidth}
                />
              </div>
            </Panel>
          </div>

          <Panel title="Material Calculator" className="print-card">
            <div className="space-y-3">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wider text-neutral-500 print-text">
                    <th className="font-medium pb-1">Species</th>
                    <th className="font-medium pb-1 text-right">Slabs</th>
                    <th className="font-medium pb-1 text-right">Linear in</th>
                    <th className="font-medium pb-1 text-right">Bd ft</th>
                  </tr>
                </thead>
                <tbody>
                  {materialBySpecies.length === 0 && (
                    <tr>
                      <td colSpan="4" className="py-4 text-center text-neutral-500">
                        Add slabs to see materials.
                      </td>
                    </tr>
                  )}
                  {materialBySpecies.map((m) => (
                    <tr key={m.key} className="border-t border-neutral-800 print-text">
                      <td className="py-1.5">
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="inline-block w-3 h-3 rounded-sm border border-neutral-700"
                            style={{ background: m.color }}
                          />
                          {m.name}
                        </span>
                      </td>
                      <td className="py-1.5 text-right tabular-nums">{m.slabCount}</td>
                      <td className="py-1.5 text-right tabular-nums">{fmt(m.linearInches, 1)}</td>
                      <td className="py-1.5 text-right tabular-nums">{fmt(m.boardFeet, 2)}</td>
                    </tr>
                  ))}
                </tbody>
                {materialBySpecies.length > 0 && (
                  <tfoot>
                    <tr className="border-t border-neutral-700 font-medium print-text">
                      <td className="pt-2">Total</td>
                      <td className="pt-2 text-right tabular-nums">
                        {materialBySpecies.reduce((a, m) => a + m.slabCount, 0)}
                      </td>
                      <td className="pt-2 text-right tabular-nums">
                        {fmt(materialBySpecies.reduce((a, m) => a + m.linearInches, 0), 1)}
                      </td>
                      <td className="pt-2 text-right tabular-nums">{fmt(totalBoardFeet, 2)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>

              <div className="border-t border-neutral-800 pt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs print-text">
                <div className="text-neutral-500">Final width</div>
                <div className="text-right tabular-nums">{fmt(finalBoard.width, 2)} in</div>

                <div className="text-neutral-500">Final length</div>
                <div className="text-right tabular-nums">{fmt(finalBoard.length, 2)} in</div>

                <div className="text-neutral-500">Final thickness</div>
                <div className="text-right tabular-nums">{fmt(finalBoard.thickness, 2)} in</div>

                <div className="text-neutral-500">Strips produced</div>
                <div className="text-right tabular-nums">{numStrips}</div>

                <div className="text-neutral-500">End-grain pieces</div>
                <div className="text-right tabular-nums">
                  {numStrips * expandedSlabs.length}
                </div>
              </div>
            </div>
          </Panel>
        </section>

        {/* ---------- Visual Previews ---------- */}
        <section className="xl:col-span-5 2xl:col-span-6 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel
              title="Glue-Up (top view)"
              subtitle={`${fmt(totalGlueUpWidth, 2)} in wide × ${fmt(boardLength, 2)} in long`}
              className="print-card"
            >
              <PreviewFrame>
                {totalGlueUpWidth > 0 && boardLength > 0 ? (
                  <svg
                    viewBox={`0 0 ${glueUpAspectW} ${glueUpAspectL}`}
                    preserveAspectRatio="xMidYMid meet"
                    className="w-full h-full max-h-[60vh]"
                  >
                    <PatternDefs />
                    <g>{glueUpRects}</g>
                    <g>{cutLines}</g>
                  </svg>
                ) : (
                  <EmptyHint>Add slabs and a board length to see the glue-up.</EmptyHint>
                )}
              </PreviewFrame>
              <DimRow
                items={[
                  ['Slabs', expandedSlabs.length],
                  ['Width', `${fmt(totalGlueUpWidth, 2)} in`],
                  ['Length', `${fmt(boardLength, 2)} in`],
                  ['Thickness', `${fmt(boardThickness, 2)} in`],
                ]}
              />
            </Panel>

            <Panel
              title="End Grain Result"
              subtitle={`${fmt(finalBoard.width, 2)} × ${fmt(finalBoard.length, 2)} × ${fmt(finalBoard.thickness, 2)} in`}
              className="print-card"
            >
              <PreviewFrame>
                {endGrainCells.length > 0 ? (
                  <svg
                    viewBox={`0 0 ${endGrainW} ${endGrainL}`}
                    preserveAspectRatio="xMidYMid meet"
                    className="w-full h-full max-h-[60vh]"
                  >
                    <PatternDefs />
                    <g>{endGrainCells}</g>
                  </svg>
                ) : (
                  <EmptyHint>
                    Set board length, thickness, and strip cut width to see the end grain.
                  </EmptyHint>
                )}
              </PreviewFrame>
              <DimRow
                items={[
                  ['Strips', numStrips],
                  ['Final W', `${fmt(finalBoard.width, 2)} in`],
                  ['Final L', `${fmt(finalBoard.length, 2)} in`],
                  ['Final T', `${fmt(finalBoard.thickness, 2)} in`],
                ]}
              />
            </Panel>
          </div>
        </section>
      </main>

      <footer className="px-4 py-3 text-[11px] text-neutral-600 border-t border-neutral-900 no-print">
        End grain process: glue slabs side-by-side → crosscut into strips → rotate each
        strip 90° so end grain faces up → glue strips back together. Cut lines on the
        glue-up preview show where strips will be sliced.
      </footer>
    </div>
  );
}

const Panel = ({ title, subtitle, action, children, className = '' }) => (
  <div
    className={`rounded-lg border border-neutral-800 bg-neutral-900/60 ${className}`}
  >
    <div className="flex items-center gap-2 px-3 py-2 border-b border-neutral-800">
      <h2 className="text-xs uppercase tracking-wider text-neutral-400 font-semibold print-text">
        {title}
      </h2>
      {subtitle && (
        <span className="text-[11px] text-neutral-500 font-mono print-text">
          {subtitle}
        </span>
      )}
      {action && <div className="ml-auto">{action}</div>}
    </div>
    <div className="p-3">{children}</div>
  </div>
);

const NumField = ({ label, hint, value, onChange, step = 1, min }) => (
  <label className="block">
    <div className="flex items-center justify-between">
      <span className="text-xs text-neutral-300">{label}</span>
    </div>
    <input
      type="number"
      step={step}
      min={min}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className="mt-1 w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-sm tabular-nums focus:outline-none focus:border-amber-500"
    />
    {hint && <div className="mt-1 text-[10px] text-neutral-500 leading-snug">{hint}</div>}
  </label>
);

const PreviewFrame = ({ children }) => (
  <div className="rounded bg-neutral-950 border border-neutral-800 p-2 flex items-center justify-center min-h-[220px] print-card">
    {children}
  </div>
);

const EmptyHint = ({ children }) => (
  <div className="text-xs text-neutral-500 text-center py-10 max-w-xs">{children}</div>
);

const DimRow = ({ items }) => (
  <div className="mt-2 grid grid-cols-4 gap-2 text-[11px] print-text">
    {items.map(([k, v]) => (
      <div key={k} className="flex flex-col">
        <span className="text-neutral-500">{k}</span>
        <span className="tabular-nums text-neutral-200">{v}</span>
      </div>
    ))}
  </div>
);
