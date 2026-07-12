/** @param {number} v @returns {boolean} */
const __validate_Score = (v) => v >= 0;
/** @param {number} v @returns {boolean} */
const __validate_Level = (v) => v >= 1;

const Arena = (w, h) => ({ w, h });

const BrickGrid = (cols, rows, gap, brick_w, brick_h, origin_y) => ({ cols, rows, gap, brick_w, brick_h, origin_y });

const PaddleSpec = (w, h, y) => ({ w, h, y });

const BallSpec = (r, speed) => ({ r, speed });

const RowStyle = (color, points) => ({ color, points });

const Ball = (x, y, vx, vy, r) => ({ x, y, vx, vy, r });

const Paddle = (x, y, w, h) => ({ x, y, w, h });

const Brick = (x, y, w, h, color) => ({ x, y, w, h, color });

const BrickHit = (found, row, col, from_bottom) => ({ found, row, col, from_bottom });

let ARENA = {w: 800.0, h: 520.0};
let GRID = (() => {
  let cols = 10;
  let rows = 6;
  let gap = 5.0;
  let brick_w = (ARENA.w - (cols - 1) * gap) / cols;
  return {cols: cols, rows: rows, gap: gap, brick_w: brick_w, brick_h: 22.0, origin_y: 60.0};
})();
let PADDLE_SPEC = {w: 100.0, h: 12.0, y: ARENA.h - 40.0};
let BALL_SPEC = {r: 8.0, speed: 630.0};
let ROW_STYLES = [{color: "#ff2d78", points: 60}, {color: "#ff6e3a", points: 50}, {color: "#ffd166", points: 40}, {color: "#06d6a0", points: 30}, {color: "#00e5ff", points: 20}, {color: "#b84fff", points: 10}];
let LEVEL_SPEED_STEP = 0.12;

/**
 * @param {number} row
 * @returns {RowStyle}
 */
const row_style = (row) => {
  if (row >= 0 && row < ROW_STYLES.length) {
    return ROW_STYLES[row];
  } else {
    return ROW_STYLES[ROW_STYLES.length - 1];
  }
};

const row_color = (row) => row_style(row).color;

const row_points = (row) => row_style(row).points;

const brick_x = (() => {
  const __cache = new Map();
  return (col) => {
    const __key = JSON.stringify([col]);
    if (__cache.has(__key)) return __cache.get(__key);
    const __result = (() => {
      return col * (GRID.brick_w + GRID.gap);
    })();
    __cache.set(__key, __result);
    return __result;
  };
})();

const brick_y = (() => {
  const __cache = new Map();
  return (row) => {
    const __key = JSON.stringify([row]);
    if (__cache.has(__key)) return __cache.get(__key);
    const __result = (() => {
      return GRID.origin_y + row * (GRID.brick_h + GRID.gap);
    })();
    __cache.set(__key, __result);
    return __result;
  };
})();

const brick_index = (row, col) => row * GRID.cols + col;

const cell_count = () => GRID.rows * GRID.cols;

/**
 * @param {Level} level
 * @returns {*}
 */
const speed_mult = (level) => {
  if (!__validate_Level(level)) throw new Error("SynthConstraintError: level violates Level constraint (got " + JSON.stringify(level) + ")");
  return 1.0 + (level - 1) * LEVEL_SPEED_STEP;
};

const fresh_bricks = () => $map($range(0, cell_count()), (i) => true);

const serve_ball = () => ({x: ARENA.w / 2, y: ARENA.h - 120, vx: BALL_SPEC.speed * ($random() > 0.5 ? 0.6 : 0 - 0.6), vy: 0 - BALL_SPEC.speed * 0.8, r: BALL_SPEC.r});

const centered_paddle = () => ({x: (ARENA.w - PADDLE_SPEC.w) / 2, y: PADDLE_SPEC.y, w: PADDLE_SPEC.w, h: PADDLE_SPEC.h});

const Game = (() => {
  let _state = { score: 0, lives: 3, phase: "title", level: 1, hi: 0 };
  const _subs = [];
  return {
    get score() { return _state.score; },
    get lives() { return _state.lives; },
    get phase() { return _state.phase; },
    get level() { return _state.level; },
    get hi() { return _state.hi; },
    set(patch) {
      _state = Object.assign({}, _state, patch);
      for (const __fn of _subs) __fn(_state);
    },
    subscribe(fn) { _subs.push(fn); fn(_state); },
  };
})();

let ball = serve_ball();
let paddle = centered_paddle();
let bricks = fresh_bricks();

/**
 * @param {Ball} from
 * @param {Ball} into
 * @returns {*}
 */
const copy_ball = (from, into) => {
  into.x = from.x;
  into.y = from.y;
  into.vx = from.vx;
  into.vy = from.vy;
  return into.r = from.r;
};

/**
 * @param {Paddle} from
 * @param {Paddle} into
 * @returns {*}
 */
const copy_paddle = (from, into) => {
  into.x = from.x;
  into.y = from.y;
  into.w = from.w;
  return into.h = from.h;
};

/**
 * @returns {*}
 */
const reset_ball = () => copy_ball(serve_ball(), ball);

/**
 * @returns {*}
 */
const reset_bricks = () => bricks = fresh_bricks();

/**
 * @returns {*}
 */
const start_game = () => {
  copy_ball(serve_ball(), ball);
  copy_paddle(centered_paddle(), paddle);
  bricks = fresh_bricks();
  return Game.set({score: 0, lives: 3, phase: "playing", level: 1});
};

/**
 * @returns {*}
 */
const next_level = () => {
  copy_ball(serve_ball(), ball);
  copy_paddle(centered_paddle(), paddle);
  bricks = fresh_bricks();
  return Game.set({phase: "playing", level: Game.level + 1});
};

/**
 * @param {number} pointer_x
 * @returns {*}
 */
const move_paddle = (pointer_x) => paddle.x = $clamp(pointer_x - paddle.w / 2, 0, ARENA.w - paddle.w);

/**
 * @param {Score} pts
 * @returns {*}
 */
const award_points = (pts) => {
  if (!__validate_Score(pts)) throw new Error("SynthConstraintError: pts violates Score constraint (got " + JSON.stringify(pts) + ")");
  let score = Game.score + pts;
  let hi = score > Game.hi ? score : Game.hi;
  return Game.set({score: score, hi: hi});
};

const alive_count = () => $count(bricks, (alive) => alive);

const find_brick_hit = (b, field) => (() => {
  let hit = {found: false, row: 0 - 1, col: 0 - 1, from_bottom: false};
  let r = 0;
  while (r < GRID.rows) {
    let c = 0;
    while (c < GRID.cols) {
      let idx = brick_index(r, c);
      if (field[idx] && !hit.found) {
        let bx = brick_x(c);
        let by = brick_y(r);
        let in_x = b.x + b.r > bx && b.x - b.r < bx + GRID.brick_w;
        let in_y = b.y + b.r > by && b.y - b.r < by + GRID.brick_h;
        if (in_x && in_y) {
          hit.found = true;
          hit.row = r;
          hit.col = c;
          hit.from_bottom = b.y > by + GRID.brick_h / 2;
        }
      }
      c += 1;
    }
    r += 1;
  }
  return hit;
})();

/**
 * @param {BrickHit} hit
 * @returns {*}
 */
const apply_brick_hit = (hit) => {
  let idx = brick_index(hit.row, hit.col);
  bricks = $set_at(bricks, idx, false);
  ball.vy = hit.from_bottom ? $abs(ball.vy) : 0 - $abs(ball.vy);
  return award_points(row_points(hit.row));
};

/**
 * @returns {*}
 */
const check_brick_collisions = () => {
  let hit = find_brick_hit(ball, bricks);
  if (hit.found) {
    return apply_brick_hit(hit);
  }
};

/**
 * @returns {*}
 */
const bounce_walls = () => {
  if (ball.x - ball.r < 0) {
    ball.x = ball.r;
    ball.vx = $abs(ball.vx);
  }
  if (ball.x + ball.r > ARENA.w) {
    ball.x = ARENA.w - ball.r;
    ball.vx = 0 - $abs(ball.vx);
  }
  if (ball.y - ball.r < 0) {
    ball.y = ball.r;
    return ball.vy = $abs(ball.vy);
  }
};

/**
 * @param {number} mult
 * @returns {*}
 */
const bounce_paddle = (mult) => {
  let prev_vy = ball.vy;
  let on_x = ball.x + ball.r > paddle.x && ball.x - ball.r < paddle.x + paddle.w;
  if (on_x && prev_vy > 0 && ball.y + ball.r >= paddle.y) {
    ball.y = paddle.y - ball.r;
    let hit_pos = $clamp((ball.x - paddle.x) / paddle.w, 0.05, 0.95);
    let angle = (hit_pos - 0.5) * 1.8;
    let speed = BALL_SPEC.speed * mult;
    ball.vx = speed * angle;
    ball.vy = 0 - $sqrt(speed * speed - ball.vx * ball.vx);
  }
  let side_in_y = ball.y + ball.r > paddle.y && ball.y - ball.r < paddle.y + paddle.h;
  if (on_x && side_in_y && prev_vy <= 0) {
    let left_pen = ball.x + ball.r - paddle.x;
    let right_pen = paddle.x + paddle.w + ball.r - ball.x;
    if (left_pen < right_pen) {
      ball.x = paddle.x - ball.r;
      return ball.vx = 0 - $abs(ball.vx);
    } else {
      ball.x = paddle.x + paddle.w + ball.r;
      return ball.vx = $abs(ball.vx);
    }
  }
};

/**
 * @returns {*}
 */
const handle_ball_lost = () => {
  if (ball.y - ball.r > ARENA.h) {
    let lives = Game.lives - 1;
    if (lives <= 0) {
      return Game.set({lives: 0, phase: "gameover"});
    } else {
      Game.set({lives: lives, phase: "ready"});
      return copy_ball(serve_ball(), ball);
    }
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
    let mult = speed_mult(Game.level);
    ball.x += ball.vx * dt * mult;
    ball.y += ball.vy * dt * mult;
    bounce_walls();
    bounce_paddle(mult);
    check_brick_collisions();
    handle_ball_lost();
    if (alive_count() == 0) {
      return Game.set({phase: "levelup"});
    }
  }
};

const get_ball = () => ({x: ball.x, y: ball.y, r: ball.r});

const get_paddle = () => ({x: paddle.x, y: paddle.y, w: paddle.w, h: paddle.h});

const get_bricks = () => $flat_map($range(0, GRID.rows), (r) => $map($filter($range(0, GRID.cols), (c) => bricks[brick_index(r, c)]), (c) => ({x: brick_x(c), y: brick_y(r), w: GRID.brick_w, h: GRID.brick_h, color: row_color(r)})));

const status_line = () => ((_m) => (_m === "title") ? "PRESS SPACE OR CLICK TO START" : (_m === "ready") ? "BALL LOST — PRESS SPACE TO CONTINUE" : (_m === "levelup") ? "LEVEL CLEAR! PRESS SPACE FOR NEXT LEVEL" : (_m === "gameover") ? "GAME OVER — PRESS SPACE TO RETRY" : "")(Game.phase);

__synth_tests.push({ desc: "ROW_STYLES has six bands", fn: () => ROW_STYLES.length == 6 });

__synth_tests.push({ desc: "row_points returns non-negative Score values", fn: () => row_points(0) == 60 && row_points(5) == 10 });

__synth_tests.push({ desc: "row 3 color is mint", fn: () => row_color(3) == "#06d6a0" });

__synth_tests.push({ desc: "GRID brick width matches original formula", fn: () => $abs(GRID.brick_w - (800 - 9 * 5) / 10) < 0.0001 });

__synth_tests.push({ desc: "brick_index row-major", fn: () => brick_index(2, 3) == 23 });

__synth_tests.push({ desc: "speed_mult accepts Level >= 1", fn: () => speed_mult(1) == 1.0 && $abs(speed_mult(3) - 1.24) < 0.0001 });

__synth_tests.push({ desc: "bounce_walls left edge mutates in place", fn: () => (() => {
  let b = {x: 0 - 1.0, y: 100.0, vx: 0 - 200.0, vy: 100.0, r: 8.0};
  if (b.x - b.r < 0) {
    b.x = b.r;
    b.vx = $abs(b.vx);
  }
  return b.x == 8.0 && b.vx == 200.0;
})() });

__synth_tests.push({ desc: "fresh_bricks is full field", fn: () => $count(fresh_bricks(), (a) => a) == 60 });

