const Building = (id, name, icon, base_cost, rate, desc) => ({ id, name, icon, base_cost, rate, desc });

let CATALOG = [{id: 0, name: "Beat Box", icon: "🥁", base_cost: 15, rate: 0.1, desc: "Simple percussion"}, {id: 1, name: "Drum Machine", icon: "🎛", base_cost: 100, rate: 0.5, desc: "Four-on-the-floor"}, {id: 2, name: "Synthesizer", icon: "🎹", base_cost: 500, rate: 4.0, desc: "Analog wave generator"}, {id: 3, name: "Vocoder", icon: "🎤", base_cost: 2000, rate: 10.0, desc: "Harmonic processor"}, {id: 4, name: "Sequencer", icon: "⚡", base_cost: 8000, rate: 40.0, desc: "Pattern automation"}, {id: 5, name: "Studio", icon: "🏠", base_cost: 30000, rate: 150.0, desc: "Full mixing suite"}, {id: 6, name: "Label", icon: "💿", base_cost: 100000, rate: 500.0, desc: "Global distribution"}];

const Game = (() => {
  let _state = { vibes: 0, total_vibes: 0, vps: 0, counts: [0, 0, 0, 0, 0, 0, 0] };
  const _subs = [];
  return {
    get vibes() { return _state.vibes; },
    get total_vibes() { return _state.total_vibes; },
    get vps() { return _state.vps; },
    get counts() { return _state.counts; },
    set(patch) {
      _state = Object.assign({}, _state, patch);
      for (const __fn of _subs) __fn(_state);
    },
    subscribe(fn) { _subs.push(fn); fn(_state); },
  };
})();

const building_cost = (() => {
  const __cache = new Map();
  return (base_cost, owned) => {
    const __key = JSON.stringify([base_cost, owned]);
    if (__cache.has(__key)) return __cache.get(__key);
    const __result = (() => {
      return $floor(base_cost * $pow(1.15, owned));
    })();
    __cache.set(__key, __result);
    return __result;
  };
})();

const calc_vps = (counts) => $sum_by(CATALOG, (b) => b.rate * counts[b.id]);

/**
 * @returns {*}
 */
const click = () => Game.set({vibes: Game.vibes + 1, total_vibes: Game.total_vibes + 1});

/**
 * @param {number} idx
 * @returns {*}
 */
const buy = (idx) => {
  let b = CATALOG[idx];
  let cost = building_cost(b.base_cost, Game.counts[idx]);
  if (Game.vibes >= cost) {
    let new_counts = $set_at(Game.counts, idx, Game.counts[idx] + 1);
    return Game.set({vibes: Game.vibes - cost, vps: calc_vps(new_counts), counts: new_counts});
  }
};

/**
 * @param {number} dt
 * @returns {*}
 */
const tick = (dt) => {
  let earned = Game.vps * dt;
  if (earned > 0) {
    return Game.set({vibes: Game.vibes + earned, total_vibes: Game.total_vibes + earned});
  }
};

const fmt = (v) => v >= 1000_000_000 ? `${$floor(v / 1000_000_000)}B` : v >= 1000_000 ? `${$floor(v / 1000_000)}M` : v >= 1000 ? `${$floor(v / 1000)}K` : `${$floor(v)}`;

/**
 * @returns {string}
 */
const milestone = () => {
  let tv = $floor(Game.total_vibes);
  return tv < 1 ? "Drop the beat..." : tv < 10 ? "Feeling the rhythm" : tv < 100 ? "Warming up the synths" : tv < 1000 ? "The groove is building" : tv < 10000 ? "Riding the wave" : tv < 100000 ? "This slaps hard" : "MAXIMUM VIBES";
};

/**
 * @param {Building} b
 * @returns {string}
 */
const render_building = (b) => {
  let owned = Game.counts[b.id];
  let cost = building_cost(b.base_cost, owned);
  let cls = Game.vibes >= cost ? "can-afford" : "";
  return `<div class="bld ${cls}" onclick="buy(${b.id})">
    <span class="bld-icon">${b.icon}</span>
    <div class="bld-info">
      <div class="bld-name">${b.name}</div>
      <div class="bld-desc">${b.desc} · ${b.rate} v/s ea</div>
      <div class="bld-cost">⚡ ${fmt(cost)} vibes</div>
    </div>
    <span class="bld-count">${owned}</span>
  </div>`;
};

const total_owned = () => $fold(Game.counts, 0, (acc, n) => acc + n);

const best_building = () => $max_by($filter(CATALOG, (b) => Game.counts[b.id] > 0), (b) => b.rate * Game.counts[b.id]);

/**
 * @returns {*}
 */
const render = () => {
  document.getElementById("vibes").textContent = fmt(Game.vibes);
  document.getElementById("vps").textContent = `${fmt(Game.vps)} v/s`;
  document.getElementById("total").textContent = `${fmt(Game.total_vibes)} total`;
  document.getElementById("msg").textContent = milestone();
  document.getElementById("owned").textContent = `${total_owned()} producers`;
  return document.getElementById("blds").innerHTML = $map(CATALOG, (b) => render_building(b)).join("");
};

Game.subscribe(() => (() => {
  render();
})());
