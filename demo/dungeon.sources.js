const $map = (xs, fn) => xs.map(fn);
const $filter = (xs, pred) => xs.filter(pred);
const $fold = (xs, init, fn) => xs.reduce(fn, init);
const $pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x);
const $zip = (xs, ys) => xs.map((x, i) => [x, ys[i]]);
const $range = (start, end) => Array.from({ length: Math.max(0, end - start) }, (_, i) => start + i);
const $first = (xs) => xs[0];
const $last = (xs) => xs[xs.length - 1];
const $sum = (xs) => xs.reduce((a, b) => a + b, 0);
const $count = (xs, pred) => pred ? xs.filter(pred).length : xs.length;
const $any = (xs, pred) => xs.some(pred);
const $all = (xs, pred) => xs.every(pred);
const $flat = (xs) => xs.flat();
const $groupBy = (xs, keyFn) => xs.reduce((m, x) => { const k = keyFn(x); if (!m.has(k)) m.set(k, []); m.get(k).push(x); return m; }, new Map());
const $pick = (obj, keys) => Object.fromEntries(keys.filter(k => k in obj).map(k => [k, obj[k]]));
const $omit = (obj, keys) => Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));
const $sort_by = (xs, keyFn) => [...xs].sort((a, b) => { const ka = keyFn(a), kb = keyFn(b); return ka < kb ? -1 : ka > kb ? 1 : 0; });
const $sort_by_desc = (xs, keyFn) => [...xs].sort((a, b) => { const ka = keyFn(a), kb = keyFn(b); return ka > kb ? -1 : ka < kb ? 1 : 0; });
const $trim = (s) => s.trim();
const $split = (s, sep) => s.split(sep);
const $starts_with = (s, prefix) => s.startsWith(prefix);
const $ends_with = (s, suffix) => s.endsWith(suffix);
const $contains = (s, sub) => s.includes(sub);
const $to_upper = (s) => s.toUpperCase();
const $to_lower = (s) => s.toLowerCase();
const $replace_all = (s, from, to) => s.replaceAll(from, to);
const $pad_start = (s, len, padChar = ' ') => s.padStart(len, padChar);
const $pad_end = (s, len, padChar = ' ') => s.padEnd(len, padChar);
const $min = (xs) => xs.reduce((a, b) => a < b ? a : b);
const $max = (xs) => xs.reduce((a, b) => a > b ? a : b);
const $min_by = (xs, keyFn) => xs.reduce((a, b) => keyFn(a) <= keyFn(b) ? a : b);
const $max_by = (xs, keyFn) => xs.reduce((a, b) => keyFn(a) >= keyFn(b) ? a : b);
const $take = (xs, n) => xs.slice(0, n);
const $drop = (xs, n) => xs.slice(n);
const $uniq = (xs) => [...new Set(xs)];
const $chunk = (xs, n) => { const out = []; for (let i = 0; i < xs.length; i += n) out.push(xs.slice(i, i + n)); return out; };
const $flat_map = (xs, fn) => xs.flatMap(fn);
const $set_at = (xs, i, val) => [...xs.slice(0, i), val, ...xs.slice(i + 1)];
const $reverse = (xs) => [...xs].reverse();
const $sum_by = (xs, keyFn) => xs.reduce((acc, x) => acc + keyFn(x), 0);
const $clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const $abs = (x) => Math.abs(x);
const $round = (x) => Math.round(x);
const $floor = (x) => Math.floor(x);
const $ceil = (x) => Math.ceil(x);
const $pow = (x, exp) => Math.pow(x, exp);
const $sqrt = (x) => Math.sqrt(x);
const $random = () => Math.random();
const $random_int = (lo, hi) => Math.floor(Math.random() * (hi - lo + 1)) + lo;
const __synth_presets = {
  email:   /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url:     /^https?:\/\//,
  uuid:    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  alpha:   /^[a-zA-Z]+$/,
  alnum:   /^[a-zA-Z0-9]+$/,
  numeric: /^[0-9]+$/,
  slug:    /^[a-z0-9-]+$/,
  hex:     /^#?[0-9a-fA-F]{3,8}$/,
};
const $find = (xs, pred) => xs.find(pred);
const $find_index = (xs, pred) => xs.findIndex(pred);
const $parse_int = (s, radix = 10) => { const n = parseInt(s, radix); return isNaN(n) ? null : n; };
const $parse_float = (s) => { const n = parseFloat(s); return isNaN(n) ? null : n; };
const $ok = (value) => ({ tag: 'Ok', value });
const $err = (message) => ({ tag: 'Err', message });
const $is_ok = (r) => r != null && r.tag === 'Ok';
const $is_err = (r) => r != null && r.tag === 'Err';
const $unwrap = (r) => { if (r != null && r.tag === 'Ok') return r.value; throw new Error(r != null ? r.message : 'unwrap called on null'); };
const $unwrap_or = (r, fallback) => (r != null && r.tag === 'Ok') ? r.value : fallback;
const $delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const $println = (...args) => { console.log(...args); console.log(''); };
const __synth_tests = [];
const __runSynthTests = () => {
  let passed = 0, failed = 0;
  const results = [];
  for (const t of __synth_tests) {
    try {
      const isOk = !!t.fn();
      if (isOk) { passed++; results.push({ ok: true, desc: t.desc }); }
      else { failed++; results.push({ ok: false, desc: t.desc, error: 'assertion returned false' }); }
    } catch(e) { failed++; results.push({ ok: false, desc: t.desc, error: String(e) }); }
  }
  return { passed, failed, total: passed + failed, results };
};
if (typeof globalThis !== 'undefined') { globalThis.__synth_tests = __synth_tests; globalThis.__runSynthTests = __runSynthTests; }



const Floor = Object.freeze({ tag: "Floor" });
const Wall = Object.freeze({ tag: "Wall" });
const Door = Object.freeze({ tag: "Door" });
const Stairs = Object.freeze({ tag: "Stairs" });
const Chest = Object.freeze({ tag: "Chest" });
const Water = Object.freeze({ tag: "Water" });
const Torch = Object.freeze({ tag: "Torch" });

const TileMeta = (id, glyph, label, passable) => ({ id, glyph, label, passable });

let TILE_META = [{id: "Floor", glyph: "·", label: "open floor", passable: true}, {id: "Wall", glyph: "█", label: "stone wall", passable: false}, {id: "Door", glyph: "▯", label: "wooden door", passable: true}, {id: "Stairs", glyph: "≋", label: "staircase", passable: true}, {id: "Chest", glyph: "■", label: "treasure chest", passable: false}, {id: "Water", glyph: "≈", label: "deep water", passable: false}, {id: "Torch", glyph: "†", label: "wall torch", passable: true}];

const tile_meta = (tag) => $find(TILE_META, (t) => t.id == tag);

/**
 * @param {string} tag
 * @returns {boolean}
 */
const is_passable = (tag) => {
  let hit = tile_meta(tag);
  return hit ? hit.passable : false;
};

/**
 * @param {string} tag
 * @returns {string}
 */
const tile_glyph = (tag) => {
  let hit = tile_meta(tag);
  return hit ? hit.glyph : "?";
};

/**
 * @param {string} tag
 * @returns {string}
 */
const tile_label = (tag) => {
  let hit = tile_meta(tag);
  return hit ? hit.label : "unknown";
};

__synth_tests.push({ desc: "floor is passable", fn: () => is_passable("Floor") == true });

__synth_tests.push({ desc: "wall is not passable", fn: () => is_passable("Wall") == false });

__synth_tests.push({ desc: "chest is not passable", fn: () => is_passable("Chest") == false });

__synth_tests.push({ desc: "stairs glyph is correct", fn: () => tile_glyph("Stairs") == "≋" });

__synth_tests.push({ desc: "door label is correct", fn: () => tile_label("Door") == "wooden door" });




const DungeonMap = (grid, rows, cols, level) => ({ grid, rows, cols, level });

const lcg = (s) => (s % 2147483648 * 1664525 + 1013904223) % 2147483648;

/**
 * @param {number} s
 * @param {number} r
 * @param {number} c
 * @returns {number}
 */
const cell_hash = (s, r, c) => {
  let h1 = lcg(s + r * 48271 + c * 16807);
  let h2 = lcg(h1 + c * 48271 + r * 16807);
  let h3 = lcg(h2);
  return h3 / 2147483648.0;
};

/**
 * @param {number} rows
 * @param {number} cols
 * @returns {*}
 */
const make_grid = (rows, cols) => {
  let data = [];
  for (let _ = 0; _ < rows * cols; _++) {
    data.push("Wall");
  }
  return {data: data, cols: cols};
};

const gget = (g, r, c) => g.data[r * g.cols + c];

/**
 * @param {*} g
 * @param {number} r
 * @param {number} c
 * @param {string} tag
 * @returns {*}
 */
const gset = (g, r, c, tag) => g.data[r * g.cols + c] = tag;

const room_cr = (room) => room.r1 + Math.floor((room.r2 - room.r1) / 2);

const room_cc = (room) => room.c1 + Math.floor((room.c2 - room.c1) / 2);

/**
 * @param {number} rows
 * @param {number} cols
 * @param {number} s
 * @returns {*}
 */
const pick_room = (rows, cols, s) => {
  let s1 = lcg(s);
  let maxh = Math.max(2, Math.floor(rows / 3));
  let maxw = Math.max(3, Math.floor(cols / 4));
  let h = 2 + s1 % maxh;
  let s2 = lcg(s1);
  let w = 3 + s2 % maxw;
  let s3 = lcg(s2);
  let r1 = 1 + s3 % Math.max(1, rows - h - 2);
  let s4 = lcg(s3);
  let c1 = 1 + s4 % Math.max(1, cols - w - 2);
  return {r1: r1, c1: c1, r2: r1 + h, c2: c1 + w};
};

/**
 * @param {*} g
 * @param {*} room
 * @returns {*}
 */
const carve_room = (g, room) => {
  for (let i = 0; i < room.r2 - room.r1 + 1; i++) {
    for (let j = 0; j < room.c2 - room.c1 + 1; j++) {
      gset(g, room.r1 + i, room.c1 + j, "Floor");
    }
  }
};

/**
 * @param {*} g
 * @param {number} r
 * @param {number} clo
 * @param {number} chi
 * @returns {*}
 */
const carve_h = (g, r, clo, chi) => {
  for (let c = clo; c <= chi; c++) {
    if (gget(g, r, c) == "Wall") {
      gset(g, r, c, "Floor");
    }
  }
};

/**
 * @param {*} g
 * @param {number} c
 * @param {number} rlo
 * @param {number} rhi
 * @returns {*}
 */
const carve_v = (g, c, rlo, rhi) => {
  for (let r = rlo; r <= rhi; r++) {
    if (gget(g, r, c) == "Wall") {
      gset(g, r, c, "Floor");
    }
  }
};

/**
 * @param {*} g
 * @param {number} r1
 * @param {number} c1
 * @param {number} r2
 * @param {number} c2
 * @returns {*}
 */
const carve_corridor = (g, r1, c1, r2, c2) => {
  carve_h(g, r1, Math.min(c1, c2), Math.max(c1, c2));
  return carve_v(g, c2, Math.min(r1, r2), Math.max(r1, r2));
};

/**
 * @param {*} g
 * @param {*} room
 * @returns {*}
 */
const place_room_doors = (g, room) => {
  let dr = room.r2 - room.r1 + 1;
  let dc = room.c2 - room.c1 + 1;
  let ri = -1;
  for (let i = 0; i < dr; i++) {
    if (ri < 0 && gget(g, room.r1 + i, room.c2 + 1) == "Floor") {
      ri = i;
    }
  }
  if (ri >= 0) {
    let r = room.r1 + ri;
    let c = room.c2 + 1;
    if (gget(g, r - 1, c) == "Wall" && gget(g, r + 1, c) == "Wall") {
      gset(g, r, c, "Door");
    }
  }
  let li = -1;
  for (let i = 0; i < dr; i++) {
    if (li < 0 && gget(g, room.r1 + i, room.c1 - 1) == "Floor") {
      li = i;
    }
  }
  if (li >= 0) {
    let r = room.r1 + li;
    let c = room.c1 - 1;
    if (gget(g, r - 1, c) == "Wall" && gget(g, r + 1, c) == "Wall") {
      gset(g, r, c, "Door");
    }
  }
  let bi = -1;
  for (let j = 0; j < dc; j++) {
    if (bi < 0 && gget(g, room.r2 + 1, room.c1 + j) == "Floor") {
      bi = j;
    }
  }
  if (bi >= 0) {
    let r = room.r2 + 1;
    let c = room.c1 + bi;
    if (gget(g, r, c - 1) == "Wall" && gget(g, r, c + 1) == "Wall") {
      gset(g, r, c, "Door");
    }
  }
  let ti = -1;
  for (let j = 0; j < dc; j++) {
    if (ti < 0 && gget(g, room.r1 - 1, room.c1 + j) == "Floor") {
      ti = j;
    }
  }
  if (ti >= 0) {
    let r = room.r1 - 1;
    let c = room.c1 + ti;
    if (gget(g, r, c - 1) == "Wall" && gget(g, r, c + 1) == "Wall") {
      return gset(g, r, c, "Door");
    }
  }
};

/**
 * @param {*} g
 * @param {*} room
 * @param {number} level
 * @param {number} seed
 * @param {boolean} is_last
 * @returns {*}
 */
const scatter_room = (g, room, level, seed, is_last) => {
  if (is_last) {
    gset(g, room_cr(room), room_cc(room), "Stairs");
  }
  let dr = room.r2 - room.r1 + 1;
  let dc = room.c2 - room.c1 + 1;
  let cp = 0.025;
  let wp = 0.015 + Math.min(level * 0.002, 0.02);
  for (let i = 0; i < dr; i++) {
    for (let j = 0; j < dc; j++) {
      let r = room.r1 + i;
      let c = room.c1 + j;
      let rng = cell_hash(seed, r, c);
      if (gget(g, r, c) == "Floor") {
        if (rng < cp) {
          gset(g, r, c, "Chest");
        }
        if (rng >= cp && rng < cp + wp) {
          gset(g, r, c, "Water");
        }
      }
    }
  }
};

/**
 * @param {*} g
 * @param {*} rooms
 * @returns {*}
 */
const fix_chest_count = (g, rooms) => {
  let positions = [];
  for (const room of rooms) {
    let dr = room.r2 - room.r1 + 1;
    let dc = room.c2 - room.c1 + 1;
    for (let i = 0; i < dr; i++) {
      for (let j = 0; j < dc; j++) {
        let r = room.r1 + i;
        let c = room.c1 + j;
        if (gget(g, r, c) == "Chest") {
          positions.push({r: r, c: c});
        }
      }
    }
  }
  let idx = 0;
  for (const pos of positions) {
    if (idx >= 5) {
      gset(g, pos.r, pos.c, "Floor");
    }
    idx = idx + 1;
  }
  let count = Math.min(positions.length, 5);
  let ri = 0;
  for (const room of rooms) {
    if (count < 2 && ri < rooms.length - 1) {
      let r = room_cr(room);
      let c = room_cc(room);
      if (gget(g, r, c) == "Floor") {
        gset(g, r, c, "Chest");
        count = count + 1;
      }
    }
    ri = ri + 1;
  }
};

/**
 * @param {*} g
 * @param {*} rooms
 * @returns {*}
 */
const fix_water_count = (g, rooms) => {
  let kept = [];
  for (const room of rooms) {
    let dr = room.r2 - room.r1 + 1;
    let dc = room.c2 - room.c1 + 1;
    let found = 0;
    for (let i = 0; i < dr; i++) {
      for (let j = 0; j < dc; j++) {
        let r = room.r1 + i;
        let c = room.c1 + j;
        if (gget(g, r, c) == "Water") {
          if (found == 0) {
            kept.push({r: r, c: c});
            found = 1;
          } else {
            gset(g, r, c, "Floor");
          }
        }
      }
    }
  }
  let idx = 0;
  for (const pos of kept) {
    if (idx >= 3) {
      gset(g, pos.r, pos.c, "Floor");
    }
    idx = idx + 1;
  }
};

/**
 * @param {*} g
 * @param {number} rows
 * @param {number} cols
 * @returns {*}
 */
const place_door_torches = (g, rows, cols) => {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (gget(g, r, c) == "Door") {
        if (r > 0 && c > 0 && gget(g, r - 1, c - 1) == "Floor") {
          gset(g, r - 1, c - 1, "Torch");
        }
        if (r > 0 && c < cols - 1 && gget(g, r - 1, c + 1) == "Floor") {
          gset(g, r - 1, c + 1, "Torch");
        }
        if (r < rows - 1 && c > 0 && gget(g, r + 1, c - 1) == "Floor") {
          gset(g, r + 1, c - 1, "Torch");
        }
        if (r < rows - 1 && c < cols - 1 && gget(g, r + 1, c + 1) == "Floor") {
          gset(g, r + 1, c + 1, "Torch");
        }
      }
    }
  }
};

/**
 * @param {number} rows
 * @param {number} cols
 * @param {number} level
 * @param {number} seed
 * @returns {DungeonMap}
 */
const generate = (rows, cols, level, seed) => {
  let g = make_grid(rows, cols);
  let rooms = [];
  let n = 4 + lcg(seed) % 4;
  for (let i = 0; i < n; i++) {
    let room = pick_room(rows, cols, lcg(seed + i * 997 + level * 113));
    rooms.push(room);
    carve_room(g, room);
  }
  for (let i = 0; i < n - 1; i++) {
    carve_corridor(g, room_cr(rooms[i]), room_cc(rooms[i]), room_cr(rooms[i + 1]), room_cc(rooms[i + 1]));
  }
  for (const room of rooms) {
    place_room_doors(g, room);
  }
  let si = 0;
  for (const room of rooms) {
    scatter_room(g, room, level, lcg(seed + si * 1009), si == n - 1);
    si = si + 1;
  }
  fix_water_count(g, rooms);
  fix_chest_count(g, rooms);
  place_door_torches(g, rows, cols);
  let grid = [];
  for (let r = 0; r < rows; r++) {
    let row = [];
    for (let c = 0; c < cols; c++) {
      let tag = gget(g, r, c);
      let passable = tag != "Wall" && tag != "Chest" && tag != "Water";
      row.push({tag: tag, passable: passable});
    }
    grid.push(row);
  }
  return {grid: JSON.stringify(grid), rows: rows, cols: cols, level: level};
};

/**
 * @param {DungeonMap} map
 * @param {string} tag
 * @returns {number}
 */
const count_tag = (map, tag) => {
  let grid = JSON.parse(map.grid);
  let count = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell.tag == tag) {
        count = count + 1;
      }
    }
  }
  return count;
};

__synth_tests.push({ desc: "map has expected dimensions", fn: () => (() => {
  let m = generate(10, 20, 1, 42);
  return m.rows == 10 && m.cols == 20;
})() });

__synth_tests.push({ desc: "level-1 map has at least one floor tile", fn: () => (() => {
  let m = generate(10, 20, 1, 42);
  return count_tag(m, "Floor") > 0;
})() });

__synth_tests.push({ desc: "outer border is all wall", fn: () => (() => {
  let m = generate(8, 12, 1, 99);
  let g = JSON.parse(m.grid);
  return g[0].every((t) => t.tag == "Wall") && g[7].every((t) => t.tag == "Wall");
})() });

__synth_tests.push({ desc: "stairs present in every map", fn: () => (() => {
  let m = generate(10, 14, 1, 12);
  return count_tag(m, "Stairs") > 0;
})() });

__synth_tests.push({ desc: "chest count is between 2 and 5", fn: () => (() => {
  let m = generate(22, 48, 1, 7777);
  let m2 = generate(22, 48, 10, 9999);
  let c1 = count_tag(m, "Chest");
  let c2 = count_tag(m2, "Chest");
  return c1 >= 2 && c1 <= 5 && c2 >= 2 && c2 <= 5;
})() });

__synth_tests.push({ desc: "every torch is diagonally adjacent to a door", fn: () => (() => {
  let m = generate(22, 48, 1, 7777);
  let grid = JSON.parse(m.grid);
  let bad = 0;
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c].tag == "Torch") {
        let diags = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        let hasDoor = diags.some((d) => (() => {
          let nr = r + d[0];
          let nc = c + d[1];
          return nr >= 0 && nc >= 0 && nr < grid.length && nc < grid[r].length && grid[nr][nc].tag == "Door";
})());
        if (!hasDoor) {
          bad = bad + 1;
        }
      }
    }
  }
  return bad == 0;
})() });




const tile_class = (tag) => ((_m) => (_m === "Wall") ? "t-wall" : (_m === "Floor") ? "t-floor" : (_m === "Door") ? "t-door" : (_m === "Stairs") ? "t-stairs" : (_m === "Chest") ? "t-chest" : (_m === "Water") ? "t-water" : (_m === "Torch") ? "t-torch" : "t-unknown")(tag);

/**
 * @param {DungeonMap} map
 * @returns {string}
 */
const render_map = (map) => {
  let grid = JSON.parse(map.grid);
  let lines = [];
  grid.forEach((row) => (() => {
    let cells = "";
    row.forEach((tile) => (() => {
      return cells = cells + `<span class="tile ${tile_class(tile.tag)}">${tile_glyph(tile.tag)}</span>`;
})());
    return lines.push(`<div class="map-row">${cells}</div>`);
})());
  return `<div class="dungeon-map">${lines.join("")}</div>`;
};

const legend_entry = (tag) => `<div class="legend-entry"><span class="tile ${tile_class(tag)}">${tile_glyph(tag)}</span><span class="legend-label">${tag}</span></div>`;

/**
 * @returns {string}
 */
const render_legend = () => {
  let tags = ["Floor", "Wall", "Door", "Stairs", "Chest", "Water", "Torch"];
  let entries = $map(tags, (t) => legend_entry(t));
  return `<div class="map-legend">${entries.join("")}</div>`;
};

/**
 * @param {DungeonMap} map
 * @param {number} seed
 * @returns {string}
 */
const render_stats = (map, seed) => {
  let grid = JSON.parse(map.grid);
  let floors = 0;
  let specials = 0;
  grid.forEach((row) => row.forEach((cell) => (() => {
    if (cell.tag == "Floor") {
      floors = floors + 1;
    }
    if (cell.tag != "Floor" && cell.tag != "Wall") {
      return specials = specials + 1;
    }
})()));
  return `<div class="map-stats">
    <span>Level <strong>${map.level}</strong></span>
    <span>Seed <strong>${seed}</strong></span>
    <span>Size <strong>${map.cols}×${map.rows}</strong></span>
    <span>Floors <strong>${floors}</strong></span>
    <span>Special <strong>${specials}</strong></span>
  </div>`;
};



const DungeonConfig = (level, seed) => ({ level, seed });

/**
 * @param {string} s
 * @returns {*}
 */
const parse_level = (s) => {
  let n = $parse_int(s);
  if (n == null) {
    return $err(`Level must be a number — got: "${s}"`);
  }
  if (n < 1) {
    return $err(`Level must be at least 1 — got: ${n}`);
  }
  if (n > 10) {
    return $err(`Level must be 10 or less — got: ${n}`);
  }
  return $ok(n);
};

/**
 * @param {string} s
 * @returns {*}
 */
const parse_seed = (s) => {
  let n = $parse_int(s);
  if (n == null) {
    return $err(`Seed must be a number — got: "${s}"`);
  }
  let seed = Math.abs(n) % 2147483648;
  return $ok(seed);
};

/**
 * @param {string} input
 * @returns {*}
 */
const parse_config = (input) => {
  let trimmed = $trim(input);
  if (trimmed.length == 0) {
    return $err("Enter a code in the format level:seed — e.g. 3:42");
  }
  let parts = $split(trimmed, ":");
  if (parts.length < 2) {
    return $err("Format is level:seed — e.g. 3:42");
  }
  const _r46 = parse_level($trim(parts[0]));
  if (_r46.tag === 'Err') return _r46;
  let level = _r46.value;
  const _r49 = parse_seed($trim(parts[1]));
  if (_r49.tag === 'Err') return _r49;
  let seed = _r49.value;
  return $ok({level, seed});
};

const config_summary = (cfg) => `Level ${cfg.level} · Seed ${cfg.seed}`;

__synth_tests.push({ desc: "valid code parses correctly", fn: () => (() => {
  let r = parse_config("3:42");
  return $is_ok(r) && r.value.level == 3 && r.value.seed == 42;
})() });

__synth_tests.push({ desc: "empty input returns Err", fn: () => $is_err(parse_config("")) });

__synth_tests.push({ desc: "missing colon returns Err", fn: () => $is_err(parse_config("999")) });

__synth_tests.push({ desc: "non-numeric level returns Err", fn: () => (() => {
  let r = parse_config("abc:42");
  return $is_err(r) && r.message == "Level must be a number — got: \"abc\"";
})() });

__synth_tests.push({ desc: "level 0 returns Err", fn: () => (() => {
  let r = parse_config("0:42");
  return $is_err(r) && r.message == "Level must be at least 1 — got: 0";
})() });

__synth_tests.push({ desc: "level 11 returns Err", fn: () => (() => {
  let r = parse_config("11:42");
  return $is_err(r) && r.message == "Level must be 10 or less — got: 11";
})() });

__synth_tests.push({ desc: "negative seed is normalised", fn: () => (() => {
  let r = parse_config("1:-42");
  return $is_ok(r) && r.value.seed == 42;
})() });

__synth_tests.push({ desc: "large seed is clamped to 2^31", fn: () => (() => {
  let r = parse_config("1:9999999999");
  return $is_ok(r) && r.value.seed >= 0 && r.value.seed < 2147483648;
})() });

__synth_tests.push({ desc: "whitespace is trimmed", fn: () => (() => {
  let r = parse_config("  2 : 100 ");
  return $is_ok(r) && r.value.level == 2 && r.value.seed == 100;
})() });




const AppState = (level, seed, rows, cols) => ({ level, seed, rows, cols });

/**
 * @returns {AppState}
 */
const init = () => ({level: 1, seed: 7777, rows: 22, cols: 48});

const next_seed = (s) => (s * 6364136 + 1442695) % 9007199254740991;

const new_map = (s) => ({...s, seed: next_seed(s.seed)});

const go_next = (s) => ({...s, level: s.level + 1, seed: next_seed(s.seed)});

const go_prev = (s) => ({...s, level: s.level - 1, seed: next_seed(s.seed)});

/**
 * @param {number} level
 * @param {number} seed
 * @returns {string}
 */
const map_name = (level, seed) => {
  let NAME_ADJ = ["Sunken", "Flooded", "Forgotten", "Ancient", "Crumbling", "Darkened", "Shattered", "Cursed", "Hollow", "Ruined", "Scorched", "Mossy", "Twisted", "Silent", "Pale", "Burning", "Frozen", "Gilded", "Haunted", "Blighted", "Crimson", "Ashen", "Murky", "Lost", "Forsaken", "Tarnished", "Rotting", "Sealed", "Fractured", "Drowned"];
  let NAME_NOUN = ["Hall", "Vault", "Passage", "Chamber", "Catacombs", "Sanctum", "Tomb", "Cavern", "Lair", "Pit", "Maze", "Crypt", "Gallery", "Abyss", "Warren", "Cellar", "Archive", "Ossuary", "Barrow", "Grotto", "Keep", "Depths", "Ruin", "Antechamber", "Oubliette"];
  let h1 = (seed % NAME_ADJ.length + NAME_ADJ.length) % NAME_ADJ.length;
  let h2 = ((seed + level * 7) % NAME_NOUN.length + NAME_NOUN.length) % NAME_NOUN.length;
  return `The ${NAME_ADJ[h1]} ${NAME_NOUN[h2]}`;
};

/**
 * @param {number} level
 * @returns {string}
 */
const level_description = (level) => {
  let hit = $find(LEVEL_BLURBS, (b) => b.level == level);
  if (hit) {
    return hit.text;
  } else if (level > 5) {
    return "You shouldn't be here.";
  } else {
    return "Press onward.";
  }
};

const render_header = (level, seed) => `<div class="dungeon-header">
    <h2 class="level-name">Level ${level} — ${map_name(level, seed)}</h2>
    <p class="level-desc">${level_description(level)}</p>
  </div>`;

/**
 * @param {AppState} s
 * @returns {*}
 */
const handle_code_input = (s) => {
  let input = document.getElementById("code-input").value;
  let result = parse_config(input);
  let errEl = document.getElementById("code-error");
  if ($is_ok(result)) {
    let cfg = result.value;
    errEl.textContent = "";
    errEl.style.display = "none";
    return render({...s, level: cfg.level, seed: cfg.seed});
  } else {
    errEl.textContent = result.message;
    return errEl.style.display = "block";
  }
};

/**
 * @param {AppState} s
 * @returns {*}
 */
const render = (s) => {
  let map = generate(s.rows, s.cols, s.level, s.seed);
  let html = render_header(s.level, s.seed) + render_stats(map, s.seed) + render_map(map) + render_legend();
  document.getElementById("dungeon-output").innerHTML = html;
  document.getElementById("btn-prev").disabled = s.level <= 1;
  document.getElementById("code-input").value = `${s.level}:${s.seed}`;
  document.getElementById("btn-new").onclick = () => render(new_map(s));
  document.getElementById("btn-next").onclick = () => render(go_next(s));
  document.getElementById("btn-prev").onclick = () => (() => {
    if (s.level > 1) {
      return render(go_prev(s));
    }
})();
  document.getElementById("btn-load").onclick = () => handle_code_input(s);
  return document.getElementById("code-input").onkeydown = (e) => (() => {
    if (e.key == "Enter") {
      return handle_code_input(s);
    }
})();
};

/**
 * @returns {*}
 */
const mount = () => render(init());

mount();
