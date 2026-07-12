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



const Kingdom = (() => {
  let _state = { day: 1, season: "spring", weather: "clear", events: [], running: false, speed: 900 };
  const _subs = [];
  return {
    get day() { return _state.day; },
    get season() { return _state.season; },
    get weather() { return _state.weather; },
    get events() { return _state.events; },
    get running() { return _state.running; },
    get speed() { return _state.speed; },
    set(patch) {
      _state = Object.assign({}, _state, patch);
      for (const __fn of _subs) __fn(_state);
    },
    subscribe(fn) { _subs.push(fn); fn(_state); },
  };
})();

/**
 * @param {number} day
 * @returns {string}
 */
const season_for = (day) => {
  let idx = Math.floor(day / 91) % 4;
  if (idx == 0) {
    return "spring";
  } else if (idx == 1) {
    return "summer";
  } else if (idx == 2) {
    return "autumn";
  } else {
    return "winter";
  }
};

/**
 * @param {number} day
 * @param {string} season
 * @returns {string}
 */
const weather_for = (day, season) => {
  let seed = (day * 2654435761 + 7) % 100;
  return ((_m) => (_m === "winter") ? seed < 45 ? "snow" : seed < 75 ? "frost" : "blizzard" : (_m === "summer") ? seed < 50 ? "clear" : seed < 80 ? "haze" : "drought" : (_m === "spring") ? seed < 40 ? "rain" : seed < 70 ? "clear" : "fog" : seed < 50 ? "clear" : "cloudy")(season);
};

let EVENT_LINES = ["A merchant caravan arrived bearing exotic spices from the east", "The blacksmith forged a blade of legendary steel by moonlight", "Scouts reported strange lights dancing in the northern woods", "The harvest exceeded all expectations — granaries overflow", "A traveling bard performed forgotten tales of the old wars", "The council ratified sweeping new trade agreements", "A dragon silhouette crossed the mountain pass at dusk", "The healers guild opened their doors to the poor and sick", "A grand feast was held in the great keep", "The watchtower bell rang out — riders approach the gates", "A stranger arrived at the inn bearing an unusual map", "The kingdom's coffers swelled with a fresh tax levy", "A temple ceremony drew pilgrims from distant lands", "The royal astronomers charted a new comet in the sky", "Border skirmishes erupted along the eastern frontier", "A mysterious plague struck the livestock in the valley", "The mages guild completed their great tower after ten years", "Refugees from the southern war sought shelter at the gates", "The king's champion defeated a challenger in the arena", "An ancient ruin was uncovered beneath the city streets", "The river flooded, sweeping away the old mill bridge", "A new vein of silver was struck deep in the mountain mines", "The thieves guild was dismantled in a midnight raid", "A diplomatic envoy arrived bearing gifts from the northern court", "The royal library received a shipment of forbidden tomes", "A giant wolf was spotted prowling the outer farms at night", "The shipwrights launched the kingdom's greatest warship", "Rebels were routed at the crossroads by the royal guard", "The old hermit of the forest gave a cryptic prophecy", "A fire broke out in the merchant quarter before dawn", "The queen's advisor was found dead under strange circumstances", "A jousting tournament drew nobles from across the realm", "The harvest festival filled the streets with song and light", "An earthquake cracked the citadel's eastern wall", "The salt trade was monopolized by a powerful merchant guild", "A pair of white ravens delivered a message from unknown lands", "The alchemists produced a metal harder than iron", "Three knights went missing on the road to the eastern chapel", "The aqueduct burst, flooding the lower district for three days", "A peace treaty was signed after years of border conflict", "The master cartographer unveiled a new map of the known world", "Wolves descended from the highlands and raided the sheepfolds", "The new bridge over the river was dedicated with celebration", "A shipment of rare dyes arrived from across the sea", "The crown prince returned from his grand tour of the realm", "An arcane storm twisted the weather for seven strange days", "The miners uncovered a sealed vault deep beneath the old fort", "A wandering knight pledged their sword to the kingdom's cause", "The census revealed the kingdom's population had doubled", "A plague of locusts devoured three fields before being driven off", "The arena hosted its grandest gladiatorial spectacle in years", "A child was born under a double rainbow — heralded as blessed", "The nomads of the plains offered tribute and asked for alliance", "A mysterious ship docked at port bearing no flag and no crew", "The court jester was arrested for revealing a royal secret", "A new road was completed linking the capital to the coast", "The royal hound returned alone after weeks missing in the wilds", "Bandits seized the northern pass, demanding toll from travellers", "The cathedral bells rang without any hand to pull the ropes", "An ambassador demanded reparations for last season's raid", "The council voted to expand the city walls to the river", "The old oracle emerged from solitude and spoke of change", "Three merchant ships were lost in the straits in one night"];
let SEASON_ICONS = [{id: "spring", icon: "🌸"}, {id: "summer", icon: "☀️"}, {id: "autumn", icon: "🍂"}, {id: "winter", icon: "❄️"}];
let WEATHER_ICONS = [{id: "clear", icon: "☀️"}, {id: "rain", icon: "🌧"}, {id: "snow", icon: "❄️"}, {id: "fog", icon: "🌫"}, {id: "frost", icon: "🧊"}, {id: "haze", icon: "🌫"}, {id: "blizzard", icon: "🌨"}, {id: "drought", icon: "🌵"}];

/**
 * @param {number} day
 * @param {string} weather
 * @returns {string}
 */
const event_for = (day, weather) => {
  let seed = (day * 1103515245 + 12345) % 64;
  let base = seed < EVENT_LINES.length ? EVENT_LINES[seed] : "The kingdom rested in an unusual quiet";
  return ((_m) => (_m === "snow") ? `${base} — braving the heavy snowfall` : (_m === "rain") ? `${base} — beneath relentless rain` : (_m === "drought") ? `${base} — under the scorching drought` : (_m === "blizzard") ? `${base} — through a raging blizzard` : (_m === "frost") ? `${base} — as frost crept across the stone` : (_m === "fog") ? `${base} — shrouded in thick morning fog` : (_m === "haze") ? `${base} — under a hazy, oppressive sky` : base)(weather);
};

/**
 * @param {string} season
 * @returns {string}
 */
const season_icon = (season) => {
  let hit = $find(SEASON_ICONS, (s) => s.id == season);
  return hit ? hit.icon : "🌍";
};

/**
 * @param {string} weather
 * @returns {string}
 */
const weather_icon = (weather) => {
  let hit = $find(WEATHER_ICONS, (w) => w.id == weather);
  return hit ? hit.icon : "🌤";
};

/**
 * @returns {*}
 */
const tick = async () => {
  if (!Kingdom.running) {
    return undefined;
  }
  let next_day = Kingdom.day + 1;
  let next_season = season_for(next_day);
  let next_weather = weather_for(next_day, next_season);
  let event = event_for(next_day, next_weather);
  let prev = Kingdom.events;
  let next_events = [event, ...prev].slice(0, 10);
  Kingdom.set({day: next_day, season: next_season, weather: next_weather, events: next_events});
  await $delay(Kingdom.speed);
  tick();
  return undefined;
};

/**
 * @returns {*}
 */
const start = () => {
  Kingdom.set({running: true, events: []});
  tick();
  return undefined;
};

/**
 * @returns {*}
 */
const pause = () => Kingdom.set({running: false});

/**
 * @param {number} ms
 * @returns {*}
 */
const set_speed = (ms) => Kingdom.set({speed: ms});

/**
 * @returns {*}
 */
const render = () => {
  let day = Kingdom.day;
  let season = Kingdom.season;
  let weather = Kingdom.weather;
  let events = Kingdom.events;
  let running = Kingdom.running;
  document.getElementById("chr-header").innerHTML = `${season_icon(season)} ${season} &nbsp;·&nbsp; ${weather_icon(weather)} ${weather}`;
  document.getElementById("chr-day").textContent = `Day ${day}`;
  document.getElementById("chr-log").innerHTML = $map(events, (e) => `<div class="chr-entry">${e}</div>`).join("");
  document.getElementById("chr-status").textContent = running ? "● RUNNING" : "○ PAUSED";
  return document.getElementById("chr-status").className = `chr-status ${running ? "running" : "paused"}`;
};

Kingdom.subscribe(() => (() => {
  render();
})());
