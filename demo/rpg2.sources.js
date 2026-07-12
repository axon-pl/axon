/** @param {number} v @returns {boolean} */
const __validate_HP = (v) => (v >= 0) && (v <= 999);
/** @param {number} v @returns {boolean} */
const __validate_MP = (v) => (v >= 0) && (v <= 99);
/** @param {number} v @returns {boolean} */
const __validate_Stat = (v) => (v >= 1) && (v <= 50);

const Hero = (id, name, heroClass, hp, maxHp, mp, maxMp, atk, def, alive, defending, color) => ({ id, name, heroClass, hp, maxHp, mp, maxMp, atk, def, alive, defending, color });

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
const make_party = () => [{id: "theron", name: "Theron", heroClass: "knight", hp: 92, maxHp: 92, mp: 12, maxMp: 12, atk: 14, def: 12, alive: true, defending: false, color: "#00e5ff"}, {id: "aria", name: "Aria", heroClass: "mage", hp: 68, maxHp: 68, mp: 36, maxMp: 36, atk: 8, def: 6, alive: true, defending: false, color: "#b84fff"}, {id: "lyra", name: "Lyra", heroClass: "ranger", hp: 78, maxHp: 78, mp: 22, maxMp: 22, atk: 12, def: 8, alive: true, defending: false, color: "#06d6a0"}];

/**
 * @param {number} n
 * @returns {*}
 */
const encounter_foes = (n) => ((_m) => (_m === 0) ? [{id: "goblin", name: "Goblin Scout", hp: 38, maxHp: 38, atk: 9, def: 3, weakness: "fire", alive: true, color: "#ff6e3a"}, {id: "slime", name: "Neon Slime", hp: 28, maxHp: 28, atk: 7, def: 2, weakness: "light", alive: true, color: "#ff2d78"}] : (_m === 1) ? [{id: "bandit", name: "Forest Bandit", hp: 52, maxHp: 52, atk: 12, def: 5, weakness: "nature", alive: true, color: "#ffd166"}, {id: "archer", name: "Ash Archer", hp: 44, maxHp: 44, atk: 14, def: 4, weakness: "fire", alive: true, color: "#ff6e3a"}] : [{id: "wyrm", name: "Shadow Wyrm", hp: 160, maxHp: 160, atk: 16, def: 9, weakness: "arcane", alive: true, color: "#b84fff"}])(n);

const encounter_title = (n) => ((_m) => (_m === 0) ? "Encounter 1 — Mistwood Path" : (_m === 1) ? "Encounter 2 — Ruined Gate" : "Boss — Shadow Wyrm")(n);

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
 * @param {number} cur
 * @returns {number}
 */
const next_alive_after = (cur) => {
  let n = party.length;
  let i = cur + 1;
  while (i < n) {
    if (party[i].alive) {
      return i;
    }
    i = i + 1;
  }
  return 0 - 1;
};

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
 * @returns {*}
 */
const clear_defending = () => party = $map(party, (h) => ({...h, defending: false}));

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
    set_hero(idx, {...h, defending: false});
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
    Game.set({phase: "idle", scene: Game.encounter >= 2 ? "victory" : "battle"});
    if (Game.encounter >= 2) {
      push_log("Shadow Wyrm falls! The party prevails!");
      return Game.set({scene: "victory"});
    } else {
      push_log("Victory! Press Z to continue.");
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
  let pots = n == 0 ? 3 : Game.potions;
  Game.set({scene: "battle", encounter: n, potions: pots, log0: encounter_title(n), log1: n == 0 ? "Teach them steel." : n == 1 ? "Magic and medicine." : "Aim for the arcane wound.", log2: "", phase: "hero_command", active: 0, menu_mode: "command", menu_index: 0});
  return begin_hero_turn(first_alive_from(0));
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

const skill_menu = () => [{id: "pierce", label: "Pierce  4 MP"}, {id: "rain", label: "Rain    7 MP"}, {id: "back", label: "← Back"}];

/**
 * @returns {*}
 */
const item_menu = () => {
  let count = Game.potions;
  let rows = [{id: "potion", label: "Potion x" + count}, {id: "back", label: "← Back"}];
  return rows;
};

const target_enemy_menu = () => $map($filter($range(0, foes.length), (i) => foes[i].alive), (i) => ({id: "enemy", label: foes[i].name, index: i})).concat([{id: "back", label: "← Back"}]);

const target_ally_menu = () => $map($filter($range(0, party.length), (i) => party[i].alive), (i) => ({id: "ally", label: party[i].name, index: i})).concat([{id: "back", label: "← Back"}]);

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
 * @returns {*}
 */
const do_guard = (actor) => {
  let h = party[actor];
  if (h.mp < 3) {
    push_log("Not enough MP!");
    return Game.set({phase: "hero_command", menu_mode: "command", menu_index: 0});
  } else {
    pending = {cmd: "", skill: ""};
    set_hero(actor, {...h, mp: h.mp - 3, defending: true});
    return start_resolve("guard", actor, actor, 0, `${h.name} steels the line!`, "hero");
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
  if (h.mp < 4) {
    push_log("Not enough MP!");
    return open_mode("skill");
  } else {
    let e = foes[foe_i];
    let dmg = phys_damage(h.atk + 3, $floor(e.def / 2), false);
    let nhp = e.hp - dmg;
    let dead = nhp <= 0;
    set_hero(actor, {...h, mp: h.mp - 4});
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
  if (h.mp < 7) {
    push_log("Not enough MP!");
    return open_mode("skill");
  } else {
    set_hero(actor, {...h, mp: h.mp - 7});
    let total = 0;
    let i = 0;
    while (i < foes.length) {
      let e = foes[i];
      if (e.alive) {
        let dmg = spell_damage(h.atk, e.def, e.weakness, "nature");
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
 * @param {*} row
 * @returns {*}
 */
const confirm_command_row = (row) => {
  if (row.id == "fight") {
    pending = {cmd: "fight", skill: ""};
    return open_mode("target_enemy");
  } else if (row.id == "defend") {
    return do_defend(Game.active);
  } else if (row.id == "guard") {
    return do_guard(Game.active);
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
    return open_mode("target_enemy");
  } else if (row.id == "bolt") {
    pending = {cmd: "magic", skill: "bolt"};
    return open_mode("target_enemy");
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
    return open_mode("target_enemy");
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
  } else if (Game.menu_mode == "target_ally") {
    if (ti < 0 || ti >= party.length || !party[ti].alive) {
      return undefined;
    }
    if (pending.cmd == "magic" && pending.skill == "cure") {
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
  let ti = targets[$floor($random() * targets.length)];
  let h = party[ti];
  let dmg = phys_damage(e.atk, h.def, h.defending);
  let nhp = h.hp - dmg;
  let dead = nhp <= 0;
  set_hero(ti, {...h, hp: dead ? 0 : nhp, alive: !dead, defending: false});
  enemy_cursor = ei + 1;
  return start_resolve("enemy", ei, ti, dmg, `${e.name} hits ${h.name} for ${dmg}!`, "enemy");
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
    return begin_hero_turn(first_alive_from(0));
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
const get_view = () => ({scene: Game.scene, encounter: Game.encounter, title: encounter_title(Game.encounter), phase: Game.phase, menu_mode: Game.menu_mode, menu_index: Game.menu_index, menu: current_menu(), active: Game.active, potions: Game.potions, logs: [Game.log0, Game.log1, Game.log2], anim: anim, party: $map(party, (h) => h), foes: $map(foes, (e) => e), hint: Game.scene == "title" ? "Press Z / Enter / Tap to start" : Game.scene == "victory" || Game.scene == "gameover" ? "Press Z / Enter for title" : Game.phase == "battle_clear" ? "Press Z / Enter for next fight" : "↑↓ / WS select · Z/Enter confirm · X/Esc back"});

__synth_tests.push({ desc: "phys_damage respects defend half", fn: () => phys_damage(10, 4, false) == 16 && phys_damage(10, 4, true) == 8 });

__synth_tests.push({ desc: "spell_damage weakness bonus", fn: () => spell_damage(8, 4, "arcane", "arcane") == spell_damage(8, 4, "fire", "arcane") + 8 });

__synth_tests.push({ desc: "heal_amount caps at missing", fn: () => heal_amount(10, 28) == 10 && heal_amount(40, 28) == 28 });

__synth_tests.push({ desc: "encounter 0 has two foes", fn: () => encounter_foes(0).length == 2 });

__synth_tests.push({ desc: "party has Aria Theron Lyra", fn: () => (() => {
  let p = make_party();
  return p[0].name == "Theron" && p[1].name == "Aria" && p[2].name == "Lyra";
})() });

