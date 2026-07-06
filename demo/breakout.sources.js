let CANVAS_W = 800;

let CANVAS_H = 520;

let COLS = 10;

let ROWS = 6;

let BRICK_GAP = 5;

let BRICK_W = (CANVAS_W - (COLS - 1) * BRICK_GAP) / COLS;

let BRICK_H = 22;

let PADDLE_W = 100;

let PADDLE_H = 12;

let BALL_R = 8;

let PADDLE_Y = CANVAS_H - 40;

let BALL_SPEED = 630;

const row_color = (row) => ((_m) => (_m === 0) ? "#ff2d78" : (_m === 1) ? "#ff6e3a" : (_m === 2) ? "#ffd166" : (_m === 3) ? "#06d6a0" : (_m === 4) ? "#00e5ff" : "#b84fff")(row);

const row_points = (row) => ((_m) => (_m === 0) ? 60 : (_m === 1) ? 50 : (_m === 2) ? 40 : (_m === 3) ? 30 : (_m === 4) ? 20 : 10)(row);

/** @store Game — reactive state boundary (v0.8) */
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

let ball_x = CANVAS_W / 2;

let ball_y = CANVAS_H / 2;

let ball_vx = BALL_SPEED * 0.6;

let ball_vy = 0 - BALL_SPEED * 0.8;

let paddle_x = (CANVAS_W - PADDLE_W) / 2;

let bricks = synth_map(synth_range(0, ROWS * COLS), i => true);

const brick_x = (col) => col * (BRICK_W + BRICK_GAP);

const brick_y = (row) => 60 + row * (BRICK_H + BRICK_GAP);

const brick_index = (row, col) => row * COLS + col;

const alive_count = () => synth_count(bricks, alive => alive);

/**
 * @returns {*}
 */
const reset_ball = () => {
  ball_x = CANVAS_W / 2;
  ball_y = CANVAS_H - 120;
  ball_vx = BALL_SPEED * (synth_random() > 0.5 ? 0.6 : 0 - 0.6);
  return ball_vy = 0 - BALL_SPEED * 0.8;
};

/**
 * @returns {*}
 */
const reset_bricks = () => bricks = synth_map(synth_range(0, ROWS * COLS), i => true);

/**
 * @returns {*}
 */
const start_game = () => {
  reset_ball();
  reset_bricks();
  paddle_x = (CANVAS_W - PADDLE_W) / 2;
  return Game.set({ score: 0, lives: 3, phase: "playing", level: 1 });
};

/**
 * @returns {*}
 */
const next_level = () => {
  reset_ball();
  reset_bricks();
  paddle_x = (CANVAS_W - PADDLE_W) / 2;
  let new_level = Game.level + 1;
  return Game.set({ phase: "playing", level: new_level });
};

/**
 * @param {*} x
 * @returns {*}
 */
const move_paddle = (x) => paddle_x = synth_clamp(x - PADDLE_W / 2, 0, CANVAS_W - PADDLE_W);

/**
 * @returns {*}
 */
const check_brick_collisions = () => {
  let hit_row = 0 - 1;
  let hit_col = 0 - 1;
  let hit_from_bottom = false;
  let r = 0;
  while (r < ROWS) {
    let c = 0;
    while (c < COLS) {
      let idx = brick_index(r, c);
      if (bricks[idx]) {
        let bx = brick_x(c);
        let by = brick_y(r);
        let in_x = ball_x + BALL_R > bx && ball_x - BALL_R < bx + BRICK_W;
        let in_y = ball_y + BALL_R > by && ball_y - BALL_R < by + BRICK_H;
        if (in_x && in_y && hit_row < 0) {
          hit_row = r;
          hit_col = c;
          let ball_mid_y = ball_y;
          hit_from_bottom = ball_mid_y > by + BRICK_H / 2;
        }
      }
      c += 1;
    }
    r += 1;
  }
  if (hit_row >= 0) {
    let idx = brick_index(hit_row, hit_col);
    bricks = synth_set_at(bricks, idx, false);
    ball_vy = hit_from_bottom ? synth_abs(ball_vy) : 0 - synth_abs(ball_vy);
    let pts = row_points(hit_row);
    let new_score = Game.score + pts;
    let new_hi = new_score > Game.hi ? new_score : Game.hi;
    Game.set({ score: new_score, hi: new_hi });
    return true;
  } else {
    return false;
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
    let speed_mult = 1.0 + (Game.level - 1) * 0.12;
    ball_x += ball_vx * dt * speed_mult;
    ball_y += ball_vy * dt * speed_mult;
    if (ball_x - BALL_R < 0) {
      ball_x = BALL_R;
      ball_vx = synth_abs(ball_vx);
    }
    if (ball_x + BALL_R > CANVAS_W) {
      ball_x = CANVAS_W - BALL_R;
      ball_vx = 0 - synth_abs(ball_vx);
    }
    if (ball_y - BALL_R < 0) {
      ball_y = BALL_R;
      ball_vy = synth_abs(ball_vy);
    }
    let prev_vy = ball_vy;
    let on_paddle_x = ball_x + BALL_R > paddle_x && ball_x - BALL_R < paddle_x + PADDLE_W;
    if (on_paddle_x && prev_vy > 0 && ball_y + BALL_R >= PADDLE_Y) {
      ball_y = PADDLE_Y - BALL_R;
      let hit_pos = synth_clamp((ball_x - paddle_x) / PADDLE_W, 0.05, 0.95);
      let angle = (hit_pos - 0.5) * 1.8;
      let speed = BALL_SPEED * speed_mult;
      ball_vx = speed * angle;
      ball_vy = 0 - synth_sqrt(speed * speed - ball_vx * ball_vx);
    }
    let side_in_y = ball_y + BALL_R > PADDLE_Y && ball_y - BALL_R < PADDLE_Y + PADDLE_H;
    if (on_paddle_x && side_in_y && prev_vy <= 0) {
      let left_pen = ball_x + BALL_R - paddle_x;
      let right_pen = paddle_x + PADDLE_W + BALL_R - ball_x;
      if (left_pen < right_pen) {
        ball_x = paddle_x - BALL_R;
        ball_vx = 0 - synth_abs(ball_vx);
      } else {
        ball_x = paddle_x + PADDLE_W + BALL_R;
        ball_vx = synth_abs(ball_vx);
      }
    }
    check_brick_collisions();
    if (ball_y - BALL_R > CANVAS_H) {
      let new_lives = Game.lives - 1;
      if (new_lives <= 0) {
        Game.set({ lives: 0, phase: "gameover" });
      } else {
        Game.set({ lives: new_lives, phase: "ready" });
        reset_ball();
      }
    }
    if (alive_count() == 0) {
      return Game.set({ phase: "levelup" });
    }
  }
};

const get_ball = () => ({ x: ball_x, y: ball_y, r: BALL_R });

const get_paddle = () => ({ x: paddle_x, y: PADDLE_Y, w: PADDLE_W, h: PADDLE_H });

const get_bricks = () => synth_flat_map(synth_range(0, ROWS), r => synth_map(synth_filter(synth_range(0, COLS), c => bricks[brick_index(r, c)]), c => (() => {
  let color = row_color(r);
  return { x: brick_x(c), y: brick_y(r), w: BRICK_W, h: BRICK_H, color };
})()));

const status_line = () => ((_m) => (_m === "title") ? "PRESS SPACE OR CLICK TO START" : (_m === "ready") ? "BALL LOST — PRESS SPACE TO CONTINUE" : (_m === "levelup") ? "LEVEL CLEAR! PRESS SPACE FOR NEXT LEVEL" : (_m === "gameover") ? "GAME OVER — PRESS SPACE TO RETRY" : "")(Game.phase);

