let CANVAS_W = 800;
let CANVAS_H = 520;
let ALIEN_COLS = 11;
let ALIEN_ROWS = 5;
let ALIEN_W = 36;
let ALIEN_H = 24;
let ALIEN_GAP_X = 16;
let ALIEN_GAP_Y = 14;
let GRID_W = ALIEN_COLS * ALIEN_W + (ALIEN_COLS - 1) * ALIEN_GAP_X;
let ALIEN_OX = (CANVAS_W - GRID_W) / 2;
let ALIEN_OY = 60;
let PLAYER_W = 52;
let PLAYER_H = 26;
let PLAYER_Y = CANVAS_H - 55;
let BULLET_W = 3;
let BULLET_H = 14;
let PBULLET_SPD = 440;
let ABULLET_SPD = 160;
let MARCH_BASE = 36;

/** @store Game — reactive state boundary (v0.8) */
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

let aliens = $map($range(0, ALIEN_ROWS * ALIEN_COLS), i => true);
let alien_dx = 0.0;
let alien_dy = 0.0;
let alien_dir = 1;
let player_x = (CANVAS_W - PLAYER_W) / 2;
let p_bullets = [];
let a_bullets = [];
let fire_cd = 0.0;
let alien_fire_timer = 1.5;

const alien_row = (i) => $floor(i / ALIEN_COLS);

const alien_col = (i) => i - $floor(i / ALIEN_COLS) * ALIEN_COLS;

const row_color = (row) => ((_m) => (_m === 0) ? "#ff2d78" : (_m === 1) ? "#ff6e3a" : (_m === 2) ? "#ffd166" : (_m === 3) ? "#06d6a0" : "#00e5ff")(row);

const row_pts = (row) => ((_m) => (_m === 0) ? 30 : (_m === 1) ? 25 : (_m === 2) ? 20 : (_m === 3) ? 15 : 10)(row);

const alien_x = (i) => ALIEN_OX + alien_col(i) * (ALIEN_W + ALIEN_GAP_X) + alien_dx;

const alien_y = (i) => ALIEN_OY + alien_row(i) * (ALIEN_H + ALIEN_GAP_Y) + alien_dy;

const alive_count = () => $count(aliens, a => a);

/**
 * @param {*} wave
 * @returns {*}
 */
const reset_wave = (wave) => {
  aliens = $map($range(0, ALIEN_ROWS * ALIEN_COLS), i => true);
  alien_dx = 0.0;
  alien_dy = 0.0;
  alien_dir = 1;
  p_bullets = [];
  a_bullets = [];
  fire_cd = 0.0;
  return alien_fire_timer = 1.5;
};

/**
 * @returns {*}
 */
const start_game = () => {
  reset_wave(1);
  player_x = (CANVAS_W - PLAYER_W) / 2;
  return Game.set({ score: 0, lives: 3, wave: 1, phase: "playing" });
};

/**
 * @param {*} x
 * @returns {*}
 */
const move_player = (x) => player_x = $clamp(x - PLAYER_W / 2, 0, CANVAS_W - PLAYER_W);

/**
 * @returns {*}
 */
const fire = () => {
  if (fire_cd <= 0) {
    let bx = player_x + PLAYER_W / 2;
    let by = PLAYER_Y;
    p_bullets = [...p_bullets, { x: bx, y: by }];
    return fire_cd = 0.32;
  }
};

/**
 * @param {*} dt
 * @returns {*}
 */
const tick = (dt) => {
  if (Game.phase != "playing") {
    return 0;
  } else {
    let speed_mult = 1.0 + (Game.wave - 1) * 0.18;
    fire_cd = fire_cd - dt;
    alien_fire_timer = alien_fire_timer - dt;
    alien_dx = alien_dx + MARCH_BASE * alien_dir * dt * speed_mult;
    let n = alive_count();
    if (n > 0) {
      let xs_left = $map($filter($range(0, ALIEN_ROWS * ALIEN_COLS), i => aliens[i]), i => alien_x(i));
      let xs_right = $map($filter($range(0, ALIEN_ROWS * ALIEN_COLS), i => aliens[i]), i => alien_x(i) + ALIEN_W);
      let min_x = $min(xs_left);
      let max_x = $max(xs_right);
      if (min_x <= 0 || max_x >= CANVAS_W) {
        alien_dir = 0 - alien_dir;
        alien_dy = alien_dy + 18;
      }
    }
    p_bullets = $filter($map(p_bullets, b => (() => {
      return { x: b.x, y: b.y - PBULLET_SPD * dt };
})()), b => b.y > 0);
    a_bullets = $filter($map(a_bullets, b => (() => {
      return { x: b.x, y: b.y + ABULLET_SPD * dt };
})()), b => b.y < CANVAS_H);
    let i = 0;
    while (i < $count(p_bullets, x => true)) {
      let b = p_bullets[i];
      let j = 0;
      let hit = 0 - 1;
      while (j < ALIEN_ROWS * ALIEN_COLS && hit < 0) {
        if (aliens[j]) {
          let ax = alien_x(j);
          let ay = alien_y(j);
          if (b.x > ax && b.x < ax + ALIEN_W && b.y > ay && b.y < ay + ALIEN_H) {
            hit = j;
          }
        }
        j += 1;
      }
      if (hit >= 0) {
        aliens = $set_at(aliens, hit, false);
        let pts = row_pts(alien_row(hit));
        let ns = Game.score + pts;
        let nhi = ns > Game.hi ? ns : Game.hi;
        Game.set({ score: ns, hi: nhi });
        let bx = b.x;
        let by = b.y;
        p_bullets = $filter(p_bullets, pb => pb.x != bx || pb.y != by);
      } else {
        i += 1;
      }
    }
    if (alien_fire_timer <= 0 && alive_count() > 0) {
      let col = $floor($random() * ALIEN_COLS);
      let bot = 0 - 1;
      let k = 0;
      while (k < ALIEN_ROWS * ALIEN_COLS) {
        if (aliens[k] && alien_col(k) == col) {
          bot = k;
        }
        k += 1;
      }
      if (bot >= 0) {
        a_bullets = [...a_bullets, { x: alien_x(bot) + ALIEN_W / 2, y: alien_y(bot) + ALIEN_H }];
      }
      alien_fire_timer = $clamp(2.0 - Game.wave * 0.2, 0.5, 2.0);
    }
    let px = player_x;
    let py = PLAYER_Y;
    let hit_player = $any(a_bullets, b => b.x > px && b.x < px + PLAYER_W && b.y > py && b.y < py + PLAYER_H);
    if (hit_player) {
      a_bullets = $filter(a_bullets, b => b.x <= px || b.x >= px + PLAYER_W || b.y <= py || b.y >= py + PLAYER_H);
      let nl = Game.lives - 1;
      if (nl <= 0) {
        Game.set({ lives: 0, phase: "gameover" });
      } else {
        Game.set({ lives: nl });
      }
    }
    let invasion = $any($range(0, ALIEN_ROWS * ALIEN_COLS), i => aliens[i] && alien_y(i) + ALIEN_H >= PLAYER_Y);
    if (invasion) {
      Game.set({ phase: "gameover" });
    }
    if (alive_count() == 0) {
      return Game.set({ phase: "waveclear" });
    }
  }
};

/**
 * @returns {*}
 */
const next_wave = () => {
  let nw = Game.wave + 1;
  reset_wave(nw);
  return Game.set({ wave: nw, phase: "playing" });
};

const get_aliens = () => $map($filter($range(0, ALIEN_ROWS * ALIEN_COLS), i => aliens[i]), i => (() => {
  let color = row_color(alien_row(i));
  return { x: alien_x(i), y: alien_y(i), w: ALIEN_W, h: ALIEN_H, color };
})());

const get_player = () => ({ x: player_x, y: PLAYER_Y, w: PLAYER_W, h: PLAYER_H });

const get_pbullets = () => p_bullets;

const get_abullets = () => a_bullets;

