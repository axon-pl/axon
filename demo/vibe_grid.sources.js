let catalog = [{
  id: 0,
  name: "Beat Box",
  icon: "🥁",
  base_cost: 15,
  rate: 0.1,
  desc: "Simple percussion"
}, {
  id: 1,
  name: "Drum Machine",
  icon: "🎛",
  base_cost: 100,
  rate: 0.5,
  desc: "Four-on-the-floor"
}, {
  id: 2,
  name: "Synthesizer",
  icon: "🎹",
  base_cost: 500,
  rate: 4.0,
  desc: "Analog wave generator"
}, {
  id: 3,
  name: "Vocoder",
  icon: "🎤",
  base_cost: 2000,
  rate: 10.0,
  desc: "Harmonic processor"
}, {
  id: 4,
  name: "Sequencer",
  icon: "⚡",
  base_cost: 8000,
  rate: 40.0,
  desc: "Pattern automation"
}, {
  id: 5,
  name: "Studio",
  icon: "🏠",
  base_cost: 30000,
  rate: 150.0,
  desc: "Full mixing suite"
}, {
  id: 6,
  name: "Label",
  icon: "💿",
  base_cost: 100000,
  rate: 500.0,
  desc: "Global distribution"
}];

/** @store Game — reactive state boundary (v0.8) */
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

const building_cost = (base_cost, owned) => synth_floor(base_cost * synth_pow(1.15, owned));

/**
 * @returns {*}
 */
const click = () => Game.set({ vibes: Game.vibes + 1, total_vibes: Game.total_vibes + 1 });

/**
 * @param {*} idx
 * @returns {*}
 */
const buy = (idx) => {
  let b = catalog[idx];
  let cost = building_cost(b.base_cost, Game.counts[idx]);
  if (Game.vibes >= cost) {
    let new_counts = synth_set_at(Game.counts, idx, Game.counts[idx] + 1);
    let new_vps = synth_sum_by(catalog, b => b.rate * new_counts[b.id]);
    return Game.set({ vibes: Game.vibes - cost, vps: new_vps, counts: new_counts });
  }
};

/**
 * @param {*} dt
 * @returns {*}
 */
const tick = (dt) => {
  let earned = Game.vps * dt;
  if (earned > 0) {
    return Game.set({ vibes: Game.vibes + earned, total_vibes: Game.total_vibes + earned });
  }
};

const fmt = (v) => v >= 1000000000 ? synth_floor(v / 1000000000) + "B" : v >= 1000000 ? synth_floor(v / 1000000) + "M" : v >= 1000 ? synth_floor(v / 1000) + "K" : synth_floor(v) + "";

/**
 * @returns {*}
 */
const milestone = () => {
  let tv = synth_floor(Game.total_vibes);
  return tv < 1 ? "Drop the beat..." : tv < 10 ? "Feeling the rhythm" : tv < 100 ? "Warming up the synths" : tv < 1000 ? "The groove is building" : tv < 10000 ? "Riding the wave" : tv < 100000 ? "This slaps hard" : "MAXIMUM VIBES";
};

/**
 * @param {*} b
 * @returns {*}
 */
const render_building = (b) => {
  let info = (() => {
    let owned = Game.counts[b.id];
    let cost = building_cost(b.base_cost, owned);
    let cls = Game.vibes >= cost ? "can-afford" : "";
    return { owned, cost, cls };
})();
  return "<div class=\"bld " + info.cls + "\" onclick=\"buy(" + b.id + ")\">" + "<span class=\"bld-icon\">" + b.icon + "</span>" + "<div class=\"bld-info\">" + "<div class=\"bld-name\">" + b.name + "</div>" + "<div class=\"bld-desc\">" + b.desc + " · " + b.rate + " v/s ea</div>" + "<div class=\"bld-cost\">⚡ " + fmt(info.cost) + " vibes</div>" + "</div>" + "<span class=\"bld-count\">" + info.owned + "</span>" + "</div>";
};

const total_owned = () => synth_fold(Game.counts, 0, (acc, n) => acc + n);

const best_building = () => synth_max_by(synth_filter(catalog, b => Game.counts[b.id] > 0), b => b.rate * Game.counts[b.id]);

/**
 * @returns {*}
 */
const render = () => {
  document.getElementById("vibes").textContent = fmt(Game.vibes);
  document.getElementById("vps").textContent = fmt(Game.vps) + " v/s";
  document.getElementById("total").textContent = fmt(Game.total_vibes) + " total";
  document.getElementById("msg").textContent = milestone();
  document.getElementById("owned").textContent = total_owned() + " producers";
  return document.getElementById("blds").innerHTML = synth_map(catalog, b => render_building(b)).join("");
};

Game.subscribe(() => {
  render();
});

