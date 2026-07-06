let CANVAS_W = 800;
let CANVAS_H = 520;
let LANE_COUNT = 3;
let LANE_W = 120;
let ROAD_W = LANE_W * LANE_COUNT;
let ROAD_X = (CANVAS_W - ROAD_W) / 2;
let CAR_W = 54;
let CAR_H = 90;
let PLAYER_Y = CANVAS_H - 130;
let SPAWN_Y = 0 - CAR_H;

/** @store Game — reactive state boundary (v0.8) */
const Game = (() => {
  let _state = { score: 0, hi: 0, lives: 3, phase: "title", speed: 220.0 };
  const _subs = [];
  return {
    get score() { return _state.score; },
    get hi() { return _state.hi; },
    get lives() { return _state.lives; },
    get phase() { return _state.phase; },
    get speed() { return _state.speed; },
    set(patch) {
      _state = Object.assign({}, _state, patch);
      for (const __fn of _subs) __fn(_state);
    },
    subscribe(fn) { _subs.push(fn); fn(_state); },
  };
})();

let player_lane = 1;
let player_target = 1;
let player_x = ROAD_X + LANE_W + (LANE_W - CAR_W) / 2;
let traffic = [];
let road_scroll = 0.0;
let spawn_timer = 0.0;
let invuln_timer = 0.0;

const lane_x = (lane) => ROAD_X + lane * LANE_W + (LANE_W - CAR_W) / 2;

const car_color = (seed) => ((_m) => (_m === 0) ? "#ff2d78" : (_m === 1) ? "#ff6e3a" : (_m === 2) ? "#ffd166" : "#b84fff")($floor(seed * 4));

const car_label = (seed) => ((_m) => (_m === 0) ? "SEDAN" : (_m === 1) ? "COUPE" : "TRUCK")($floor(seed * 3));

/**
 * @returns {*}
 */
const start_game = () => {
  player_lane = 1;
  player_target = 1;
  player_x = lane_x(1);
  traffic = [];
  road_scroll = 0.0;
  spawn_timer = 0.0;
  invuln_timer = 0.0;
  return Game.set({ score: 0, lives: 3, phase: "playing", speed: 220.0 });
};

/**
 * @returns {*}
 */
const move_left = () => {
  if (player_target > 0) {
    return player_target = player_target - 1;
  }
};

/**
 * @returns {*}
 */
const move_right = () => {
  if (player_target < LANE_COUNT - 1) {
    return player_target = player_target + 1;
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
    let speed = Game.speed;
    road_scroll = road_scroll + speed * dt;
    let tx = lane_x(player_target);
    let diff = tx - player_x;
    let step = diff * $clamp(dt * 12.0, 0.0, 1.0);
    player_x = player_x + step;
    if ($abs(diff) < 1.5) {
      player_x = tx;
      player_lane = player_target;
    }
    traffic = $filter($map(traffic, c => (() => {
      let x = c.x;
      let y = c.y + speed * dt;
      let color = c.color;
      let seed = c.seed;
      return { x, y, color, seed };
})()), c => c.y < CANVAS_H + CAR_H + 20);
    spawn_timer = spawn_timer + dt;
    let interval = $clamp(1.6 - speed * 0.0025, 0.35, 1.6);
    if (spawn_timer >= interval) {
      spawn_timer = 0.0;
      let lane = $floor($random() * LANE_COUNT);
      let seed = $random();
      let color = car_color(seed);
      traffic = [...traffic, { x: lane_x(lane), y: SPAWN_Y, color, seed }];
    }
    invuln_timer = invuln_timer - dt;
    if (invuln_timer <= 0) {
      let px = player_x;
      let py = PLAYER_Y;
      let hit = $any(traffic, c => $abs(c.x - px) < CAR_W - 8 && $abs(c.y - py) < CAR_H - 16);
      if (hit) {
        let nl = Game.lives - 1;
        invuln_timer = 1.8;
        traffic = $filter(traffic, c => $abs(c.x - px) >= CAR_W - 8 || $abs(c.y - py) >= CAR_H - 16);
        if (nl <= 0) {
          Game.set({ lives: 0, phase: "gameover" });
        } else {
          Game.set({ lives: nl });
        }
      }
    }
    let new_speed = speed + dt * 6.0;
    let cap_speed = new_speed < 560.0 ? new_speed : 560.0;
    let pts = $floor(speed * dt * 0.08);
    let new_score = Game.score + pts;
    let new_hi = new_score > Game.hi ? new_score : Game.hi;
    return Game.set({ speed: cap_speed, score: new_score, hi: new_hi });
  }
};

const get_player = () => ({ x: player_x, y: PLAYER_Y, w: CAR_W, h: CAR_H });

const get_traffic = () => traffic;

const get_road_scroll = () => road_scroll;

const get_road = () => ({ x: ROAD_X, w: ROAD_W, lane_w: LANE_W, lanes: LANE_COUNT });

const get_invuln = () => invuln_timer > 0;

