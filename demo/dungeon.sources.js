



/** @typedef {{
 *   level: number,
 *   seed: number,
 *   rows: number,
 *   cols: number
 * }} AppState
 */
const AppState = (level, seed, rows, cols) => ({ level, seed, rows, cols });

/**
 * @returns {AppState}
 */
const init = () => ({ level: 1, seed: 7777, rows: 22, cols: 48 });

const next_seed = (s) => (s * 6364136 + 1442695) % 9007199254740991;

/**
 * @param {AppState} s
 * @returns {AppState}
 */
const new_map = (s) => ({ level: s.level, seed: next_seed(s.seed), rows: s.rows, cols: s.cols });

/**
 * @param {AppState} s
 * @returns {AppState}
 */
const go_next = (s) => ({ level: s.level + 1, seed: next_seed(s.seed), rows: s.rows, cols: s.cols });

/**
 * @param {AppState} s
 * @returns {AppState}
 */
const go_prev = (s) => ({ level: s.level - 1, seed: next_seed(s.seed), rows: s.rows, cols: s.cols });

/**
 * @param {number} level
 * @param {number} seed
 * @returns {string}
 */
const map_name = (level, seed) => {
  let adj = ["Sunken", "Flooded", "Forgotten", "Ancient", "Crumbling", "Darkened", "Shattered", "Cursed", "Hollow", "Ruined", "Scorched", "Mossy", "Twisted", "Silent", "Pale", "Burning", "Frozen", "Gilded", "Haunted", "Blighted", "Crimson", "Ashen", "Murky", "Lost", "Forsaken", "Tarnished", "Rotting", "Sealed", "Fractured", "Drowned"];
  let noun = ["Hall", "Vault", "Passage", "Chamber", "Catacombs", "Sanctum", "Tomb", "Cavern", "Lair", "Pit", "Maze", "Crypt", "Gallery", "Abyss", "Warren", "Cellar", "Archive", "Ossuary", "Barrow", "Grotto", "Keep", "Depths", "Ruin", "Antechamber", "Oubliette"];
  let h1 = (seed % adj.length + adj.length) % adj.length;
  let h2 = ((seed + level * 7) % noun.length + noun.length) % noun.length;
  return "The " + adj[h1] + " " + noun[h2];
};

const level_description = (level) => ((_m) => (_m === 1) ? "Torch-lit corridors. Watch your step." : (_m === 2) ? "Flooded halls. Not all paths are safe." : (_m === 3) ? "Ancient vaults. Chests shimmer in the gloom." : (_m === 4) ? "The dead rest here. So might you." : (_m === 5) ? "No light reaches this deep." : (level > 5) ? "You shouldn't be here." : "Press onward.")(level);

const render_header = (level, seed) => "<div class=\"dungeon-header\">" + "<h2 class=\"level-name\">Level " + level + " — " + map_name(level, seed) + "</h2>" + "<p class=\"level-desc\">" + level_description(level) + "</p>" + "</div>";

/**
 * @param {AppState} s
 * @returns {*}
 */
const handle_code_input = (s) => {
  let input = document.getElementById("code-input").value;
  let result = parse_config(input);
  let errEl = document.getElementById("code-error");
  if (synth_is_ok(result)) {
    let cfg = result.value;
    errEl.textContent = "";
    errEl.style.display = "none";
    return render({ level: cfg.level, seed: cfg.seed, rows: s.rows, cols: s.cols });
  } else {
    errEl.textContent = result.message;
    return errEl.style.display = "block";
  }
};

/**
 * @param {AppState} s
 * @returns {*}
 */
const render = (s) => {
  let map = generate(s.rows, s.cols, s.level, s.seed);
  let html = render_header(s.level, s.seed) + render_stats(synth_map, s.seed) + render_map(synth_map) + render_legend();
  document.getElementById("dungeon-output").innerHTML = html;
  document.getElementById("btn-prev").disabled = s.level <= 1;
  document.getElementById("code-input").value = s.level + ":" + s.seed;
  document.getElementById("btn-new").onclick = () => render(new_map(s));
  document.getElementById("btn-next").onclick = () => render(go_next(s));
  document.getElementById("btn-prev").onclick = () => {
    if (s.level > 1) {
      return render(go_prev(s));
    }
};
  document.getElementById("btn-load").onclick = () => handle_code_input(s);
  return document.getElementById("code-input").onkeydown = (e) => {
    if (e.key == "Enter") {
      return handle_code_input(s);
    }
};
};

/**
 * @returns {*}
 */
const mount = () => render(init());

mount();

