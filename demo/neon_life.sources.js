const Point = (c, r) => ({ c, r });

let CANVAS_W = 800;
let CANVAS_H = 520;
let CELL_SIZE = 10;
let COLS = 80;
let ROWS = 52;

const Life = (() => {
  let _state = { gen: 0, pop: 0, running: false, speed: 4 };
  const _subs = [];
  return {
    get gen() { return _state.gen; },
    get pop() { return _state.pop; },
    get running() { return _state.running; },
    get speed() { return _state.speed; },
    set(patch) {
      _state = Object.assign({}, _state, patch);
      for (const __fn of _subs) __fn(_state);
    },
    subscribe(fn) { _subs.push(fn); fn(_state); },
  };
})();

let cells = $map($range(0, ROWS * COLS), (i) => false);

const idx = (c, r) => r * COLS + c;

const at = (c, r) => c >= 0 && c < COLS && r >= 0 && r < ROWS ? cells[idx(c, r)] : false;

const nbr = (c, r) => (at(c - 1, r - 1) ? 1 : 0) + (at(c, r - 1) ? 1 : 0) + (at(c + 1, r - 1) ? 1 : 0) + (at(c - 1, r) ? 1 : 0) + (at(c + 1, r) ? 1 : 0) + (at(c - 1, r + 1) ? 1 : 0) + (at(c, r + 1) ? 1 : 0) + (at(c + 1, r + 1) ? 1 : 0);

const next_state = (c, r) => (() => {
  let alive = at(c, r);
  let n = nbr(c, r);
  return ((_m) => (_m === 3) ? true : (_m === 2) ? alive : false)(n);
})();

/**
 * @returns {*}
 */
const step = () => {
  cells = $flat_map($range(0, ROWS), (r) => $map($range(0, COLS), (c) => next_state(c, r)));
  let pop = $count(cells, (v) => v);
  return Life.set({gen: Life.gen + 1, pop});
};

/**
 * @returns {*}
 */
const clear_grid = () => {
  cells = $map($range(0, ROWS * COLS), (i) => false);
  return Life.set({gen: 0, pop: 0});
};

/**
 * @returns {*}
 */
const randomize = () => {
  cells = $map($range(0, ROWS * COLS), (i) => $random() < 0.28);
  let pop = $count(cells, (v) => v);
  return Life.set({gen: 0, pop});
};

/**
 * @param {*} c
 * @param {*} r
 * @param {*} v
 * @returns {*}
 */
const paint = (c, r, v) => {
  if (c >= 0 && c < COLS && r >= 0 && r < ROWS) {
    cells = $set_at(cells, idx(c, r), v);
    let pop = $count(cells, (a) => a);
    return Life.set({pop});
  }
};

/**
 * @param {*} c
 * @param {*} r
 * @returns {*}
 */
const toggle = (c, r) => {
  if (c >= 0 && c < COLS && r >= 0 && r < ROWS) {
    let i = idx(c, r);
    let was = cells[i];
    cells = $set_at(cells, i, was ? false : true);
    let pop = $count(cells, (a) => a);
    return Life.set({pop});
  }
};

/**
 * @param {Point} pts
 * @returns {*}
 */
const place = (pts) => {
  for (const p of pts) {
    paint(p.c, p.r, true);
  }
};

/**
 * @returns {*}
 */
const load_glider = () => {
  let cx = 10;
  let cy = 10;
  return place([{c: cx, r: cy - 1}, {c: cx + 1, r: cy}, {c: cx - 1, r: cy + 1}, {c: cx, r: cy + 1}, {c: cx + 1, r: cy + 1}]);
};

/**
 * @returns {*}
 */
const load_pulsar = () => {
  let cx = COLS / 2;
  let cy = ROWS / 2;
  let offsets = [2, 3, 4, 8, 9, 10];
  for (const o of offsets) {
    paint(cx - o, cy - 1, true);
    paint(cx + o, cy - 1, true);
    paint(cx - o, cy + 1, true);
    paint(cx + o, cy + 1, true);
    paint(cx - 1, cy - o, true);
    paint(cx + 1, cy - o, true);
    paint(cx - 1, cy + o, true);
    paint(cx + 1, cy + o, true);
  }
};

/**
 * @returns {*}
 */
const load_glider_gun = () => {
  let ox = 3;
  let oy = 5;
  return place([{c: ox + 24, r: oy + 0}, {c: ox + 22, r: oy + 1}, {c: ox + 24, r: oy + 1}, {c: ox + 12, r: oy + 2}, {c: ox + 13, r: oy + 2}, {c: ox + 20, r: oy + 2}, {c: ox + 21, r: oy + 2}, {c: ox + 34, r: oy + 2}, {c: ox + 35, r: oy + 2}, {c: ox + 11, r: oy + 3}, {c: ox + 15, r: oy + 3}, {c: ox + 20, r: oy + 3}, {c: ox + 21, r: oy + 3}, {c: ox + 34, r: oy + 3}, {c: ox + 35, r: oy + 3}, {c: ox + 0, r: oy + 4}, {c: ox + 1, r: oy + 4}, {c: ox + 10, r: oy + 4}, {c: ox + 16, r: oy + 4}, {c: ox + 20, r: oy + 4}, {c: ox + 21, r: oy + 4}, {c: ox + 0, r: oy + 5}, {c: ox + 1, r: oy + 5}, {c: ox + 10, r: oy + 5}, {c: ox + 14, r: oy + 5}, {c: ox + 16, r: oy + 5}, {c: ox + 17, r: oy + 5}, {c: ox + 22, r: oy + 5}, {c: ox + 24, r: oy + 5}, {c: ox + 10, r: oy + 6}, {c: ox + 16, r: oy + 6}, {c: ox + 24, r: oy + 6}, {c: ox + 11, r: oy + 7}, {c: ox + 15, r: oy + 7}, {c: ox + 12, r: oy + 8}, {c: ox + 13, r: oy + 8}]);
};

/**
 * @param {*} name
 * @returns {*}
 */
const load_preset = (name) => {
  clear_grid();
  return ((_m) => (_m === "random") ? randomize() : (_m === "glider") ? load_glider() : (_m === "pulsar") ? load_pulsar() : (_m === "gun") ? load_glider_gun() : 0)(name);
};

const get_cells = () => cells;

const get_cols = () => COLS;

const get_rows = () => ROWS;

const get_cellsize = () => CELL_SIZE;

