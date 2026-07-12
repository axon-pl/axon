const Arena = (w, h, lane_count, lane_w, road_w, road_x, car_w, car_h, player_y, spawn_y) => ({ w, h, lane_count, lane_w, road_w, road_x, car_w, car_h, player_y, spawn_y });

const Car = (x, y, color, seed) => ({ x, y, color, seed });

const Player = (lane, target, x) => ({ lane, target, x });

const Session = (road_scroll, spawn_timer, invuln_timer, score_accum) => ({ road_scroll, spawn_timer, invuln_timer, score_accum });

let ARENA = (() => {
  let w = 800.0;
  let h = 520.0;
  let lane_count = 3;
  let lane_w = 120.0;
  let road_w = lane_w * lane_count;
  let road_x = (w - road_w) / 2.0;
  let car_w = 54.0;
  let car_h = 90.0;
  return {w: w, h: h, lane_count: lane_count, lane_w: lane_w, road_w: road_w, road_x: road_x, car_w: car_w, car_h: car_h, player_y: h - 130.0, spawn_y: 0.0 - car_h};
})();
let CAR_COLORS = ["#ff2d78", "#ff6e3a", "#ffd166", "#b84fff"];
let CAR_LABELS = ["SEDAN", "COUPE", "TRUCK"];

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

let player = {lane: 1, target: 1, x: ARENA.road_x + ARENA.lane_w + (ARENA.lane_w - ARENA.car_w) / 2.0};
let session = {road_scroll: 0.0, spawn_timer: 0.0, invuln_timer: 0.0, score_accum: 0.0};
let traffic = [];

const lane_x = (() => {
  const __cache = new Map();
  return (lane) => {
    const __key = JSON.stringify([lane]);
    if (__cache.has(__key)) return __cache.get(__key);
    const __result = (() => {
      return ARENA.road_x + lane * ARENA.lane_w + (ARENA.lane_w - ARENA.car_w) / 2.0;
    })();
    __cache.set(__key, __result);
    return __result;
  };
})();

const car_color = (seed) => CAR_COLORS[$floor(seed * 4)];

const car_label = (seed) => CAR_LABELS[$floor(seed * 3)];

const overlaps_player = (c, px, py) => $abs(c.x - px) < ARENA.car_w - 8.0 && $abs(c.y - py) < ARENA.car_h - 16.0;

/**
 * @returns {*}
 */
const start_game = () => {
  player.lane = 1;
  player.target = 1;
  player.x = lane_x(1);
  traffic = [];
  session.road_scroll = 0.0;
  session.spawn_timer = 0.0;
  session.invuln_timer = 0.0;
  session.score_accum = 0.0;
  return Game.set({score: 0, lives: 3, phase: "playing", speed: 220.0});
};

/**
 * @returns {*}
 */
const move_left = () => {
  if (player.target > 0) {
    return player.target = player.target - 1;
  }
};

/**
 * @returns {*}
 */
const move_right = () => {
  if (player.target < ARENA.lane_count - 1) {
    return player.target = player.target + 1;
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
    let speed = Game.speed;
    session.road_scroll = session.road_scroll + speed * dt;
    let tx = lane_x(player.target);
    let diff = tx - player.x;
    let step = diff * $clamp(dt * 12.0, 0.0, 1.0);
    player.x = player.x + step;
    if ($abs(diff) < 1.5) {
      player.x = tx;
      player.lane = player.target;
    }
    traffic = $filter($map(traffic, (c) => ({...c, y: c.y + speed * dt})), (c) => c.y < ARENA.h + ARENA.car_h + 20.0);
    session.spawn_timer = session.spawn_timer + dt;
    let interval = $clamp(1.6 - speed * 0.0025, 0.35, 1.6);
    if (session.spawn_timer >= interval) {
      session.spawn_timer = 0.0;
      let lane = $floor($random() * ARENA.lane_count);
      let seed = $random();
      traffic = [...traffic, {x: lane_x(lane), y: ARENA.spawn_y, color: car_color(seed), seed: seed}];
    }
    session.invuln_timer = session.invuln_timer - dt;
    if (session.invuln_timer <= 0.0) {
      let px = player.x;
      let py = ARENA.player_y;
      let hit = $any(traffic, (c) => overlaps_player(c, px, py));
      if (hit) {
        let nl = Game.lives - 1;
        session.invuln_timer = 1.8;
        traffic = $filter(traffic, (c) => !overlaps_player(c, px, py));
        if (nl <= 0) {
          Game.set({lives: 0, phase: "gameover"});
        } else {
          Game.set({lives: nl});
        }
      }
    }
    let new_speed = speed + dt * 6.0;
    let cap_speed = new_speed < 560.0 ? new_speed : 560.0;
    session.score_accum = session.score_accum + speed * dt * 0.08;
    let pts = $floor(session.score_accum);
    session.score_accum = session.score_accum - pts;
    let new_score = Game.score + pts;
    let new_hi = new_score > Game.hi ? new_score : Game.hi;
    return Game.set({speed: cap_speed, score: new_score, hi: new_hi});
  }
};

const get_player = () => ({x: player.x, y: ARENA.player_y, w: ARENA.car_w, h: ARENA.car_h});

const get_traffic = () => traffic;

const get_road_scroll = () => session.road_scroll;

const get_road = () => ({x: ARENA.road_x, w: ARENA.road_w, lane_w: ARENA.lane_w, lanes: ARENA.lane_count});

const get_invuln = () => session.invuln_timer > 0.0;

