const Bullet = (x, y) => ({ x, y });

const Grid = (cols, rows, alien_w, alien_h, gap_x, gap_y, ox, oy, march) => ({ cols, rows, alien_w, alien_h, gap_x, gap_y, ox, oy, march });

const PlayerSpec = (w, h, y) => ({ w, h, y });

const Swarm = (dx, dy, dir, fire_cd, alien_fire_timer) => ({ dx, dy, dir, fire_cd, alien_fire_timer });

const RowStyle = (color, points) => ({ color, points });

let CANVAS_W = 800.0;
let CANVAS_H = 520.0;
let GRID = (() => {
  let cols = 11;
  let rows = 5;
  let alien_w = 36.0;
  let gap_x = 16.0;
  let grid_w = cols * alien_w + (cols - 1) * gap_x;
  return {cols: cols, rows: rows, alien_w: alien_w, alien_h: 24.0, gap_x: gap_x, gap_y: 14.0, ox: (CANVAS_W - grid_w) / 2.0, oy: 60.0, march: 36.0};
})();
let PLAYER = {w: 52.0, h: 26.0, y: CANVAS_H - 55.0};
let BULLET = {w: 3.0, h: 14.0, player_spd: 440.0, alien_spd: 160.0};
let ROW_STYLES = [{color: "#ff2d78", points: 30}, {color: "#ff6e3a", points: 25}, {color: "#ffd166", points: 20}, {color: "#06d6a0", points: 15}, {color: "#00e5ff", points: 10}];

const Game = (() => {
  let _state = { score: 0, hi: 0, lives: 3, wave: 1, phase: "title" };
  const _subs = [];
  return {
    get score() { return _state.score; },
    get hi() { return _state.hi; },
    get lives() { return _state.lives; },
    get wave() { return _state.wave; },
    get phase() { return _state.phase; },
    set(patch) {
      _state = Object.assign({}, _state, patch);
      for (const __fn of _subs) __fn(_state);
    },
    subscribe(fn) { _subs.push(fn); fn(_state); },
  };
})();

let aliens = $map($range(0, GRID.rows * GRID.cols), (i) => true);
let swarm = {dx: 0.0, dy: 0.0, dir: 1, fire_cd: 0.0, alien_fire_timer: 1.5};
let player_x = (CANVAS_W - PLAYER.w) / 2.0;
let p_bullets = [];
let a_bullets = [];

const alien_row = (i) => $floor(i / GRID.cols);

const alien_col = (i) => i - $floor(i / GRID.cols) * GRID.cols;

const row_color = (() => {
  const __cache = new Map();
  return (row) => {
    const __key = JSON.stringify([row]);
    if (__cache.has(__key)) return __cache.get(__key);
    const __result = (() => {
      return ROW_STYLES[row].color;
    })();
    __cache.set(__key, __result);
    return __result;
  };
})();

const row_pts = (() => {
  const __cache = new Map();
  return (row) => {
    const __key = JSON.stringify([row]);
    if (__cache.has(__key)) return __cache.get(__key);
    const __result = (() => {
      return ROW_STYLES[row].points;
    })();
    __cache.set(__key, __result);
    return __result;
  };
})();

const alien_x = (i) => GRID.ox + alien_col(i) * (GRID.alien_w + GRID.gap_x) + swarm.dx;

const alien_y = (i) => GRID.oy + alien_row(i) * (GRID.alien_h + GRID.gap_y) + swarm.dy;

const alive_count = () => $count(aliens, (a) => a);

/**
 * @param {number} wave
 * @returns {*}
 */
const reset_wave = (wave) => {
  aliens = $map($range(0, GRID.rows * GRID.cols), (i) => true);
  swarm.dx = 0.0;
  swarm.dy = 0.0;
  swarm.dir = 1;
  swarm.fire_cd = 0.0;
  swarm.alien_fire_timer = 1.5;
  p_bullets = [];
  return a_bullets = [];
};

/**
 * @returns {*}
 */
const start_game = () => {
  reset_wave(1);
  player_x = (CANVAS_W - PLAYER.w) / 2.0;
  return Game.set({score: 0, lives: 3, wave: 1, phase: "playing"});
};

/**
 * @param {number} x
 * @returns {*}
 */
const move_player = (x) => player_x = $clamp(x - PLAYER.w / 2.0, 0.0, CANVAS_W - PLAYER.w);

/**
 * @returns {*}
 */
const fire = () => {
  if (swarm.fire_cd <= 0.0) {
    p_bullets = [...p_bullets, {x: player_x + PLAYER.w / 2.0, y: PLAYER.y}];
    return swarm.fire_cd = 0.32;
  }
};

/**
 * @param {number} dt
 * @returns {*}
 */
const tick = (dt) => {
  if (Game.phase != "playing") {
    return 0;
  } else {
    let speed_mult = 1.0 + (Game.wave - 1) * 0.18;
    swarm.fire_cd = swarm.fire_cd - dt;
    swarm.alien_fire_timer = swarm.alien_fire_timer - dt;
    swarm.dx = swarm.dx + GRID.march * swarm.dir * dt * speed_mult;
    let n = alive_count();
    if (n > 0) {
      let xs_left = $map($filter($range(0, GRID.rows * GRID.cols), (i) => aliens[i]), (i) => alien_x(i));
      let xs_right = $map($filter($range(0, GRID.rows * GRID.cols), (i) => aliens[i]), (i) => alien_x(i) + GRID.alien_w);
      let min_x = $min(xs_left);
      let max_x = $max(xs_right);
      if (min_x <= 0.0 || max_x >= CANVAS_W) {
        swarm.dir = 0 - swarm.dir;
        swarm.dy = swarm.dy + 18.0;
      }
    }
    p_bullets = $filter($map(p_bullets, (b) => ({x: b.x, y: b.y - BULLET.player_spd * dt})), (b) => b.y > 0.0);
    a_bullets = $filter($map(a_bullets, (b) => ({x: b.x, y: b.y + BULLET.alien_spd * dt})), (b) => b.y < CANVAS_H);
    let i = 0;
    while (i < $count(p_bullets, (x) => true)) {
      let b = p_bullets[i];
      let hit = $find_index($range(0, GRID.rows * GRID.cols), (j) => aliens[j] && b.x > alien_x(j) && b.x < alien_x(j) + GRID.alien_w && b.y > alien_y(j) && b.y < alien_y(j) + GRID.alien_h);
      if (hit >= 0) {
        aliens = $set_at(aliens, hit, false);
        let pts = row_pts(alien_row(hit));
        let ns = Game.score + pts;
        let nhi = ns > Game.hi ? ns : Game.hi;
        Game.set({score: ns, hi: nhi});
        let bx = b.x;
        let by = b.y;
        p_bullets = $filter(p_bullets, (pb) => pb.x != bx || pb.y != by);
      } else {
        i += 1;
      }
    }
    if (swarm.alien_fire_timer <= 0.0 && alive_count() > 0) {
      let col = $floor($random() * GRID.cols);
      let bot = 0 - 1;
      let k = 0;
      while (k < GRID.rows * GRID.cols) {
        if (aliens[k] && alien_col(k) == col) {
          bot = k;
        }
        k += 1;
      }
      if (bot >= 0) {
        a_bullets = [...a_bullets, {x: alien_x(bot) + GRID.alien_w / 2.0, y: alien_y(bot) + GRID.alien_h}];
      }
      swarm.alien_fire_timer = $clamp(2.0 - Game.wave * 0.2, 0.5, 2.0);
    }
    let px = player_x;
    let py = PLAYER.y;
    let hit_player = $any(a_bullets, (b) => b.x > px && b.x < px + PLAYER.w && b.y > py && b.y < py + PLAYER.h);
    if (hit_player) {
      a_bullets = $filter(a_bullets, (b) => b.x <= px || b.x >= px + PLAYER.w || b.y <= py || b.y >= py + PLAYER.h);
      let nl = Game.lives - 1;
      if (nl <= 0) {
        Game.set({lives: 0, phase: "gameover"});
      } else {
        Game.set({lives: nl});
      }
    }
    let invasion = $any($range(0, GRID.rows * GRID.cols), (i) => aliens[i] && alien_y(i) + GRID.alien_h >= PLAYER.y);
    if (invasion) {
      Game.set({phase: "gameover"});
    }
    if (alive_count() == 0) {
      return Game.set({phase: "waveclear"});
    }
  }
};

/**
 * @returns {*}
 */
const next_wave = () => {
  let nw = Game.wave + 1;
  reset_wave(nw);
  return Game.set({wave: nw, phase: "playing"});
};

const get_aliens = () => $map($filter($range(0, GRID.rows * GRID.cols), (i) => aliens[i]), (i) => ({x: alien_x(i), y: alien_y(i), w: GRID.alien_w, h: GRID.alien_h, color: row_color(alien_row(i))}));

const get_player = () => ({x: player_x, y: PLAYER.y, w: PLAYER.w, h: PLAYER.h});

const get_pbullets = () => p_bullets;

const get_abullets = () => a_bullets;

