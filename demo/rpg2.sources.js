/** @param {number} v @returns {boolean} */
const __validate_HP = (v) => (v >= 0) && (v <= 999);
/** @param {number} v @returns {boolean} */
const __validate_MP = (v) => (v >= 0) && (v <= 99);
/** @param {number} v @returns {boolean} */
const __validate_Stat = (v) => (v >= 1) && (v <= 50);

const Hero = (id, name, heroClass, hp, maxHp, mp, maxMp, atk, def, alive, defending, guarding, color) => ({ id, name, heroClass, hp, maxHp, mp, maxMp, atk, def, alive, defending, guarding, color });

const Foe = (id, name, hp, maxHp, atk, def, weakness, alive, color) => ({ id, name, hp, maxHp, atk, def, weakness, alive, color });

const MenuRow = (id, label) => ({ id, label });

const Anim = (kind, timer, actor, target, amount, text, side) => ({ kind, timer, actor, target, amount, text, side });

const Game = (() => {
  let _state = { scene: "title", encounter: 0, phase: "idle", active: 0, menu_mode: "command", menu_index: 0, potions: 3, log0: "", log1: "", log2: "" };
  const _subs = [];
  return {
    get scene() { return _state.scene; },
    get encounter() { return _state.encounter; },
    get phase() { return _state.phase; },
    get active() { return _state.active; },
    get menu_mode() { return _state.menu_mode; },
    get menu_index() { return _state.menu_index; },
    get potions() { return _state.potions; },
    get log0() { return _state.log0; },
    get log1() { return _state.log1; },
    get log2() { return _state.log2; },
    set(patch) {
      _state = Object.assign({}, _state, patch);
      for (const __fn of _subs) __fn(_state);
    },
    subscribe(fn) { _subs.push(fn); fn(_state); },
  };
})();

let party = [];
let foes = [];
let anim = {kind: "none", timer: 0.0, actor: -1, target: -1, amount: 0, text: "", side: "hero"};
let pending = {cmd: "", skill: ""};
let enemy_cursor = 0;
let turn_order = [0, 1, 2];

const phys_damage = (() => {
  const __cache = new Map();
  return (atk, def, defending) => {
    if (!__validate_Stat(atk)) throw new Error("SynthConstraintError: atk violates Stat constraint (got " + JSON.stringify(atk) + ")");
    if (!__validate_Stat(def)) throw new Error("SynthConstraintError: def violates Stat constraint (got " + JSON.stringify(def) + ")");
    const __key = JSON.stringify([atk, def, defending]);
    if (__cache.has(__key)) return __cache.get(__key);
    const __result = (() => {
      let raw = atk * 2 - def;
      let base = raw > 1 ? raw : 1;
      return defending ? $floor(base / 2) > 1 ? $floor(base / 2) : 1 : base;
    })();
    __cache.set(__key, __result);
    return __result;
  };
})();

const spell_damage = (() => {
  const __cache = new Map();
  return (power, def, weakness, element) => {
    if (!__validate_Stat(power)) throw new Error("SynthConstraintError: power violates Stat constraint (got " + JSON.stringify(power) + ")");
    if (!__validate_Stat(def)) throw new Error("SynthConstraintError: def violates Stat constraint (got " + JSON.stringify(def) + ")");
    const __key = JSON.stringify([power, def, weakness, element]);
    if (__cache.has(__key)) return __cache.get(__key);
    const __result = (() => {
      let raw = power * 3 - $floor(def / 2);
      let base = raw > 4 ? raw : 4;
      return element == weakness ? base + 8 : base;
    })();
    __cache.set(__key, __result);
    return __result;
  };
})();

/**
 * @param {HP} missing
 * @param {number} potency
 * @returns {number}
 */
const heal_amount = (missing, potency) => {
  if (!__validate_HP(missing)) throw new Error("SynthConstraintError: missing violates HP constraint (got " + JSON.stringify(missing) + ")");
  return missing < potency ? missing : potency;
};

/**
 * @param {string} msg
 * @returns {*}
 */
const push_log = (msg) => Game.set({log2: Game.log1, log1: Game.log0, log0: msg});

/**
 * @returns {*}
 */
const make_party = () => [{id: "theron", name: "Theron", heroClass: "knight", hp: 92, maxHp: 92, mp: 12, maxMp: 12, atk: 14, def: 12, alive: true, defending: false, guarding: 0 - 1, color: "#00e5ff"}, {id: "aria", name: "Aria", heroClass: "mage", hp: 68, maxHp: 68, mp: 36, maxMp: 36, atk: 8, def: 6, alive: true, defending: false, guarding: 0 - 1, color: "#b84fff"}, {id: "lyra", name: "Lyra", heroClass: "ranger", hp: 78, maxHp: 78, mp: 22, maxMp: 22, atk: 12, def: 8, alive: true, defending: false, guarding: 0 - 1, color: "#06d6a0"}];

/**
 * @param {number} n
 * @returns {*}
 */
const encounter_foes = (n) => ((_m) => (_m === 0) ? [{id: "goblin", name: "Goblin Scout", hp: 38, maxHp: 38, atk: 9, def: 3, weakness: "fire", alive: true, color: "#ff6e3a"}, {id: "slime", name: "Neon Slime", hp: 28, maxHp: 28, atk: 7, def: 2, weakness: "light", alive: true, color: "#ff2d78"}] : (_m === 1) ? [{id: "slime", name: "Mist Slime", hp: 32, maxHp: 32, atk: 8, def: 2, weakness: "light", alive: true, color: "#ff2d78"}, {id: "slime", name: "Glow Jelly", hp: 30, maxHp: 30, atk: 8, def: 3, weakness: "fire", alive: true, color: "#06d6a0"}, {id: "goblin", name: "Goblin Runner", hp: 34, maxHp: 34, atk: 10, def: 3, weakness: "fire", alive: true, color: "#ff6e3a"}] : (_m === 2) ? [{id: "goblin", name: "Goblin Brute", hp: 48, maxHp: 48, atk: 11, def: 5, weakness: "fire", alive: true, color: "#ff6e3a"}, {id: "goblin", name: "Goblin Sneak", hp: 40, maxHp: 40, atk: 12, def: 3, weakness: "light", alive: true, color: "#ffd166"}] : (_m === 3) ? [{id: "bandit", name: "Ash Bandit", hp: 52, maxHp: 52, atk: 12, def: 5, weakness: "nature", alive: true, color: "#ffd166"}, {id: "archer", name: "Ash Archer", hp: 44, maxHp: 44, atk: 14, def: 4, weakness: "fire", alive: true, color: "#ff6e3a"}] : (_m === 4) ? [{id: "archer", name: "Dune Sniper", hp: 46, maxHp: 46, atk: 15, def: 4, weakness: "fire", alive: true, color: "#ff6e3a"}, {id: "archer", name: "Cinder Bowman", hp: 42, maxHp: 42, atk: 14, def: 3, weakness: "nature", alive: true, color: "#ffd166"}] : (_m === 5) ? [{id: "bandit", name: "Ruins Raider", hp: 56, maxHp: 56, atk: 13, def: 6, weakness: "nature", alive: true, color: "#ffd166"}, {id: "bandit", name: "Dust Cutthroat", hp: 50, maxHp: 50, atk: 14, def: 4, weakness: "fire", alive: true, color: "#ff6e3a"}, {id: "archer", name: "Ruin Watcher", hp: 40, maxHp: 40, atk: 15, def: 3, weakness: "light", alive: true, color: "#b84fff"}] : (_m === 6) ? [{id: "slime", name: "Pale Ooze", hp: 34, maxHp: 34, atk: 9, def: 3, weakness: "light", alive: true, color: "#e8e0ff"}, {id: "goblin", name: "Field Stalker", hp: 46, maxHp: 46, atk: 12, def: 4, weakness: "fire", alive: true, color: "#ff6e3a"}, {id: "archer", name: "Hedge Bowman", hp: 42, maxHp: 42, atk: 14, def: 3, weakness: "fire", alive: true, color: "#ff6e3a"}] : (_m === 7) ? [{id: "bandit", name: "Goldfield Outlaw", hp: 58, maxHp: 58, atk: 14, def: 6, weakness: "nature", alive: true, color: "#ffd166"}, {id: "archer", name: "Mist Marksman", hp: 48, maxHp: 48, atk: 16, def: 4, weakness: "fire", alive: true, color: "#ff6e3a"}, {id: "goblin", name: "Road Ambusher", hp: 44, maxHp: 44, atk: 13, def: 4, weakness: "light", alive: true, color: "#ffd166"}, {id: "slime", name: "Mire Jelly", hp: 36, maxHp: 36, atk: 10, def: 4, weakness: "light", alive: true, color: "#ff2d78"}] : (_m === 8) ? [{id: "wyrm", name: "Shadow Wyrm", hp: 160, maxHp: 160, atk: 16, def: 9, weakness: "arcane", alive: true, color: "#b84fff"}] : [{id: "wyrm", name: "Shadow Wyrm", hp: 160, maxHp: 160, atk: 16, def: 9, weakness: "arcane", alive: true, color: "#b84fff"}])(n);

const encounter_title = (n) => ((_m) => (_m === 0) ? "Forest 1 — Mistwood Path" : (_m === 1) ? "Forest 2 — Foghollow Thicket" : (_m === 2) ? "Forest 3 — Whispering Roots" : (_m === 3) ? "Desert 1 — Ashen Gate" : (_m === 4) ? "Desert 2 — Sunscar Road" : (_m === 5) ? "Desert 3 — Cinder Ruins" : (_m === 6) ? "Plains 1 — Lowland Mist" : (_m === 7) ? "Plains 2 — Goldfield Watch" : "Boss — Shadow Wyrm")(n);

const encounter_hint = (n) => ((_m) => (_m === 0) ? "Teach them steel." : (_m === 1) ? "Slimes hate light and fire." : (_m === 2) ? "Two blades in the brush." : (_m === 3) ? "Magic and medicine." : (_m === 4) ? "Keep your heads down." : (_m === 5) ? "A hard push through ash." : (_m === 6) ? "The fog thins ahead." : (_m === 7) ? "Last road before the Wyrm." : "Aim for the arcane wound.")(n);

const is_final_encounter = (n) => n >= 8;

const party_alive = () => $any(party, (h) => h.alive);

const foes_alive = () => $any(foes, (e) => e.alive);

/**
 * @param {number} start
 * @returns {number}
 */
const first_alive_from = (start) => {
  let n = party.length;
  let i = start;
  let found = 0 - 1;
  let guard = 0;
  while (guard < n) {
    let idx = i >= n ? 0 : i;
    if (idx < n && party[idx].alive && found < 0) {
      found = idx;
    }
    i = idx + 1;
    guard = guard + 1;
  }
  return found;
};

/**
 * @returns {*}
 */
const reshuffle_turn_order = () => {
  let order = [0, 1, 2];
  let i = order.length - 1;
  while (i > 0) {
    let j = $random_int(0, i);
    let tmp = order[i];
    order = $set_at(order, i, order[j]);
    order = $set_at(order, j, tmp);
    i = i - 1;
  }
  return turn_order = order;
};

/**
 * @returns {number}
 */
const first_in_turn_order = () => {
  let k = 0;
  while (k < turn_order.length) {
    let hi = turn_order[k];
    if (hi >= 0 && hi < party.length && party[hi].alive) {
      return hi;
    }
    k = k + 1;
  }
  return 0 - 1;
};

/**
 * @param {number} after_idx
 * @returns {number}
 */
const next_in_turn_order = (after_idx) => {
  let pos = 0;
  let found = false;
  while (pos < turn_order.length) {
    if (turn_order[pos] == after_idx) {
      found = true;
      break;
    }
    pos = pos + 1;
  }
  let start = found ? pos + 1 : 0;
  let k = start;
  while (k < turn_order.length) {
    let hi = turn_order[k];
    if (hi >= 0 && hi < party.length && party[hi].alive) {
      return hi;
    }
    k = k + 1;
  }
  return 0 - 1;
};

/**
 * @param {number} cur
 * @returns {number}
 */
const next_alive_after = (cur) => next_in_turn_order(cur);

/**
 * @returns {number}
 */
const first_alive_foe = () => {
  let i = 0;
  while (i < foes.length) {
    if (foes[i].alive) {
      return i;
    }
    i = i + 1;
  }
  return 0 - 1;
};

/**
 * @returns {number}
 */
const sole_alive_foe = () => {
  let found = 0 - 1;
  let i = 0;
  while (i < foes.length) {
    if (foes[i].alive) {
      if (found >= 0) {
        return 0 - 1;
      }
      found = i;
    }
    i = i + 1;
  }
  return found;
};

/**
 * @returns {*}
 */
const clear_defending = () => party = $map(party, (h) => ({...h, defending: false, guarding: 0 - 1}));

/**
 * @param {number} i
 * @param {*} h
 * @returns {*}
 */
const set_hero = (i, h) => party = $set_at(party, i, h);

/**
 * @param {number} i
 * @param {*} e
 * @returns {*}
 */
const set_foe = (i, e) => foes = $set_at(foes, i, e);

/**
 * @param {number} idx
 * @returns {*}
 */
const begin_hero_turn = (idx) => {
  if (idx < 0) {
    return begin_enemy_phase();
  } else {
    let h = party[idx];
    set_hero(idx, {...h, defending: false, guarding: 0 - 1});
    pending = {cmd: "", skill: ""};
    return Game.set({active: idx, phase: "hero_command", menu_mode: "command", menu_index: 0});
  }
};

/**
 * @returns {*}
 */
const begin_enemy_phase = () => {
  enemy_cursor = 0;
  Game.set({phase: "enemy_act", menu_mode: "command", menu_index: 0});
  return run_next_enemy(0);
};

/**
 * @returns {*}
 */
const finish_battle_check = () => {
  if (!foes_alive()) {
    Game.set({phase: "idle", scene: is_final_encounter(Game.encounter) ? "victory" : "battle"});
    if (is_final_encounter(Game.encounter)) {
      push_log("Shadow Wyrm falls! The party prevails!");
      return Game.set({scene: "victory"});
    } else {
      push_log("Victory! Click to continue.");
      return Game.set({phase: "battle_clear"});
    }
  } else if (!party_alive()) {
    push_log("The party has fallen...");
    return Game.set({scene: "gameover", phase: "idle"});
  }
};

/**
 * @param {number} n
 * @returns {*}
 */
const start_encounter = (n) => {
  party = make_party();
  foes = encounter_foes(n);
  anim = {kind: "none", timer: 0.0, actor: -1, target: -1, amount: 0, text: "", side: "hero"};
  pending = {cmd: "", skill: ""};
  reshuffle_turn_order();
  let first = first_in_turn_order();
  let pots = n == 0 ? 3 : Game.potions;
  Game.set({scene: "battle", encounter: n, potions: pots, log0: encounter_title(n), log1: encounter_hint(n), log2: "", phase: "hero_command", active: first < 0 ? 0 : first, menu_mode: "command", menu_index: 0});
  return begin_hero_turn(first);
};

/**
 * @returns {*}
 */
const start_game = () => {
  Game.set({potions: 3});
  return start_encounter(0);
};

/**
 * @returns {*}
 */
const advance_after_clear = () => start_encounter(Game.encounter + 1);

/**
 * @param {*} hero
 * @returns {*}
 */
const command_menu = (hero) => ((_m) => (_m === "knight") ? [{id: "fight", label: "Fight"}, {id: "defend", label: "Defend"}, {id: "guard", label: "Guard"}, {id: "item", label: "Item"}] : (_m === "mage") ? [{id: "fight", label: "Fight"}, {id: "defend", label: "Defend"}, {id: "magic", label: "Magic"}, {id: "item", label: "Item"}] : [{id: "fight", label: "Fight"}, {id: "defend", label: "Defend"}, {id: "skill", label: "Skill"}, {id: "item", label: "Item"}])(hero.heroClass);

const magic_menu = () => [{id: "fire", label: "Fire   8 MP"}, {id: "cure", label: "Cure   6 MP"}, {id: "bolt", label: "Arcane 10 MP"}, {id: "back", label: "← Back"}];

const skill_menu = () => [{id: "pierce", label: "Pierce  5 MP"}, {id: "rain", label: "Rain    8 MP"}, {id: "back", label: "← Back"}];

/**
 * @returns {*}
 */
const item_menu = () => {
  let count = Game.potions;
  let rows = [{id: "potion", label: "Potion x" + count}, {id: "back", label: "← Back"}];
  return rows;
};

const target_enemy_menu = () => $map($filter($range(0, foes.length), (i) => foes[i].alive), (i) => ({id: "enemy", label: foes[i].name, index: i})).concat([{id: "back", label: "← Back"}]);

/**
 * @returns {*}
 */
const target_ally_menu = () => {
  let exclude = pending.cmd == "guard" ? Game.active : 0 - 1;
  return $map($filter($range(0, party.length), (i) => party[i].alive && i != exclude), (i) => ({id: "ally", label: party[i].name, index: i})).concat([{id: "back", label: "← Back"}]);
};

/**
 * @returns {*}
 */
const current_menu = () => {
  if (Game.scene != "battle" || party.length == 0) {
    return [];
  } else if (Game.active < 0 || Game.active >= party.length) {
    return [];
  } else if (Game.menu_mode == "command") {
    return command_menu(party[Game.active]);
  } else if (Game.menu_mode == "magic") {
    return magic_menu();
  } else if (Game.menu_mode == "skill") {
    return skill_menu();
  } else if (Game.menu_mode == "item") {
    return item_menu();
  } else if (Game.menu_mode == "target_enemy") {
    return target_enemy_menu();
  } else if (Game.menu_mode == "target_ally") {
    return target_ally_menu();
  } else {
    return [];
  }
};

/**
 * @returns {*}
 */
const clamp_menu_index = () => {
  let m = current_menu();
  let max = m.length > 0 ? m.length - 1 : 0;
  let idx = Game.menu_index < 0 ? 0 : Game.menu_index > max ? max : Game.menu_index;
  return Game.set({menu_index: idx});
};

/**
 * @param {number} dir
 * @returns {*}
 */
const menu_move = (dir) => {
  if (Game.scene != "battle") {
    return undefined;
  }
  if (Game.phase != "hero_command" && Game.phase != "hero_pick") {
    return undefined;
  }
  let m = current_menu();
  if (m.length == 0) {
    return undefined;
  }
  let next = Game.menu_index + dir;
  let wrapped = next < 0 ? m.length - 1 : next >= m.length ? 0 : next;
  return Game.set({menu_index: wrapped});
};

/**
 * @param {number} i
 * @returns {*}
 */
const menu_set_index = (i) => {
  if (Game.scene != "battle") {
    return undefined;
  }
  if (Game.phase != "hero_command" && Game.phase != "hero_pick") {
    return undefined;
  }
  let m = current_menu();
  if (m.length == 0) {
    return undefined;
  }
  let idx = i < 0 ? 0 : i >= m.length ? m.length - 1 : i;
  return Game.set({menu_index: idx});
};

/**
 * @param {string} mode
 * @returns {*}
 */
const open_mode = (mode) => Game.set({menu_mode: mode, menu_index: 0, phase: "hero_pick"});

/**
 * @param {string} kind
 * @param {number} actor
 * @param {number} target
 * @param {number} amount
 * @param {string} text
 * @param {string} side
 * @returns {*}
 */
const start_resolve = (kind, actor, target, amount, text, side) => {
  anim = {kind: kind, timer: 0.55, actor: actor, target: target, amount: amount, text: text, side: side};
  Game.set({phase: "resolve", menu_mode: "command"});
  return push_log(text);
};

/**
 * @param {number} actor
 * @param {number} foe_i
 * @returns {*}
 */
const do_fight = (actor, foe_i) => {
  if (foe_i < 0 || foe_i >= foes.length || !foes[foe_i].alive) {
    return undefined;
  }
  let h = party[actor];
  let e = foes[foe_i];
  let dmg = phys_damage(h.atk, e.def, false);
  let nhp = e.hp - dmg;
  let dead = nhp <= 0;
  set_foe(foe_i, {...e, hp: dead ? 0 : nhp, alive: !dead});
  return start_resolve("attack", actor, foe_i, dmg, `${h.name} strikes ${e.name} for ${dmg}!`, "hero");
};

/**
 * @param {number} actor
 * @returns {*}
 */
const do_defend = (actor) => {
  let h = party[actor];
  pending = {cmd: "", skill: ""};
  set_hero(actor, {...h, defending: true});
  return start_resolve("defend", actor, actor, 0, `${h.name} raises a guard.`, "hero");
};

/**
 * @param {number} actor
 * @param {number} ally_i
 * @returns {*}
 */
const do_guard = (actor, ally_i) => {
  let h = party[actor];
  if (h.mp < 3) {
    push_log("Not enough MP!");
    return Game.set({phase: "hero_command", menu_mode: "command", menu_index: 0});
  } else if (ally_i < 0 || ally_i >= party.length || !party[ally_i].alive || ally_i == actor) {
    push_log("Guard needs another ally!");
    return Game.set({phase: "hero_command", menu_mode: "command", menu_index: 0});
  } else {
    let a = party[ally_i];
    pending = {cmd: "", skill: ""};
    set_hero(actor, {...h, mp: h.mp - 3, defending: true, guarding: ally_i});
    return start_resolve("guard", actor, ally_i, 0, `${h.name} guards ${a.name}!`, "hero");
  }
};

/**
 * @param {number} actor
 * @param {number} foe_i
 * @returns {*}
 */
const do_fire = (actor, foe_i) => {
  let h = party[actor];
  if (h.mp < 8) {
    push_log("Not enough MP!");
    return open_mode("magic");
  } else {
    let e = foes[foe_i];
    let dmg = spell_damage(h.atk + 4, e.def, e.weakness, "fire");
    let nhp = e.hp - dmg;
    let dead = nhp <= 0;
    set_hero(actor, {...h, mp: h.mp - 8});
    set_foe(foe_i, {...e, hp: dead ? 0 : nhp, alive: !dead});
    return start_resolve("magic", actor, foe_i, dmg, `${h.name} casts Fire on ${e.name}! (${dmg})`, "hero");
  }
};

/**
 * @param {number} actor
 * @param {number} foe_i
 * @returns {*}
 */
const do_bolt = (actor, foe_i) => {
  let h = party[actor];
  if (h.mp < 10) {
    push_log("Not enough MP!");
    return open_mode("magic");
  } else {
    let e = foes[foe_i];
    let dmg = spell_damage(h.atk + 6, e.def, e.weakness, "arcane");
    let nhp = e.hp - dmg;
    let dead = nhp <= 0;
    set_hero(actor, {...h, mp: h.mp - 10});
    set_foe(foe_i, {...e, hp: dead ? 0 : nhp, alive: !dead});
    return start_resolve("magic", actor, foe_i, dmg, `${h.name} casts Arcane on ${e.name}! (${dmg})`, "hero");
  }
};

/**
 * @param {number} actor
 * @param {number} ally_i
 * @returns {*}
 */
const do_cure = (actor, ally_i) => {
  let h = party[actor];
  if (h.mp < 6) {
    push_log("Not enough MP!");
    return open_mode("magic");
  } else {
    let a = party[ally_i];
    let healed = heal_amount(a.maxHp - a.hp, 28);
    set_hero(actor, {...h, mp: h.mp - 6});
    set_hero(ally_i, {...a, hp: a.hp + healed});
    return start_resolve("heal", actor, ally_i, healed, `${h.name} cures ${a.name} (+${healed})`, "hero");
  }
};

/**
 * @param {number} actor
 * @param {number} foe_i
 * @returns {*}
 */
const do_pierce = (actor, foe_i) => {
  let h = party[actor];
  if (h.mp < 5) {
    push_log("Not enough MP!");
    return open_mode("skill");
  } else {
    let e = foes[foe_i];
    let dmg = phys_damage(h.atk + 1, $floor(e.def * 3 / 4), false);
    let nhp = e.hp - dmg;
    let dead = nhp <= 0;
    set_hero(actor, {...h, mp: h.mp - 5});
    set_foe(foe_i, {...e, hp: dead ? 0 : nhp, alive: !dead});
    return start_resolve("skill", actor, foe_i, dmg, `${h.name} pierces ${e.name} for ${dmg}!`, "hero");
  }
};

/**
 * @param {number} actor
 * @returns {*}
 */
const do_rain = (actor) => {
  let h = party[actor];
  if (h.mp < 8) {
    push_log("Not enough MP!");
    return open_mode("skill");
  } else {
    set_hero(actor, {...h, mp: h.mp - 8});
    let total = 0;
    let i = 0;
    while (i < foes.length) {
      let e = foes[i];
      if (e.alive) {
        let dmg = spell_damage(h.atk - 4, e.def, e.weakness, "nature");
        let nhp = e.hp - dmg;
        let dead = nhp <= 0;
        set_foe(i, {...e, hp: dead ? 0 : nhp, alive: !dead});
        total = total + dmg;
      }
      i = i + 1;
    }
    return start_resolve("skill", actor, first_alive_foe(), total, `${h.name} looses Arrow Rain! (${total})`, "hero");
  }
};

/**
 * @param {number} actor
 * @param {number} ally_i
 * @returns {*}
 */
const do_potion = (actor, ally_i) => {
  if (Game.potions <= 0) {
    push_log("No potions left!");
    return open_mode("item");
  } else {
    let a = party[ally_i];
    let healed = heal_amount(a.maxHp - a.hp, 40);
    Game.set({potions: Game.potions - 1});
    set_hero(ally_i, {...a, hp: a.hp + healed});
    return start_resolve("item", actor, ally_i, healed, `${a.name} drinks a Potion (+${healed})`, "hero");
  }
};

/**
 * @param {number} ti
 * @returns {*}
 */
const apply_pending_to_enemy = (ti) => {
  if (pending.cmd == "fight") {
    return do_fight(Game.active, ti);
  } else if (pending.cmd == "magic") {
    if (pending.skill == "fire") {
      return do_fire(Game.active, ti);
    } else if (pending.skill == "bolt") {
      return do_bolt(Game.active, ti);
    }
  } else if (pending.cmd == "skill") {
    return do_pierce(Game.active, ti);
  }
};

/**
 * @returns {*}
 */
const begin_enemy_target = () => {
  let sole = sole_alive_foe();
  if (sole >= 0) {
    return apply_pending_to_enemy(sole);
  } else {
    return open_mode("target_enemy");
  }
};

/**
 * @param {*} row
 * @returns {*}
 */
const confirm_command_row = (row) => {
  if (row.id == "fight") {
    pending = {cmd: "fight", skill: ""};
    return begin_enemy_target();
  } else if (row.id == "defend") {
    return do_defend(Game.active);
  } else if (row.id == "guard") {
    pending = {cmd: "guard", skill: ""};
    return open_mode("target_ally");
  } else if (row.id == "magic") {
    return open_mode("magic");
  } else if (row.id == "skill") {
    return open_mode("skill");
  } else if (row.id == "item") {
    return open_mode("item");
  }
};

/**
 * @param {*} row
 * @returns {*}
 */
const confirm_magic_row = (row) => {
  if (row.id == "fire") {
    pending = {cmd: "magic", skill: "fire"};
    return begin_enemy_target();
  } else if (row.id == "bolt") {
    pending = {cmd: "magic", skill: "bolt"};
    return begin_enemy_target();
  } else if (row.id == "cure") {
    pending = {cmd: "magic", skill: "cure"};
    return open_mode("target_ally");
  }
};

/**
 * @param {*} row
 * @returns {*}
 */
const confirm_skill_row = (row) => {
  if (row.id == "pierce") {
    pending = {cmd: "skill", skill: "pierce"};
    return begin_enemy_target();
  } else if (row.id == "rain") {
    return do_rain(Game.active);
  }
};

/**
 * @param {*} row
 * @returns {*}
 */
const confirm_item_row = (row) => {
  if (row.id == "potion") {
    pending = {cmd: "item", skill: "potion"};
    return open_mode("target_ally");
  }
};

/**
 * @param {*} row
 * @returns {*}
 */
const confirm_target_row = (row) => {
  let ti = row.index;
  if (ti == null) {
    return undefined;
  }
  if (Game.menu_mode == "target_enemy") {
    if (ti < 0 || ti >= foes.length || !foes[ti].alive) {
      return undefined;
    }
    return apply_pending_to_enemy(ti);
  } else if (Game.menu_mode == "target_ally") {
    if (ti < 0 || ti >= party.length || !party[ti].alive) {
      return undefined;
    }
    if (pending.cmd == "guard") {
      return do_guard(Game.active, ti);
    } else if (pending.cmd == "magic" && pending.skill == "cure") {
      return do_cure(Game.active, ti);
    } else if (pending.cmd == "item") {
      return do_potion(Game.active, ti);
    }
  }
};

/**
 * @returns {*}
 */
const menu_confirm = () => {
  if (Game.scene == "title") {
    start_game();
    return undefined;
  }
  if (Game.scene == "victory" || Game.scene == "gameover") {
    Game.set({scene: "title", phase: "idle", encounter: 0});
    return undefined;
  }
  if (Game.scene == "battle" && Game.phase == "battle_clear") {
    advance_after_clear();
    return undefined;
  }
  if (Game.scene != "battle") {
    return undefined;
  }
  if (Game.phase != "hero_command" && Game.phase != "hero_pick") {
    return undefined;
  }
  let m = current_menu();
  if (m.length == 0) {
    return undefined;
  }
  let row = m[Game.menu_index];
  if (row.id == "back") {
    menu_cancel();
    return undefined;
  }
  return ((_m) => (_m === "command") ? confirm_command_row(row) : (_m === "magic") ? confirm_magic_row(row) : (_m === "skill") ? confirm_skill_row(row) : (_m === "item") ? confirm_item_row(row) : (_m === "target_enemy") ? confirm_target_row(row) : (_m === "target_ally") ? confirm_target_row(row) : {})(Game.menu_mode);
};

/**
 * @returns {*}
 */
const menu_cancel = () => {
  if (Game.scene != "battle") {
    return undefined;
  }
  if (Game.phase != "hero_pick" && Game.phase != "hero_command") {
    return undefined;
  }
  if (Game.menu_mode == "command") {
    return 0;
  } else if (Game.menu_mode == "target_enemy") {
    if (pending.cmd == "magic") {
      return open_mode("magic");
    } else if (pending.cmd == "skill") {
      return open_mode("skill");
    } else {
      pending = {cmd: "", skill: ""};
      return Game.set({menu_mode: "command", menu_index: 0, phase: "hero_command"});
    }
  } else if (Game.menu_mode == "target_ally") {
    if (pending.cmd == "magic") {
      return open_mode("magic");
    } else if (pending.cmd == "item") {
      return open_mode("item");
    } else {
      pending = {cmd: "", skill: ""};
      return Game.set({menu_mode: "command", menu_index: 0, phase: "hero_command"});
    }
  } else {
    pending = {cmd: "", skill: ""};
    return Game.set({menu_mode: "command", menu_index: 0, phase: "hero_command"});
  }
};

/**
 * @returns {*}
 */
const after_hero_resolve = () => {
  finish_battle_check();
  if (Game.scene != "battle") {
    return undefined;
  }
  if (Game.phase == "battle_clear") {
    return undefined;
  }
  let nxt = next_alive_after(Game.active);
  if (nxt < 0) {
    return begin_enemy_phase();
  } else {
    return begin_hero_turn(nxt);
  }
};

/**
 * @param {number} target
 * @returns {number}
 */
const find_cover = (target) => {
  let i = 0;
  while (i < party.length) {
    let h = party[i];
    if (h.alive && h.guarding == target && i != target) {
      return i;
    }
    i = i + 1;
  }
  return 0 - 1;
};

/**
 * @param {number} ei
 * @returns {*}
 */
const enemy_strike = (ei) => {
  let e = foes[ei];
  if (!e.alive) {
    run_next_enemy(ei + 1);
    return undefined;
  }
  let targets = $filter($range(0, party.length), (i) => party[i].alive);
  if (targets.length == 0) {
    finish_battle_check();
    return undefined;
  }
  let intended = targets[$floor($random() * targets.length)];
  let cover = find_cover(intended);
  let ti = cover >= 0 ? cover : intended;
  let h = party[ti];
  let intended_h = party[intended];
  let braced = cover >= 0 ? true : h.defending;
  let dmg = phys_damage(e.atk, h.def, braced);
  let nhp = h.hp - dmg;
  let dead = nhp <= 0;
  set_hero(ti, {...h, hp: dead ? 0 : nhp, alive: !dead, defending: false});
  enemy_cursor = ei + 1;
  let msg = cover >= 0 ? `${e.name} strikes at ${intended_h.name} — ${h.name} intercepts! (${dmg})` : `${e.name} hits ${h.name} for ${dmg}!`;
  return start_resolve("enemy", ei, ti, dmg, msg, "enemy");
};

/**
 * @param {number} start
 * @returns {*}
 */
const run_next_enemy = (start) => {
  let i = start;
  while (i < foes.length) {
    if (foes[i].alive) {
      enemy_strike(i);
      return undefined;
    }
    i = i + 1;
  }
  finish_battle_check();
  if (Game.scene == "battle" && Game.phase != "battle_clear") {
    return begin_hero_turn(first_in_turn_order());
  }
};

/**
 * @returns {*}
 */
const after_enemy_resolve = () => {
  finish_battle_check();
  if (Game.scene != "battle") {
    return undefined;
  }
  if (Game.phase == "battle_clear") {
    return undefined;
  }
  return run_next_enemy(enemy_cursor);
};

/**
 * @param {number} dt
 * @returns {*}
 */
const tick = (dt) => {
  if (anim.kind != "none" && anim.timer > 0.0) {
    anim = {...anim, timer: anim.timer - dt};
    if (anim.timer <= 0.0) {
      let side = anim.side;
      anim = {...anim, kind: "none", timer: 0.0};
      if (side == "enemy") {
        return after_enemy_resolve();
      } else {
        return after_hero_resolve();
      }
    }
  }
};

/**
 * @returns {*}
 */
const get_view = () => ({scene: Game.scene, encounter: Game.encounter, title: encounter_title(Game.encounter), phase: Game.phase, menu_mode: Game.menu_mode, menu_index: Game.menu_index, menu: current_menu(), active: Game.active, potions: Game.potions, logs: [Game.log0, Game.log1, Game.log2], anim: anim, party: $map(party, (h) => h), foes: $map(foes, (e) => e), hint: Game.scene == "title" ? "Press Z / Enter / Tap to start" : Game.scene == "victory" || Game.scene == "gameover" ? "Click to return to title" : Game.phase == "battle_clear" ? "" : "↑↓ / WS select · Z/Enter confirm · X/Esc back"});

__synth_tests.push({ desc: "phys_damage respects defend half", fn: () => phys_damage(10, 4, false) == 16 && phys_damage(10, 4, true) == 8 });

__synth_tests.push({ desc: "spell_damage weakness bonus", fn: () => spell_damage(8, 4, "arcane", "arcane") == spell_damage(8, 4, "fire", "arcane") + 8 });

__synth_tests.push({ desc: "heal_amount caps at missing", fn: () => heal_amount(10, 28) == 10 && heal_amount(40, 28) == 28 });

__synth_tests.push({ desc: "encounter 0 has two foes", fn: () => encounter_foes(0).length == 2 });

__synth_tests.push({ desc: "final encounter is the wyrm", fn: () => encounter_foes(8).length == 1 && encounter_foes(8)[0].id == "wyrm" });

__synth_tests.push({ desc: "plains approaches have no wyrm", fn: () => !$any(encounter_foes(6), (e) => e.id == "wyrm") && !$any(encounter_foes(7), (e) => e.id == "wyrm") });

__synth_tests.push({ desc: "nine encounter titles", fn: () => encounter_title(0).includes("Forest") && encounter_title(5).includes("Desert") && encounter_title(8).includes("Boss") });

__synth_tests.push({ desc: "party has Aria Theron Lyra", fn: () => (() => {
  let p = make_party();
  return p[0].name == "Theron" && p[1].name == "Aria" && p[2].name == "Lyra";
})() });

