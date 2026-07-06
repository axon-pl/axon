/** @store Fleet — reactive state boundary (v0.8) */
const Fleet = (() => {
  let _state = { sector: "All", max_danger: 5, sort_key: "distance" };
  const _subs = [];
  return {
    get sector() { return _state.sector; },
    get max_danger() { return _state.max_danger; },
    get sort_key() { return _state.sort_key; },
    set(patch) {
      _state = Object.assign({}, _state, patch);
      for (const __fn of _subs) __fn(_state);
    },
    subscribe(fn) { _subs.push(fn); fn(_state); },
  };
})();

let alpha_wing = [{
  id: 1,
  name: "Vanguard",
  sector: "Kepler",
  danger: 2,
  distance: 14,
  ore: 80,
  fuel: 60,
  data: 40
}, {
  id: 2,
  name: "Ironclad",
  sector: "Kepler",
  danger: 3,
  distance: 22,
  ore: 120,
  fuel: 45,
  data: 20
}, {
  id: 3,
  name: "Phantom",
  sector: "Kepler",
  danger: 4,
  distance: 31,
  ore: 200,
  fuel: 30,
  data: 90
}, {
  id: 4,
  name: "Warden",
  sector: "Kepler",
  danger: 1,
  distance: 9,
  ore: 35,
  fuel: 100,
  data: 25
}];

let beta_wing = [{
  id: 5,
  name: "Horizon",
  sector: "Proxima",
  danger: 1,
  distance: 8,
  ore: 40,
  fuel: 90,
  data: 70
}, {
  id: 6,
  name: "Spectre",
  sector: "Proxima",
  danger: 2,
  distance: 17,
  ore: 65,
  fuel: 75,
  data: 55
}, {
  id: 7,
  name: "Nomad",
  sector: "Proxima",
  danger: 5,
  distance: 44,
  ore: 310,
  fuel: 20,
  data: 150
}, {
  id: 8,
  name: "Relay",
  sector: "Helios",
  danger: 1,
  distance: 5,
  ore: 20,
  fuel: 110,
  data: 30
}, {
  id: 9,
  name: "Tempest",
  sector: "Helios",
  danger: 3,
  distance: 28,
  ore: 90,
  fuel: 40,
  data: 80
}, {
  id: 10,
  name: "Nexus",
  sector: "Helios",
  danger: 4,
  distance: 37,
  ore: 175,
  fuel: 25,
  data: 120
}, {
  id: 11,
  name: "Harbinger",
  sector: "Vega",
  danger: 2,
  distance: 19,
  ore: 55,
  fuel: 85,
  data: 45
}, {
  id: 12,
  name: "Pilgrim",
  sector: "Vega",
  danger: 3,
  distance: 25,
  ore: 110,
  fuel: 50,
  data: 65
}, {
  id: 13,
  name: "Sentinel",
  sector: "Vega",
  danger: 5,
  distance: 52,
  ore: 280,
  fuel: 15,
  data: 200
}];

let fleet = [...alpha_wing, ...beta_wing];

const danger_label = (n) => ((_m) => (_m === 1) ? "Safe" : (_m === 2) ? "Low" : (_m === 3) ? "Moderate" : (_m === 4) ? "High" : "Critical")(n);

const danger_cls = (n) => ((_m) => (_m === 1) ? "safe" : (_m === 2) ? "low" : (_m === 3) ? "mod" : (_m === 4) ? "high" : "crit")(n);

const mission_summary = (name, sector, danger) => ({ name, sector, danger });

/**
 * @returns {*}
 */
const visible_missions = () => {
  let sector = Fleet.sector;
  let max_danger = Fleet.max_danger;
  let sort_key = Fleet.sort_key;
  let filtered = synth_filter(fleet, m => sector == "All" || m.sector == sector && m.danger <= max_danger);
  return ((_m) => (_m === "distance") ? synth_sort_by(filtered, m => m.distance) : (_m === "danger") ? synth_sort_by(filtered, m => m.danger) : (_m === "ore") ? synth_sort_by_desc(filtered, m => m.ore) : (_m === "data") ? synth_sort_by_desc(filtered, m => m.data) : filtered)(sort_key);
};

/**
 * @param {*} missions
 * @returns {*}
 */
const fleet_stats = (missions) => {
  return (() => {
  let n = synth_count(missions);
  let ore = synth_sum_by(missions, m => m.ore);
  let fuel = synth_sum_by(missions, m => m.fuel);
  let data = synth_sum_by(missions, m => m.data);
  let sum_d = synth_sum_by(missions, m => m.danger);
  let avg_d = n > 0 ? Math.round(sum_d * 10 / n) / 10 : 0;
  let max_dist = n > 0 ? synth_max_by(missions, m => m.distance).distance : 0;
  let danger4 = synth_filter(missions, m => m.danger >= 4);
  let high_risk = synth_count(danger4);
  return { count: n, ore, fuel, data, avg_d, max_dist, high_risk };
})();
};

/**
 * @param {*} m
 * @returns {string}
 */
const render_card = (m) => {
  let cls = danger_cls(m.danger);
  let label = danger_label(m.danger);
  return "<div class=\"mc\">" + "<div class=\"mc-top\">" + "<span class=\"mc-name\">" + m.name + "</span>" + "<span class=\"mc-badge " + cls + "\">" + label + "</span>" + "</div>" + "<div class=\"mc-sector\">" + m.sector + " Sector</div>" + "<div class=\"mc-row\">" + "<span class=\"mc-stat s-dist\">📡 " + m.distance + " ly</span>" + "<span class=\"mc-stat s-ore\">⛏ " + m.ore + "</span>" + "<span class=\"mc-stat s-fuel\">⚡ " + m.fuel + "</span>" + "<span class=\"mc-stat s-data\">💾 " + m.data + "</span>" + "</div>" + "</div>";
};

/**
 * @returns {*}
 */
const render = () => {
  let missions = visible_missions();
  let s = fleet_stats(missions);
  document.getElementById("grid").innerHTML = synth_count(missions) > 0 ? synth_map(missions, m => render_card(m)).join("") : "<div class=\"empty-state\">No missions match the current filters.</div>";
  document.getElementById("stat-count").textContent = s.count;
  document.getElementById("stat-ore").textContent = s.ore;
  document.getElementById("stat-fuel").textContent = s.fuel;
  document.getElementById("stat-data").textContent = s.data;
  document.getElementById("stat-avgd").textContent = s.avg_d;
  document.getElementById("stat-dist").textContent = s.max_dist + " ly";
  document.getElementById("stat-risk").textContent = s.high_risk;
  return document.getElementById("fleet-total").textContent = s.count + " of " + synth_count(fleet) + " missions";
};

Fleet.subscribe(() => {
  render();
});

