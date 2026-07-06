const __validate_HP = (v) => (v >= 0) && (v <= 200);
const __validate_StatValue = (v) => (v >= 1) && (v <= 20);
const __validate_Level = (v) => (v >= 1) && (v <= 20);
const __validate_HeroName = (v) => v.length > 0;
const __validate_ClassName = (v) => v.length > 0;
const Hero = (name, heroClass, hp, maxHp, strength, defense, level, alive) => ({ name, heroClass, hp, maxHp, strength, defense, level, alive });
const Enemy = (name, hp, maxHp, attack, defense, weakness, alive) => ({ name, hp, maxHp, attack, defense, weakness, alive });
const hero_is_alive = (h) => h.alive;
const any_alive = (party) => $any(party, __x => __x.alive);
const format_attack_msg = (attacker, outcome, defender, dmg) => `${attacker} ${outcome} ${defender} for ${dmg} damage!`;
const format_death_msg = (name) => `${name} has fallen in battle.`;
const format_hero_label = (hero) => `${hero.name} Lv.${hero.level} ${hero.heroClass}`;
const hp_bar_text = (hp, maxHp) => {
  let filled = maxHp > 0 ? $max(Math, 0, Math.round(hp / maxHp * 8)) : 0;
  let bar = $map($range(0, 8), i => i < filled ? "#" : ".");
  let pct = maxHp > 0 ? Math.floor(hp / maxHp * 100) : 0;
  let barStr = bar.join("");
  return `${barStr} ${hp}/${maxHp} (${pct}%)`;
};
const format_hero_card_line = (hero) => {
  let bar = hp_bar_text(hero.hp, hero.maxHp);
  let title = level_title(hero.level);
  return `${hero.name} the ${title}  ${bar}`;
};
const format_enemy_card_line = (enemy) => {
  let bar = hp_bar_text(enemy.hp, enemy.maxHp);
  return `${enemy.name}  ${bar}`;
};
const level_title = (level) => ((_m) => (_m < 4) ? "Novice" : (_m < 7) ? "Adept" : (_m < 10) ? "Veteran" : "Master")(level);
const combat_outcome_label = (roll) => ((_m) => (_m >= 20) ? "lands a perfect strike on" : (_m >= 18) ? "scores a CRITICAL HIT on" : (_m >= 8) ? "hits" : (_m >= 3) ? "grazes" : "misses")(roll);
const element_bonus = (heroClass, weakness) => ((_m) => (_m === "mage") ? ((_m) => (_m === "arcane") ? 8 : (_m === "fire") ? 5 : 0)(weakness) : (_m === "ranger") ? ((_m) => (_m === "nature") ? 6 : (_m === "cold") ? 4 : 0)(weakness) : (_m === "knight") ? ((_m) => (_m === "physical") ? 5 : 0)(weakness) : 0)(heroClass);
const class_symbol = (heroClass) => ((_m) => (_m === "mage") ? "[M]" : (_m === "knight") ? "[K]" : (_m === "ranger") ? "[R]" : "[?]")(heroClass);
const class_weakness_hint = (weakness) => ((_m) => (_m === "arcane") ? "weak to ARCANE (mage bonus)" : (_m === "fire") ? "weak to FIRE (mage bonus)" : (_m === "nature") ? "weak to NATURE (ranger bonus)" : (_m === "cold") ? "weak to COLD (ranger bonus)" : (_m === "physical") ? "weak to PHYSICAL (knight bonus)" : "no known weakness")(weakness);
const compute_damage = (() => {
  const __cache = new Map();
  return (atk, def, bonus, roll) => {
    const __key = JSON.stringify([atk, def, bonus, roll]);
    if (__cache.has(__key)) return __cache.get(__key);
    const __result = (() => {
      let base = $max(Math, 1, atk + bonus - Math.floor(def / 2));
      let mult = roll >= 18 ? 2 : 1;
      return $max(Math, 1, base * mult);
    })();
    __cache.set(__key, __result);
    return __result;
  };
})();
const hero_power = (() => {
  const __cache = new Map();
  return (hero) => {
    const __key = JSON.stringify([hero]);
    if (__cache.has(__key)) return __cache.get(__key);
    const __result = (() => {
      return hero.strength * hero.level + Math.floor(hero.maxHp / 10);
    })();
    __cache.set(__key, __result);
    return __result;
  };
})();
const create_hero = (name, heroClass, hp, strength, defense, level) => {
  if (!__validate_HeroName(name)) throw new Error(`SynthConstraintError: name violates HeroName constraint (got ${JSON.stringify(name)})`);
  if (!__validate_ClassName(heroClass)) throw new Error(`SynthConstraintError: heroClass violates ClassName constraint (got ${JSON.stringify(heroClass)})`);
  if (!__validate_HP(hp)) throw new Error(`SynthConstraintError: hp violates HP constraint (got ${JSON.stringify(hp)})`);
  if (!__validate_StatValue(strength)) throw new Error(`SynthConstraintError: strength violates StatValue constraint (got ${JSON.stringify(strength)})`);
  if (!__validate_StatValue(defense)) throw new Error(`SynthConstraintError: defense violates StatValue constraint (got ${JSON.stringify(defense)})`);
  if (!__validate_Level(level)) throw new Error(`SynthConstraintError: level violates Level constraint (got ${JSON.stringify(level)})`);
  return ({ name, heroClass, hp, maxHp: hp, strength, defense, level, alive: true });
};
const alive_heroes = (party) => $filter(party, __x => __x.alive);
const party_names = (party) => $map($filter(party, __x => __x.alive), __x => __x.name);
const total_party_hp = (() => {
  const __cache = new Map();
  return (party) => {
    const __key = JSON.stringify([party]);
    if (__cache.has(__key)) return __cache.get(__key);
    const __result = (() => {
      return $sum($map($filter(party, __x => __x.alive), __x => __x.hp));
    })();
    __cache.set(__key, __result);
    return __result;
  };
})();
const party_power_rating = (() => {
  const __cache = new Map();
  return (party) => {
    const __key = JSON.stringify([party]);
    if (__cache.has(__key)) return __cache.get(__key);
    const __result = (() => {
      return $sum($map(party, hero_power));
    })();
    __cache.set(__key, __result);
    return __result;
  };
})();
const count_alive = (party) => $count($filter(party, __x => __x.alive));
const strongest_hero = (party) => {
  let sorted = party.slice().sort((a, b) => hero_power(b) - hero_power(a));
  return $first(sorted);
};
const debug_party = (party) => {
  console.log("debug_party:", $map(party, __x => __x.name));
  return true;
};
const apply_damage = (entity, dmg) => {
  let newHp = $max(Math, 0, entity.hp - dmg);
  return { ...entity, hp: newHp, alive: newHp > 0 };
};
const el = (tag, attrs, ...children) => {
  let e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === "class") {
      return e.className = v;
    } else if (k === "id") {
      return e.id = v;
    } else if (k === "disabled") {
      return e.disabled = v;
    } else if (k === "type") {
      return e.type = v;
    } else if (k.startsWith("on")) {
      return e.addEventListener(k.slice(2).toLowerCase(), v);
    } else {
      return e.setAttribute(k, String(v));
    }
});
  $flat(children).forEach((child) => {
    if (typeof child === "string") {
      return e.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      return e.appendChild(child);
    }
});
  return e;
};
const render_hero_row = (hero) => {
  let sym = class_symbol(hero.heroClass);
  let label = format_hero_card_line(hero);
  let power = hero_power(hero);
  let pStr = `PWR:${power}`;
  let rowClass = hero.alive ? "hero-row" : "hero-row hero-dead";
  return el("div", { class: rowClass }, el("span", { class: "hero-sym" }, sym), el("span", { class: "hero-label" }, label), el("span", { class: "hero-pwr" }, pStr));
};
const render_enemy_panel = (enemy) => {
  let label = format_enemy_card_line(enemy);
  let hint = class_weakness_hint(enemy.weakness);
  let atkStr = `ATK:${enemy.attack}  DEF:${enemy.defense}`;
  return el("div", { class: "enemy-panel" }, el("div", { class: "enemy-name" }, enemy.name), el("div", { class: "enemy-bar" }, label), el("div", { class: "enemy-hint" }, hint), el("div", { class: "enemy-stats" }, atkStr));
};
const render_party_panel = (party) => {
  let aliveCount = count_alive(party);
  let totalHp = total_party_hp(party);
  let powerRating = party_power_rating(party);
  let summaryStr = `Party: ${aliveCount} alive · ${totalHp} HP · PWR ${powerRating}`;
  let rows = $map(party, render_hero_row);
  let container = el("div", { class: "party-panel" });
  rows.forEach(row => container.appendChild(row));
  container.appendChild(el("div", { class: "party-summary" }, summaryStr));
  return container;
};
const render_combat = (rootId) => {
  let make_party = () => [create_hero("Aria", "mage", 60, 12, 5, 8), create_hero("Theron", "knight", 80, 8, 12, 6), create_hero("Lyra", "ranger", 70, 10, 7, 7)];
  let make_enemy = () => {
    return {
  name: "Shadow Drake",
  hp: 160,
  maxHp: 160,
  attack: 14,
  defense: 8,
  weakness: "arcane",
  alive: true
};
};
  let party = make_party();
  let enemy = make_enemy();
  let log_lines = [];
  let round_num = 0;
  let over = false;
  let root = document.getElementById(rootId);
  root.innerHTML = "";
  let partyEl = el("div", { class: "panel-party" });
  let enemyEl = el("div", { class: "panel-enemy" });
  let battleEl = el("div", { class: "battle-panels" });
  battleEl.appendChild(partyEl);
  battleEl.appendChild(enemyEl);
  let logEl = el("div", { class: "combat-log" });
  let attackBtn = el("button", { class: "btn-attack" }, "ATTACK");
  let resetBtn = el("button", { class: "btn-reset" }, "NEW BATTLE");
  let btnRow = el("div", { class: "btn-row" }, attackBtn, resetBtn);
  root.appendChild(battleEl);
  root.appendChild(logEl);
  root.appendChild(btnRow);
  let addLog = (msg) => {
    log_lines.push(msg);
    let entry = el("div", { class: "log-entry" }, msg);
    logEl.appendChild(entry);
    logEl.scrollTop = logEl.scrollHeight;
};
  let refresh = () => {
    partyEl.innerHTML = "";
    partyEl.appendChild(render_party_panel(party));
    enemyEl.innerHTML = "";
    enemyEl.appendChild(render_enemy_panel(enemy));
    return attackBtn.disabled = over;
};
  attackBtn.addEventListener("click", () => {
    let alive = alive_heroes(party);
    if (alive.length > 0 && enemy.alive && !over) {
      round_num = round_num + 1;
      addLog(`── Round ${round_num} ──`);
      let hi = Math.floor(Math.random() * alive.length);
      let hero = alive[hi];
      let roll = Math.floor(Math.random() * 20) + 1;
      let bonus = element_bonus(hero.heroClass, enemy.weakness);
      let dmg = compute_damage(hero.strength, enemy.defense, bonus, roll);
      let outcome = combat_outcome_label(roll);
      let eName = enemy.name;
      enemy = apply_damage(enemy, dmg);
      addLog(format_attack_msg(hero.name, outcome, eName, dmg));
      if (bonus > 0) {
        addLog(`  [elemental bonus: +${bonus} from ${hero.heroClass} vs ${enemy.weakness}]`);
      }
      if (!enemy.alive) {
        addLog(`** ${eName} has been slain! VICTORY! **`);
        over = true;
      }
      if (enemy.alive) {
        let ti = Math.floor(Math.random() * alive.length);
        let target = alive[ti];
        let eDmg = compute_damage(enemy.attack, target.defense, 0, 10);
        let dies = target.hp - eDmg <= 0;
        party = $map(party, h => h.name === target.name ? apply_damage(h, eDmg) : h);
        addLog(format_attack_msg(eName, "strikes back at", target.name, eDmg));
        if (dies) {
          addLog(format_death_msg(target.name));
        }
        if (alive_heroes(party).length === 0) {
          addLog("** Your party has been defeated. GAME OVER. **");
          over = true;
        }
      }
      return refresh();
    }
});
  resetBtn.addEventListener("click", () => {
    party = make_party();
    enemy = make_enemy();
    log_lines = [];
    round_num = 0;
    over = false;
    logEl.innerHTML = "";
    addLog("A new battle begins.");
    addLog(`Shadow Drake emerges from the darkness — ${enemy.weakness}.`);
    return refresh();
});
  addLog("SYNTH COMBAT ENGINE — pure rules, memoized formulas, type-safe stats");
  addLog(`Shadow Drake appears — ${enemy.weakness}.`);
  addLog("Aria (mage) has arcane bonus vs this enemy.");
  addLog("Press ATTACK to begin.");
  return refresh();
};
